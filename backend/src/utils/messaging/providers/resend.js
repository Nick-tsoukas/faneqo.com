'use strict';

/**
 * Resend provider adapter for Faneqo campaigns.
 *
 * Controllers must not call Resend directly. Swap transport later
 * (Batch endpoint, Broadcasts API, faneqo_inbox) without changing campaigns.
 *
 * Current path: transactional REST POST /emails (via resendMailer.sendOne),
 * with optional concurrency batching and 429 backoff.
 */

const resendMailer = require('../../resendMailer');

const DEFAULT_CONCURRENCY = 5;
const MAX_RETRIES_ON_429 = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(result) {
  const headers = result?.raw?.headers || result?.headers;
  const retryAfter = headers?.['retry-after'] || headers?.['Retry-After'];
  if (retryAfter == null) return null;
  const asNum = Number(retryAfter);
  if (!Number.isNaN(asNum)) return Math.min(Math.max(asNum * 1000, 250), 30000);
  const asDate = Date.parse(retryAfter);
  if (!Number.isNaN(asDate)) return Math.min(Math.max(asDate - Date.now(), 250), 30000);
  return null;
}

/**
 * Send one campaign email with 429-aware retries.
 */
async function sendOne(options = {}) {
  let attempt = 0;

  while (attempt <= MAX_RETRIES_ON_429) {
    const result = await resendMailer.sendOne(options);

    if (result.ok) return result;

    if (result.status === 429 && attempt < MAX_RETRIES_ON_429) {
      const fromHeader = parseRetryAfterMs(result);
      const backoff = fromHeader != null ? fromHeader : Math.min(500 * 2 ** attempt, 8000);
      await sleep(backoff);
      attempt += 1;
      continue;
    }

    return result;
  }

  return {
    ok: false,
    status: 429,
    error: 'Rate limited by Resend after retries',
    raw: null,
  };
}

/**
 * Deliver a list of independent emails with limited concurrency.
 * Each item is a full sendOne options object.
 *
 * @returns {Promise<Array>} results aligned with input order
 */
async function sendBatch(items = [], { concurrency = DEFAULT_CONCURRENCY } = {}) {
  const list = Array.isArray(items) ? items : [];
  const results = new Array(list.length);
  let cursor = 0;

  async function worker() {
    while (cursor < list.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await sendOne(list[index]);
    }
  }

  const pool = Math.max(1, Math.min(concurrency, list.length || 1));
  await Promise.all(Array.from({ length: pool }, () => worker()));
  return results;
}

/**
 * Campaign-level entry (future: Broadcasts / segments).
 * Today delegates to per-recipient transactional sends.
 */
async function sendCampaign({ deliveries, concurrency = DEFAULT_CONCURRENCY }) {
  return sendBatch(deliveries, { concurrency });
}

function getProviderStatus() {
  return {
    provider: 'resend',
    transport: 'transactional_emails_api',
    batchApiAvailable: true,
    broadcastsRecommendedForMarketing: true,
    contactsSynced: false,
  };
}

module.exports = {
  sendOne,
  sendBatch,
  sendCampaign,
  getProviderStatus,
};
