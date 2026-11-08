'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const showCover = require('../src/utils/showMode/showCoverPure');

assert.strictEqual(
  showCover.durableShowEventTitle({
    bandName: 'Badflower',
    venue: 'The Basement East',
    city: 'Nashville',
    date: '2026-10-18',
    campaignId: 'sm_12345678abcd',
  }),
  'Badflower · The Basement East · 2026-10-18 · 345678abcd'
);
assert.ok(showCover.durableShowEventTitle({ campaignId: 'sm_zzzzzzzz' }).includes('Live'));
assert.deepStrictEqual(showCover.showCoverFromEvent({
  id: 11,
  image: { url: 'https://cdn.example/cover.jpg' },
}), { url: 'https://cdn.example/cover.jpg', eventId: 11, source: 'show_cover' });
assert.strictEqual(showCover.showCoverFromEvent({ id: 11 }), null);
assert.strictEqual(showCover.publicMediaUrl({ url: 'faneqo-protected://nope' }), null);

const showModeSrc = fs.readFileSync(path.join(__dirname, '../src/api/band/services/showMode.js'), 'utf8');
assert.match(showModeSrc, /createDurableShowEvent/);
assert.match(showModeSrc, /coverMediaId/);
assert.match(showModeSrc, /if \(coverMediaId\)/);

const controllerSrc = fs.readFileSync(path.join(__dirname, '../src/api/band/controllers/show-mode.js'), 'utf8');
assert.match(controllerSrc, /authorizeShowCover/);
assert.match(controllerSrc, /coverMediaId/);
assert.match(controllerSrc, /authorizePublicNightCover/);
assert.match(controllerSrc, /coverUrl/);
const nightCoverSrc = fs.readFileSync(path.join(__dirname, '../src/utils/showMode/nightCover.js'), 'utf8');
assert.match(nightCoverSrc, /isProtectedFile/);

const recapSrc = fs.readFileSync(path.join(__dirname, '../src/api/show-recap/services/show-recap.js'), 'utf8');
assert.match(recapSrc, /withShowCover/);
assert.match(recapSrc, /showCoverUrl/);

const created = [];
const updated = [];
const bands = {
  4: { id: 4, name: 'Badflower', showModeStatus: 'off', showModeEnabled: false },
  5: { id: 5, name: 'Badflower', showModeStatus: 'off', showModeEnabled: false },
};
const strapi = {
  log: { info() {}, warn() {}, error() {} },
  entityService: {
    async findOne(uid, id) {
      if (uid === 'api::band.band') return bands[Number(id)] || null;
      if (uid === 'api::event.event') {
        return created.find((row) => Number(row.id) === Number(id)) || null;
      }
      return null;
    },
    async create(uid, { data }) {
      created.push({ uid, data });
      return { id: 11, ...data };
    },
    async update(uid, id, { data }) {
      if (uid === 'api::band.band') {
        const current = bands[Number(id)] || { id };
        const next = { ...current, ...data };
        bands[Number(id)] = next;
        updated.push({ uid, id, data });
        return next;
      }
      updated.push({ uid, id, data });
      return { id, ...data };
    },
  },
};

async function run() {
  const previous = global.strapi;
  global.strapi = strapi;
  try {
    const showMode = require('../src/api/band/services/showMode');

    const noCover = await showMode.activateManualShowMode(4, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
    });
    assert.strictEqual(noCover.eventId, null);
    assert.strictEqual(created.length, 0, 'no cover does not create an Event');
    assert.strictEqual(updated[0].data.showModeEventId, null);

    const withCover = await showMode.activateManualShowMode(5, {
      title: 'Album Night',
      venue: 'The Basement East',
      city: 'Nashville',
      coverMediaId: 88,
      coverFile: { id: 88, url: 'https://cdn.example/cover.jpg' },
    });
    assert.strictEqual(created.length, 0, 'manual cover no longer creates an Event');
    assert.strictEqual(withCover.eventId, null);
    assert.strictEqual(withCover.coverMediaId, 88);
    assert.strictEqual(withCover.coverUrl, 'https://cdn.example/cover.jpg');
    assert.strictEqual(updated[updated.length - 1].data.showModeEventId, null);
    assert.strictEqual(updated[updated.length - 1].data.showModeMetadata.coverMediaId, 88);

    const recapServiceFactory = require('../src/api/show-recap/services/show-recap');
    assert.strictEqual(typeof recapServiceFactory, 'function');
  } finally {
    global.strapi = previous;
  }
}

run().then(() => {
  console.log('show mode cover tests passed');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
