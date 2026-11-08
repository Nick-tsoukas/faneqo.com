'use strict';

/**
 * event controller
 *
 * Team Access: managers may create/update/delete events for bands they manage.
 * Viewers and unrelated users are denied mutations.
 */

const { createCoreController } = require('@strapi/strapi').factories;
const {
  requireBandPermission,
  getBandRole,
  ROLE_OWNER,
  ROLE_MANAGER,
  ROLE_VIEWER,
} = require('../../../utils/bandRoles');

async function resolveEventBandId(strapi, eventId) {
  const event = await strapi.entityService.findOne('api::event.event', eventId, {
    populate: {
      band: { fields: ['id'] },
      users_permissions_user: { fields: ['id'] },
    },
  });
  if (!event) return { event: null, bandId: null };
  const bandId = event.band?.id || event.band || null;
  return { event, bandId };
}

async function assertCanManageEvent(strapi, user, eventId) {
  const { event, bandId } = await resolveEventBandId(strapi, eventId);
  if (!event) return { ok: false, status: 404, message: 'Event not found' };

  // Legacy: event creator/owner user
  if (String(event.users_permissions_user?.id) === String(user.id)) {
    return { ok: true, event, bandId };
  }

  if (bandId) {
    const access = await requireBandPermission(strapi, user.id, bandId, 'manageEvents');
    if (access) return { ok: true, event, bandId };
  }

  return { ok: false, status: 403, message: 'You do not have permission to modify this event' };
}

module.exports = createCoreController('api::event.event', ({ strapi }) => ({
  // Custom find that allows filtering by users_permissions_user or accessible band
  async find(ctx) {
    const userId = ctx.query?.filters?.users_permissions_user?.id?.['$eq'];
    const bandIdFilter =
      ctx.query?.filters?.band?.id?.['$eq'] ||
      ctx.query?.filters?.band?.['$eq'];

    // Band-scoped list: only for users with access to that band
    if (bandIdFilter && ctx.state.user?.id) {
      const role = await getBandRole(strapi, bandIdFilter, ctx.state.user.id);
      if (role !== ROLE_OWNER && role !== ROLE_MANAGER && role !== ROLE_VIEWER) {
        return ctx.forbidden('You do not have access to this band');
      }

      const { fields, populate, sort, pagination } = ctx.query;
      const results = await strapi.entityService.findMany('api::event.event', {
        filters: { band: { id: bandIdFilter } },
        fields: fields || undefined,
        populate: populate || undefined,
        sort: sort || undefined,
        start: pagination?.start || 0,
        limit: pagination?.pageSize || 25,
      });

      const total = await strapi.entityService.count('api::event.event', {
        filters: { band: { id: bandIdFilter } },
      });

      return {
        data: results,
        meta: {
          pagination: {
            page: 1,
            pageSize: pagination?.pageSize || 25,
            pageCount: Math.ceil(total / (pagination?.pageSize || 25)),
            total,
          },
        },
      };
    }

    if (userId) {
      // Only allow listing another user's events when the caller is that user.
      if (ctx.state.user?.id && String(ctx.state.user.id) !== String(userId)) {
        return ctx.forbidden('You do not have permission to list these events');
      }

      const { fields, populate, sort, pagination } = ctx.query;

      const results = await strapi.entityService.findMany('api::event.event', {
        filters: { users_permissions_user: { id: userId } },
        fields: fields || undefined,
        populate: populate || undefined,
        sort: sort || undefined,
        start: pagination?.start || 0,
        limit: pagination?.pageSize || 25,
      });

      const total = await strapi.entityService.count('api::event.event', {
        filters: { users_permissions_user: { id: userId } },
      });

      return {
        data: results,
        meta: {
          pagination: {
            page: 1,
            pageSize: pagination?.pageSize || 25,
            pageCount: Math.ceil(total / (pagination?.pageSize || 25)),
            total,
          },
        },
      };
    }

    // Fall back to default find for other queries
    return await super.find(ctx);
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const body = ctx.request.body?.data || ctx.request.body || {};
    const bandId = body.band?.connect?.[0]?.id || body.band?.id || body.band || null;

    if (bandId) {
      const access = await requireBandPermission(strapi, user.id, bandId, 'manageEvents');
      if (!access) {
        return ctx.forbidden('Your role does not allow managing events for this band');
      }
    }

    return await super.create(ctx);
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const gate = await assertCanManageEvent(strapi, user, ctx.params.id);
    if (!gate.ok) {
      return gate.status === 404 ? ctx.notFound(gate.message) : ctx.forbidden(gate.message);
    }

    return await super.update(ctx);
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('You must be logged in.');

    const gate = await assertCanManageEvent(strapi, user, ctx.params.id);
    if (!gate.ok) {
      return gate.status === 404 ? ctx.notFound(gate.message) : ctx.forbidden(gate.message);
    }

    return await super.delete(ctx);
  },
}));
