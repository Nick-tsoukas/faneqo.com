'use strict';

/**
 * Creative Studio gate. Same model as Labs (src/api/labs/utils/labsAuth.js):
 * routes are declared auth:false so users-permissions cannot 403 and reveal
 * the surface; the controller resolves the bearer JWT itself and answers with
 * a stealth 404 for everyone outside the allowlist.
 *
 * Allowlist = CREATIVE_STUDIO_EMAILS (comma list) ∪ the production studio
 * owner. test@gmail.com is added only when NODE_ENV=development, matching the
 * frontend's utils/ads/access.js.
 */

const PRODUCTION_EMAIL = 'nick.tsoukas101@gmail.com';
const DEV_EMAIL = 'test@gmail.com';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function allowedEmails(env = process.env) {
  const configured = String(env.CREATIVE_STUDIO_EMAILS || '')
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);
  const set = new Set([PRODUCTION_EMAIL, ...configured]);
  if (env.NODE_ENV === 'development') set.add(DEV_EMAIL);
  return set;
}

function isStudioEmail(email, env = process.env) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized) && allowedEmails(env).has(normalized);
}

function creativeNotFound(ctx) {
  ctx.status = 404;
  ctx.body = {
    data: null,
    error: { status: 404, name: 'NotFoundError', message: 'Not Found' },
  };
  return ctx.body;
}

async function resolveStudioUser(ctx, strapiInstance = strapi) {
  if (ctx.state?.user?.id && ctx.state.user.email) return ctx.state.user;
  const header = ctx.request?.headers?.authorization || ctx.request?.headers?.Authorization || '';
  const raw = typeof header === 'string' ? header : '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : '';
  if (!token) return null;
  try {
    const payload = await strapiInstance.plugins['users-permissions'].services.jwt.verify(token);
    const id = payload?.id;
    if (!id) return null;
    return strapiInstance.db.query('plugin::users-permissions.user').findOne({
      where: { id },
      select: ['id', 'email', 'blocked'],
    });
  } catch {
    return null;
  }
}

/** { user } when allowlisted, otherwise { error } with the 404 already written. */
async function requireStudioUser(ctx, strapiInstance = strapi, env = process.env) {
  const user = await resolveStudioUser(ctx, strapiInstance);
  if (!user?.id || user.blocked) return { error: creativeNotFound(ctx) };
  if (!isStudioEmail(user.email, env)) return { error: creativeNotFound(ctx) };
  return { user: { id: user.id, email: normalizeEmail(user.email) } };
}

module.exports = {
  PRODUCTION_EMAIL,
  DEV_EMAIL,
  normalizeEmail,
  allowedEmails,
  isStudioEmail,
  creativeNotFound,
  resolveStudioUser,
  requireStudioUser,
};
