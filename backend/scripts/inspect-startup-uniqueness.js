/**
 * Read-only production catalog inspect for the schema-sync boot crash.
 *
 *   node scripts/inspect-startup-uniqueness.js
 *
 * Never creates/drops/alters. Never backfills. Prints pg_indexes + pg_constraint
 * for 05A identity uniques, feature enrollment uniqueness, moments/milestones
 * idempotency, and artist_updates.publish_idempotency_key.
 */

'use strict';

const { Client } = require('pg');

const NAMES = [
  'fans_canonical_identity_key_unique',
  'fan_show_attendances_campaign_identity_key_unique',
  'fan_show_attendances_event_identity_key_unique',
  'feature_enrollments_feature_subject_unique',
  'moments_idempotency_key_unique',
  'milestones_idempotency_key_unique',
  'artist_updates_publish_idempotency_key_unique',
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is missing. Run on Railway qrserver (or railway run --service qrserver).');
    process.exit(1);
  }

  let connectionString = url;
  if (process.env.FANEQO_PG_HOST) {
    const parsed = new URL(url);
    parsed.hostname = process.env.FANEQO_PG_HOST;
    if (process.env.FANEQO_PG_PORT) parsed.port = process.env.FANEQO_PG_PORT;
    connectionString = parsed.toString();
  }

  const client = new Client({
    connectionString,
    ssl: process.env.FANEQO_PG_HOST
      ? false
      : process.env.DATABASE_SSL === 'false'
        ? false
        : { rejectUnauthorized: false },
  });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('moments', 'milestones', 'feature_enrollments', 'artist_updates', 'fans', 'fan_show_attendances')
    ORDER BY table_name
  `);

  const columns = await client.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'artist_updates' AND column_name = 'publish_idempotency_key')
        OR (table_name IN ('moments', 'milestones') AND column_name = 'idempotency_key')
        OR (table_name = 'fans' AND column_name = 'canonical_identity_key')
        OR (table_name = 'fan_show_attendances' AND column_name IN ('campaign_identity_key', 'event_identity_key'))
        OR (table_name = 'feature_enrollments' AND column_name IN ('feature_key', 'subject_type', 'subject_id'))
      )
    ORDER BY table_name, column_name
  `);

  const indexes = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = ANY($1::text[])
    ORDER BY indexname
  `, [NAMES]);

  const constraints = await client.query(`
    SELECT
      n.nspname AS schema,
      c.conname,
      t.relname AS table_name,
      c.contype,
      pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND c.conname = ANY($1::text[])
    ORDER BY c.conname
  `, [NAMES]);

  const migrations = await client.query(`
    SELECT name, time
    FROM strapi_migrations
    WHERE name ILIKE '%canonical-identity%'
       OR name ILIKE '%feature-enrollment%'
       OR name ILIKE '%inbox-unique%'
    ORDER BY time
  `).catch(async () => {
    const alt = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name ILIKE '%migration%'
      ORDER BY table_name
    `);
    return { rows: [{ note: 'strapi_migrations missing', tables: alt.rows }] };
  });

  console.log(JSON.stringify({
    tables: tables.rows,
    columns: columns.rows,
    pg_indexes: indexes.rows,
    pg_constraint: constraints.rows,
    migrations: migrations.rows,
  }, null, 2));

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
