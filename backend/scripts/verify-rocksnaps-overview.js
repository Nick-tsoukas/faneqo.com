'use strict';

/**
 * Authenticated gallery-list RockSnaps status.
 * Hides and restores one local gallery, then leaves it published.
 * Does not upload, delete media, or print secrets.
 *
 * Run: node scripts/verify-rocksnaps-overview.js
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

async function request(urlPath, { method = 'GET', token, query, body } = {}) {
  const url = new URL(BASE + urlPath);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value != null) url.searchParams.set(key, String(value));
    });
  }
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
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

function card(list, id) {
  return (list.json?.data || []).find((row) => String(row.id) === String(id));
}

async function main() {
  const loginFile = readLogin();
  const owner = await login(loginFile.rocksnaps_email, loginFile.rocksnaps_password);
  const other = await login(loginFile.other_email, loginFile.other_password);
  const roomId = loginFile.room_gallery_id;
  const roomSlug = loginFile.room_slug;

  async function manage(token, bandId) {
    return request('/api/artist-updates/manage', { token, query: { bandId } });
  }

  async function publicSlugs() {
    const listed = await request('/api/public/rocksnaps/galleries');
    assert.strictEqual(listed.status, 200);
    return new Set((listed.json?.data || []).map((row) => row.slug));
  }

  const ownerList = await manage(owner, loginFile.rocksnaps_band_id);
  assert.strictEqual(ownerList.status, 200);
  assert.ok(ownerList.json.data.length > 0);
  const slugs = await publicSlugs();
  for (const row of ownerList.json.data) {
    assert.strictEqual(typeof row.rocksnaps?.onRockSnaps, 'boolean');
    assert.strictEqual(Object.prototype.hasOwnProperty.call(row, 'showOnRockSnaps'), false);
    assert.strictEqual(row.rocksnaps.onRockSnaps, slugs.has(row.slug));
    assert.ok(Object.prototype.hasOwnProperty.call(row, 'featuredOnProfile'));
  }
  const room = card(ownerList, roomId);
  assert.ok(room, 'local room gallery is on the management list');
  assert.strictEqual(room.rocksnaps.onRockSnaps, true);
  console.log('  ok  overview status matches the public RockSnaps list');

  const otherList = await manage(other, loginFile.other_band_id);
  assert.strictEqual(otherList.status, 200);
  assert.ok(otherList.json.data.length > 0);
  for (const row of otherList.json.data) {
    assert.strictEqual(Object.prototype.hasOwnProperty.call(row, 'rocksnaps'), false);
    assert.strictEqual(Object.prototype.hasOwnProperty.call(row, 'showOnRockSnaps'), false);
    assert.ok(Object.prototype.hasOwnProperty.call(row, 'featuredOnProfile'));
  }
  console.log('  ok  another artist receives no RockSnaps status');

  const crossList = await manage(other, loginFile.rocksnaps_band_id);
  assert.strictEqual(crossList.status, 403);
  const anonList = await manage(null, loginFile.rocksnaps_band_id);
  assert.strictEqual(anonList.status, 401);
  console.log('  ok  the management list stays authorized');

  const foreign = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    token: other,
    body: { showOnRockSnaps: false },
  });
  assert.strictEqual(foreign.status, 403);
  assert.strictEqual(card(await manage(owner, loginFile.rocksnaps_band_id), roomId).rocksnaps.onRockSnaps, true);
  const ownForeign = await request(`/api/artist-updates/${loginFile.other_gallery_id}/rocksnaps`, {
    method: 'PATCH',
    token: other,
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(ownForeign.status, 404);
  console.log('  ok  another artist cannot change RockSnaps publication');

  try {
    const disabled = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
      method: 'PATCH',
      token: owner,
      body: { showOnRockSnaps: false },
    });
    assert.strictEqual(disabled.status, 200);
    const afterOff = await manage(owner, loginFile.rocksnaps_band_id);
    assert.strictEqual(card(afterOff, roomId).rocksnaps.onRockSnaps, false);
    assert.strictEqual((await publicSlugs()).has(roomSlug), false);
    console.log('  ok  disabling removes the gallery from the overview and the public list');

    const enabled = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
      method: 'PATCH',
      token: owner,
      body: { showOnRockSnaps: true },
    });
    assert.strictEqual(enabled.status, 200);
    const afterOn = await manage(owner, loginFile.rocksnaps_band_id);
    assert.strictEqual(card(afterOn, roomId).rocksnaps.onRockSnaps, true);
    assert.strictEqual((await publicSlugs()).has(roomSlug), true);
    console.log('  ok  enabling restores the overview and the public list');

    const hidden = await request(`/api/artist-updates/${roomId}/hide`, { method: 'PATCH', token: owner });
    assert.strictEqual(hidden.status, 200);
    const afterHide = await manage(owner, loginFile.rocksnaps_band_id);
    assert.strictEqual(card(afterHide, roomId).status, 'hidden');
    assert.strictEqual(card(afterHide, roomId).rocksnaps.onRockSnaps, false);
    assert.strictEqual((await publicSlugs()).has(roomSlug), false);
    console.log('  ok  a hidden gallery is not shown as active on RockSnaps');
  } finally {
    const restored = await request(`/api/artist-updates/${roomId}/restore`, { method: 'PATCH', token: owner });
    assert.strictEqual(restored.status, 200);
    const enabled = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
      method: 'PATCH',
      token: owner,
      body: { showOnRockSnaps: true },
    });
    assert.strictEqual(enabled.status, 200);
  }

  const finished = await manage(owner, loginFile.rocksnaps_band_id);
  assert.strictEqual(card(finished, roomId).status, 'published');
  assert.strictEqual(card(finished, roomId).rocksnaps.onRockSnaps, true);
  assert.strictEqual((await publicSlugs()).has(roomSlug), true);
  console.log('  ok  the local gallery is published and on RockSnaps again');
  console.log('local RockSnaps overview checks passed');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
