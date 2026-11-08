'use strict';

/**
 * band-member controller
 *
 * Phase 1: no custom routes are registered for this content type,
 * so nothing is exposed on the content API yet. Member management
 * endpoints arrive in a later phase.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::band-member.band-member');
