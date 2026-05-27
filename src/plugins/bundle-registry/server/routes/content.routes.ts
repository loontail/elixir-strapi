const contentRoutes = {
  type: 'content-api',
  routes: [
    // Public read-only catalogue data: filenames, sha256 hashes, download
    // URLs. The launcher uses it to compare against the local copy and
    // decide whether to sync. No PII, no auth secrets, no per-user view —
    // anyone able to reach the Strapi instance can fetch it. Admin
    // mutations (create / update / delete builds) live in admin.routes.ts
    // and are gated by the admin namespace's JWT.
    {
      method: 'GET',
      path: '/builds/:slug/manifest',
      handler: 'manifest.getManifest',
      config: { auth: false },
    },
  ],
};

export default contentRoutes;
