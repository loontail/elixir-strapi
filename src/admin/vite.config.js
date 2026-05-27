// Strapi 5's admin panel boots through Vite in `strapi develop` mode and
// looks for a user override at `src/admin/vite.config.{js,mjs,ts,mts}`.
// The exported function receives the default config Strapi composed and
// returns the final config.
//
// Vite blocks requests whose `Host` header isn't on its `allowedHosts`
// list as a DNS-rebinding mitigation. When this Strapi sits behind
// Cloudflare (or any reverse proxy), the public hostname must be allowed,
// otherwise visits through that hostname die with:
//
//   Blocked request. This host (...) is not allowed.
//
// `allowedHosts: true` permits everything — fine here because the dev
// server binds to a local interface only; the only inbound path is the
// Cloudflare tunnel, which already authenticates the tunnel client.
// Tighten this to an explicit `string[]` if you need DNS-rebinding
// protection on a directly-reachable port.
//
// Pattern + recommendation:
//   https://forum.strapi.io/t/server-allowedhosts-in-vite-config-js/52759
//   https://docs.strapi.io/dev-docs/admin-panel-customization/bundlers

const { mergeConfig } = require('vite');

module.exports = (config) =>
  mergeConfig(config, {
    server: {
      allowedHosts: true,
    },
  });
