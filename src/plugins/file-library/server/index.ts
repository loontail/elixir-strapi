import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import controllers from './controllers';
import routes from './routes';
import middlewares from './middlewares';
import services from './services';

const contentTypes = {
  'file-build': { schema: require('./content-types/file-build/schema.json') },
  'file-entry': { schema: require('./content-types/file-entry/schema.json') },
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
  contentTypes,
};
