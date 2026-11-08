'use strict';

/**
 * One-shot: ensure test emails are Faneqo members on a band fan list.
 *
 * DMs require fan.accountUser. A login (users-permissions) is not enough.
 * This script links existing users to matching fan rows by email.
 *
 * Usage:
 *   STRAPI_URL=https://qrserver-production.up.railway.app \
 *   STRAPI_API_TOKEN=... \
 *   node scripts/link-dm-test-accounts.js
 *
 * Never logs passwords, JWT, or full magic tokens.
 */

const STRAPI_URL = (process.env.STRAPI_URL || 'https://qrserver-production.up.railway.app').replace(/\/$/, '');
const TOKEN = process.env.STRAPI_API_TOKEN || process.env.STRAPI_TOKEN;
const BAND_ID = Number(process.env.BAND_ID || 5);
// Artist for band 5 is nick.tsoukas101@gmail.com — do not treat that login as a DM target.
const EMAILS = (process.env.DM_TEST_EMAILS || 'xacidx101@gmail.com,nt@musicbizqr.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

if (!TOKEN) {
  console.error('Missing STRAPI_API_TOKEN');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`,
};

function mask(email) {
  const [local, domain] = String(email).split('@');
  if (!local || !domain) return '(invalid)';
  return `${local.slice(0, 1)}***@${domain}`;
}

async function api(path, options = {}) {
  const res = await fetch(`${STRAPI_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

function unwrapList(json) {
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

function entityId(row) {
  return row?.id ?? row?.data?.id ?? null;
}

function attrs(row) {
  return row?.attributes ? { id: row.id, ...row.attributes } : row || {};
}

async function findUser(email) {
  const q = encodeURIComponent(email);
  const attempts = [
    `/api/users?filters[email][$eq]=${q}`,
    `/api/users?filters[email][$eqi]=${q}`,
  ];
  for (const path of attempts) {
    const { ok, status, json } = await api(path);
    if (!ok) {
      console.log(`  user lookup ${status} ${path}`);
      continue;
    }
    const rows = unwrapList(json);
    if (rows.length) return rows[0];
  }
  return null;
}

async function findFans(email) {
  const q = encodeURIComponent(email);
  const paths = [
    `/api/fans?filters[email][$eq]=${q}&filters[band][id][$eq]=${BAND_ID}&populate[accountUser][fields][0]=id`,
    `/api/fans?filters[email][$eqi]=${q}&filters[band][id][$eq]=${BAND_ID}&populate=accountUser`,
  ];
  for (const path of paths) {
    const { ok, status, json } = await api(path);
    if (!ok) {
      console.log(`  fan lookup ${status}`);
      continue;
    }
    return unwrapList(json).map(attrs);
  }
  return [];
}

async function linkFan(fanId, userId) {
  const { ok, status, json } = await api(`/api/fans/${fanId}`, {
    method: 'PUT',
    body: JSON.stringify({ data: { accountUser: userId } }),
  });
  return { ok, status, json };
}

(async () => {
  console.log(`[link-dm-test] strapi=${STRAPI_URL} bandId=${BAND_ID}`);

  for (const email of EMAILS) {
    console.log(`\n--- ${mask(email)} ---`);
    const user = await findUser(email);
    if (!user) {
      console.log('  user: MISSING (login account not found via API)');
    } else {
      console.log(`  user: id=${user.id} confirmed=${user.confirmed} blocked=${user.blocked}`);
    }

    const fans = await findFans(email);
    if (!fans.length) {
      console.log('  fan row: MISSING on this band');
      continue;
    }

    for (const fan of fans) {
      const current =
        fan.accountUser?.id ||
        fan.accountUser?.data?.id ||
        fan.accountUser ||
        null;
      console.log(`  fan row: id=${fan.id} status=${fan.status || 'n/a'} accountUser=${current || 'null'}`);
      if (!user) continue;
      if (current && Number(current) === Number(user.id)) {
        console.log('  already linked');
        continue;
      }
      const result = await linkFan(fan.id, user.id);
      if (result.ok) console.log(`  linked fan ${fan.id} -> user ${user.id}`);
      else {
        console.log(`  LINK FAILED status=${result.status}`);
        const err = result.json?.error?.message || result.json?.error?.name || '';
        if (err) console.log(`  ${err}`);
      }
    }
  }

  console.log('\n[link-dm-test] done');
})().catch((err) => {
  console.error('[link-dm-test] failed', err.message);
  process.exit(1);
});
