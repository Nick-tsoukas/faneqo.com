'use strict';

/**
 * Custom Inbox routes only — no generic CRUD.
 * Literal paths must be declared before `/:id…`.
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/conversations/start',
      handler: 'conversation.start',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/unread-count',
      handler: 'conversation.unreadCount',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/dm-candidates',
      handler: 'conversation.dmCandidates',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/requests',
      handler: 'conversation.listRequests',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/requests/:id',
      handler: 'conversation.requestDetail',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/media/delivery',
      handler: 'conversation.mediaDelivery',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/requests/:id/accept',
      handler: 'conversation.acceptRequest',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/requests/:id/decline',
      handler: 'conversation.declineRequest',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations',
      handler: 'conversation.list',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/:id/messages',
      handler: 'conversation.messages',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/:id/messages/:messageId/media/:mediaId',
      handler: 'conversation.streamMedia',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/:id/messages',
      handler: 'conversation.send',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/:id/media',
      handler: 'conversation.uploadMedia',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/:id/read',
      handler: 'conversation.markRead',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/:id/block',
      handler: 'conversation.block',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'POST',
      path: '/conversations/:id/unblock',
      handler: 'conversation.unblock',
      config: { auth: false, policies: [], middlewares: [] },
    },
    {
      method: 'GET',
      path: '/conversations/:id',
      handler: 'conversation.detail',
      config: { auth: false, policies: [], middlewares: [] },
    },
  ],
};
