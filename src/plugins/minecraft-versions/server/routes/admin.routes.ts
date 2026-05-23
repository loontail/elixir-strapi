// Strapi auto-prefixes admin plugin routes with `/<plugin-name>` and
// content-api plugin routes with `/api/<plugin-name>`. The version-picker
// custom fields call these endpoints from the Strapi admin UI through
// `useFetchClient` (no `/api` prefix), so the routes must be mounted as
// `admin` and declared with bare paths (no plugin-name prefix).
const adminRoutes = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/minecraft',
      handler: 'minecraftVersions.listMinecraft',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/forge',
      handler: 'minecraftVersions.listForge',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/fabric',
      handler: 'minecraftVersions.listFabric',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/runtime',
      handler: 'minecraftVersions.listRuntime',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/runtime/recommend',
      handler: 'minecraftVersions.recommendRuntime',
      config: { policies: [] },
    },
  ],
};

export default adminRoutes;
