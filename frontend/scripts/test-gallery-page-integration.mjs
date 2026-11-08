/**
 * Gallery Page integration: real public payload → stack + Living Gallery.
 * Run: node scripts/test-gallery-page-integration.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { publicPayloadToExperience, mediaItemToMemory } from '../features/gallery-experience/core/publicGalleryToExperience.js'
import { normalizeDoorwayContext } from '../features/gallery-experience/memory-system/galleryDoorway.js'
import { deckHasStack, deckLayers } from '../features/gallery-experience/memory-system/memoryDeck.js'
import { manageGalleryLocation, readGalleryOpenIntent } from '../utils/galleries/stackOpenNavigation.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const prints = [
  { id: 'a', url: '/labs/gallery-experience/memory-a.jpg', thumbnailUrl: '/t-a.jpg', largeUrl: '/l-a.jpg', width: 1600, height: 900, alt: 'Stage' },
  { id: 'b', url: '/labs/gallery-experience/memory-b.jpg', thumbnailUrl: '/t-b.jpg', largeUrl: '/l-b.jpg', width: 900, height: 1350, alt: 'Portrait' },
  { id: 'c', url: '/labs/gallery-experience/memory-c.jpg', width: 1200, height: 1200, alt: 'Square', unavailable: true },
]

test('show-linked Gallery Page context uses real Night fields only', () => {
  const exp = publicPayloadToExperience({
    artist: { name: 'BADFLOWER' },
    night: { venue: 'The Basement East', city: 'Nashville', region: 'TN', date: '2026-10-18', nightSlug: 'basement' },
    gallery: { slug: 'basement-east', title: 'The Basement East', caption: '', media: prints },
  })
  const ctx = normalizeDoorwayContext(exp.night, exp.memories)
  assert.equal(ctx.artist, 'BADFLOWER')
  assert.equal(ctx.collection, 'The Basement East')
  assert.match(ctx.place, /Nashville/)
  assert.match(ctx.place, /October/)
  assert.equal(ctx.count, 2)
  assert.equal(ctx.countLabel, '2 photographs')
  assert.equal(ctx.showLinked, true)
})

test('general Gallery Page never fabricates venue or date', () => {
  const exp = publicPayloadToExperience({
    artist: { name: 'BADFLOWER' },
    night: null,
    gallery: {
      slug: 'portraits',
      title: 'Summer Tour Portraits',
      caption: 'Faces from the bus.',
      media: prints.slice(0, 1),
    },
  })
  const ctx = normalizeDoorwayContext(exp.night, exp.memories)
  assert.equal(ctx.collection, 'Summer Tour Portraits')
  assert.equal(ctx.place, '')
  assert.equal(ctx.venue, '')
  assert.equal(ctx.caption, 'Faces from the bus.')
  assert.equal(ctx.showLinked, false)
  assert.equal(deckHasStack(exp.memories.length), false)
})

test('one photograph is a singular object; collections still swipe without rear cards', () => {
  const one = publicPayloadToExperience({
    gallery: { media: prints.slice(0, 1) },
  })
  assert.equal(deckLayers(one.memories, 0).length, 1)
  const two = publicPayloadToExperience({
    gallery: { media: prints.slice(0, 2) },
  })
  assert.equal(deckHasStack(two.memories.length), true)
  assert.equal(deckLayers(two.memories, 0).length, 1)
})

test('unavailable media is dropped; protected src is still the issued URL', () => {
  const memory = mediaItemToMemory(prints[0], 0)
  assert.equal(memory.id, 'a')
  assert.ok(memory.src.includes('memory-a') || memory.src.includes('/l-a'))
  assert.equal(mediaItemToMemory(prints[2], 2), null)
  const exp = publicPayloadToExperience({ gallery: { media: prints } })
  assert.equal(exp.memories.length, 2)
})

test('archive card still navigates to the existing Gallery route', () => {
  const location = manageGalleryLocation(
    { slug: 'live-set', id: 9, media: prints },
    'badflower',
    { index: 1, from: '/galleries' },
  )
  assert.equal(location.path, '/badflower/gallery/live-set')
  assert.equal(location.query.from, '/galleries')
  assert.equal(location.query.photo, '2')
  const intent = readGalleryOpenIntent({
    state: location.state,
    query: location.query,
    media: prints,
  })
  assert.equal(intent.index, 1)
})

test('old lightbox remains for Night / Recap / Passport, not Gallery Page', () => {
  const page = read('components/nights/PublicGalleryExperience.vue')
  const nightViewer = read('components/nights/NightGalleryViewer.vue')
  const archive = read('components/galleries/FaneqoGalleryArchive.vue')
  assert.doesNotMatch(page, /FaneqoMediaLightbox/)
  assert.match(nightViewer, /FaneqoMediaLightbox/)
  assert.match(archive, /navigateGalleryOpen/)
  assert.doesNotMatch(archive, /LivingGalleryViewer/)
})

test('Gallery Page stands its own chrome down while a photograph is open', () => {
  const page = read('components/nights/PublicGalleryExperience.vue')
  // The artist dock goes away and the artist-world bar goes inert.
  assert.match(page, /showAppNav && !viewerOpen/)
  assert.match(page, /:inert="viewerOpen \|\| undefined"/)
  // The overview reports viewer state; the page never guesses at it.
  assert.match(page, /@viewer="viewerOpen = \$event"/)
  assert.match(
    read('features/gallery-experience/canonical/GalleryOverview.vue'),
    /emit\('viewer', isOpen\)/,
  )
})

console.log(`test-gallery-page-integration: ${passed} ok`)
