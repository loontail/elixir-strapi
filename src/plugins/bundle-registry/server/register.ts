import type { StrapiInstance } from './types';

const register = ({ strapi }: { strapi: StrapiInstance }): void => {
  // Register the custom field so it appears in the Content-Type Builder
  strapi.customFields.register({
    name: 'build-picker',
    plugin: 'bundle-registry',
    type: 'string',
  });
};

export default register;
