'use strict';

/**
 * Night Recordings: model, auth, visibility, providers, uploads, public-safe payload.
 * Run: node scripts/test-night-recordings.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const pure = require('../src/utils/nightRecordings/nightRecordingPure');
const { createNightRecordingService, resolveNightRecordingsForViewer } = require('../src/utils/nightRecordings/nightRecordingService');
const { createPublicShareService } = require('../src/utils/showMode/publicShareService');
const recapWrite = require('../src/utils/showMode/recapWritePure');

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

function audioFile(id, userId, extra = {}) {
  return {
    id,
    mime: extra.mime || 'audio/mpeg',
    size: extra.size ?? 1200,
    url: extra.url || `https://cdn.example/live-${id}.mp3`,
    createdBy: extra.createdBy === undefined ? userId : extra.createdBy,
    createdAt: extra.createdAt || new Date().toISOString(),
    provider_metadata: extra.provider_metadata || null,
    ...extra,
  };
}

function videoFile(id, userId, extra = {}) {
  return audioFile(id, userId, {
    mime: extra.mime || 'video/mp4',
    url: extra.url || `https://cdn.example/live-${id}.mp4`,
    ...extra,
  });
}

function posterFile(id, userId) {
  return {
    id,
    mime: 'image/jpeg',
    size: 400,
    url: `https://cdn.example/poster-${id}.jpg`,
    width: 1200,
    height: 800,
    alternativeText: 'Stage',
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
}

function recapRow({ id = 41, bandId = 7 } = {}) {
  return {
    id,
    band: { id: bandId },
    eventId: 12,
    campaignId: 'sm_manual',
    showTitle: 'Nashville',
    nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
  };
}

function makeStrapi({
  recaps = [recapRow()],
  members = [{ band: 7, user: 1, role: 'owner', status: 'active' }],
  files = {},
  recordings = [],
  fans = [],
  attendances = [],
  bands = [{ id: 7, name: 'Badflower', slug: 'badflower', users_permissions_user: { id: 1 } }],
} = {}) {
  let nextId = 100;
  const store = {
    recordings: recordings.map((row) => ({ ...row })),
  };

  function recapIdOf(row) {
    return row.showRecap?.id || row.showRecap;
  }
  function bandIdOf(row) {
    return row.band?.id || row.band;
  }

  const strapi = {
    log: { info() {}, warn() {}, error() {} },
    service() {
      return {
        async getCheckInStats() {
          return { attendanceCount: 12, newFanCheckIns: 2, knownFanCheckIns: 10 };
        },
      };
    },
    entityService: {
      async findOne(uid, id) {
        if (uid === 'api::show-recap.show-recap') {
          return recaps.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'api::band.band') {
          return bands.find((row) => Number(row.id) === Number(id)) || null;
        }
        if (uid === 'plugin::upload.file') {
          return files[Number(id)] || files[id] || null;
        }
        if (uid === 'api::night-recording.night-recording') {
          return store.recordings.find((row) => Number(row.id) === Number(id)) || null;
        }
        return null;
      },
      async findMany(uid, query = {}) {
        const filters = query.filters || {};
        if (uid === 'api::band-member.band-member') {
          return members.filter((row) => {
            if (filters.band != null && Number(row.band) !== Number(filters.band)) return false;
            if (filters.user != null && Number(row.user) !== Number(filters.user)) return false;
            if (filters.status && row.status !== filters.status) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::band.band') {
          return bands.filter((row) => {
            if (filters.slug && row.slug !== filters.slug) return false;
            if (filters.users_permissions_user != null
              && Number(row.users_permissions_user?.id) !== Number(filters.users_permissions_user)) {
              return false;
            }
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::show-recap.show-recap') {
          return recaps.filter((row) => {
            if (filters.band != null && Number(row.band?.id || row.band) !== Number(filters.band)) return false;
            if (filters.nightSlug && row.nightSlug !== filters.nightSlug) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::fan.fan') {
          return fans.filter((row) => {
            if (filters.band != null && Number(row.band) !== Number(filters.band)) return false;
            if (filters.accountUser != null && Number(row.accountUser) !== Number(filters.accountUser)) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          return attendances.filter((row) => {
            if (filters.fan != null && Number(row.fan) !== Number(filters.fan)) return false;
            return row.suppressedDuplicate !== true;
          }).slice(0, query.limit || 200);
        }
        if (uid === 'api::artist-update.artist-update') return [];
        if (uid === 'api::night-recording.night-recording') {
          return store.recordings.filter((row) => {
            if (filters.showRecap != null && Number(recapIdOf(row)) !== Number(filters.showRecap)) return false;
            if (filters.band != null && Number(bandIdOf(row)) !== Number(filters.band)) return false;
            if (filters.status && row.status !== filters.status) return false;
            if (filters.createIdempotencyKey && row.createIdempotencyKey !== filters.createIdempotencyKey) return false;
            return true;
          }).slice(0, query.limit || 50);
        }
        return [];
      },
      async create(uid, { data, populate } = {}) {
        if (uid !== 'api::night-recording.night-recording') throw new Error(`unexpected create ${uid}`);
        const row = {
          id: nextId,
          ...data,
          band: { id: data.band },
          showRecap: recaps.find((item) => Number(item.id) === Number(data.showRecap)) || { id: data.showRecap },
          createdByUser: { id: data.createdByUser },
          uploadedMedia: data.uploadedMedia ? files[Number(data.uploadedMedia)] : null,
          posterImage: data.posterImage ? files[Number(data.posterImage)] : null,
        };
        nextId += 1;
        store.recordings.push(row);
        if (populate) return row;
        return row;
      },
      async update(uid, id, { data } = {}) {
        if (uid === 'api::show-recap.show-recap') {
          const recap = recaps.find((row) => Number(row.id) === Number(id));
          if (recap) Object.assign(recap, data);
          return recap;
        }
        if (uid !== 'api::night-recording.night-recording') throw new Error(`unexpected update ${uid}`);
        const row = store.recordings.find((item) => Number(item.id) === Number(id));
        if (!row) return null;
        Object.assign(row, data);
        if (data.uploadedMedia !== undefined) {
          row.uploadedMedia = data.uploadedMedia ? files[Number(data.uploadedMedia)] : null;
        }
        if (data.posterImage !== undefined) {
          row.posterImage = data.posterImage ? files[Number(data.posterImage)] : null;
        }
        return row;
      },
      async delete(uid, id) {
        if (uid !== 'api::night-recording.night-recording') throw new Error(`unexpected delete ${uid}`);
        const idx = store.recordings.findIndex((item) => Number(item.id) === Number(id));
        if (idx === -1) return null;
        const [removed] = store.recordings.splice(idx, 1);
        return removed;
      },
    },
  };
  strapi._store = store;
  return strapi;
}

(async () => {
  console.log('\n=== Night Recordings ===\n');

  await test('YouTube URL normalizes to canonical watch URL', () => {
    const parsed = pure.parseYoutubeProvider('https://youtu.be/dQw4w9WgXcQ');
    assert.strictEqual(parsed.providerResourceId, 'dQw4w9WgXcQ');
    assert.strictEqual(parsed.providerUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(parsed.providerResourceType, 'video');
  });

  await test('invalid YouTube is rejected', () => {
    const parsed = pure.parseYoutubeProvider('https://example.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(parsed.error, 'invalid_youtube_url');
    const short = pure.parseYoutubeProvider('https://youtu.be/nope');
    assert.strictEqual(short.error, 'invalid_youtube_url');
  });

  await test('Spotify track/album/playlist normalize; episode rejected', () => {
    const track = pure.parseSpotifyProvider('https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp');
    assert.strictEqual(track.providerResourceType, 'track');
    const album = pure.parseSpotifyProvider('spotify:album:1DFixLWuPkv3KT3TnV35m3');
    assert.strictEqual(album.providerResourceType, 'album');
    const playlist = pure.parseSpotifyProvider('https://open.spotify.com/intl-en/playlist/37i9dQZF1DXcBWIGoYBM5M');
    assert.strictEqual(playlist.providerResourceType, 'playlist');
    const episode = pure.parseSpotifyProvider('https://open.spotify.com/episode/3n3Ppam7vgaVa1iaRUc9Lp');
    assert.strictEqual(episode.error, 'invalid_spotify_url');
  });

  await test('kind/source combinations reject nonsense', () => {
    const ytAudio = pure.validateRecordingInput({
      kind: 'audio',
      source: 'youtube',
      providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    });
    assert.strictEqual(ytAudio.error, 'invalid_kind_source');
    const spVideo = pure.validateRecordingInput({
      kind: 'video',
      source: 'spotify',
      providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
    });
    assert.strictEqual(spVideo.error, 'invalid_kind_source');
  });

  await test('external https is stored; embed HTML and YouTube-as-external rejected', () => {
    const ok = pure.parseExternalProvider('https://example.com/set/live');
    assert.strictEqual(ok.providerType, 'external');
    const embed = pure.parseExternalProvider('<iframe src="https://example.com"></iframe>');
    assert.strictEqual(embed.error, 'invalid_external_url');
    const yt = pure.parseExternalProvider('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(yt.error, 'use_youtube_source');
  });

  await test('gated upload cannot publish; provider gated publish is allowed', () => {
    assert.strictEqual(pure.canPublishGatedUpload({
      source: 'upload', visibility: 'show_attendees', status: 'published',
    }), false);
    assert.strictEqual(pure.canPublishGatedUpload({
      source: 'upload', visibility: 'show_attendees', status: 'draft',
    }), true);
    assert.strictEqual(pure.canPublishGatedUpload({
      source: 'youtube', visibility: 'fan_list', status: 'published',
    }), true);
  });

  await test('public recording is visible anonymously; _vid never grants fan_list', () => {
    const pub = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'public' },
      viewer: {},
    });
    assert.strictEqual(pub.allowed, true);
    const denied = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'fan_list' },
      viewer: {},
      visitorClaim: 'vid_abc',
    });
    assert.strictEqual(denied.allowed, false);
    assert.strictEqual(denied.reason, 'fan_list');
  });

  await test('fan_list and show_attendees honor server viewer truth', () => {
    const fan = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'fan_list' },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' } },
    });
    assert.strictEqual(fan.allowed, true);
    const removed = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'fan_list' },
      viewer: { userId: 9, fan: { id: 3, status: 'removed' } },
    });
    assert.strictEqual(removed.allowed, false);
    const attendee = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'show_attendees' },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attended: true },
    });
    assert.strictEqual(attendee.allowed, true);
    const outsider = pure.decideNightRecordingAccess({
      recording: { status: 'published', visibility: 'show_attendees' },
      viewer: { userId: 9, fan: { id: 3, status: 'subscribed' }, attended: false },
    });
    assert.strictEqual(outsider.allowed, false);
  });

  await test('locked public card omits provider URL, media URL, and caption', () => {
    const recording = {
      id: 5,
      title: 'Ghost (live)',
      caption: 'From the stage',
      kind: 'audio',
      source: 'upload',
      visibility: 'show_attendees',
      status: 'published',
      providerUrl: null,
      uploadedMedia: audioFile(9, 1, { url: 'https://cdn.example/secret.mp3' }),
    };
    const card = pure.publicRecordingCard(recording, {
      allowed: false, reason: 'show_attendees', teaser: true,
    });
    assert.strictEqual(card.locked, true);
    assert.strictEqual(card.caption, '');
    assert.strictEqual(card.media, null);
    assert.strictEqual(card.provider, null);
    assert.ok(!JSON.stringify(card).includes('secret.mp3'));
    assert.ok(!JSON.stringify(card).includes('From the stage'));
  });

  await test('management serializer omits provider_metadata and S3 internals', () => {
    const row = pure.managementRecording({
      id: 1,
      title: 'Live',
      kind: 'audio',
      source: 'upload',
      visibility: 'public',
      status: 'published',
      sortOrder: 0,
      uploadedMedia: {
        id: 9,
        url: 'https://cdn.example/live.mp3',
        mime: 'audio/mpeg',
        provider_metadata: { Key: 'private/key.mp3', Bucket: 'secret' },
        hash: 'abc',
      },
    });
    const json = JSON.stringify(row);
    assert.ok(!json.includes('provider_metadata'));
    assert.ok(!json.includes('Bucket'));
    assert.ok(!json.includes('"hash"'));
    assert.strictEqual(row.media.url, 'https://cdn.example/live.mp3');
  });

  await test('sort is deterministic by sortOrder then id', () => {
    const sorted = pure.sortRecordings([
      { id: 3, sortOrder: 2 },
      { id: 1, sortOrder: 2 },
      { id: 8, sortOrder: 0 },
    ]);
    assert.deepStrictEqual(sorted.map((row) => row.id), [8, 1, 3]);
  });

  await test('owner can create a YouTube recording', async () => {
    const strapi = makeStrapi();
    const service = createNightRecordingService(strapi);
    const result = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        title: 'Ghost (live)',
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://youtu.be/dQw4w9WgXcQ',
        visibility: 'public',
        status: 'published',
      },
    });
    assert.ok(!result.error, result.message);
    assert.strictEqual(result.data.kind, 'video');
    assert.strictEqual(result.data.source, 'youtube');
    assert.strictEqual(result.data.provider.resourceId, 'dQw4w9WgXcQ');
    assert.strictEqual(result.data.status, 'published');
  });

  await test('authorized manager can create; viewer and outsider cannot', async () => {
    const strapi = makeStrapi({
      members: [
        { band: 7, user: 2, role: 'manager', status: 'active' },
        { band: 7, user: 3, role: 'viewer', status: 'active' },
      ],
    });
    const service = createNightRecordingService(strapi);
    const manager = await service.createForNight({
      userId: 2,
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'spotify',
        providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
        status: 'published',
      },
    });
    assert.ok(!manager.error, manager.message);
    const viewer = await service.createForNight({
      userId: 3,
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'spotify',
        providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
      },
    });
    assert.strictEqual(viewer.status, 403);
    const anon = await service.createForNight({
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'spotify',
        providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
      },
    });
    assert.strictEqual(anon.status, 401);
  });

  await test('wrong Band manager cannot create on another Night', async () => {
    const strapi = makeStrapi({
      members: [{ band: 8, user: 9, role: 'manager', status: 'active' }],
      bands: [
        { id: 7, name: 'A', slug: 'a', users_permissions_user: { id: 1 } },
        { id: 8, name: 'B', slug: 'b', users_permissions_user: { id: 9 } },
      ],
    });
    const service = createNightRecordingService(strapi);
    const result = await service.createForNight({
      userId: 9,
      recapId: 41,
      body: {
        bandId: 8,
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });
    assert.strictEqual(result.status, 403);
    const badYt = await createNightRecordingService(makeStrapi()).createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://example.com/not-youtube',
      },
    });
    assert.strictEqual(badYt.error, 'invalid_youtube_url');
  });

  await test('valid uploaded audio attaches; invalid MIME and foreign file rejected', async () => {
    const strapi = makeStrapi({
      files: {
        21: audioFile(21, 1),
        22: audioFile(22, 1, { mime: 'application/pdf', url: 'https://cdn.example/x.pdf' }),
        23: audioFile(23, 99, { createdBy: 99 }),
      },
    });
    const service = createNightRecordingService(strapi);
    const ok = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'upload',
        uploadedMediaId: 21,
        status: 'published',
        visibility: 'public',
      },
    });
    assert.ok(!ok.error, ok.message);
    assert.strictEqual(ok.data.media.mime, 'audio/mpeg');
    const bad = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: { kind: 'audio', source: 'upload', uploadedMediaId: 22 },
    });
    assert.strictEqual(bad.error, 'invalid_attachment_type');
    const foreign = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: { kind: 'audio', source: 'upload', uploadedMediaId: 23 },
    });
    assert.strictEqual(foreign.error, 'invalid_attachment');
    const missing = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: { kind: 'audio', source: 'upload', uploadedMediaId: 404 },
    });
    assert.strictEqual(missing.error, 'invalid_attachment');
    const gated = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'upload',
        uploadedMediaId: 21,
        visibility: 'show_attendees',
        status: 'published',
      },
    });
    assert.strictEqual(gated.error, 'gated_delivery_unavailable');
    const draftGated = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'audio',
        source: 'upload',
        uploadedMediaId: 21,
        visibility: 'fan_list',
        status: 'draft',
      },
    });
    assert.ok(!draftGated.error, draftGated.message);
    assert.strictEqual(draftGated.data.status, 'draft');
  });

  await test('uploaded MP4 video is accepted; WebM is modeled later and rejected', async () => {
    const strapi = makeStrapi({
      files: {
        31: videoFile(31, 1),
        32: videoFile(32, 1, { mime: 'video/webm', url: 'https://cdn.example/x.webm' }),
      },
    });
    const service = createNightRecordingService(strapi);
    const mp4 = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: { kind: 'video', source: 'upload', uploadedMediaId: 31, status: 'published' },
    });
    assert.ok(!mp4.error, mp4.message);
    const webm = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: { kind: 'video', source: 'upload', uploadedMediaId: 32 },
    });
    assert.strictEqual(webm.error, 'invalid_attachment_type');
  });

  await test('management list is Night-scoped and ordered', async () => {
    const strapi = makeStrapi();
    const service = createNightRecordingService(strapi);
    await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        title: 'Second',
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        sortOrder: 20,
        status: 'published',
      },
    });
    await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        title: 'First',
        kind: 'audio',
        source: 'spotify',
        providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
        sortOrder: 10,
        status: 'draft',
      },
    });
    const listed = await service.listForNight({ userId: 1, recapId: 41 });
    assert.deepStrictEqual(listed.data.map((row) => row.title), ['First', 'Second']);
    assert.strictEqual(listed.data[0].status, 'draft');
  });

  await test('update title, caption, visibility, order; cannot move Night/Band', async () => {
    const strapi = makeStrapi();
    const service = createNightRecordingService(strapi);
    const created = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        title: 'Old',
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'draft',
      },
    });
    const updated = await service.update({
      userId: 1,
      recordingId: created.data.id,
      body: {
        title: 'New title',
        caption: 'From the stage',
        visibility: 'fan_list',
        sortOrder: 4,
        status: 'published',
      },
    });
    assert.strictEqual(updated.data.title, 'New title');
    assert.strictEqual(updated.data.caption, 'From the stage');
    assert.strictEqual(updated.data.visibility, 'fan_list');
    assert.strictEqual(updated.data.sortOrder, 4);
    const moved = await service.update({
      userId: 1,
      recordingId: created.data.id,
      body: { showRecapId: 99 },
    });
    assert.strictEqual(moved.error, 'immutable_night');
  });

  await test('authorized delete works; unauthorized delete fails; cross-band isolated', async () => {
    const strapi = makeStrapi({
      recaps: [recapRow(), recapRow({ id: 50, bandId: 8 })],
      members: [
        { band: 7, user: 1, role: 'owner', status: 'active' },
        { band: 8, user: 9, role: 'manager', status: 'active' },
      ],
      bands: [
        { id: 7, name: 'A', slug: 'a', users_permissions_user: { id: 1 } },
        { id: 8, name: 'B', slug: 'b', users_permissions_user: { id: 9 } },
      ],
    });
    const service = createNightRecordingService(strapi);
    const created = await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });
    const cross = await service.remove({ userId: 9, recordingId: created.data.id });
    assert.strictEqual(cross.status, 403);
    const listedOther = await service.listForNight({ userId: 9, recapId: 41 });
    assert.strictEqual(listedOther.status, 403);
    const gone = await service.remove({ userId: 1, recordingId: created.data.id });
    assert.strictEqual(gone.data.deleted, true);
    const missing = await service.detail({ userId: 1, recordingId: created.data.id });
    assert.strictEqual(missing.status, 404);
  });

  await test('create idempotency replays the same recording', async () => {
    const strapi = makeStrapi();
    const service = createNightRecordingService(strapi);
    const body = {
      kind: 'video',
      source: 'youtube',
      providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      createIdempotencyKey: 'client-key-12345',
    };
    const first = await service.createForNight({ userId: 1, recapId: 41, body });
    const second = await service.createForNight({ userId: 1, recapId: 41, body });
    assert.strictEqual(second.replayed, true);
    assert.strictEqual(second.data.id, first.data.id);
    assert.strictEqual(strapi._store.recordings.length, 1);
  });

  await test('public resolver: anonymous public, locked fan_list/attendee, drafts omitted', async () => {
    const recap = recapRow();
    const strapi = makeStrapi({
      files: { 21: audioFile(21, 1, { url: 'https://cdn.example/hidden.mp3' }) },
      recordings: [
        {
          id: 1,
          band: { id: 7 },
          showRecap: recap,
          title: 'Public live',
          caption: 'Hear the night',
          kind: 'video',
          source: 'youtube',
          providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          providerType: 'youtube',
          providerResourceType: 'video',
          providerResourceId: 'dQw4w9WgXcQ',
          visibility: 'public',
          status: 'published',
          sortOrder: 1,
        },
        {
          id: 2,
          band: { id: 7 },
          showRecap: recap,
          title: 'Attendee only',
          caption: 'Secret mix',
          kind: 'audio',
          source: 'upload',
          uploadedMedia: audioFile(21, 1, { url: 'https://cdn.example/hidden.mp3' }),
          visibility: 'show_attendees',
          status: 'published',
          sortOrder: 2,
        },
        {
          id: 3,
          band: { id: 7 },
          showRecap: recap,
          title: 'Fan list cut',
          kind: 'audio',
          source: 'spotify',
          providerUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
          providerType: 'spotify',
          providerResourceType: 'track',
          providerResourceId: '3n3Ppam7vgaVa1iaRUc9Lp',
          visibility: 'fan_list',
          status: 'published',
          sortOrder: 3,
        },
        {
          id: 4,
          band: { id: 7 },
          showRecap: recap,
          title: 'Draft',
          kind: 'video',
          source: 'youtube',
          providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          providerType: 'youtube',
          providerResourceId: 'dQw4w9WgXcQ',
          visibility: 'public',
          status: 'draft',
          sortOrder: 0,
        },
      ],
      fans: [{ id: 3, band: 7, accountUser: 9, status: 'subscribed' }],
      attendances: [
        { id: 2, fan: 3, campaignId: 'sm_manual', event: { id: 12 }, suppressedDuplicate: false },
      ],
      members: [{ band: 7, user: 1, role: 'owner', status: 'active' }],
    });

    const anon = await resolveNightRecordingsForViewer(strapi, {
      recap, bandId: 7, publishedOnly: true,
    });
    assert.strictEqual(anon.length, 3);
    assert.strictEqual(anon[0].locked, false);
    assert.strictEqual(anon[0].provider.url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    assert.strictEqual(anon[1].locked, true);
    assert.strictEqual(anon[1].lockReason, 'show_attendees');
    assert.strictEqual(anon[1].media, null);
    assert.ok(!JSON.stringify(anon).includes('hidden.mp3'));
    assert.ok(!JSON.stringify(anon).includes('Secret mix'));
    assert.strictEqual(anon[2].locked, true);
    assert.strictEqual(anon[2].lockReason, 'fan_list');
    assert.ok(!anon.some((row) => row.title === 'Draft'));

    const attendee = await resolveNightRecordingsForViewer(strapi, {
      recap, bandId: 7, userId: 9, publishedOnly: true,
    });
    const room = attendee.find((row) => row.id === 2);
    assert.strictEqual(room.locked, false);
    assert.strictEqual(room.media.url, 'https://cdn.example/hidden.mp3');
    assert.strictEqual(room.youWereThere, true);
    const fanList = attendee.find((row) => row.id === 3);
    assert.strictEqual(fanList.locked, false);

    const stranger = await resolveNightRecordingsForViewer(strapi, {
      recap, bandId: 7, userId: 44, publishedOnly: true,
    });
    assert.strictEqual(stranger.find((row) => row.id === 2).locked, true);
    assert.strictEqual(stranger.find((row) => row.id === 3).locked, true);
  });

  await test('public Night payload includes recordings: [] when none exist', async () => {
    const strapi = makeStrapi({
      recaps: [recapRow()],
      bands: [{
        id: 7,
        name: 'Badflower',
        slug: 'badflower',
        bandImg: { id: 1, url: 'https://cdn.example/band.jpg', width: 400, height: 400 },
        users_permissions_user: { id: 1 },
      }],
    });
    const result = await createPublicShareService(strapi).getPublicNight({
      bandSlug: 'badflower',
      nightSlug: 'the-basement-east-nashville-sep-5-2026-ab12cd34',
    });
    assert.ok(!result.error, result.message);
    assert.deepStrictEqual(result.data.recordings, []);
  });

  await test('Night recap metric refresh does not delete recordings', async () => {
    const recap = recapRow();
    const strapi = makeStrapi({ recaps: [recap] });
    const service = createNightRecordingService(strapi);
    await service.createForNight({
      userId: 1,
      recapId: 41,
      body: {
        kind: 'video',
        source: 'youtube',
        providerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        status: 'published',
      },
    });
    const update = recapWrite.buildRecapUpdateData({
      recapData: { fansCaptured: 99, publicStory: 'should strip', campaignId: 'sm_manual' },
      previous: recap,
    });
    await strapi.entityService.update('api::show-recap.show-recap', 41, { data: update });
    const listed = await service.listForNight({ userId: 1, recapId: 41 });
    assert.strictEqual(listed.data.length, 1);
    assert.ok(!Object.prototype.hasOwnProperty.call(update, 'nightRecordings'));
  });

  await test('ShowRecap service source does not destroy NightRecording rows', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '../src/api/show-recap/services/show-recap.js'),
      'utf8'
    );
    assert.doesNotMatch(src, /night-recording|nightRecording/);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed) process.exit(1);
})();
