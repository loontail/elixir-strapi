/**
 * Strapi content-type UIDs for the skins-registry plugin. The string
 * shape (`plugin::<plugin-id>.<content-type>`) is what `strapi.db.query`
 * expects — typing it as a `const` here means TypeScript flags any
 * drift at compile time and call sites stop carrying their own copies.
 */
export const PLUGIN_ID = 'skins-registry' as const;

export const SKIN_UID = `plugin::${PLUGIN_ID}.player-skin` as const;
export const CAPE_UID = `plugin::${PLUGIN_ID}.player-cape` as const;

export type SkinsRegistryUid = typeof SKIN_UID | typeof CAPE_UID;
