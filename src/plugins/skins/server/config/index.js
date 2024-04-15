'use strict';

module.exports = {
  default: {},
  validator(config) {
    if (config?.skinsPath?.length === 0) {
      throw new Error('SKINS_PATH env is required');
    }
  },
};
