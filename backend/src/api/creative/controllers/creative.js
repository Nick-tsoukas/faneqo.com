'use strict';

const { requireStudioUser } = require('../utils/creativeAuth');
const { createCreativeService } = require('../services/creative');
const {
  sanitizeCreativeInput,
  presentCreative,
  presentCreativeCard,
  parseId,
  clampPage,
} = require('../utils/creativePure');

function badRequest(ctx, errors) {
  ctx.status = 400;
  ctx.body = { data: null, error: { status: 400, name: 'ValidationError', message: errors.join('; '), details: { errors } } };
  return ctx.body;
}

function notFound(ctx) {
  ctx.status = 404;
  ctx.body = { data: null, error: { status: 404, name: 'NotFoundError', message: 'Not Found' } };
  return ctx.body;
}

module.exports = {
  async list(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const page = clampPage(ctx.query);
    const { rows, total } = await createCreativeService(strapi).list(gate.user.email, page);
    ctx.set('Cache-Control', 'private, no-store');
    ctx.body = { data: rows.map(presentCreativeCard), meta: { total, ...page } };
  },

  async artists(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const start = Math.max(0, parseInt(ctx.query?.start, 10) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(ctx.query?.limit, 10) || 24));
    const { rows, total } = await createCreativeService(strapi).artists({ start, limit });
    ctx.set('Cache-Control', 'private, no-store');
    ctx.body = { rows, total, start, limit };
  },

  async findOne(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const id = parseId(ctx.params?.id);
    if (!id) return notFound(ctx);
    const row = await createCreativeService(strapi).findOwned(gate.user.email, id);
    if (!row) return notFound(ctx);
    ctx.set('Cache-Control', 'private, no-store');
    ctx.body = { data: presentCreative(row) };
  },

  async create(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const body = ctx.request?.body?.data || ctx.request?.body || {};
    const input = sanitizeCreativeInput(body);
    if (!input.ok) return badRequest(ctx, input.errors);
    const row = await createCreativeService(strapi).create(gate.user, input.data);
    ctx.status = 201;
    ctx.body = { data: presentCreative(row) };
  },

  async update(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const id = parseId(ctx.params?.id);
    if (!id) return notFound(ctx);
    const body = ctx.request?.body?.data || ctx.request?.body || {};
    const input = sanitizeCreativeInput(body, { partial: true });
    if (!input.ok) return badRequest(ctx, input.errors);
    const row = await createCreativeService(strapi).update(gate.user.email, id, input.data);
    if (!row) return notFound(ctx);
    ctx.body = { data: presentCreative(row) };
  },

  async duplicate(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const id = parseId(ctx.params?.id);
    if (!id) return notFound(ctx);
    const row = await createCreativeService(strapi).duplicate(gate.user, id);
    if (!row) return notFound(ctx);
    ctx.status = 201;
    ctx.body = { data: presentCreative(row) };
  },

  async remove(ctx) {
    const gate = await requireStudioUser(ctx);
    if (gate.error) return gate.error;
    const id = parseId(ctx.params?.id);
    if (!id) return notFound(ctx);
    const row = await createCreativeService(strapi).remove(gate.user.email, id);
    if (!row) return notFound(ctx);
    ctx.body = { data: { id } };
  },
};
