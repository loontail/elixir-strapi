module.exports = ({ env }) => {
  // 2053 is one of Cloudflare's HTTPS-proxied ports — the public edge can
  // terminate TLS for a tunnel pointing at this local Strapi without any
  // local SSL plumbing. Override via the PORT env when running elsewhere.
  const port = env.int('PORT', 2053);

  return {
    host: env('HOST', '0.0.0.0'),
    port,
    // Public origin that built URLs (skin URLs in profile payloads, bundle
    // file URLs in manifests, etc) get prefixed with. In dev this is the
    // bare loopback; in production set URL to the Cloudflare hostname (e.g.
    // `https://auth.example.com`) so the framework and every downstream
    // service derive absolute URLs against the same value.
    url: env('URL', `http://localhost:${port}`),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
