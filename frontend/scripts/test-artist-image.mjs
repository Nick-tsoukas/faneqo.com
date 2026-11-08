/**
 * Artist image helper tests.
 * Run: node scripts/test-artist-image.mjs
 */
import assert from 'node:assert/strict'
import {
  ARTIST_IMAGE_AUTO_COVER_RATIO,
  CANONICAL_ARTIST_IMAGE_FIT,
  CYBERED_HERO_PREVIEW_FIT,
  createImageFitLayoutPatch,
  getArtistFocalStyle,
  getArtistHeroTransformStyle,
  getCyberedHeroPhotoStyle,
  getArtistImageFitMode,
  getArtistImageRatio,
  getArtistImageShapeHint,
  getBestArtistImageSource,
  clampArtistFocalPercent,
  clampArtistZoom,
  getDefaultArtistImagePresentation,
  hasManualCyberedFraming,
  nextArtistFocalFromPointerDelta,
  normalizeArtistImageFitMode,
  presentationForReplacedArtistImage,
  resolveArtistImageFit,
  resolveArtistImagePresentation,
  readArtistImageFraming,
  readBandArtistImageContract,
  unwrapBandImage,
  validateArtistProfileImageFile,
} from '../utils/media/artistImage.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('normalizes unknown fit modes to auto', () => {
  assert.equal(normalizeArtistImageFitMode(null), 'auto')
  assert.equal(normalizeArtistImageFitMode('FILL'), 'fill')
  assert.equal(normalizeArtistImageFitMode('contain'), 'auto')
  assert.equal(getArtistImageFitMode({ imageFit: 'full' }), 'full')
  assert.equal(getArtistImageFitMode(null), 'auto')
})

test('AUTO landscape uses fill and square/portrait use full', () => {
  const landscape = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 2047, height: 1151 },
  })
  assert.equal(landscape.resolved, 'fill')
  assert.equal(landscape.reason, 'landscape_cover')
  assert.ok(landscape.ratio > ARTIST_IMAGE_AUTO_COVER_RATIO)

  const square = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 1300, height: 1300 },
  })
  assert.equal(square.resolved, 'full')

  const portrait = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 1000, height: 1333 },
  })
  assert.equal(portrait.resolved, 'full')

  const fourByThree = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 1600, height: 1200 },
  })
  assert.equal(fourByThree.resolved, 'fill')
})

test('known Faneqo regression assets follow the heuristic', () => {
  const cases = [
    ['Moon Dough', 2047, 1151, 'fill'],
    ['Emerge', 1300, 1300, 'full'],
    ['Andy Darling', 1000, 1333, 'full'],
    ['Shannon Tehya', 800, 1000, 'full'],
    ['Badflower', 4096, 6144, 'full'],
    ['BurningThunder', 1500, 1455, 'full'],
  ]
  for (const [name, width, height, expected] of cases) {
    const result = resolveArtistImageFit({
      fitMode: 'auto',
      image: { width, height },
    })
    assert.equal(result.resolved, expected, `${name} should resolve ${expected}`)
  }
})

test('live white-glove framing stays cover even for portraits', () => {
  const shannon = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 800, height: 1000 },
    positionX: 44,
    positionY: 9,
    zoom: 1,
  })
  assert.equal(shannon.resolved, 'fill')
  assert.equal(shannon.reason, 'legacy_manual_framing')

  const burning = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 1500, height: 1455 },
    positionX: 50,
    positionY: 50,
    zoom: 1,
  })
  assert.equal(burning.resolved, 'full')
})

test('legacy manual Cybered framing preserves cover in AUTO', () => {
  const framed = resolveArtistImageFit({
    fitMode: 'auto',
    image: { width: 800, height: 1000 },
    positionX: 38,
    positionY: 22,
    zoom: 1.25,
  })
  assert.equal(framed.resolved, 'fill')
  assert.equal(framed.reason, 'legacy_manual_framing')
  assert.equal(hasManualCyberedFraming({ positionX: 50, positionY: 50, zoom: 1 }), false)
  assert.equal(hasManualCyberedFraming({ positionX: 50, positionY: 50, zoom: 1.2 }), true)
  assert.equal(hasManualCyberedFraming({ positionX: null, positionY: '', zoom: undefined }), false)
})

test('unknown dimensions keep current cover behavior', () => {
  const result = resolveArtistImageFit({ fitMode: 'auto', image: { url: '/x.jpg' } })
  assert.equal(result.resolved, 'fill')
  assert.equal(result.reason, 'unknown_ratio_preserve_cover')
})

test('artist override wins over AUTO', () => {
  const fill = resolveArtistImageFit({
    fitMode: 'fill',
    image: { width: 800, height: 1000 },
  })
  assert.equal(fill.resolved, 'fill')
  assert.equal(fill.reason, 'artist_override')

  const full = resolveArtistImageFit({
    fitMode: 'full',
    image: { width: 2047, height: 1151 },
  })
  assert.equal(full.resolved, 'full')
})

test('legacy default template stays cover', () => {
  assert.equal(
    resolveArtistImageFit({
      fitMode: 'auto',
      image: { width: 800, height: 1000 },
      surface: 'default',
    }).resolved,
    'fill'
  )
})

test('cards stay cover and bold stays contain', () => {
  assert.equal(
    resolveArtistImageFit({
      fitMode: 'auto',
      image: { width: 800, height: 1000 },
      surface: 'squareCard',
    }).resolved,
    'fill'
  )
  assert.equal(
    resolveArtistImageFit({
      fitMode: 'fill',
      image: { width: 2047, height: 1151 },
      surface: 'bold',
    }).resolved,
    'full'
  )
})

test('pointer delta pans the focal point and clamps to 0–100', () => {
  const moved = nextArtistFocalFromPointerDelta({
    startX: 50,
    startY: 50,
    deltaX: 20,
    deltaY: -10,
    frameWidth: 200,
    frameHeight: 200,
    zoom: 1,
  })
  assert.equal(moved.x, 40)
  assert.equal(moved.y, 55)

  const clamped = nextArtistFocalFromPointerDelta({
    startX: 2,
    startY: 98,
    deltaX: 400,
    deltaY: -400,
    frameWidth: 100,
    frameHeight: 100,
    zoom: 1,
  })
  assert.equal(clamped.x, 0)
  assert.equal(clamped.y, 100)
  assert.equal(clampArtistFocalPercent(-12), 0)
  assert.equal(clampArtistFocalPercent(140), 100)
  assert.equal(clampArtistZoom(0.5), 1)
  assert.equal(clampArtistZoom(3), 2)
})

test('Cybered public and editor photo style stay identical', () => {
  assert.deepEqual(
    getCyberedHeroPhotoStyle({ positionX: 48, positionY: 22, zoom: 1.06 }),
    {
      objectPosition: '48% 22%',
      transform: 'scale(1.06)',
      transformOrigin: '48% 22%',
    },
  )
  assert.deepEqual(
    getCyberedHeroPhotoStyle({}),
    {
      objectPosition: '50% 50%',
      transform: 'scale(1)',
      transformOrigin: '50% 50%',
    },
  )
})

test('focal style maps Cybered X/Y and zoom stays surface-specific', () => {
  assert.deepEqual(getArtistFocalStyle({ positionX: 32, positionY: 70 }), {
    objectPosition: '32% 70%',
  })
  const card = getArtistHeroTransformStyle({
    positionX: 32,
    positionY: 70,
    zoom: 1.8,
    applyZoom: false,
  })
  assert.deepEqual(card, { objectPosition: '32% 70%' })
  assert.equal(card.transform, undefined)

  const hero = getArtistHeroTransformStyle({
    positionX: 32,
    positionY: 70,
    zoom: 1.8,
    applyZoom: true,
  })
  assert.equal(hero.transform, 'scale(1.8)')
  assert.equal(hero.transformOrigin, '32% 70%')
})

test('source selection prefers responsive formats and avoids huge originals in srcset', () => {
  const image = {
    url: 'https://cdn.example/original.jpg',
    width: 4096,
    height: 6144,
    formats: {
      thumbnail: { url: 'https://cdn.example/thumb.jpg', width: 156 },
      small: { url: 'https://cdn.example/small.jpg', width: 500 },
      medium: { url: 'https://cdn.example/medium.jpg', width: 750 },
      large: { url: 'https://cdn.example/large.jpg', width: 1000 },
    },
  }
  const hero = getBestArtistImageSource(image, 'hero')
  assert.equal(hero.src, 'https://cdn.example/large.jpg')
  assert.equal(hero.usedOriginal, false)
  assert.equal(hero.srcset.includes('original.jpg'), false)
  assert.equal(hero.srcset.includes('large.jpg'), true)

  const card = getBestArtistImageSource(image, 'card')
  assert.equal(card.src, 'https://cdn.example/medium.jpg')

  const thumb = getBestArtistImageSource(image, 'thumb')
  assert.equal(thumb.src, 'https://cdn.example/thumb.jpg')
})

test('falls back to original when formats are missing', () => {
  const source = getBestArtistImageSource({
    url: 'https://cdn.example/only.jpg',
    width: 4096,
    height: 6144,
  }, 'hero')
  assert.equal(source.src, 'https://cdn.example/only.jpg')
  assert.equal(source.usedOriginal, true)
})

test('unwraps Strapi media shapes', () => {
  const nested = unwrapBandImage({
    data: { id: 9, attributes: { url: '/uploads/a.jpg', width: 800, height: 600 } },
  })
  assert.equal(nested.url, '/uploads/a.jpg')
  assert.equal(nested.width, 800)
  assert.equal(getArtistImageRatio(nested), 800 / 600)
})

test('layoutConfig imageFit patch does not wipe sections and skips auto-only writes', () => {
  assert.equal(createImageFitLayoutPatch(null, 'auto'), null)
  assert.deepEqual(createImageFitLayoutPatch(null, 'full'), {
    version: 1,
    imageFit: 'full',
  })

  const existing = {
    version: 1,
    sections: [{ id: 'audio', enabled: false }],
    buttons: { streaming: ['spotify'] },
  }
  const patched = createImageFitLayoutPatch(existing, 'fill')
  assert.equal(patched.imageFit, 'fill')
  assert.deepEqual(patched.sections, existing.sections)
  assert.deepEqual(patched.buttons, existing.buttons)
})

test('upload validation matches the 10MB JPEG/PNG/WebP copy', () => {
  assert.equal(validateArtistProfileImageFile({ type: 'application/pdf', size: 10 }).error, 'invalid_type')
  assert.equal(validateArtistProfileImageFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 }).error, 'too_large')
  assert.equal(validateArtistProfileImageFile({ type: 'image/webp', size: 100 }).error, null)
})

test('shape hints stay non-technical', () => {
  assert.match(getArtistImageShapeHint(1.78), /Landscape/)
  assert.match(getArtistImageShapeHint(1), /Square/)
  assert.match(getArtistImageShapeHint(0.75), /Portrait/)
})

test('new uploads use one canonical presentation and reset stale framing', () => {
  const fresh = getDefaultArtistImagePresentation()
  const replaced = presentationForReplacedArtistImage()
  assert.equal(CANONICAL_ARTIST_IMAGE_FIT, 'auto')
  assert.equal(CYBERED_HERO_PREVIEW_FIT, 'fill')
  assert.deepEqual(fresh, {
    fitMode: 'auto',
    positionX: 50,
    positionY: 50,
    zoom: 1,
  })
  assert.deepEqual(replaced, fresh)
})

test('legacy explicit fill and full still resolve as artist overrides', () => {
  assert.equal(
    resolveArtistImageFit({
      fitMode: 'fill',
      image: { width: 800, height: 1000 },
    }).resolved,
    'fill'
  )
  assert.equal(
    resolveArtistImageFit({
      fitMode: 'full',
      image: { width: 2047, height: 1151 },
    }).resolved,
    'full'
  )
})

test('Recap/share presentation reuses Cybered focal and imageFit', () => {
  const left = resolveArtistImagePresentation({
    imageFit: 'fill',
    focalX: 18,
    focalY: 22,
    image: { width: 1600, height: 900 },
    context: 'hero-desktop',
  })
  assert.equal(left.objectFit, 'cover')
  assert.equal(left.objectPosition, '18% 22%')

  const autoWide = resolveArtistImagePresentation({
    imageFit: 'auto',
    image: { width: 1600, height: 900 },
    context: 'hero-desktop',
  })
  assert.equal(autoWide.objectFit, 'contain')
  assert.equal(autoWide.ambient, true)
  assert.equal(autoWide.objectPosition, '50% 50%')

  const draggedWide = resolveArtistImagePresentation({
    imageFit: 'auto',
    focalX: 50,
    focalY: 22,
    image: { width: 1600, height: 900 },
    context: 'hero-desktop',
  })
  assert.equal(draggedWide.objectFit, 'cover')
  assert.equal(draggedWide.objectPosition, '50% 22%')

  const mobileWide = resolveArtistImagePresentation({
    imageFit: 'auto',
    image: { width: 1600, height: 900 },
    context: 'hero-mobile',
  })
  assert.equal(mobileWide.objectFit, 'contain')
  assert.equal(mobileWide.ambient, true)

  const portrait = resolveArtistImagePresentation({
    imageFit: 'auto',
    image: { width: 800, height: 1200 },
    context: 'hero-mobile',
  })
  assert.equal(portrait.objectFit, 'contain')
  assert.equal(portrait.objectPosition, '50% 50%')
  assert.equal(portrait.ambient, true)

  const share = resolveArtistImagePresentation({
    imageFit: 'fill',
    focalX: 18,
    focalY: 22,
    context: 'share',
  })
  assert.equal(share.objectFit, 'contain')
  assert.equal(share.ambient, true)

  const poster = resolveArtistImagePresentation({ context: 'poster' })
  assert.equal(poster.objectFit, 'contain')

  const framing = readArtistImageFraming({
    layoutConfig: { imageFit: 'full' },
    cyberedImagePositionX: 82,
    cyberedImagePositionY: 20,
    bandImg: { url: '/a.jpg', width: 1600, height: 900 },
  })
  assert.equal(framing.imageFit, 'full')
  assert.equal(framing.focalX, 82)
  assert.equal(framing.image.url, '/a.jpg')

  const contract = readBandArtistImageContract({
    data: {
      id: 9,
      name: 'The Rockers',
      genre: 'rock',
      bio: 'Loud',
      layoutConfig: { imageFit: 'fill' },
      cyberedImagePositionX: 18,
      cyberedImagePositionY: 22,
      bandImg: { url: '/b.jpg', width: 1600, height: 900 },
    },
  })
  assert.equal(contract.id, 9)
  assert.equal(contract.genre, 'rock')
  assert.equal(contract.focalY, 22)
  assert.equal(contract.image.url, '/b.jpg')
})

test('replacing an image writes auto onto existing layoutConfig without dropping sections', () => {
  const existing = {
    version: 1,
    imageFit: 'full',
    sections: [{ id: 'audio', enabled: true }],
  }
  const patched = createImageFitLayoutPatch(existing, presentationForReplacedArtistImage().fitMode)
  assert.equal(patched.imageFit, 'auto')
  assert.deepEqual(patched.sections, existing.sections)
})

console.log(`\nartist-image: ${passed} tests passed`)
