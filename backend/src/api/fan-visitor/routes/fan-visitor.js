'use strict';

/**
 * No public CRUD on fan-visitor — identity only via /fan-identity/session.
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::fan-visitor.fan-visitor', {
  config: {
    find: { policies: [], auth: false },
    findOne: { policies: [], auth: false },
    create: { policies: [], auth: false },
    update: { policies: [], auth: false },
    delete: { policies: [], auth: false },
  },
  only: [], // expose nothing via core CRUD
});
