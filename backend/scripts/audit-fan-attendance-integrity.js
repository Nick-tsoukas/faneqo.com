/**
 * Read-only fan + attendance duplicate audit.
 *
 *   node scripts/audit-fan-attendance-integrity.js
 *
 * Never prints emails. Never deletes or merges rows.
 * --apply is rejected: Phase 05A has no destructive remediation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Integrity] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
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

async function auditWithKnex(label, knex) {
  const { runIntegrityAudit } = require('../src/utils/integrity/fanAttendanceIntegrity');
  const audit = await runIntegrityAudit(knex);
  log(label, {
    fanUniqueness: audit.constraints.fanUniqueness,
    campaignAttendance: audit.constraints.campaignAttendance,
    eventAttendance: audit.constraints.eventAttendance,
    fanLayout: audit.physical?.layout?.fanBand,
    attFanLayout: audit.physical?.layout?.attFan,
    uniqueApplyFan: audit.physical?.uniqueIndexApplicability?.fan,
    fansScanned: audit.coverage?.fansScanned,
    fanGroups: audit.fans.groups,
    fanExcess: audit.fans.excessRows,
    fanLargest: audit.fans.largestGroup,
    fanClasses: audit.fans.classes,
    fansMissingKey: audit.coverage?.fansMissingKey,
    fanDuplicateKeyGroups: audit.coverage?.fanDuplicateKeyGroups,
    fanKeyCoveragePct: audit.coverage?.fanKeyCoveragePct,
    attendanceScanned: audit.coverage?.attendanceScanned,
    campaignGroups: audit.attendance.campaignGroups,
    eventGroups: audit.attendance.eventGroups,
    campaignExcess: audit.attendance.campaignExcess,
    eventExcess: audit.attendance.eventExcess,
    campaignKeysMissing: audit.coverage?.campaignMissingKey,
    eventKeysMissing: audit.coverage?.eventMissingKey,
    campaignDuplicateKeyGroups: audit.coverage?.campaignDuplicateKeyGroups,
    eventDuplicateKeyGroups: audit.coverage?.eventDuplicateKeyGroups,
    campaignKeyCoveragePct: audit.coverage?.campaignKeyCoveragePct,
    eventKeyCoveragePct: audit.coverage?.eventKeyCoveragePct,
    fanIdentityIndex: audit.identityIndexes?.fan,
    campaignIdentityIndex: audit.identityIndexes?.campaign,
    eventIdentityIndex: audit.identityIndexes?.event,
    neverSuppressedTrue: audit.attendance.neverSuppressedTrue,
    bothCampaignAndEvent: audit.attendance.bothCampaignAndEvent,
    fanLabel: audit.labels?.fanIdentity,
    campaignLabel: audit.labels?.campaignAttendance,
    eventLabel: audit.labels?.eventAttendance,
    productionStatus: 'UNKNOWN',
  });
  return audit;
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
    return await auditWithKnex('local-audit', knex);
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
    log('production-db', { reachable: true, note: 'connected DATABASE_URL — still not claimed production-clean' });
    return await auditWithKnex('url-audit', knex);
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
  if (APPLY) {
    console.error('[Faneqo Integrity] --apply is not implemented. Phase 05A is audit-only.');
    process.exitCode = 1;
    return;
  }

  const env = { ...readEnvFile(), ...process.env };
  log('start', { mode: 'read-only' });

  const local = await trySqlite(env);
  const remote = await tryPostgres(env);

  if (!local && !remote) {
    log('result', {
      local: 'UNREACHABLE',
      production: 'UNKNOWN',
      note: 'Do not apply unique constraints against uninspected production data.',
    });
    process.exitCode = 0;
    return;
  }

  log('result', {
    local: local ? local.constraints.fanUniqueness : 'UNREACHABLE',
    productionConstraints: remote ? remote.constraints : 'UNKNOWN',
    productionStatus: remote ? 'INSPECTED_THIS_URL_ONLY' : 'UNKNOWN',
  });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
