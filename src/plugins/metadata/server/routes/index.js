module.exports = [
  {
    method: 'GET',
    path: '/m/:client',
    handler: 'clientMetadata.index',
    config: {
      policies: [],
      auth: false
    }
  },
  {
    method: 'GET',
    path: '/m/:client/version-hash',
    handler: 'versionHash.index',
    config: {
      policies: [],
      auth: false
    }
  },
  {
      method: 'GET',
      path: '/clear-cache',
      handler: 'cache.clearCache',
      config: {
        policies: [],
        auth: false
      }
  }
];
