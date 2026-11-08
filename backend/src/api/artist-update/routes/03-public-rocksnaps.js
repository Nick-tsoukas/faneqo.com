'use strict';

/**
 * Public RockSnaps reads. auth: false matches the other public gallery routes:
 * there is no viewer session, and the handler allowlists the response.
 * These routes are not the Faneqo artist gallery API.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/public/rocksnaps/galleries',
      handler: 'artist-update.publicRocksnapsList',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/public/rocksnaps/galleries/:slug',
      handler: 'artist-update.publicRocksnapsDetail',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
