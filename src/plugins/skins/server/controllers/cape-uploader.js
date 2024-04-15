'use strict';
const { copyFileSync } = require('fs');
const { join } = require('path');

module.exports = ({ strapi }) => ({
  index(ctx) {
    try {
      const {username} = ctx.params
      const { path, type } = ctx.request.files.skin;
      const skinsPath = strapi.plugin('skins').config('skinsPath');

      if (type !== 'image/png') {
        ctx.badRequest(new Error('Invalid file type'))
      } else {
        const userSkinsPath = join(skinsPath, `${username}_cape.png`);

        copyFileSync(path, userSkinsPath)

        ctx.body = userSkinsPath
      }
    } catch (error) {
      ctx.badRequest(error.message)
    }
  },
});
