'use strict';

/**
 * Show Mode Controller
 * Handles show mode activation/deactivation for bands
 *
 * Access: owner + manager can operate; viewer can read status.
 * Fan PII / Message the Room stay on separate owner-gated routes.
 */

const showModeService = require('../services/showMode');
const showCover = require('../../../utils/showMode/showCoverPure');
const nightCover = require('../../../utils/showMode/nightCover');
const nightEnrichment = require('../../../utils/showMode/nightEnrichmentPure');
const eventActivation = require('../../../utils/showMode/eventActivationPure');
const {
  getBandRole,
  ROLE_OWNER,
  ROLE_MANAGER,
  ROLE_VIEWER,
} = require('../../../utils/bandRoles');

async function authorizeShowCover(strapi, userId, mediaId) {
  return nightCover.authorizePublicNightCover(strapi, userId, mediaId);
}

async function loadBandForShowMode(id) {
  return strapi.entityService.findOne('api::band.band', id, {
    fields: [
      'id',
      'name',
      'showModeStatus',
      'showModeEnabled',
      'showModeType',
      'showModeStartedAt',
      'showModeEndsAt',
      'showModeActivatedAt',
      'showModeEventId',
      'showModeTitle',
      'showModeVenue',
      'showModeCity',
      'showModeRegion',
      'showModeCountry',
      'showModeTimezone',
      'showModeCampaignId',
      'showModeSourceDetail',
      'showModeAutoManaged',
      'showModeScheduledStartAt',
      'showModeScheduledEndAt',
      'showModeMetadata',
      'showModePerformanceStartsAt',
      'showModePerformanceEndsAt',
      'showModeLastDeactivationReason',
    ],
  });
}

/** Cap the batch so a crafted query cannot turn a read into a scan. */
const EVENT_ACTIVATION_BATCH_LIMIT = 100;

function parseEventIds(raw) {
  const values = Array.isArray(raw) ? raw : String(raw ?? '').split(',');
  const ids = [];
  for (const value of values) {
    const id = eventActivation.positiveId(value);
    if (id && !ids.includes(id)) ids.push(id);
    if (ids.length >= EVENT_ACTIVATION_BATCH_LIMIT) break;
  }
  return ids;
}

async function assertShowModeAccess(userId, bandId, { mutate }) {
  const role = await getBandRole(strapi, bandId, userId);
  if (!role) return { ok: false, status: 'forbidden', message: 'You do not have access to this band' };
  if (mutate) {
    if (role !== ROLE_OWNER && role !== ROLE_MANAGER) {
      return { ok: false, status: 'forbidden', message: 'Your role does not allow operating Show Mode' };
    }
  } else if (role !== ROLE_OWNER && role !== ROLE_MANAGER && role !== ROLE_VIEWER) {
    return { ok: false, status: 'forbidden', message: 'Your role does not allow viewing Show Mode' };
  }
  return { ok: true, role };
}

module.exports = {
  /**
   * GET /api/bands/:id/show-mode
   * Get show mode status for a band
   */
  async getStatus(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await loadBandForShowMode(id);

      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: false });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      const status = showModeService.getShowModeStatus(band);

      // Optional batched Event activation timing for the dashboard Events list.
      // The server owns the timezone and the absolute window; the client only
      // compares those instants against its own clock.
      const eventIds = parseEventIds(ctx.query?.eventIds);
      if (eventIds.length) {
        try {
          status.eventActivation = await showModeService.describeEventActivation(band, eventIds, {
            clientTimezone: ctx.query?.timezone || null,
          });
        } catch (activationError) {
          strapi.log.warn(`[ShowMode] Failed to resolve event activation: ${activationError.message}`);
          status.eventActivation = [];
        }
      }

      if (status.coverMediaId) {
        try {
          const file = await strapi.entityService.findOne('plugin::upload.file', status.coverMediaId);
          status.coverUrl = nightEnrichment.publicCoverUrl(file);
        } catch (coverError) {
          strapi.log.warn(`[ShowMode] Failed to load night cover: ${coverError.message}`);
        }
      }

      // If there's an event, fetch event details + fallback cover
      if (status.eventId) {
        const event = await strapi.entityService.findOne('api::event.event', status.eventId, {
          fields: ['id', 'title', 'venue', 'city', 'startDate'],
          populate: { image: true },
        });
        status.event = event || null;
        status.coverUrl = status.coverUrl || showCover.showCoverFromEvent(event)?.url || null;
      }

      // Live counters so the dashboard card can show the session as it happens.
      if (status.campaignId) {
        try {
          const [fansCaptured, checkInStats] = await Promise.all([
            showModeService.getFansCapturedDuringCampaign(status.campaignId),
            strapi.service('api::show-recap.show-recap').getCheckInStats({
              bandId: band.id,
              campaignId: status.campaignId,
            }),
          ]);

          status.fansCaptured = fansCaptured;
          status.checkIns = checkInStats.attendanceCount;
        } catch (statsError) {
          // Counters are informational — never fail the status read over them.
          strapi.log.warn(`[ShowMode] Failed to load session counters: ${statsError.message}`);
          status.fansCaptured = null;
          status.checkIns = null;
        }
      }

      return { data: status };
    } catch (error) {
      strapi.log.error('[ShowMode] Error getting status', error);
      return ctx.internalServerError('Failed to get show mode status');
    }
  },

  /**
   * POST /api/bands/:id/show-mode/manual
   * Activate manual show mode
   */
  async activateManual(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const {
      title,
      venue,
      city,
      region,
      country,
      timezone,
      coverMediaId,
      performanceStartsAt,
      performanceEndsAt,
    } = ctx.request.body || {};

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await strapi.entityService.findOne('api::band.band', id, {
        fields: ['id'],
      });

      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: true });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      const payload = { userId: user.id };
      if (title) payload.title = title;
      if (venue) payload.venue = venue;
      if (city) payload.city = city;
      if (region) payload.region = region;
      if (country) payload.country = country;
      // Drives the 6 AM local end time; invalid values fall back to server time.
      if (timezone) payload.timezone = timezone;
      if (performanceStartsAt) payload.performanceStartsAt = performanceStartsAt;
      if (performanceEndsAt) payload.performanceEndsAt = performanceEndsAt;

      if (coverMediaId) {
        const authorized = await authorizeShowCover(strapi, user.id, coverMediaId);
        if (authorized.error) {
          ctx.status = authorized.status || 400;
          return { error: { name: authorized.error, message: authorized.message } };
        }
        payload.coverMediaId = authorized.file.id;
        payload.coverFile = authorized.file;
      }

      const result = await showModeService.activateManualShowMode(id, payload);
      if (result?.error) {
        ctx.status = result.status || 400;
        return {
          error: {
            name: result.error,
            message: result.message,
            current: result.current || null,
          },
        };
      }

      return { data: result };
    } catch (error) {
      strapi.log.error('[ShowMode] Error activating manual mode', error);
      return ctx.internalServerError('Failed to activate show mode');
    }
  },

  /**
   * POST /api/bands/:id/show-mode/from-event
   * Activate Show Mode from a canonical Event. Body: { eventId, timezone? }
   */
  async activateFromEvent(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const { eventId, timezone, performanceStartsAt, performanceEndsAt } = ctx.request.body || {};

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await strapi.entityService.findOne('api::band.band', id, {
        fields: ['id'],
      });
      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: true });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      const resolvedEventId = eventActivation.positiveId(eventId);
      if (!resolvedEventId) {
        return ctx.badRequest('Event is required');
      }

      const event = await strapi.entityService.findOne('api::event.event', resolvedEventId, {
        fields: ['id', 'title', 'venue', 'city', 'state', 'date', 'time'],
        populate: {
          band: { fields: ['id'] },
          image: true,
        },
      });
      if (!event) {
        return ctx.notFound('Event not found');
      }

      const result = await showModeService.activateFromEvent(id, event, {
        timezone: timezone || null,
        performanceStartsAt: performanceStartsAt || null,
        performanceEndsAt: performanceEndsAt || null,
      });
      if (result?.error) {
        ctx.status = result.status || 400;
        return {
          error: {
            name: result.error,
            message: result.message,
            current: result.current || null,
            activation: result.activation || null,
          },
        };
      }

      return { data: result };
    } catch (error) {
      strapi.log.error('[ShowMode] Error activating from event', error);
      return ctx.internalServerError('Failed to activate show mode');
    }
  },

  /**
   * POST /api/bands/:id/show-mode/deactivate
   * Deactivate show mode
   */
  async deactivate(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await strapi.entityService.findOne('api::band.band', id, {
        fields: ['id'],
      });

      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: true });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      const result = await showModeService.deactivateShowMode(id);

      return { data: result };
    } catch (error) {
      strapi.log.error('[ShowMode] Error deactivating show mode', error);
      return ctx.internalServerError('Failed to deactivate show mode');
    }
  },

  /**
   * POST /api/bands/:id/show-mode/activate-now
   * Activate a scheduled show mode immediately
   */
  async activateNow(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await loadBandForShowMode(id);

      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: true });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      const live = showModeService.refuseIfLive(band);
      if (live) {
        ctx.status = live.status || 409;
        return {
          error: {
            name: live.error,
            message: live.message,
            current: live.current || null,
          },
        };
      }

      // Check if band has a scheduled show mode
      if (band.showModeStatus !== 'scheduled') {
        return ctx.badRequest('No scheduled show mode to activate');
      }

      const result = await showModeService.activateScheduledShowMode(id);
      if (result?.error) {
        ctx.status = result.status || 400;
        return {
          error: {
            name: result.error,
            message: result.message,
            current: result.current || null,
          },
        };
      }

      return { data: result };
    } catch (error) {
      strapi.log.error('[ShowMode] Error activating scheduled show mode', error);
      return ctx.internalServerError('Failed to activate show mode');
    }
  },

  /**
   * PATCH /api/bands/:id/show-mode/timing
   * Change performance end (and optionally start) on the live session.
   */
  async updateTiming(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const { performanceEndsAt, performanceStartsAt, timezone } = ctx.request.body || {};

    if (!user) {
      return ctx.unauthorized('You must be logged in.');
    }

    try {
      const band = await strapi.entityService.findOne('api::band.band', id, {
        fields: ['id'],
      });
      if (!band) {
        return ctx.notFound('Band not found');
      }

      const gate = await assertShowModeAccess(user.id, id, { mutate: true });
      if (!gate.ok) {
        return ctx.forbidden(gate.message);
      }

      if (performanceEndsAt == null && performanceStartsAt == null) {
        return ctx.badRequest('performanceEndsAt is required');
      }

      const result = await showModeService.updateShowModeTiming(id, {
        performanceEndsAt,
        performanceStartsAt,
        timezone: timezone || null,
      });
      if (result?.error) {
        ctx.status = result.status || 400;
        return {
          error: {
            name: result.error,
            message: result.message,
          },
        };
      }

      return { data: result };
    } catch (error) {
      strapi.log.error('[ShowMode] Error updating show mode timing', error);
      return ctx.internalServerError('Failed to update show mode timing');
    }
  },
};
