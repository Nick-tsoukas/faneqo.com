/**
 * Create-screen artist page choice.
 * Run: node scripts/test-artist-page-create.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc'
import {
  ARTIST_PAGE_PUBLIC_REASON,
  ARTIST_PAGE_SUPPORT,
  artistPageCreateState,
  readArtistPageCreatePreference,
  writeArtistPageCreatePreference,
} from '../utils/galleries/artistPageCreate.js'
import { resolvePublicFeaturedGallery } from '../utils/galleries/publicFeaturedGallery.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function memoryStorage(initial = {}) {
  const data = { ...initial }
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
  }
}

test('a missing choice follows the artist page, and a stored choice wins', () => {
  const storage = memoryStorage()
  assert.equal(readArtistPageCreatePreference(storage, 's1', { hasFeatured: false }), true)
  assert.equal(readArtistPageCreatePreference(storage, 's1', { hasFeatured: true }), false)
  assert.equal(readArtistPageCreatePreference(storage, 's1', { unknown: true }), false)
  writeArtistPageCreatePreference(storage, 's1', false)
  assert.equal(readArtistPageCreatePreference(storage, 's1', { hasFeatured: false }), false)
  writeArtistPageCreatePreference(storage, 's1', true)
  assert.equal(readArtistPageCreatePreference(storage, 's1', { hasFeatured: true }), true)
  assert.equal(readArtistPageCreatePreference(storage, 'other', { hasFeatured: false }), true)
})

test('the first public gallery is on by default and an explicit off stays off', () => {
  const on = artistPageCreateState({
    loaded: true,
    preference: true,
    visibility: 'public',
  })
  assert.equal(on.pressed, true)
  assert.equal(on.shouldFeature, true)
  assert.equal(on.supporting, ARTIST_PAGE_SUPPORT)
  assert.match(on.help, /will appear on your artist page/)

  const off = artistPageCreateState({
    loaded: true,
    preference: false,
    visibility: 'public',
  })
  assert.equal(off.pressed, false)
  assert.equal(off.shouldFeature, false)
  assert.match(off.help, /will not appear/)
})

test('a gallery already on the page stays there unless the artist replaces it', () => {
  const idle = artistPageCreateState({
    loaded: true,
    hasFeatured: true,
    featuredTitle: 'Chicago',
    preference: false,
    visibility: 'public',
  })
  assert.equal(idle.shouldFeature, false)
  assert.match(idle.help, /Chicago is showing/)
  assert.match(idle.help, /replace it/)

  const replace = artistPageCreateState({
    loaded: true,
    hasFeatured: true,
    featuredTitle: 'Chicago',
    preference: true,
    visibility: 'public',
  })
  assert.equal(replace.shouldFeature, true)
  assert.match(replace.help, /replace Chicago/)
})

test('a gallery that is not for everyone cannot be featured', () => {
  for (const visibility of ['fan_list', 'show_attendees']) {
    const state = artistPageCreateState({
      loaded: true,
      preference: true,
      visibility,
      selectedVisibility: visibility,
    })
    assert.equal(state.disabled, true)
    assert.equal(state.pressed, false)
    assert.equal(state.shouldFeature, false)
    assert.equal(state.help, ARTIST_PAGE_PUBLIC_REASON)
  }
  const unsaved = artistPageCreateState({
    loaded: true,
    preference: true,
    visibility: 'public',
    selectedVisibility: 'fan_list',
  })
  assert.equal(unsaved.shouldFeature, false)
})

test('an unknown lookup cannot replace a gallery, and a layout that cannot show one does not promise it', () => {
  const unknown = artistPageCreateState({
    loaded: true,
    unknown: true,
    preference: false,
    visibility: 'public',
  })
  assert.equal(unknown.shouldFeature, false)
  const chosen = artistPageCreateState({
    loaded: true,
    unknown: true,
    preference: true,
    visibility: 'public',
  })
  assert.equal(chosen.shouldFeature, true)
  assert.match(chosen.help, /replaces one if it is already showing/)
  const hidden = artistPageCreateState({
    loaded: true,
    displaysOnArtistPage: false,
    preference: true,
    visibility: 'public',
  })
  assert.equal(hidden.disabled, true)
  assert.equal(hidden.shouldFeature, false)
  assert.match(hidden.help, /can’t show a gallery/)
})

test('publish and the success screen tell the truth about the artist page', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  const page = read('pages/galleries/new.vue')
  const reveal = read('components/galleries/GalleryPublishReveal.vue')
  assert.match(composer, /Show on artist page/)
  assert.match(composer, /artistPageState\.supporting/)
  assert.match(composer, /showOnArtistPage: artistPageState\.value\.shouldFeature/)
  assert.match(composer, /artistPageReady\.value/)
  assert.match(reveal, /Your gallery is live and showing on your artist page\./)
  assert.match(reveal, /Your gallery is published\./)
  assert.match(reveal, /View artist page/)
  assert.match(reveal, /View gallery/)
  assert.match(reveal, /featureError \? 'Try again' : 'Show on artist page'/)
  assert.match(page, /audienceName\(published\.visibility\)/)
  assert.match(page, /GalleryPublishReveal/)
  assert.doesNotMatch(page, /Show attendees/)
  assert.doesNotMatch(reveal, /Show attendees/)
})

test('compact and bold artist pages render the same public gallery as the main layout', () => {
  assert.equal(resolvePublicFeaturedGallery(null), null)
  assert.equal(resolvePublicFeaturedGallery({ photos: [] }), null)
  const gallery = resolvePublicFeaturedGallery({
    id: 4,
    title: 'Night',
    slug: 'night',
    canonicalPath: '/ada/gallery/night',
    photos: [{ id: 1, url: '/a.jpg' }, { id: 2 }],
  })
  assert.equal(gallery.photoCount, 1)
  assert.equal(gallery.canonicalPath, '/ada/gallery/night')
  for (const rel of ['components/band/BandPageCompact.vue', 'components/band/BandPageBold.vue']) {
    const source = read(rel)
    assert.match(source, /resolvePublicFeaturedGallery/)
    assert.match(source, /<ArtistFeaturedGallery/)
  }
})

test('the create, archive, edit, and artist pages still compile', () => {
  for (const rel of [
    'components/updates/ArtistUpdateComposer.vue',
    'pages/galleries/new.vue',
    'pages/galleries/[id]/edit.vue',
    'components/galleries/FaneqoGalleryArchive.vue',
    'components/galleries/FaneqoGalleryArchiveItem.vue',
    'components/band/BandPageCompact.vue',
    'components/band/BandPageBold.vue',
    'components/band/BandPageCybered.vue',
    'components/galleries/GalleryPublishReveal.vue',
  ]) {
    const source = read(rel)
    const { descriptor, errors } = parse(source, { filename: rel })
    assert.deepEqual(errors, [], rel)
    if (descriptor.scriptSetup || descriptor.script) {
      compileScript(descriptor, { id: rel, filename: rel })
    }
    if (descriptor.template) {
      const template = compileTemplate({
        source: descriptor.template.content,
        filename: rel,
        id: rel,
      })
      assert.deepEqual(template.errors, [], rel)
    }
  }
})

console.log(`\n${passed} artist page create checks passed`)
