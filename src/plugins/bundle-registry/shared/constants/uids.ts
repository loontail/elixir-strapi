import { PLUGIN_ID } from './permissions';

/**
 * Strapi content-type UIDs for the bundle-registry plugin. The string
 * shape (`plugin::<plugin-id>.<content-type>`) is what `strapi.db.query`
 * and `strapi.documents` expect — typing them as a `const` union here
 * means TypeScript flags any drift at compile time.
 */
export const BUILD_UID = `plugin::${PLUGIN_ID}.build` as const;
export const ARTIFACT_UID = `plugin::${PLUGIN_ID}.artifact` as const;

export type BundleRegistryUid = typeof BUILD_UID | typeof ARTIFACT_UID;
