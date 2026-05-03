import { ensureDirs } from './services/storage';
import type { StrapiInstance } from './types';

const bootstrap = ({ strapi: _strapi }: { strapi: StrapiInstance }): void => {
  ensureDirs();
};

export default bootstrap;
