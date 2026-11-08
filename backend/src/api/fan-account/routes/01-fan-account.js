'use strict';

/**
 * Fan account conversion routes.
 * Paths: /api/fan-account/*
 */

module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/fan-account/eligibility',
      handler: 'fan-account.eligibility',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/dismiss',
      handler: 'fan-account.dismiss',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/prompt-shown',
      handler: 'fan-account.promptShown',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/request-link',
      handler: 'fan-account.requestLink',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/verify',
      handler: 'fan-account.verify',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/me',
      handler: 'fan-account.me',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/artists',
      handler: 'fan-account.artists',
      // Public route; JWT optional — controller requires user when present
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/artists/:bandId/follow',
      handler: 'fan-account.follow',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/artists/:bandId/unfollow',
      handler: 'fan-account.unfollow',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/conversations/unread-count',
      handler: 'fan-account.conversationsUnreadCount',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/conversations',
      handler: 'fan-account.listConversations',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/message-status',
      handler: 'fan-account.messageStatus',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/profile',
      handler: 'fan-account.getProfile',
      config: { auth: false },
    },
    {
      method: 'PATCH',
      path: '/fan-account/profile',
      handler: 'fan-account.patchProfile',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/avatar',
      handler: 'fan-account.uploadAvatar',
      config: { auth: false },
    },
    {
      method: 'DELETE',
      path: '/fan-account/avatar',
      handler: 'fan-account.deleteAvatar',
      config: { auth: false },
    },
    {
      // Legacy: band-scoped Fan name sync for messaging. Not the global profile.
      method: 'POST',
      path: '/fan-account/profile',
      handler: 'fan-account.updateProfile',
      config: { auth: false },
    },
    {
      method: 'GET',
      path: '/fan-account/message-requests',
      handler: 'fan-account.listMessageRequests',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/fan-account/message-requests',
      handler: 'fan-account.createMessageRequest',
      config: { auth: false },
    },
  ],
};
