'use strict';

const { mkdirSync } = require('fs');
const storage = require('./services/storage');

module.exports = ({ strapi }) => {
  // Ensure the base storage directory exists on startup
  mkdirSync(storage.getBasePath(), { recursive: true });

  // Lifecycle hook: when a Client is updated with a fileBuild custom field value,
  // auto-update metadataUrl to point to this plugin's manifest endpoint.
  strapi.db.lifecycles.subscribe({
    models: ['api::client.client'],
    async afterUpdate({ result }) {
      const fileBuildSlug = result.fileBuild;
      if (!fileBuildSlug) return;

      const serverUrl =
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
