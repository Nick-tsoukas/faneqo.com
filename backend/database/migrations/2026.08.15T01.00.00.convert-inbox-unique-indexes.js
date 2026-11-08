'use strict';

/**
 * Convert leftover Inbox UNIQUE INDEXES into UNIQUE CONSTRAINTS of the same
 * name so Strapi 4.24 dropUnique() (DROP CONSTRAINT) cannot crash schema sync.
 *
 * Runs before schema sync when pending. Idempotent.
 */

const { allConvertSql } = require('../../src/utils/inbox/inboxUniqueness');

function isPostgres(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  return name.includes('pg') || name.includes('postgres');
}

async function up(knex) {
  if (!isPostgres(knex)) return;
  await knex.raw(allConvertSql());
}

async function down() {}

module.exports = { up, down };
