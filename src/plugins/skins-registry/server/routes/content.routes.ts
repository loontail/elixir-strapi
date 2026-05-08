const contentRoutes = {
  type: 'content-api',
  routes: [
    {
      method: 'GET',
      path: '/player/:userId',
      handler: 'skin.getPlayerAssets',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/skin/:userId',
      handler: 'skin.getSkin',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/cape/:userId',
      handler: 'skin.getCape',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/skin/:userId',
      handler: 'skin.uploadSkin',
    },
    {
      method: 'POST',
      path: '/cape/:userId',
      handler: 'skin.uploadCape',
    },
    {
      method: 'DELETE',
      path: '/player/:userId',
      handler: 'skin.deletePlayerAssets',
    },
    {
      method: 'DELETE',
      path: '/skin/:userId',
      handler: 'skin.deleteSkin',
    },
    {
      method: 'DELETE',
      path: '/cape/:userId',
      handler: 'skin.deleteCape',
    },
  ],
};

export default contentRoutes;
