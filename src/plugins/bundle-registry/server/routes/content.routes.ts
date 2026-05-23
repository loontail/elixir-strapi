// Bundle manifests are catalogue data — not scoped to a logged-in user —
// but they should still require the static API token. Without it, anyone
// hitting the public URL could enumerate builds.
const API_TOKEN_ONLY = { auth: false, policies: ['global::api-token-auth'] };

const contentRoutes = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/builds/:slug/manifest',
      handler: 'manifest.getManifest',
      config: API_TOKEN_ONLY,
    },
  ],
};

export default contentRoutes;
