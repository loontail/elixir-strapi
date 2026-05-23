jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
  renameSync: jest.fn(),
  readdirSync: jest.fn(),
  rmdirSync: jest.fn(),
  rmSync: jest.fn(),
}));

jest.mock('../../services/storage', () => ({
  ensureBuildDir: jest.fn(),
  deleteBuildFiles: jest.fn(),
  getFilesPath: jest.fn((slug: string) => `/builds/${slug}/files`),
  isPathSafe: jest.fn().mockReturnValue(true),
}));

jest.mock('../../services/archive', () => ({
  extractZip: jest.fn(),
}));

jest.mock('../../services/scanner', () => ({
  scanDirectory: jest.fn().mockResolvedValue([]),
  computeFileSha256: jest.fn().mockResolvedValue('deadbeef123'),
}));

jest.mock('../../services/manifest-generator', () => ({
  generate: jest.fn().mockResolvedValue({}),
}));

import { existsSync, statSync, unlinkSync, readdirSync, rmSync, renameSync, rmdirSync } from 'fs';
import buildController from '../../controllers/build';
import { extractZip } from '../../services/archive';
import { generate as generateManifest } from '../../services/manifest-generator';
import { isPathSafe, getFilesPath } from '../../services/storage';

const mockExtractZip = extractZip as jest.Mock;
const mockGenerateManifest = generateManifest as jest.Mock;

const SLUG = 'test-build';

const makeBuildService = () => ({
  findMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteFileEntries: jest.fn().mockResolvedValue(undefined),
  upsertFileEntries: jest.fn().mockResolvedValue(undefined),
});

const makeDbQuery = () => ({
  findMany: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
});

const makeStrapi = () => {
  const buildService = makeBuildService();
  const dbQuery = makeDbQuery();

  const strapi = {
    plugin: jest.fn().mockReturnValue({
      service: jest.fn().mockReturnValue(buildService),
      config: jest.fn().mockReturnValue(null),
    }),
    db: { query: jest.fn().mockReturnValue(dbQuery) },
    log: { error: jest.fn() },
  };

  return { strapi, buildService, dbQuery };
};

const makeCtx = (overrides: Record<string, unknown> = {}) => ({
  params: { slug: SLUG },
  request: { body: {}, files: {} },
  body: null as unknown,
  status: 200,
  notFound: jest.fn(),
  badRequest: jest.fn(),
  internalServerError: jest.fn(),
  set: jest.fn(),
  ...overrides,
});

const makeBuild = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  name: 'Test Build',
  slug: SLUG,
  status: 'draft',
  filesCount: 0,
  totalSize: 0,
  ...overrides,
});

const makeArtifact = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  relativePath: 'mods/file.jar',
  name: 'file.jar',
  category: 'mods',
  size: 1024,
  sha256: 'abc',
  isDir: false,
  downloadOnce: false,
  build: { slug: SLUG },
  ...overrides,
});

beforeEach(() => jest.clearAllMocks());

// â”€â”€ find â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('find', () => {
  test('returns all builds', async () => {
    const { strapi, buildService } = makeStrapi();
    const builds = [makeBuild()];
    buildService.findMany.mockResolvedValue(builds);

    const ctx = makeCtx();
    await buildController({ strapi } as never).find(ctx as never);

    expect(ctx.body).toEqual(builds);
  });
});

// â”€â”€ findOne â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('findOne', () => {
  test('returns build with artifacts when found', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([makeArtifact()]);

    const ctx = makeCtx();
    await buildController({ strapi } as never).findOne(ctx as never);

    expect((ctx.body as Record<string, unknown>).artifacts).toHaveLength(1);
  });

  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).findOne(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});

// â”€â”€ create â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('create', () => {
  test('creates build and returns 201', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);
    const created = makeBuild();
    buildService.create.mockResolvedValue(created);

    const ctx = makeCtx({ request: { body: { name: 'Test', slug: 'test' }, files: {} } });
    await buildController({ strapi } as never).create(ctx as never);

    expect(ctx.status).toBe(201);
    expect(ctx.body).toEqual(created);
  });

  test('returns 400 when name or slug is missing', async () => {
    const { strapi } = makeStrapi();
    const ctx = makeCtx({ request: { body: { name: '' }, files: {} } });
    await buildController({ strapi } as never).create(ctx as never);
    expect(ctx.badRequest).toHaveBeenCalled();
  });

  test('returns 400 when slug already exists', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({ request: { body: { name: 'Test', slug: SLUG }, files: {} } });
    await buildController({ strapi } as never).create(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('already exists'));
  });
});

// â”€â”€ update â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('update', () => {
  test('updates build and returns it', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    const updated = makeBuild({ name: 'New Name' });
    buildService.update.mockResolvedValue(updated);

    const ctx = makeCtx({ request: { body: { name: 'New Name' }, files: {} } });
    await buildController({ strapi } as never).update(ctx as never);

    expect(ctx.body).toEqual(updated);
  });

  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).update(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});

// â”€â”€ delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('delete', () => {
  test('deletes entries, files and build record', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx();
    await buildController({ strapi } as never).delete(ctx as never);

    expect(buildService.deleteFileEntries).toHaveBeenCalledWith(1);
    expect(buildService.delete).toHaveBeenCalledWith(1);
    expect((ctx.body as Record<string, unknown>).message).toContain('deleted');
  });

  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).delete(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});

// â”€â”€ uploadArchive â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('uploadArchive', () => {
  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 400 when build is recently processing', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(
      makeBuild({ status: 'processing', updatedAt: new Date().toISOString() }),
    );

    const ctx = makeCtx();
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalled();
  });

  test('allows re-upload when processing state is stale (> 10 min)', async () => {
    const { strapi, buildService } = makeStrapi();
    const staleDate = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    buildService.findOne.mockResolvedValue(
      makeBuild({ status: 'processing', updatedAt: staleDate }),
    );
    buildService.update.mockResolvedValue({});

    const ctx = makeCtx({
      request: {
        body: {},
        files: { archive: { mimetype: 'application/zip', originalFilename: 'build.zip', filepath: '/tmp/build.zip' } },
      },
    });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(ctx.badRequest).not.toHaveBeenCalledWith(expect.stringContaining('being processed'));
  });

  test('returns 400 when no file is provided', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({ request: { body: {}, files: {} } });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('No archive'));
  });

  test('returns 400 for non-zip file type', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({
      request: {
        body: {},
        files: { archive: { mimetype: 'image/png', originalFilename: 'photo.png', filepath: '/tmp/photo.png' } },
      },
    });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('ZIP'));
  });

  test('processes ZIP successfully and returns updated build', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    buildService.update.mockResolvedValue(makeBuild({ status: 'processing' }));
    buildService.findOne.mockResolvedValueOnce(makeBuild()).mockResolvedValue(makeBuild({ status: 'ready' }));

    const ctx = makeCtx({
      request: {
        body: {},
        files: { archive: { mimetype: 'application/zip', originalFilename: 'build.zip', filepath: '/tmp/build.zip' } },
      },
    });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(mockExtractZip).toHaveBeenCalled();
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('sets status to failed on extraction error', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    buildService.update.mockResolvedValue({});
    mockExtractZip.mockImplementationOnce(() => {
      throw new Error('corrupted zip');
    });

    const ctx = makeCtx({
      request: {
        body: {},
        files: { archive: { mimetype: 'application/zip', originalFilename: 'bad.zip', filepath: '/tmp/bad.zip' } },
      },
    });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(buildService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'failed', processingError: 'corrupted zip' }),
    );
    expect(ctx.internalServerError).toHaveBeenCalled();
  });
});

// â”€â”€ uploadFile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('uploadFile', () => {
  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx({ request: { body: {}, files: {} } });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 400 when no file provided', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({ request: { body: {}, files: {} } });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('No file'));
  });

  test('returns 400 for path traversal in targetPath', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({
      request: {
        body: { targetPath: '../../../etc/passwd' },
        files: { file: { originalFilename: 'evil', filepath: '/tmp/evil' } },
      },
    });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('Invalid'));
  });

  test('creates new file entry when path does not exist', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([]);
    dbQuery.create.mockResolvedValue({});
    (statSync as jest.Mock).mockReturnValue({ size: 500, mtime: new Date() });

    const ctx = makeCtx({
      request: {
        body: { targetPath: 'mods/new.jar' },
        files: { file: { originalFilename: 'new.jar', filepath: '/tmp/new.jar' } },
      },
    });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(dbQuery.create).toHaveBeenCalled();
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('updates existing file entry when path already tracked', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([makeArtifact({ relativePath: 'mods/file.jar' })]);
    dbQuery.update.mockResolvedValue({});
    (statSync as jest.Mock).mockReturnValue({ size: 600, mtime: new Date() });

    const ctx = makeCtx({
      request: {
        body: { targetPath: 'mods/file.jar' },
        files: { file: { originalFilename: 'file.jar', filepath: '/tmp/file.jar' } },
      },
    });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(dbQuery.update).toHaveBeenCalled();
    expect(dbQuery.create).not.toHaveBeenCalled();
  });
});

// â”€â”€ deleteFile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('deleteFile', () => {
  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 404 when entry not found', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(null);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '99' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 404 when entry belongs to a different build', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact({ build: { slug: 'other-build' } }));

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('deletes a regular file from disk and DB', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    dbQuery.delete.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue([]);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(unlinkSync).toHaveBeenCalled();
    expect(dbQuery.delete).toHaveBeenCalled();
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('deletes a directory recursively and its DB children', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(
      makeArtifact({ isDir: true, relativePath: 'mods', name: 'mods' }),
    );
    dbQuery.findMany.mockResolvedValue([
      { id: 11, relativePath: 'mods/child.jar' },
      { id: 12, relativePath: 'other/file.jar' },
    ]);
    dbQuery.deleteMany.mockResolvedValue({});
    dbQuery.delete.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValue([]);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(rmSync).toHaveBeenCalled();
    expect(dbQuery.deleteMany).toHaveBeenCalled();
  });
});

// â”€â”€ updateFile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('updateFile', () => {
  test('updates downloadOnce flag', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    dbQuery.update.mockResolvedValue({});

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { downloadOnce: true }, files: {} },
    });
    await buildController({ strapi } as never).updateFile(ctx as never);

    expect(dbQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { downloadOnce: true } }),
    );
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('returns 404 when entry not found', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(null);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '99' },
      request: { body: { downloadOnce: false }, files: {} },
    });
    await buildController({ strapi } as never).updateFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});

// â”€â”€ renameFile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('renameFile', () => {
  test('returns 400 when newRelativePath is missing', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: {}, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('required'));
  });

  test('returns 400 for path traversal', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: '../../../etc/evil' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('Invalid'));
  });

  test('renames a file on disk and in DB', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact({ relativePath: 'mods/old.jar' }));
    dbQuery.update.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: 'mods/new.jar' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(dbQuery.update).toHaveBeenCalled();
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('returns 400 when destination path already exists', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact({ relativePath: 'mods/old.jar' }));
    (existsSync as jest.Mock).mockReturnValue(true);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: 'mods/taken.jar' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('already exists'));
  });
});

// â”€â”€ rehashFile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('rehashFile', () => {
  test('recomputes sha256 and updates DB', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    dbQuery.update.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(true);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).rehashFile(ctx as never);

    expect(dbQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { sha256: 'deadbeef123' } }),
    );
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('returns 404 for directory entries', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact({ isDir: true }));

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).rehashFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 400 when physical file not on disk', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).rehashFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('not found on disk'));
  });
});

// â”€â”€ bulkDeleteFiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('bulkDeleteFiles', () => {
  test('returns 400 for empty ids array', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx({ request: { body: { ids: [] }, files: {} } });
    await buildController({ strapi } as never).bulkDeleteFiles(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalled();
  });

  test('deletes valid files and returns count', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([makeArtifact(), makeArtifact({ id: 11 })]);
    dbQuery.deleteMany.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValue([]);

    const ctx = makeCtx({ request: { body: { ids: [10, 11] }, files: {} } });
    await buildController({ strapi } as never).bulkDeleteFiles(ctx as never);

    expect((ctx.body as Record<string, unknown>).deleted).toBe(2);
    expect(mockGenerateManifest).toHaveBeenCalled();
  });

  test('skips entries from a different build', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([
      makeArtifact({ build: { slug: 'other-build' } }),
    ]);
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx({ request: { body: { ids: [10] }, files: {} } });
    await buildController({ strapi } as never).bulkDeleteFiles(ctx as never);

    expect((ctx.body as Record<string, unknown>).deleted).toBe(0);
  });
});

// â”€â”€ validate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('validate', () => {
  test('returns missing and orphaned lists', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([
      { id: 10, relativePath: 'mods/missing.jar', name: 'missing.jar', isDir: false },
    ]);
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    const body = ctx.body as Record<string, unknown[]>;
    expect(body.missing).toHaveLength(1);
    expect(body.orphaned).toHaveLength(0);
  });

  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('skips directory entries when checking for missing files', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([
      { id: 10, relativePath: 'mods', name: 'mods', isDir: true },
    ]);
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect((ctx.body as Record<string, unknown[]>).missing).toHaveLength(0);
  });
});

// â”€â”€ diskSpace â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('diskSpace', () => {
  test('returns free and total or nulls', async () => {
    const { strapi } = makeStrapi();
    const ctx = makeCtx();
    await buildController({ strapi } as never).diskSpace(ctx as never);

    const body = ctx.body as Record<string, unknown>;
    expect(body).toHaveProperty('free');
    expect(body).toHaveProperty('total');
  });
});

// â”€â”€ regenerateManifest â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('regenerateManifest', () => {
  test('regenerates manifest and returns build', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());

    const ctx = makeCtx();
    await buildController({ strapi } as never).regenerateManifest(ctx as never);

    expect(mockGenerateManifest).toHaveBeenCalledWith(SLUG, strapi);
  });

  test('returns 404 when build not found', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(null);

    const ctx = makeCtx();
    await buildController({ strapi } as never).regenerateManifest(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('sets status to failed on manifest error', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    buildService.update.mockResolvedValue({});
    mockGenerateManifest.mockRejectedValueOnce(new Error('disk full'));

    const ctx = makeCtx();
    await buildController({ strapi } as never).regenerateManifest(ctx as never);

    expect(buildService.update).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ status: 'failed', processingError: 'disk full' }),
    );
    expect(ctx.internalServerError).toHaveBeenCalled();
  });
});

// â”€â”€ pickFile array branch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('uploadArchive (array file input)', () => {
  test('uses first element when archive field is an array', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    buildService.update.mockResolvedValue({});

    const ctx = makeCtx({
      request: {
        body: {},
        files: {
          archive: [
            { mimetype: 'application/zip', originalFilename: 'build.zip', filepath: '/tmp/build.zip' },
          ],
        },
      },
    });
    await buildController({ strapi } as never).uploadArchive(ctx as never);

    expect(mockExtractZip).toHaveBeenCalled();
  });
});

// â”€â”€ removeEmptyDirsUpward (rmdirSync branch) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('deleteFile (empty dir cleanup)', () => {
  test('removes empty parent directories after file deletion', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    (getFilesPath as jest.Mock).mockReturnValueOnce('C:\\builds\\test-build\\files');
    (existsSync as jest.Mock)
      .mockReturnValueOnce(true)  // entryPath exists â†’ unlinkSync
      .mockReturnValueOnce(true)  // removeEmptyDirsUpward: dirPath exists and is empty
      .mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValueOnce([]);

    const ctx = makeCtx({ params: { slug: SLUG, entryId: '10' } });
    await buildController({ strapi } as never).deleteFile(ctx as never);

    expect(rmdirSync).toHaveBeenCalled();
  });
});

// â”€â”€ uploadFile isPathSafe=false â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('uploadFile (isPathSafe=false)', () => {
  test('returns 400 when targetPath escapes build directory', async () => {
    const { strapi, buildService } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    (isPathSafe as jest.Mock).mockReturnValueOnce(false);

    const ctx = makeCtx({
      request: {
        body: { targetPath: 'mods/file.jar' },
        files: { file: { originalFilename: 'file.jar', filepath: '/tmp/file.jar' } },
      },
    });
    await buildController({ strapi } as never).uploadFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('escapes'));
  });
});

// â”€â”€ renameFile additional branches â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('renameFile (additional branches)', () => {
  test('returns 404 when entry not found in this build', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(null);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '99' },
      request: { body: { newRelativePath: 'mods/new.jar' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(ctx.notFound).toHaveBeenCalled();
  });

  test('returns 400 when new path escapes build directory', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact());
    (isPathSafe as jest.Mock).mockReturnValueOnce(false);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: 'mods/new.jar' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(ctx.badRequest).toHaveBeenCalledWith(expect.stringContaining('escapes'));
  });

  test('moves old physical file and cleans up empty dirs', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(makeArtifact({ relativePath: 'mods/old.jar' }));
    dbQuery.update.mockResolvedValue({});
    (getFilesPath as jest.Mock).mockReturnValueOnce('C:\\builds\\test-build\\files');
    (existsSync as jest.Mock)
      .mockReturnValueOnce(false)  // newPhysical — no conflict
      .mockReturnValueOnce(true)   // oldPhysical — file exists, do the move
      .mockReturnValueOnce(true)   // removeEmptyDirsUpward: dirPath exists
      .mockReturnValue(false);
    (readdirSync as jest.Mock).mockReturnValueOnce([]);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: 'mods/new.jar' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    expect(renameSync).toHaveBeenCalled();
    expect(rmdirSync).toHaveBeenCalled();
  });

  test('updates child entries when renaming a directory', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findOne.mockResolvedValue(
      makeArtifact({ relativePath: 'mods', name: 'mods', isDir: true }),
    );
    dbQuery.findMany.mockResolvedValue([
      { id: 11, relativePath: 'mods/child.jar' },
      { id: 12, relativePath: 'other/file.jar' },
    ]);
    dbQuery.update.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValue(false);

    const ctx = makeCtx({
      params: { slug: SLUG, entryId: '10' },
      request: { body: { newRelativePath: 'plugins' }, files: {} },
    });
    await buildController({ strapi } as never).renameFile(ctx as never);

    // one update for the entry itself, one for the matching child
    expect(dbQuery.update).toHaveBeenCalledTimes(2);
  });
});

// â”€â”€ bulkDeleteFiles (file on disk) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('bulkDeleteFiles (file exists on disk)', () => {
  test('unlinks file from disk when it exists', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([makeArtifact()]);
    dbQuery.deleteMany.mockResolvedValue({});
    (existsSync as jest.Mock).mockReturnValueOnce(true);

    const ctx = makeCtx({ request: { body: { ids: [10] }, files: {} } });
    await buildController({ strapi } as never).bulkDeleteFiles(ctx as never);

    expect(unlinkSync).toHaveBeenCalled();
  });
});

// â”€â”€ validate (walkOrphans) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('validate (walkOrphans)', () => {
  test('detects orphaned files on disk not tracked in DB', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([]);
    const mockFile = { name: 'orphan.jar', isDirectory: () => false, isFile: () => true };
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockReturnValueOnce([mockFile]);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect((ctx.body as Record<string, unknown[]>).orphaned).toHaveLength(1);
  });

  test('recurses into subdirectories when walking orphans', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([]);
    const mockSubDir = { name: 'subdir', isDirectory: () => true, isFile: () => false };
    const mockFile = { name: 'deep.jar', isDirectory: () => false, isFile: () => true };
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock)
      .mockReturnValueOnce([mockSubDir])
      .mockReturnValueOnce([mockFile]);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect((ctx.body as Record<string, unknown[]>).orphaned).toHaveLength(1);
  });

  test('does not mark tracked files as orphaned', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([
      { id: 10, relativePath: 'file.jar', name: 'file.jar', isDir: false },
    ]);
    const mockFile = { name: 'file.jar', isDirectory: () => false, isFile: () => true };
    (existsSync as jest.Mock)
      .mockReturnValueOnce(true)  // entry's physical path check (not missing)
      .mockReturnValueOnce(true); // filesPath exists â†’ run walkOrphans
    (readdirSync as jest.Mock).mockReturnValueOnce([mockFile]);

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect((ctx.body as Record<string, unknown[]>).orphaned).toHaveLength(0);
    expect((ctx.body as Record<string, unknown[]>).missing).toHaveLength(0);
  });

  test('handles readdirSync error in walkOrphans gracefully', async () => {
    const { strapi, buildService, dbQuery } = makeStrapi();
    buildService.findOne.mockResolvedValue(makeBuild());
    dbQuery.findMany.mockResolvedValue([]);
    (existsSync as jest.Mock).mockReturnValue(true);
    (readdirSync as jest.Mock).mockImplementationOnce(() => {
      throw new Error('ENOENT');
    });

    const ctx = makeCtx();
    await buildController({ strapi } as never).validate(ctx as never);

    expect((ctx.body as Record<string, unknown[]>).orphaned).toHaveLength(0);
  });
});

// â”€â”€ diskSpace (getSystemDiskSpace with statfsSync) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe('diskSpace (getSystemDiskSpace)', () => {
  test('returns computed sizes when statfsSync is available', async () => {
    const fsMock = jest.requireMock('fs') as Record<string, unknown>;
    fsMock.statfsSync = jest.fn().mockReturnValue({ bfree: 1000, bsize: 4096, blocks: 5000 });

    try {
      const { strapi } = makeStrapi();
      const ctx = makeCtx();
      await buildController({ strapi } as never).diskSpace(ctx as never);

      const body = ctx.body as Record<string, number>;
      expect(body.free).toBe(1000 * 4096);
      expect(body.total).toBe(5000 * 4096);
    } finally {
      delete fsMock.statfsSync;
    }
  });

  test('returns null values when statfsSync throws', async () => {
    const fsMock = jest.requireMock('fs') as Record<string, unknown>;
    fsMock.statfsSync = jest.fn().mockImplementation(() => {
      throw new Error('Permission denied');
    });

    try {
      const { strapi } = makeStrapi();
      const ctx = makeCtx();
      await buildController({ strapi } as never).diskSpace(ctx as never);

      expect(ctx.body).toEqual({ free: null, total: null });
    } finally {
      delete fsMock.statfsSync;
    }
  });
});
