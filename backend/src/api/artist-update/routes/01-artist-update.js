'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/artist-updates',
      handler: 'artist-update.listPublic',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/manage',
      handler: 'artist-update.listMine',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/artist-updates',
      handler: 'artist-update.create',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/by-slug',
      handler: 'artist-update.bySlug',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/delivery',
      handler: 'artist-update.delivery',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/shows',
      handler: 'artist-update.shows',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/rocksnaps-capability',
      handler: 'artist-update.rocksnapsCapability',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/artist-page-placement',
      handler: 'artist-update.artistPagePlacement',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/artist-updates/media',
      handler: 'artist-update.uploadMedia',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/:id/media/:mediaId',
      handler: 'artist-update.streamMedia',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/:id/manage',
      handler: 'artist-update.getManage',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/manage',
      handler: 'artist-update.saveManage',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/visibility',
      handler: 'artist-update.updateVisibility',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/artist-updates/:id/feature-on-profile',
      handler: 'artist-update.featureOnProfile',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/artist-updates/:id/unfeature-on-profile',
      handler: 'artist-update.unfeatureOnProfile',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/rocksnaps',
      handler: 'artist-update.setRocksnaps',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/hide',
      handler: 'artist-update.hide',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/restore',
      handler: 'artist-update.restore',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/artist-updates/:id/detach-recap',
      handler: 'artist-update.detachRecap',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/artist-updates/:id',
      handler: 'artist-update.detail',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
