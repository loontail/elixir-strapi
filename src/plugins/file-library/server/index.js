'use strict';

const register = require('./register');
const bootstrap = require('./bootstrap');
const destroy = require('./destroy');
const config = require('./config');
const controllers = require('./controllers');
const routes = require('./routes');
const middlewares = require('./middlewares');
const services = require('./services');

const contentTypes = {
  'file-build': { schema: require('./content-types/file-build/schema.json') },
  'file-entry': { schema: require('./content-types/file-entry/schema.json') },
};

module.exports = {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  middlewares,
  contentTypes,
};
