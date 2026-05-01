// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const destroy = (_: { strapi: any }): void => {
  // No cleanup needed
};

export default destroy;
