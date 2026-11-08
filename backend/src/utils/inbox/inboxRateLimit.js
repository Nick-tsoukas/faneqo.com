'use strict';

/**
 * In-process send limiter for Inbox DMs.
 * Reuses the same Map/window pattern as policies/ratelimit-read.js.
 *
 * Defaults:
 *   30 messages / 60s per authenticated user
 *   10 messages / 10s per (user, conversation)
 */

const USER_WINDOW_MS = 60 * 1000;
const USER_LIMIT = 30;
const CONV_WINDOW_MS = 10 * 1000;
const CONV_LIMIT = 10;

const REQUEST_WINDOW_MS = 15 * 60 * 1000;
const REQUEST_LIMIT = 8;

const userBuckets = new Map();
const convBuckets = new Map();
const requestBuckets = new Map();

function hit(bucketMap, key, now, windowMs, limit) {
  if (bucketMap.size > 400) {
    for (const [k, b] of bucketMap) {
      if (now > b.reset) bucketMap.delete(k);
    }
  }
  let bucket = bucketMap.get(key);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
  }
  bucket.count += 1;
  bucketMap.set(key, bucket);
  if (bucket.count > limit) {
    return {
      limited: true,
      retryAfter: Math.max(1, Math.ceil((bucket.reset - now) / 1000)),
    };
  }
  return { limited: false, retryAfter: 0 };
}

function checkInboxSendRate({ userId, conversationId, now = Date.now() } = {}) {
  const userHit = hit(userBuckets, String(userId), now, USER_WINDOW_MS, USER_LIMIT);
  if (userHit.limited) return userHit;
  return hit(convBuckets, `${userId}:${conversationId}`, now, CONV_WINDOW_MS, CONV_LIMIT);
}

function checkRequestCreateRate({ userId, now = Date.now() } = {}) {
  return hit(requestBuckets, `req:${userId}`, now, REQUEST_WINDOW_MS, REQUEST_LIMIT);
}

function resetInboxRateLimitForTests() {
  userBuckets.clear();
  convBuckets.clear();
  requestBuckets.clear();
}

module.exports = {
  USER_WINDOW_MS,
  USER_LIMIT,
  CONV_WINDOW_MS,
  CONV_LIMIT,
  REQUEST_WINDOW_MS,
  REQUEST_LIMIT,
  checkInboxSendRate,
  checkRequestCreateRate,
  resetInboxRateLimitForTests,
};
