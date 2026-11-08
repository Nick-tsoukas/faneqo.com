'use strict';

/**
 * Signed, single-use OAuth `state` for provider connections (YouTube).
 *
 * Format: `mbqr|band:<bandId>|<payload>.<sig>`
 *   - the readable `band:<id>` prefix is what the Nuxt callback page parses to
 *     know where to redirect; it is checked against the signed payload
 *   - payload = base64url JSON { u: userId, b: bandId, n: nonce, exp }
 *   - sig = HMAC-SHA256(payload) under a key derived from the users-permissions
 *     JWT secret with a purpose label (no new environment variable needed)
 *
 * verify() requires a valid signature, an unexpired state, the same user that
 * started the flow, and consumes the nonce once (unique system-kv key), so a
 * captured or replayed callback is refused.
 */
const crypto = require('crypto');

const PURPOSE = 'faneqo-oauth-state-v1';
const TTL_MS = 10 * 60 * 1000;
const NONCE_PREFIX = 'oauth-state:';

function stateKey(strapi) {
  const base = strapi?.config?.get?.('plugin.users-permissions.jwtSecret') || process.env.JWT_SECRET;
  if (!base) throw new Error('oauth-state-secret-missing');
  return crypto.createHmac('sha256', String(base)).update(PURPOSE).digest();
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(strapi, payload) {
  return b64url(crypto.createHmac('sha256', stateKey(strapi)).update(payload).digest());
}

function createOAuthState(strapi, { userId, bandId, now = Date.now() }) {
  const u = Number(userId);
  const b = Number(bandId);
  if (!u || !b) throw new Error('oauth-state-ids-required');
  const payload = b64url(JSON.stringify({ u, b, n: crypto.randomBytes(16).toString('hex'), exp: now + TTL_MS }));
  return `mbqr|band:${b}|${payload}.${sign(strapi, payload)}`;
}

/** Parse + check signature, expiry and user. Does not consume the nonce. */
function readOAuthState(strapi, state, { userId, now = Date.now() } = {}) {
  const m = /^mbqr\|band:(\d+)\|([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(state || ''));
  if (!m) return { ok: false, reason: 'state-malformed' };
  const [, prefixBand, payload, sig] = m;

  const expected = Buffer.from(sign(strapi, payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
    return { ok: false, reason: 'state-signature' };
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return { ok: false, reason: 'state-malformed' };
  }
  if (Number(prefixBand) !== Number(data.b)) return { ok: false, reason: 'state-band-mismatch' };
  if (!data.exp || now > Number(data.exp)) return { ok: false, reason: 'state-expired' };
  if (!userId || Number(userId) !== Number(data.u)) return { ok: false, reason: 'state-user-mismatch' };
  if (!/^[a-f0-9]{32}$/.test(String(data.n || ''))) return { ok: false, reason: 'state-malformed' };

  return { ok: true, bandId: Number(data.b), userId: Number(data.u), nonce: data.n, exp: Number(data.exp) };
}

/**
 * Consume the nonce once. system-kv `key` is `unique: true`; entityService
 * enforces that on create, so a second use of the same nonce fails.
 */
async function consumeOAuthNonce(strapi, nonce, bandId) {
  try {
    await strapi.entityService.create('api::system-kv.system-kv', {
      data: { key: `${NONCE_PREFIX}${nonce}`, value: { usedAt: new Date().toISOString() }, band: bandId },
    });
    return true;
  } catch {
    return false;
  }
}

async function verifyOAuthState(strapi, state, { userId, now } = {}) {
  const read = readOAuthState(strapi, state, { userId, now });
  if (!read.ok) return read;
  const fresh = await consumeOAuthNonce(strapi, read.nonce, read.bandId);
  if (!fresh) return { ok: false, reason: 'state-replayed' };
  return read;
}

module.exports = { createOAuthState, readOAuthState, verifyOAuthState, TTL_MS, NONCE_PREFIX };
