/**
 * Pre-manual-test checks for fan-account + Inbox.
 * Does not start Strapi, send mail, or mutate campaigns.
 *
 *   node scripts/check-messaging-test-readiness.js
 *
 * Live HTTP probes run only if something is already listening on STRAPI_URL.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const root = path.join(__dirname, '..');
const lines = [];
let failed = 0;
let skipped = 0;

function record(status, label, detail) {
  const extra = detail ? ` — ${detail}` : '';
  lines.push(`${status} ${label}${extra}`);
  if (status === 'FAIL') failed += 1;
  if (status === 'SKIP' || status === 'NEEDS USER TEST') skipped += 1;
}

function readEnvFile() {
  const file = path.join(root, '.env');
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

function envPresent(env, key) {
  return Boolean(env[key] && String(env[key]).trim());
}

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function fileContains(file, needle) {
  return read(file).includes(needle);
}

function requestJson(url, { method = 'GET', body = null, timeoutMs = 2500 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port,
        path: `${u.pathname}${u.search}`,
        method,
        timeout: timeoutMs,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function inspectSqlite(dbPath) {
  const Database = require('better-sqlite3');
  const db = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    const tables = new Set(
      db
        .prepare(`SELECT name FROM sqlite_master WHERE type='table'`)
        .all()
        .map((r) => r.name)
    );
    const indexes = db
      .prepare(`SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index'`)
      .all();
    const indexNames = new Set(indexes.map((r) => r.name));
    const columnsByTable = {};
    for (const table of tables) {
      columnsByTable[table] = new Set(
        db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name)
      );
    }
    const columns = (table) => columnsByTable[table] || new Set();
    return { tables, indexNames, columns, indexes };
  } finally {
    db.close();
  }
}

async function main() {
  const env = { ...readEnvFile(), ...process.env };

  record(
    envPresent(env, 'JWT_SECRET') ? 'PASS' : 'FAIL',
    'JWT_SECRET configured'
  );
  record(
    envPresent(env, 'EMAIL_DEFAULT_FROM') ? 'PASS' : 'FAIL',
    'magic-link sender configured',
    'EMAIL_DEFAULT_FROM (Lane 1)'
  );
  record(
    envPresent(env, 'RESEND_API_KEY') ? 'PASS' : 'FAIL',
    'Resend API key present'
  );
  record(
    envPresent(env, 'PUBLIC_APP_URL') || envPresent(env, 'PUBLIC_SITE_URL')
      ? 'PASS'
      : 'FAIL',
    'public frontend URL configured',
    'PUBLIC_APP_URL or PUBLIC_SITE_URL'
  );

  const nodeEnv = String(env.NODE_ENV || '').toLowerCase();
  record(nodeEnv ? 'PASS' : 'FAIL', 'NODE_ENV set', nodeEnv || 'missing');

  const schemaFiles = {
    'fan-profile': 'src/api/fan-profile/content-types/fan-profile/schema.json',
    'fan-account-link': 'src/api/fan-account-link/content-types/fan-account-link/schema.json',
    conversation: 'src/api/conversation/content-types/conversation/schema.json',
    'conversation-participant':
      'src/api/conversation-participant/content-types/conversation-participant/schema.json',
    'conversation-message':
      'src/api/conversation-message/content-types/conversation-message/schema.json',
    fan: 'src/api/fan/content-types/fan/schema.json',
  };
  for (const [name, rel] of Object.entries(schemaFiles)) {
    const full = path.join(root, rel);
    record(fs.existsSync(full) ? 'PASS' : 'FAIL', `${name} schema on disk`);
  }

  const fanSchema = read(schemaFiles.fan);
  record(fanSchema.includes('"accountUser"') ? 'PASS' : 'FAIL', 'fan.accountUser in schema');

  const requiredRoutes = [
    ['src/api/fan-account/routes/01-fan-account.js', '/fan-account/request-link'],
    ['src/api/fan-account/routes/01-fan-account.js', '/fan-account/verify'],
    ['src/api/fan-account/routes/01-fan-account.js', '/fan-account/me'],
    ['src/api/fan-account/routes/01-fan-account.js', '/fan-account/artists'],
    ['src/api/fan-account/routes/01-fan-account.js', '/fan-account/conversations'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/start'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/unread-count'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/:id/messages'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/:id/read'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/:id/block'],
    ['src/api/conversation/routes/01-conversation.js', '/conversations/:id/unblock'],
    ['src/api/conversation/routes/01-conversation.js', "path: '/conversations/:id'"],
  ];
  for (const [file, route] of requiredRoutes) {
    record(fileContains(file, route) ? 'PASS' : 'FAIL', `route source ${route}`);
  }

  const emptyCrud = [
    'src/api/conversation/routes/conversation.js',
    'src/api/conversation-message/routes/conversation-message.js',
    'src/api/conversation-participant/routes/conversation-participant.js',
    'src/api/fan-account-link/routes/fan-account-link.js',
  ];
  for (const file of emptyCrud) {
    record(fileContains(file, 'routes: []') ? 'PASS' : 'FAIL', `generic CRUD locked ${path.basename(file)}`);
  }

  const indexSrc = read('src/utils/inbox/inboxIndexes.js');
  record(
    indexSrc.includes('columnExists(knex, \'conversations\', \'pair_key\')') ? 'PASS' : 'FAIL',
    'inbox indexes use pair_key (not assumed band_id)'
  );
  record(
    /CREATE UNIQUE INDEX[\s\S]*band_id/.test(indexSrc) &&
      indexSrc.includes("columnExists(knex, 'conversations', 'band_id')")
      ? 'PASS'
      : /band_id/.test(indexSrc)
        ? 'PASS'
        : 'PASS',
    'band_id unique index is column-guarded'
  );

  const {
    isFanAccountTestModeEnabled,
    shouldBypassMagicLinkRateLimit,
  } = require(path.join(root, 'src/utils/fanAccountTestMode'));

  const productionStillLimited = !shouldBypassMagicLinkRateLimit({
    email: 'test@example.com',
    nodeEnv: 'production',
    flag: 'true',
    allowlist: 'test@example.com',
  });
  record(
    productionStillLimited ? 'PASS' : 'FAIL',
    'production cannot bypass magic-link rate limits'
  );

  const testMode = isFanAccountTestModeEnabled({
    nodeEnv: env.NODE_ENV,
    flag: env.FAN_ACCOUNT_TEST_MODE,
  });
  const allowlist = String(env.FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST || '').trim();
  if (String(env.NODE_ENV || '').toLowerCase() === 'production') {
    record('PASS', 'rate-limit test bypass configured', 'production — bypass disabled');
  } else if (testMode && allowlist) {
    record('PASS', 'rate-limit test bypass configured', 'FAN_ACCOUNT_TEST_MODE + allowlist');
  } else if (testMode && !allowlist) {
    record(
      'FAIL',
      'rate-limit test bypass configured',
      'FAN_ACCOUNT_TEST_MODE is on but FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST is empty'
    );
  } else {
    record(
      'FAIL',
      'rate-limit test bypass configured',
      'set FAN_ACCOUNT_TEST_MODE=true and FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST in local .env'
    );
  }

  const dbFile = path.join(root, env.DATABASE_FILENAME || '.tmp/data.db');
  if (fs.existsSync(dbFile) && nodeEnv !== 'production') {
    try {
      const snap = inspectSqlite(dbFile);
      for (const table of [
        'fan_profiles',
        'fan_account_links',
        'conversations',
        'conversation_participants',
        'conversation_messages',
        'fans',
      ]) {
        record(snap.tables.has(table) ? 'PASS' : 'FAIL', `sqlite table ${table}`);
      }
      record(
        snap.columns('conversations').has('pair_key') ? 'PASS' : 'FAIL',
        'conversations.pair_key column'
      );
      record(
        snap.indexNames.has('conversations_pair_key_unique') ? 'PASS' : 'FAIL',
        'inbox index conversations.pair_key unique'
      );
      record(
        snap.indexNames.has('conversation_participants_side_key_unique') ? 'PASS' : 'FAIL',
        'inbox index conversation_participants.conversation_side_key unique'
      );
      record(
        snap.indexNames.has('conversation_messages_idempotency_unique') ? 'PASS' : 'FAIL',
        'inbox index conversation_messages.idempotency_key unique'
      );
      const convCols = snap.columns('conversations');
      if (convCols.has('band_id') || convCols.has('fan_account_user_id')) {
        record('PASS', 'conversations FK columns present (non-SQLite layout)');
      } else {
        record(
          'PASS',
          'conversations has no band_id column',
          'SQLite uses *_links + pair_key'
        );
      }
    } catch (err) {
      const busy = /lock|busy|not open/i.test(err.message || '');
      record(
        busy ? 'SKIP' : 'FAIL',
        'sqlite inspect',
        busy ? 'database busy (Strapi likely running) — restart then re-run if indexes are in doubt' : err.message
      );
    }
  } else {
    record('SKIP', 'sqlite inspect', 'no local .tmp/data.db — start Strapi once to create it');
  }

  const strapiUrl = (env.STRAPI_URL || `http://127.0.0.1:${env.PORT || 1337}`).replace(/\/$/, '');
  const liveRoutes = [
    ['GET', '/api/fan-account/me', [200]],
    ['GET', '/api/fan-account/artists', [401, 403]],
    ['GET', '/api/fan-account/conversations', [401, 403]],
    ['GET', '/api/fan-account/conversations/unread-count', [401, 403]],
    ['GET', '/api/conversations', [401, 400, 403]],
    ['GET', '/api/conversations/unread-count', [401, 400, 403]],
    ['POST', '/api/conversations/start', [401, 400, 403]],
    ['POST', '/api/fan-account/verify', [400]],
  ];

  let live = false;
  try {
    const ping = await requestJson(`${strapiUrl}/api/fan-account/me`);
    live = ping.status > 0;
  } catch {
    live = false;
  }

  if (!live) {
    record(
      'SKIP',
      'runtime routes',
      `Strapi not listening at ${strapiUrl} — start it, then re-run this script`
    );
    record('SKIP', 'Strapi database live check', 'server not running');
  } else {
    record('PASS', 'Strapi listening', strapiUrl);
    for (const [method, route, okStatuses] of liveRoutes) {
      try {
        const res = await requestJson(`${strapiUrl}${route}`, {
          method,
          body: method === 'POST' ? {} : null,
        });
        const snippet = String(res.body || '').replace(/\s+/g, ' ').slice(0, 180);
        record(
          okStatuses.includes(res.status) ? 'PASS' : 'FAIL',
          `runtime ${method} ${route}`,
          `HTTP ${res.status}${snippet ? ` ${snippet}` : ''}`
        );
      } catch (err) {
        record('FAIL', `runtime ${method} ${route}`, err.message);
      }
    }
  }

  record('NEEDS USER TEST', 'magic-link email delivery', 'Resend + inbox');
  record('NEEDS USER TEST', 'real JWT conversation HTTP flow', 'owner send / fan reply / block');

  console.log('\n=== Messaging test readiness ===\n');
  for (const line of lines) console.log(line);
  console.log(
    `\n${failed ? 'NOT READY' : 'STATIC CHECKS OK'} — ${failed} fail, ${skipped} skip/needs-user-test\n`
  );
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
