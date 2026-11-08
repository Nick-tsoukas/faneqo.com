'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/fan-passport/memories',
      handler: 'passport-gallery-save.listMemories',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/fan-passport/memories/:id',
      handler: 'passport-gallery-save.getMemory',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/fan-passport/galleries',
      handler: 'passport-gallery-save.list',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/fan-passport/galleries/:id/save',
      handler: 'passport-gallery-save.save',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'DELETE',
      path: '/fan-passport/galleries/:id/save',
      handler: 'passport-gallery-save.remove',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
