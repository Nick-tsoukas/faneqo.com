'use strict';

const assert = require('assert');
const { convertIndexToConstraintSql } = require('../src/utils/inbox/inboxUniqueness');

const sql = convertIndexToConstraintSql({
  table: 'conversations',
  column: 'pair_key',
  indexName: 'conversations_pair_key_unique',
});
assert.ok(sql.includes('DROP INDEX IF EXISTS'));
assert.ok(sql.includes('ADD CONSTRAINT conversations_pair_key_unique UNIQUE (pair_key)'));
assert.ok(sql.includes('indisunique = true'));
console.log('  ✅ pair-key convert SQL refuses non-unique same-named indexes');
console.log('\n=== pair-key sql: 1 passed ===\n');
