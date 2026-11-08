'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/public/bands/:bandSlug/nights/:nightSlug',
      handler: 'show-recap.publicNight',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
