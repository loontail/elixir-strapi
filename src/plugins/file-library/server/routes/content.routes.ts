const contentRoutes = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/builds/:slug/manifest',
      handler: 'manifest.getManifest',
      config: { auth: false, policies: [] },
    },
  ],
};

export default contentRoutes;
