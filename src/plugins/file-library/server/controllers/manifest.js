'use strict';

const { readFileSync, existsSync } = require('fs');
const storage = require('../services/storage');

module.exports = ({ strapi }) => ({
  async getManifest(ctx) {
    const { slug } = ctx.params;
    const manifestPath = storage.getManifestPath(slug);

    if (!existsSync(manifestPath)) {
      return ctx.notFound('Manifest not found. Build may not be ready yet.');
    }

    ctx.set('Content-Type', 'application/json');
    ctx.set('Cache-Control', 'no-cache');
    ctx.body = readFileSync(manifestPath, 'utf8');
  },
});
