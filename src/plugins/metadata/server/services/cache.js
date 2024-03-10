'use strict';

const memCache = require('memory-cache');

module.exports = () => ({
  clearCache() {
    try {
      memCache.clear();
      return 'ok'
    } catch (e) {
      return e
    }
  },
});
