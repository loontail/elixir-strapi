import type { StrapiInstance } from './types';

const destroy = (_: { strapi: StrapiInstance }): void => {
  // No cleanup needed
};

export default destroy;
