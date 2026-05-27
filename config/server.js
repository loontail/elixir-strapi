module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  // 2053 is one of Cloudflare's HTTPS-proxied ports — the public edge can
  // terminate TLS for a tunnel pointing at this local Strapi without any
  // local SSL plumbing. Override via the PORT env when running elsewhere.
  port: env.int('PORT', 2053),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
});
