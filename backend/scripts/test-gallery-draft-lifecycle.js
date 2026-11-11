'use strict';

/**
 * Gallery draft / upload-session lifecycle.
 * Run: node scripts/test-gallery-draft-lifecycle.js
 */

const assert = require('assert');
const updatePure = require('../src/utils/artistUpdates/artistUpdatePure');
const mediaPure = require('../src/utils/artistUpdates/protectedMediaPure');
const pure = require('../src/utils/galleries/galleryDraftPure');
const { createGalleryDraftService } = require('../src/utils/galleries/galleryDraftService');
const { createArtistUpdateService, authorizeUpdateMedia } = require('../src/utils/artistUpdates/artistUpdateService');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const BAND = 7;
const OTHER_BAND = 8;
const USER = 2;
const OTHER_USER = 9;

function ids(count, from = 1) {
  return Array.from({ length: count }, (_, index) => index + from);
}

function iso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

// --- in-memory Strapi -------------------------------------------------------

function relValue(value) {
  if (value && typeof value === 'object') return value.id != null ? value.id : null;
  return value;
}

function matchValue(actual, expected) {
  if (Array.isArray(actual)) return actual.some((item) => matchValue(item, expected));
  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    if ('$in' in expected) return expected.$in.some((v) => String(relValue(actual)) === String(v));
    if ('$lt' in expected) return new Date(actual).getTime() < new Date(expected.$lt).getTime();
    if ('$containsi' in expected) {
      return String(actual || '').toLowerCase().includes(String(expected.$containsi).toLowerCase());
    }
    if ('$null' in expected) return expected.$null ? relValue(actual) == null : relValue(actual) != null;
    if ('id' in expected) return matchValue(relValue(actual), expected.id);
    return false;
  }
  return String(relValue(actual)) === String(expected);
}

function matchRow(row, filters) {
  for (const [key, expected] of Object.entries(filters || {})) {
    if (key === '$or') {
      if (!expected.some((sub) => matchRow(row, sub))) return false;
      continue;
    }
    if (!matchValue(row[key], expected)) return false;
  }
  return true;
}

function createMockStrapi(seed = {}) {
  const db = {
    'api::gallery-draft.gallery-draft': [],
    'plugin::upload.file': [],
    'api::artist-update.artist-update': [],
    'api::band-member.band-member': [{ id: 1, band: BAND, user: USER, role: 'owner', status: 'active' }],
    'api::band.band': [
      { id: BAND, name: 'Badflower', slug: 'badflower', users_permissions_user: { id: USER } },
      { id: OTHER_BAND, name: 'Other', slug: 'other', users_permissions_user: { id: OTHER_USER } },
    ],
    'api::show-recap.show-recap': [],
    'api::event.event': [],
    'api::fan.fan': [],
    'api::fan-show-attendance.fan-show-attendance': [],
    'api::conversation-message.conversation-message': [],
    ...seed,
  };
  let nextId = 500;
  const table = (uid) => (db[uid] = db[uid] || []);

  /** Stand-in for Strapi's media populate: id array in, Upload rows out. */
  function hydrate(uid, row) {
    if (!row || uid !== 'api::artist-update.artist-update' || !Array.isArray(row.media)) return row;
    const files = db['plugin::upload.file'];
    return {
      ...row,
      media: row.media.map((item) => {
        const id = item && typeof item === 'object' ? item.id : item;
        return files.find((file) => Number(file.id) === Number(id)) || { id: Number(id) };
      }),
    };
  }

  const entityService = {
    async findMany(uid, query = {}) {
      let rows = table(uid).filter((row) => matchRow(row, query.filters));
      const sort = query.sort;
      if (sort && typeof sort === 'object') {
        const [key, dir] = Object.entries(sort)[0];
        rows = [...rows].sort((a, b) => {
          const av = String(a[key] == null ? '' : a[key]);
          const bv = String(b[key] == null ? '' : b[key]);
          return dir === 'desc' ? bv.localeCompare(av) : av.localeCompare(bv);
        });
      }
      const start = query.start || 0;
      return rows.slice(start, start + (query.limit || rows.length)).map((row) => hydrate(uid, row));
    },
    async findOne(uid, id) {
      return hydrate(uid, table(uid).find((row) => Number(row.id) === Number(id)) || null);
    },
    async count(uid, query = {}) {
      return table(uid).filter((row) => matchRow(row, query.filters)).length;
    },
    async create(uid, { data }) {
      nextId += 1;
      const row = {
        id: nextId,
        createdAt: iso(),
        updatedAt: iso(),
        ...data,
      };
      table(uid).push(row);
      return row;
    },
    async update(uid, id, { data }) {
      const row = table(uid).find((item) => Number(item.id) === Number(id));
      if (!row) return null;
      Object.assign(row, data, { updatedAt: iso() });
      return row;
    },
    async delete(uid, id) {
      const rows = table(uid);
      const index = rows.findIndex((row) => Number(row.id) === Number(id));
      if (index >= 0) rows.splice(index, 1);
      return { id };
    },
  };

  return {
    db,
    log: { info() {}, warn() {}, error() {} },
    entityService,
    plugins: {
      upload: {
        services: {
          upload: {
            async upload({ files }) {
              nextId += 1;
              const row = {
                id: nextId,
                name: files.originalFilename || 'photo.jpg',
                mime: files.mimetype || 'image/jpeg',
                size: Math.round((files.size || 1000) / 1000),
                width: 1600,
                height: 1200,
                url: `https://cdn.example/${nextId}.jpg`,
                formats: {
                  thumbnail: { url: `https://cdn.example/thumb-${nextId}.jpg`, width: 245, height: 184 },
                  medium: { url: `https://cdn.example/medium-${nextId}.jpg`, width: 750, height: 563 },
                },
                provider: 'aws-s3',
                provider_metadata: {},
                createdAt: iso(),
              };
              db['plugin::upload.file'].push(row);
              return [row];
            },
            async remove(file) {
              const rows = db['plugin::upload.file'];
              const index = rows.findIndex((row) => Number(row.id) === Number(file.id));
              if (index >= 0) rows.splice(index, 1);
              return file;
            },
          },
        },
      },
    },
  };
}

/** Protected upload stand-in: no S3, no Sharp, same contract. */
function fakeProtectedMedia(strapi, { ready = true } = {}) {
  const deleted = [];
  return {
    deleted,
    configured: () => (ready ? { ready: true, reason: 'configured' } : { ready: false, reason: 'flag_off' }),
    cdnHosts: () => [],
    async uploadProtectedImage({ userId, bandId }) {
      const row = await strapi.entityService.create('plugin::upload.file', {
        data: {
          mime: 'image/webp',
          size: 120,
          width: 960,
          height: 640,
          url: 'faneqo-protected://objectabc',
          provider: mediaPure.PROVIDER_NAME,
          provider_metadata: {
            protected: true,
            objectId: 'objectabc',
            keys: { gallery: 'faneqo-protected/objectabc/gallery.webp' },
            domain: 'artist-update',
            bandId,
            uploaderUserId: userId,
          },
        },
      });
      return { data: { id: row.id, width: row.width, height: row.height, mime: row.mime, protected: true } };
    },
    async deleteMediaFile(file) {
      deleted.push(Number(file.id));
      await strapi.entityService.delete('plugin::upload.file', file.id);
      return true;
    },
  };
}

function jpegFile(bytes = 1000) {
  return { originalFilename: 'photo.jpg', mimetype: 'image/jpeg', size: bytes, buffer: Buffer.alloc(4) };
}

function draftService(strapi, overrides = {}) {
  return createGalleryDraftService(strapi, {}, {
    protectedMedia: overrides.protectedMedia || fakeProtectedMedia(strapi, { ready: false }),
    artistUpdates: overrides.artistUpdates,
  });
}

function stagedFile(strapi, { id, sessionId, userId = USER, classification = 'public', createdAt = iso() }) {
  const row = {
    id,
    mime: classification === 'protected' ? 'image/webp' : 'image/jpeg',
    size: 120,
    width: 1600,
    height: 1200,
    url: classification === 'protected' ? 'faneqo-protected://obj' : `https://cdn.example/${id}.jpg`,
    provider: classification === 'protected' ? mediaPure.PROVIDER_NAME : 'aws-s3',
    createdAt,
    provider_metadata: {
      ...(classification === 'protected'
        ? { protected: true, objectId: `obj${id}`, keys: { gallery: `faneqo-protected/obj${id}/gallery.webp` } }
        : {}),
      ...pure.stagedMediaTags({
        sessionId,
        bandId: BAND,
        uploaderUserId: userId,
        classification,
        stagedAt: createdAt,
      }),
    },
  };
  strapi.db['plugin::upload.file'].push(row);
  return row;
}

(async () => {
  console.log('\n=== Gallery draft lifecycle ===\n');

  // --- photo ceiling -------------------------------------------------------

  await test('1 / 12 / 30 / 60 photos publish for both show and general galleries', () => {
    for (const count of [1, 12, 30, 60]) {
      const general = updatePure.validatePublishInput({ visibility: 'public', mediaIds: ids(count) });
      assert.strictEqual(general.error, undefined, `general ${count}`);
      assert.strictEqual(general.mediaIds.length, count);
      const show = updatePure.validatePublishInput({
        visibility: 'show_attendees',
        mediaIds: ids(count),
        showRecapId: 41,
        protectedReady: true,
      });
      assert.strictEqual(show.error, undefined, `show ${count}`);
      assert.strictEqual(show.mediaIds.length, count);
    }
  });

  await test('the 61st photo is refused everywhere and no copy still says 12', () => {
    const general = updatePure.validatePublishInput({ visibility: 'public', mediaIds: ids(61) });
    assert.strictEqual(general.error, 'too_many_images');
    assert.match(general.message, /60/);
    const show = updatePure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: ids(61),
      showRecapId: 41,
      protectedReady: true,
    });
    assert.strictEqual(show.error, 'too_many_images');
    assert.doesNotMatch(show.message, /\b12\b/);
    assert.strictEqual(updatePure.MAX_SHOW_IMAGES, updatePure.MAX_IMAGES);
    assert.strictEqual(pure.canAcceptAnotherPhoto(59), true);
    assert.strictEqual(pure.canAcceptAnotherPhoto(60), false);
  });

  // --- byte ceiling --------------------------------------------------------

  await test('8 MB is accepted and one byte over is refused', () => {
    const { validatePublicUpload } = require('../src/utils/galleries/galleryDraftService');
    assert.strictEqual(validatePublicUpload(jpegFile(mediaPure.MAX_IMAGE_BYTES)).ok, true);
    const over = validatePublicUpload(jpegFile(mediaPure.MAX_IMAGE_BYTES + 1));
    assert.strictEqual(over.error, 'too_large');
    assert.strictEqual(over.message, mediaPure.IMAGE_TOO_LARGE_COPY);
    /* HEIC is a first-class input now; it is converted before it is stored. */
    const heic = validatePublicUpload({ originalFilename: 'IMG.HEIC', mimetype: 'image/heic', size: 10 });
    assert.strictEqual(heic.ok, true);
    const gif = validatePublicUpload({ originalFilename: 'x.gif', mimetype: 'image/gif', size: 10 });
    assert.strictEqual(gif.error, 'invalid_type');
  });

  // --- publish-time authorization -----------------------------------------

  const protectedArtistFile = {
    id: 101,
    mime: 'image/webp',
    size: 120,
    provider: mediaPure.PROVIDER_NAME,
    provider_metadata: { protected: true, domain: 'artist-update', bandId: BAND, uploaderUserId: USER },
  };
  const publicFile = {
    id: 55,
    mime: 'image/jpeg',
    size: 80,
    url: 'https://cdn.example/55.jpg',
    createdAt: iso(),
    provider_metadata: { uploaderUserId: USER },
  };

  await test('duplicate media ids are deduped before authorization', () => {
    const validated = updatePure.validatePublishInput({
      visibility: 'public',
      mediaIds: [4, 9, 4, 9, 12],
    });
    assert.deepStrictEqual(validated.mediaIds, [4, 9, 12]);
  });

  await test('mixed public + protected media is refused for any visibility', () => {
    const mixed = updatePure.evaluateMediaStorageMix([protectedArtistFile, publicFile]);
    assert.strictEqual(mixed.error, 'mixed_media_storage');
    assert.strictEqual(mixed.status, 400);
    assert.strictEqual(updatePure.evaluateMediaStorageMix([protectedArtistFile]).protected, true);
    assert.strictEqual(updatePure.evaluateMediaStorageMix([publicFile]).protected, false);
  });

  await test('authorizeUpdateMedia refuses mixed storage and already-attached media', async () => {
    const strapi = createMockStrapi();
    strapi.db['plugin::upload.file'].push(protectedArtistFile, publicFile);
    const mixed = await authorizeUpdateMedia(strapi, USER, [101, 55], BAND);
    assert.strictEqual(mixed.error, 'mixed_media_storage');

    strapi.db['api::artist-update.artist-update'].push({ id: 900, media: [{ id: 101 }] });
    const attached = await authorizeUpdateMedia(strapi, USER, [101], BAND);
    assert.strictEqual(attached.error, 'media_already_attached');
    assert.strictEqual(attached.status, 400);

    const ownGallery = await authorizeUpdateMedia(strapi, USER, [101], BAND, { allowUpdateId: 900 });
    assert.strictEqual(ownGallery.error, undefined);
    assert.strictEqual(ownGallery.protected, true);
  });

  await test('a public file is refused for a gated publish', () => {
    const auth = updatePure.authorizeArtistUpdateFile(publicFile, { userId: USER, bandId: BAND });
    assert.strictEqual(auth.protected, false);
    const change = updatePure.evaluateVisibilityChange({
      from: 'public',
      to: 'fan_list',
      mediaFiles: [publicFile],
      protectedReady: true,
    });
    assert.strictEqual(change.error, 'unsafe_visibility_transition');
  });

  await test('conversation-domain, foreign uploader, and foreign band files are refused', () => {
    const conversation = {
      ...protectedArtistFile,
      provider_metadata: { ...protectedArtistFile.provider_metadata, domain: 'conversation' },
    };
    assert.strictEqual(updatePure.authorizeArtistUpdateFile(conversation, { userId: USER, bandId: BAND }).reason, 'wrong_domain');
    assert.strictEqual(updatePure.authorizeArtistUpdateFile(protectedArtistFile, { userId: OTHER_USER, bandId: BAND }).reason, 'wrong_uploader');
    assert.strictEqual(updatePure.authorizeArtistUpdateFile(protectedArtistFile, { userId: USER, bandId: OTHER_BAND }).reason, 'wrong_band');
  });

  // --- draft lifecycle -----------------------------------------------------

  await test('starting a draft twice resumes the same session', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const first = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    assert.ok(!first.error, first.message);
    assert.ok(first.data.sessionId.startsWith('gd_'));
    assert.strictEqual(first.data.visibility, 'public');
    assert.strictEqual(first.data.audienceLocked, false);
    assert.strictEqual(first.data.maxPhotos, 60);

    const second = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    assert.strictEqual(second.data.sessionId, first.data.sessionId);
    assert.strictEqual(strapi.db['api::gallery-draft.gallery-draft'].length, 1);

    const active = await service.getActiveDraft({ userId: USER, bandId: BAND, kind: 'general' });
    assert.strictEqual(active.data.sessionId, first.data.sessionId);
  });

  await test('a foreign user cannot read, patch, or discard someone else’s draft', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    for (const call of [
      service.getDraft({ userId: OTHER_USER, sessionId: data.sessionId }),
      service.patchDraft({ userId: OTHER_USER, sessionId: data.sessionId, title: 'Mine now' }),
      service.discardDraft({ userId: OTHER_USER, sessionId: data.sessionId }),
      service.uploadDraftMedia({ userId: OTHER_USER, sessionId: data.sessionId, file: jpegFile() }),
    ]) {
      const result = await call;
      assert.strictEqual(result.error, 'not_found', 'foreign access must not confirm the session exists');
      assert.strictEqual(result.status, 404);
    }
    const anon = await service.getDraft({ userId: null, sessionId: data.sessionId });
    assert.strictEqual(anon.error, 'unauthorized');
  });

  await test('return context keeps only safe keys and never a token', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({
      userId: USER,
      bandId: BAND,
      kind: 'general',
      returnContext: { from: 'night', draftKey: 'k1', returnGallery: 'g1', jwt: 'secret-token', nested: { a: 1 } },
    });
    assert.deepStrictEqual(data.returnContext, { from: 'night', draftKey: 'k1', returnGallery: 'g1' });
    assert.strictEqual(JSON.stringify(data).includes('secret-token'), false);
  });

  await test('audience change before any upload just sets the audience', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi, { protectedMedia: fakeProtectedMedia(strapi, { ready: true }) });
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const result = await service.setAudience({ userId: USER, sessionId: data.sessionId, visibility: 'fan_list' });
    assert.ok(!result.error, result.message);
    assert.strictEqual(result.data.visibility, 'fan_list');
    assert.strictEqual(result.data.classification, 'protected');
    assert.strictEqual(result.data.audienceLocked, false);
  });

  await test('audience change after upload requires confirmClear, then clears staged media', async () => {
    const strapi = createMockStrapi();
    const fake = fakeProtectedMedia(strapi, { ready: true });
    const service = draftService(strapi, { protectedMedia: fake });
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const uploaded = await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() });
    assert.ok(!uploaded.error, uploaded.message);
    assert.strictEqual(uploaded.data.protected, false);
    assert.ok(uploaded.data.url);

    const locked = await service.getDraft({ userId: USER, sessionId: data.sessionId });
    assert.strictEqual(locked.data.audienceLocked, true);
    assert.strictEqual(locked.data.photoCount, 1);

    const refused = await service.setAudience({ userId: USER, sessionId: data.sessionId, visibility: 'fan_list' });
    assert.strictEqual(refused.error, 'confirm_clear_required');
    assert.strictEqual(refused.status, 409);
    assert.strictEqual(refused.photoCount, 1);
    assert.strictEqual(refused.requiresConfirm, true);

    const cleared = await service.setAudience({
      userId: USER,
      sessionId: data.sessionId,
      visibility: 'fan_list',
      confirmClear: true,
    });
    assert.ok(!cleared.error, cleared.message);
    assert.strictEqual(cleared.data.visibility, 'fan_list');
    assert.strictEqual(cleared.data.photoCount, 0);
    assert.strictEqual(cleared.data.audienceLocked, false);
    assert.strictEqual(cleared.data.coverMediaId, null);
    assert.strictEqual(strapi.db['plugin::upload.file'].length, 0, 'cleared bytes are really gone');
  });

  await test('a same-classification audience change keeps the staged photos', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi, { protectedMedia: fakeProtectedMedia(strapi, { ready: true }) });
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    await service.setAudience({ userId: USER, sessionId: data.sessionId, visibility: 'fan_list' });
    await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() });
    strapi.db['api::show-recap.show-recap'].push({ id: 41, band: { id: BAND }, eventId: null });
    await service.patchDraft({ userId: USER, sessionId: data.sessionId, showRecapId: 41 });
    const moved = await service.setAudience({
      userId: USER,
      sessionId: data.sessionId,
      visibility: 'show_attendees',
    });
    assert.ok(!moved.error, moved.message);
    assert.strictEqual(moved.data.photoCount, 1, 'protected → protected keeps the upload');
  });

  await test('gated audience is refused when protected delivery is not configured', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const refused = await service.setAudience({ userId: USER, sessionId: data.sessionId, visibility: 'fan_list' });
    assert.strictEqual(refused.error, 'gated_delivery_unavailable');
    const still = await service.getDraft({ userId: USER, sessionId: data.sessionId });
    assert.strictEqual(still.data.visibility, 'public', 'never silently falls back to public after claiming gated');
  });

  await test('show_attendees is refused without a night the band owns', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi, { protectedMedia: fakeProtectedMedia(strapi, { ready: true }) });
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const refused = await service.setAudience({ userId: USER, sessionId: data.sessionId, visibility: 'show_attendees' });
    assert.strictEqual(refused.error, 'show_required');

    strapi.db['api::show-recap.show-recap'].push({ id: 77, band: { id: OTHER_BAND } });
    const foreign = await service.patchDraft({ userId: USER, sessionId: data.sessionId, showRecapId: 77 });
    assert.strictEqual(foreign.error, 'show_not_owned');
    assert.strictEqual(foreign.status, 403);
  });

  await test('patch refuses foreign media, bad covers, and out-of-bounds text', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const up = await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() });
    const mine = up.data.mediaId;

    assert.strictEqual((await service.patchDraft({
      userId: USER, sessionId: data.sessionId, mediaOrder: [mine, 99999],
    })).error, 'foreign_media');
    assert.strictEqual((await service.patchDraft({
      userId: USER, sessionId: data.sessionId, coverMediaId: 99999,
    })).error, 'invalid_cover');
    assert.strictEqual((await service.patchDraft({
      userId: USER, sessionId: data.sessionId, title: 'x'.repeat(updatePure.MAX_TITLE + 1),
    })).error, 'title_too_long');
    assert.strictEqual((await service.patchDraft({
      userId: USER, sessionId: data.sessionId, caption: 'x'.repeat(updatePure.MAX_CAPTION + 1),
    })).error, 'caption_too_long');
    assert.strictEqual((await service.patchDraft({
      userId: USER, sessionId: data.sessionId, mediaCaptions: { [mine]: 'x'.repeat(301) },
    })).error, 'media_caption_too_long');

    const ok = await service.patchDraft({
      userId: USER,
      sessionId: data.sessionId,
      title: 'Nashville',
      caption: 'Thanks for coming',
      mediaCaptions: { [mine]: 'Front row' },
      coverMediaId: mine,
    });
    assert.ok(!ok.error, ok.message);
    assert.strictEqual(ok.data.title, 'Nashville');
    assert.strictEqual(ok.data.mediaCaptions[String(mine)], 'Front row');
    assert.strictEqual(ok.data.coverMediaId, mine);
  });

  await test('deleting draft media only works on this session’s own files', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const a = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    const b = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    strapi.db['plugin::upload.file'].push({ id: 4242, mime: 'image/jpeg', url: 'https://cdn.example/x.jpg', provider_metadata: {} });

    const foreign = await service.deleteDraftMedia({ userId: USER, sessionId: data.sessionId, mediaId: 4242 });
    assert.strictEqual(foreign.error, 'foreign_media');
    assert.strictEqual(foreign.status, 403);
    assert.ok(strapi.db['plugin::upload.file'].some((f) => f.id === 4242), 'untagged media is never deleted');

    const removed = await service.deleteDraftMedia({ userId: USER, sessionId: data.sessionId, mediaId: a });
    assert.ok(!removed.error, removed.message);
    assert.deepStrictEqual(removed.data.mediaOrder, [b]);
    assert.strictEqual(removed.data.coverMediaId, b, 'cover falls to the new first photo');
    assert.strictEqual(strapi.db['plugin::upload.file'].some((f) => f.id === a), false);
  });

  await test('discard clears the session and its staged bytes', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() });
    const result = await service.discardDraft({ userId: USER, sessionId: data.sessionId });
    assert.strictEqual(result.data.status, 'discarded');
    assert.strictEqual(result.data.deleted, 1);
    assert.strictEqual(strapi.db['plugin::upload.file'].length, 0);
    const resumed = await service.getActiveDraft({ userId: USER, bandId: BAND, kind: 'general' });
    assert.strictEqual(resumed.data, null, 'a discarded draft is not resumable');
  });

  await test('publish attaches the draft, clears staged flags, and replays idempotently', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const a = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    const b = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    await service.patchDraft({
      userId: USER,
      sessionId: data.sessionId,
      title: 'Nashville',
      caption: 'Thanks',
      mediaCaptions: { [a]: 'Opener', [b]: 'Encore' },
      coverMediaId: b,
    });

    const key = '11111111-2222-3333-4444-555555555555';
    const published = await service.publishDraft({ userId: USER, sessionId: data.sessionId, publishIdempotencyKey: key });
    assert.ok(!published.error, published.message);
    const updateId = published.data.id;
    assert.strictEqual(published.data.photoCount, 2);

    const row = strapi.db['api::artist-update.artist-update'].find((r) => r.id === updateId);
    assert.strictEqual(row.status, 'published');
    assert.strictEqual(row.coverMediaId, b);
    assert.deepStrictEqual(row.mediaCaptions, { [String(a)]: 'Opener', [String(b)]: 'Encore' });
    assert.strictEqual(row.galleryVersion, 0);

    for (const id of [a, b]) {
      const file = strapi.db['plugin::upload.file'].find((f) => f.id === id);
      assert.strictEqual(file.provider_metadata.faneqoGalleryStaged, false, 'attached bytes stop being staged');
    }

    const replay = await service.publishDraft({ userId: USER, sessionId: data.sessionId, publishIdempotencyKey: key });
    assert.ok(!replay.error, replay.message);
    assert.strictEqual(replay.data.id, updateId, 'republishing returns the same gallery');
    assert.strictEqual(strapi.db['api::artist-update.artist-update'].length, 1, 'never a duplicate');
  });

  await test('published captions reach the canonical viewer and gated viewers get none', () => {
    const files = [
      { id: 1, mime: 'image/jpeg', url: 'https://cdn.example/1.jpg', width: 100, height: 100 },
      { id: 2, mime: 'image/jpeg', url: 'https://cdn.example/2.jpg', width: 100, height: 100 },
    ];
    const media = updatePure.serializeUpdateMediaList(files, {
      updateId: 5,
      visibility: 'public',
      captions: { 1: 'Opener', 2: 'Encore' },
    });
    assert.deepStrictEqual(media.map((row) => row.caption), ['Opener', 'Encore']);
    assert.deepStrictEqual(media.map((row) => row.mediaId), [1, 2]);

    const gated = updatePure.serializeUpdateMediaList(files, {
      updateId: 5,
      visibility: 'show_attendees',
      captions: { 1: 'Opener' },
      env: { JWT_SECRET: 'unit-test-secret' },
    });
    assert.strictEqual(gated[0].caption, 'Opener');
    assert.strictEqual(gated[0].protected, true);

    const locked = updatePure.publicTeaser({
      id: 5,
      slug: 'nashville',
      visibility: 'show_attendees',
      status: 'published',
      media: gated,
      photoCount: 2,
    }, { allowed: false, reason: 'show_attendees', teaser: true });
    assert.deepStrictEqual(locked.media, []);
    assert.strictEqual(JSON.stringify(locked).includes('Opener'), false);
  });

  // --- editing -------------------------------------------------------------

  async function publishedFixture({ protectedMedia = false } = {}) {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const a = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    const b = (await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() })).data.mediaId;
    await service.patchDraft({ userId: USER, sessionId: data.sessionId, title: 'Nashville', coverMediaId: a });
    const published = await service.publishDraft({ userId: USER, sessionId: data.sessionId });
    if (protectedMedia) {
      for (const id of [a, b]) {
        const file = strapi.db['plugin::upload.file'].find((f) => f.id === id);
        file.provider = mediaPure.PROVIDER_NAME;
        file.url = 'faneqo-protected://obj';
        file.mime = 'image/webp';
        file.provider_metadata = {
          ...file.provider_metadata,
          protected: true,
          objectId: `obj${id}`,
          domain: 'artist-update',
          bandId: BAND,
          uploaderUserId: USER,
        };
      }
    }
    return { strapi, service, updateId: published.data.id, a, b, sessionId: data.sessionId };
  }

  await test('GET manage is the editing authority and is band-scoped', async () => {
    const { strapi, updateId, a } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const view = await updates.getManage({ userId: USER, updateId });
    assert.ok(!view.error, view.message);
    assert.strictEqual(view.data.id, updateId);
    assert.strictEqual(view.data.version, 0);
    assert.strictEqual(view.data.coverMediaId, a);
    assert.strictEqual(view.data.media.length, 2);
    assert.deepStrictEqual(view.data.media.map((m) => m.order), [0, 1]);

    assert.strictEqual((await updates.getManage({ userId: null, updateId })).error, 'unauthorized');
    const crossBand = await updates.getManage({ userId: OTHER_USER, updateId });
    assert.strictEqual(crossBand.error, 'forbidden');
    assert.strictEqual(crossBand.status, 403);
  });

  await test('a stale version is refused with 409 and writes nothing', async () => {
    const { strapi, updateId } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const conflict = await updates.saveManage({ userId: USER, updateId, version: 4, title: 'Renamed' });
    assert.strictEqual(conflict.error, 'version_conflict');
    assert.strictEqual(conflict.status, 409);
    assert.strictEqual(conflict.version, 0);
    const row = strapi.db['api::artist-update.artist-update'].find((r) => r.id === updateId);
    assert.strictEqual(row.title, 'Nashville', 'a refused save must not write');
  });

  await test('a real save bumps the version once, keeps the slug, and persists captions', async () => {
    const { strapi, updateId, a, b } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const before = strapi.db['api::artist-update.artist-update'].find((r) => r.id === updateId).slug;

    const saved = await updates.saveManage({
      userId: USER,
      updateId,
      version: 0,
      title: 'Nashville night two',
      mediaOrder: [b, a],
      mediaCaptions: { [a]: 'Second', [b]: 'First' },
    });
    assert.ok(!saved.error, saved.message);
    assert.strictEqual(saved.data.version, 1);
    assert.strictEqual(saved.data.slug, before, 'canonical slug never changes on edit');
    assert.deepStrictEqual(saved.data.media.map((m) => m.mediaId), [b, a]);
    assert.deepStrictEqual(saved.data.media.map((m) => m.caption), ['First', 'Second']);

    const idempotent = await updates.saveManage({ userId: USER, updateId, version: 1 });
    assert.strictEqual(idempotent.data.version, 1, 'a no-op save does not bump the version');
  });

  await test('dropping the cover photo resolves the cover to the new first photo', async () => {
    const { strapi, updateId, a, b } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const saved = await updates.saveManage({ userId: USER, updateId, version: 0, mediaOrder: [b] });
    assert.ok(!saved.error, saved.message);
    assert.strictEqual(saved.data.coverMediaId, b);
    assert.strictEqual(saved.data.media.length, 1);
    assert.strictEqual(
      strapi.db['plugin::upload.file'].some((f) => f.id === a),
      false,
      'an unreferenced dropped file is really deleted'
    );
  });

  await test('an older gallery whose photos predate ownership tags is still editable', async () => {
    const { strapi, updateId, a, b } = await publishedFixture();
    for (const id of [a, b]) {
      const file = strapi.db['plugin::upload.file'].find((f) => f.id === id);
      file.provider_metadata = {};
      file.createdAt = iso(-400 * DAY_MS);
    }
    const updates = createArtistUpdateService(strapi);
    const saved = await updates.saveManage({
      userId: USER, updateId, version: 0, mediaOrder: [b, a], mediaCaptions: { [b]: 'Now first' },
    });
    assert.ok(!saved.error, saved.message);
    assert.deepStrictEqual(saved.data.media.map((m) => m.mediaId), [b, a]);
    assert.strictEqual(saved.data.media[0].caption, 'Now first');
  });

  await test('a dropped file referenced elsewhere survives the edit', async () => {
    const { strapi, updateId, a, b } = await publishedFixture();
    strapi.db['api::conversation-message.conversation-message'].push({ id: 1, attachmentGallery: [{ id: a }] });
    const updates = createArtistUpdateService(strapi);
    const saved = await updates.saveManage({ userId: USER, updateId, version: 0, mediaOrder: [b] });
    assert.ok(!saved.error, saved.message);
    assert.ok(strapi.db['plugin::upload.file'].some((f) => f.id === a), 'still referenced, still stored');
  });

  await test('a gallery can never be saved down to zero photos', async () => {
    const { strapi, updateId } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const empty = await updates.saveManage({ userId: USER, updateId, version: 0, mediaOrder: [] });
    assert.strictEqual(empty.error, 'media_required');
    assert.strictEqual(empty.status, 400);
  });

  await test('the 60 ceiling holds when adding photos through an edit', async () => {
    const { strapi, updateId, a, b } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const tooMany = await updates.saveManage({
      userId: USER,
      updateId,
      version: 0,
      mediaOrder: [a, b, ...ids(59, 9000)],
    });
    assert.strictEqual(tooMany.error, 'too_many_images');
    assert.match(tooMany.message, /60/);
  });

  await test('adding photos requires an owned draft session with a matching classification', async () => {
    const { strapi, service, updateId, a, b } = await publishedFixture();
    const updates = createArtistUpdateService(strapi);
    const started = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general', updateId });
    assert.strictEqual(started.data.mode, 'edit');
    const sessionId = started.data.sessionId;
    const added = (await service.uploadDraftMedia({ userId: USER, sessionId, file: jpegFile() })).data.mediaId;

    const noSession = await updates.saveManage({ userId: USER, updateId, version: 0, mediaOrder: [a, b, added] });
    assert.strictEqual(noSession.error, 'foreign_media');
    assert.strictEqual(noSession.status, 403);

    const ok = await updates.saveManage({
      userId: USER, updateId, version: 0, sessionId, mediaOrder: [a, b, added],
    });
    assert.ok(!ok.error, ok.message);
    assert.strictEqual(ok.data.media.length, 3);
  });

  await test('the editor refuses both unsafe visibility directions', async () => {
    const publicSet = await publishedFixture();
    const updates = createArtistUpdateService(publicSet.strapi);
    const toGated = await updates.saveManage({
      userId: USER, updateId: publicSet.updateId, version: 0, visibility: 'fan_list',
    });
    assert.strictEqual(toGated.error, 'gated_delivery_unavailable');

    const gatedSet = await publishedFixture({ protectedMedia: true });
    gatedSet.strapi.db['api::artist-update.artist-update']
      .find((r) => r.id === gatedSet.updateId).visibility = 'fan_list';
    const gatedUpdates = createArtistUpdateService(gatedSet.strapi);
    const toPublic = await gatedUpdates.saveManage({
      userId: USER, updateId: gatedSet.updateId, version: 0, visibility: 'public',
    });
    assert.strictEqual(toPublic.error, 'unsafe_visibility_transition');
    assert.match(toPublic.message, /new public upload/);
  });

  // --- cleanup -------------------------------------------------------------

  function abandonedDraft(strapi, { sessionId, status = 'discarded', ageMs = 2 * DAY_MS, mediaOrder = [] }) {
    const row = {
      id: 300 + strapi.db['api::gallery-draft.gallery-draft'].length,
      sessionId,
      band: { id: BAND },
      createdByUser: { id: USER },
      kind: 'general',
      mode: 'create',
      status,
      visibility: 'public',
      mediaOrder,
      mediaCaptions: {},
      lastActivityAt: iso(-ageMs),
      createdAt: iso(-ageMs),
      updatedAt: iso(-ageMs),
    };
    strapi.db['api::gallery-draft.gallery-draft'].push(row);
    return row;
  }

  await test('cleanup deletes abandoned public and protected staged media', async () => {
    const strapi = createMockStrapi();
    const fake = fakeProtectedMedia(strapi, { ready: true });
    const service = draftService(strapi, { protectedMedia: fake });
    stagedFile(strapi, { id: 11, sessionId: 'gd_old', classification: 'public', createdAt: iso(-2 * DAY_MS) });
    stagedFile(strapi, { id: 12, sessionId: 'gd_old', classification: 'protected', createdAt: iso(-2 * DAY_MS) });
    abandonedDraft(strapi, { sessionId: 'gd_old', mediaOrder: [11, 12] });

    const result = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(result.examined, 2);
    assert.strictEqual(result.deleted, 2);
    assert.strictEqual(strapi.db['plugin::upload.file'].length, 0);
    assert.deepStrictEqual(fake.deleted.sort(), [11, 12]);
  });

  await test('cleanup leaves recent, published, referenced, and untagged files alone', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi, { protectedMedia: fakeProtectedMedia(strapi, { ready: true }) });

    stagedFile(strapi, { id: 21, sessionId: 'gd_fresh', createdAt: iso(-2 * 60 * 60 * 1000) });
    abandonedDraft(strapi, { sessionId: 'gd_fresh', mediaOrder: [21] });

    const attached = stagedFile(strapi, { id: 22, sessionId: 'gd_done', createdAt: iso(-3 * DAY_MS) });
    attached.provider_metadata.faneqoGalleryStaged = false;
    abandonedDraft(strapi, { sessionId: 'gd_done', status: 'published', mediaOrder: [22] });

    stagedFile(strapi, { id: 23, sessionId: 'gd_ref', createdAt: iso(-3 * DAY_MS) });
    strapi.db['api::artist-update.artist-update'].push({ id: 950, media: [{ id: 23 }] });
    abandonedDraft(strapi, { sessionId: 'gd_ref', mediaOrder: [23] });

    strapi.db['plugin::upload.file'].push({
      id: 24, mime: 'image/jpeg', url: 'https://cdn.example/24.jpg', createdAt: iso(-30 * DAY_MS), provider_metadata: {},
    });

    const result = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(result.deleted, 0);
    assert.strictEqual(result.skippedReferenced, 1);
    assert.deepStrictEqual(
      strapi.db['plugin::upload.file'].map((f) => f.id).sort((x, y) => x - y),
      [21, 22, 23, 24]
    );
  });

  await test('a stale active draft is discarded and swept, and repeat cleanup is safe', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi, { protectedMedia: fakeProtectedMedia(strapi, { ready: true }) });
    stagedFile(strapi, { id: 31, sessionId: 'gd_stale', createdAt: iso(-9 * DAY_MS) });
    abandonedDraft(strapi, { sessionId: 'gd_stale', status: 'active', ageMs: 9 * DAY_MS, mediaOrder: [31] });

    const first = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(first.draftsDiscarded, 1);
    assert.strictEqual(first.deleted, 1);
    const draft = strapi.db['api::gallery-draft.gallery-draft'][0];
    assert.strictEqual(draft.status, 'discarded');
    assert.deepStrictEqual(draft.mediaOrder, []);

    const second = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(second.deleted, 0);
    assert.strictEqual(second.draftsDiscarded, 0);
    assert.strictEqual(strapi.db['plugin::upload.file'].length, 0);
  });

  await test('one failing delete does not stop the rest of the sweep', async () => {
    const strapi = createMockStrapi();
    const fake = fakeProtectedMedia(strapi, { ready: true });
    const realDelete = fake.deleteMediaFile;
    fake.deleteMediaFile = async (file) => {
      if (Number(file.id) === 41) throw new Error('s3 unavailable');
      return realDelete(file);
    };
    const service = draftService(strapi, { protectedMedia: fake });
    stagedFile(strapi, { id: 41, sessionId: 'gd_partial', createdAt: iso(-3 * DAY_MS) });
    stagedFile(strapi, { id: 42, sessionId: 'gd_partial', createdAt: iso(-3 * DAY_MS) });
    abandonedDraft(strapi, { sessionId: 'gd_partial', mediaOrder: [41, 42] });

    const result = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(result.deleted, 1);
    assert.deepStrictEqual(strapi.db['plugin::upload.file'].map((f) => f.id), [41]);
    const retry = await service.cleanupStagedGalleryMedia();
    assert.strictEqual(retry.examined, 1, 'the failed file stays a candidate');
  });

  await test('cleanup never acts on a file tagged for a different session or uploader', () => {
    const file = {
      id: 1,
      createdAt: iso(-5 * DAY_MS),
      provider_metadata: pure.stagedMediaTags({
        sessionId: 'gd_a', bandId: BAND, uploaderUserId: USER, classification: 'public',
      }),
    };
    assert.strictEqual(pure.stagedFileOwnedBy(file, { sessionId: 'gd_a', userId: USER }), true);
    assert.strictEqual(pure.stagedFileOwnedBy(file, { sessionId: 'gd_b', userId: USER }), false);
    assert.strictEqual(pure.stagedFileOwnedBy(file, { sessionId: 'gd_a', userId: OTHER_USER }), false);
    assert.strictEqual(pure.stagedFileOwnedBy({ id: 2, provider_metadata: {} }, { sessionId: 'gd_a', userId: USER }), false);
    assert.strictEqual(pure.stagedFilePastGrace(file), true);
    assert.strictEqual(pure.stagedFilePastGrace({ ...file, createdAt: iso(-60 * 1000) }), false);
  });

  // --- naming and text bounds ---------------------------------------------

  await test('a general gallery falls back to a dated title', () => {
    assert.strictEqual(updatePure.fallbackGalleryTitle('2026-09-14T10:00:00.000Z'), 'Photos — Sep 14, 2026');
    assert.strictEqual(updatePure.fallbackGalleryTitle('2026-01-02'), 'Photos — Jan 2, 2026');
    assert.strictEqual(updatePure.fallbackGalleryTitle(null), 'Photos');
    assert.strictEqual(updatePure.fallbackGalleryTitle('nonsense'), 'Photos');
  });

  await test('title and caption bounds are enforced at publish', () => {
    assert.strictEqual(updatePure.validatePublishInput({
      mediaIds: [1], title: 'x'.repeat(updatePure.MAX_TITLE + 1),
    }).error, 'title_too_long');
    assert.strictEqual(updatePure.validatePublishInput({
      mediaIds: [1], bodyText: 'x'.repeat(updatePure.MAX_CAPTION + 1),
    }).error, 'caption_too_long');
    assert.strictEqual(updatePure.validatePublishInput({
      mediaIds: [1], title: 'x'.repeat(updatePure.MAX_TITLE),
    }).error, undefined);
    const captions = updatePure.normalizeMediaCaptions({ 1: 'x'.repeat(300) }, [1]);
    assert.strictEqual(captions.error, undefined);
    assert.strictEqual(updatePure.normalizeMediaCaptions({ 1: 'x'.repeat(301) }, [1]).error, 'media_caption_too_long');
    assert.strictEqual(updatePure.normalizeMediaCaptions({ 9: 'hi' }, [1]).error, 'foreign_media');
    assert.deepStrictEqual(updatePure.normalizeMediaCaptions({ 1: '   ' }, [1]).captions, {});
    assert.deepStrictEqual(
      updatePure.normalizeMediaCaptions({ 1: 'keep', 9: 'stale' }, [1], { dropUnknown: true }).captions,
      { 1: 'keep' }
    );
  });

  await test('parallel uploads keep every photo in mediaOrder', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const [a, b] = await Promise.all([
      service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() }),
      service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() }),
    ]);
    assert.ok(!a.error, a.message);
    assert.ok(!b.error, b.message);
    const draft = await service.getDraft({ userId: USER, sessionId: data.sessionId });
    assert.deepStrictEqual(
      new Set(draft.data.mediaOrder),
      new Set([a.data.mediaId, b.data.mediaId]),
      'last-write-wins must not drop a photo that already uploaded'
    );
  });

  await test('a leftover caption for a removed photo does not block publish', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    const mine = (await service.uploadDraftMedia({
      userId: USER, sessionId: data.sessionId, file: jpegFile(),
    })).data.mediaId;
    const patched = await service.patchDraft({
      userId: USER,
      sessionId: data.sessionId,
      mediaCaptions: { [mine]: 'Front row', 99999: 'Not in this gallery' },
    });
    assert.ok(!patched.error, patched.message);
    assert.strictEqual(patched.data.mediaCaptions[String(mine)], 'Front row');
    assert.strictEqual(patched.data.mediaCaptions['99999'], undefined);

    const row = strapi.db['api::gallery-draft.gallery-draft'].find((item) => item.sessionId === data.sessionId);
    row.mediaCaptions = { [String(mine)]: 'Front row', 99999: 'ghost' };
    const published = await service.publishDraft({ userId: USER, sessionId: data.sessionId });
    assert.ok(!published.error, published.message);
    assert.strictEqual(published.data.photoCount, 1);
  });

  await test('appendMediaId never drops an id already in the order', () => {
    assert.deepStrictEqual(pure.appendMediaId([], 4), [4]);
    assert.deepStrictEqual(pure.appendMediaId([4], 7), [4, 7]);
    assert.deepStrictEqual(pure.appendMediaId([4, 7], 4), [4, 7]);
    assert.deepStrictEqual(pure.appendMediaId(['4', 7], '8'), [4, 7, 8]);
  });

  await test('slug collisions get a suffix and stay band-scoped', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const slugs = [];
    for (let i = 0; i < 3; i += 1) {
      const { data } = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
      await service.uploadDraftMedia({ userId: USER, sessionId: data.sessionId, file: jpegFile() });
      await service.patchDraft({ userId: USER, sessionId: data.sessionId, title: 'Nashville' });
      const published = await service.publishDraft({ userId: USER, sessionId: data.sessionId });
      assert.ok(!published.error, published.message);
      slugs.push(published.data.slug);
    }
    assert.strictEqual(new Set(slugs).size, 3, 'every gallery keeps a distinct canonical slug');
    assert.strictEqual(slugs[0], 'nashville');
    assert.strictEqual(slugs[1], 'nashville-2');
  });

  await test('the first public gallery shows on an empty artist page unless the artist opts out', async () => {
    const strapi = createMockStrapi();
    const service = draftService(strapi);
    const band = () => strapi.db['api::band.band'].find((row) => row.id === BAND);

    const first = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    await service.uploadDraftMedia({ userId: USER, sessionId: first.data.sessionId, file: jpegFile() });
    const off = await service.publishDraft({
      userId: USER,
      sessionId: first.data.sessionId,
      showOnArtistPage: false,
    });
    assert.ok(!off.error, off.message);
    assert.strictEqual(off.data.featuredOnProfile, false);
    assert.strictEqual(band().featuredGallery == null, true);

    const second = await service.createDraft({ userId: USER, bandId: BAND, kind: 'show' });
    await service.uploadDraftMedia({ userId: USER, sessionId: second.data.sessionId, file: jpegFile() });
    const shown = await service.publishDraft({
      userId: USER,
      sessionId: second.data.sessionId,
      showOnArtistPage: true,
    });
    assert.strictEqual(shown.data.featuredOnProfile, true);
    assert.strictEqual(Number(band().featuredGallery), Number(shown.data.id));

    const third = await service.createDraft({ userId: USER, bandId: BAND, kind: 'general' });
    await service.uploadDraftMedia({ userId: USER, sessionId: third.data.sessionId, file: jpegFile() });
    const kept = await service.publishDraft({ userId: USER, sessionId: third.data.sessionId });
    assert.strictEqual(kept.data.featuredOnProfile, false);
    assert.strictEqual(kept.data.keptFeaturedTitle.length > 0, true);
    assert.strictEqual(Number(band().featuredGallery), Number(shown.data.id));
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})();
