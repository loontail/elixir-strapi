import { createHash } from 'crypto';
import apiTokenAuth from '../policies/api-token-auth';

type PolicyCtx = { request: { header: Record<string, string> } };

const makePolicyCtx = (authHeader?: string): PolicyCtx => ({
  request: {
    header: authHeader ? { authorization: authHeader } : {},
  },
});

const makeStrapi = (tokenRecord: unknown) => {
  const findOne = jest.fn().mockResolvedValue(tokenRecord);
  const query = jest.fn(() => ({ findOne }));
  return {
    db: { query },
    _findOne: findOne,
    _query: query,
  };
};

describe('api-token-auth policy', () => {
  it('returns true when a valid Bearer token matches a DB record', async () => {
    const rawToken = 'my-secret-token';
    const expectedHash = createHash('sha512').update(rawToken).digest('hex');
    const strapi = makeStrapi({ id: 1, accessKey: expectedHash });

    const result = await apiTokenAuth(makePolicyCtx(`Bearer ${rawToken}`), null, {
      strapi: strapi as never,
    });

    expect(result).toBe(true);
    expect(strapi._query).toHaveBeenCalledWith('admin::api-token');
    expect(strapi._findOne).toHaveBeenCalledWith({ where: { accessKey: expectedHash } });
  });

  it('returns false when no Authorization header is present', async () => {
    const strapi = makeStrapi(null);

    const result = await apiTokenAuth(makePolicyCtx(), null, { strapi: strapi as never });

    expect(result).toBe(false);
    expect(strapi._query).not.toHaveBeenCalled();
  });

  it('returns false when Authorization header does not start with Bearer', async () => {
    const strapi = makeStrapi({ id: 1 });

    const result = await apiTokenAuth(makePolicyCtx('Basic abc123'), null, {
      strapi: strapi as never,
    });

    expect(result).toBe(false);
    expect(strapi._query).not.toHaveBeenCalled();
  });

  it('returns false when token does not match any DB record', async () => {
    const strapi = makeStrapi(null);

    const result = await apiTokenAuth(makePolicyCtx('Bearer invalid-token'), null, {
      strapi: strapi as never,
    });

    expect(result).toBe(false);
  });

  it('uses SHA-512 hash of the raw token for the DB lookup', async () => {
    const rawToken = 'abc';
    const expectedHash = createHash('sha512').update(rawToken).digest('hex');
    const strapi = makeStrapi({ id: 1 });

    await apiTokenAuth(makePolicyCtx(`Bearer ${rawToken}`), null, { strapi: strapi as never });

    expect(strapi._findOne).toHaveBeenCalledWith({ where: { accessKey: expectedHash } });
  });

  it('accepts Authorization header with uppercase A', async () => {
    const rawToken = 'uppercase-test';
    const policyCtx: PolicyCtx = { request: { header: { Authorization: `Bearer ${rawToken}` } } };
    const strapi = makeStrapi({ id: 1 });

    const result = await apiTokenAuth(policyCtx, null, { strapi: strapi as never });

    expect(result).toBe(true);
  });
});
