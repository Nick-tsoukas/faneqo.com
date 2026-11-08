/**
 * G1: durable gallery viewer is reachable; legacy /updates hubs stay hidden.
 * Run: node scripts/test-gallery-viewer-route.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { galleryCellSrc } from '../utils/media/faneqoGalleryLayout.js'
import { hideArtistUpdatesRedirect } from '../utils/updates/hideArtistUpdatesPath.js'
import {
  nightStoryCountLine,
  nightStoryHasShowContext,
  nightStoryLockedCopy,
  nightStoryPlaceLine,
  nightStoryWhereParts,
  safeGalleryViewerReturn,
} from '../utils/updates/nightStoryCopy.js'
import { nightStoryPropsFromUpdate } from '../utils/updates/nightStoryPropsFromUpdate.js'
import { canonicalGalleryPath } from '../utils/passport/fanPassport.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

test('legacy /updates hubs stay hidden', () => {
  assert.equal(hideArtistUpdatesRedirect('/updates'), '/dashboard')
  assert.equal(hideArtistUpdatesRedirect('/updates/new'), '/dashboard')
  assert.equal(hideArtistUpdatesRedirect('/updates/new?recapId=41'), '/dashboard')
})

test('durable /{bandSlug}/updates/{slug} is not redirected', () => {
  assert.equal(hideArtistUpdatesRedirect('/some-band/updates/nashville-oct-18'), null)
  assert.equal(hideArtistUpdatesRedirect('/some-band/updates/nashville-oct-18?from=/galleries'), null)
})

test('unrelated paths are not hidden by this middleware', () => {
  assert.equal(hideArtistUpdatesRedirect('/galleries'), null)
  assert.equal(hideArtistUpdatesRedirect('/galleries/new'), null)
  assert.equal(hideArtistUpdatesRedirect('/fans/recaps/41'), null)
  assert.equal(hideArtistUpdatesRedirect('/dashboard'), null)
})

test('slug page no longer applies hide-artist-updates', () => {
  const page = read('pages/[bandSlug]/updates/[slug].vue')
  assert.doesNotMatch(page, /hide-artist-updates/)
  assert.match(page, /galleryPath/)
  assert.match(page, /redirectCode: 301/)
  assert.doesNotMatch(page, /localStorage/)
  assert.doesNotMatch(page, /_vid/)
  assert.equal(canonicalGalleryPath('burning-thunder', 'the-happy-room'), '/burning-thunder/gallery/the-happy-room')
})

test('legacy admin pages still apply hide-artist-updates', () => {
  assert.match(read('pages/updates/index.vue'), /hide-artist-updates/)
  assert.match(read('pages/updates/new.vue'), /hide-artist-updates/)
})

test('gallery manage View URL targets the slug route', () => {
  const helper = read('utils/galleries/archiveShelves.js')
  const page = read('pages/galleries/index.vue')
  assert.match(helper, /from=\$\{encodeURIComponent\('\/galleries'\)\}/)
  assert.match(helper, /galleryPath\(bandSlug, item\.slug\)/)
  assert.match(page, /FaneqoGalleryArchive/)
})

test('post-publish View gallery targets the slug route', () => {
  const page = read('pages/galleries/new.vue')
  assert.match(page, /\/gallery\/\$\{published\.value\.slug\}/)
  assert.match(page, /from=\$\{encodeURIComponent\(from\)\}/)
})

test('getBySlug still sends the session JWT and never invents attendance', () => {
  const composable = read('composables/useArtistUpdates.js')
  assert.match(composable, /\/api\/artist-updates\/by-slug/)
  assert.match(composable, /headers: headers\(\)/)
  assert.match(composable, /Authorization: `Bearer \$\{token\.value\}`/)
  assert.doesNotMatch(composable, /youWereThere:\s*true/)
})

test('ShowNightStory still consumes the server viewer contract', () => {
  const story = read('components/updates/ShowNightStory.vue')
  assert.match(story, /youWereThere/)
  assert.match(story, /lockReason/)
  assert.match(story, /You were there/)
  assert.match(story, /FaneqoMediaGrid/)
  assert.match(story, /FaneqoMediaLightbox/)
  assert.match(story, /nightStoryPlaceLine/)
  assert.match(story, /nightStoryCountLine/)
  assert.ok(story.indexOf('sns__caption-block') < story.indexOf('sns__media'), 'header before media')
  assert.ok(story.indexOf('sns__actions') < story.indexOf('sns__media'), 'actions before media')
  assert.match(story, /v-if="!locked"/)
  assert.match(story, /v-if="locked"/)
})

test('title and caption render; photo count is always shown', () => {
  assert.equal(nightStoryPlaceLine({ title: 'Photos from The Basement East', city: 'Nashville' }), 'Photos from The Basement East')
  assert.equal(nightStoryPlaceLine({ title: '', city: 'Chicago', venue: 'The Happy Room', hasShowContext: true }), 'The Happy Room')
  assert.equal(nightStoryPlaceLine({ title: 'Backstage in Nashville' }), 'Backstage in Nashville')
  assert.equal(nightStoryPlaceLine({}), '')
  assert.doesNotMatch(nightStoryPlaceLine({}), /This night/)
  assert.equal(nightStoryHasShowContext({ city: 'Chicago', venue: 'The Happy Room' }), true)
  assert.equal(nightStoryHasShowContext({ title: 'Backstage in Nashville' }), false)
  assert.deepEqual(nightStoryWhereParts({ title: 'Photos from The Basement East', city: 'Nashville', venue: 'The Basement East' }), ['Nashville', 'The Basement East'])
  assert.equal(nightStoryCountLine(1), '1 photo')
  assert.equal(nightStoryCountLine(12), '12 photos')
  assert.equal(nightStoryCountLine(0), '')
  const story = read('components/updates/ShowNightStory.vue')
  assert.match(story, /sns__caption/)
  assert.match(story, /!locked && caption/)
  assert.match(story, /youWereThere && isShow/)
})

test('general gallery does not invent show context', () => {
  const general = nightStoryPropsFromUpdate({
    title: 'Backstage in Nashville',
    bodyText: 'A few shots from the weekend.',
    photoCount: 6,
    visibility: 'public',
    show: null,
    youWereThere: false,
  })
  assert.equal(general.hasShowContext, false)
  assert.equal(general.city, '')
  assert.equal(general.venue, '')
  assert.equal(general.youWereThere, false)

  const show = nightStoryPropsFromUpdate({
    title: 'The Happy Room',
    visibility: 'show_attendees',
    show: { venue: 'The Happy Room', city: 'Chicago', date: '2026-09-03', eventId: 11 },
    youWereThere: true,
  })
  assert.equal(show.hasShowContext, true)
  assert.equal(show.city, 'Chicago')
  assert.equal(show.youWereThere, true)
})

test('locked teaser copy is human and not an error', () => {
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'show_attendees' }),
    'These photos are for the people who were there.',
  )
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'account_required' }),
    'These photos are for the people who were there.',
  )
  const page = read('components/nights/PublicGalleryExperience.vue')
  assert.match(page, /lockAction|Sign in/)
  assert.doesNotMatch(page, /Verify \/ create/)
})

test('back navigation prefers safe from, then artist page', () => {
  assert.equal(safeGalleryViewerReturn('/fans/recaps/41', 'some-band'), '/fans/recaps/41')
  assert.equal(safeGalleryViewerReturn('/galleries', 'some-band'), '/galleries')
  assert.equal(safeGalleryViewerReturn('https://evil.example', 'some-band'), '/some-band')
  assert.equal(safeGalleryViewerReturn('/dashboard', 'some-band'), '/dashboard')
  assert.equal(safeGalleryViewerReturn('', 'some-band'), '/some-band')
})

test('grid uses best available source; lightbox prefers large', () => {
  const item = {
    url: '/api/g',
    thumbnailUrl: '/api/t',
    largeUrl: '/api/l',
    formats: {
      thumbnail: { url: '/api/t', width: 104, height: 156 },
      medium: { url: '/api/g', width: 750, height: 500 },
      large: { url: '/api/l', width: 1000, height: 667 },
    },
  }
  assert.equal(galleryCellSrc(item, 'support'), '/api/l')
  assert.equal(galleryCellSrc(item, 'hero'), '/api/l')
  assert.notEqual(galleryCellSrc(item, 'support'), '/api/t')
  const lightbox = read('components/media/FaneqoMediaLightbox.vue')
  assert.match(lightbox, /selectGalleryMediaSource\(item, \{ role: 'lightbox'/)
  assert.match(lightbox, /item\.largeUrl \|\| item\.url/)
  assert.match(lightbox, /lockOverlayScroll\('lightbox'\)/)
  assert.match(lightbox, /unlockOverlayScroll\('lightbox'\)/)
  const grid = read('components/media/FaneqoMediaGrid.vue')
  assert.match(grid, /loading: lead \? 'eager' : 'lazy'/)
  assert.match(grid, /selectGalleryMediaSource/)
})

test('lightbox sits above the site header and can be dismissed on mobile', () => {
  const lightbox = read('components/media/FaneqoMediaLightbox.vue')
  const header = read('components/Header.vue')
  assert.match(header, /z-index:\s*99999999\s*!important/)
  assert.match(lightbox, /z-index:\s*100000000/)
  assert.match(lightbox, /aria-label="Close"/)
  assert.match(lightbox, /Swipe down to close/)
  assert.match(lightbox, /if \(Math\.abs\(dy\) > 72 && Math\.abs\(dy\) > Math\.abs\(dx\) \* 1\.35\) \{\s*close\(\)/)
})

test('Recap share-photos still deep-links recapId into the composer', () => {
  const cta = read('components/updates/SharePhotosFromTonightCta.vue')
  assert.match(cta, /buildSharePhotosPath/)
  const studio = read('pages/galleries/new.vue')
  assert.match(studio, /route\.query\.recapId/)
  assert.match(studio, /:show-recap-id="selectedRecap\?\.id \|\| null"/)
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /show_attendees/)
  assert.match(composer, /show-photos/)
})

test('touched gallery viewer SFCs compile', () => {
  compileSfc('pages/[bandSlug]/updates/[slug].vue')
  compileSfc('pages/galleries/index.vue')
  compileSfc('pages/galleries/new.vue')
  compileSfc('components/updates/ShowNightStory.vue')
})

console.log(`test-gallery-viewer-route: ${passed} ok`)
