'use strict';

/**
 * Postgres (and SQLite) indexes for RelationshipEvent.
 * UNIQUE(idempotency_key) plus timeline indexes.
 */

const TABLE = 'relationship_events';

const UNIQUE_IDEMPOTENCY_SQL =
  'CREATE UNIQUE INDEX IF NOT EXISTS relationship_events_idempotency_key_unique ON relationship_events (idempotency_key)';

const TIMELINE_SQL =
  'CREATE INDEX IF NOT EXISTS relationship_events_band_fan_occurred ON relationship_events (band_id, fan_id, occurred_at DESC)';

const BROADCAST_SQL =
  'CREATE INDEX IF NOT EXISTS relationship_events_band_broadcast_occurred ON relationship_events (band_id, occurred_at DESC) WHERE fan_id IS NULL';

const TYPE_OCCURRED_SQL =
  'CREATE INDEX IF NOT EXISTS relationship_events_band_fan_type_occurred ON relationship_events (band_id, fan_id, type, occurred_at)';

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
    strapi.log?.info?.(`[RelationshipEvent] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi.log?.warn?.(`[RelationshipEvent] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureRelationshipEventIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };
  if (!(await tableExists(knex, TABLE))) return { skipped: true, reason: 'no_table' };

  const hasKey = await columnExists(knex, TABLE, 'idempotency_key');
  const hasBand = await columnExists(knex, TABLE, 'band_id');
  const hasFan = await columnExists(knex, TABLE, 'fan_id');
  const hasOccurred = await columnExists(knex, TABLE, 'occurred_at');
  if (!hasKey || !hasBand || !hasFan || !hasOccurred) {
    return { skipped: true, reason: 'missing_columns' };
  }

  const hasType = await columnExists(knex, TABLE, 'type');
  const results = [
    await execIndex(strapi, knex, 'idempotency', UNIQUE_IDEMPOTENCY_SQL),
    await execIndex(strapi, knex, 'timeline', TIMELINE_SQL),
    await execIndex(strapi, knex, 'broadcast', BROADCAST_SQL),
  ];
  if (hasType) {
    results.push(await execIndex(strapi, knex, 'type_occurred', TYPE_OCCURRED_SQL));
  }
  return { ok: results.every((row) => row.ok), results };
}

module.exports = {
  TABLE,
  UNIQUE_IDEMPOTENCY_SQL,
  TIMELINE_SQL,
  BROADCAST_SQL,
  TYPE_OCCURRED_SQL,
  isPostgres,
  ensureRelationshipEventIndexes,
};
