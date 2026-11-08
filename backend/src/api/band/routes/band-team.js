'use strict';

/**
 * Band Team Access routes (V1).
 *
 * Owner-only management uses `api::band.owns-band` (same as payments).
 * Accept + my-access are authenticated (any logged-in user).
 * Service-layer assertOwner remains as defense in depth.
 *
 * Manager/viewer product access is enforced on band/show-mode/event/QR routes
 * via `has-band-role` / `resolveBandAccess` — not on these team-mgmt routes.
 */

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/me/band-access',
      handler: 'band-team.getMyAccess',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'POST',
      path: '/invites/accept',
      handler: 'band-team.acceptInvite',
      config: {
        policies: ['plugin::users-permissions.isAuthenticated'],
      },
    },
    {
      method: 'GET',
      path: '/bands/:id/team',
      handler: 'band-team.getTeam',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
    {
      method: 'POST',
      path: '/bands/:id/invites',
      handler: 'band-team.createInvite',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
    {
      method: 'POST',
      path: '/bands/:id/invites/:inviteId/resend',
      handler: 'band-team.resendInvite',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
    {
      method: 'POST',
      path: '/bands/:id/invites/:inviteId/revoke',
      handler: 'band-team.revokeInvite',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
    {
      method: 'POST',
      path: '/bands/:id/members/:memberId/role',
      handler: 'band-team.updateMemberRole',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
    {
      method: 'POST',
      path: '/bands/:id/members/:memberId/remove',
      handler: 'band-team.removeMember',
      config: {
        policies: [
          'plugin::users-permissions.isAuthenticated',
          'api::band.owns-band',
        ],
      },
    },
  ],
};
