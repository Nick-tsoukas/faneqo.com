'use strict';

/**
 * Postgres (and SQLite) indexes for Moment.
 * UNIQUE(idempotency_key) is required for concurrent create safety.
 * Timeline FK columns may be inline or join-table; skip-safe if missing.
 */

const TABLE = 'moments';

const UNIQUE_IDEMPOTENCY_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS moments_idempotency_key_unique ON moments (idempotency_key)';

const OCCURRED_SQL =
  'CREATE INDEX IF NOT EXISTS moments_occurred_id ON moments (occurred_at, id)';

const KIND_STATUS_SQL =
  'CREATE INDEX IF NOT EXISTS moments_kind_status ON moments (kind, status)';

const SOURCE_SQL =
  'CREATE INDEX IF NOT EXISTS moments_source ON moments (source_type, source_id)';

const TIMELINE_SQL =
  'CREATE INDEX IF NOT EXISTS moments_band_fan_occurred ON moments (band_id, subject_fan_id, occurred_at)';

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
    strapi.log?.info?.(`[Moment] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi.log?.warn?.(`[Moment] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureMomentIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };
  if (!(await tableExists(knex, TABLE))) return { skipped: true, reason: 'no_table' };

  const hasKey = await columnExists(knex, TABLE, 'idempotency_key');
  if (!hasKey) return { skipped: true, reason: 'missing_columns' };

  const results = [await execIndex(strapi, knex, 'idempotency', UNIQUE_IDEMPOTENCY_SQL)];

  if (await columnExists(knex, TABLE, 'occurred_at')) {
    results.push(await execIndex(strapi, knex, 'occurred', OCCURRED_SQL));
  }
  if ((await columnExists(knex, TABLE, 'kind')) && (await columnExists(knex, TABLE, 'status'))) {
    results.push(await execIndex(strapi, knex, 'kind_status', KIND_STATUS_SQL));
  }
  if ((await columnExists(knex, TABLE, 'source_type')) && (await columnExists(knex, TABLE, 'source_id'))) {
    results.push(await execIndex(strapi, knex, 'source', SOURCE_SQL));
  }
  if (
    (await columnExists(knex, TABLE, 'band_id')) &&
    (await columnExists(knex, TABLE, 'subject_fan_id')) &&
    (await columnExists(knex, TABLE, 'occurred_at'))
  ) {
    results.push(await execIndex(strapi, knex, 'timeline', TIMELINE_SQL));
  }

  return { ok: results.every((row) => row.ok), results };
}

module.exports = {
  TABLE,
  UNIQUE_IDEMPOTENCY_SQL,
  OCCURRED_SQL,
  KIND_STATUS_SQL,
  SOURCE_SQL,
  TIMELINE_SQL,
  isPostgres,
  ensureMomentIndexes,
};
