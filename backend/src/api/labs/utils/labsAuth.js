'use strict';

const { createFeatureService } = require('../../../utils/features/featureService');
const { getBandRole } = require('../../../utils/bandRoles');

function labsNotFound(ctx) {
  ctx.status = 404;
  ctx.body = {
    data: null,
    error: {
      status: 404,
      name: 'NotFoundError',
      message: 'Not Found',
    },
  };
  return ctx.body;
}

async function resolveLabsUser(ctx) {
  if (ctx.state.user?.id) return ctx.state.user;
  const header = ctx.request.headers.authorization || ctx.request.headers.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = await strapi.plugins['users-permissions'].services.jwt.verify(token);
    const id = payload?.id;
    if (!id) return null;
    return strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id },
      select: ['id', 'email'],
    });
  } catch {
    return null;
  }
}

function parsePositiveInt(raw) {
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

async function requireLabsUser(ctx) {
  const user = await resolveLabsUser(ctx);
  if (!user?.id) return { error: labsNotFound(ctx) };
  try {
    await createFeatureService(strapi).assertFeature('internal_labs', { user });
  } catch {
    return { error: labsNotFound(ctx) };
  }
  return { user };
}

async function requireLabsBand(ctx, user) {
  const bandId = parsePositiveInt(ctx.query?.bandId);
  if (!bandId) return { bandId: null };
  try {
    const role = await getBandRole(strapi, bandId, user.id);
    if (!role) return { bandId: null };
    return { bandId };
  } catch {
    return { bandId: null };
  }
}

function maskEmail(email) {
  const raw = String(email || '');
  const at = raw.indexOf('@');
  if (at < 1) return '***';
  const user = raw.slice(0, at);
  const domain = raw.slice(at + 1);
  const keep = user.slice(0, 1);
  return `${keep}***@${domain}`;
}

module.exports = {
  labsNotFound,
  resolveLabsUser,
  parsePositiveInt,
  requireLabsUser,
  requireLabsBand,
  maskEmail,
};
