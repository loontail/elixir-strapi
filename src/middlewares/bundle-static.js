'use strict';

const fs = require('fs');
const path = require('path');

const PREFIX = '/bundle-registry/builds/';

module.exports = (_config, { strapi }) => {
  return async (ctx, next) => {
    if (ctx.method !== 'GET' && ctx.method !== 'HEAD') return next();
    if (!ctx.path.startsWith(PREFIX)) return next();

    const publicDir = path.resolve(strapi.dirs.static.public);
    let decodedPath;
    try {
      decodedPath = decodeURIComponent(ctx.path);
    } catch {
      ctx.status = 400;
      return;
    }

    const filePath = path.resolve(publicDir, '.' + decodedPath);
    if (!filePath.startsWith(publicDir + path.sep) && filePath !== publicDir) {
      ctx.status = 403;
      return;
    }

    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      return next();
    }
    if (!stat.isFile()) return next();

    ctx.set('Content-Length', String(stat.size));
    ctx.set('Cache-Control', 'public, max-age=60');
    const ext = path.extname(filePath).toLowerCase();
    ctx.type = ext || 'application/octet-stream';
    if (ctx.method === 'HEAD') {
      ctx.status = 200;
      return;
    }
    ctx.body = fs.createReadStream(filePath);
  };
};
