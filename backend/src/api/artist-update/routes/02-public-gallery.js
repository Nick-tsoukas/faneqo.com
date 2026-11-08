'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/public/bands/:bandSlug/galleries',
      handler: 'artist-update.publicGalleries',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/public/bands/:bandSlug/galleries/:gallerySlug',
      handler: 'artist-update.publicGallery',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
