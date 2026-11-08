'use strict';

/**
 * Ensure Team Access custom actions are enabled for Authenticated.
 * Safe to re-run; never enables Public; never touches billing/QR routes.
 */
async function ensureAuthenticatedPermissions(strapi, actions, label) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });

  if (!role) {
    strapi.log.warn(`[${label}] Authenticated role not found; skip permission sync`);
    return;
  }

  let created = 0;
  let existing = 0;

  for (const action of actions) {
    const permission = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: role.id },
    });

    if (permission) {
      existing += 1;
      continue;
    }

    await strapi.db.query('plugin::users-permissions.permission').create({
      data: {
        action,
        role: role.id,
      },
    });
    created += 1;
  }

  strapi.log.info(
    `[${label}] Authenticated permissions ready (created=${created}, already=${existing})`
  );
}

async function ensureBandTeamPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::band.band-team.getTeam',
      'api::band.band-team.createInvite',
      'api::band.band-team.resendInvite',
      'api::band.band-team.revokeInvite',
      'api::band.band-team.updateMemberRole',
      'api::band.band-team.removeMember',
      'api::band.band-team.acceptInvite',
      'api::band.band-team.getMyAccess',
    ],
    'band-team'
  );
}

// Artist payment dashboard routes; each one is also behind api::band.owns-band
async function ensurePaymentsPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::band.payments.onboard',
      'api::band.payments.status',
      'api::band.payments.summary',
      'api::band.payments.report',
      'api::band.payments.transactions',
      'api::band.payments.transaction',
      'api::band.payments.exportCsv',
    ],
    'payments'
  );
}

async function ensureMessagingPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::message-campaign.message-campaign.create',
      'api::message-campaign.message-campaign.preview',
      'api::message-campaign.message-campaign.status',
      'api::message-campaign.message-campaign.history',
      'api::message-campaign.message-campaign.detail',
      'api::show-recap.show-recap.messagePreview',
      'api::show-recap.show-recap.sendMessage',
      'api::show-recap.show-recap.getNight',
      'api::show-recap.show-recap.updateNight',
    ],
    'messaging'
  );
}

async function ensureFanListPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::fan.fan.removeFromList',
      'api::fan.fan.myFans',
      'api::fan.fan.myFansAnalytics',
      'api::fan.fan.fanDetail',
    ],
    'fan-list'
  );
}

async function ensureArtistFanRelationshipPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    ['api::artist-fan-relationship.artist-fan-relationship.findOne'],
    'artist-fan-relationship'
  );
}

async function ensureShowModePermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::band.show-mode.getStatus',
      'api::band.show-mode.activateManual',
      'api::band.show-mode.activateFromEvent',
      'api::band.show-mode.deactivate',
      'api::band.show-mode.activateNow',
      'api::band.show-mode.updateTiming',
    ],
    'show-mode'
  );
}

async function ensureDashboardGlancePermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    ['api::analytics.analytics.dashboardGlance'],
    'dashboard-glance'
  );
}

/**
 * Private artist analytics: visitor geography, page views, link clicks, scans,
 * follows, momentum. These routes used to be `auth: false`, which meant anyone
 * could read any band's numbers by guessing a sequential id. They now require
 * an authenticated caller with band access, so the Authenticated role needs the
 * actions enabled (and Public must not have them).
 */
/**
 * `GET /qrs` moved from `auth: false` to authenticated + server-derived scope,
 * so the Authenticated role needs the find action (the other QR verbs already
 * run behind `isAuthenticated` policies) and Public must not have it.
 */
const AUTHENTICATED_QR_ACTIONS = ['api::qr.qr.find'];

const PRIVATE_ANALYTICS_ACTIONS = [
  'api::analytics.analytics.rollups',
  'api::analytics.analytics.geo',
  'api::analytics.analytics.transitions',
  'api::analytics.analytics.follows',
  'api::analytics.analytics.eventRollups',
  'api::analytics.analytics.eventGeo',
  'api::analytics.analytics.eventSources',
  'api::analytics.analytics.eventDevices',
  'api::analytics.analytics.qrRollups',
  'api::analytics.analytics.qrGeo',
  'api::analytics.analytics.qrSources',
  'api::analytics.analytics.qrDevices',
  'api::analytics.analytics.pulse',
  'api::analytics.analytics.geoStates',
  'api::analytics.analytics.pushDryRun',
  'api::analytics.analytics.whatsHot',
  'api::analytics.shareables.getShareables',
];

/**
 * Public grants removed by the October 2026 audit. The routes and controllers
 * already refuse these (scripts/test-api-lockdown-2026-10.js); deleting the
 * stale grants keeps the admin Roles screen honest and stops them coming back
 * if a route is ever re-added. Payment records exposed fan emails; the
 * analytics rows exposed visitor IPs and locations.
 */
const PUBLIC_LOCKDOWN_2026_10_ACTIONS = [
  'api::support-moment.support-moment.find',
  'api::support-moment.support-moment.findOne',
  'api::support-moment.support-moment.create',
  'api::band-page-view.band-page-view.find',
  'api::band-page-view.band-page-view.findOne',
  'api::band-page-view.band-page-view.update',
  'api::event-page-view.event-page-view.find',
  'api::event-page-view.event-page-view.findOne',
  'api::scan.scan.find',
  'api::scan.scan.findOne',
  'api::scan.scan.update',
  'api::media-play.media-play.find',
  'api::media-play.media-play.findOne',
  'api::band-share.band-share.find',
  'api::band-share.band-share.findOne',
  'api::band-share.band-share.create',
  'api::pulse-snapshot.pulse-snapshot.find',
  'api::pulse-snapshot.pulse-snapshot.findOne',
  'api::pulse-snapshot.pulse-snapshot.create',
  'api::fan-moment.fan-moment.find',
  'api::fan-moment.fan-moment.create',
  'api::stripe.stripe.testRoute',
  // Billing actions need a logged-in user; the legacy signup and confirmSocial are unrouted
  'api::stripe.stripe.createCustomer',
  'api::stripe.stripe.createCheckoutSession',
  'api::stripe.stripe.confirmPayment',
  'api::stripe.stripe.confirmSocial',
  'api::stripe.stripe.createBillingPortalSession',
  'api::stripe.stripe.getBillingInfo',
  'api::stripe.stripe.subscriptionStatus',
];

async function ensurePublicPermissions(strapi, actions, label) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });

  if (!role) {
    strapi.log.warn(`[${label}] Public role not found; skip permission sync`);
    return;
  }

  let created = 0;
  let existing = 0;

  for (const action of actions) {
    const permission = await strapi.db.query('plugin::users-permissions.permission').findOne({
      where: { action, role: role.id },
    });

    if (permission) {
      existing += 1;
      continue;
    }

    await strapi.db.query('plugin::users-permissions.permission').create({
      data: {
        action,
        role: role.id,
      },
    });
    created += 1;
  }

  strapi.log.info(`[${label}] Public permissions ready (created=${created}, already=${existing})`);
}

async function ensurePublicAuthPermissions(strapi) {
  await ensurePublicPermissions(
    strapi,
    [
      'plugin::users-permissions.auth.callback',
      'plugin::users-permissions.auth.connect',
      'plugin::users-permissions.auth.forgotPassword',
      'plugin::users-permissions.auth.resetPassword',
      'plugin::users-permissions.auth.register',
      'plugin::users-permissions.auth.emailConfirmation',
      'plugin::users-permissions.auth.sendEmailConfirmation',
      'api::band.band.find',
      'api::band.band.findOne',
    ],
    'public-auth'
  );
}

async function ensureAuthenticatedUserPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'plugin::users-permissions.user.me',
      'plugin::users-permissions.auth.changePassword',
    ],
    'authenticated-user'
  );
}

async function disablePublicPermissions(strapi, actions, label) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'public' },
  });
  if (!role) {
    strapi.log.warn(`[${label}] Public role not found; skip public lockdown`);
    return;
  }

  let removed = 0;
  for (const action of actions) {
    const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
      where: { action, role: role.id },
    });
    for (const row of rows || []) {
      await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
      removed += 1;
    }
  }
  strapi.log.info(`[${label}] Public CRUD permissions removed (deleted=${removed})`);
}

async function ensureInboxPermissions(strapi) {
  await ensureAuthenticatedPermissions(
    strapi,
    [
      'api::conversation.conversation.start',
      'api::conversation.conversation.list',
      'api::conversation.conversation.unreadCount',
      'api::conversation.conversation.detail',
      'api::conversation.conversation.messages',
      'api::conversation.conversation.send',
      'api::conversation.conversation.markRead',
      'api::conversation.conversation.block',
      'api::conversation.conversation.unblock',
      'api::fan-account.fan-account.listConversations',
      'api::fan-account.fan-account.conversationsUnreadCount',
      'api::conversation.conversation.listRequests',
      'api::conversation.conversation.requestDetail',
      'api::conversation.conversation.acceptRequest',
      'api::conversation.conversation.declineRequest',
      'api::fan-account.fan-account.messageStatus',
      'api::fan-account.fan-account.updateProfile',
      'api::fan-account.fan-account.listMessageRequests',
      'api::fan-account.fan-account.createMessageRequest',
    ],
    'inbox'
  );

  const crud = ['find', 'findOne', 'create', 'update', 'delete'];
  const uids = [
    'api::conversation.conversation',
    'api::conversation-message.conversation-message',
    'api::conversation-participant.conversation-participant',
    'api::conversation-request.conversation-request',
    'api::fan-account-link.fan-account-link',
  ];
  await disablePublicPermissions(
    strapi,
    uids.flatMap((uid) => crud.map((action) => `${uid}.${action}`)),
    'inbox-public'
  );
}

module.exports = {
  register(/*{ strapi }*/) {
    console.info('[Faneqo Startup] boot:start');
  },

  async bootstrap({ strapi }) {
    strapi.log.info('[Faneqo Startup] database:ready');
    strapi.log.info('[Faneqo Startup] schema-ready');
    strapi.log.info('[Faneqo Startup] bootstrap:start');
    try {
      await ensureBandTeamPermissions(strapi);
    } catch (err) {
      // Never block Strapi boot / admin login on permission sync.
      strapi.log.warn(`[band-team] permission sync skipped: ${err.message}`);
    }

    try {
      await ensurePaymentsPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[payments] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureMessagingPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[messaging] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureFanListPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[fan-list] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureArtistFanRelationshipPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[artist-fan-relationship] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureDashboardGlancePermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[dashboard-glance] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureAuthenticatedPermissions(strapi, PRIVATE_ANALYTICS_ACTIONS, 'private-analytics');
      await disablePublicPermissions(strapi, PRIVATE_ANALYTICS_ACTIONS, 'private-analytics');
    } catch (err) {
      strapi.log.warn(`[private-analytics] permission sync skipped: ${err.message}`);
    }

    try {
      await disablePublicPermissions(strapi, PUBLIC_LOCKDOWN_2026_10_ACTIONS, 'public-lockdown-2026-10');
    } catch (err) {
      strapi.log.warn(`[public-lockdown-2026-10] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureAuthenticatedPermissions(strapi, AUTHENTICATED_QR_ACTIONS, 'qr-list-scope');
      await disablePublicPermissions(strapi, AUTHENTICATED_QR_ACTIONS, 'qr-list-scope');
    } catch (err) {
      strapi.log.warn(`[qr-list-scope] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureShowModePermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[show-mode] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureInboxPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[inbox] permission sync skipped: ${err.message}`);
    }

    try {
      await ensurePublicAuthPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[public-auth] permission sync skipped: ${err.message}`);
    }

    try {
      await ensureAuthenticatedUserPermissions(strapi);
    } catch (err) {
      strapi.log.warn(`[authenticated-user] permission sync skipped: ${err.message}`);
    }

    try {
      const publicRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'public' },
      });
      if (publicRole) {
        const action = 'api::band.health.check';
        const existing = await strapi.db.query('plugin::users-permissions.permission').findOne({
          where: { action, role: publicRole.id },
        });
        if (!existing) {
          await strapi.db.query('plugin::users-permissions.permission').create({
            data: { action, role: publicRole.id },
          });
        }
      }
    } catch (err) {
      strapi.log.warn(`[health] permission sync skipped: ${err.message}`);
    }

    let indexesReady = false;
    try {
      const { ensureInboxIndexes } = require('./utils/inbox/inboxIndexes');
      const indexResult = await ensureInboxIndexes(strapi);
      indexesReady = Boolean(
        indexResult &&
          (indexResult.skipped ||
            (Array.isArray(indexResult.results) && indexResult.results.some((row) => row.ok)))
      );
    } catch (err) {
      strapi.log.warn(`[Faneqo Inbox] indexes:failed ${err.message}`);
    }
    strapi.log.info(`[Faneqo Inbox] bootstrap:ready routesReady=true indexesReady=${indexesReady}`);
    strapi.log.info(`[Faneqo Startup] bootstrap:ready`);
    strapi.log.info(`[Faneqo Startup] server:ready port=${strapi.config.get('server.port')}`);

    try {
      const { logFanAccountTestModeOnBoot } = require('./utils/fanAccountTestMode');
      logFanAccountTestModeOnBoot(strapi);
    } catch (err) {
      strapi.log.warn(`[Fan Account] test-mode boot log skipped: ${err.message}`);
    }

    try {
      const { logCampaignTestModeOnBoot } = require('./utils/messaging/campaignTestMode');
      logCampaignTestModeOnBoot(strapi);
    } catch (err) {
      strapi.log.warn(`[Faneqo Campaigns] test-mode boot log skipped: ${err.message}`);
    }

    try {
      const { ensureFeatureEnrollmentIndexes } = require('./utils/features/featureEnrollmentIndexes');
      await ensureFeatureEnrollmentIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[Labs] indexes skipped: ${err.message}`);
    }

    try {
      const crud = ['find', 'findOne', 'create', 'update', 'delete'];
      const actions = crud.map((action) => `api::feature-enrollment.feature-enrollment.${action}`);
      await disablePublicPermissions(strapi, actions, 'labs-enrollment-public');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (authRole) {
        let removed = 0;
        for (const action of actions) {
          const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
            where: { action, role: authRole.id },
          });
          for (const row of rows || []) {
            await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
            removed += 1;
          }
        }
        strapi.log.info(`[Labs] authenticated enrollment CRUD removed (deleted=${removed})`);
      }
    } catch (err) {
      strapi.log.warn(`[Labs] public enrollment lockdown skipped: ${err.message}`);
    }

    try {
      const { ensureRelationshipEventIndexes } = require('./utils/relationshipEvents/relationshipEventIndexes');
      await ensureRelationshipEventIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[RelationshipEvent] indexes skipped: ${err.message}`);
    }

    try {
      const { ensureMomentIndexes } = require('./utils/moments/momentIndexes');
      await ensureMomentIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[Moment] indexes skipped: ${err.message}`);
    }

    try {
      const { ensureMilestoneIndexes } = require('./utils/milestones/milestoneIndexes');
      await ensureMilestoneIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[Milestone] indexes skipped: ${err.message}`);
    }

    try {
      const { ensureFanAttendanceIntegrityIndexes } = require('./utils/integrity/fanAttendanceIntegrity');
      await ensureFanAttendanceIntegrityIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[Integrity] indexes skipped: ${err.message}`);
    }

    // Audits first and only applies the unique index when this database has no
    // duplicate FanProfiles. Never repairs or deletes identity rows.
    try {
      const { ensureFanProfileIndexes } = require('./utils/fanProfile/fanProfileIndexes');
      await ensureFanProfileIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[FanProfile] indexes skipped: ${err.message}`);
    }

    try {
      const { ensureNightRecordingIndexes } = require('./utils/nightRecordings/nightRecordingIndexes');
      await ensureNightRecordingIndexes(strapi);
    } catch (err) {
      strapi.log.warn(`[NightRecording] indexes skipped: ${err.message}`);
    }

    try {
      const crud = ['find', 'findOne', 'create', 'update', 'delete'];
      const actions = crud.map((action) => `api::night-recording.night-recording.${action}`);
      await disablePublicPermissions(strapi, actions, 'night-recording-public');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (authRole) {
        let removed = 0;
        for (const action of actions) {
          const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
            where: { action, role: authRole.id },
          });
          for (const row of rows || []) {
            await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
            removed += 1;
          }
        }
        strapi.log.info(`[NightRecording] authenticated CRUD removed (deleted=${removed})`);
      }
    } catch (err) {
      strapi.log.warn(`[NightRecording] public lockdown skipped: ${err.message}`);
    }

    try {
      const crud = ['find', 'findOne', 'create', 'update', 'delete'];
      const actions = crud.map((action) => `api::relationship-event.relationship-event.${action}`);
      await disablePublicPermissions(strapi, actions, 'relationship-event-public');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (authRole) {
        let removed = 0;
        for (const action of actions) {
          const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
            where: { action, role: authRole.id },
          });
          for (const row of rows || []) {
            await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
            removed += 1;
          }
        }
        strapi.log.info(`[RelationshipEvent] authenticated CRUD removed (deleted=${removed})`);
      }
    } catch (err) {
      strapi.log.warn(`[RelationshipEvent] public lockdown skipped: ${err.message}`);
    }

    try {
      const crud = ['find', 'findOne', 'create', 'update', 'delete'];
      const actions = crud.map((action) => `api::moment.moment.${action}`);
      await disablePublicPermissions(strapi, actions, 'moment-public');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (authRole) {
        let removed = 0;
        for (const action of actions) {
          const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
            where: { action, role: authRole.id },
          });
          for (const row of rows || []) {
            await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
            removed += 1;
          }
        }
        strapi.log.info(`[Moment] authenticated CRUD removed (deleted=${removed})`);
      }
    } catch (err) {
      strapi.log.warn(`[Moment] public lockdown skipped: ${err.message}`);
    }

    try {
      const crud = ['find', 'findOne', 'create', 'update', 'delete'];
      const actions = crud.map((action) => `api::milestone.milestone.${action}`);
      await disablePublicPermissions(strapi, actions, 'milestone-public');
      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });
      if (authRole) {
        let removed = 0;
        for (const action of actions) {
          const rows = await strapi.db.query('plugin::users-permissions.permission').findMany({
            where: { action, role: authRole.id },
          });
          for (const row of rows || []) {
            await strapi.db.query('plugin::users-permissions.permission').delete({ where: { id: row.id } });
            removed += 1;
          }
        }
        strapi.log.info(`[Milestone] authenticated CRUD removed (deleted=${removed})`);
      }
    } catch (err) {
      strapi.log.warn(`[Milestone] public lockdown skipped: ${err.message}`);
    }

    try {
      const { seedFounderLabs } = require('./utils/features/seedFounderLabs');
      await seedFounderLabs(strapi);
    } catch (err) {
      strapi.log.warn(`[Labs] founder seed skipped: ${err.message}`);
    }
  },
};
