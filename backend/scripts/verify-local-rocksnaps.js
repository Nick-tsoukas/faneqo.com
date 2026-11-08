'use strict';

/**
 * HTTP checks against a local Strapi already running on 127.0.0.1:1337.
 * Reads .tmp/rocksnaps-local-login.txt. Does not print passwords or tokens.
 *
 * Run: node scripts/verify-local-rocksnaps.js
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

async function request(urlPath, { method = 'GET', token, body, query } = {}) {
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
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text.slice(0, 180) }; }
  return { status: response.status, json, cache: response.headers.get('cache-control') };
}

async function login(identifier, password) {
  const result = await request('/api/auth/local', {
    method: 'POST',
    body: { identifier, password },
  });
  assert.strictEqual(result.status, 200, `login failed (${result.status})`);
  assert.ok(result.json?.jwt, 'login did not return a jwt');
  return result.json.jwt;
}

function keysOf(value, out = new Set()) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    value.forEach((item) => keysOf(item, out));
    return out;
  }
  Object.keys(value).forEach((key) => {
    out.add(key);
    keysOf(value[key], out);
  });
  return out;
}

async function main() {
  const loginFile = readLogin();
  const roomId = loginFile.room_gallery_id;
  const stageId = loginFile.stage_gallery_id;
  const otherId = loginFile.other_gallery_id;
  const roomSlug = loginFile.room_slug;
  const stageSlug = loginFile.stage_slug;
  assert.ok(roomId && stageId && otherId && roomSlug && stageSlug, 'login file is missing gallery ids');

  const owner = await login(loginFile.rocksnaps_email, loginFile.rocksnaps_password);
  const other = await login(loginFile.other_email, loginFile.other_password);
  console.log('  ok  both local users authenticated');

  const manage = await request(`/api/artist-updates/${roomId}/manage`, { token: owner });
  assert.strictEqual(manage.status, 200);
  assert.strictEqual(manage.json.data.rocksnaps.eligible, true);
  assert.strictEqual(manage.json.data.rocksnaps.enabled, false);
  assert.strictEqual(manage.json.data.rocksnaps.canEnable, true);
  assert.strictEqual(manage.json.data.slug, roomSlug);
  console.log('  ok  editor capability is limited to the RockSnaps band');

  const otherManage = await request(`/api/artist-updates/${otherId}/manage`, { token: other });
  assert.strictEqual(otherManage.status, 200);
  assert.strictEqual(otherManage.json.data.rocksnaps.eligible, false);
  console.log('  ok  another artist does not see RockSnaps publishing');

  const empty = await request('/api/public/rocksnaps/galleries');
  assert.strictEqual(empty.status, 200);
  assert.deepStrictEqual(empty.json.data, []);
  assert.strictEqual(empty.json.meta.total, 0);
  assert.match(empty.cache || '', /max-age=30/);
  console.log('  ok  public list is empty before opt-in');

  const enabled = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    token: owner,
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(enabled.status, 200, JSON.stringify(enabled.json));
  assert.strictEqual(enabled.json.data.showOnRockSnaps, true);
  const roomAt = enabled.json.data.rocksnapsPublishedAt;
  assert.ok(roomAt);

  const listed = await request('/api/public/rocksnaps/galleries');
  assert.strictEqual(listed.status, 200);
  assert.deepStrictEqual(listed.json.data.map((row) => row.slug), [roomSlug]);
  assert.ok(listed.json.data[0].cover.url.endsWith('/uploads/rocksnaps-local-c.png'));
  assert.strictEqual(listed.json.data[0].photoCount, 3);
  assert.strictEqual(listed.json.data[0].description, 'Local Room is a development gallery for RockSnaps.');
  assert.deepStrictEqual(listed.json.data[0].artist, {
    name: 'RockSnaps Photography',
    slug: 'rocksnapsphotography',
  });
  const leaked = keysOf(listed.json);
  for (const key of ['email', 'createdByUser', 'provider_metadata', 'password', 'showOnRockSnaps']) {
    assert.strictEqual(leaked.has(key), false, key);
  }

  const detail = await request(`/api/public/rocksnaps/galleries/${roomSlug}`);
  assert.strictEqual(detail.status, 200);
  assert.deepStrictEqual(detail.json.data.photos.map((photo) => photo.url.split('/').pop()), [
    'rocksnaps-local-a.png',
    'rocksnaps-local-b.png',
    'rocksnaps-local-c.png',
  ]);
  assert.deepStrictEqual(detail.json.data.photos.map((photo) => photo.order), [0, 1, 2]);
  assert.ok(detail.json.data.cover.url.endsWith('/uploads/rocksnaps-local-c.png'));
  assert.strictEqual(detail.json.data.photos[0].width, 1200);
  console.log('  ok  list and detail use the cover and the saved photo order');

  const faneqo = await request('/api/public/bands/rocksnapsphotography/galleries');
  assert.strictEqual(faneqo.status, 200);
  const faneqoCard = faneqo.json.data.galleries.find((row) => row.slug === roomSlug);
  assert.ok(faneqoCard);
  assert.deepStrictEqual(Object.keys(faneqoCard).sort(), ['canonicalPath', 'cover', 'id', 'photoCount', 'slug', 'title']);
  console.log('  ok  existing Faneqo gallery list contract is unchanged');

  const version = manage.json.data.version;
  const mass = await request(`/api/artist-updates/${roomId}/manage`, {
    method: 'PATCH',
    token: owner,
    body: {
      version,
      title: 'Local Room',
      caption: 'Local Room is a development gallery for RockSnaps.',
      showOnRockSnaps: false,
      rocksnapsPublishedAt: '1999-01-01T00:00:00.000Z',
    },
  });
  assert.strictEqual(mass.status, 200, JSON.stringify(mass.json));
  const still = await request(`/api/public/rocksnaps/galleries/${roomSlug}`);
  assert.strictEqual(still.status, 200);
  assert.notStrictEqual(still.json.data.rocksnapsPublishedAt, '1999-01-01T00:00:00.000Z');
  console.log('  ok  ordinary gallery save cannot change RockSnaps fields');

  const off = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    token: owner,
    body: { showOnRockSnaps: false },
  });
  assert.strictEqual(off.status, 200);
  assert.strictEqual(off.json.data.showOnRockSnaps, false);
  const gone = await request(`/api/public/rocksnaps/galleries/${roomSlug}`);
  assert.strictEqual(gone.status, 404);
  assert.strictEqual(gone.json.error.name, 'not_found');
  console.log('  ok  disabling removes the gallery from the public API');

  const stageOn = await request(`/api/artist-updates/${stageId}/rocksnaps`, {
    method: 'PATCH',
    token: owner,
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(stageOn.status, 200);
  const roomOn = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    token: owner,
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(roomOn.status, 200);
  assert.ok(roomOn.json.data.rocksnapsPublishedAt > roomAt);
  const ordered = await request('/api/public/rocksnaps/galleries');
  assert.deepStrictEqual(ordered.json.data.map((row) => row.slug), [roomSlug, stageSlug]);
  console.log('  ok  re-enable sorts the gallery to the front');

  const hidden = await request(`/api/artist-updates/${roomId}/hide`, { method: 'PATCH', token: owner });
  assert.strictEqual(hidden.status, 200, JSON.stringify(hidden.json));
  const hiddenList = await request('/api/public/rocksnaps/galleries');
  assert.deepStrictEqual(hiddenList.json.data.map((row) => row.slug), [stageSlug]);
  const hiddenDetail = await request(`/api/public/rocksnaps/galleries/${roomSlug}`);
  assert.strictEqual(hiddenDetail.status, 404);
  assert.strictEqual(hiddenDetail.json.error.message, gone.json.error.message);
  console.log('  ok  hiding removes the gallery with the same not-found response');

  const restored = await request(`/api/artist-updates/${roomId}/restore`, { method: 'PATCH', token: owner });
  assert.strictEqual(restored.status, 200);
  const back = await request('/api/public/rocksnaps/galleries');
  assert.ok(back.json.data.some((row) => row.slug === roomSlug));

  const stranger = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    token: other,
    body: { showOnRockSnaps: false },
  });
  assert.strictEqual(stranger.status, 403);
  const foreign = await request(`/api/artist-updates/${otherId}/rocksnaps`, {
    method: 'PATCH',
    token: other,
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(foreign.status, 404);
  assert.strictEqual(foreign.json.error.message, gone.json.error.message);
  const anonymous = await request(`/api/artist-updates/${roomId}/rocksnaps`, {
    method: 'PATCH',
    body: { showOnRockSnaps: true },
  });
  assert.strictEqual(anonymous.status, 401);
  const badPage = await request('/api/public/rocksnaps/galleries', { query: { pageSize: 100 } });
  assert.strictEqual(badPage.status, 400);
  const missing = await request('/api/public/rocksnaps/galleries/does-not-exist');
  assert.strictEqual(missing.status, 404);
  const finalList = await request('/api/public/rocksnaps/galleries');
  assert.ok(finalList.json.data.every((row) => row.artist.slug === 'rocksnapsphotography'));
  assert.strictEqual(finalList.json.data.some((row) => row.slug === 'other-room' || row.title === 'Other Room'), false);
  console.log('  ok  other artists, anonymous clients, and unknown slugs are refused');

  const featured = await request(`/api/artist-updates/${stageId}/feature-on-profile`, {
    method: 'POST',
    token: owner,
  });
  assert.strictEqual(featured.status, 200, JSON.stringify(featured.json));
  assert.strictEqual(featured.json.data.featuredOnProfile, true);
  console.log('  ok  featuring a gallery on the Faneqo profile still works');
  console.log('\nlocal RockSnaps HTTP checks passed');
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
