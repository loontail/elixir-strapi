import register from './register';
import bootstrap from './bootstrap';
import destroy from './destroy';
import config from './config';
import controllers from './controllers';
import routes from './routes';
import middlewares from './middlewares';
import services from './services';

const contentTypes = {
  build: { schema: require('./content-types/build/schema.json') },
  artifact: { schema: require('./content-types/artifact/schema.json') },
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
