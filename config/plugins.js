module.exports = ({ env }) => ({
  'skins': {
    enabled: true,
    resolve: './src/plugins/skins',
    config: {
      skinsPath: env('SKINS_PATH'),
    }
  },
});
