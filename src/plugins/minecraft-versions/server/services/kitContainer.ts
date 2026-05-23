import { MinecraftKit } from '@loontail/minecraft-kit';

// Single shared instance per Strapi process. The kit's in-memory LRU
// caches the upstream metadata responses so the picker endpoints reply
// in milliseconds after the first call warms it.
let instance: MinecraftKit | null = null;

export const getKit = (): MinecraftKit => {
  if (!instance) instance = new MinecraftKit();
  return instance;
};
