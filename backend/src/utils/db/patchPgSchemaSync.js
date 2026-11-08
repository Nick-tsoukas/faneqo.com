'use strict';

/**
 * Strapi 4.24 schema sync on Postgres:
 * - dropUnique() emits DROP CONSTRAINT with no IF EXISTS
 * - unique indexes created by boot helpers are "extras"
 * - forceMigration:false skips those DROPs (required to keep 05A uniqueness)
 * - but updated-index RECREATE still emits ADD CONSTRAINT, which fails if the
 *   existing unique object was not dropped (albums_unique already exists)
 *
 * This patch makes ADD CONSTRAINT unique skip-if-exists. It does not drop
 * indexes, disable uniqueness, or swallow schema-sync exceptions.
 */

function unwrapName(wrapped) {
  return String(wrapped || '').replace(/^"+|"+$/g, '');
}

function patchPgSchemaSync() {
  if (global.__FANEQO_PATCHED_PG_SCHEMA_SYNC) return { patched: true, skipped: true };
  let TableCompiler;
  try {
    TableCompiler = require('knex/lib/dialects/postgres/schema/pg-tablecompiler');
  } catch (err) {
    console.warn(`[Faneqo] pg schema-sync patch skipped: ${err.message}`);
    return { patched: false, error: err.message };
  }
  if (!TableCompiler?.prototype?.unique) {
    console.warn('[Faneqo] pg schema-sync patch skipped: unique() missing');
    return { patched: false, error: 'no_unique' };
  }

  const originalUnique = TableCompiler.prototype.unique;
  TableCompiler.prototype.unique = function uniqueSkipIfExists(columns, indexName) {
    let deferrable;
    let useConstraint = true;
    let predicate;
    let nameArg = indexName;
    if (indexName && typeof indexName === 'object') {
      ({ indexName: nameArg, deferrable, useConstraint, predicate } = indexName);
      if (useConstraint === undefined) {
        useConstraint = !!deferrable || !predicate;
      }
    }
    if (!useConstraint || predicate) {
      return originalUnique.call(this, columns, indexName);
    }

    const constraintName = nameArg
      ? this.formatter.wrap(nameArg)
      : this._indexCommand('unique', this.tableNameRaw, columns);
    const rawName = unwrapName(constraintName).replace(/'/g, "''");
    const tableSql = this.tableName();
    const cols = this.formatter.columnize(columns);
    const deferSql = deferrable ? ` deferrable initially ${deferrable}` : '';

    this.pushQuery(`
DO $faneqo$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${rawName}') THEN
    RETURN;
  END IF;
  IF to_regclass('public.${rawName}') IS NOT NULL THEN
    RETURN;
  END IF;
  EXECUTE 'alter table ${tableSql} add constraint ${constraintName} unique (${cols})${deferSql}';
END
$faneqo$;
`);
  };

  global.__FANEQO_PATCHED_PG_SCHEMA_SYNC = true;
  return { patched: true };
}

module.exports = { patchPgSchemaSync };
