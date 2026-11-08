/**
 * FanPassport attendance-first memories + existing gallery share contracts.
 * Run: node scripts/test-fan-passport-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  absolutePublicMediaUrl,
  formatPassportNightDate,
  formatPassportPlace,
  canonicalGalleryPath,
  passportArtworkDisplayUrl,
  passportGalleryPath,
  passportMemoryPath,
  passportSharePayload,
  resolvePassportArtwork,
  safeFanPostAuthRedirect,
  sharePassportGallery,
} from '../utils/passport/fanPassport.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

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

assert.equal(passportGalleryPath(42), '/fan/passport/gallery/42')
assert.equal(passportMemoryPath(18), '/fan/passport/nights/18')
assert.equal(passportGalleryPath('nope'), null)
assert.deepEqual(passportSharePayload({
  artistUpdateId: 42,
  artistName: 'Badflower',
  city: 'Nashville',
  origin: 'https://faneqo.com/',
}), {
  title: 'Badflower in Nashville · Faneqo',
  text: 'See this show memory from Badflower in Nashville.',
  url: 'https://faneqo.com/fan/passport/gallery/42',
})
assert.deepEqual(resolvePassportArtwork({
  eventImageUrl: 'https://cdn.example/cover.jpg',
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: 'https://cdn.example/cover.jpg', source: 'show_cover' })
assert.deepEqual(resolvePassportArtwork({
  artistImageUrl: 'https://cdn.example/artist.jpg',
}), { url: null, source: 'fallback' })
assert.deepEqual(resolvePassportArtwork({}), { url: null, source: 'fallback' })
assert.equal(
  passportArtworkDisplayUrl({ url: 'https://cdn.example/artist.jpg', source: 'artist' }, ''),
  'https://cdn.example/artist.jpg',
)
assert.equal(passportArtworkDisplayUrl({ url: null, source: 'fallback' }, ''), null)
assert.equal(canonicalGalleryPath('burning-thunder', 'the-happy-room'), '/burning-thunder/gallery/the-happy-room')
assert.equal(canonicalGalleryPath('../evil', 'x'), null)
assert.deepEqual(passportSharePayload({
  artistUpdateId: 42,
  artistName: 'Badflower',
  city: 'Nashville',
  origin: 'https://faneqo.com/',
  bandSlug: 'badflower',
  slug: 'nashville-oct-18',
}), {
  title: 'Badflower in Nashville · Faneqo',
  text: 'See this show memory from Badflower in Nashville.',
  url: 'https://faneqo.com/badflower/gallery/nashville-oct-18',
})
assert.equal(formatPassportNightDate('2026-10-18'), 'October 18, 2026')
assert.equal(formatPassportPlace('Nashville', 'TN'), 'Nashville, TN')
assert.equal(absolutePublicMediaUrl('/uploads/cover.jpg', 'https://cdn.example'), 'https://cdn.example/uploads/cover.jpg')
assert.equal(absolutePublicMediaUrl('/images/homepage/artists/badflower-hero.webp', 'https://cdn.example'), '/images/homepage/artists/badflower-hero.webp')

let shared = null
const native = await sharePassportGallery({ artistUpdateId: 42 }, {
  navigator: { share: async (payload) => { shared = payload } },
  window: { location: { origin: 'https://faneqo.com' } },
})
assert.equal(native.method, 'share')
assert.equal(shared.url, 'https://faneqo.com/fan/passport/gallery/42')

let copied = ''
const clipboard = await sharePassportGallery({ artistUpdateId: 42 }, {
  navigator: { clipboard: { writeText: async (value) => { copied = value } } },
  window: { location: { origin: 'https://faneqo.com' } },
})
assert.equal(clipboard.method, 'clipboard')
assert.equal(copied, 'https://faneqo.com/fan/passport/gallery/42')

assert.equal(safeFanPostAuthRedirect('/fan/passport/gallery/42'), '/fan/passport/gallery/42')
assert.equal(safeFanPostAuthRedirect('/fan/passport/nights/18'), '/fan/passport/nights/18')
assert.equal(safeFanPostAuthRedirect('/dashboard'), null)
assert.equal(safeFanPostAuthRedirect('//evil.example/fan/passport'), null)
assert.equal(safeFanPostAuthRedirect('/fan/thing\\evil'), null)
assert.equal(safeFanPostAuthRedirect('/fan/../dashboard'), null)
assert.equal(safeFanPostAuthRedirect('/fan/%2e%2e/dashboard'), null)

const composable = read('composables/useFanPassport.js')
assert.match(composable, /\/api\/fan-passport\/memories/)
assert.match(composable, /\/api\/fan-passport\/galleries/)
assert.match(composable, /Authorization: `Bearer/)
assert.match(composable, /normalizeFaneqoMediaList/)
assert.doesNotMatch(composable, /localStorage|MediaAsset|signedUrl|_vid/)

const updates = read('composables/useArtistUpdates.js')
assert.match(updates, /function getById\(id\)/)
assert.match(updates, /`\$\{baseUrl\}\/api\/artist-updates\/\$\{id\}`/)

const home = read('components/passport/FanPassportHome.vue')
const card = read('components/passport/FanPassportMemoryCard.vue')
const memory = read('components/passport/FanPassportNightMemory.vue')
const list = read('components/passport/FanPassportMemoryList.vue')
const night = read('pages/fan/passport/nights/[id].vue')
const detail = read('components/passport/FanPassportNightDetail.vue')
const gallery = read('pages/fan/passport/gallery/[id].vue')
const story = read('components/updates/ShowNightStory.vue')
assert.match(home, /listMemories/)
assert.match(home, /FanPassportMemoryList/)
assert.match(home, /Your Passport starts with a Night/)
assert.match(home, /Check in at a show and it will live here/)
assert.doesNotMatch(home, /FanPassportGalleryList/)
assert.doesNotMatch(home, /No photos|Nothing here yet|fake demo/)
assert.match(card, /FanPassportNightMemory/)
assert.match(memory, /FaneqoGalleryStack/)
assert.match(memory, /passportNightVisualKind/)
assert.doesNotMatch(memory, /You were there/)
assert.match(list, /FanPassportArtistChapter/)
assert.match(night, /getMemory/)
assert.match(night, /publicNightPathFromMemory/)
assert.match(night, /replace: true/)
assert.match(night, /This Night isn’t published yet/)
assert.match(night, /noindex, nofollow/)
assert.doesNotMatch(night, /FanPassportNightDetail/)
assert.doesNotMatch(night, /Share Night/)
assert.doesNotMatch(night, /No photos|Nothing here yet/)
assert.match(detail, /You were there/)
assert.match(detail, /FaneqoGalleryStack/)
assert.match(memory, /FaneqoMediaLightbox/)
assert.match(memory, /openStack/)
assert.doesNotMatch(memory, /navigateTo\(href/)
const stack = read('components/media/FaneqoGalleryStack.vue')
assert.doesNotMatch(stack, /showOrdinal|youWereThere|passport/)
assert.match(gallery, /updates\.getById/)
assert.match(gallery, /detail\.data\.locked/)
assert.match(story, /Save to FanPassport/)
assert.match(story, /: 'Share'/)
assert.doesNotMatch(story, /Share this night/)
assert.doesNotMatch(home + card + memory + list + night, /localStorage|sessionStorage/)

const labs = read('pages/labs/passport.vue')
assert.match(labs, /middleware: \['auth', 'labs'\]/)
assert.match(labs, /FanPassportHome/)
assert.match(labs, /Night detail is Public Night now/)
assert.doesNotMatch(labs, /FanPassportNightDetail/)
assert.match(labs, /passportLabHomeFixture/)

const fanNav = read('components/messages/FanMobileBottomNav.vue')
const login = read('pages/login.vue')
const firebase = read('composables/useFirebase.ts')
const publishPage = read('pages/labs/share-photos.vue')
assert.match(fanNav, /to="\/fan\/passport"/)
assert.match(login, /safeFanPostAuthRedirect/)
assert.match(firebase, /postLoginPath/)
assert.match(publishPage, /sharePassportGallery/)

for (const rel of [
  'components/passport/FanPassportHome.vue',
  'components/passport/FanPassportMemoryCard.vue',
  'components/passport/FanPassportNightMemory.vue',
  'components/passport/FanPassportArtistChapter.vue',
  'components/passport/FanPassportNightDetail.vue',
  'components/passport/FanPassportMemoryList.vue',
  'components/passport/FanPassportGalleryList.vue',
  'pages/fan/passport/index.vue',
  'pages/fan/passport/nights/[id].vue',
  'pages/fan/passport/gallery/[id].vue',
  'pages/labs/passport.vue',
  'pages/__dev/passport.vue',
  'components/dashboard/ShowModeCard.vue',
  'pages/fans/recaps/[id].vue',
  'pages/__dev/passport-p1.vue',
]) {
  compileSfc(rel)
}

const showMode = read('components/dashboard/show-mode/ShowModeSetupSheet.vue')
assert.match(showMode, /Night photo/)
assert.match(showMode, /coverMediaId/)
assert.match(showMode, /useMediaUploadQueue/)
assert.match(showMode, /A photo from tonight/)
assert.match(showMode, /Remove/)
assert.match(showMode, /Change photo/)
assert.doesNotMatch(showMode, /required.*cover|cover.*required/)

const recap = read('utils/nights/artistRecap.js')
assert.match(recap, /showCoverUrl/)

console.log('test-fan-passport-ui: ok')
