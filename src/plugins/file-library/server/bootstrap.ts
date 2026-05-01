import { mkdirSync } from 'fs';
import { getBasePath } from './services/storage';

// TODO: type properly — Strapi's Core.Strapi type requires @strapi/strapi package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const bootstrap = ({ strapi }: { strapi: any }): void => {
  // Ensure the base storage directory exists on startup
  mkdirSync(getBasePath(), { recursive: true });

  // Lifecycle hook: when a Client is updated with a fileBuild custom field value,
  // auto-update metadataUrl to point to this plugin's manifest endpoint.
  strapi.db.lifecycles.subscribe({
    models: ['api::client.client'],
    async afterUpdate({
      result,
    }: {
      result: { id: number; fileBuild?: string; metadataUrl?: string };
    }) {
      const fileBuildSlug = result.fileBuild;
      if (!fileBuildSlug) return;

      const serverUrl: string =
        strapi.config.get('server.url') ||
        `http://${strapi.config.get('server.host', 'localhost')}:${strapi.config.get('server.port', 1337)}`;

      const expectedUrl = `${serverUrl}/api/file-library/builds/${fileBuildSlug}/manifest`;

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
