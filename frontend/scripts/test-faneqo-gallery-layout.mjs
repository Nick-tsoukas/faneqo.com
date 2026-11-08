/**
 * Gallery composition rules.
 * Run: node scripts/test-faneqo-gallery-layout.mjs
 */
import assert from 'node:assert/strict'
import {
  galleryCellRole,
  galleryCellSrc,
  galleryCoverStyle,
  selectGalleryMediaSource,
  galleryEmbeddedLimit,
  galleryLayoutKind,
  galleryLayoutPlan,
  galleryOverflowCount,
  gallerySrcset,
  mediaOrientation,
  selectThreePhotoKind,
} from '../utils/media/faneqoGalleryLayout.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

function item(id, width, height, extra = {}) {
  return {
    id,
    mediaId: id,
    url: `https://cdn.example/${id}.jpg`,
    thumbnailUrl: `https://cdn.example/${id}-t.jpg`,
    width,
    height,
    aspectRatio: width / height,
    ...extra,
  }
}

test('orientation bands', () => {
  assert.equal(mediaOrientation(item('a', 800, 1600)), 'extreme-portrait')
  assert.equal(mediaOrientation(item('b', 800, 1000)), 'portrait')
  assert.equal(mediaOrientation(item('c', 800, 800)), 'square')
  assert.equal(mediaOrientation(item('d', 1600, 1000)), 'landscape')
  assert.equal(mediaOrientation(item('e', 2100, 900)), 'extreme-landscape')
  assert.equal(mediaOrientation({}), 'unknown')
})

test('1 is editorial; 2 stacks two landscapes and splits mixed/portrait', () => {
  assert.equal(galleryLayoutKind([item('a', 1600, 1000)]), 'editorial')
  assert.equal(
    galleryLayoutKind([item('a', 1600, 1000), item('b', 1200, 800)]),
    'pair-stack'
  )
  assert.equal(
    galleryLayoutKind([item('a', 800, 1000), item('b', 1600, 1000)]),
    'pair-split'
  )
  assert.equal(
    galleryLayoutKind([item('a', 800, 1200), item('b', 800, 1000)]),
    'pair-split'
  )
})

test('3 is hero-support for portrait covers and mosaic-top for landscape covers; 4 mosaic depends on cover orientation', () => {
  const threeWide = [item('a', 1600, 1000), item('b', 800, 1000), item('c', 800, 800)]
  assert.equal(galleryLayoutKind(threeWide), 'mosaic-top')
  const threePortrait = [item('a', 800, 1200), item('b', 800, 1000), item('c', 800, 800)]
  assert.equal(galleryLayoutKind(threePortrait), 'hero-support')
  const portraitCover = [item('a', 800, 1200), item('b', 800, 800), item('c', 800, 1000), item('d', 1200, 800)]
  assert.equal(galleryLayoutKind(portraitCover), 'mosaic-side')
  const landscapeCover = [item('a', 1600, 1000), item('b', 800, 800), item('c', 800, 1000), item('d', 1200, 800)]
  assert.equal(galleryLayoutKind(landscapeCover), 'mosaic-top')
})

test('5+ opening truncates embedded cells and keeps overflow math', () => {
  const sixty = Array.from({ length: 60 }, (_, i) => item(`n${i}`, 1600, 1000))
  const plan = galleryLayoutPlan(sixty)
  assert.equal(plan.kind, 'opening')
  assert.equal(plan.total, 60)
  assert.equal(plan.visible, 4)
  assert.equal(plan.overflow, 56)
  assert.equal(galleryEmbeddedLimit(60), 4)
  assert.equal(galleryOverflowCount(5), 1)
  assert.equal(galleryOverflowCount(4), 0)
})

test('editorial cover style caps extreme portrait', () => {
  const style = galleryCoverStyle(item('a', 800, 1600), 'editorial')
  assert.equal(Number(style.aspectRatio), 0.68)
})

test('hero and support prefer large/medium; thumbnail only for thumb role', () => {
  const row = item('a', 1600, 1000, {
    url: 'https://cdn.example/a-m.jpg',
    thumbnailUrl: 'https://cdn.example/a-t.jpg',
    largeUrl: 'https://cdn.example/a-l.jpg',
    formats: {
      thumbnail: { url: 'https://cdn.example/a-t.jpg', width: 104, height: 156 },
      medium: { url: 'https://cdn.example/a-m.jpg', width: 750, height: 500 },
      large: { url: 'https://cdn.example/a-l.jpg', width: 1000, height: 667 },
    },
  })
  assert.equal(galleryCellSrc(row, 'hero'), 'https://cdn.example/a-l.jpg')
  assert.equal(galleryCellSrc(row, 'support'), 'https://cdn.example/a-l.jpg')
  assert.equal(selectGalleryMediaSource(row, { role: 'thumb' }).url, 'https://cdn.example/a-t.jpg')
  assert.notEqual(galleryCellSrc(row, 'support'), row.thumbnailUrl)
  assert.equal(galleryCellRole('opening', 0), 'hero')
  assert.equal(galleryCellRole('opening', 2), 'support')
})

test('media[0] remains cover in the plan', () => {
  const list = [item('cover', 800, 1000), item('b', 1600, 1000), item('c', 800, 800)]
  const plan = galleryLayoutPlan(list)
  assert.equal(plan.coverOrientation, 'portrait')
  assert.equal(plan.kind, 'hero-support')
})

test('opening/mosaic-top cover style stays CSS-owned; lead ratio is source-aware', () => {
  assert.equal(galleryCoverStyle(item('a', 1600, 1000), 'opening'), undefined)
  assert.equal(galleryCoverStyle(item('a', 1600, 1000), 'mosaic-top'), undefined)
})

test('three-photo Fun Time Last pattern stays mosaic-top and does not reorder', () => {
  const raccoon = item('raccoon', 5472, 3648)
  const leopard = item('leopard', 5472, 3648)
  const tiger = item('tiger', 2155, 3232)
  const list = [raccoon, leopard, tiger]
  assert.equal(selectThreePhotoKind(list), 'mosaic-top')
  assert.equal(galleryLayoutKind(list), 'mosaic-top')
  assert.equal(galleryLayoutPlan(list).coverOrientation, 'landscape')
})

test('public srcset includes medium/large/original and protected srcset is empty', () => {
  const row = item('a', 2155, 3232, {
    url: 'https://cdn.example/a-m.jpg',
    largeUrl: 'https://cdn.example/a-l.jpg',
    originalUrl: 'https://cdn.example/a.jpg',
    formats: {
      medium: { url: 'https://cdn.example/a-m.jpg', width: 500, height: 750 },
      large: { url: 'https://cdn.example/a-l.jpg', width: 666, height: 1000 },
    },
  })
  const srcset = gallerySrcset(row, { role: 'support' })
  assert.match(srcset, /a-m\.jpg 500w/)
  assert.match(srcset, /a-l\.jpg 666w/)
  assert.match(srcset, /a\.jpg 2155w/)
  assert.equal(gallerySrcset({ ...row, protected: true }, { role: 'support' }), '')
})

console.log(`\n${passed} tests passed`)
