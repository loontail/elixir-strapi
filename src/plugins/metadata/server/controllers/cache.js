'use strict';

module.exports = ({ strapi }) => ({
  clearCache(ctx) {
    ctx.body = strapi.plugin('metadata').service('cache').clearCache();
  }
});
