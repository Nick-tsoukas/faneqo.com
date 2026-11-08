'use strict';

/**
 * Convert 05A canonical identity UNIQUE INDEXES into UNIQUE CONSTRAINTS of
 * the same name so Strapi 4.24 dropUnique() (DROP CONSTRAINT) cannot crash
 * schema sync when moments/milestones/artist_updates change the schema.
 *
 * Partial UNIQUE INDEX (WHERE key IS NOT NULL) is equivalent to a UNIQUE
 * CONSTRAINT here: Postgres allows multiple NULLs either way.
 *
 * Must run before schema sync. Idempotent. Postgres only.
 *
 * unique: true on the Strapi attributes is required so sync does not then
 * drop the converted constraint as "extra".
 */

const { convertIndexToConstraintSql } = require('../../src/utils/inbox/inboxUniqueness');

const TARGETS = [
  {
    table: 'fans',
    column: 'canonical_identity_key',
    indexName: 'fans_canonical_identity_key_unique',
  },
  {
    table: 'fan_show_attendances',
    column: 'campaign_identity_key',
    indexName: 'fan_show_attendances_campaign_identity_key_unique',
  },
  {
    table: 'fan_show_attendances',
    column: 'event_identity_key',
    indexName: 'fan_show_attendances_event_identity_key_unique',
  },
];

function isPostgres(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  return name.includes('pg') || name.includes('postgres');
}

async function up(knex) {
  if (!isPostgres(knex)) return;
  for (const row of TARGETS) {
    await knex.raw(convertIndexToConstraintSql(row));
  }
}

async function down() {}

module.exports = { up, down, TARGETS };
