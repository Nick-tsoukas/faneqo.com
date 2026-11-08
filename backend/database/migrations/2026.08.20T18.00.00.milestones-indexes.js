'use strict';

/**
 * Repeatable unique + lookup indexes for milestones.
 * Safe if the table does not exist yet (bootstrap recreates after schema sync).
 */

const {
  UNIQUE_IDEMPOTENCY_SQL,
  OCCURRED_SQL,
  TYPE_STATUS_SQL,
  TIMELINE_SQL,
  isPostgres,
} = require('../../src/utils/milestones/milestoneIndexes');

async function up(knex) {
  if (!isPostgres(knex) && !String(knex?.client?.config?.client || '').toLowerCase().includes('sqlite')) {
    return;
  }
  try {
    const hasTable = await knex.schema.hasTable('milestones');
    if (!hasTable) return;
    const hasKey = await knex.schema.hasColumn('milestones', 'idempotency_key');
    if (!hasKey) return;
    await knex.raw(UNIQUE_IDEMPOTENCY_SQL);
    if (await knex.schema.hasColumn('milestones', 'occurred_at')) {
      await knex.raw(OCCURRED_SQL);
    }
    if ((await knex.schema.hasColumn('milestones', 'type')) && (await knex.schema.hasColumn('milestones', 'status'))) {
      await knex.raw(TYPE_STATUS_SQL);
    }
    if (
      (await knex.schema.hasColumn('milestones', 'band_id')) &&
      (await knex.schema.hasColumn('milestones', 'subject_fan_id')) &&
      (await knex.schema.hasColumn('milestones', 'type'))
    ) {
      await knex.raw(TIMELINE_SQL);
    }
  } catch (err) {
    console.warn(`[Milestone] index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
