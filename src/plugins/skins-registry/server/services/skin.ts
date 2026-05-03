import type { StrapiInstance } from '../types';
import type { PlayerSkin, PlayerCape } from '../../shared/types/entities';

const SKIN_UID = 'plugin::skins-registry.player-skin' as const;
const CAPE_UID = 'plugin::skins-registry.player-cape' as const;

type AssetUID = typeof SKIN_UID | typeof CAPE_UID;
type SkinData = { filePath: string; fileUrl: string; fileSize?: number; username?: string };
type FindManyOpts = { page?: number; pageSize?: number; search?: string };
type FindManyResult<T> = { data: T[]; total: number };

export const buildWhereClause = (search?: string): Record<string, unknown> =>
  search ? { $or: [{ username: { $containsi: search } }] } : {};

const skinService = ({ strapi }: { strapi: StrapiInstance }) => {
  const db = strapi.db;

  const findManyAssets = async <T>(
    uid: AssetUID,
    { page = 1, pageSize = 25, search }: FindManyOpts,
  ): Promise<FindManyResult<T>> => {
    const where = buildWhereClause(search);
    const [data, total] = await Promise.all([
      db.query(uid).findMany({
        where,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        orderBy: { updatedAt: 'desc' },
      }),
      db.query(uid).count({ where }),
    ]);
    return { data: data as T[], total };
  };

  const upsertAsset = async <T>(uid: AssetUID, userId: number, data: SkinData): Promise<T> => {
    const existing = await db.query(uid).findOne({ where: { userId } });
    if (existing) {
      return db.query(uid).update({ where: { userId }, data }) as Promise<T>;
    }
    return db.query(uid).create({ data: { userId, ...data } }) as Promise<T>;
  };

  const deleteAssetByUserId = async (uid: AssetUID, userId: number): Promise<void> => {
    const existing = await db.query(uid).findOne({ where: { userId } });
    if (existing) await db.query(uid).delete({ where: { userId } });
  };

  return {
    findSkinByUserId: (userId: number): Promise<PlayerSkin | null> =>
      db.query(SKIN_UID).findOne({ where: { userId } }) as Promise<PlayerSkin | null>,

    findCapeByUserId: (userId: number): Promise<PlayerCape | null> =>
      db.query(CAPE_UID).findOne({ where: { userId } }) as Promise<PlayerCape | null>,

    upsertSkin: (userId: number, data: SkinData): Promise<PlayerSkin> =>
      upsertAsset<PlayerSkin>(SKIN_UID, userId, data),

    upsertCape: (userId: number, data: SkinData): Promise<PlayerCape> =>
      upsertAsset<PlayerCape>(CAPE_UID, userId, data),

    deleteSkinByUserId: (userId: number): Promise<void> => deleteAssetByUserId(SKIN_UID, userId),

    deleteCapeByUserId: (userId: number): Promise<void> => deleteAssetByUserId(CAPE_UID, userId),

    findManySkins: (opts: FindManyOpts): Promise<FindManyResult<PlayerSkin>> =>
      findManyAssets<PlayerSkin>(SKIN_UID, opts),

    findManyCapes: (opts: FindManyOpts): Promise<FindManyResult<PlayerCape>> =>
      findManyAssets<PlayerCape>(CAPE_UID, opts),
  };
};

export default skinService;
