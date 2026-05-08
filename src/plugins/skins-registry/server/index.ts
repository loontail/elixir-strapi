import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import controllers from './controllers';
import routes from './routes';
import middlewares from './middlewares';
import services from './services';
import apiTokenAuth from './policies/api-token-auth';

const contentTypes = {
  'player-skin': { schema: require('./content-types/player-skin/schema.json') },
  'player-cape': { schema: require('./content-types/player-cape/schema.json') },
};

const policies = {
  'api-token-auth': apiTokenAuth,
};

export default {
  register,
  bootstrap,
  destroy,
  config,
  controllers,
  routes,
  services,
  middlewares,
  policies,
  contentTypes,
};
