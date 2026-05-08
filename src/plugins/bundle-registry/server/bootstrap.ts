import { mkdirSync } from 'fs';
import { getBasePath } from './services/storage';

import type { StrapiInstance } from './types';

const bootstrap = ({ strapi: _strapi }: { strapi: StrapiInstance }): void => {
  mkdirSync(getBasePath(), { recursive: true });
};

export default bootstrap;
