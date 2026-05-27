module.exports = ({ env }) => {
  // 2052 is one of Cloudflare's proxied ports — the public edge fronts this
  // local Strapi and (optionally) terminates TLS upstream, so the origin
  // can stay on plain HTTP with no local SSL plumbing. Override via the
  // PORT env when running elsewhere.
  const port = env.int('PORT', 2052);

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
