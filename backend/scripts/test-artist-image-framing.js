'use strict';

/**
 * Band artist-image framing: validation, independence, legacy materialize.
 * Run: node scripts/test-artist-image-framing.js
 */

const assert = require('assert');
const {
  applyArtistImageFramingUpdate,
  isDesktopCropInherited,
  readEffectiveCrop,
} = require('../src/utils/band/artistImageFraming');
const { toPublicBand, PUBLIC_BAND_SCALAR_KEYS } = require('../src/utils/band/publicBandPure');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

const legacyBand = {
  cyberedImagePositionX: 44,
  cyberedImagePositionY: 21,
  cyberedImageZoom: 1.2,
};

test('missing desktop crop inherits the live phone crop', () => {
  assert.equal(isDesktopCropInherited(legacyBand), true);
  assert.deepStrictEqual(readEffectiveCrop(legacyBand, 'desktop'), {
    x: 44,
    y: 21,
    z: 1.2,
  });
});

test('bio-only updates do not touch framing', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    name: 'BADFLOWER',
    genre: 'rock',
    bio: 'Nashville',
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, false);
  assert.equal(result.data.cyberedImagePositionX, undefined);
  assert.equal(result.data.cyberedDesktopPositionX, undefined);
});

test('phone-only crop save materializes the original desktop crop', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    cyberedImagePositionX: 10,
    cyberedImagePositionY: 90,
    cyberedImageZoom: 1.5,
    cyberedMobileFit: 'fill',
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, true);
  assert.equal(result.data.cyberedImagePositionX, 10);
  assert.equal(result.data.cyberedImagePositionY, 90);
  assert.equal(result.data.cyberedImageZoom, 1.5);
  assert.equal(result.data.cyberedMobileFit, 'fill');
  assert.equal(result.data.cyberedDesktopPositionX, 44);
  assert.equal(result.data.cyberedDesktopPositionY, 21);
  assert.equal(result.data.cyberedDesktopZoom, 1.2);
});

test('phone fit-only save still materializes inherited desktop crop', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    cyberedMobileFit: 'full',
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, true);
  assert.equal(result.data.cyberedMobileFit, 'full');
  assert.equal(result.data.cyberedDesktopPositionX, 44);
  assert.equal(result.data.cyberedDesktopPositionY, 21);
  assert.equal(result.data.cyberedDesktopZoom, 1.2);
  assert.equal(result.data.cyberedImagePositionX, undefined);
});

test('desktop-only save does not write phone fields', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    cyberedDesktopPositionX: 12,
    cyberedDesktopPositionY: 88,
    cyberedDesktopZoom: 1.4,
    cyberedDesktopFit: 'full',
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, false);
  assert.equal(result.data.cyberedDesktopPositionX, 12);
  assert.equal(result.data.cyberedDesktopFit, 'full');
  assert.equal(result.data.cyberedImagePositionX, undefined);
  assert.equal(result.data.cyberedImagePositionY, undefined);
  assert.equal(result.data.cyberedImageZoom, undefined);
  assert.equal(result.data.cyberedMobileFit, undefined);
});

test('already-explicit desktop crop is preserved on a later phone save', () => {
  const existing = {
    ...legacyBand,
    cyberedDesktopPositionX: 8,
    cyberedDesktopPositionY: 92,
    cyberedDesktopZoom: 1.8,
    cyberedDesktopFit: 'fill',
  };
  const result = applyArtistImageFramingUpdate(existing, {
    cyberedImagePositionX: 3,
    cyberedImagePositionY: 97,
    cyberedImageZoom: 2,
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, false);
  assert.equal(result.data.cyberedDesktopPositionX, undefined);
  assert.equal(result.data.cyberedDesktopPositionY, undefined);
  assert.equal(result.data.cyberedDesktopZoom, undefined);
});

test('partial desktop crop writes complete the omitted siblings from the original effective crop', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    cyberedDesktopPositionX: 30,
  });
  assert.equal(result.error, null);
  assert.equal(result.data.cyberedDesktopPositionX, 30);
  assert.equal(result.data.cyberedDesktopPositionY, 21);
  assert.equal(result.data.cyberedDesktopZoom, 1.2);
});

test('explicit nulls are not coerced into defaults', () => {
  const result = applyArtistImageFramingUpdate(legacyBand, {
    cyberedDesktopFit: null,
    cyberedMobileFit: null,
    cyberedDesktopZoom: null,
  });
  assert.equal(result.error, null);
  assert.equal(result.data.cyberedDesktopFit, null);
  assert.equal(result.data.cyberedMobileFit, null);
  assert.equal(result.data.cyberedDesktopZoom, null);
  assert.equal(result.data.cyberedDesktopPositionX, 44);
  assert.equal(result.data.cyberedDesktopPositionY, 21);
});

test('rejects invalid fit, position, and zoom without rewriting the payload', () => {
  const incoming = { cyberedDesktopFit: 'auto' };
  const fit = applyArtistImageFramingUpdate(legacyBand, incoming);
  assert.match(fit.error, /fill or full/);
  assert.strictEqual(fit.data, incoming);

  const position = applyArtistImageFramingUpdate(legacyBand, { cyberedImagePositionX: 140 });
  assert.match(position.error, /between 0 and 100/);

  const zoom = applyArtistImageFramingUpdate(legacyBand, { cyberedDesktopZoom: 2.4 });
  assert.match(zoom.error, /between 1 and 2/);
});

test('materialize stores positions as whole percents and keeps zoom precision', () => {
  const odd = {
    cyberedImagePositionX: 44.2,
    cyberedImagePositionY: 21,
    cyberedImageZoom: 1.06,
  };
  const result = applyArtistImageFramingUpdate(odd, { cyberedImagePositionX: 11 });
  assert.equal(result.error, null);
  assert.equal(result.data.cyberedDesktopPositionX, 44);
  assert.equal(result.data.cyberedDesktopZoom, 1.06);
});

test('dragged fractional crop positions are stored as integers', () => {
  const result = applyArtistImageFramingUpdate({}, {
    cyberedImagePositionX: 44.2,
    cyberedImagePositionY: 10.6,
    cyberedImageZoom: 1.06,
    cyberedMobileFit: 'fill',
    cyberedDesktopPositionX: 12.4,
    cyberedDesktopPositionY: 88.5,
    cyberedDesktopZoom: 1.4,
    cyberedDesktopFit: 'fill',
  });
  assert.equal(result.error, null);
  assert.equal(result.data.cyberedImagePositionX, 44);
  assert.equal(result.data.cyberedImagePositionY, 11);
  assert.equal(result.data.cyberedDesktopPositionX, 12);
  assert.equal(result.data.cyberedDesktopPositionY, 89);
  assert.equal(result.data.cyberedImageZoom, 1.06);
});

test('public band serializer includes the new framing fields', () => {
  for (const key of [
    'cyberedDesktopPositionX',
    'cyberedDesktopPositionY',
    'cyberedDesktopZoom',
    'cyberedDesktopFit',
    'cyberedMobileFit',
  ]) {
    assert.ok(PUBLIC_BAND_SCALAR_KEYS.includes(key), key);
  }
  const payload = toPublicBand({
    id: 1,
    name: 'X',
    slug: 'x',
    cyberedImagePositionX: 50,
    cyberedDesktopPositionX: 12,
    cyberedDesktopFit: 'full',
    cyberedMobileFit: null,
  });
  assert.equal(payload.cyberedImagePositionX, 50);
  assert.equal(payload.cyberedDesktopPositionX, 12);
  assert.equal(payload.cyberedDesktopFit, 'full');
  assert.equal(payload.cyberedMobileFit, null);
});

test('create with both surfaces does not invent extra phone writes', () => {
  const result = applyArtistImageFramingUpdate({}, {
    cyberedImagePositionX: 50,
    cyberedImagePositionY: 50,
    cyberedImageZoom: 1,
    cyberedMobileFit: 'fill',
    cyberedDesktopPositionX: 50,
    cyberedDesktopPositionY: 50,
    cyberedDesktopZoom: 1,
    cyberedDesktopFit: 'fill',
  });
  assert.equal(result.error, null);
  assert.equal(result.materializedDesktop, false);
  assert.equal(result.data.cyberedDesktopFit, 'fill');
});

console.log(`\nartist-image-framing: ${passed} tests passed`);
