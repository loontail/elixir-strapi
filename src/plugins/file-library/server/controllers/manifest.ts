import { readFileSync, existsSync } from 'fs';
import { getManifestPath } from '../services/storage';

// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const manifestController = ({ strapi: _strapi }: { strapi: any }) => ({
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
