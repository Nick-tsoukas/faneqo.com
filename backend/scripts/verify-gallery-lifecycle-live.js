'use strict';

/**
 * Live end-to-end check of the gallery lifecycle against a running local
 * Strapi. Not part of the automated suite — it needs a booted server and real
 * rows. Run: node scripts/verify-gallery-lifecycle-live.js
 *
 * Mints its own JWT from the local secret so it does not depend on knowing a
 * test password. Nothing is printed that could identify a person.
 */

require('dotenv').config();

const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const sharp = require('sharp');

// 127.0.0.1, not localhost: Node resolves localhost to ::1 first and Strapi
// binds IPv4 only, which surfaces as an opaque "fetch failed".
const BASE = process.env.VERIFY_BASE || 'http://127.0.0.1:1337';

let pass = 0;
let fail = 0;
const failures = [];

function ok(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function api(path, { method = 'GET', token, body, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (err) { json = null; }
  return { status: res.status, json, text };
}

async function jpeg(seed) {
  return sharp({
    create: {
      width: 240,
      height: 160,
      channels: 3,
      background: { r: (seed * 37) % 255, g: (seed * 71) % 255, b: (seed * 113) % 255 },
    },
  }).jpeg({ quality: 60 }).toBuffer();
}

async function uploadPhoto(token, sessionId, seed) {
  const buf = await jpeg(seed);
  const form = new FormData();
  form.append('files', new Blob([buf], { type: 'image/jpeg' }), `photo-${seed}.jpg`);
  return api(`/api/gallery-drafts/${sessionId}/media`, { method: 'POST', token, form });
}

async function findActor() {
  const db = new Database(process.env.DATABASE_FILENAME || '.tmp/data.db', { readonly: true });
  try {
    const row = db.prepare(`
      SELECT l.band_id AS bandId, l.user_id AS userId, b.slug AS bandSlug
      FROM bands_users_permissions_user_links l
      JOIN bands b ON b.id = l.band_id
      WHERE b.slug IS NOT NULL
      LIMIT 1
    `).get();
    return row || null;
  } finally {
    db.close();
  }
}

(async () => {
  const actor = await findActor();
  if (!actor) {
    console.log('No band/owner pair in the local database — cannot run the live check.');
    process.exit(1);
  }
  const token = jwt.sign({ id: actor.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  console.log(`Live gallery lifecycle against ${BASE} (band #${actor.bandId})\n`);

  // ---------------------------------------------------------------- auth
  console.log('authorization');
  const anon = await api('/api/gallery-drafts/active?bandId=' + actor.bandId);
  ok('anonymous draft read refused', anon.status === 401, `got ${anon.status}`);
  const foreign = await api('/api/gallery-drafts/gd_does_not_exist', { token });
  ok('unknown session answers not_found', foreign.status === 404, `got ${foreign.status}`);

  // ------------------------------------------------------- create + upload
  console.log('\ncreate a general gallery');
  const created = await api('/api/gallery-drafts', {
    method: 'POST', token, body: { bandId: actor.bandId, kind: 'general' },
  });
  ok('draft created', created.status === 200 && !!created.json?.data?.sessionId,
    `status ${created.status} ${created.text.slice(0, 160)}`);
  const sessionId = created.json?.data?.sessionId;
  if (!sessionId) { console.log('\nCannot continue without a session.'); process.exit(1); }
  ok('draft starts public', created.json.data.visibility === 'public');
  ok('draft starts unlocked', created.json.data.audienceLocked === false);
  ok('ceiling advertised as 60', created.json.data.maxPhotos === 60, String(created.json.data.maxPhotos));
  ok('draft carries a media array', Array.isArray(created.json.data.media));

  const resumed = await api(`/api/gallery-drafts?`, {
    method: 'POST', token, body: { bandId: actor.bandId, kind: 'general' },
  });
  ok('second create resumes rather than duplicating',
    resumed.json?.data?.sessionId === sessionId, `${resumed.json?.data?.sessionId} vs ${sessionId}`);

  console.log('\naudience before upload');
  const preSwitch = await api(`/api/gallery-drafts/${sessionId}/audience`, {
    method: 'PUT', token, body: { visibility: 'public' },
  });
  ok('audience change with no media needs no confirmation', preSwitch.status === 200, `got ${preSwitch.status}`);

  console.log('\nupload');
  const first = await uploadPhoto(token, sessionId, 1);
  ok('first photo uploads', first.status === 200 && !!first.json?.data?.mediaId,
    `status ${first.status} ${first.text.slice(0, 160)}`);
  ok('public upload returns a thumb', !!first.json?.data?.thumbUrl);
  ok('upload response hides storage keys', !/faneqo-protected\/|s3\.amazonaws/.test(first.text));

  const afterFirst = await api(`/api/gallery-drafts/${sessionId}`, { token });
  ok('audience locks after first upload', afterFirst.json?.data?.audienceLocked === true);
  ok('media hydrated on read', (afterFirst.json?.data?.media || []).length === 1);

  const uploaded = [first.json.data.mediaId];
  for (let i = 2; i <= 12; i += 1) {
    const res = await uploadPhoto(token, sessionId, i);
    if (res.json?.data?.mediaId) uploaded.push(res.json.data.mediaId);
  }
  ok('12 photos staged', uploaded.length === 12, `${uploaded.length}`);

  console.log('\naudience after upload is locked behind confirmation');
  const blocked = await api(`/api/gallery-drafts/${sessionId}/audience`, {
    method: 'PUT', token, body: { visibility: 'fan_list' },
  });
  ok('switch refused without confirmClear',
    blocked.status === 409 || blocked.json?.error?.name === 'gated_delivery_unavailable',
    `status ${blocked.status} ${blocked.json?.error?.name}`);

  console.log('\nmetadata');
  const cover = uploaded[3];
  const patched = await api(`/api/gallery-drafts/${sessionId}`, {
    method: 'PATCH', token,
    body: {
      title: 'Live verification gallery',
      caption: 'First line.\nSecond line.',
      mediaOrder: [...uploaded].reverse(),
      mediaCaptions: { [String(cover)]: 'The cover shot' },
      coverMediaId: cover,
    },
  });
  ok('draft metadata saved', patched.status === 200, `${patched.status} ${patched.text.slice(0, 200)}`);
  ok('order reversed and kept', patched.json?.data?.mediaOrder?.[0] === uploaded[11]);
  ok('cover persisted', patched.json?.data?.coverMediaId === cover);

  const tooLong = await api(`/api/gallery-drafts/${sessionId}`, {
    method: 'PATCH', token, body: { title: 'x'.repeat(121) },
  });
  ok('121-character title refused', tooLong.status === 400, `got ${tooLong.status}`);

  const foreignMedia = await api(`/api/gallery-drafts/${sessionId}`, {
    method: 'PATCH', token, body: { mediaOrder: [...uploaded, 999999] },
  });
  ok('unknown media id refused in order', foreignMedia.status >= 400, `got ${foreignMedia.status}`);

  console.log('\npublish');
  const key = `live-${Date.now()}`;
  const published = await api(`/api/gallery-drafts/${sessionId}/publish`, {
    method: 'POST', token, body: { publishIdempotencyKey: key },
  });
  ok('publish succeeds', published.status === 200 && !!published.json?.data?.id,
    `${published.status} ${published.text.slice(0, 220)}`);
  const updateId = published.json?.data?.id;
  const slug = published.json?.data?.slug;

  const replay = await api(`/api/gallery-drafts/${sessionId}/publish`, {
    method: 'POST', token, body: { publishIdempotencyKey: key },
  });
  ok('re-publish does not fork a duplicate',
    replay.json?.data?.id === updateId || replay.status === 409,
    `${replay.status} ${replay.json?.data?.id}`);

  console.log('\nmanage payload');
  const manage = await api(`/api/artist-updates/${updateId}/manage`, { token });
  ok('manage loads', manage.status === 200, `${manage.status}`);
  ok('manage exposes bandId', manage.json?.data?.bandId === actor.bandId,
    `${manage.json?.data?.bandId}`);
  ok('manage exposes bandSlug', typeof manage.json?.data?.bandSlug === 'string' && !!manage.json.data.bandSlug);
  ok('manage carries a version', Number.isFinite(manage.json?.data?.version));
  ok('manage keeps all 12 photos', (manage.json?.data?.media || []).length === 12,
    String((manage.json?.data?.media || []).length));
  ok('manage preserves order', manage.json?.data?.media?.[0]?.mediaId === uploaded[11]);
  ok('per-photo caption survived publish',
    (manage.json?.data?.media || []).some((m) => m.caption === 'The cover shot'));
  ok('manage refused anonymously', (await api(`/api/artist-updates/${updateId}/manage`)).status === 401);

  console.log('\nedit');
  const version = manage.json.data.version;
  const keep = manage.json.data.media.slice(0, 10).map((m) => m.mediaId);
  const edited = await api(`/api/artist-updates/${updateId}/manage`, {
    method: 'PATCH', token,
    body: { version, title: 'Edited live gallery', mediaOrder: keep, coverMediaId: keep[0] },
  });
  ok('edit saved', edited.status === 200, `${edited.status} ${edited.text.slice(0, 220)}`);
  ok('two photos removed', (edited.json?.data?.media || []).length === 10,
    String((edited.json?.data?.media || []).length));
  ok('version advanced', edited.json?.data?.version > version);
  ok('canonical slug unchanged', edited.json?.data?.slug === slug);

  const stale = await api(`/api/artist-updates/${updateId}/manage`, {
    method: 'PATCH', token, body: { version, title: 'Stale write' },
  });
  ok('stale version refused with 409', stale.status === 409, `got ${stale.status}`);

  const emptied = await api(`/api/artist-updates/${updateId}/manage`, {
    method: 'PATCH', token, body: { version: edited.json.data.version, mediaOrder: [] },
  });
  ok('emptying the gallery refused', emptied.status === 400, `got ${emptied.status}`);

  const toGated = await api(`/api/artist-updates/${updateId}/manage`, {
    method: 'PATCH', token, body: { version: edited.json.data.version, visibility: 'fan_list' },
  });
  ok('public to gated refused in the editor', toGated.status >= 400, `got ${toGated.status}`);
  ok('refusal explains re-upload rather than leaking',
    /upload|protected|exclusive/i.test(toGated.json?.error?.message || ''),
    toGated.json?.error?.message);

  console.log('\ncanonical public read');
  const bandSlug = manage.json.data.bandSlug;
  const pub = await api(`/api/public/bands/${bandSlug}/galleries/${slug}`);
  ok('public gallery reachable anonymously', pub.status === 200, `${pub.status}`);
  const photos = pub.json?.data?.gallery?.media || [];
  ok('public gallery returns 10 photos', photos.length === 10, String(photos.length));
  ok('public payload leaks no storage keys', !/faneqo-protected\//.test(pub.text));
  ok('per-photo caption reaches the canonical payload',
    photos.some((p) => p.caption === 'The cover shot'),
    JSON.stringify(photos.map((p) => [p.mediaId, p.caption])).slice(0, 200));
  ok('photos without a caption stay null rather than inventing one',
    photos.filter((p) => p.caption == null).length === photos.length - 1);
  ok('gallery caption preserves line breaks',
    (pub.json?.data?.gallery?.caption || '').includes('\n'));

  console.log('\ngated gallery stays locked for a stranger');
  const gated = await api('/api/gallery-drafts', {
    method: 'POST', token, body: { bandId: actor.bandId, kind: 'general' },
  });
  const gatedSession = gated.json?.data?.sessionId;
  const gatedSwitch = await api(`/api/gallery-drafts/${gatedSession}/audience`, {
    method: 'PUT', token, body: { visibility: 'fan_list' },
  });
  if (gatedSwitch.status === 200) {
    const gatedPhoto = await uploadPhoto(token, gatedSession, 500);
    ok('protected upload returns no public url',
      gatedPhoto.json?.data?.protected === true && gatedPhoto.json?.data?.url === null,
      JSON.stringify(gatedPhoto.json?.data || {}).slice(0, 160));
    const gatedRead = await api(`/api/gallery-drafts/${gatedSession}`, { token });
    ok('resumed protected draft gets an owner-scoped thumb path',
      String(gatedRead.json?.data?.media?.[0]?.thumbUrl || '').startsWith('/api/gallery-drafts/'),
      gatedRead.json?.data?.media?.[0]?.thumbUrl);
    const strangerThumb = await api(`/api/gallery-drafts/${gatedSession}/media/${gatedPhoto.json.data.mediaId}`);
    ok('staged protected bytes refused without the owner token',
      strangerThumb.status === 401 || strangerThumb.status === 404, `got ${strangerThumb.status}`);
  } else {
    ok('gated refused honestly when protected delivery is unconfigured',
      gatedSwitch.json?.error?.name === 'gated_delivery_unavailable',
      `${gatedSwitch.status} ${gatedSwitch.json?.error?.name}`);
    ok('gated refusal never silently downgrades to public',
      (await api(`/api/gallery-drafts/${gatedSession}`, { token })).json?.data?.visibility === 'public');
  }
  await api(`/api/gallery-drafts/${gatedSession}`, { method: 'DELETE', token });

  console.log('\nsixty photos');
  const big = await api('/api/gallery-drafts', {
    method: 'POST', token, body: { bandId: actor.bandId, kind: 'show' },
  });
  const bigSession = big.json?.data?.sessionId;
  let staged = 0;
  for (let i = 0; i < 60; i += 1) {
    const res = await uploadPhoto(token, bigSession, 100 + i);
    if (res.json?.data?.mediaId) staged += 1;
  }
  ok('show gallery accepts 60 photos', staged === 60, `${staged}`);
  const overflow = await uploadPhoto(token, bigSession, 999);
  ok('61st photo refused', overflow.status === 400 && overflow.json?.error?.name === 'too_many_images',
    `${overflow.status} ${overflow.json?.error?.name}`);
  ok('refusal copy says 60, never 12', /60/.test(overflow.json?.error?.message || '') && !/\b12\b/.test(overflow.json?.error?.message || ''),
    overflow.json?.error?.message);

  console.log('\ndiscard');
  const discarded = await api(`/api/gallery-drafts/${bigSession}`, { method: 'DELETE', token });
  ok('discard succeeds', discarded.status === 200, `${discarded.status}`);
  ok('discard removed staged bytes', (discarded.json?.data?.deleted || 0) === 60,
    `deleted=${discarded.json?.data?.deleted} skipped=${discarded.json?.data?.skipped}`);
  const afterDiscard = await api(`/api/gallery-drafts/${bigSession}`, { token });
  ok('discarded draft no longer active',
    afterDiscard.status === 404 || afterDiscard.json?.data?.status === 'discarded',
    `${afterDiscard.status} ${afterDiscard.json?.data?.status}`);
  const publishedStillThere = await api(`/api/artist-updates/${updateId}/manage`, { token });
  ok('published gallery untouched by cleanup', (publishedStillThere.json?.data?.media || []).length === 10);

  console.log(`\n${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log('\nfailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  process.exit(fail ? 1 : 0);
})().catch((err) => {
  console.error('\nverification crashed:', err.message);
  if (err.cause) console.error('cause:', err.cause.code || err.cause.message || err.cause);
  console.error(err.stack);
  process.exit(1);
});
