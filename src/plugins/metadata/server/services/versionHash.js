'use strict';

const fs = require('fs');
const path = require('path');

module.exports = ({ strapi }) => ({
  getClientVersionHash(clientSlug) {
    const downloadsRoot = strapi.plugin('metadata').config('downloadsPath');
    const clientRoot = path.join(downloadsRoot, clientSlug);

    if (!fs.existsSync(clientRoot)) {
      throw new Error(`Client ${clientSlug} does not exist`);
    }

    const versionHashPath = path.join(clientRoot, 'version-hash');

    if (!fs.existsSync(versionHashPath)) {
      throw new Error(`Client ${clientSlug} does not have a version hash`);
    }

    return fs.readFileSync(versionHashPath, 'utf8');
  },
});
