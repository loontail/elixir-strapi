const contentRoutes = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/player/:userId',
      handler: 'skin.getPlayerAssets',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'GET',
      path: '/skin/:userId',
      handler: 'skin.getSkin',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'GET',
      path: '/cape/:userId',
      handler: 'skin.getCape',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'POST',
      path: '/skin/:userId',
      handler: 'skin.uploadSkin',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'POST',
      path: '/cape/:userId',
      handler: 'skin.uploadCape',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'DELETE',
      path: '/player/:userId',
      handler: 'skin.deletePlayerAssets',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'DELETE',
      path: '/skin/:userId',
      handler: 'skin.deleteSkin',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
    {
      method: 'DELETE',
      path: '/cape/:userId',
      handler: 'skin.deleteCape',
      config: { auth: false, policies: ['plugin::skins-registry.api-token-auth'] },
    },
  ],
};

export default contentRoutes;
