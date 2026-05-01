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
  deleteFilesDir,
  getFilesPath,
  isPathSafe,
} from '../services/storage';
import { extractZip } from '../services/archive';
import { scanDirectory, computeFileSha256 } from '../services/scanner';
import { generate as generateManifest } from '../services/manifest-generator';
import type { Build, FileEntry } from '../../shared/types/entities';

// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Strapi = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type KoaContext = any;

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

const buildController = ({ strapi }: { strapi: Strapi }) => ({
  async find(ctx: KoaContext) {
    const builds: Build[] = await strapi.plugin('file-library').service('build').findMany();
    ctx.body = builds;
  },

  async findOne(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build: Build | null = await strapi.plugin('file-library').service('build').findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const fileEntries: FileEntry[] = await strapi.db
      .query('plugin::file-library.file-entry')
      .findMany({ where: { build: { id: build.id } }, orderBy: { relativePath: 'asc' } });

    ctx.body = { ...build, fileEntries };
  },

  async create(ctx: KoaContext) {
    const { name, slug, description, version } = ctx.request.body as {
      name?: string;
      slug?: string;
      description?: string;
      version?: string;
    };

    if (!name || !slug) return ctx.badRequest('name and slug are required');

    const existing: Build | null = await strapi
      .plugin('file-library')
      .service('build')
      .findOne(slug);
    if (existing) return ctx.badRequest('A build with this slug already exists');

    const build: Build = await strapi.plugin('file-library').service('build').create({
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
    const build: Build | null = await strapi.plugin('file-library').service('build').findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const { name, description, version } = ctx.request.body as {
      name?: string;
      description?: string;
      version?: string;
    };

    const updated: Build = await strapi
      .plugin('file-library')
      .service('build')
      .update(build.id, { name, description, version });

    ctx.body = updated;
  },

  async delete(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const build: Build | null = await strapi.plugin('file-library').service('build').findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    await strapi.plugin('file-library').service('build').deleteFileEntries(build.id);
    deleteBuildFiles(slug);
    await strapi.plugin('file-library').service('build').delete(build.id);

    ctx.body = { message: 'Build deleted successfully' };
  },

  async uploadArchive(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const buildService = strapi.plugin('file-library').service('build');

    let build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    if (build.status === 'processing') {
      return ctx.badRequest('Build is currently being processed. Please wait.');
    }

    const file = ctx.request.files?.archive;
    if (!file)
      return ctx.badRequest('No archive file provided. Send the ZIP as form field "archive".');

    const allowedTypes = [
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.zip')) {
      return ctx.badRequest('File must be a ZIP archive (.zip)');
    }

    await buildService.update(build.id, { status: 'processing', processingError: null });

    try {
      const filesPath = getFilesPath(slug);

      await buildService.deleteFileEntries(build.id);
      deleteFilesDir(slug);
      ensureBuildDir(slug);

      const pluginConfig = strapi.plugin('file-library').config;
      const maxZipSize: number = pluginConfig('maxZipSize') || 10 * 1024 * 1024 * 1024;
      const maxZipEntries: number = pluginConfig('maxZipEntries') || 100_000;

      extractZip(file.path, filesPath, { maxSize: maxZipSize, maxEntries: maxZipEntries });

      const scanResults = await scanDirectory(filesPath);
      await buildService.createFileEntries(build.id, scanResults);
      await generateManifest(slug, strapi);

      build = await buildService.findOne(slug);
      ctx.body = build;
    } catch (err) {
      strapi.log.error('[file-library] uploadArchive error:', err);
      await buildService.update(build.id, {
        status: 'failed',
        processingError: (err as Error).message,
      });
      return ctx.internalServerError((err as Error).message);
    }
  },

  async deleteFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const entry: (FileEntry & { build?: { slug: string } }) | null = await strapi.db
      .query('plugin::file-library.file-entry')
      .findOne({ where: { id: Number(entryId) }, populate: ['build'] });

    if (!entry || entry.build?.slug !== slug) {
      return ctx.notFound('File entry not found in this build');
    }

    const filesPath = getFilesPath(slug);
    const entryPath = path.join(filesPath, entry.relativePath);

    if (entry.isDir) {
      if (existsSync(entryPath)) {
        rmSync(entryPath, { recursive: true, force: true });
        removeEmptyDirsUpward(path.dirname(entryPath), filesPath);
      }
      const allEntries: Array<{ id: number; relativePath: string }> = await strapi.db
        .query('plugin::file-library.file-entry')
        .findMany({ where: { build: build.id }, select: ['id', 'relativePath'] });
      const prefix = entry.relativePath + '/';
      const childIds = allEntries.filter((e) => e.relativePath.startsWith(prefix)).map((e) => e.id);
      if (childIds.length > 0) {
        await strapi.db
          .query('plugin::file-library.file-entry')
          .deleteMany({ where: { id: { $in: childIds } } });
      }
    } else {
      if (existsSync(entryPath)) {
        unlinkSync(entryPath);
        removeEmptyDirsUpward(path.dirname(entryPath), filesPath);
      }
    }

    await strapi.db.query('plugin::file-library.file-entry').delete({ where: { id: entry.id } });
    await generateManifest(slug, strapi);

    ctx.body = { message: entry.isDir ? 'Folder deleted' : 'File deleted', slug };
  },

  async uploadFile(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const file = ctx.request.files?.file;
    if (!file) return ctx.badRequest('No file provided. Send the file as form field "file".');

    const rawTargetPath: string = ctx.request.body?.targetPath || file.name;

    const normalized = path.normalize(rawTargetPath).replace(/\\/g, '/');
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      return ctx.badRequest('Invalid targetPath — must be a relative path like "mods/mymod.jar"');
    }

    const filesPath = getFilesPath(slug);
    const destPath = path.join(filesPath, normalized);

    if (!isPathSafe(destPath, filesPath)) {
      return ctx.badRequest('targetPath escapes the build directory');
    }

    mkdirSync(path.dirname(destPath), { recursive: true });
    copyFileSync(file.path, destPath);

    const stat = statSync(destPath);
    const sha256 = await computeFileSha256(destPath);
    const fileModifiedAt = stat.mtime || stat.birthtime || null;

    const parts = normalized.split('/');
    const name = parts[parts.length - 1];
    const category = parts.length > 1 ? parts[0] : 'root';

    const existing: FileEntry[] = await strapi.db
      .query('plugin::file-library.file-entry')
      .findMany({ where: { build: build.id, relativePath: normalized } });

    if (existing.length > 0) {
      await strapi.db.query('plugin::file-library.file-entry').update({
        where: { id: existing[0].id },
        data: { size: stat.size, sha256, name, fileModifiedAt },
      });
    } else {
      await strapi.db.query('plugin::file-library.file-entry').create({
        data: {
          build: build.id,
          relativePath: normalized,
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

    await generateManifest(slug, strapi);
    ctx.body = await buildService.findOne(slug);
  },

  async updateFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const entry: (FileEntry & { build?: { slug: string } }) | null = await strapi.db
      .query('plugin::file-library.file-entry')
      .findOne({ where: { id: Number(entryId) }, populate: ['build'] });

    if (!entry || entry.build?.slug !== slug) {
      return ctx.notFound('File entry not found in this build');
    }

    const { downloadOnce } = ctx.request.body as { downloadOnce?: boolean };

    await strapi.db.query('plugin::file-library.file-entry').update({
      where: { id: entry.id },
      data: { downloadOnce: Boolean(downloadOnce) },
    });

    await generateManifest(slug, strapi);
    ctx.body = await buildService.findOne(slug);
  },

  async renameFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const entry: (FileEntry & { build?: { slug: string } }) | null = await strapi.db
      .query('plugin::file-library.file-entry')
      .findOne({ where: { id: Number(entryId) }, populate: ['build'] });

    if (!entry || entry.build?.slug !== slug) {
      return ctx.notFound('Entry not found in this build');
    }

    const rawNewPath: string | undefined = ctx.request.body?.newRelativePath;
    if (!rawNewPath?.trim()) return ctx.badRequest('newRelativePath is required');

    const normalized = path.normalize(rawNewPath.trim()).replace(/\\/g, '/');
    if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
      return ctx.badRequest('Invalid newRelativePath — must be a relative path');
    }

    const filesPath = getFilesPath(slug);
    const oldPhysical = path.join(filesPath, entry.relativePath);
    const newPhysical = path.join(filesPath, normalized);

    if (!isPathSafe(newPhysical, filesPath)) {
      return ctx.badRequest('newRelativePath escapes the build directory');
    }

    if (existsSync(newPhysical) && normalized !== entry.relativePath) {
      return ctx.badRequest('A file or folder already exists at that path');
    }

    if (existsSync(oldPhysical)) {
      mkdirSync(path.dirname(newPhysical), { recursive: true });
      renameSync(oldPhysical, newPhysical);
      if (!entry.isDir) {
        removeEmptyDirsUpward(path.dirname(oldPhysical), filesPath);
      }
    }

    const parts = normalized.split('/');
    const name = parts[parts.length - 1];
    const category = parts.length > 1 ? parts[0] : 'root';

    await strapi.db.query('plugin::file-library.file-entry').update({
      where: { id: entry.id },
      data: { relativePath: normalized, name, category },
    });

    if (entry.isDir) {
      const oldPrefix = entry.relativePath + '/';
      const allEntries: Array<{ id: number; relativePath: string }> = await strapi.db
        .query('plugin::file-library.file-entry')
        .findMany({ where: { build: build.id }, select: ['id', 'relativePath'] });
      for (const child of allEntries) {
        if (!child.relativePath.startsWith(oldPrefix)) continue;
        const childNewPath = normalized + '/' + child.relativePath.slice(oldPrefix.length);
        const childParts = childNewPath.split('/');
        await strapi.db.query('plugin::file-library.file-entry').update({
          where: { id: child.id },
          data: {
            relativePath: childNewPath,
            category: childParts.length > 1 ? childParts[0] : 'root',
          },
        });
      }
    }

    await generateManifest(slug, strapi);
    ctx.body = await buildService.findOne(slug);
  },

  async rehashFile(ctx: KoaContext) {
    const { slug, entryId } = ctx.params as { slug: string; entryId: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const entry: (FileEntry & { build?: { slug: string } }) | null = await strapi.db
      .query('plugin::file-library.file-entry')
      .findOne({ where: { id: Number(entryId) }, populate: ['build'] });

    if (!entry || entry.build?.slug !== slug || entry.isDir) {
      return ctx.notFound('File entry not found in this build');
    }

    const filePath = path.join(getFilesPath(slug), entry.relativePath);
    if (!existsSync(filePath)) return ctx.badRequest('Physical file not found on disk');

    const sha256 = await computeFileSha256(filePath);
    await strapi.db.query('plugin::file-library.file-entry').update({
      where: { id: entry.id },
      data: { sha256 },
    });

    await generateManifest(slug, strapi);
    ctx.body = await buildService.findOne(slug);
  },

  async bulkDeleteFiles(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const { ids } = ctx.request.body as { ids?: unknown };
    if (!Array.isArray(ids) || ids.length === 0) {
      return ctx.badRequest('ids must be a non-empty array');
    }

    const entries: Array<FileEntry & { build?: { slug: string } }> = await strapi.db
      .query('plugin::file-library.file-entry')
      .findMany({ where: { id: { $in: (ids as number[]).map(Number) } }, populate: ['build'] });

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
        .query('plugin::file-library.file-entry')
        .deleteMany({ where: { id: { $in: valid.map((e) => e.id) } } });
    }

    await generateManifest(slug, strapi);
    ctx.body = { deleted: valid.length };
  },

  async validate(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    const filesPath = getFilesPath(slug);

    const entries: Array<{ id: number; relativePath: string; name: string; isDir: boolean }> =
      await strapi.db.query('plugin::file-library.file-entry').findMany({
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

  async regenerateManifest(ctx: KoaContext) {
    const { slug } = ctx.params as { slug: string };
    const buildService = strapi.plugin('file-library').service('build');

    const build: Build | null = await buildService.findOne(slug);
    if (!build) return ctx.notFound('Build not found');

    try {
      await generateManifest(slug, strapi);
      ctx.body = await buildService.findOne(slug);
    } catch (err) {
      strapi.log.error('[file-library] regenerateManifest error:', err);
      await buildService.update(build.id, {
        status: 'failed',
        processingError: (err as Error).message,
      });
      return ctx.internalServerError((err as Error).message);
    }
  },
});

export default buildController;
