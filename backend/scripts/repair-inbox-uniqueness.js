'use strict';

/**
 * Inbox uniqueness catalog audit + optional one-time repair.
 *
 * Default: DRY-RUN (read-only).
 * Mutate only with: node scripts/repair-inbox-uniqueness.js --repair
 *
 * Requires DATABASE_URL. Never prints the URL or row contents.
 */

const knexFactory = require('knex');
const { INVARIANTS, PERFORMANCE_INDEXES, convertIndexToConstraintSql } = require('../src/utils/inbox/inboxUniqueness');

function parseArgs(argv) {
  return {
    repair: argv.includes('--repair'),
  };
}

function pgRows(result) {
  if (Array.isArray(result?.rows)) return result.rows;
  if (Array.isArray(result) && result[0] && typeof result[0] === 'object') return result;
  return [];
}

async function catalogObject(knex, name) {
  const constraint = pgRows(await knex.raw(
    `SELECT conname, contype
     FROM pg_constraint
     WHERE conname = ?`,
    [name]
  ));
  const index = pgRows(await knex.raw(
    `SELECT
        c.relname AS index_name,
        i.indisunique,
        pg_get_indexdef(c.oid) AS indexdef,
        i.indisprimary
     FROM pg_class c
     JOIN pg_namespace n ON n.oid = c.relnamespace
     JOIN pg_index i ON i.indexrelid = c.oid
     WHERE c.relkind = 'i'
       AND n.nspname = 'public'
       AND c.relname = ?`,
    [name]
  ));
  return {
    constraint: constraint[0] || null,
    index: index[0] || null,
  };
}

async function columnIndexes(knex, table, column) {
  return pgRows(await knex.raw(
    `SELECT
        i.relname AS index_name,
        ix.indisunique,
        pg_get_indexdef(i.oid) AS indexdef
     FROM pg_class t
     JOIN pg_namespace s ON t.relnamespace = s.oid
     JOIN pg_index ix ON t.oid = ix.indrelid
     JOIN pg_class i ON i.oid = ix.indexrelid
     JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
     WHERE s.nspname = 'public'
       AND t.relname = ?
       AND a.attname = ?`,
    [table, column]
  ));
}

async function duplicateGroups(knex, table, column) {
  const allowed = INVARIANTS.some((row) => row.table === table && row.column === column);
  if (!allowed) throw new Error('refusing unknown table/column');
  const rows = pgRows(await knex.raw(
    `SELECT COUNT(*)::int AS groups, COALESCE(SUM(cnt), 0)::int AS rows
     FROM (
       SELECT COUNT(*)::int AS cnt
       FROM ${table}
       WHERE ${column} IS NOT NULL
       GROUP BY ${column}
       HAVING COUNT(*) > 1
     ) d`
  ));
  return { groups: Number(rows[0]?.groups || 0), rows: Number(rows[0]?.rows || 0) };
}

async function tableCount(knex, table) {
  const allowed = ['conversations', 'conversation_participants', 'conversation_messages'].includes(table);
  if (!allowed) throw new Error('refusing unknown table');
  const rows = pgRows(await knex.raw(`SELECT COUNT(*)::int AS n FROM ${table}`));
  return rows[0]?.n ?? null;
}

function normalizeDef(def) {
  return String(def || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function defsCompatible(actual, expected) {
  const a = normalizeDef(actual);
  const e = normalizeDef(expected);
  if (!a) return false;
  if (a === e) return true;
  return a.includes(e.replace('public.', '')) || e.includes(a.replace('public.', ''));
}

async function main() {
  const { repair } = parseArgs(process.argv.slice(2));
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }

  const knex = knexFactory({
    client: 'pg',
    connection: {
      connectionString: url,
      ssl: process.env.DATABASE_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
    },
  });

  let failed = false;
  try {
    console.log(repair ? 'MODE=repair' : 'MODE=dry-run');
    console.log('\n=== table counts ===');
    for (const table of ['conversations', 'conversation_participants', 'conversation_messages']) {
      const exists = await knex.schema.hasTable(table);
      const n = exists ? await tableCount(knex, table) : 'missing';
      console.log(`${table}=${n}`);
    }

    console.log('\n=== invariants ===');
    const plans = [];
    for (const inv of INVARIANTS) {
      const named = await catalogObject(knex, inv.customIndexName);
      const strapiNamed = inv.strapiUniqueName === inv.customIndexName
        ? named
        : await catalogObject(knex, inv.strapiUniqueName);
      const byColumn = await columnIndexes(knex, inv.table, inv.column);
      const dups = await duplicateGroups(knex, inv.table, inv.column);
      const uniqueIndex = named.index && named.index.indisunique;
      const unexpectedDef = uniqueIndex && !defsCompatible(named.index.indexdef, inv.expectedIndexDef);

      console.log(`\n[${inv.id}]`);
      console.log(`  table=${inv.table} column=${inv.column}`);
      console.log(`  customName=${inv.customIndexName} constraint=${named.constraint ? named.constraint.contype : 'none'} index=${named.index ? `unique=${named.index.indisunique}` : 'none'}`);
      if (named.index) console.log(`  indexdef=${named.index.indexdef}`);
      console.log(`  strapiName=${inv.strapiUniqueName} constraint=${strapiNamed.constraint ? 'yes' : 'no'} index=${strapiNamed.index ? 'yes' : 'no'}`);
      console.log(`  columnObjects=${byColumn.length} ${byColumn.map((r) => r.index_name).join(',')}`);
      console.log(`  duplicateGroups=${dups.groups} duplicateRows=${dups.rows}`);

      if (dups.groups > 0) {
        console.log('  REFUSE: duplicates exist');
        failed = true;
        continue;
      }
      if (named.index && !named.index.indisunique) {
        console.log('  REFUSE: same-named object is not UNIQUE');
        failed = true;
        continue;
      }
      if (unexpectedDef) {
        console.log('  REFUSE: index definition does not match expected unique column');
        failed = true;
        continue;
      }

      if (named.constraint) {
        console.log('  planned=none (constraint already exists)');
      } else if (uniqueIndex) {
        console.log('  planned=convert INDEX → CONSTRAINT (same name)');
        plans.push(inv);
      } else {
        console.log('  planned=none (no custom unique index; Strapi can create its constraint)');
      }
    }

    console.log('\n=== performance indexes ===');
    for (const idx of PERFORMANCE_INDEXES) {
      const named = await catalogObject(knex, idx.name);
      console.log(`${idx.name} index=${named.index ? 'yes' : 'no'} unique=${named.index?.indisunique || false}`);
    }

    if (failed) {
      console.error('\nREFUSE: catalog or duplicates are not safe');
      process.exitCode = 2;
      return;
    }

    if (!repair) {
      console.log('\nDry-run complete. Re-run with --repair to mutate.');
      return;
    }

    for (const inv of plans) {
      await knex.raw(convertIndexToConstraintSql({
        table: inv.table,
        column: inv.column,
        indexName: inv.customIndexName,
      }));
      console.log(`converted ${inv.customIndexName}`);
    }
    console.log('\nRepair complete.');
  } finally {
    await knex.destroy();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
