import path from 'path';
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  statSync,
  unlinkSync,
  renameSync,
  readdirSync,
  rmdirSync,
  rmSync,
} from 'fs';
import {
  ensureBuildDir,
  deleteBuildFiles,
  getFilesPath,
  isPathSafe,
} from '../services/storage';
import { extractZip } from '../services/archive';
import { scanDirectory, computeFileSha256 } from '../services/scanner';
import { generate as generateManifest } from '../services/manifest-generator';
import { ARTIFACT_UID } from '../../shared/constants';
import type { Build, Artifact } from '../../shared/types/entities';
import type { StrapiInstance as Strapi, KoaContext, FormidableFile } from '../types';

const STALE_PROCESSING_THRESHOLD_MS = 10 * 60 * 1000;
const DEFAULT_MAX_ZIP_SIZE = 10 * 1024 * 1024 * 1024;
const DEFAULT_MAX_ZIP_ENTRIES = 100_000;

type EntryWithBuild = Artifact & { build?: { slug: string } };

interface StatFsResult {
  bfree: number;
  bsize: number;
  blocks: number;
}

interface FsWithStatfs {
  statfsSync?: (path: string) => StatFsResult;
}

const getSystemDiskSpace = (): { free: number; total: number } | null => {
  try {
    // statfsSync is available since Node.js 19.6.0; returns null on older runtimes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nativeFs = require('fs') as FsWithStatfs;
    if (typeof nativeFs.statfsSync !== 'function') return null;
    const stats = nativeFs.statfsSync(process.cwd());
    return { free: stats.bfree * stats.bsize, total: stats.blocks * stats.bsize };
  } catch {
    return null;
  }
};

const pickFile = (raw: FormidableFile | FormidableFile[] | undefined): FormidableFile | undefined =>
  Array.isArray(raw) ? raw[0] : raw;

const removeEmptyDirsUpward = (dirPath: string, rootPath: string): void => {
  if (dirPath === rootPath || !dirPath.startsWith(rootPath)) return;
  try {
    if (existsSync(dirPath) && readdirSync(dirPath).length === 0) {
      rmdirSync(dirPath);
      removeEmptyDirsUpward(path.dirname(dirPath), rootPath);
    }
  } catch {
    // already removed or permission error — skip silently
  }
};

const buildSvc = (strapi: Strapi) => strapi.plugin('bundle-registry').service('build');

const findBuildOrNotFound = async (strapi: Strapi, slug: string, ctx: KoaContext): Promise<Build | null> => {
  const build: Build | null = await buildSvc(strapi).findOne(slug);
  if (!build) {
    ctx.notFound('Build not found');
    return null;
  }
  return build;
};

const findArtifactInBuild = async (
  strapi: Strapi,
  slug: string,
  entryId: number | string,
  ctx: KoaContext,
  notFoundMessage = 'File entry not found in this build',
): Promise<EntryWithBuild | null> => {
  const entry = (await strapi.db
    .query(ARTIFACT_UID)
    .findOne({ where: { id: Number(entryId) }, populate: ['build'] })) as EntryWithBuild | null;

  if (!entry || entry.build?.slug !== slug) {
    ctx.notFound(notFoundMessage);
    return null;
  }
  return entry;
};

// Normalises a user-supplied relative path and rejects anything that escapes
// the build directory or is absolute. Returns the normalised path on success
// or null after responding with badRequest.
const normaliseRelativePath = (
  rawPath: string,
  filesPath: string,
  ctx: KoaContext,
  pathField = 'targetPath',
): string | null => {
  const normalised = path.normalize(rawPath).replace(/\\/g, '/');
  if (normalised.startsWith('..') || path.isAbsolute(normalised)) {
    ctx.badRequest(`Invalid ${pathField} — must be a relative path`);
    return null;
  }
  if (!isPathSafe(path.join(filesPath, normalised), filesPath)) {
    ctx.badRequest(`${pathField} escapes the build directory`);
    return null;
  }
  return normalised;
};

const splitRelativePath = (relativePath: string): { name: string; category: string } => {
  const parts = relativePath.split('/');
  return {
    name: parts[parts.length - 1],
    category: parts.length > 1 ? parts[0] : 'root',
  };
};

// Most mutation endpoints regenerate the manifest and return the freshly
// loaded build payload. Centralised here so the pattern is uniform.
const regenerateAndReturnBuild = async (
  strapi: Strapi,
  slug: string,
  ctx: KoaContext,
): Promise<void> => {
  await generateManifest(slug, strapi);
  ctx.body = await buildSvc(strapi).findOne(slug);
};

const isStaleProcessingState = (build: Build): boolean => {
  const updatedAt = (build as unknown as Record<string, unknown>).updatedAt as string | undefined;
  const stalledMs = updatedAt ? Date.now() - new Date(updatedAt).getTime() : Infinity;
  return stalledMs >= STALE_PROCESSING_THRESHOLD_MS;
};

const buildController = ({ strapi }: { strapi: Strapi }) => ({
  async find(ctx: KoaContext) {
    ctx.body = await buildSvc(strapi).findMany();
  },

  async findOne(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const artifacts: Artifact[] = await strapi.db
      .query(ARTIFACT_UID)
      .findMany({ where: { build: { id: build.id } }, orderBy: { relativePath: 'asc' } });

    ctx.body = { ...build, artifacts };
  },

  async create(ctx: KoaContext) {
    const { name, slug, description, version } = ctx.request.body as {
      name?: string;
      slug?: string;
      description?: string;
      version?: string;
    };

    if (!name || !slug) return ctx.badRequest('name and slug are required');

    const existing: Build | null = await buildSvc(strapi).findOne(slug);
    if (existing) return ctx.badRequest('A build with this slug already exists');

    const build: Build = await buildSvc(strapi).create({
      name,
      slug,
      description,
      version,
      status: 'draft',
    });

    ensureBuildDir(slug);
    ctx.status = 201;
    ctx.body = build;
  },

  async update(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const { name, description, version } = ctx.request.body as {
      name?: string;
      description?: string;
      version?: string;
    };

    ctx.body = await buildSvc(strapi).update(build.id, { name, description, version });
  },

  async delete(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    await buildSvc(strapi).deleteFileEntries(build.id);
    deleteBuildFiles(slug);
    await buildSvc(strapi).delete(build.id);

    ctx.body = { message: 'Build deleted successfully' };
  },

  async uploadArchive(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    if (build.status === 'processing' && !isStaleProcessingState(build)) {
      return ctx.badRequest('Build is currently being processed. Please wait.');
    }

    const file = pickFile(ctx.request.files?.archive);
    if (!file)
      return ctx.badRequest('No archive file provided. Send the ZIP as form field "archive".');

    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
    ];
    if (!allowedTypes.includes(file.mimetype ?? '') && !file.originalFilename?.endsWith('.zip')) {
      return ctx.badRequest('File must be a ZIP archive (.zip)');
    }

    await buildSvc(strapi).update(build.id, { status: 'processing', processingError: null });

    try {
      const filesPath = getFilesPath(slug);
      ensureBuildDir(slug);

      const pluginConfig = strapi.plugin('bundle-registry').config;
      const maxZipSize: number = pluginConfig('maxZipSize') || DEFAULT_MAX_ZIP_SIZE;
      const maxZipEntries: number = pluginConfig('maxZipEntries') || DEFAULT_MAX_ZIP_ENTRIES;

      extractZip(file.filepath, filesPath, { maxSize: maxZipSize, maxEntries: maxZipEntries });

      const scanResults = await scanDirectory(filesPath);
      await buildSvc(strapi).upsertFileEntries(build.id, scanResults);
      await generateManifest(slug, strapi);

      ctx.body = await buildSvc(strapi).findOne(slug);
    } catch (err) {
      strapi.log.error('[bundle-registry] uploadArchive error:', err);
      await buildSvc(strapi).update(build.id, {
        status: 'failed',
        processingError: (err as Error).message,
      });
      return ctx.internalServerError((err as Error).message);
    }
  },

  async deleteFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const entry = await findArtifactInBuild(strapi, slug, entryId, ctx);
    if (!entry) return;

    const filesPath = getFilesPath(slug);
    const entryPath = path.join(filesPath, entry.relativePath);

    if (entry.isDir) {
      if (existsSync(entryPath)) {
        rmSync(entryPath, { recursive: true, force: true });
        removeEmptyDirsUpward(path.dirname(entryPath), filesPath);
      }
      const allEntries: Array<{ id: number; relativePath: string }> = await strapi.db
        .query(ARTIFACT_UID)
        .findMany({ where: { build: build.id }, select: ['id', 'relativePath'] });
      const prefix = entry.relativePath + '/';
      const childIds = allEntries.filter((e) => e.relativePath.startsWith(prefix)).map((e) => e.id);
      if (childIds.length > 0) {
        await strapi.db.query(ARTIFACT_UID).deleteMany({ where: { id: { $in: childIds } } });
      }
    } else if (existsSync(entryPath)) {
      unlinkSync(entryPath);
      removeEmptyDirsUpward(path.dirname(entryPath), filesPath);
    }

    await strapi.db.query(ARTIFACT_UID).delete({ where: { id: entry.id } });
    await generateManifest(slug, strapi);

    ctx.body = { message: entry.isDir ? 'Folder deleted' : 'File deleted', slug };
  },

  async uploadFile(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const file = pickFile(ctx.request.files?.file);
    if (!file) return ctx.badRequest('No file provided. Send the file as form field "file".');

    const rawTargetPath: string =
      (ctx.request.body as { targetPath?: string })?.targetPath || file.originalFilename || '';

    const filesPath = getFilesPath(slug);
    const normalised = normaliseRelativePath(rawTargetPath, filesPath, ctx, 'targetPath');
    if (!normalised) return;

    const destPath = path.join(filesPath, normalised);

    mkdirSync(path.dirname(destPath), { recursive: true });
    copyFileSync(file.filepath, destPath);

    const stat = statSync(destPath);
    const sha256 = await computeFileSha256(destPath);
    const fileModifiedAt = stat.mtime || stat.birthtime || null;
    const { name, category } = splitRelativePath(normalised);

    const existing: Artifact[] = await strapi.db
      .query(ARTIFACT_UID)
      .findMany({ where: { build: build.id, relativePath: normalised } });

    if (existing.length > 0) {
      await strapi.db.query(ARTIFACT_UID).update({
        where: { id: existing[0].id },
        data: { size: stat.size, sha256, name, fileModifiedAt },
      });
    } else {
      await strapi.db.query(ARTIFACT_UID).create({
        data: {
          build: build.id,
          relativePath: normalised,
          name,
          category,
          size: stat.size,
          sha256,
          isDir: false,
          downloadOnce: false,
          fileModifiedAt,
        },
      });
    }

    await regenerateAndReturnBuild(strapi, slug, ctx);
  },

  async updateFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const entry = await findArtifactInBuild(strapi, slug, entryId, ctx);
    if (!entry) return;

    const { downloadOnce } = ctx.request.body as { downloadOnce?: boolean };

    await strapi.db.query(ARTIFACT_UID).update({
      where: { id: entry.id },
      data: { downloadOnce: Boolean(downloadOnce) },
    });

    await regenerateAndReturnBuild(strapi, slug, ctx);
  },

  async renameFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const entry = await findArtifactInBuild(strapi, slug, entryId, ctx, 'Entry not found in this build');
    if (!entry) return;

    const rawNewPath: string | undefined = (
      ctx.request.body as { newRelativePath?: string }
    )?.newRelativePath;
    if (!rawNewPath?.trim()) return ctx.badRequest('newRelativePath is required');

    const filesPath = getFilesPath(slug);
    const normalised = normaliseRelativePath(rawNewPath.trim(), filesPath, ctx, 'newRelativePath');
    if (!normalised) return;

    const oldPhysical = path.join(filesPath, entry.relativePath);
    const newPhysical = path.join(filesPath, normalised);

    if (existsSync(newPhysical) && normalised !== entry.relativePath) {
      return ctx.badRequest('A file or folder already exists at that path');
    }

    if (existsSync(oldPhysical)) {
      mkdirSync(path.dirname(newPhysical), { recursive: true });
      renameSync(oldPhysical, newPhysical);
      if (!entry.isDir) {
        removeEmptyDirsUpward(path.dirname(oldPhysical), filesPath);
      }
    }

    const { name, category } = splitRelativePath(normalised);

    await strapi.db.query(ARTIFACT_UID).update({
      where: { id: entry.id },
      data: { relativePath: normalised, name, category },
    });

    if (entry.isDir) {
      const oldPrefix = entry.relativePath + '/';
      const allEntries: Array<{ id: number; relativePath: string }> = await strapi.db
        .query(ARTIFACT_UID)
        .findMany({ where: { build: build.id }, select: ['id', 'relativePath'] });
      for (const child of allEntries) {
        if (!child.relativePath.startsWith(oldPrefix)) continue;
        const childNewPath = normalised + '/' + child.relativePath.slice(oldPrefix.length);
        const childParts = childNewPath.split('/');
        await strapi.db.query(ARTIFACT_UID).update({
          where: { id: child.id },
          data: {
            relativePath: childNewPath,
            category: childParts.length > 1 ? childParts[0] : 'root',
          },
        });
      }
    }

    await regenerateAndReturnBuild(strapi, slug, ctx);
  },

  async rehashFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const entry = await findArtifactInBuild(strapi, slug, entryId, ctx);
    if (!entry || entry.isDir) {
      if (entry) ctx.notFound('File entry not found in this build');
      return;
    }

    const filePath = path.join(getFilesPath(slug), entry.relativePath);
    if (!existsSync(filePath)) return ctx.badRequest('Physical file not found on disk');

    const sha256 = await computeFileSha256(filePath);
    await strapi.db.query(ARTIFACT_UID).update({
      where: { id: entry.id },
      data: { sha256 },
    });

    await regenerateAndReturnBuild(strapi, slug, ctx);
  },

  async bulkDeleteFiles(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const { ids } = ctx.request.body as { ids?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return ctx.badRequest('ids must be a non-empty array');
    }

    const entries = (await strapi.db
      .query(ARTIFACT_UID)
      .findMany({
        where: { id: { $in: (ids as number[]).map(Number) } },
        populate: ['build'],
      })) as EntryWithBuild[];

    const valid = entries.filter((e) => e.build?.slug === slug && !e.isDir);
    const filesPath = getFilesPath(slug);

    for (const entry of valid) {
      const filePath = path.join(filesPath, entry.relativePath);
      if (existsSync(filePath)) {
        unlinkSync(filePath);
        removeEmptyDirsUpward(path.dirname(filePath), filesPath);
      }
    }

    if (valid.length > 0) {
      await strapi.db
        .query(ARTIFACT_UID)
        .deleteMany({ where: { id: { $in: valid.map((e) => e.id) } } });
    }

    await generateManifest(slug, strapi);
    ctx.body = { deleted: valid.length };
  },

  async validate(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    const filesPath = getFilesPath(slug);

    const entries: Array<{ id: number; relativePath: string; name: string; isDir: boolean }> =
      await strapi.db.query(ARTIFACT_UID).findMany({
        where: { build: build.id },
        select: ['id', 'relativePath', 'name', 'isDir'],
      });

    const missing: Array<{ id: number; relativePath: string; name: string }> = [];
    const trackedPaths = new Set<string>();

    for (const entry of entries) {
      if (entry.isDir) continue;
      trackedPaths.add(entry.relativePath);
      if (!existsSync(path.join(filesPath, entry.relativePath))) {
        missing.push({ id: entry.id, relativePath: entry.relativePath, name: entry.name });
      }
    }

    const orphaned: Array<{ relativePath: string }> = [];

    const walkOrphans = (dir: string): void => {
      let dirEntries;
      try {
        dirEntries = readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const e of dirEntries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
          walkOrphans(full);
        } else {
          const rel = path.relative(filesPath, full).replace(/\\/g, '/');
          if (!trackedPaths.has(rel)) orphaned.push({ relativePath: rel });
        }
      }
    };

    if (existsSync(filesPath)) walkOrphans(filesPath);

    ctx.body = { missing, orphaned };
  },

  async diskSpace(ctx: KoaContext) {
    ctx.body = getSystemDiskSpace() ?? { free: null, total: null };
  },

  async regenerateManifest(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build = await findBuildOrNotFound(strapi, slug, ctx);
    if (!build) return;

    try {
      await regenerateAndReturnBuild(strapi, slug, ctx);
    } catch (err) {
      strapi.log.error('[bundle-registry] regenerateManifest error:', err);
      await buildSvc(strapi).update(build.id, {
        status: 'failed',
        processingError: (err as Error).message,
      });
      return ctx.internalServerError((err as Error).message);
    }
  },
});

export default buildController;
