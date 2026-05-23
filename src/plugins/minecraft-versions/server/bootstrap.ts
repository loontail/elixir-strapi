import type { StrapiInstance } from './types';

const bootstrap = (_: { strapi: StrapiInstance }): void => {
  // No-op: version metadata is fetched on demand and cached in-memory by
  // `@loontail/minecraft-kit`. No disk cache directory needs to be prepared.
};

export default bootstrap;
