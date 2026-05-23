// Mutating endpoints (skin/cape upload + delete) require a logged-in user.
// Strapi's users-permissions middleware enforces the JWT before the policy
// chain runs; `global::self-only` then rejects calls where the JWT identity
// doesn't match the `:userId` in the URL — that's how we prevent a holder
// of any valid session from overwriting another player's skin.
//
// First-time setup: the `Authenticated` role needs the
// `skins-registry.skin.uploadSkin / uploadCape / deleteSkin / deleteCape /
// deletePlayerAssets` permissions enabled (Strapi admin → Settings →
// Users & Permissions → Roles → Authenticated). The launcher's bootstrap
// flow does this on first start; the comment is left so manual setups know
// what to flip.
//
// Read endpoints stay `auth: false`: skins/capes are public assets surfaced
// to the in-game viewer.
const SELF_ONLY = { policies: [{ name: 'global::self-only', config: { param: 'userId' } }] };

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
      config: SELF_ONLY,
    },
    {
      method: 'POST',
      path: '/cape/:userId',
      handler: 'skin.uploadCape',
      config: SELF_ONLY,
    },
    {
      method: 'DELETE',
      path: '/player/:userId',
      handler: 'skin.deletePlayerAssets',
      config: SELF_ONLY,
    },
    {
      method: 'DELETE',
      path: '/skin/:userId',
      handler: 'skin.deleteSkin',
      config: SELF_ONLY,
    },
    {
      method: 'DELETE',
      path: '/cape/:userId',
      handler: 'skin.deleteCape',
      config: SELF_ONLY,
    },
  ],
};

export default contentRoutes;
