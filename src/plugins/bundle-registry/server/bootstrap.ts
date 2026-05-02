import { mkdirSync } from 'fs';
import { getBasePath } from './services/storage';

import type { StrapiInstance } from './types';

const bootstrap = ({ strapi }: { strapi: StrapiInstance }): void => {
  // Ensure the base storage directory exists on startup
  mkdirSync(getBasePath(), { recursive: true });

  // Lifecycle hook: when a Client is updated with a fileBuild custom field value,
  // auto-update metadataUrl to point to this plugin's manifest endpoint.
  type AfterUpdateEvent = { result: { id: number; fileBuild?: string; metadataUrl?: string } };

  strapi.db.lifecycles.subscribe({
    models: ['api::client.client'],
    async afterUpdate(event: unknown) {
      const { result } = event as AfterUpdateEvent;
      const fileBuildSlug = result.fileBuild;
      if (!fileBuildSlug) return;

      const serverUrl: string =
        strapi.config.get('server.url') ||
        `http://${strapi.config.get('server.host', 'localhost')}:${strapi.config.get('server.port', 1337)}`;

      const expectedUrl = `${serverUrl}/api/bundle-registry/builds/${fileBuildSlug}/manifest`;

      if (result.metadataUrl === expectedUrl) return;

      // Use db.query (not entityService) to bypass lifecycles and avoid an infinite loop
      await strapi.db.query('api::client.client').update({
        where: { id: result.id },
        data: { metadataUrl: expectedUrl },
      });
    },
  });
};

export default bootstrap;
