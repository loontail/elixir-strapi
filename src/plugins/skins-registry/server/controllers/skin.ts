import { readFileSync, existsSync } from 'fs';
import type { StrapiInstance, KoaContext, FormidableFile } from '../types';
import {
  writeSkinFile,
  writeCapeFile,
  deleteSkinFile,
  deleteCapeFile,
  getSkinFileUrl,
  getCapeFileUrl,
  getSkinFilePath,
  getCapeFilePath,
} from '../services/storage';

const SKIN_UID = 'plugin::skins-registry.player-skin' as const;
const CAPE_UID = 'plugin::skins-registry.player-cape' as const;

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

  async uploadSkin(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    const file = getFormidableFile(ctx.request.files, 'file');
    if (!file) return ctx.badRequest('No file uploaded');
    if (file.mimetype !== 'image/png') return ctx.badRequest('File must be a PNG');
    const username = (ctx.request.body as Record<string, string>)?.username || undefined;
    const buffer = readFileSync(file.filepath);
    writeSkinFile(userId, buffer);
    ctx.body = await skinService(strapi).upsertSkin(userId, {
      username,
      filePath: getSkinFilePath(userId),
      fileUrl: getSkinFileUrl(userId),
      fileSize: buffer.length,
    });
  },

  async uploadCape(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    const file = getFormidableFile(ctx.request.files, 'file');
    if (!file) return ctx.badRequest('No file uploaded');
    if (file.mimetype !== 'image/png') return ctx.badRequest('File must be a PNG');
    const username = (ctx.request.body as Record<string, string>)?.username || undefined;
    const buffer = readFileSync(file.filepath);
    writeCapeFile(userId, buffer);
    ctx.body = await skinService(strapi).upsertCape(userId, {
      username,
      filePath: getCapeFilePath(userId),
      fileUrl: getCapeFileUrl(userId),
      fileSize: buffer.length,
    });
  },

  async deleteSkin(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    deleteSkinFile(userId);
    await skinService(strapi).deleteSkinByUserId(userId);
    ctx.body = { success: true };
  },

  async deleteCape(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    deleteCapeFile(userId);
    await skinService(strapi).deleteCapeByUserId(userId);
    ctx.body = { success: true };
  },

  async deletePlayerAssets(ctx: KoaContext) {
    const userId = parseUserIdParam(ctx);
    if (!userId) return ctx.badRequest('userId required');
    deleteSkinFile(userId);
    deleteCapeFile(userId);
    const service = skinService(strapi);
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

  async adminUploadSkin(ctx: KoaContext) {
    const body = ctx.request.body as Record<string, unknown>;
    const userId = Number(body?.userId);
    const username = (body?.username as string) || undefined;
    const fileBase64 = body?.fileBase64 as string | undefined;
    if (!userId) return ctx.badRequest('userId required');
    if (!fileBase64) return ctx.badRequest('fileBase64 required');
    const buffer = Buffer.from(fileBase64, 'base64');
    writeSkinFile(userId, buffer);
    ctx.body = await skinService(strapi).upsertSkin(userId, {
      username,
      filePath: getSkinFilePath(userId),
      fileUrl: getSkinFileUrl(userId),
      fileSize: buffer.length,
    });
  },

  async adminUploadCape(ctx: KoaContext) {
    const body = ctx.request.body as Record<string, unknown>;
    const userId = Number(body?.userId);
    const username = (body?.username as string) || undefined;
    const fileBase64 = body?.fileBase64 as string | undefined;
    if (!userId) return ctx.badRequest('userId required');
    if (!fileBase64) return ctx.badRequest('fileBase64 required');
    const buffer = Buffer.from(fileBase64, 'base64');
    writeCapeFile(userId, buffer);
    ctx.body = await skinService(strapi).upsertCape(userId, {
      username,
      filePath: getCapeFilePath(userId),
      fileUrl: getCapeFileUrl(userId),
      fileSize: buffer.length,
    });
  },

  async adminDeleteSkin(ctx: KoaContext) {
    const id = parseIdParam(ctx);
    if (!id) return ctx.badRequest('id required');
    const skin = await strapi.db.query(SKIN_UID).findOne({ where: { id } });
    if (!skin) return ctx.notFound();
    deleteSkinFile((skin as { userId: number }).userId);
    await strapi.db.query(SKIN_UID).delete({ where: { id } });
    ctx.body = { success: true };
  },

  async adminDeleteCape(ctx: KoaContext) {
    const id = parseIdParam(ctx);
    if (!id) return ctx.badRequest('id required');
    const cape = await strapi.db.query(CAPE_UID).findOne({ where: { id } });
    if (!cape) return ctx.notFound();
    deleteCapeFile((cape as { userId: number }).userId);
    await strapi.db.query(CAPE_UID).delete({ where: { id } });
    ctx.body = { success: true };
  },

  async validate(ctx: KoaContext) {
    const [allSkins, allCapes] = await Promise.all([
      strapi.db.query(SKIN_UID).findMany({}),
      strapi.db.query(CAPE_UID).findMany({}),
    ]);
    const missingSkins = (allSkins as Array<{ id: number; filePath: string }>)
      .filter((s) => !existsSync(s.filePath))
      .map((s) => s.id);
    const missingCapes = (allCapes as Array<{ id: number; filePath: string }>)
      .filter((c) => !existsSync(c.filePath))
      .map((c) => c.id);
    ctx.body = { missingSkins, missingCapes };
  },

  async purgeMissing(ctx: KoaContext) {
    const [allSkins, allCapes] = await Promise.all([
      strapi.db.query(SKIN_UID).findMany({}),
      strapi.db.query(CAPE_UID).findMany({}),
    ]);
    const missingSkins = (allSkins as Array<{ id: number; filePath: string }>).filter(
      (s) => !existsSync(s.filePath),
    );
    const missingCapes = (allCapes as Array<{ id: number; filePath: string }>).filter(
      (c) => !existsSync(c.filePath),
    );
    await Promise.all([
      ...missingSkins.map((s) => strapi.db.query(SKIN_UID).delete({ where: { id: s.id } })),
      ...missingCapes.map((c) => strapi.db.query(CAPE_UID).delete({ where: { id: c.id } })),
    ]);
    ctx.body = { deletedSkins: missingSkins.length, deletedCapes: missingCapes.length };
  },
});

export default skinController;
