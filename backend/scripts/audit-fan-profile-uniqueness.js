/**
 * Read-only FanProfile uniqueness audit.
 *
 *   node scripts/audit-fan-profile-uniqueness.js
 *
 * Answers one question: can one users-permissions user own more than one
 * FanProfile today? Prints aggregate counts only — never emails, names, or
 * user ids. Creates no indexes and repairs no rows; --apply is rejected.
 *
 * Local development is SQLite and production is Postgres, so the two targets
 * are reported separately. A CLEAN local result says nothing about production.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo FanProfile Uniqueness] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
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
  const { auditFanProfileUniqueness } = require('../src/utils/fanProfile/fanProfileIndexes');
  const result = await auditFanProfileUniqueness(knex);

  log(label, {
    dialect: result.dialect,
    state: result.state,
    layout: result.layout,
    table: result.table,
    counts: result.counts,
  });
  log(`${label}.indexes`, {
    inspected: result.index.inspected,
    oneProfilePerUserGuaranteed: result.index.userUnique,
    pairOnlyUnique: result.index.pairUnique,
    names: result.index.names,
  });
  log(`${label}.duplicates`, {
    groups: result.duplicates.groups,
    extraRows: result.duplicates.extraRows,
    largestGroup: result.duplicates.largestGroup,
    safe: result.duplicates.safeGroups,
    conflicting: result.duplicates.conflictingGroups,
    unknown: result.duplicates.unknownGroups,
    bookkeepingOnly: result.duplicates.bookkeepingOnlyGroups,
    truncated: result.duplicates.truncated || undefined,
    skipped: result.duplicates.skipped || undefined,
  });
  log(`${label}.verdict`, { canActivateUnique: result.canActivateUnique });

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
    console.error('[Faneqo FanProfile Uniqueness] --apply is forbidden. This script is audit-only.');
    process.exitCode = 1;
    return;
  }

  const env = { ...readEnvFile(), ...process.env };
  log('start', { mode: 'read-only', pii: 'not_logged' });

  const rel = env.DATABASE_FILENAME || '.tmp/data.db';
  const file = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);

  const local = fs.existsSync(file)
    ? await tryDatabase('local-sqlite', {
        client: 'better-sqlite3',
        connection: { filename: file },
        useNullAsDefault: true,
      })
    : (log('local-sqlite', { skipped: true, reason: 'no_sqlite_file', state: 'UNKNOWN' }), null);

  const remote = env.DATABASE_URL
    ? await tryDatabase('database-url', {
        client: 'pg',
        connection: env.DATABASE_URL,
        pool: { min: 0, max: 1 },
      })
    : (log('database-url', { skipped: true, reason: 'no_DATABASE_URL', state: 'UNKNOWN' }), null);

  log('result', {
    localSqlite: local?.state || 'UNKNOWN',
    databaseUrl: remote?.state || 'UNKNOWN',
    note: 'A local CLEAN result does not prove production is clean. Run against the production database before trusting the unique index activation.',
  });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
