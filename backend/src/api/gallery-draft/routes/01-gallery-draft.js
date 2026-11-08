'use strict';

/**
 * Auth is resolved manually from the Bearer token (same pattern as
 * artist-update) so a missing JWT answers with the product's error shape
 * instead of a Strapi 403 page. Every handler still checks band permission.
 */
const open = { auth: false, policies: [], middlewares: [] };

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/gallery-drafts',
      handler: 'gallery-draft.start',
      config: open,
    },
    {
      method: 'GET',
      path: '/gallery-drafts/active',
      handler: 'gallery-draft.active',
      config: open,
    },
    {
      method: 'GET',
      path: '/gallery-drafts/:sessionId',
      handler: 'gallery-draft.detail',
      config: open,
    },
    {
      method: 'PATCH',
      path: '/gallery-drafts/:sessionId',
      handler: 'gallery-draft.patch',
      config: open,
    },
    {
      method: 'PUT',
      path: '/gallery-drafts/:sessionId/audience',
      handler: 'gallery-draft.audience',
      config: open,
    },
    {
      method: 'POST',
      path: '/gallery-drafts/:sessionId/media',
      handler: 'gallery-draft.uploadMedia',
      config: open,
    },
    {
      method: 'GET',
      path: '/gallery-drafts/:sessionId/media/:mediaId',
      handler: 'gallery-draft.streamMedia',
      config: open,
    },
    {
      method: 'DELETE',
      path: '/gallery-drafts/:sessionId/media/:mediaId',
      handler: 'gallery-draft.removeMedia',
      config: open,
    },
    {
      method: 'POST',
      path: '/gallery-drafts/:sessionId/publish',
      handler: 'gallery-draft.publish',
      config: open,
    },
    {
      method: 'DELETE',
      path: '/gallery-drafts/:sessionId',
      handler: 'gallery-draft.discard',
      config: open,
    },
  ],
};
