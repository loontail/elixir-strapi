import { readFileSync, existsSync } from 'fs';
import { getManifestPath } from '../services/storage';

import type { StrapiInstance } from '../types';

const manifestController = ({ strapi: _strapi }: { strapi: StrapiInstance }) => ({
  async getManifest(ctx: {
    params: { slug: string };
    notFound: (msg: string) => void;
    set: (k: string, v: string) => void;
    body: unknown;
  }) {
    const { slug } = ctx.params;
    const manifestPath = getManifestPath(slug);

    if (!existsSync(manifestPath)) {
      return ctx.notFound('Manifest not found. Build may not be ready yet.');
    }

    ctx.set('Content-Type', 'application/json');
    ctx.set('Cache-Control', 'no-cache');
    ctx.body = readFileSync(manifestPath, 'utf8');
  },
});

export default manifestController;
