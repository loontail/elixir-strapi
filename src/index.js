'use strict';

// Permissions granted to the `Authenticated` role on first boot. These match
// the JWT-protected mutation routes the launcher now uses. Idempotent — only
// missing rows are inserted, existing ones are left alone.
const AUTHENTICATED_PERMISSIONS = [
  'plugin::skins-registry.skin.uploadSkin',
  'plugin::skins-registry.skin.uploadCape',
  'plugin::skins-registry.skin.deleteSkin',
  'plugin::skins-registry.skin.deleteCape',
  'plugin::skins-registry.skin.deletePlayerAssets',
  'plugin::users-permissions.user.update',
];

const grantAuthenticatedPermissions = async (strapi) => {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });
  if (!role) {
    strapi.log.warn(
      'Authenticated role not found — skipping launcher permissions bootstrap. Set them manually in Settings → Users & Permissions → Roles → Authenticated.',
    );
    return;
  }

  for (const action of AUTHENTICATED_PERMISSIONS) {
    const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: role.id },
    });
    if (existing) continue;
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: role.id },
    });
    strapi.log.info(`Granted "${action}" to Authenticated role`);
  }
};

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    try {
      await grantAuthenticatedPermissions(strapi);
    } catch (error) {
      strapi.log.warn(
        `Could not bootstrap Authenticated role permissions: ${error?.message || error}. Configure them manually in Strapi admin.`,
      );
    }
  },
};
