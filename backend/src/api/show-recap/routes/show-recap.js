'use strict';

/**
 * show-recap router
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/show-recaps/my-recaps',
      handler: 'show-recap.myRecaps',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/show-recaps/latest/me',
      handler: 'show-recap.latestRecap',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    // Declared before /show-recaps/:id so the literal segment wins
    {
      method: 'GET',
      path: '/show-recaps/:id/message',
      handler: 'show-recap.messagePreview',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/show-recaps/:id/message',
      handler: 'show-recap.sendMessage',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/show-recaps/:id/night',
      handler: 'show-recap.getNight',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PATCH',
      path: '/show-recaps/:id/night',
      handler: 'show-recap.updateNight',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/show-recaps/:id',
      handler: 'show-recap.recapDetail',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/show-recaps/generate',
      handler: 'show-recap.generateRecap',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
