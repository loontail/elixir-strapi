interface ContentRouteConfig {
  type: 'content-api';
  routes: Array<{
    method: string;
    path: string;
    handler: string;
    config: { auth: boolean; policies: unknown[] };
  }>;
}

const contentRoutes: ContentRouteConfig = {
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
