import { readFileSync } from 'fs';
import skinController, {
  parseUserIdParam,
  parseIdParam,
  parsePaginationQuery,
  buildPaginationMeta,
} from '../controllers/skin';
import type { KoaContext } from '../types';

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

jest.mock('../services/storage', () => ({
  buildSkinFilename: jest.fn((id: number) => `${id}-rev.png`),
  buildCapeFilename: jest.fn((id: number) => `${id}-rev.png`),
  getSkinFilePath: jest.fn((filename: string) => `/public/skins-registry/skins/${filename}`),
  getCapeFilePath: jest.fn((filename: string) => `/public/skins-registry/capes/${filename}`),
  getSkinFileUrl: jest.fn((filename: string) => `/skins-registry/skins/${filename}`),
  getCapeFileUrl: jest.fn((filename: string) => `/skins-registry/capes/${filename}`),
  writeSkinFile: jest.fn(),
  writeCapeFile: jest.fn(),
  deleteFileIfExists: jest.fn(),
}));

import {
  writeSkinFile,
  writeCapeFile,
  deleteFileIfExists,
  buildSkinFilename,
  buildCapeFilename,
} from '../services/storage';

beforeEach(() => jest.clearAllMocks());

// ── makeCtx helper ───────────────────────────────────────────────────────────

const makeCtx = (
  params: Record<string, string> = {},
  query: Record<string, string> = {},
  body: Record<string, unknown> = {},
  files: Record<string, unknown> = {},
): KoaContext =>
  ({
    params,
    query,
    request: { body, files, header: {} },
    body: null,
    status: 200,
    notFound: jest.fn(),
    badRequest: jest.fn(),
    unauthorized: jest.fn(),
    internalServerError: jest.fn(),
    set: jest.fn(),
  }) as unknown as KoaContext;

// ── makeStrapi helper ─────────────────────────────────────────────────────────

const makeMockService = () => ({
  findSkinByUserId: jest.fn().mockResolvedValue(null),
  findCapeByUserId: jest.fn().mockResolvedValue(null),
  upsertSkin: jest.fn(),
  upsertCape: jest.fn(),
  deleteSkinByUserId: jest.fn(),
  deleteCapeByUserId: jest.fn(),
  findManySkins: jest.fn(),
  findManyCapes: jest.fn(),
});

const makeMockQuery = () => ({
  findOne: jest.fn(),
  findMany: jest.fn(),
  count: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

const makeMockStrapi = (
  service = makeMockService(),
  skinDbQuery = makeMockQuery(),
  capeDbQuery = makeMockQuery(),
) => ({
  plugin: jest.fn(() => ({ service: jest.fn(() => service) })),
  db: {
    query: jest.fn((uid: string) => {
      if (uid === 'plugin::skins-registry.player-skin') return skinDbQuery;
      if (uid === 'plugin::skins-registry.player-cape') return capeDbQuery;
      if (uid === 'admin::api-token') return makeMockQuery();
      throw new Error(`Unexpected UID: ${uid}`);
    }),
  },
});

// ── parseUserIdParam ─────────────────────────────────────────────────────────

describe('parseUserIdParam', () => {
  it('returns the numeric userId for a valid param', () => {
    expect(parseUserIdParam(makeCtx({ userId: '42' }))).toBe(42);
  });

  it('returns null for a zero userId', () => {
    expect(parseUserIdParam(makeCtx({ userId: '0' }))).toBeNull();
  });

  it('returns null for a negative userId', () => {
    expect(parseUserIdParam(makeCtx({ userId: '-1' }))).toBeNull();
  });

  it('returns null for a non-numeric string', () => {
    expect(parseUserIdParam(makeCtx({ userId: 'abc' }))).toBeNull();
  });

  it('returns null when userId param is missing', () => {
    expect(parseUserIdParam(makeCtx())).toBeNull();
  });
});

// ── parseIdParam ─────────────────────────────────────────────────────────────

describe('parseIdParam', () => {
  it('returns the numeric id for a valid param', () => {
    expect(parseIdParam(makeCtx({ id: '7' }))).toBe(7);
  });

  it('returns null for zero', () => {
    expect(parseIdParam(makeCtx({ id: '0' }))).toBeNull();
  });

  it('returns null when id param is missing', () => {
    expect(parseIdParam(makeCtx())).toBeNull();
  });
});

// ── parsePaginationQuery ─────────────────────────────────────────────────────

describe('parsePaginationQuery', () => {
  it('parses page, pageSize and search from query string', () => {
    const ctx = makeCtx({}, { page: '3', pageSize: '50', search: 'notch' });
    expect(parsePaginationQuery(ctx)).toEqual({ page: 3, pageSize: 50, search: 'notch' });
  });

  it('defaults page to 1 and pageSize to 25 when not provided', () => {
    expect(parsePaginationQuery(makeCtx())).toEqual({ page: 1, pageSize: 25, search: '' });
  });

  it('defaults to 1 / 25 when values are 0 or non-numeric', () => {
    const ctx = makeCtx({}, { page: '0', pageSize: 'bad' });
    expect(parsePaginationQuery(ctx)).toEqual({ page: 1, pageSize: 25, search: '' });
  });
});

// ── buildPaginationMeta ──────────────────────────────────────────────────────

describe('buildPaginationMeta', () => {
  it('computes pageCount correctly', () => {
    expect(buildPaginationMeta(100, 1, 25)).toEqual({
      pagination: { page: 1, pageSize: 25, pageCount: 4, total: 100 },
    });
  });

  it('rounds pageCount up (ceiling division)', () => {
    expect(buildPaginationMeta(101, 1, 25)).toEqual({
      pagination: { page: 1, pageSize: 25, pageCount: 5, total: 101 },
    });
  });

  it('returns pageCount of 0 when total is 0', () => {
    expect(buildPaginationMeta(0, 1, 25)).toEqual({
      pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 },
    });
  });
});

// ── getSkin ───────────────────────────────────────────────────────────────────

describe('skinController.getSkin', () => {
  it('returns skin data for a valid userId', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue({ id: 1, userId: 42 });
    const strapi = makeMockStrapi(service);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ userId: '42' });

    await controller.getSkin(ctx);

    expect(ctx.body).toEqual({ id: 1, userId: 42 });
  });

  it('returns null when skin does not exist', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue(null);
    const strapi = makeMockStrapi(service);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ userId: '5' });

    await controller.getSkin(ctx);

    expect(ctx.body).toBeNull();
  });

  it('calls badRequest when userId is invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ userId: '0' });

    await controller.getSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── getCape ───────────────────────────────────────────────────────────────────

describe('skinController.getCape', () => {
  it('returns cape data for a valid userId', async () => {
    const service = makeMockService();
    service.findCapeByUserId.mockResolvedValue({ id: 2, userId: 10 });
    const strapi = makeMockStrapi(service);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ userId: '10' });

    await controller.getCape(ctx);

    expect(ctx.body).toEqual({ id: 2, userId: 10 });
  });

  it('calls badRequest when userId is invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.getCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── getPlayerAssets ────────────────────────────────────────────────────────────

describe('skinController.getPlayerAssets', () => {
  it('returns both skin and cape', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue({ id: 1, userId: 7 });
    service.findCapeByUserId.mockResolvedValue({ id: 2, userId: 7 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '7' });

    await controller.getPlayerAssets(ctx);

    expect(ctx.body).toEqual({ skin: { id: 1, userId: 7 }, cape: { id: 2, userId: 7 } });
  });

  it('returns nulls when neither exists', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue(null);
    service.findCapeByUserId.mockResolvedValue(null);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '7' });

    await controller.getPlayerAssets(ctx);

    expect(ctx.body).toEqual({ skin: null, cape: null });
  });

  it('calls badRequest when userId is invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.getPlayerAssets(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── uploadSkin ────────────────────────────────────────────────────────────────

describe('skinController.uploadSkin', () => {
  const fakeBuffer = Buffer.from('png-data');
  const fakeFile = { filepath: '/tmp/upload.png', mimetype: 'image/png' };

  it('writes a per-upload filename and upserts with the resolved path/url', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.upsertSkin.mockResolvedValue({ id: 1, userId: 3 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '3' }, {}, { username: 'steve' }, { file: fakeFile });

    await controller.uploadSkin(ctx);

    expect(buildSkinFilename).toHaveBeenCalledWith(3);
    expect(writeSkinFile).toHaveBeenCalledWith('3-rev.png', fakeBuffer);
    expect(service.upsertSkin).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        username: 'steve',
        filePath: '/public/skins-registry/skins/3-rev.png',
        fileUrl: '/skins-registry/skins/3-rev.png',
        fileSize: fakeBuffer.length,
      }),
    );
    expect(ctx.body).toEqual({ id: 1, userId: 3 });
  });

  it('cleans up the previous file after a successful re-upload', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue({
      id: 1,
      userId: 3,
      filePath: '/public/skins-registry/skins/3-old.png',
      fileUrl: '/skins-registry/skins/3-old.png',
    });
    service.upsertSkin.mockResolvedValue({ id: 1, userId: 3 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '3' }, {}, {}, { file: fakeFile });

    await controller.uploadSkin(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/skins/3-old.png');
  });

  it('does not delete anything when there is no prior row', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue(null);
    service.upsertSkin.mockResolvedValue({ id: 1, userId: 4 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '4' }, {}, {}, { file: fakeFile });

    await controller.uploadSkin(ctx);

    expect(deleteFileIfExists).not.toHaveBeenCalled();
  });

  it('accepts array file (getFormidableFile picks first)', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.upsertSkin.mockResolvedValue({ id: 1, userId: 4 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '4' }, {}, {}, { file: [fakeFile, fakeFile] });

    await controller.uploadSkin(ctx);

    expect(writeSkinFile).toHaveBeenCalledWith('4-rev.png', fakeBuffer);
  });

  it('calls badRequest when userId invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.uploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });

  it('calls badRequest when no file uploaded', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ userId: '1' }, {}, {}, {});

    await controller.uploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('No file uploaded');
  });

  it('calls badRequest when file is not a PNG', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx(
      { userId: '1' },
      {},
      {},
      { file: { filepath: '/tmp/x.jpg', mimetype: 'image/jpeg' } },
    );

    await controller.uploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('File must be a PNG');
  });

  it('calls badRequest when the PNG exceeds MAX_SKIN_UPLOAD_BYTES (256 KB)', async () => {
    // 257 KB — one KB past the cap.
    const oversized = Buffer.alloc(257 * 1024);
    (readFileSync as jest.Mock).mockReturnValue(oversized);
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ userId: '1' }, {}, {}, { file: fakeFile });

    await controller.uploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith(
      expect.stringContaining('exceeds maximum size'),
    );
    expect(writeSkinFile).not.toHaveBeenCalled();
  });
});

// ── uploadCape ────────────────────────────────────────────────────────────────

describe('skinController.uploadCape', () => {
  const fakeBuffer = Buffer.from('cape-png');
  const fakeFile = { filepath: '/tmp/cape.png', mimetype: 'image/png' };

  it('writes a per-upload filename and upserts the cape record', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.upsertCape.mockResolvedValue({ id: 5, userId: 8 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '8' }, {}, {}, { file: fakeFile });

    await controller.uploadCape(ctx);

    expect(buildCapeFilename).toHaveBeenCalledWith(8);
    expect(writeCapeFile).toHaveBeenCalledWith('8-rev.png', fakeBuffer);
    expect(ctx.body).toEqual({ id: 5, userId: 8 });
  });

  it('cleans up the previous cape file after a re-upload', async () => {
    (readFileSync as jest.Mock).mockReturnValue(fakeBuffer);
    const service = makeMockService();
    service.findCapeByUserId.mockResolvedValue({
      id: 5,
      userId: 8,
      filePath: '/public/skins-registry/capes/8-old.png',
      fileUrl: '/skins-registry/capes/8-old.png',
    });
    service.upsertCape.mockResolvedValue({ id: 5, userId: 8 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '8' }, {}, {}, { file: fakeFile });

    await controller.uploadCape(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/capes/8-old.png');
  });

  it('calls badRequest when userId invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ userId: '0' });

    await controller.uploadCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });

  it('calls badRequest when no file', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ userId: '1' }, {}, {}, {});

    await controller.uploadCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('No file uploaded');
  });

  it('calls badRequest when file is not PNG', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx(
      { userId: '1' },
      {},
      {},
      { file: { filepath: '/tmp/x.gif', mimetype: 'image/gif' } },
    );

    await controller.uploadCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('File must be a PNG');
  });
});

// ── deleteSkin ────────────────────────────────────────────────────────────────

describe('skinController.deleteSkin', () => {
  it('deletes the file referenced by the row and clears the DB record', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue({
      id: 1,
      userId: 5,
      filePath: '/public/skins-registry/skins/5-rev.png',
    });
    service.deleteSkinByUserId.mockResolvedValue(undefined);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '5' });

    await controller.deleteSkin(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/skins/5-rev.png');
    expect(service.deleteSkinByUserId).toHaveBeenCalledWith(5);
    expect(ctx.body).toEqual({ success: true });
  });

  it('does not touch disk when there is no row for that user', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue(null);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '5' });

    await controller.deleteSkin(ctx);

    expect(deleteFileIfExists).not.toHaveBeenCalled();
    expect(service.deleteSkinByUserId).toHaveBeenCalledWith(5);
  });

  it('calls badRequest when userId invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.deleteSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── deleteCape ────────────────────────────────────────────────────────────────

describe('skinController.deleteCape', () => {
  it('deletes the file referenced by the row and clears the DB record', async () => {
    const service = makeMockService();
    service.findCapeByUserId.mockResolvedValue({
      id: 2,
      userId: 6,
      filePath: '/public/skins-registry/capes/6-rev.png',
    });
    service.deleteCapeByUserId.mockResolvedValue(undefined);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '6' });

    await controller.deleteCape(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/capes/6-rev.png');
    expect(service.deleteCapeByUserId).toHaveBeenCalledWith(6);
    expect(ctx.body).toEqual({ success: true });
  });

  it('calls badRequest when userId invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.deleteCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── deletePlayerAssets ────────────────────────────────────────────────────────

describe('skinController.deletePlayerAssets', () => {
  it('deletes both skin and cape files (per stored filePath) and DB rows', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue({
      id: 1,
      userId: 9,
      filePath: '/public/skins-registry/skins/9-rev.png',
    });
    service.findCapeByUserId.mockResolvedValue({
      id: 2,
      userId: 9,
      filePath: '/public/skins-registry/capes/9-rev.png',
    });
    service.deleteSkinByUserId.mockResolvedValue(undefined);
    service.deleteCapeByUserId.mockResolvedValue(undefined);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '9' });

    await controller.deletePlayerAssets(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/skins/9-rev.png');
    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/capes/9-rev.png');
    expect(service.deleteSkinByUserId).toHaveBeenCalledWith(9);
    expect(service.deleteCapeByUserId).toHaveBeenCalledWith(9);
    expect(ctx.body).toEqual({ success: true });
  });

  it('skips disk cleanup for whichever record is missing', async () => {
    const service = makeMockService();
    service.findSkinByUserId.mockResolvedValue(null);
    service.findCapeByUserId.mockResolvedValue({
      id: 2,
      userId: 9,
      filePath: '/public/skins-registry/capes/9-rev.png',
    });
    service.deleteSkinByUserId.mockResolvedValue(undefined);
    service.deleteCapeByUserId.mockResolvedValue(undefined);
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({ userId: '9' });

    await controller.deletePlayerAssets(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledTimes(1);
    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/capes/9-rev.png');
  });

  it('calls badRequest when userId invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.deletePlayerAssets(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });
});

// ── listSkins ─────────────────────────────────────────────────────────────────

describe('skinController.listSkins', () => {
  it('returns paginated skin data', async () => {
    const service = makeMockService();
    service.findManySkins.mockResolvedValue({ data: [{ id: 1 }], total: 1 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({}, { page: '1', pageSize: '25' });

    await controller.listSkins(ctx);

    expect(ctx.body).toEqual({
      data: [{ id: 1 }],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 1, total: 1 } },
    });
  });
});

// ── listCapes ─────────────────────────────────────────────────────────────────

describe('skinController.listCapes', () => {
  it('returns paginated cape data', async () => {
    const service = makeMockService();
    service.findManyCapes.mockResolvedValue({ data: [], total: 0 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const ctx = makeCtx({}, { page: '1', pageSize: '25' });

    await controller.listCapes(ctx);

    expect(ctx.body).toEqual({
      data: [],
      meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } },
    });
  });
});

// ── adminUploadSkin ───────────────────────────────────────────────────────────

describe('skinController.adminUploadSkin', () => {
  it('decodes base64 and persists with a per-upload filename', async () => {
    const service = makeMockService();
    service.upsertSkin.mockResolvedValue({ id: 1, userId: 3 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const fileBase64 = Buffer.from('png-bytes').toString('base64');
    const ctx = makeCtx({}, {}, { userId: 3, fileBase64, username: 'herobrine' });

    await controller.adminUploadSkin(ctx);

    expect(buildSkinFilename).toHaveBeenCalledWith(3);
    expect(writeSkinFile).toHaveBeenCalledWith('3-rev.png', expect.any(Buffer));
    expect(service.upsertSkin).toHaveBeenCalledWith(
      3,
      expect.objectContaining({ username: 'herobrine' }),
    );
    expect(ctx.body).toEqual({ id: 1, userId: 3 });
  });

  it('calls badRequest when userId is missing', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({}, {}, { fileBase64: 'abc' });

    await controller.adminUploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });

  it('calls badRequest when fileBase64 is missing', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({}, {}, { userId: 1 });

    await controller.adminUploadSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('fileBase64 required');
  });
});

// ── adminUploadCape ───────────────────────────────────────────────────────────

describe('skinController.adminUploadCape', () => {
  it('decodes base64 and persists with a per-upload filename', async () => {
    const service = makeMockService();
    service.upsertCape.mockResolvedValue({ id: 2, userId: 4 });
    const controller = skinController({ strapi: makeMockStrapi(service) as never });
    const fileBase64 = Buffer.from('cape-bytes').toString('base64');
    const ctx = makeCtx({}, {}, { userId: 4, fileBase64 });

    await controller.adminUploadCape(ctx);

    expect(buildCapeFilename).toHaveBeenCalledWith(4);
    expect(writeCapeFile).toHaveBeenCalledWith('4-rev.png', expect.any(Buffer));
    expect(ctx.body).toEqual({ id: 2, userId: 4 });
  });

  it('calls badRequest when userId is missing', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({}, {}, { fileBase64: 'data' });

    await controller.adminUploadCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('userId required');
  });

  it('calls badRequest when fileBase64 is missing', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({}, {}, { userId: 1 });

    await controller.adminUploadCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('fileBase64 required');
  });
});

// ── adminDeleteSkin ───────────────────────────────────────────────────────────

describe('skinController.adminDeleteSkin', () => {
  it('deletes the file referenced by the row and the DB record', async () => {
    const skinDbQuery = makeMockQuery();
    skinDbQuery.findOne.mockResolvedValue({
      id: 5,
      userId: 10,
      filePath: '/public/skins-registry/skins/10-rev.png',
    });
    skinDbQuery.delete.mockResolvedValue(undefined);
    const strapi = makeMockStrapi(makeMockService(), skinDbQuery);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ id: '5' });

    await controller.adminDeleteSkin(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/skins/10-rev.png');
    expect(skinDbQuery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(ctx.body).toEqual({ success: true });
  });

  it('calls badRequest when id invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx({ id: '0' });

    await controller.adminDeleteSkin(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('id required');
  });

  it('calls notFound when skin does not exist', async () => {
    const skinDbQuery = makeMockQuery();
    skinDbQuery.findOne.mockResolvedValue(null);
    const strapi = makeMockStrapi(makeMockService(), skinDbQuery);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ id: '99' });

    await controller.adminDeleteSkin(ctx);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});

// ── adminDeleteCape ───────────────────────────────────────────────────────────

describe('skinController.adminDeleteCape', () => {
  it('deletes the file referenced by the row and the DB record', async () => {
    const capeDbQuery = makeMockQuery();
    capeDbQuery.findOne.mockResolvedValue({
      id: 8,
      userId: 15,
      filePath: '/public/skins-registry/capes/15-rev.png',
    });
    capeDbQuery.delete.mockResolvedValue(undefined);
    const strapi = makeMockStrapi(makeMockService(), makeMockQuery(), capeDbQuery);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ id: '8' });

    await controller.adminDeleteCape(ctx);

    expect(deleteFileIfExists).toHaveBeenCalledWith('/public/skins-registry/capes/15-rev.png');
    expect(capeDbQuery.delete).toHaveBeenCalledWith({ where: { id: 8 } });
    expect(ctx.body).toEqual({ success: true });
  });

  it('calls badRequest when id invalid', async () => {
    const controller = skinController({ strapi: makeMockStrapi() as never });
    const ctx = makeCtx();

    await controller.adminDeleteCape(ctx);

    expect(ctx.badRequest).toHaveBeenCalledWith('id required');
  });

  it('calls notFound when cape does not exist', async () => {
    const capeDbQuery = makeMockQuery();
    capeDbQuery.findOne.mockResolvedValue(null);
    const strapi = makeMockStrapi(makeMockService(), makeMockQuery(), capeDbQuery);
    const controller = skinController({ strapi: strapi as never });
    const ctx = makeCtx({ id: '42' });

    await controller.adminDeleteCape(ctx);

    expect(ctx.notFound).toHaveBeenCalled();
  });
});
