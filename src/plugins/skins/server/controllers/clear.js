'use strict';
const { rmSync } = require('fs');
const { join } = require('path');

module.exports = ({ strapi }) => ({
  index(ctx) {
    try {
      const {username} = ctx.params
      const skinsPath = strapi.plugin('skins').config('skinsPath');

      const userSkinsPath = join(skinsPath, `${username}.png`);
      const userCapePath = join(skinsPath, `${username}_cape.png`);

      rmSync(userSkinsPath);
      rmSync(userCapePath);

      ctx.body = 'Cleared'
    } catch (error) {
      ctx.badRequest(error.message)
    }
  },
});
