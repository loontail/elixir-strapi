module.exports = [
  {
    method: 'POST',
    path: '/:username/upload-skin',
    handler: 'skinUploader.index',
    config: {
      policies: [],
      auth: false
    },
  },
];
