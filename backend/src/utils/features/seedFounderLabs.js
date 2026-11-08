'use strict';

/**
 * One-time bootstrap seed for the developing founder.
 *
 * Env (either):
 *   FANEQO_LABS_FOUNDER_USER_ID
 *   FANEQO_LABS_FOUNDER_EMAIL
 *
 * Used ONLY to create/update a FeatureEnrollment row.
 * Request authorization never reads these env values.
 */

const { upsertEnrollment } = require('./featureService');

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

async function seedFounderLabs(strapi) {
  const rawId = String(process.env.FANEQO_LABS_FOUNDER_USER_ID || '').trim();
  const rawEmail = normalizeEmail(process.env.FANEQO_LABS_FOUNDER_EMAIL || '');

  if (!rawId && !rawEmail) {
    strapi.log?.info?.(
      '[Labs] founder seed skipped (set FANEQO_LABS_FOUNDER_USER_ID or FANEQO_LABS_FOUNDER_EMAIL once)'
    );
    return { skipped: true, reason: 'no_env' };
  }

  let user = null;
  if (rawId) {
    const id = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
    user = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id },
      select: ['id', 'email'],
    });
  }
  if (!user && rawEmail) {
    const users = await strapi.entityService.findMany('plugin::users-permissions.user', {
      filters: { email: { $eqi: rawEmail } },
      fields: ['id', 'email'],
      limit: 2,
    });
    if (users.length > 1) {
      strapi.log?.warn?.('[Labs] founder seed skipped: email matched more than one user');
      return { skipped: true, reason: 'ambiguous_email' };
    }
    user = users[0] || null;
  }

  if (!user?.id) {
    strapi.log?.warn?.('[Labs] founder seed skipped: user not found');
    return { skipped: true, reason: 'user_not_found' };
  }

  await upsertEnrollment(strapi, {
    featureKey: 'internal_labs',
    subjectType: 'user',
    subjectId: String(user.id),
    status: 'enabled',
    grantedBy: 'bootstrap:env',
    metadata: { note: 'Founder Labs seed. Access is FeatureEnrollment, not env.' },
  });

  strapi.log?.info?.(`[Labs] founder enrollment ready userId=${user.id}`);
  return { ok: true, userId: user.id };
}

module.exports = { seedFounderLabs };
