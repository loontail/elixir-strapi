'use strict';

module.exports = ({ strapi }) => {
  // Register the custom field so it appears in the Content-Type Builder
  strapi.customFields.register({
    name: 'build-picker',
    plugin: 'file-library',
    type: 'string',
  });
};
