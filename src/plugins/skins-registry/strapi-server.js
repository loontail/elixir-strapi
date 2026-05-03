'use strict';

require('ts-node').register({
  project: require('path').join(__dirname, 'server', 'tsconfig.json'),
  transpileOnly: true,
  compilerOptions: { composite: false, noEmit: false },
});

module.exports = require('./server');
