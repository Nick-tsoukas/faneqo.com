'use strict';

/**
 * RETIRED — this HTTP surface is permanently unregistered.
 *
 * Every route here was `auth: false`, which meant anyone on the internet could
 * list, create, overwrite, or DELETE any band's external platform connection
 * (YouTube/Spotify/etc.):
 *
 *   GET    /band-external-accounts
 *   GET    /band-external-accounts/:id
 *   POST   /band-external-accounts
 *   PUT    /band-external-accounts/:id
 *   DELETE /band-external-accounts/:id
 *
 * `accessToken` and `refreshToken` are `private: true` in the schema, so the
 * reads did not leak credentials, but the writes allowed a stranger to sever or
 * repoint an artist's provider connection.
 *
 * Nothing calls these over HTTP. The only producers/consumers are server-side
 * (`src/api/youtube/**`, `src/api/muse/**`), and they use
 * `strapi.entityService` against `api::band-external-account.band-external-account`
 * directly, so unregistering the routes does not affect them.
 *
 * If a read API is needed later it must be authenticated AND band-scoped —
 * generic core `find` returns every band's rows, so an `isAuthenticated` policy
 * alone would still be a cross-tenant leak.
 */
module.exports = {
  routes: [],
};
