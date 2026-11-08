'use strict';

/**
 * In-memory throttle for anonymous account creation. Every POST
 * /stripe/register creates a Stripe customer, a trial subscription and a user,
 * so a script can otherwise mint them without limit.
 *
 * Keyed by client IP. The app runs behind Railway's proxy without
 * `proxy: true`, so ctx.ip is the proxy; the rightmost X-Forwarded-For entry
 * is the address the proxy saw (clients can only prepend entries).
 * Per process: a restart resets it, which is acceptable for a soft limit.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function clientIp(ctx) {
  const xff = String(ctx.request?.headers?.['x-forwarded-for'] || '');
  const parts = xff.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts[parts.length - 1] : String(ctx.ip || 'unknown');
}

function allowSignup(ctx, now = Date.now()) {
  const key = clientIp(ctx);
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10000) {
    for (const [k, list] of hits) if (!list.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return true;
}

module.exports = { allowSignup, clientIp, WINDOW_MS, MAX_PER_WINDOW, _hits: hits };
