module.exports = ({ env }) => ({
  'skins-registry': {
    enabled: true,
    resolve: './src/plugins/skins-registry',
  },
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
});
