// Mutating endpoints (skin/cape upload + delete) must enforce the
// admin-API-token policy. The launcher's main process holds the token in
// `mainConfig.apiToken` and forwards it as `Authorization: Bearer <token>`;
// without `api-token-auth` here, Strapi would fall back to the default
// users-permissions JWT chain and reject those calls.
//
// Read endpoints intentionally stay `auth: false`: skins/capes are public
// assets surfaced to the in-game viewer.
const PROTECTED = { policies: ['plugin::skins-registry.api-token-auth'] };

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
      config: PROTECTED,
    },
    {
      method: 'POST',
      path: '/cape/:userId',
      handler: 'skin.uploadCape',
      config: PROTECTED,
    },
    {
      method: 'DELETE',
      path: '/player/:userId',
      handler: 'skin.deletePlayerAssets',
      config: PROTECTED,
    },
    {
      method: 'DELETE',
      path: '/skin/:userId',
      handler: 'skin.deleteSkin',
      config: PROTECTED,
    },
    {
      method: 'DELETE',
      path: '/cape/:userId',
      handler: 'skin.deleteCape',
      config: PROTECTED,
    },
  ],
};

export default contentRoutes;
