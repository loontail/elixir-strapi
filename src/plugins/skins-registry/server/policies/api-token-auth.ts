import { createHash } from 'crypto';
import type { StrapiInstance } from '../types';

interface PolicyCtx {
  request: { header: Record<string, string> };
}

const getAuthHeader = (header: Record<string, string>): string | undefined =>
  header.authorization || header.Authorization;

const apiTokenAuth = async (
  ctx: PolicyCtx,
  _config: unknown,
  { strapi }: { strapi: StrapiInstance },
): Promise<boolean> => {
  const auth = getAuthHeader(ctx.request.header);
  if (!auth || !auth.startsWith('Bearer ')) return false;

  const rawToken = auth.slice('Bearer '.length).trim();
  if (!rawToken) return false;

  const accessKey = createHash('sha512').update(rawToken).digest('hex');
  const record = await strapi.db.query('admin::api-token').findOne({ where: { accessKey } });
  return Boolean(record);
};

export default apiTokenAuth;
