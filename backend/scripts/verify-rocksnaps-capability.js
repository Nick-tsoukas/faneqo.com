'use strict';

/**
 * Capability checks for the gallery create page.
 * Does not publish, upload, or print secrets.
 *
 * Run: node scripts/verify-rocksnaps-capability.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:1337';
const LOGIN_FILE = path.join(__dirname, '..', '.tmp', 'rocksnaps-local-login.txt');

function readLogin() {
  const out = {};
  for (const line of fs.readFileSync(LOGIN_FILE, 'utf8').split(/\r?\n/)) {
    const idx = line.indexOf('=');
    if (idx > 0) out[line.slice(0, idx)] = line.slice(idx + 1);
  }
  return out;
}

async function request(urlPath, { method = 'GET', token, query } = {}) {
  const url = new URL(BASE + urlPath);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value != null) url.searchParams.set(key, String(value));
    });
  }
  const response = await fetch(url, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  return { status: response.status, json };
}

async function login(identifier, password) {
  const response = await fetch(`${BASE}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const json = await response.json();
  assert.strictEqual(response.status, 200, json?.error?.message || `login status ${response.status}`);
  assert.ok(json.jwt);
  return json.jwt;
}

async function main() {
  const loginFile = readLogin();
  const owner = await login(loginFile.rocksnaps_email, loginFile.rocksnaps_password);
  const other = await login(loginFile.other_email, loginFile.other_password);

  const ours = await request('/api/artist-updates/rocksnaps-capability', {
    token: owner,
    query: { bandId: loginFile.rocksnaps_band_id },
  });
  assert.strictEqual(ours.status, 200, JSON.stringify(ours.json));
  assert.deepStrictEqual(ours.json.data, { eligible: true });
  assert.strictEqual(JSON.stringify(ours.json).includes(loginFile.rocksnaps_email), false);
  console.log('  ok  RockSnaps band can see the create-page capability');

  const theirs = await request('/api/artist-updates/rocksnaps-capability', {
    token: other,
    query: { bandId: loginFile.other_band_id },
  });
  assert.strictEqual(theirs.status, 200);
  assert.deepStrictEqual(theirs.json.data, { eligible: false });
  console.log('  ok  another artist is not eligible');

  const cross = await request('/api/artist-updates/rocksnaps-capability', {
    token: other,
    query: { bandId: loginFile.rocksnaps_band_id },
  });
  assert.strictEqual(cross.status, 403);
  console.log('  ok  another artist cannot read the RockSnaps band capability');

  const anon = await request('/api/artist-updates/rocksnaps-capability', {
    query: { bandId: loginFile.rocksnaps_band_id },
  });
  assert.strictEqual(anon.status, 401);
  console.log('  ok  anonymous capability requests are refused');

  const missing = await request('/api/artist-updates/rocksnaps-capability', { token: owner });
  assert.strictEqual(missing.status, 400);
  console.log('  ok  capability requires a band');

  console.log('local RockSnaps capability checks passed');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
