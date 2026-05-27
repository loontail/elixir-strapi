// Strapi 5's admin panel boots through Vite in `strapi develop` mode and
// looks for a user override at `src/admin/vite.config.{js,mjs,ts,mts}`.
// The exported function receives the default config Strapi composed and
// returns the final config (Strapi just calls `userConfig(defaultConfig)`).
//
// Vite blocks requests whose `Host` header isn't on its `allowedHosts`
// list as a DNS-rebinding mitigation. When this Strapi sits behind
// Cloudflare (or any reverse proxy), the public hostname must be added,
// otherwise visits through that hostname die with:
//
//   Blocked request. This host (...) is not allowed.
//   To allow this host, add "..." to `server.allowedHosts` in vite.config.js.
//
// Derive the allowlist from the same `URL` env that `config/server.js`
// uses for `server.url` — one env var drives both the public origin and
// the admin allowlist. Localhost stays in for direct local-dev access.

const publicUrl = process.env.URL ?? '';
let publicHost = null;
try {
  publicHost = publicUrl ? new URL(publicUrl).hostname : null;
} catch {
  publicHost = null;
}

const allowedHosts = ['localhost', '127.0.0.1', ...(publicHost ? [publicHost] : [])];

module.exports = (config) => ({
  ...config,
  server: {
    ...(config.server ?? {}),
    allowedHosts,
  },
});
