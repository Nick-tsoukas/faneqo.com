/**
 * Read-only message campaign + recipient snapshot audit.
 *
 *   node scripts/audit-message-campaign-integrity.js
 *
 * Prints aggregate counts only. Never prints recipient data, repairs rows, or
 * creates constraints. --apply is intentionally rejected.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Campaign Integrity] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function readEnvFile() {
  const file = path.join(__dirname, '..', '.env');
  const map = {};
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

async function audit(label, knex) {
  const { auditCampaignIntegrity } = require('../src/utils/messaging/campaignIntegrity');
  const result = await auditCampaignIntegrity(knex, {
    staleMinutes: process.env.CAMPAIGN_AUDIT_STALE_MINUTES || 30,
  });
  const counts = Object.fromEntries(Object.entries(result.checks).map(([key, value]) => [
    key,
    value.skipped ? 'UNKNOWN' : Number(value.n || 0),
  ]));
  log(label, { state: result.readiness.state, layout: result.layout, counts, checkStates: result.readiness.checks });
  return result;
}

async function tryDatabase(label, config) {
  let knex;
  try {
    knex = require('knex')(config);
    await knex.raw('select 1 as ok');
    return await audit(label, knex);
  } catch (err) {
    log(label, { skipped: true, reason: err.code || err.message || 'connect_failed', state: 'UNKNOWN' });
    return null;
  } finally {
    if (knex) await knex.destroy();
  }
}

async function main() {
  if (APPLY) {
    console.error('[Faneqo Campaign Integrity] --apply is forbidden. M1-A is audit-only.');
    process.exitCode = 1;
    return;
  }
  const env = { ...readEnvFile(), ...process.env };
  log('start', { mode: 'read-only', pii: 'not_logged' });

  const rel = env.DATABASE_FILENAME || '.tmp/data.db';
  const file = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);
  const local = fs.existsSync(file)
    ? await tryDatabase('local', { client: 'better-sqlite3', connection: { filename: file }, useNullAsDefault: true })
    : (log('local', { skipped: true, reason: 'no_sqlite_file', state: 'UNKNOWN' }), null);
  const remote = env.DATABASE_URL
    ? await tryDatabase('database-url', { client: 'pg', connection: env.DATABASE_URL, pool: { min: 0, max: 1 } })
    : (log('database-url', { skipped: true, reason: 'no_DATABASE_URL', state: 'UNKNOWN' }), null);

  log('result', {
    local: local?.readiness?.state || 'UNKNOWN',
    databaseUrl: remote?.readiness?.state || 'UNKNOWN',
    note: 'Do not add constraints or repair data until the intended production database reports CLEAN.',
  });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
