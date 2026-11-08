'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { INVARIANTS, convertIndexToConstraintSql } = require('../src/utils/inbox/inboxUniqueness');

const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function schemaUnique(rel, field) {
  const json = JSON.parse(read(rel));
  const attr = json.attributes[field];
  assert.ok(attr, `${rel} missing ${field}`);
  assert.strictEqual(attr.unique, true, `${field} must stay unique:true so Strapi owns the constraint`);
}

schemaUnique('src/api/conversation/content-types/conversation/schema.json', 'pairKey');
schemaUnique('src/api/conversation-participant/content-types/conversation-participant/schema.json', 'conversationSideKey');
schemaUnique('src/api/conversation-message/content-types/conversation-message/schema.json', 'idempotencyKey');

const indexSrc = read('src/utils/inbox/inboxIndexes.js');
assert.doesNotMatch(indexSrc, /CREATE UNIQUE INDEX IF NOT EXISTS/);
assert.doesNotMatch(indexSrc, /ADD CONSTRAINT \w+ UNIQUE/);
assert.match(indexSrc, /CREATE INDEX IF NOT EXISTS conversations_last_message_at/);
assert.match(indexSrc, /CREATE INDEX IF NOT EXISTS conversation_messages_created_id/);

const dbSrc = read('config/database.js');
assert.doesNotMatch(dbSrc, /afterCreate/);
assert.doesNotMatch(dbSrc, /PAIR_KEY_CONSTRAINT_SQL/);
assert.match(dbSrc, /forceMigration:\s*false/);

assert.strictEqual(INVARIANTS.length, 3);
for (const inv of INVARIANTS) {
  const sql = convertIndexToConstraintSql({
    table: inv.table,
    column: inv.column,
    indexName: inv.customIndexName,
  });
  assert.match(sql, /indisunique = true/);
  assert.match(sql, new RegExp(`ADD CONSTRAINT ${inv.customIndexName} UNIQUE \\(${inv.column}\\)`));
}

console.log('  ✅ Strapi unique:true owns pairKey, conversationSideKey, idempotencyKey');
console.log('  ✅ inboxIndexes no longer creates uniqueness objects');
console.log('  ✅ afterCreate schema DDL is not in database.js');
console.log('\n=== inbox uniqueness ownership: 3 passed ===\n');
