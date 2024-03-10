'use strict';

module.exports = ({ strapi }) => ({
  index(ctx) {
    const { client } = ctx.params;
    try {
      ctx.body = strapi
        .plugin('metadata')
        .service('versionHash')
        .getClientVersionHash(client);
    } catch (err) {
      if (err.message.includes('does not exist')) {
        ctx.notFound();
        return null;
      }
      ctx.badRequest(err.message);
    }
  }
});
