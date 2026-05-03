const adminRoutes = {
  type: 'admin',
  routes: [
    {
      method: 'GET',
      path: '/skins',
      handler: 'skin.listSkins',
      config: { policies: [] },
    },
    {
      method: 'GET',
      path: '/capes',
      handler: 'skin.listCapes',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/upload/skin',
      handler: 'skin.adminUploadSkin',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/upload/cape',
      handler: 'skin.adminUploadCape',
      config: { policies: [] },
    },
    {
      method: 'DELETE',
      path: '/skins/:id',
      handler: 'skin.adminDeleteSkin',
      config: { policies: [] },
    },
    {
      method: 'DELETE',
      path: '/capes/:id',
      handler: 'skin.adminDeleteCape',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/validate',
      handler: 'skin.validate',
      config: { policies: [] },
    },
    {
      method: 'POST',
      path: '/purge-missing',
      handler: 'skin.purgeMissing',
      config: { policies: [] },
    },
  ],
};

export default adminRoutes;
