'use strict';

module.exports = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/builds/:slug/manifest',
      handler: 'manifest.getManifest',
      config: {
        auth: false,
        policies: [],
      },
    },
  ],
};
