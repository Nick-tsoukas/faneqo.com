/**
 * Slice 4A: public Night/Gallery destinations, share, SEO, visibility default.
 * Run: node scripts/test-public-night-share-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { galleryPath, nightPath, nightPathFromRecap } from '../utils/nights/publicNightPaths.js'
import { publicShareHead } from '../utils/nights/publicShareHead.js'
import { formatShowOrdinal, yourShowOrdinalCopy } from '../utils/nights/showOrdinalCopy.js'
import { shareFaneqoUrl } from '../utils/share/faneqoShare.js'
import {
  FANEQO_SITE_ORIGIN,
  isUnsafeCanonicalOrigin,
  resolveFrontendOrigin,
  shareImageUrl,
  toAbsoluteFrontendUrl,
} from '../utils/site/faneqoOrigin.js'
import { canonicalGalleryPath } from '../utils/passport/fanPassport.js'
import { nightStoryLockedCopy } from '../utils/updates/nightStoryCopy.js'

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

test('canonical public paths', () => {
  assert.equal(nightPath('badflower', 'nashville-sep-5'), '/badflower/night/nashville-sep-5')
  assert.equal(galleryPath('badflower', 'the-happy-room'), '/badflower/gallery/the-happy-room')
  assert.equal(canonicalGalleryPath('burning-thunder', 'the-happy-room'), '/burning-thunder/gallery/the-happy-room')
  assert.equal(nightPath('../evil', 'x'), null)
  assert.equal(galleryPath('band', '../x'), null)
  assert.equal(
    nightPathFromRecap({ nightSlug: 'nashville-sep-5', band: { slug: 'badflower' } }),
    '/badflower/night/nashville-sep-5',
  )
  assert.equal(nightPathFromRecap({ id: 41, venue: 'The Vix' }, 'badflower'), null)
})

test('ordinal copy uses backend viewer numbers only', () => {
  assert.equal(formatShowOrdinal(1), 'FIRST')
  assert.equal(formatShowOrdinal(2), '2ND')
  assert.equal(formatShowOrdinal(3), '3RD')
  assert.equal(formatShowOrdinal(4), '4TH')
  assert.equal(formatShowOrdinal(11), '11TH')
  assert.equal(formatShowOrdinal(21), '21ST')
  assert.equal(yourShowOrdinalCopy({ showOrdinal: 1, artistName: 'Badflower' }), 'YOUR FIRST Badflower SHOW')
  assert.equal(yourShowOrdinalCopy({ showOrdinal: 2, artistName: 'Badflower' }), 'YOUR 2ND Badflower SHOW')
  assert.equal(yourShowOrdinalCopy({ showOrdinal: 3, artistName: 'Badflower' }), 'YOUR 3RD Badflower SHOW')
  assert.equal(yourShowOrdinalCopy({ showOrdinal: 4, artistName: 'Badflower' }), 'YOUR 4TH Badflower SHOW')
  assert.equal(yourShowOrdinalCopy({ showOrdinal: 0, artistName: 'Badflower' }), null)
})

test('lock copy stays human', () => {
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'show_attendees' }),
    'These photos are for the people who were there.',
  )
  assert.equal(
    nightStoryLockedCopy({ lockReason: 'fan_list', artistName: 'Badflower' }),
    'These photos are for fans of Badflower.',
  )
  assert.doesNotMatch(nightStoryLockedCopy({ lockReason: 'show_attendees' }), /ArtistUpdate|canonical attendance|protected delivery/)
})

test('origin helper never uses localhost, Railway, or Strapi', () => {
  assert.equal(resolveFrontendOrigin({ configuredOrigin: 'https://faneqo.com' }), FANEQO_SITE_ORIGIN)
  assert.equal(resolveFrontendOrigin({ configuredOrigin: 'http://localhost:3000' }), FANEQO_SITE_ORIGIN)
  assert.equal(resolveFrontendOrigin({ configuredOrigin: 'https://qrserver.up.railway.app' }), FANEQO_SITE_ORIGIN)
  assert.equal(isUnsafeCanonicalOrigin('http://127.0.0.1:1337'), true)
  assert.equal(
    toAbsoluteFrontendUrl('/badflower/night/nashville-sep-5', 'https://faneqo.com'),
    'https://faneqo.com/badflower/night/nashville-sep-5',
  )
})

test('OG image uses share.image only and never gallery media', () => {
  const gated = publicShareHead({
    share: {
      canonicalPath: '/badflower/gallery/attendee-only',
      title: 'Badflower at The Vix · Nashville',
      description: 'Photos from the night.',
      image: null,
    },
    origin: 'https://faneqo.com',
  })
  assert.equal(gated.image, null)
  assert.equal(gated.canonical, 'https://faneqo.com/badflower/gallery/attendee-only')
  assert.equal(shareImageUrl({ url: 'https://cdn.example/cover.jpg' }), 'https://cdn.example/cover.jpg')
  assert.equal(shareImageUrl({ url: '/api/artist-updates/3/media/12' }), null)
  const page = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  const helper = read('utils/nights/publicShareHead.js')
  assert.match(page, /publicShareHead/)
  assert.match(helper, /shareImageUrl\(share\?\.image\)/)
  assert.doesNotMatch(page, /gallery\.media\[0\]|payload\.gallery\.media\[0\]/)
  assert.doesNotMatch(helper, /shareImageUrl\([^)]*media/)
})

test('share helper prefers navigator.share then clipboard', async () => {
  let shared = null
  const native = await shareFaneqoUrl({
    title: 'Night',
    text: 'A night worth remembering.',
    canonicalPath: '/badflower/night/nashville-sep-5',
    origin: 'https://faneqo.com',
  }, {
    navigator: { share: async (payload) => { shared = payload } },
  })
  assert.equal(native.method, 'share')
  assert.equal(shared.url, 'https://faneqo.com/badflower/night/nashville-sep-5')

  let copied = ''
  const clipboard = await shareFaneqoUrl({
    title: 'Gallery',
    canonicalPath: '/badflower/gallery/the-happy-room',
    origin: 'https://faneqo.com',
  }, {
    navigator: { clipboard: { writeText: async (value) => { copied = value } } },
  })
  assert.equal(clipboard.method, 'copy')
  assert.equal(copied, 'https://faneqo.com/badflower/gallery/the-happy-room')
})

test('SSR pages fetch anonymous public endpoints', () => {
  const night = read('pages/[bandSlug]/night/[nightSlug].vue')
  const gallery = read('pages/[bandSlug]/gallery/[gallerySlug].vue')
  const composable = read('composables/usePublicNight.js')
  assert.match(composable, /\/api\/public\/bands\//)
  assert.match(composable, /nights\//)
  assert.match(composable, /galleries\//)
  assert.match(night, /useAsyncData/)
  assert.match(gallery, /useAsyncData/)
  assert.match(night, /authenticated: true/)
  assert.match(gallery, /authenticated: true/)
  assert.match(night, /getNight\(\{ bandSlug: bandSlug\.value, nightSlug: nightSlug\.value \}\)/)
  assert.match(gallery, /getGallery\(\{ bandSlug: bandSlug\.value, gallerySlug: gallerySlug\.value \}\)/)
  assert.doesNotMatch(night, /localStorage/)
  assert.doesNotMatch(gallery, /localStorage/)
  assert.doesNotMatch(night, /privateArtistNote/)
  assert.doesNotMatch(gallery, /privateArtistNote/)
})

test('legacy /updates/:slug redirects to /gallery/:slug', () => {
  const page = read('pages/[bandSlug]/updates/[slug].vue')
  assert.match(page, /galleryPath/)
  assert.match(page, /redirectCode: 301/)
  assert.match(page, /preserveSafeFromQuery\(route\.query\)/)
  assert.doesNotMatch(page, /ShowNightStory/)
})

test('composer defaults to public and offers human visibility choices', () => {
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  assert.match(composer, /visibility = ref\('public'\)/)
  assert.match(composer, /Everyone/)
  assert.match(composer, /People who were there/)
  assert.match(composer, /value="fan_list"/)
  assert.match(composer, /value="show_attendees"/)
  assert.doesNotMatch(composer, /showPhotosMode\.value \? 'show_attendees' : visibility/)
  assert.doesNotMatch(composer, /const vis = showPhotosMode\.value \? 'show_attendees'/)
})

test('recap surfaces share/open Night only when nightSlug exists', () => {
  const detail = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const latest = read('components/dashboard/show-mode/LatestShowRecapPanel.vue')
  assert.match(detail, /Share Night/)
  assert.match(detail, /nightPathFromRecap/)
  assert.match(latest, /View recap/)
  assert.doesNotMatch(latest, /Open Night/)
  assert.doesNotMatch(latest, /nightPathFromRecap/)
})

test('editband Band fetch sends the session JWT', () => {
  const page = read('pages/editband/[id].vue')
  assert.match(page, /Authorization: `Bearer \$\{token\.value\}`/)
  assert.match(page, /async function fetchBand/)
})

test('touched public destination SFCs compile', () => {
  compileSfc('pages/[bandSlug]/night/[nightSlug].vue')
  compileSfc('pages/[bandSlug]/gallery/[gallerySlug].vue')
  compileSfc('pages/[bandSlug]/updates/[slug].vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('components/nights/PublicGalleryExperience.vue')
  compileSfc('components/nights/ArtistWorldChrome.vue')
  compileSfc('components/updates/ArtistUpdateComposer.vue')
  compileSfc('components/updates/ShowNightStory.vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
  compileSfc('components/dashboard/show-mode/LatestShowRecapPanel.vue')
})

console.log(`test-public-night-share-ui: ${passed} ok`)
