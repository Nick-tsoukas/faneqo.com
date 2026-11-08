/**
 * Show Moment backfill / audit from canonical unsuppressed attendance.
 *
 *   node scripts/backfill-show-moments.js
 *   node scripts/backfill-show-moments.js --apply
 *
 * Default is DRY RUN (no mutation). Repeatable. No attendance or fan writes.
 * Does not print emails or other PII.
 *
 * --apply loads Strapi and upserts Moments via ensureShowMomentForAttendanceSafe.
 * Do not run --apply against production unless explicitly asked.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Show Moments] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
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

function summarize(label, plan, applied) {
  const report = applied || plan.report;
  log(label, {
    mode: APPLY ? 'apply' : 'dry-run',
    scanned: report.scanned,
    eligible: report.eligible,
    existing: report.existing,
    wouldCreate: plan.report.wouldCreate,
    created: report.created || 0,
    duplicatesSkipped: report.duplicatesSkipped || 0,
    suppressedSkipped: report.suppressedSkipped,
    ineligibleSkipped: report.ineligibleSkipped,
    errors: report.errors || 0,
  });
  return report;
}

async function planWithKnex(label, knex) {
  const { planShowMomentBackfill } = require('../src/utils/moments/showMomentBackfill');
  const plan = await planShowMomentBackfill(knex);
  summarize(label, plan);
  return plan;
}

async function applyWithStrapi(plan) {
  const { createStrapi } = require('@strapi/strapi');
  const { applyShowMomentBackfill } = require('../src/utils/moments/showMomentBackfill');
  const app = await createStrapi().load();
  try {
    const report = await applyShowMomentBackfill(app, plan);
    log('apply', {
      created: report.created,
      duplicatesSkipped: report.duplicatesSkipped,
      errors: report.errors,
    });
    return report;
  } finally {
    await app.destroy();
  }
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
    return await planWithKnex('local-plan', knex);
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
      note: 'Connected DATABASE_URL. Do not treat this as production unless this process is on the Railway backend host.',
    });
    return await planWithKnex('url-plan', knex);
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
      note: 'Cursor/local cannot resolve postgres.railway.internal. Run dry-run on the Railway backend host if needed. Do not apply to production unless asked.',
    });
    process.exitCode = 0;
    return;
  }

  if (APPLY) {
    const plan = remote || local;
    await applyWithStrapi(plan);
  }

  log('result', {
    mode: APPLY ? 'apply' : 'dry-run',
    productionStatus: 'UNKNOWN',
  });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
