// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const register = ({ strapi }: { strapi: any }): void => {
  // Register the custom field so it appears in the Content-Type Builder
  strapi.customFields.register({
    name: 'build-picker',
    plugin: 'file-library',
    type: 'string',
  });
};

export default register;
