'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createFanPassportService } = require('../src/utils/passport/passportService');
const pure = require('../src/utils/passport/passportPure');

assert.strictEqual(pure.gallerySaveKey(7, 41), 'passport-gallery:v1:7:41');
assert.strictEqual(pure.gallerySaveKey(null, 41), null);
assert.strictEqual(pure.gallerySharePath(41), '/fan/passport/gallery/41');
assert.strictEqual(pure.memoryPath(18), '/fan/passport/nights/18');
assert.strictEqual(pure.MAX_SAVED_GALLERIES, 60);

const schema = JSON.parse(fs.readFileSync(path.join(
  __dirname,
  '..',
  'src/api/passport-gallery-save/content-types/passport-gallery-save/schema.json'
), 'utf8'));
assert.strictEqual(schema.collectionName, 'passport_gallery_saves');
assert.strictEqual(schema.attributes.saveKey.unique, true);
assert.strictEqual(schema.attributes.artistUpdate.target, 'api::artist-update.artist-update');
assert.strictEqual(schema.attributes.media, undefined);

const serviceSrc = fs.readFileSync(path.join(__dirname, '..', 'src/utils/passport/passportService.js'), 'utf8');
assert.match(serviceSrc, /listAccessibleByIds/);
assert.match(serviceSrc, /listMemories/);
assert.match(serviceSrc, /canonicalAttendanceFilters/);
assert.match(serviceSrc, /artistUpdate: updateId/);
assert.doesNotMatch(serviceSrc, /media:\s*gallery\.media/);
// Saved galleries carry the artist's public image (never a protected file).
const updateServiceSrc = fs.readFileSync(path.join(__dirname, '..', 'src/utils/artistUpdates/artistUpdateService.js'), 'utf8');
assert.match(updateServiceSrc, /imageUrl: passportPure\.publicArtworkUrl\(row\.band\.bandImg\)/);
assert.strictEqual(pure.publicArtworkUrl({ url: 'faneqo-protected://x' }), null);
assert.doesNotMatch(serviceSrc, /_vid/);

assert.strictEqual(pure.memoryIdentityKey({ event: 11, id: 1 }), 'event:11');
assert.strictEqual(pure.memoryIdentityKey({ campaignId: 'sm_1', id: 2 }), 'campaign:sm_1');
assert.strictEqual(pure.memoryIdentityKey({ event: 11, campaignId: 'sm_1', id: 3 }), 'event:11');

const nashville = {
  id: 1,
  fan: 9,
  band: 4,
  event: 11,
  campaignId: 'sm_nashville',
  checkedInAt: '2026-10-18T02:00:00.000Z',
  showTitle: 'The Basement East',
  venue: 'The Basement East',
  city: 'Nashville',
  region: 'TN',
  showDate: '2026-10-18',
  suppressedDuplicate: false,
};
const duplicateFetch = { ...nashville, id: 99, checkedInAt: '2026-10-18T03:00:00.000Z' };
const knoxville = {
  id: 2,
  fan: 9,
  band: 4,
  campaignId: 'sm_knox',
  checkedInAt: '2026-10-20T02:00:00.000Z',
  venue: 'The Mill & Mine',
  city: 'Knoxville',
  suppressedDuplicate: false,
};
const suppressed = { ...knoxville, id: 3, suppressedDuplicate: true };

const deduped = pure.dedupeAttendancesToMemories([nashville, duplicateFetch, knoxville, suppressed]);
assert.strictEqual(deduped.length, 2, 'one memory per night, suppressed ignored');
assert.strictEqual(deduped[0].id, 2);
assert.strictEqual(deduped[1].id, 1);

assert.deepStrictEqual(pure.resolveMemoryArtwork({
  eventImageUrl: 'https://cdn.example/cover.jpg',
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: 'https://cdn.example/cover.jpg', source: 'show_cover' });
assert.deepStrictEqual(pure.resolveMemoryArtwork({
  heroUrl: 'https://cdn.example/hero.jpg',
  posterUrl: 'https://cdn.example/poster.jpg',
  eventImageUrl: 'https://cdn.example/cover.jpg',
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: 'https://cdn.example/hero.jpg', source: 'night_hero' });
assert.deepStrictEqual(pure.resolveMemoryArtwork({
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: null, source: 'fallback' });
assert.deepStrictEqual(pure.resolveMemoryArtwork({}), { url: null, source: 'fallback' });
assert.strictEqual(pure.resolveNightMedia({
  heroUrl: 'https://cdn.example/hero.jpg',
  posterUrl: 'https://cdn.example/poster.jpg',
}).hero, 'https://cdn.example/hero.jpg');

const facts = pure.relationshipFactsByArtist([knoxville, nashville], { includeOrdinals: true });
assert.strictEqual(facts.get(4).nightCount, 2);
assert.strictEqual(facts.get(4).ordinalById.get(1), 1);
assert.strictEqual(facts.get(4).ordinalById.get(2), 2);
assert.deepStrictEqual(facts.get(4).cities, ['Nashville', 'Knoxville']);
assert.strictEqual(pure.publicArtworkUrl({
  url: 'https://cdn.example/original.jpg',
  formats: { medium: { url: 'https://cdn.example/medium-crop.jpg' } },
}), 'https://cdn.example/original.jpg');
assert.strictEqual(pure.publicMediaUrl({
  url: 'https://cdn.example/original.jpg',
  formats: { medium: { url: 'https://cdn.example/medium-crop.jpg' } },
}), 'https://cdn.example/medium-crop.jpg');

assert.strictEqual(pure.galleryMatchesAttendance({ eventId: 11 }, nashville), true);
assert.strictEqual(pure.galleryMatchesAttendance({ showCampaignId: 'sm_knox' }, knoxville), true);
assert.strictEqual(pure.galleryMatchesAttendance({ eventId: 99 }, nashville), false);

const attendanceOnly = pure.serializePassportMemory({
  attendance: nashville,
  artist: { id: 4, name: 'Badflower', slug: 'badflower', imageUrl: 'https://cdn.example/artist.jpg' },
  event: null,
  recap: null,
  galleries: [],
});
assert.strictEqual(attendanceOnly.youWereThere, true);
assert.strictEqual(attendanceOnly.show.venue, 'The Basement East');
assert.strictEqual(attendanceOnly.show.city, 'Nashville');
assert.strictEqual(attendanceOnly.galleryCount, 0);
assert.strictEqual(attendanceOnly.artwork.source, 'fallback');
assert.strictEqual(attendanceOnly.artwork.url, null);
assert.strictEqual(attendanceOnly.artist.imageUrl, 'https://cdn.example/artist.jpg');
assert.doesNotMatch(JSON.stringify(attendanceOnly), /No photos|Nothing here yet/);

const enriched = pure.serializePassportMemory({
  attendance: nashville,
  artist: { id: 4, name: 'Badflower', slug: 'badflower' },
  event: { id: 11, image: { url: 'https://cdn.example/cover.jpg' } },
  galleries: [{
    id: 41,
    photoCount: 8,
    publishedAt: '2026-10-19T00:00:00.000Z',
    media: [{ thumbnailUrl: 'https://cdn.example/p1.jpg' }],
  }],
});
assert.strictEqual(enriched.id, 1);
assert.strictEqual(enriched.galleryCount, 1);
assert.strictEqual(enriched.artwork.source, 'show_cover');
assert.strictEqual(enriched.galleries[0].sharePath, '/fan/passport/gallery/41');

const attached = pure.attachGalleriesToMemories([nashville], [
  { id: 41, eventId: 11, publishedAt: '2026-10-19T00:00:00.000Z' },
  { id: 42, eventId: 11, publishedAt: '2026-10-20T00:00:00.000Z' },
  { id: 41, eventId: 11 },
  { id: 77, eventId: 99 },
]);
assert.strictEqual(attached[0].galleries.length, 2, 'multiple galleries stay on the same night');
assert.strictEqual(attached[0].galleries[0].id, 42);

function mockStrapi({ fans = [], attendances = [], bands = [], events = [], recaps = [], galleries = [] } = {}) {
  return {
    entityService: {
      async findMany(uid, query) {
        if (uid === 'api::fan.fan') return fans;
        if (uid === 'api::fan-show-attendance.fan-show-attendance') return attendances;
        if (uid === 'api::band.band') return bands;
        if (uid === 'api::event.event') return events;
        if (uid === 'api::show-recap.show-recap') return recaps;
        if (uid === 'api::artist-update.artist-update') {
          return galleries.map((gallery) => ({ id: gallery.id, publishedAt: gallery.publishedAt }));
        }
        if (uid === 'api::passport-gallery-save.passport-gallery-save') return [];
        return [];
      },
      async findOne(uid, id) {
        if (uid === 'api::fan-show-attendance.fan-show-attendance') {
          return attendances.find((row) => Number(row.id) === Number(id)) || null;
        }
        return null;
      },
    },
  };
}

async function runServiceTests() {
  const galleries = [{
    id: 41,
    eventId: 11,
    photoCount: 6,
    locked: false,
    publishedAt: '2026-10-19T00:00:00.000Z',
    media: [{ thumbnailUrl: 'https://cdn.example/p1.jpg' }],
    youWereThere: true,
  }];
  const strapi = mockStrapi({
    fans: [{ id: 9, status: 'active', band: { id: 4 } }],
    attendances: [nashville, knoxville, suppressed],
    bands: [{ id: 4, name: 'Badflower', slug: 'badflower', bandImg: { url: 'https://cdn.example/artist.jpg' } }],
    events: [{ id: 11, title: 'Nashville', image: { url: 'https://cdn.example/cover.jpg' } }],
    recaps: [{ id: 5, campaignId: 'sm_nashville', eventId: 11, showTitle: 'Nashville' }],
    galleries,
  });
  const updates = {
    async listAccessibleByIds({ userId, updateIds }) {
      assert.strictEqual(userId, 7);
      return { data: galleries.filter((gallery) => updateIds.includes(gallery.id)) };
    },
  };
  const service = createFanPassportService(strapi, { updates });
  const first = await service.listMemories({ userId: 7 });
  const second = await service.listMemories({ userId: 7 });
  assert.strictEqual(first.data.count, 2);
  assert.strictEqual(first.data.memories.length, 2);
  assert.strictEqual(JSON.stringify(first.data.memories.map((row) => row.id)), JSON.stringify(second.data.memories.map((row) => row.id)));
  const night = first.data.memories.find((row) => row.id === 1);
  assert.strictEqual(night.galleryCount, 1, 'gallery enriches the same attendance memory');
  assert.strictEqual(night.artwork.source, 'show_cover');
  assert.strictEqual(night.showOrdinal, 1);
  assert.strictEqual(night.relationship.nightCount, 2);
  assert.ok(!night.galleries[0].media || night.galleries[0].media.length <= 8);
  const later = first.data.memories.find((row) => row.id === 2);
  assert.strictEqual(later.galleryCount, 0, 'attendance-only night still appears');
  assert.strictEqual(later.youWereThere, true);
  assert.strictEqual(later.artwork.source, 'fallback');
  assert.strictEqual(later.showOrdinal, 2);

  const claimed = await service.getMemory({ userId: 7, attendanceId: 1 });
  assert.strictEqual(claimed.data.memory.id, 1);

  const stranger = mockStrapi({
    fans: [{ id: 80, status: 'active', band: { id: 4 } }],
    attendances: [nashville],
  });
  const denied = createFanPassportService(stranger, {
    updates: { async listAccessibleByIds() { return { data: [] }; } },
  });
  const other = await denied.getMemory({ userId: 99, attendanceId: 1 });
  assert.strictEqual(other.error, 'not_found');

  const unclaimed = mockStrapi({
    fans: [],
    attendances: [nashville],
  });
  const beforeClaim = createFanPassportService(unclaimed, {
    updates: { async listAccessibleByIds() { return { data: [] }; } },
  });
  const empty = await beforeClaim.listMemories({ userId: 7 });
  assert.strictEqual(empty.data.count, 0, 'unclaimed attendance stays out of Passport');

  const afterClaim = mockStrapi({
    fans: [{ id: 9, status: 'active', band: { id: 4 } }],
    attendances: [nashville],
    bands: [{ id: 4, name: 'Badflower', slug: 'badflower', bandImg: { url: 'https://cdn.example/artist.jpg' } }],
  });
  const claimedService = createFanPassportService(afterClaim, {
    updates: { async listAccessibleByIds() { return { data: [] }; } },
  });
  const revealed = await claimedService.listMemories({ userId: 7 });
  assert.strictEqual(revealed.data.count, 1, 'account claim reveals canonical attendance');
  assert.strictEqual(revealed.data.memories[0].id, 1);
}

runServiceTests().then(() => {
  console.log('fan passport gallery save + attendance memory tests passed');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
