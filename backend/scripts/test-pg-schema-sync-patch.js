'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { patchPgSchemaSync } = require('../src/utils/db/patchPgSchemaSync');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const dbSrc = read('config/database.js');
assert.match(dbSrc, /patchPgSchemaSync/);
assert.match(dbSrc, /forceMigration:\s*false/);

const patchSrc = read('src/utils/db/patchPgSchemaSync.js');
assert.match(patchSrc, /add constraint/);
assert.match(patchSrc, /pg_constraint/);
assert.match(patchSrc, /to_regclass/);
assert.doesNotMatch(patchSrc, /updateSchema\s*=/);
assert.doesNotMatch(patchSrc, /catch \(err\).*strapi start/s);

const result = patchPgSchemaSync();
assert.strictEqual(result.patched, true);

const TableCompiler = require('knex/lib/dialects/postgres/schema/pg-tablecompiler');
assert.strictEqual(typeof TableCompiler.prototype.unique, 'function');

console.log('test-pg-schema-sync-patch: ok');
