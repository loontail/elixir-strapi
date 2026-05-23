'use strict';

// The host Strapi project is JavaScript-only and does not register ts-node.
// Register it here so Node.js can load the TypeScript server files directly
// without a compile step during development.
require('ts-node').register({
  project: require('path').join(__dirname, 'server', 'tsconfig.json'),
  transpileOnly: true,
  // composite + noEmit conflict in tsconfig; override here for the ts-node context
  compilerOptions: { composite: false, noEmit: false },
});

module.exports = require('./server');
