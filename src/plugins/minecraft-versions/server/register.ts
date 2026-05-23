import type { StrapiInstance } from './types';

const PLUGIN_NAME = 'minecraft-versions';

const CUSTOM_FIELD_NAMES: readonly string[] = [
  'minecraft-version-picker',
  'forge-version-picker',
  'fabric-version-picker',
  'runtime-version-picker',
] as const;

const register = ({ strapi }: { strapi: StrapiInstance }): void => {
  for (const name of CUSTOM_FIELD_NAMES) {
    strapi.customFields.register({
      name,
      plugin: PLUGIN_NAME,
      type: 'string',
    });
  }
};

export default register;
