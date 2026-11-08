'use strict';

/**
 * Repeatable unique + lookup indexes for moments.
 * Safe if the table does not exist yet (bootstrap recreates after schema sync).
 */

const {
  UNIQUE_IDEMPOTENCY_SQL,
  OCCURRED_SQL,
  KIND_STATUS_SQL,
  SOURCE_SQL,
  TIMELINE_SQL,
  isPostgres,
} = require('../../src/utils/moments/momentIndexes');

async function up(knex) {
  if (!isPostgres(knex) && !String(knex?.client?.config?.client || '').toLowerCase().includes('sqlite')) {
    return;
  }
  try {
    const hasTable = await knex.schema.hasTable('moments');
    if (!hasTable) return;
    const hasKey = await knex.schema.hasColumn('moments', 'idempotency_key');
    if (!hasKey) return;
    await knex.raw(UNIQUE_IDEMPOTENCY_SQL);
    if (await knex.schema.hasColumn('moments', 'occurred_at')) {
      await knex.raw(OCCURRED_SQL);
    }
    if ((await knex.schema.hasColumn('moments', 'kind')) && (await knex.schema.hasColumn('moments', 'status'))) {
      await knex.raw(KIND_STATUS_SQL);
    }
    if ((await knex.schema.hasColumn('moments', 'source_type')) && (await knex.schema.hasColumn('moments', 'source_id'))) {
      await knex.raw(SOURCE_SQL);
    }
    if (
      (await knex.schema.hasColumn('moments', 'band_id')) &&
      (await knex.schema.hasColumn('moments', 'subject_fan_id')) &&
      (await knex.schema.hasColumn('moments', 'occurred_at'))
    ) {
      await knex.raw(TIMELINE_SQL);
    }
  } catch (err) {
    console.warn(`[Moment] index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
