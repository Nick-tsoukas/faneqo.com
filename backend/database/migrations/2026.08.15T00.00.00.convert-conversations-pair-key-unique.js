'use strict';

const { convertIndexToConstraintSql } = require('../../src/utils/inbox/inboxUniqueness');

function isPostgres(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  return name.includes('pg') || name.includes('postgres');
}

async function up(knex) {
  if (!isPostgres(knex)) return;
  await knex.raw(convertIndexToConstraintSql({
    table: 'conversations',
    column: 'pair_key',
    indexName: 'conversations_pair_key_unique',
  }));
}

async function down() {}

module.exports = { up, down };
