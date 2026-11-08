/**
 * Canonical public Gallery Page contract.
 * Galleries Home → Gallery Page → Living Gallery.
 * Run: node scripts/test-public-gallery-experience-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { nightVenueCityLine } from '../utils/nights/nightDisplay.js'
import { resolveGalleryReturn } from '../utils/nights/artistWorldReturn.js'
import { faneqoShareUrl } from '../utils/share/faneqoShare.js'
import { yourShowOrdinalSentence } from '../utils/nights/showOrdinalCopy.js'
import {
  normalizeGalleryModel,
  normalizeGalleryIdentity,
} from '../features/gallery-experience/canonical/galleryMediaModel.js'
import { canShareGallery } from '../features/gallery-experience/canonical/gallerySharePayload.js'

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
    compileScript(descriptor, { id: rel, filename: rel })
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

const gallery = read('components/nights/PublicGalleryExperience.vue')
const page = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
const chrome = read('components/nights/ArtistWorldChrome.vue')
const overview = read('features/gallery-experience/canonical/GalleryOverview.vue')
const identity = read('features/gallery-experience/canonical/GalleryIdentityBlock.vue')
const nightHref = '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f'
const galleryHref = '/therockers/gallery/fun-time-last-gallery'

test('1. Gallery Page uses the canonical overview + viewer, and nothing else', () => {
  assert.match(gallery, /GalleryOverview/)
  assert.match(gallery, /normalizeGalleryModel/)
  // The three superseded engines must not be reachable from this page.
  assert.doesNotMatch(gallery, /GalleryDoorway|MemoryDeck/)
  assert.doesNotMatch(gallery, /LivingGalleryViewer|publicPayloadToExperience/)
  assert.doesNotMatch(gallery, /FaneqoPhotoViewer|FaneqoGalleryStack/)
  assert.doesNotMatch(gallery, /FaneqoMediaGrid/)
  assert.doesNotMatch(gallery, /FaneqoMediaLightbox/)
  // The overview owns the viewer; the page never wires one up itself.
  assert.match(overview, /GalleryViewer/)
})

test('2. only this Gallery\'s media is rendered, and locked galleries render none', () => {
  assert.match(gallery, /locked\.value \? \[\] : \(gallery\.value\.media \|\| \[\]\)/)
  // The overview is only reachable on the unlocked branch.
  assert.match(gallery, /<template v-if="locked">/)
  assert.match(gallery, /<template v-else>/)
  assert.doesNotMatch(gallery, /payload\?\.galleries/)
  // Normalization drops locked media rather than rendering it.
  const locked = normalizeGalleryModel({
    gallery: {
      locked: true,
      title: 'After',
      slug: 'after',
      media: [{ url: 'https://cdn.example/secret.jpg', width: 800, height: 600 }],
    },
  }, { bandSlug: 'therockers' })
  assert.equal(locked.locked, true)
  assert.equal(locked.photos.length, 0)
  // …and a locked gallery cannot be shared at all.
  assert.equal(canShareGallery(locked), false)
})

test('3. Night context is shown when the Gallery is attached', () => {
  assert.match(gallery, /v-if="nightHref"/)
  assert.match(gallery, /nightVenueCityLine/)
  assert.equal(nightVenueCityLine({ venue: 'the rock', city: 'chicago' }), 'The Rock · Chicago')
  const show = normalizeGalleryIdentity({
    artist: { name: 'BADFLOWER', slug: 'badflower' },
    night: { venue: 'The Basement East', city: 'Nashville', date: '2026-10-18', nightSlug: 'basement-east' },
    gallery: { title: 'The Basement East', caption: '', slug: 'basement', media: [] },
  }, { bandSlug: 'badflower' })
  assert.equal(show.showLinked, true)
  assert.match(show.placeLine, /The Basement East/)
  assert.match(show.dateLine, /October/)
  assert.equal(show.nightPath, '/badflower/night/basement-east')
})

test('4. Night context is omitted when the Gallery is standalone', () => {
  assert.match(gallery, /nightPath\(props\.bandSlug, night\.value\?\.nightSlug\)/)
  const general = normalizeGalleryIdentity({
    artist: { name: 'BADFLOWER', slug: 'badflower' },
    night: null,
    gallery: { title: 'Summer Tour Portraits', caption: 'Portraits.', slug: 'summer', media: [] },
  }, { bandSlug: 'badflower' })
  assert.equal(general.showLinked, false)
  // A gallery with no show must never imply a venue or a date.
  assert.equal(general.placeLine, '')
  assert.equal(general.dateLine, '')
  assert.equal(general.nightPath, null)
  assert.equal(general.title, 'Summer Tour Portraits')
})

test('5. public viewers do not see management visibility labels', () => {
  assert.doesNotMatch(gallery, /galleryAudienceLabel/)
  assert.doesNotMatch(gallery, />Public</)
  assert.doesNotMatch(gallery, /visibilityLabel|Audience:|Private band/)
  assert.doesNotMatch(gallery, /Edit gallery|Insights|Message attendees/)
})

test('6. gated media is not leaked', () => {
  assert.match(gallery, /locked\.value \? \[\]/)
  assert.match(gallery, /safeCover/)
  assert.match(gallery, /night\.value\?\.cover\?\.url \|\| artist\.value\.image\?\.url/)
  assert.doesNotMatch(gallery, /gallery\.value\.media.*safeCover|safeCover.*gallery\.value\.media/)
  assert.match(gallery, /v-if="locked"/)
})

test('7. youWereThere is shown only from backend truth and only with a Night', () => {
  assert.match(gallery, /!!viewer\.value\.youWereThere && !!nightHref\.value/)
  assert.match(gallery, /yourShowOrdinalSentence/)
  assert.match(gallery, /v-if="youWereThere"/)
  assert.doesNotMatch(gallery, /youWereThere:\s*true/)
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 2, artistName: 'The Rockers' }), 'Your 2nd The Rockers show')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 0, artistName: 'The Rockers' }), null)
})

test('8. Share URL has no from or photo', () => {
  assert.equal(
    faneqoShareUrl({
      canonicalPath: `${galleryHref}?from=/galleries&photo=4`,
      origin: 'https://faneqo.com',
    }),
    `https://faneqo.com${galleryHref}`,
  )
  assert.match(gallery, /faneqoShareUrl/)
  assert.match(gallery, /canonicalPath: props\.payload\?\.share\?\.canonicalPath/)
  assert.doesNotMatch(page + gallery, /canonicalPath: route\.(fullPath|query)/)
})

test('9. artist-preview Back honors /galleries', () => {
  const result = resolveGalleryReturn({
    from: '/galleries',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath: '/therockers',
    artistName: 'The Rockers',
  })
  assert.equal(result.to, '/galleries')
  assert.equal(result.label, 'Galleries')
  assert.match(gallery, /resolveGalleryReturn/)
  assert.match(gallery, /navReturn\.to/)
})

test('10. direct Gallery Back uses parent Night', () => {
  const result = resolveGalleryReturn({
    from: '',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath: '/therockers',
    artistName: 'The Rockers',
  })
  assert.equal(result.to, nightHref)
  assert.equal(result.label, 'The Rock · Chicago')
})

test('11. semantic Night link remains when a Night exists', () => {
  assert.match(gallery, /aw__to-night/)
  assert.match(gallery, /Return to the Night/)
  assert.match(gallery, /:to="nightHref"/)
  assert.match(gallery, /navReturn\.to/)
  const preview = resolveGalleryReturn({
    from: '/galleries',
    nightHref,
    nightLabel: 'The Rock · Chicago',
    artistPath: '/therockers',
    artistName: 'The Rockers',
  })
  assert.equal(preview.to, '/galleries')
  assert.notEqual(preview.to, nightHref)
})

test('12. caption is first-class on the Gallery Page and omitted when absent', () => {
  // The artist's words are part of the threshold, set beside the title.
  assert.match(identity, /v-if="identity\.caption"/)
  assert.match(identity, /class="gid__caption"/)
  assert.doesNotMatch(gallery + overview + identity, /Caption:/)
  const none = normalizeGalleryIdentity({
    artist: { name: 'BADFLOWER', slug: 'badflower' },
    gallery: { title: 'Portraits', media: [] },
  }, { bandSlug: 'badflower' })
  assert.equal(none.caption, '')
})

test('13. broken lock cover is handled without leaking a hole', () => {
  assert.match(gallery, /coverBroken/)
  assert.match(gallery, /@error="coverBroken = true"/)
})

test('13b. the gallery bar owns Back and Share, hides on the way down, and returns on the way up', () => {
  const bar = read('features/gallery-experience/canonical/GalleryTopBar.vue')
  assert.match(gallery, /<GalleryTopBar/)
  assert.match(gallery, /:back-to="navReturn\.to"/)
  assert.match(gallery, /@share="openShare"/)
  assert.match(bar, /onPageScroll/)
  assert.match(bar, /is-away/)
  assert.match(bar, /translateY\(-100%\)/)
  // Real controls at venue size.
  assert.match(bar, /min-width: 44px;\s*min-height: 44px/)
  assert.match(bar, /:aria-label="backAria"/)
  assert.match(bar, /prefers-reduced-motion/)
  // The bar carries no artist name; the threshold beneath it does.
  assert.doesNotMatch(bar.split('</template>')[0], /artistName/)
})

test('14. no full site Header; artist dock only when in-app', () => {
  assert.match(page, /layout: 'artist-world'/)
  assert.doesNotMatch(page + gallery + chrome, /<Header/)
  assert.doesNotMatch(gallery, /Search Bands/)
  assert.doesNotMatch(read('layouts/artist-world.vue'), /<Header/)
  assert.match(gallery, /MobileBottomNav/)
  assert.match(gallery, /showAppNav && !viewerOpen/)
})

test('15. mobile composition does not clip and respects safe area', () => {
  assert.match(gallery, /overflow-x: clip/)
  assert.match(gallery, /overflow-wrap: anywhere/)
  assert.match(gallery, /safe-area-inset-bottom/)
  // The overview bleeds edge to edge on a phone and insets once there is room.
  assert.match(read('features/gallery-experience/canonical/galleryJustifiedRows.js'), /galleryWallPadding/)
  assert.match(identity, /safe-area|padding: 84px/)
})

test('identity precedes photography; share remains gallery-level', () => {
  const identityAt = overview.indexOf('GalleryIdentityBlock')
  const sequenceAt = overview.indexOf('<GallerySequence')
  assert.ok(identityAt > 0 && identityAt < sequenceAt, 'artist identity before photographs')
  // A true circle with real focal behavior, and a real band image.
  assert.match(identity, /border-radius: 50%/)
  assert.match(identity, /object-fit: cover/)
  assert.match(identity, /objectPosition/)
  // Gallery-level share stays on the page's existing canonical sheet.
  assert.match(gallery, /NightShareSheet/)
  assert.match(gallery, /Share this gallery/)
  assert.match(gallery, /format="square"/)
  assert.doesNotMatch(gallery, /pn__stage|giant artist|artist banner/)
})

test('photo query reveals a Gallery Page frame and does not auto-open the viewer', () => {
  assert.match(gallery, /readGalleryOpenIntent/)
  assert.match(gallery, /locked\.value \|\| !media\.value\.length/)
  assert.match(gallery, /initialPhotoIndex\.value = intent\.index/)
  // The hand-off reveals and focuses; only a `#photo-` deep link opens.
  assert.match(overview, /revealHandedOverPhoto/)
  assert.match(overview, /openFromHash\(window\.location\.hash\)/)
  const apply = gallery.indexOf('function applyOpenIntent')
  assert.ok(apply > 0)
  assert.doesNotMatch(gallery.slice(apply, apply + 500), /openAt|viewerOpen\.value = true/)
})

test('the viewer is reached only through the canonical overview', () => {
  // One canonical viewer, owned by the overview, behind one engine adapter.
  assert.match(overview, /GalleryViewer\.client\.vue/)
  assert.doesNotMatch(gallery, /photoswipe|PhotoSwipe/)
  assert.match(
    read('features/gallery-experience/canonical/GalleryViewer.client.vue'),
    /createViewerAdapter/,
  )
  assert.doesNotMatch(gallery, /navigateTo\(['"]\/dashboard/)
})

/*
 * Close is a state change, never a navigation. This page is the first real
 * caller, so it is also where a regression would first reach a fan.
 */
test('closing a photograph never navigates away from the gallery', () => {
  const dismissal = read('features/gallery-experience/canonical/galleryDismissal.js')
  const viewerState = read('features/gallery-experience/canonical/useGalleryViewer.js')
  assert.doesNotMatch(dismissal, /router\.back|history\.back/)
  assert.doesNotMatch(viewerState, /router\.back|history\.back|navigateTo/)
  // Only the history module is allowed near the history stack.
  assert.match(
    read('features/gallery-experience/canonical/galleryViewerHistory.js'),
    /history\.back\(\)/,
  )
  // The page does not close the viewer for it, or reach into history itself.
  assert.doesNotMatch(gallery, /router\.back|history\.back/)
})

test('More From adapts to one or two related galleries instead of a forced trio', () => {
  assert.match(gallery, /moreListClass/)
  assert.match(gallery, /is-one/)
  assert.match(gallery, /is-two/)
  assert.match(gallery, /grid-template-columns: minmax\(0, 48rem\)/)
  assert.match(gallery, /More from \{\{ artistName \}\}/)
})

test('SFC sanity', () => {
  compileSfc('components/nights/PublicGalleryExperience.vue')
  compileSfc('features/gallery-experience/canonical/GalleryOverview.vue')
  compileSfc('features/gallery-experience/canonical/GalleryIdentityBlock.vue')
  compileSfc('features/gallery-experience/canonical/GallerySequence.vue')
  compileSfc('features/gallery-experience/canonical/GalleryTopBar.vue')
  compileSfc('features/gallery-experience/canonical/GalleryViewer.client.vue')
  compileSfc('features/gallery-experience/canonical/GalleryViewerChrome.vue')
  compileSfc('features/gallery-experience/canonical/GalleryContactSheet.vue')
  compileSfc('components/nights/NightShareSheet.vue')
  compileSfc('pages/[bandSlug]/gallery/[gallerySlug].vue')
  compileSfc('components/nights/ArtistWorldChrome.vue')
  compileSfc('pages/__dev/artist-world.vue')
})

console.log(`test-public-gallery-experience-ui: ${passed} ok`)
