import { createHash } from 'crypto';

export default async (
  policyContext: { request: { header: Record<string, string> } },
  _config: unknown,
  {
    strapi,
  }: {
    strapi: { db: { query: (uid: string) => { findOne: (opts: unknown) => Promise<unknown> } } };
  },
): Promise<boolean> => {
  const authHeader =
    policyContext.request.header['authorization'] || policyContext.request.header['Authorization'];

  if (!authHeader?.startsWith('Bearer ')) return false;

  const rawToken = authHeader.slice(7).trim();
  const accessKey = createHash('sha512').update(rawToken).digest('hex');

  const token = await strapi.db.query('admin::api-token').findOne({
    where: { accessKey },
  });

  return Boolean(token);
};
