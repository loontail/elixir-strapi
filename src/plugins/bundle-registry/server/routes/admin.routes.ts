const adminRoutes = {
  type: 'admin',
  routes: [
    { method: 'GET', path: '/disk-space', handler: 'build.diskSpace', config: { policies: [] } },
    { method: 'GET', path: '/builds', handler: 'build.find', config: { policies: [] } },
    { method: 'POST', path: '/builds', handler: 'build.create', config: { policies: [] } },
    { method: 'GET', path: '/builds/:slug', handler: 'build.findOne', config: { policies: [] } },
    { method: 'PUT', path: '/builds/:slug', handler: 'build.update', config: { policies: [] } },
    { method: 'DELETE', path: '/builds/:slug', handler: 'build.delete', config: { policies: [] } },
    {
      method: 'POST',
      path: '/builds/:slug/upload',
      handler: 'build.uploadArchive',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/regenerate',
      handler: 'build.regenerateManifest',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/validate',
      handler: 'build.validate',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/files',
      handler: 'build.uploadFile',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/files/bulk-delete',
      handler: 'build.bulkDeleteFiles',
      config: { policies: [] },
    },
    {
      method: 'DELETE',
      path: '/builds/:slug/files/:entryId',
      handler: 'build.deleteFile',
      config: { policies: [] },
    },
    {
      method: 'PUT',
      path: '/builds/:slug/files/:entryId',
      handler: 'build.updateFile',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/files/:entryId/rename',
      handler: 'build.renameFile',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/builds/:slug/files/:entryId/rehash',
      handler: 'build.rehashFile',
      config: { policies: [] },
    },
  ],
};

export default adminRoutes;
