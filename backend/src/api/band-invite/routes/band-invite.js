'use strict';

/**
 * No generic CRUD routes.
 *
 * Invite create / revoke / accept live on `api::band` custom routes
 * (`/bands/:id/invites`, `/invites/accept`). Do NOT switch this to
 * createCoreRouter — invites hold emails (PII) and hashed tokens.
 */

module.exports = {
  routes: [],
};
