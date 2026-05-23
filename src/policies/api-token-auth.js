'use strict';

// Validates the static admin API token shipped with the launcher.
//
// The launcher holds the raw token in env (`API_TOKEN`); Strapi stores its
// SHA-512 hash in `strapi_api_tokens.access_key`. We hash the bearer header
// and look up by `accessKey` — anything else (UI-generated tokens that use
// HMAC, missing/invalid headers) is rejected.
//
// Use via `policies: ['global::api-token-auth']` for endpoints that are not
// scoped to a logged-in user (catalogue, manifests). Account-scoped routes
// must use the users-permissions JWT instead.

const { createHash } = require('crypto');

const getAuthHeader = (header) => header.authorization || header.Authorization;

module.exports = async (ctx, _config, { strapi }) => {
  const auth = getAuthHeader(ctx.request.header);
  if (!auth || !auth.startsWith('Bearer ')) return false;

  const rawToken = auth.slice('Bearer '.length).trim();
  if (!rawToken) return false;

  const accessKey = createHash('sha512').update(rawToken).digest('hex');
  const record = await strapi.db.query('admin::api-token').findOne({ where: { accessKey } });
  return Boolean(record);
};
