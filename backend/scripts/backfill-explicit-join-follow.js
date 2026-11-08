/**
 * Conservative Follow backfill for historical explicit Join Fan List.
 *
 *   node scripts/backfill-explicit-join-follow.js
 *   node scripts/backfill-explicit-join-follow.js --apply
 *
 * Default is DRY RUN. Only fans with followedAt IS NULL and a
 * fan-interaction joined_fan_list row are eligible.
 *
 * Does NOT convert subscribed / check-in / import / message Fans.
 * Does NOT use relationship-event fan_joined.
 * Never prints emails.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { planExplicitJoinFollowBackfill } = require('../src/utils/fans/fanFollowBackfill');

const APPLY = process.argv.includes('--apply');

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${typeof value === 'object' ? JSON.stringify(value) : value}`);
  console.log(`[Faneqo Follow Backfill] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
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

async function loadPlan(knex) {
  const fans = await knex('fans').select('id', 'followed_at as followedAt', 'unfollowed_at as unfollowedAt');
  let joinEvents = [];
  const hasInteractions = await knex.schema.hasTable('fan_interactions');
  if (hasInteractions) {
    const hasFanId = await knex.schema.hasColumn('fan_interactions', 'fan_id');
    if (hasFanId) {
      joinEvents = await knex('fan_interactions')
        .select({ fanId: 'fan_id', timestamp: 'timestamp', interactionType: 'interaction_type' })
        .where('interaction_type', 'joined_fan_list')
        .whereNotNull('fan_id');
    }
  }
  return planExplicitJoinFollowBackfill({ fans, joinEvents });
}

async function applyPlan(knex, plan) {
  let updated = 0;
  for (const row of plan.updates) {
    const n = await knex('fans')
      .where({ id: row.fanId })
      .whereNull('followed_at')
      .update({ followed_at: row.followedAt, updated_at: new Date() });
    updated += Number(n) || 0;
  }
  return updated;
}

async function runWithKnex(label, knex) {
  const hasFollowedAt = await knex.schema.hasColumn('fans', 'followed_at');
  if (!hasFollowedAt) {
    log(label, { skipped: true, reason: 'followed_at_column_missing', mode: APPLY ? 'apply' : 'dry-run' });
    return { skipped: true, reason: 'followed_at_column_missing' };
  }
  const plan = await loadPlan(knex);
  let updated = 0;
  if (APPLY) updated = await applyPlan(knex, plan);
  log(label, {
    mode: APPLY ? 'apply' : 'dry-run',
    scanned: plan.scanned,
    joinEvents: plan.joinEvents,
    eligible: plan.updates.length,
    updated,
    skippedNoJoin: plan.skipped.noProvenJoin,
    skippedHasFollowedAt: plan.skipped.alreadyHasFollowedAt,
    provenance: 'joined_fan_list',
  });
  return { plan, updated };
}

async function trySqlite(env) {
  const rel = env.DATABASE_FILENAME || '.tmp/data.db';
  const file = path.isAbsolute(rel) ? rel : path.join(__dirname, '..', rel);
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
    return await runWithKnex('local', knex);
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
    log('postgres', { skipped: true, reason: 'no_DATABASE_URL' });
    return null;
  }
  if (/railway\.internal/i.test(url)) {
    log('postgres', { skipped: true, reason: 'production_internal_unreachable' });
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
    return await runWithKnex('postgres', knex);
  } catch (err) {
    log('postgres', { skipped: true, reason: err.code || err.message || 'connect_failed' });
    return null;
  } finally {
    if (knex) await knex.destroy();
  }
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };
  log('start', { mode: APPLY ? 'apply' : 'dry-run', provenance: 'joined_fan_list' });
  const local = await trySqlite(env);
  if (!local) await tryPostgres(env);
}

main().catch((err) => {
  console.error('[Faneqo Follow Backfill] failed', err.message || err);
  process.exit(1);
});
