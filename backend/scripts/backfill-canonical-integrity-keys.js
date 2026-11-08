/**
 * Canonical integrity-key backfill / audit.
 *
 *   node scripts/backfill-canonical-integrity-keys.js
 *   node scripts/backfill-canonical-integrity-keys.js --apply
 *
 * Default is DRY RUN (no mutation).
 * --apply stops if duplicate identity groups exist. It does not merge fans
 * or suppress attendance. Unique indexes are created only after coverage is
 * complete and duplicate keys are zero.
 *
 * Production Railway Postgres is not reachable from a typical local laptop
 * (postgres.railway.internal). Run this on the backend service host.
 * Do not print emails or hash inputs.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Integrity Keys] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
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
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

function sqlitePath(env) {
  const rel = env.DATABASE_FILENAME || '.tmp/data.db';
  const abs = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);
  return abs;
}

async function runWithKnex(label, knex) {
  const { runCanonicalIdentityKeyBackfill } = require('../src/utils/integrity/canonicalIdentityKeyBackfill');
  const result = await runCanonicalIdentityKeyBackfill(knex, { apply: APPLY, log });
  log(label, {
    mode: result.mode,
    stopped: result.stopped,
    reason: result.reason,
    fansScanned: result.fansScanned,
    fansMissingKey: result.fansMissingKey,
    fanDuplicateGroups: result.fanDuplicateGroups,
    attendanceScanned: result.attendanceScanned,
    campaignKeysMissing: result.campaignKeysMissing,
    eventKeysMissing: result.eventKeysMissing,
    campaignDuplicateGroups: result.campaignDuplicateGroups,
    eventDuplicateGroups: result.eventDuplicateGroups,
    fansUpdated: result.fansUpdated,
    attendanceUpdated: result.attendanceUpdated,
    fanIndex: result.identityIndexes?.fan,
    campaignIndex: result.identityIndexes?.campaign,
    eventIndex: result.identityIndexes?.event,
    productionStatus: 'UNKNOWN',
  });
  return result;
}

async function trySqlite(env) {
  const file = sqlitePath(env);
  if (!fs.existsSync(file)) {
    log('local', { skipped: true, reason: 'no_sqlite_file' });
    return null;
  }
  let knex;
  try {
    knex = require('knex')({
      client: 'better-sqlite3',
      connection: { filename: file },
      useNullAsDefault: true,
    });
    await knex.raw('select 1 as ok');
    log('local', { client: 'sqlite', reachable: true });
    return await runWithKnex('local-keys', knex);
  } catch (err) {
    log('local', { skipped: true, reason: err.code || err.message || 'connect_failed' });
    return null;
  } finally {
    if (knex) await knex.destroy();
  }
}

async function tryPostgres(env) {
  const url = env.DATABASE_URL;
  if (!url) {
    log('production', { skipped: true, reason: 'no_DATABASE_URL', status: 'UNKNOWN' });
    return null;
  }
  let knex;
  try {
    knex = require('knex')({
      client: 'pg',
      connection: url,
      pool: { min: 0, max: 1 },
    });
    await knex.raw('select 1 as ok');
    log('configured-postgres', {
      reachable: true,
      note: 'Connected DATABASE_URL. Do not treat this as production-clean unless this process is on the Railway backend host.',
    });
    return await runWithKnex('url-keys', knex);
  } catch (err) {
    log('production', {
      skipped: true,
      reason: err.code || 'connect_failed',
      status: 'UNKNOWN',
    });
    return null;
  } finally {
    if (knex) await knex.destroy();
  }
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };
  log('start', {
    mode: APPLY ? 'apply' : 'dry-run',
    productionStatus: 'UNKNOWN',
  });

  const local = await trySqlite(env);
  const remote = await tryPostgres(env);

  if (!local && !remote) {
    log('result', {
      local: 'UNREACHABLE',
      production: 'UNKNOWN',
      note: 'Cursor/local cannot resolve postgres.railway.internal. Run this script on the Railway backend service (shell or railway run) with that service DATABASE_URL. Do not add a public integrity endpoint.',
    });
    process.exitCode = 0;
    return;
  }

  const stopped = Boolean(local?.stopped || remote?.stopped);
  log('result', {
    local: local ? local.identityIndexes?.fan || local.mode : 'UNREACHABLE',
    remote: remote ? remote.identityIndexes?.fan || remote.mode : 'UNKNOWN',
    productionStatus: 'UNKNOWN',
    stopped,
  });
  if (stopped) process.exitCode = 1;
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
