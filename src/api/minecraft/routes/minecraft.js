'use strict';

/**
 * minecraft router
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::minecraft.minecraft');
