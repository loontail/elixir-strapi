module.exports = ({ env }) => ({
  'skins': {
    enabled: true,
    resolve: './src/plugins/skins',
    config: {
      skinsPath: env('SKINS_PATH'),
    }
  },
  'file-library': {
    enabled: true,
    resolve: './src/plugins/file-library',
    config: {
      // Base URL used when building file download URLs inside artifacts.json.
      // Defaults to Strapi's server.url. Set this to your CDN/nginx domain in production.
      publicUrl: env('FILE_LIBRARY_PUBLIC_URL', ''),
      // Maximum total uncompressed size of an uploaded ZIP archive (bytes). Default: 10 GB.
      maxZipSize: 10 * 1024 * 1024 * 1024,
      // Maximum number of entries allowed in an uploaded ZIP archive.
      maxZipEntries: 100000,
    },
  },
});
