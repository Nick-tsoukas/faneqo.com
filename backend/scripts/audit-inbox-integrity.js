/**
 * Read-only Inbox data + index audit.
 *
 *   node scripts/audit-inbox-integrity.js
 *
 * Optional (safe IF NOT EXISTS indexes only — never deletes history):
 *   FANEQO_INBOX_REPAIR=true node scripts/audit-inbox-integrity.js
 *
 * Never prints emails, JWTs, message bodies, or connection strings.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPAIR = String(process.env.FANEQO_INBOX_REPAIR || '').toLowerCase() === 'true';

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`);
  console.log(`[Faneqo Inbox Integrity] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function readEnvFile() {
  const file = path.join(__dirname, '..', '.env');
  const map = {};
  if (!fs.existsSync(file)) return map;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    map[key] = value;
  }
  return map;
}

function connectionFromEnv(env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.DATABASE_CLIENT === 'postgres' || env.DATABASE_HOST) {
    return {
      host: env.DATABASE_HOST,
      port: Number(env.DATABASE_PORT || 5432),
      user: env.DATABASE_USERNAME || env.DATABASE_USER || 'postgres',
      password: env.DATABASE_PASSWORD || '',
      database: env.DATABASE_NAME || 'strapi',
      ssl: String(env.DATABASE_SSL || '').toLowerCase() === 'true' ? { rejectUnauthorized: false } : false,
    };
  }
  return null;
}

async function count(knex, sql) {
  const rows = await knex.raw(sql);
  const list = rows.rows || rows;
  const row = Array.isArray(list) ? list[0] : list;
  return Number(row?.c || row?.count || 0);
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };
  log('start', {
    repair: REPAIR,
    client: env.DATABASE_CLIENT || 'unknown',
  });

  if (REPAIR) {
    console.log('');
    console.log('[Faneqo Inbox Integrity] REPAIR MODE — indexes only, no history deletes');
    console.log('');
  }

  const connection = connectionFromEnv(env);
  if (!connection) {
    log('skip', { reason: 'no_database_connection_config' });
    process.exitCode = 1;
    return;
  }

  let knex;
  try {
    knex = require('knex')({
      client: 'pg',
      connection,
      pool: { min: 0, max: 1 },
    });
    await knex.raw('select 1 as ok');
  } catch (err) {
    log('skip', { reason: 'db_unreachable', detail: err.code || 'connect_failed' });
    process.exitCode = 1;
    return;
  }

  try {
    const tables = await knex('pg_tables')
      .select('tablename')
      .where({ schemaname: 'public' });
    const names = new Set(tables.map((t) => t.tablename));
    log('tables', {
      conversations: names.has('conversations'),
      conversation_participants: names.has('conversation_participants'),
      conversation_messages: names.has('conversation_messages'),
      fans: names.has('fans'),
    });

    const indexRows = await knex('pg_indexes')
      .select('tablename', 'indexname', 'indexdef')
      .whereIn('tablename', ['conversations', 'conversation_participants', 'conversation_messages']);
    for (const row of indexRows) {
      const unique = /\bUNIQUE\b/i.test(row.indexdef);
      const partial = /\bWHERE\b/i.test(row.indexdef);
      log('index', {
        table: row.tablename,
        name: row.indexname,
        unique,
        partial,
      });
    }

    if (names.has('conversations')) {
      log('count', { conversations: await count(knex, 'SELECT COUNT(*)::int AS c FROM conversations') });
      if (await knex.schema.hasColumn('conversations', 'pair_key')) {
        const dupes = await knex.raw(`
          SELECT COUNT(*)::int AS c FROM (
            SELECT pair_key FROM conversations WHERE pair_key IS NOT NULL GROUP BY pair_key HAVING COUNT(*) > 1
          ) d
        `);
        log('integrity', {
          duplicatePairKeys: Number((dupes.rows || dupes)[0]?.c || 0),
        });
      }
    }

    if (names.has('conversation_participants')) {
      log('count', {
        participants: await count(knex, 'SELECT COUNT(*)::int AS c FROM conversation_participants'),
      });
      if (await knex.schema.hasColumn('conversation_participants', 'side')) {
        log('integrity', {
          invalidSides: await count(
            knex,
            `SELECT COUNT(*)::int AS c FROM conversation_participants WHERE side IS NULL OR side NOT IN ('band','fan')`
          ),
        });
      }
    }

    if (names.has('conversation_messages')) {
      log('count', {
        messages: await count(knex, 'SELECT COUNT(*)::int AS c FROM conversation_messages'),
      });
    }

    if (names.has('fans')) {
      try {
        const totalFans = await count(knex, 'SELECT COUNT(*)::int AS c FROM fans');
        let withAccount = null;
        if (names.has('fans_account_user_links')) {
          const cols = await knex('fans_account_user_links').columnInfo();
          const fanCol = cols.fan_id ? 'fan_id' : Object.keys(cols).find((k) => k.endsWith('_id') && k !== 'user_id');
          if (fanCol) {
            withAccount = await count(
              knex,
              `SELECT COUNT(DISTINCT ${fanCol})::int AS c FROM fans_account_user_links`
            );
          }
        }
        log('fans', {
          total: totalFans,
          withAccountUser: withAccount == null ? 'unknown' : withAccount,
          withoutAccountUser: withAccount == null ? 'unknown' : Math.max(0, totalFans - withAccount),
        });
      } catch (err) {
        log('fans', { skipped: true, reason: err.code || 'query_failed' });
      }
    }

    if (REPAIR) {
      const { ensureInboxIndexes } = require('../src/utils/inbox/inboxIndexes');
      const fakeStrapi = {
        log: { info: (m) => log('index-ensure', { msg: m }), warn: (m) => log('index-ensure', { msg: m }) },
        db: { connection: knex },
      };
      await ensureInboxIndexes(fakeStrapi);
      log('repair', { action: 'ensureInboxIndexes', destructive: false });
    }
  } finally {
    await knex.destroy();
  }

  log('done', { mode: REPAIR ? 'repair-indexes' : 'read-only' });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
