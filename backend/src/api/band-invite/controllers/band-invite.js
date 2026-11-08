'use strict';

/**
 * band-invite controller
 *
 * No generic CRUD. Invite create / accept / revoke are implemented on
 * `api::band` (`band-team` controller). Invites contain emails (PII)
 * and must never be exposed on public routes.
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::band-invite.band-invite');
