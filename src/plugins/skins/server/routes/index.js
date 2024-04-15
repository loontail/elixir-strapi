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
  {
    method: 'POST',
    path: '/:username/upload-cape',
    handler: 'capeUploader.index',
    config: {
      policies: [],
      auth: false
    },
  },
  {
    method: 'POST',
    path: '/:username/clear',
    handler: 'clearSkinInfo.index',
    config: {
      policies: [],
      auth: false
    },
  }
];
