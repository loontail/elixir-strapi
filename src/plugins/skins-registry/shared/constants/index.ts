export { PLUGIN_ID, SKIN_UID, CAPE_UID, type SkinsRegistryUid } from './uids';

/**
 * Maximum allowed upload size for a skin or cape PNG. Real Minecraft
 * skins are 64×64 (~5 KB) and the largest legitimate HD pack is 128×128
 * (~20 KB), so 256 KB is a generous ceiling that still blocks an
 * accidental or malicious multi-MB PNG from filling the disk.
 */
export const MAX_SKIN_UPLOAD_BYTES = 256 * 1024;
