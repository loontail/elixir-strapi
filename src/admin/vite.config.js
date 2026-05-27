// Allow any Host header through Vite's dev-server guard so the admin
// panel works through Cloudflare. The dev port is local-only; the
// tunnel is the only inbound path.
const { mergeConfig } = require('vite');

module.exports = (config) => mergeConfig(config, { server: { allowedHosts: true } });
