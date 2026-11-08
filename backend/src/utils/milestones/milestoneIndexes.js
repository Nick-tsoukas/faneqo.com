'use strict';

/**
 * Postgres (and SQLite) indexes for Milestone.
 * UNIQUE(idempotency_key) is required for concurrent create safety.
 * Timeline FK columns may be inline or join-table; skip-safe if missing.
 */

const TABLE = 'milestones';

const UNIQUE_IDEMPOTENCY_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS milestones_idempotency_key_unique ON milestones (idempotency_key)';

const OCCURRED_SQL =
  'CREATE INDEX IF NOT EXISTS milestones_occurred_id ON milestones (occurred_at, id)';

const TYPE_STATUS_SQL =
  'CREATE INDEX IF NOT EXISTS milestones_type_status ON milestones (type, status)';

const TIMELINE_SQL =
  'CREATE INDEX IF NOT EXISTS milestones_band_fan_type ON milestones (band_id, subject_fan_id, type)';

function isPostgres(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  return name.includes('pg') || name.includes('postgres');
}

async function tableExists(knex, table) {
  try {
    return await knex.schema.hasTable(table);
  } catch {
    return false;
  }
}

async function columnExists(knex, table, column) {
  try {
    return await knex.schema.hasColumn(table, column);
  } catch {
    return false;
  }
}

async function execIndex(strapi, knex, label, sql) {
  try {
    await knex.raw(sql);
    strapi.log?.info?.(`[Milestone] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi.log?.warn?.(`[Milestone] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureMilestoneIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };
  if (!(await tableExists(knex, TABLE))) return { skipped: true, reason: 'no_table' };

  const hasKey = await columnExists(knex, TABLE, 'idempotency_key');
  if (!hasKey) return { skipped: true, reason: 'missing_columns' };

  const results = [await execIndex(strapi, knex, 'idempotency', UNIQUE_IDEMPOTENCY_SQL)];

  if (await columnExists(knex, TABLE, 'occurred_at')) {
    results.push(await execIndex(strapi, knex, 'occurred', OCCURRED_SQL));
  }
  if ((await columnExists(knex, TABLE, 'type')) && (await columnExists(knex, TABLE, 'status'))) {
    results.push(await execIndex(strapi, knex, 'type_status', TYPE_STATUS_SQL));
  }
  if (
    (await columnExists(knex, TABLE, 'band_id')) &&
    (await columnExists(knex, TABLE, 'subject_fan_id')) &&
    (await columnExists(knex, TABLE, 'type'))
  ) {
    results.push(await execIndex(strapi, knex, 'timeline', TIMELINE_SQL));
  }

  return { ok: results.every((row) => row.ok), results };
}

module.exports = {
  TABLE,
  UNIQUE_IDEMPOTENCY_SQL,
  OCCURRED_SQL,
  TYPE_STATUS_SQL,
  TIMELINE_SQL,
  isPostgres,
  ensureMilestoneIndexes,
};
