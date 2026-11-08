'use strict';

/**
 * Convert leftover UNIQUE INDEX into a UNIQUE CONSTRAINT of the same name
 * is not required here — we only need uniqueness. CREATE UNIQUE INDEX IF NOT EXISTS
 * is idempotent on Postgres and SQLite.
 *
 * Runs before schema sync when pending. Safe if the table does not exist yet
 * (bootstrap recreates the index after schema sync).
 */

const { UNIQUE_SQL, isPostgres } = require('../../src/utils/features/featureEnrollmentIndexes');

async function up(knex) {
  if (!isPostgres(knex) && !String(knex?.client?.config?.client || '').toLowerCase().includes('sqlite')) {
    return;
  }
  try {
    const hasTable = await knex.schema.hasTable('feature_enrollments');
    if (!hasTable) return;
    await knex.raw(UNIQUE_SQL);
  } catch (err) {
    // Do not fail boot if the table is mid-schema-sync.
    console.warn(`[Labs] unique index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
