'use strict';

/**
 * Postgres-level uniqueness for FeatureEnrollment.
 * Strapi unique:true is per-field and cannot express this composite key.
 */

const INDEX_NAME = 'feature_enrollments_feature_subject_unique';
const TABLE = 'feature_enrollments';

const UNIQUE_SQL = `CREATE UNIQUE INDEX IF NOT EXISTS ${INDEX_NAME} ON ${TABLE} (feature_key, subject_type, subject_id)`;

function isPostgres(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  return name.includes('pg') || name.includes('postgres');
}

async function tableExists(knex, table) {
  try {
    return await knex.schema.hasTable(table);
  } catch {
    return false;
  }
}

async function columnExists(knex, table, column) {
  try {
    return await knex.schema.hasColumn(table, column);
  } catch {
    return false;
  }
}

async function ensureFeatureEnrollmentIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };
  if (!(await tableExists(knex, TABLE))) return { skipped: true, reason: 'no_table' };

  const hasKey = await columnExists(knex, TABLE, 'feature_key');
  const hasType = await columnExists(knex, TABLE, 'subject_type');
  const hasId = await columnExists(knex, TABLE, 'subject_id');
  if (!hasKey || !hasType || !hasId) {
    return { skipped: true, reason: 'missing_columns' };
  }

  try {
    await knex.raw(UNIQUE_SQL);
    strapi.log?.info?.(`[Labs] index ok: ${INDEX_NAME}`);
    return { ok: true, dialect: isPostgres(knex) ? 'postgres' : 'other' };
  } catch (err) {
    strapi.log?.warn?.(`[Labs] index skipped: ${INDEX_NAME} (${err.message})`);
    return { ok: false, error: err.message };
  }
}

module.exports = {
  INDEX_NAME,
  TABLE,
  UNIQUE_SQL,
  isPostgres,
  ensureFeatureEnrollmentIndexes,
};
