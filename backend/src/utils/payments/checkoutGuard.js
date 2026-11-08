'use strict';

/**
 * Abuse limits for the public checkout endpoint (POST /bands/:id/payments/checkout).
 *
 * Card testers in October 2026 opened thousands of Checkout Sessions against a
 * handful of bands. Two independent limits apply, so neither is IP-only:
 *   - per band: caps sessions a band can open in the window, whatever the source
 *   - per visitor on a band: client IP (as appended by the proxy) + user agent,
 *     generous enough for a crowd on shared venue Wi-Fi
 * Repeat taps with the same `attemptId` reuse the session already created.
 *
 * In-memory per process (Railway runs one instance). Limits are env-tunable.
 */

const crypto = require('crypto');

const WINDOW_MS = 10 * 60 * 1000;
const ATTEMPT_TTL_MS = 10 * 60 * 1000;

function limits(env = process.env) {
  const int = (v, d) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    perBand: int(env.FANEQO_CHECKOUT_LIMIT_PER_BAND, 120),
    perVisitor: int(env.FANEQO_CHECKOUT_LIMIT_PER_VISITOR, 10),
  };
}

/**
 * Client IP behind Railway's proxy. Koa's ctx.ip is the proxy address (the app
 * does not set `proxy: true`), so read X-Forwarded-For. The proxy appends the
 * address it saw, so the rightmost entry is the one a client cannot forge.
 */
function clientIp(ctx) {
  const xff = String(ctx.request?.headers?.['x-forwarded-for'] || '');
  const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(ctx.ip || ctx.request?.ip || 'unknown');
}

function visitorKey(ctx) {
  const ua = String(ctx.request?.headers?.['user-agent'] || '');
  return crypto.createHash('sha256').update(`${clientIp(ctx)}|${ua}`).digest('base64url').slice(0, 22);
}

function createCheckoutGuard({ now = () => Date.now(), env = process.env } = {}) {
  const hits = new Map(); // key -> number[] (timestamps)
  const attempts = new Map(); // attemptKey -> { at, result }

  function prune(list, t) {
    while (list.length && t - list[0] > WINDOW_MS) list.shift();
    return list;
  }

  function count(key, t) {
    return prune(hits.get(key) || [], t).length;
  }

  function record(key, t) {
    const list = prune(hits.get(key) || [], t);
    list.push(t);
    hits.set(key, list);
  }

  /** @returns {{ ok: true } | { ok: false, retryAfterSec: number, scope: 'band'|'visitor' }} */
  function check(bandId, ctx) {
    const t = now();
    const { perBand, perVisitor } = limits(env);
    const bandKey = `b:${bandId}`;
    const visitor = `v:${bandId}:${visitorKey(ctx)}`;
    const over = count(bandKey, t) >= perBand ? 'band' : count(visitor, t) >= perVisitor ? 'visitor' : null;
    if (over) {
      const oldest = (hits.get(over === 'band' ? bandKey : visitor) || [t])[0];
      return { ok: false, scope: over, retryAfterSec: Math.max(1, Math.ceil((oldest + WINDOW_MS - t) / 1000)) };
    }
    return { ok: true };
  }

  function recordSession(bandId, ctx) {
    const t = now();
    record(`b:${bandId}`, t);
    record(`v:${bandId}:${visitorKey(ctx)}`, t);
  }

  function attemptKey(bandId, attemptId, buttonKey, cents) {
    const id = String(attemptId || '').trim();
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return null;
    return `${bandId}:${buttonKey}:${cents}:${id}`;
  }

  function reuse(key) {
    if (!key) return null;
    const hit = attempts.get(key);
    if (!hit) return null;
    if (now() - hit.at > ATTEMPT_TTL_MS) {
      attempts.delete(key);
      return null;
    }
    return hit.result;
  }

  function remember(key, result) {
    if (!key) return;
    const t = now();
    attempts.set(key, { at: t, result });
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (t - v.at > ATTEMPT_TTL_MS) attempts.delete(k);
    }
  }

  return { check, recordSession, attemptKey, reuse, remember };
}

module.exports = { createCheckoutGuard, clientIp, visitorKey, limits, WINDOW_MS };
