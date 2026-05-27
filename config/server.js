module.exports = ({ env }) => {
  const port = env.int("PORT", 80);

  return {
    host: env("HOST", "0.0.0.0"),
    port,
    url: env("URL", `http://localhost:${port}`),
    // Trust X-Forwarded-* headers from Cloudflare (and any other reverse
    // proxy that fronts this origin). Without this, Strapi sees the raw
    // request as plain HTTP from the tunnel and emits redirects /
    // absolute URLs pointing at `host:port` instead of the public origin.
    proxy: env.bool("PROXY", true),
    app: {
      keys: env.array("APP_KEYS"),
    },
    webhooks: {
      populateRelations: env.bool("WEBHOOKS_POPULATE_RELATIONS", false),
    },
  };
};
