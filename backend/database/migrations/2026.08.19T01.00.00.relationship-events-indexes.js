'use strict';

/**
 * Repeatable unique + timeline indexes for relationship_events.
 * Safe if the table does not exist yet (bootstrap recreates after schema sync).
 */

const {
  UNIQUE_IDEMPOTENCY_SQL,
  TIMELINE_SQL,
  BROADCAST_SQL,
  isPostgres,
} = require('../../src/utils/relationshipEvents/relationshipEventIndexes');

async function up(knex) {
  if (!isPostgres(knex) && !String(knex?.client?.config?.client || '').toLowerCase().includes('sqlite')) {
    return;
  }
  try {
    const hasTable = await knex.schema.hasTable('relationship_events');
    if (!hasTable) return;
    await knex.raw(UNIQUE_IDEMPOTENCY_SQL);
    await knex.raw(TIMELINE_SQL);
    await knex.raw(BROADCAST_SQL);
  } catch (err) {
    console.warn(`[RelationshipEvent] index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
