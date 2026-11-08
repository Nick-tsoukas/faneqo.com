'use strict';

/**
 * Creative Studio — private.
 *
 * Every route is auth:false on purpose (Labs pattern): users-permissions must
 * not 403 and advertise the surface. The controller resolves the bearer JWT
 * itself, checks the studio allowlist, and answers 404 to everyone else.
 * Records are always scoped to the caller's ownerEmail.
 *
 *   GET    /creatives                 list (cards)
 *   GET    /creatives/artists         paged light artist rows for the picker
 *   GET    /creatives/:id             one creative
 *   POST   /creatives                 create
 *   PUT    /creatives/:id             update
 *   POST   /creatives/:id/duplicate   copy as a new draft
 *   DELETE /creatives/:id             delete
 */

module.exports = {
  routes: [
    { method: 'GET', path: '/creatives', handler: 'creative.list', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'GET', path: '/creatives/artists', handler: 'creative.artists', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'GET', path: '/creatives/:id', handler: 'creative.findOne', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'POST', path: '/creatives', handler: 'creative.create', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'PUT', path: '/creatives/:id', handler: 'creative.update', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'POST', path: '/creatives/:id/duplicate', handler: 'creative.duplicate', config: { auth: false, policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/creatives/:id', handler: 'creative.remove', config: { auth: false, policies: [], middlewares: [] } },
  ],
};
