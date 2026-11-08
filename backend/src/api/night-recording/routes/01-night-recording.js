'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/show-recaps/:id/recordings',
      handler: 'night-recording.listForNight',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/show-recaps/:id/recordings',
      handler: 'night-recording.createForNight',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/night-recordings/:id',
      handler: 'night-recording.detail',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'PATCH',
      path: '/night-recordings/:id',
      handler: 'night-recording.update',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/night-recordings/:id',
      handler: 'night-recording.remove',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
