#!/usr/bin/env node

/**
 * MBQ Cron Job Runner
 * Triggers auto-moment and recap evaluators on a schedule
 * 
 * Environment Variables:
 *   QRDB_URL - Base URL of the Strapi backend (e.g., https://qrdb-production.up.railway.app)
 *   MBQ_CRON_KEY - Secret key for authenticating with evaluator endpoints
 *   TIMEOUT_MS - Optional, request timeout in milliseconds (default: 15000)
 *   RETRY_LIMIT - Optional, attempts for 502/503/504 or network errors (default: 3)
 */

const TIMEOUT_MS = parseInt(process.env.TIMEOUT_MS || '15000', 10);
const RETRY_LIMIT = parseInt(process.env.RETRY_LIMIT || '3', 10);
const TRANSIENT_STATUSES = new Set([502, 503, 504]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTransientHttp(status) {
  return TRANSIENT_STATUSES.has(Number(status));
}

/**
 * Make a POST request with timeout
 */
async function postWithTimeout(url, headers, body, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

/**
 * Call an evaluator endpoint
 */
async function callEvaluator(name, url, cronKey) {
  console.log(`[${name}] Calling ${url}...`);
  
  const headers = {
    'Content-Type': 'application/json',
    'x-mbq-cron-key': cronKey,
  };

  const body = { dryRun: false };
  let last = { ok: false, error: 'not_attempted' };

  for (let attempt = 1; attempt <= RETRY_LIMIT; attempt += 1) {
    try {
      const response = await postWithTimeout(url, headers, body, TIMEOUT_MS);
      let data = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (response.ok) {
        console.log(`[${name}] Response:`, JSON.stringify(data, null, 2));
        return { ok: data?.ok === true, status: response.status, data };
      }

      last = { ok: false, status: response.status, data };
      console.error(`[${name}] HTTP ${response.status}: ${JSON.stringify(data)}`);

      if (!isTransientHttp(response.status) || attempt === RETRY_LIMIT) {
        return last;
      }
      const waitMs = attempt * 2000;
      console.log(`[${name}] retry ${attempt}/${RETRY_LIMIT} after ${waitMs}ms (qrserver likely restarting)`);
      await sleep(waitMs);
    } catch (err) {
      last = { ok: false, error: err.message };
      console.error(`[${name}] Error: ${err.message}`);
      if (attempt === RETRY_LIMIT) return last;
      const waitMs = attempt * 2000;
      console.log(`[${name}] retry ${attempt}/${RETRY_LIMIT} after ${waitMs}ms`);
      await sleep(waitMs);
    }
  }

  return last;
}

/**
 * Main entry point
 */
async function main() {
  console.log('='.repeat(60));
  console.log(`MBQ Cron Runner - ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Validate environment
  const qrdbUrl = process.env.QRDB_URL;
  const cronKey = process.env.MBQ_CRON_KEY;

  if (!qrdbUrl) {
    console.error('ERROR: QRDB_URL environment variable is required');
    process.exit(1);
  }

  if (!cronKey) {
    console.error('ERROR: MBQ_CRON_KEY environment variable is required');
    process.exit(1);
  }

  console.log(`QRDB_URL: ${qrdbUrl}`);
  console.log(`TIMEOUT_MS: ${TIMEOUT_MS}`);
  console.log('');

  // Call evaluators sequentially
  const results = [];

  // 1. Evaluate auto-moments
  const autoResult = await callEvaluator(
    'evaluate-auto',
    `${qrdbUrl}/api/fan-moments/evaluate-auto`,
    cronKey
  );
  results.push({ name: 'evaluate-auto', ...autoResult });

  console.log('');

  // 2. Evaluate recaps
  const recapResult = await callEvaluator(
    'evaluate-recap',
    `${qrdbUrl}/api/fan-moments/evaluate-recap`,
    cronKey
  );
  results.push({ name: 'evaluate-recap', ...recapResult });

  console.log('');
  console.log('='.repeat(60));
  console.log('Summary:');
  
  let allOk = true;
  for (const r of results) {
    const status = r.ok ? '✓ OK' : '✗ FAILED';
    console.log(`  ${r.name}: ${status}`);
    if (!r.ok) allOk = false;
  }

  console.log('='.repeat(60));

  if (!allOk) {
    console.error('One or more evaluators failed');
    process.exit(1);
  }

  console.log('All evaluators completed successfully');
  process.exit(0);
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
