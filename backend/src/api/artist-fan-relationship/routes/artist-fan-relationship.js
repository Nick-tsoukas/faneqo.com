'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/artist-fan-relationships/:fanId',
      handler: 'artist-fan-relationship.findOne',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
