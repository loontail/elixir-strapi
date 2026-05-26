module.exports = ({ env }) => ({
  'minecraft-versions': {
    enabled: true,
    resolve: './src/plugins/minecraft-versions',
  },
  'bundle-registry': {
    enabled: true,
    resolve: './src/plugins/bundle-registry',
    config: {
      // Base URL used when building file download URLs inside artifacts.json.
      // Defaults to Strapi's server.url. Set this to your CDN/nginx domain in production.
      publicUrl: env('BUNDLE_REGISTRY_PUBLIC_URL', env('FILE_LIBRARY_PUBLIC_URL', '')),
      // Maximum total uncompressed size of an uploaded ZIP archive (bytes). Default: 10 GB.
      maxZipSize: 10 * 1024 * 1024 * 1024,
      // Maximum number of entries allowed in an uploaded ZIP archive.
      maxZipEntries: 100000,
    },
  },
  // Yggdrasil-compatible Minecraft auth + session server. Mounted under /api/yggdrasil.
  // The plugin adds a single `uuid` column to up_users at bootstrap; nothing else
  // in this Strapi project changes when the plugin is enabled.
  yggdrasil: {
    enabled: true,
    resolve: '@loontail/strapi-plugin-yggdrasil',
    config: {
      publicUrl: env('YGGDRASIL_PUBLIC_URL', ''),
      skinDomains: env.array('YGGDRASIL_SKIN_DOMAINS', []),
      serverName: env('YGGDRASIL_SERVER_NAME', 'Loontail Yggdrasil'),
      tokens: {
        accessTtlSeconds: env.int('YGGDRASIL_TOKEN_TTL', 60 * 60 * 24 * 15),
        maxPerUser: env.int('YGGDRASIL_TOKEN_CAP', 10),
      },
      privateKeyPath: env('YGGDRASIL_PRIVATE_KEY_PATH', 'data/yggdrasil/keys/active.key.pem'),
      joinBackend: env('YGGDRASIL_JOIN_BACKEND', 'memory'),
    },
  },
});
