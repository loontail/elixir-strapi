'use strict';

/**
 * minecraft service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::minecraft.minecraft');
