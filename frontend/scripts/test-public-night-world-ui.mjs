/**
 * Slice 4B: cinematic public Night / Gallery artist-world experience.
 * Run: node scripts/test-public-night-world-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  artistNameFromSlug,
  attendanceLine,
  formatNightDateLong,
  formatNightTimeWindow,
  galleryChapterLockLine,
  galleryLockActionLabel,
  isGenericShowTitle,
  nightHeadline,
  nightPlaceLine,
  displayPlaceName,
  nightVenueCityLine,
  galleryChapterPreviewUrl,
  nightSafeTeaserFallbacks,
  publicGalleryPreviewUrl,
  uniqueNightGalleries,
} from '../utils/nights/nightDisplay.js'
import { yourShowOrdinalSentence } from '../utils/nights/showOrdinalCopy.js'
import { publicShareHead } from '../utils/nights/publicShareHead.js'
import { nightStoryLockedCopy } from '../utils/updates/nightStoryCopy.js'
import { mergePublicNightRefresh, resolvePublicNightHero } from '../utils/nights/publicNightHero.js'

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

test('Night renders artist identity and links home', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const chrome = read('components/nights/ArtistWorldChrome.vue')
  assert.match(night, /artistName/)
  assert.match(night, /pn__artist/)
  assert.match(chrome, /:to="artistPath"/)
  assert.match(night, /artistPath/)
  assert.match(night, /resolveNightReturn/)
  assert.match(night, /navReturn\.to/)
  assert.match(night, /Made with Faneqo/)
  assert.doesNotMatch(night + chrome, /<Header/)
})

test('artist image is the world hero; type hero has no empty black stage', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const chrome = read('components/nights/ArtistWorldChrome.vue')
  assert.match(night, /v-if="backdropSrc"/)
  assert.match(night, /resolveArtistImagePresentation/)
  assert.match(night, /resolvePublicNightHero/)
  assert.match(night, /is-type/)
  assert.match(night, /\.pn__hero\.is-artist \.pn__identity/)
  assert.match(night, /margin-top: -5\.5rem/)
  assert.match(night, /:overlay="!!backdropSrc"/)
  assert.match(chrome, /is-overlay/)
  assert.doesNotMatch(night, /min-height: min\(72vh/)
  assert.doesNotMatch(night, /Edit|Insights|Private band note|Message attendees/)
})

test('Public Night hero is night.hero ?? artist.image', () => {
  const artist = { artist: { image: { url: 'https://cdn.example/artist.jpg' }, imageFit: 'auto', focalX: 17, focalY: 22 } }
  const event = { eventImage: { url: 'https://cdn.example/poster.jpg' } }
  const cover = { cover: { url: 'https://cdn.example/night.jpg' } }
  const hero = { hero: { url: 'https://cdn.example/hero.jpg' }, heroFocalX: 42, heroFocalY: 28 }
  const fallback = resolvePublicNightHero({ ...artist, night: { ...event, ...cover } })
  assert.equal(fallback.source, 'artist')
  assert.equal(fallback.backdropUrl, 'https://cdn.example/artist.jpg')
  assert.equal(fallback.hasNightHero, false)
  assert.equal(fallback.eventUrl, 'https://cdn.example/poster.jpg')
  assert.equal(fallback.coverUrl, 'https://cdn.example/night.jpg')
  const override = resolvePublicNightHero({ ...artist, night: { ...event, ...cover, ...hero } })
  assert.equal(override.source, 'night-hero')
  assert.equal(override.backdropUrl, 'https://cdn.example/hero.jpg')
  assert.equal(override.coverUrl, 'https://cdn.example/night.jpg')
  assert.equal(override.eventUrl, 'https://cdn.example/poster.jpg')
  assert.equal(override.heroFocalX, 42)
  assert.equal(override.heroFocalY, 28)
  assert.equal(resolvePublicNightHero({ night: { ...cover, ...event } }).source, 'none')
  assert.equal(resolvePublicNightHero({ night: { hero: { url: '' }, ...cover } }).backdropUrl, '')
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /hasNightHero/)
  assert.match(night, /objectFit: 'cover'/)
  assert.match(night, /getArtistFocalStyle/)
  assert.match(night, /is-atmosphere': !hasNightHero/)
  assert.doesNotMatch(night, /night\.cover\?\.url \|\| artist/)
  assert.doesNotMatch(night, /Adjust Night hero|Upload hero/)
})

test('exact hero/event/cover URL identity is the only dedupe', () => {
  const artist = { artist: { image: { url: 'https://cdn.example/artist.jpg' } } }
  const sameHeroEvent = resolvePublicNightHero({
    ...artist,
    night: {
      hero: { url: 'https://cdn.example/hero.jpg?w=800' },
      eventImage: { url: 'https://cdn.example/hero.jpg' },
      cover: { url: 'https://cdn.example/hero.jpg' },
    },
  })
  assert.equal(sameHeroEvent.eventUrl, '')
  assert.equal(sameHeroEvent.coverUrl, '')
  const similarName = resolvePublicNightHero({
    ...artist,
    night: {
      hero: { url: 'https://cdn.example/hero-wide.jpg' },
      eventImage: { url: 'https://cdn.example/hero.jpg' },
      cover: { url: 'https://cdn.example/hero-cover.jpg' },
    },
  })
  assert.equal(similarName.eventUrl, 'https://cdn.example/hero.jpg')
  assert.equal(similarName.coverUrl, 'https://cdn.example/hero-cover.jpg')
  const coverMatchesEvent = resolvePublicNightHero({
    ...artist,
    night: {
      eventImage: { url: 'https://cdn.example/poster.jpg' },
      cover: { url: 'https://cdn.example/poster.jpg' },
    },
  })
  assert.equal(coverMatchesEvent.eventUrl, 'https://cdn.example/poster.jpg')
  assert.equal(coverMatchesEvent.coverUrl, '')
})

test('JWT refresh keeps Night Hero identity when hero is omitted', () => {
  const prev = {
    artist: { image: { url: '/artist.jpg' } },
    night: { hero: { url: '/hero.jpg' }, heroFocalX: 40, heroFocalY: 30, publicStory: 'A' },
    viewer: { authenticated: false },
  }
  const next = mergePublicNightRefresh(prev, {
    artist: prev.artist,
    night: { publicStory: 'A', title: 'Live' },
    viewer: { authenticated: true, youWereThere: true, showOrdinal: 2 },
  })
  assert.equal(next.night.hero.url, '/hero.jpg')
  assert.equal(next.night.heroFocalX, 40)
  assert.equal(next.viewer.youWereThere, true)
  const cleared = mergePublicNightRefresh(prev, {
    artist: prev.artist,
    night: { hero: null, heroFocalX: 50, heroFocalY: 50 },
    viewer: { authenticated: true },
  })
  assert.equal(cleared.night.hero, null)
  const page = read('pages/[bandSlug]/night/[nightSlug].vue')
  assert.match(page, /mergePublicNightRefresh/)
  assert.match(page, /publicShareHead/)
})

test('public hero never reads Gallery media or protected ids', () => {
  const helper = read('utils/nights/publicNightHero.js')
  const night = read('components/nights/PublicNightExperience.vue')
  assert.doesNotMatch(helper, /galleries|mediaId|originalUrl|faneqo-protected/)
  assert.doesNotMatch(night, /payload\?\.galleries.*hero|hero.*galleries/)
  assert.match(helper, /night\?\.hero\?\.url/)
})

test('story and lineup are conditional', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const lineup = read('components/nights/PublicNightLineup.vue')
  assert.match(night, /v-if="publicStory"/)
  assert.match(night, /PublicNightLineup/)
  assert.match(night, /The story/)
  assert.match(lineup, /On stage/)
  assert.match(lineup, /v-if="rows.length"/)
})

test('Night poster is an artifact and opens the existing lightbox', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /v-if="memorySrc"/)
  assert.match(night, /View Night poster/)
  assert.match(night, /View poster/)
  assert.match(night, /FaneqoMediaLightbox/)
  assert.match(night, /openMemory/)
  assert.match(night, /width: 11\.5rem/)
  assert.doesNotMatch(night, /max-width: 40rem/)
  assert.doesNotMatch(night, /privateArtistNote/)
})

test('artist continuation and Passport stay public-safe', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /Stay with/)
  assert.match(night, /View artist page/)
  assert.match(night, /ArtistWorldIdentity/)
  assert.match(night, /\/fan\/passport/)
  assert.match(night, /View in Fan Passport/)
  assert.match(night, /v-if="youWereThere"/)
  assert.match(night, /isRecapPreview/)
  assert.match(night, /Viewing as fan/)
  assert.doesNotMatch(night, /Talk to |Message attendees|Edit story|Add lineup/)
})

test('Gallery teasers use the stack when public media exists', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /FaneqoGalleryStack/)
  assert.match(night, /chapterCanStack/)
  assert.match(night, /@activate="openGallery\(gallery, \$event\)"/)
  assert.match(night, /:start-index="activeGalleryStartIndex"/)
  assert.match(night, /:auto-open-lightbox="activeGalleryAutoOpen"/)
  assert.match(night, /resolveNightGalleryOpen/)
  assert.match(night, /rememberStackIndex/)
  assert.match(night, /authorizedStackIndex/)
  assert.match(night, /gallery\.locked/)
})

test('YOU WERE THERE is conditional and uses backend ordinal', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /v-if="youWereThere"/)
  assert.match(night, /yourShowOrdinalSentence/)
  assert.match(night, /attendance && !youWereThere/)
  const identityAt = night.indexOf('class="pn__identity"')
  const crowdAt = night.indexOf('pn__crowd')
  assert.ok(identityAt > 0 && crowdAt > identityAt, 'attendance stays out of the hero identity')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 1, artistName: 'Badflower' }), 'Your first Badflower show')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 2, artistName: 'Badflower' }), 'Your 2nd Badflower show')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 3, artistName: 'Badflower' }), 'Your 3rd Badflower show')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 4, artistName: 'Badflower' }), 'Your 4th Badflower show')
  assert.equal(yourShowOrdinalSentence({ showOrdinal: 0, artistName: 'Badflower' }), null)
})

test('multiple galleries render; public preview uses media; gated does not', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(night, /v-for="gallery in galleries"/)
  assert.match(night, /galleryChapterPreviewUrl/)
  assert.match(night, /nightSafeTeaserFallbacks/)
  assert.match(night, /NightGalleryViewer/)
  assert.match(night, /openGallery/)
  assert.match(night, /80vw/)
  assert.deepEqual(
    nightSafeTeaserFallbacks({
      coverUrl: 'https://cdn.example/cover.jpg',
      eventUrl: 'https://cdn.example/poster.jpg',
      artistUrl: 'https://cdn.example/artist.jpg',
    }),
    [
      'https://cdn.example/cover.jpg',
      'https://cdn.example/poster.jpg',
      'https://cdn.example/artist.jpg',
    ],
  )
  assert.equal(
    publicGalleryPreviewUrl({ locked: false, media: [{ url: 'https://cdn.example/live.jpg' }] }, 'https://cdn.example/cover.jpg'),
    'https://cdn.example/live.jpg',
  )
  assert.equal(
    publicGalleryPreviewUrl({ locked: true, media: [{ url: 'https://cdn.example/secret.jpg' }] }, 'https://cdn.example/cover.jpg'),
    'https://cdn.example/cover.jpg',
  )
  assert.equal(
    publicGalleryPreviewUrl({ locked: false, media: [{ url: '', protected: true }] }, 'https://cdn.example/cover.jpg'),
    'https://cdn.example/cover.jpg',
  )
  assert.deepEqual(
    uniqueNightGalleries([{ slug: 'live' }, { slug: 'live' }, { slug: 'after' }]).map((row) => row.slug),
    ['live', 'after'],
  )
  assert.equal(
    galleryChapterPreviewUrl({ locked: true, media: [{ url: 'https://cdn.example/secret.jpg' }] }, [
      'https://cdn.example/cover.jpg',
      'https://cdn.example/artist.jpg',
    ]),
    'https://cdn.example/cover.jpg',
  )
  assert.equal(
    galleryChapterPreviewUrl({
      locked: false,
      media: [{ url: 'https://cdn.example/live.jpg', thumbnailUrl: 'https://cdn.example/live-thumb.jpg' }],
    }, 'https://cdn.example/cover.jpg'),
    'https://cdn.example/live.jpg',
  )
})

test('gated lock copy matches visibility', () => {
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'show_attendees' }),
    'These photos are for the people who were there.',
  )
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'fan_list', artistName: 'Badflower' }),
    'These photos are for fans of Badflower.',
  )
  assert.equal(galleryLockActionLabel('fan_list'), 'Sign in')
  assert.equal(galleryLockActionLabel('show_attendees'), 'Sign in to verify')
  assert.equal(galleryChapterLockLine({ lockReason: 'show_attendees' }), 'For the people who were there.')
})

test('Night link from Gallery is canonical', () => {
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(gallery, /nightPath\(/)
  assert.match(gallery, /nightHref/)
})

test('Share remains canonical backend share metadata', () => {
  const nightPage = read('pages/[bandSlug]/night/[nightSlug].vue')
  const galleryPage = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(nightPage, /share\.canonicalPath/)
  assert.match(gallery, /canonicalPath: props\.payload\?\.share\?\.canonicalPath/)
  assert.match(nightPage, /publicShareHead/)
  assert.match(galleryPage, /publicShareHead/)
})

test('SEO/OG still uses backend share.image only', () => {
  const head = publicShareHead({
    share: {
      canonicalPath: '/badflower/night/nashville-sep-5',
      title: 'Badflower at The Basement East · Nashville',
      description: 'A night worth remembering.',
      image: { url: 'https://cdn.example/cover.jpg' },
    },
    origin: 'https://faneqo.com',
  })
  assert.equal(head.canonical, 'https://faneqo.com/badflower/night/nashville-sep-5')
  assert.equal(head.image, 'https://cdn.example/cover.jpg')
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.doesNotMatch(gallery, /gallery\.media\[0\].*og|share\.image = media/)
})

test('legacy redirect unchanged', () => {
  const page = read('pages/[bandSlug]/updates/[slug].vue')
  assert.match(page, /redirectCode: 301/)
  assert.match(page, /galleryPath/)
})

test('authenticated refresh keeps anonymous payload on error', () => {
  const night = read('pages/[bandSlug]/night/[nightSlug].vue')
  const gallery = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  assert.match(night, /Anonymous SSR payload stays the safe baseline/)
  assert.match(gallery, /Anonymous SSR payload stays the safe baseline/)
  assert.match(night, /mergePublicNightRefresh/)
  assert.match(gallery, /if \(next\?\.gallery\) payload\.value = next/)
})

test('Gallery Page uses the canonical gallery, not any superseded viewer', () => {
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(gallery, /GalleryOverview/)
  assert.match(gallery, /normalizeGalleryModel/)
  assert.match(gallery, /locked\.value \? \[\]/)
  assert.doesNotMatch(gallery, /GalleryDoorway|LivingGalleryViewer/)
  assert.doesNotMatch(gallery, /FaneqoMediaLightbox/)
  assert.doesNotMatch(gallery, /FaneqoMediaGrid/)
})

test('320px overflow and reduced motion are structural', () => {
  const night = read('components/nights/PublicNightExperience.vue')
  const gallery = read('components/nights/PublicGalleryExperience.vue')
  assert.match(night, /overflow-wrap: anywhere/)
  assert.match(night, /overflow-x: clip/)
  assert.match(gallery, /prefers-reduced-motion/)
  assert.match(night, /prefers-reduced-motion/)
})

test('pages hide the full site nav', () => {
  const night = read('pages/[bandSlug]/night/[nightSlug].vue')
  const gallery = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  assert.match(night, /layout: 'artist-world'/)
  assert.match(gallery, /layout: 'artist-world'/)
  assert.doesNotMatch(read('layouts/artist-world.vue'), /<Header/)
})

test('display helpers stay editorial', () => {
  assert.equal(isGenericShowTitle('Live Show'), true)
  assert.deepEqual(
    nightHeadline({ title: 'Live Show', venue: 'The Basement East' }),
    { primary: 'The Basement East', secondary: '' },
  )
  assert.deepEqual(
    nightHeadline({ title: 'Resurrection Tour', venue: 'The Basement East' }),
    { primary: 'Resurrection Tour', secondary: 'The Basement East' },
  )
  assert.equal(nightPlaceLine({ city: 'Nashville', region: 'Tennessee' }), 'Nashville, Tennessee')
  assert.equal(formatNightDateLong('2026-09-05'), 'September 5, 2026')
  assert.equal(formatNightTimeWindow('2026-09-05', null), '')
  assert.equal(attendanceLine(147), '147 people were there')
  assert.equal(attendanceLine(1), '1 person was there')
  assert.equal(attendanceLine(0), '')
  assert.equal(artistNameFromSlug('badflower'), 'Badflower')
  assert.equal(displayPlaceName('the rock'), 'The Rock')
  assert.equal(displayPlaceName('chicago '), 'Chicago')
  assert.equal(displayPlaceName('The Basement East'), 'The Basement East')
  assert.equal(nightVenueCityLine({ venue: 'the rock', city: 'chicago' }), 'The Rock · Chicago')
  assert.equal(nightVenueCityLine({ venue: 'THE ROCK', city: '' }), 'THE ROCK')
})

test('artist-world lab can toggle Night Hero', () => {
  const lab = read('pages/__dev/artist-world.vue')
  assert.match(lab, /query\.hero/)
  assert.match(lab, /=== '1'/)
  assert.match(lab, /shownNight/)
  assert.match(lab, /heroFocalX = 42/)
  assert.match(lab, /query\.empty/)
  assert.match(lab, /query\.guest/)
  assert.match(lab, /query\.long/)
  assert.match(lab, /query\.one/)
  assert.match(lab, /nightFrom/)
  assert.match(lab, /The Moon Show/)
  assert.match(lab, /galleryLabConcertPrints\(8\)/)
  assert.match(lab, /photoCount: 8/)
  assert.match(lab, /nightRecordingLabStates/)
})

test('SFC sanity', () => {
  compileSfc('pages/[bandSlug]/night/[nightSlug].vue')
  compileSfc('pages/[bandSlug]/gallery/[gallerySlug].vue')
  compileSfc('layouts/artist-world.vue')
  compileSfc('components/nights/ArtistWorldChrome.vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('components/nights/PublicNightLineup.vue')
  compileSfc('components/nights/PublicNightRecordings.vue')
  compileSfc('pages/__dev/artist-world.vue')
  compileSfc('components/nights/NightGalleryViewer.vue')
  const viewer = read('components/nights/NightGalleryViewer.vue')
  assert.match(viewer, /Escape/)
  assert.match(viewer, /sharePath && !locked/)
  assert.match(viewer, /locked && props.publicExperience/)
  compileSfc('components/nights/PublicGalleryExperience.vue')
  compileSfc('components/nights/ArtistWorldMissing.vue')
  compileSfc('components/media/FaneqoMediaGrid.vue')
  compileSfc('components/media/FaneqoMediaLightbox.vue')
})

console.log(`test-public-night-world-ui: ${passed} ok`)
