/**
 * Public gallery discovery.
 * Run: node scripts/test-public-gallery-discovery.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  morePublicGalleries,
  publicGalleryArchivePath,
  publicGalleryCountLabel,
} from '../utils/galleries/publicGalleryDiscovery.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function card(slug, title) {
  return {
    id: slug,
    slug,
    title,
    canonicalPath: `/ada/gallery/${slug}`,
    photoCount: 4,
    cover: { url: `/${slug}.jpg` },
  }
}

test('one public gallery does not invent more, and the current gallery is excluded', () => {
  assert.deepEqual(morePublicGalleries([card('night', 'Night')], 'night'), [])
  const more = morePublicGalleries([
    card('new', 'New'),
    card('night', 'Night'),
    card('old', 'Old'),
    card('older', 'Older'),
    card('oldest', 'Oldest'),
  ], 'night', 3)
  assert.deepEqual(more.map((row) => row.slug), ['new', 'old', 'older'])
})

test('the archive path follows the artist slug and does not invent a gallery url', () => {
  assert.equal(publicGalleryArchivePath('the-rockers'), '/the-rockers/galleries')
  assert.equal(publicGalleryArchivePath(''), '')
  assert.equal(publicGalleryArchivePath('../x'), '')
  assert.equal(publicGalleryCountLabel(1), '1 photo')
  assert.equal(publicGalleryCountLabel(12), '12 photos')
})

test('the featured count opens the canonical gallery and a photo tap still opens the viewer', () => {
  const strip = read('components/band/ArtistFeaturedGallery.vue')
  assert.match(strip, /gallery\?\.canonicalPath/)
  assert.match(strip, /Open gallery/)
  assert.match(strip, /viewer\.openAt\(index\)/)
  assert.match(strip, /class="fg__count fg__count-link"/)
  assert.match(strip, /withSafeFrom/)
  assert.doesNotMatch(strip, /VIEW GALLERY/)
})

test('the gallery page links to the artist archive and the archive only follows canonical paths', () => {
  const experience = read('components/nights/PublicGalleryExperience.vue')
  const archive = read('components/nights/PublicGalleryIndex.vue')
  const page = read('pages/[bandSlug]/galleries.vue')
  const identity = read('features/gallery-experience/canonical/GalleryIdentityBlock.vue')
  assert.match(experience, /morePublicGalleries/)
  assert.match(experience, /More from /)
  assert.match(experience, /All galleries/)
  assert.match(identity, /identity\.archivePath/)
  assert.match(identity, /All galleries/)
  assert.match(archive, /:to="item\.canonicalPath"/)
  assert.match(page, /listGalleries/)
  assert.match(archive, /No public galleries yet/)
  assert.doesNotMatch(archive, /fan_list|show_attendees|Feature on artist/)
})

console.log(`\n${passed} public gallery discovery checks passed`)
