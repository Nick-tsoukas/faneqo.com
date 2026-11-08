'use strict';

/**
 * Repeatable lookup index for earliest fan_replied (and similar type queries).
 * Skip-safe if columns live in join tables instead of relationship_events.
 */

const { TYPE_OCCURRED_SQL, isPostgres } = require('../../src/utils/relationshipEvents/relationshipEventIndexes');

async function up(knex) {
  if (!isPostgres(knex) && !String(knex?.client?.config?.client || '').toLowerCase().includes('sqlite')) {
    return;
  }
  try {
    const hasTable = await knex.schema.hasTable('relationship_events');
    if (!hasTable) return;
    const needed = ['band_id', 'fan_id', 'type', 'occurred_at'];
    for (const col of needed) {
      if (!(await knex.schema.hasColumn('relationship_events', col))) return;
    }
    await knex.raw(TYPE_OCCURRED_SQL);
  } catch (err) {
    console.warn(`[RelationshipEvent] type index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
