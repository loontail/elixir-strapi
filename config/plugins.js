module.exports = ({ env }) => ({
  'metadata': {
    enabled: true,
    resolve: './src/plugins/metadata',
    config: {
      downloadsPath: env('DOWNLOADS_PATH'),
      downloadUrl: env('DOWNLOAD_URL'),
    }
  },
});
