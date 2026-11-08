'use strict';

/**
 * Canonical fan email identity. Matches existing fan.service.normalizeEmail:
 * trim + lowercase. Do not invent a second algorithm.
 */
function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const n = email.trim().toLowerCase();
  return n || null;
}

function hashEmailKey(normalized) {
  const crypto = require('crypto');
  if (!normalized) return null;
  return crypto.createHash('sha256').update(String(normalized)).digest('hex').slice(0, 12);
}

function isUniqueViolation(err) {
  if (!err) return false;
  const code = String(err.code || '');
  if (code === '23505' || code === 'UNIQUE_VIOLATION' || code === 'SQLITE_CONSTRAINT') return true;
  const msg = String(err.message || '').toLowerCase();
  if (
    msg.includes('canonical_identity_key') ||
    msg.includes('campaign_identity_key') ||
    msg.includes('event_identity_key') ||
    msg.includes('fans_canonical_identity') ||
    msg.includes('fan_show_attendances_campaign_identity') ||
    msg.includes('fan_show_attendances_event_identity')
  ) {
    return true;
  }
  return (
    msg.includes('unique') &&
    (msg.includes('constraint') ||
      msg.includes('duplicate') ||
      msg.includes('fans_band_normalized') ||
      msg.includes('fan_show_attendances_fan_'))
  );
}

async function findFanByCanonicalIdentityKey(strapi, key) {
  if (!key) return null;
  const rows = await strapi.entityService.findMany('api::fan.fan', {
    filters: { canonicalIdentityKey: key },
    sort: ['id:asc'],
    limit: 1,
  });
  return rows?.[0] || null;
}

async function findFanByBandEmail(strapi, bandId, email) {
  const normalized = normalizeEmail(email);
  if (!normalized || !bandId) return null;
  const rows = await strapi.entityService.findMany('api::fan.fan', {
    filters: { email: { $eqi: normalized }, band: bandId },
    sort: ['id:asc'],
    limit: 5,
  });
  if (!rows?.length) return null;
  return [...rows].sort((a, b) => Number(a.id) - Number(b.id))[0];
}

async function createFanIdempotent(strapi, { bandId, data }) {
  const email = normalizeEmail(data?.email);
  const resolvedBandId = bandId || data?.band;
  const { buildFanCanonicalIdentityKey } = require('../integrity/canonicalIdentityKeys');
  const canonicalIdentityKey = buildFanCanonicalIdentityKey({ bandId: resolvedBandId, email });
  const payload = { ...data, email };
  if (canonicalIdentityKey) payload.canonicalIdentityKey = canonicalIdentityKey;
  try {
    const fan = await strapi.entityService.create('api::fan.fan', { data: payload });
    return { created: true, fan };
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;
    const fan =
      (await findFanByCanonicalIdentityKey(strapi, canonicalIdentityKey)) ||
      (await findFanByBandEmail(strapi, resolvedBandId, email));
    if (!fan) throw err;
    return { created: false, fan };
  }
}

module.exports = {
  normalizeEmail,
  hashEmailKey,
  isUniqueViolation,
  findFanByCanonicalIdentityKey,
  findFanByBandEmail,
  createFanIdempotent,
};
