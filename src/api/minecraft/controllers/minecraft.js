'use strict';

/**
 * minecraft controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::minecraft.minecraft');
