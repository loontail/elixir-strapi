'use strict';

module.exports = {
  default: {},
  validator(config) {
    if (config?.downloadsPath?.length === 0) {
      throw new Error('[DOWNLOADS PLUGIN]: Downloads path is required');
    }
  },
};
