// Trusted server-to-server user administration (Nuxt social login only).
'use strict';

const crypto = require('crypto');

/**
 * Only the dedicated USER_ADMIN_SECRET is accepted. There is deliberately no
 * fallback to STRAPI_API_TOKEN: that token is shared with the content API and
 * other tooling, and holding it must not grant JWT issuance or user edits.
 * Missing or short secret = every request is refused (fail closed).
 */
const MIN_SECRET_LENGTH = 32;

function configuredSecret() {
  const value = String(process.env.USER_ADMIN_SECRET || '').trim();
  return value.length >= MIN_SECRET_LENGTH ? value : '';
}

function validateSecret(ctx) {
  const expected = configuredSecret();
  if (!expected) return false;
  const header = String(ctx.request.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return false;
  const given = Buffer.from(header.slice(7).trim());
  const want = Buffer.from(expected);
  return given.length === want.length && crypto.timingSafeEqual(given, want);
}

function deny(ctx) {
  if (!configuredSecret()) strapi.log.error('[user-admin] USER_ADMIN_SECRET missing or shorter than 32 characters; refusing');
  return ctx.unauthorized('Invalid or missing authorization');
}

// The only fields social login writes (billing link after Stripe trial setup)
const UPDATABLE_FIELDS = ['customerId', 'subscriptionId', 'subscriptionStatus', 'trialEndsAt'];

// What callers may read back: never password, reset or confirmation tokens
const PUBLIC_FIELDS = [
  'id', 'username', 'email', 'provider', 'confirmed', 'blocked',
  'customerId', 'subscriptionId', 'subscriptionStatus', 'plan', 'trialEndsAt',
];

function publicUser(user) {
  if (!user) return user;
  const out = {};
  for (const field of PUBLIC_FIELDS) if (user[field] !== undefined) out[field] = user[field];
  return out;
}

// Complimentary Lifetime Pro (plan or status "free") is never changed from here
function isLifetimePro(user) {
  return String(user?.plan || '').trim() === 'free' || String(user?.subscriptionStatus || '').trim() === 'free';
}

module.exports = {
  async update(ctx) {
    if (!validateSecret(ctx)) return deny(ctx);

    const id = Number(ctx.params.id);
    if (!id) return ctx.badRequest('Invalid user');

    const body = ctx.request.body || {};
    const data = {};
    for (const field of UPDATABLE_FIELDS) if (body[field] !== undefined) data[field] = body[field];
    const rejected = Object.keys(body).filter((key) => !UPDATABLE_FIELDS.includes(key));
    if (rejected.length) return ctx.badRequest('Unsupported fields');
    if (!Object.keys(data).length) return ctx.badRequest('Nothing to update');

    try {
      const current = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id },
        select: ['id', 'plan', 'subscriptionStatus'],
      });
      if (!current) return ctx.notFound('User not found');
      if (isLifetimePro(current) && data.subscriptionStatus !== undefined && data.subscriptionStatus !== 'free') {
        strapi.log.warn(`[user-admin] refused to change Lifetime Pro status for user ${id}`);
        delete data.subscriptionStatus;
        if (!Object.keys(data).length) return { data: publicUser(current) };
      }

      const updated = await strapi.entityService.update('plugin::users-permissions.user', id, { data });
      return { data: publicUser(updated) };
    } catch (error) {
      strapi.log.error(`[user-admin] update failed for user ${id}: ${error?.message}`);
      return ctx.badRequest('Failed to update user');
    }
  },

  async findByEmail(ctx) {
    if (!validateSecret(ctx)) return deny(ctx);

    const email = String(ctx.params.email || '').trim();
    if (!email) return ctx.badRequest('Missing email');

    try {
      const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
        filters: { email: { $eqi: email } },
        limit: 1,
      });
      return users.map(publicUser);
    } catch (error) {
      strapi.log.error(`[user-admin] findByEmail failed: ${error?.message}`);
      return ctx.badRequest('Failed to find user');
    }
  },

  /**
   * Issue a Strapi JWT for an already-verified identity.
   *
   * Trusted server callers only (admin secret). The caller is responsible for
   * proving identity — the Nuxt social route verifies a Firebase ID token and
   * passes the token's email. This exists so social login never has to know,
   * set or reset a user's password.
   */
  async issueJwt(ctx) {
    if (!validateSecret(ctx)) return deny(ctx);

    const { email, userId } = ctx.request.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

    if (!normalizedEmail) {
      return ctx.badRequest('Missing email');
    }

    try {
      const user = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: normalizedEmail },
      });

      if (!user) {
        return ctx.notFound('User not found');
      }
      if (userId != null && String(userId) !== String(user.id)) {
        return ctx.badRequest('User mismatch');
      }
      if (user.blocked) {
        return ctx.forbidden('Account blocked');
      }
      if (user.confirmed !== true) {
        return ctx.forbidden('Account not confirmed');
      }

      const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

      strapi.log.info(`[user-admin] JWT issued for verified identity (user ${user.id})`);

      return { jwt, user: { id: user.id, email: user.email } };
    } catch (error) {
      strapi.log.error(`[user-admin] issueJwt failed: ${error?.message}`);
      return ctx.badRequest('Failed to issue token');
    }
  },

  async register(ctx) {
    if (!validateSecret(ctx)) return deny(ctx);

    const { username, email, password, confirmed, provider } = ctx.request.body || {};
    const normalizedEmail = typeof email === 'string' ? email.trim() : '';

    if (!normalizedEmail || !password) {
      return ctx.badRequest('Missing email or password');
    }

    try {
      const existingUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { email: { $eqi: normalizedEmail } },
      });

      if (existingUser) {
        return ctx.badRequest('User with this email already exists');
      }

      const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
        where: { type: 'authenticated' },
      });

      if (!authRole) {
        return ctx.badRequest('Authenticated role not found');
      }

      // Create user directly without sending confirmation email
      const newUser = await strapi.plugins['users-permissions'].services.user.add({
        username: username || normalizedEmail,
        email: normalizedEmail,
        password,
        provider: provider || 'local',
        confirmed: confirmed !== false, // default to true
        role: authRole.id,
        subscriptionStatus: 'unpaid',
      });

      strapi.log.info(`[user-admin] user registered (user ${newUser.id})`);

      return { data: publicUser(newUser) };
    } catch (error) {
      strapi.log.error(`[user-admin] register failed: ${error?.message}`);
      return ctx.badRequest('Failed to register user');
    }
  },
};
