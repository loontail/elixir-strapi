import { readFileSync, existsSync } from 'fs';
import type { StrapiInstance, KoaContext, FormidableFile } from '../types';
import {
  writeSkinFile,
  writeCapeFile,
  buildSkinFilename,
  buildCapeFilename,
  getSkinFilePath,
  getCapeFilePath,
  getSkinFileUrl,
  getCapeFileUrl,
  deleteFileIfExists,
} from '../services/storage';
import type { PlayerSkin, PlayerCape } from '../../shared/types/entities';

const SKIN_UID = 'plugin::skins-registry.player-skin' as const;
const CAPE_UID = 'plugin::skins-registry.player-cape' as const;

type AssetKind = 'skin' | 'cape';
type AssetUID = typeof SKIN_UID | typeof CAPE_UID;
type AssetRecord = PlayerSkin | PlayerCape;

const ASSET_HANDLERS = {
  skin: {
    uid: SKIN_UID,
    write: writeSkinFile,
    buildFilename: buildSkinFilename,
    path: getSkinFilePath,
    url: getSkinFileUrl,
    upsertMethod: 'upsertSkin' as const,
    deleteMethod: 'deleteSkinByUserId' as const,
    findMethod: 'findSkinByUserId' as const,
  },
  cape: {
    uid: CAPE_UID,
    write: writeCapeFile,
    buildFilename: buildCapeFilename,
    path: getCapeFilePath,
    url: getCapeFileUrl,
    upsertMethod: 'upsertCape' as const,
    deleteMethod: 'deleteCapeByUserId' as const,
    findMethod: 'findCapeByUserId' as const,
  },
} as const;

export const parseUserIdParam = (ctx: KoaContext): number | null => {
  const userId = Number(ctx.params.userId);
  return userId > 0 ? userId : null;
};

export const parseIdParam = (ctx: KoaContext): number | null => {
  const id = Number(ctx.params.id);
  return id > 0 ? id : null;
};

export const parsePaginationQuery = (ctx: KoaContext) => ({
  page: Number(ctx.query.page) || 1,
  pageSize: Number(ctx.query.pageSize) || 25,
  search: ctx.query.search || '',
});

export const buildPaginationMeta = (total: number, page: number, pageSize: number) => ({
  pagination: {
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    total,
  },
});

const getFormidableFile = (
  files: KoaContext['request']['files'],
  fieldName: string,
): FormidableFile | null => {
  const file = files?.[fieldName];
  if (!file) return null;
  return Array.isArray(file) ? file[0] : file;
};

const skinService = (strapi: StrapiInstance) => strapi.plugin('skins-registry').service('skin');

const persistAsset = async (
  strapi: StrapiInstance,
  kind: AssetKind,
  userId: number,
  buffer: Buffer,
  username: string | undefined,
) => {
  const a = ASSET_HANDLERS[kind];
  const service = skinService(strapi);

  // Look up the previous row before writing — we need its filePath to clean
  // up the now-orphaned file after the upsert succeeds.
  const previous = (await service[a.findMethod](userId)) as AssetRecord | null;

  const filename = a.buildFilename(userId);
  a.write(filename, buffer);
  const filePath = a.path(filename);
  const fileUrl = a.url(filename);

  const upserted = await service[a.upsertMethod](userId, {
    username,
    filePath,
    fileUrl,
    fileSize: buffer.length,
  });

  // Best-effort cleanup. Order matters: the row already points at the new
  // file, so a crash here only leaks bytes — the active skin is safe.
  if (previous?.filePath && previous.filePath !== filePath) {
    deleteFileIfExists(previous.filePath);
  }

  return upserted;
};

const handleMultipartUpload = async (
  strapi: StrapiInstance,
  kind: AssetKind,
  ctx: KoaContext,
) => {
  const userId = parseUserIdParam(ctx);
  if (!userId) return ctx.badRequest('userId required');
  const file = getFormidableFile(ctx.request.files, 'file');
  if (!file) return ctx.badRequest('No file uploaded');
  if (file.mimetype !== 'image/png') return ctx.badRequest('File must be a PNG');
  const username = (ctx.request.body as Record<string, string>)?.username || undefined;
  const buffer = readFileSync(file.filepath);
  ctx.body = await persistAsset(strapi, kind, userId, buffer, username);
};

const handleAdminBase64Upload = async (
  strapi: StrapiInstance,
  kind: AssetKind,
  ctx: KoaContext,
) => {
  const body = ctx.request.body as Record<string, unknown>;
  const userId = Number(body?.userId);
  const username = (body?.username as string) || undefined;
  const fileBase64 = body?.fileBase64 as string | undefined;
  if (!userId) return ctx.badRequest('userId required');
  if (!fileBase64) return ctx.badRequest('fileBase64 required');
  const buffer = Buffer.from(fileBase64, 'base64');
  ctx.body = await persistAsset(strapi, kind, userId, buffer, username);
};

const handleDeleteByUserId = async (
  strapi: StrapiInstance,
  kind: AssetKind,
  ctx: KoaContext,
) => {
  const userId = parseUserIdParam(ctx);
  if (!userId) return ctx.badRequest('userId required');
  const a = ASSET_HANDLERS[kind];
  const service = skinService(strapi);
  const existing = (await service[a.findMethod](userId)) as AssetRecord | null;
  if (existing?.filePath) deleteFileIfExists(existing.filePath);
  await service[a.deleteMethod](userId);
  ctx.body = { success: true };
};

const handleAdminDeleteById = async (
  strapi: StrapiInstance,
  kind: AssetKind,
  ctx: KoaContext,
) => {
  const id = parseIdParam(ctx);
  if (!id) return ctx.badRequest('id required');
  const a = ASSET_HANDLERS[kind];
  const row = (await strapi.db.query(a.uid).findOne({ where: { id } })) as AssetRecord | null;
  if (!row) return ctx.notFound();
  if (row.filePath) deleteFileIfExists(row.filePath);
  await strapi.db.query(a.uid).delete({ where: { id } });
  ctx.body = { success: true };
};

// Streamed scan to avoid loading the entire skins/capes tables into memory.
// `findMany` without pagination would be a memory hazard once the user base
// grows; instead we walk the tables in fixed-size batches.
const SCAN_BATCH_SIZE = 500;

type AssetRow = { id: number; filePath: string };

const collectMissingFor = async (
  strapi: StrapiInstance,
  uid: AssetUID,
): Promise<AssetRow[]> => {
  const missing: AssetRow[] = [];
  let offset = 0;
  let done = false;
  while (!done) {
    const batch = (await strapi.db.query(uid).findMany({
      limit: SCAN_BATCH_SIZE,
      offset,
      orderBy: { id: 'asc' },
    })) as AssetRow[];
    for (const row of batch) {
      if (!existsSync(row.filePath)) missing.push(row);
    }
    if (batch.length < SCAN_BATCH_SIZE) {
      done = true;
    } else {
      offset += SCAN_BATCH_SIZE;
    }
  }
  return missing;
};

const findMissing = async (strapi: StrapiInstance) => {
  const [missingSkins, missingCapes] = await Promise.all([
    collectMissingFor(strapi, SKIN_UID),
    collectMissingFor(strapi, CAPE_UID),
  ]);
  return { missingSkins, missingCapes };
};

const skinController = ({ strapi }: { strapi: StrapiInstance }) => ({
  async getSkin(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    ctx.body = (await skinService(strapi).findSkinByUserId(userId)) ?? null;
  },

  async getCape(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    ctx.body = (await skinService(strapi).findCapeByUserId(userId)) ?? null;
  },

  async getPlayerAssets(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    const service = skinService(strapi);
    const [skin, cape] = await Promise.all([
      service.findSkinByUserId(userId),
      service.findCapeByUserId(userId),
    ]);
    ctx.body = { skin: skin ?? null, cape: cape ?? null };
  },

  uploadSkin: (ctx: KoaContext) => handleMultipartUpload(strapi, 'skin', ctx),
  uploadCape: (ctx: KoaContext) => handleMultipartUpload(strapi, 'cape', ctx),

  deleteSkin: (ctx: KoaContext) => handleDeleteByUserId(strapi, 'skin', ctx),
  deleteCape: (ctx: KoaContext) => handleDeleteByUserId(strapi, 'cape', ctx),

  async deletePlayerAssets(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    const service = skinService(strapi);
    const [skin, cape] = await Promise.all([
      service.findSkinByUserId(userId),
      service.findCapeByUserId(userId),
    ]);
    if ((skin as AssetRecord | null)?.filePath) {
      deleteFileIfExists((skin as AssetRecord).filePath);
    }
    if ((cape as AssetRecord | null)?.filePath) {
      deleteFileIfExists((cape as AssetRecord).filePath);
    }
    await Promise.all([service.deleteSkinByUserId(userId), service.deleteCapeByUserId(userId)]);
    ctx.body = { success: true };
  },

  async listSkins(ctx: KoaContext) {
    const { page, pageSize, search } = parsePaginationQuery(ctx);
    const { data, total } = await skinService(strapi).findManySkins({ page, pageSize, search });
    ctx.body = { data, meta: buildPaginationMeta(total, page, pageSize) };
  },

  async listCapes(ctx: KoaContext) {
    const { page, pageSize, search } = parsePaginationQuery(ctx);
    const { data, total } = await skinService(strapi).findManyCapes({ page, pageSize, search });
    ctx.body = { data, meta: buildPaginationMeta(total, page, pageSize) };
  },

  adminUploadSkin: (ctx: KoaContext) => handleAdminBase64Upload(strapi, 'skin', ctx),
  adminUploadCape: (ctx: KoaContext) => handleAdminBase64Upload(strapi, 'cape', ctx),

  adminDeleteSkin: (ctx: KoaContext) => handleAdminDeleteById(strapi, 'skin', ctx),
  adminDeleteCape: (ctx: KoaContext) => handleAdminDeleteById(strapi, 'cape', ctx),

  async validate(ctx: KoaContext) {
    const { missingSkins, missingCapes } = await findMissing(strapi);
    ctx.body = {
      missingSkins: missingSkins.map((s) => s.id),
      missingCapes: missingCapes.map((c) => c.id),
    };
  },

  async purgeMissing(ctx: KoaContext) {
    const { missingSkins, missingCapes } = await findMissing(strapi);
    await Promise.all([
      ...missingSkins.map((s) => strapi.db.query(SKIN_UID).delete({ where: { id: s.id } })),
      ...missingCapes.map((c) => strapi.db.query(CAPE_UID).delete({ where: { id: c.id } })),
    ]);
    ctx.body = { deletedSkins: missingSkins.length, deletedCapes: missingCapes.length };
  },
});

export default skinController;
