import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

// The nine-scene industry deck is the previous flagship, kept for rollback.
const deck = read('corvana/decks/flagshipDeck_industry.js')
const flagship = read('corvana/decks/flagshipDeck_elite.js')
const slide = read('corvana/decks/FaneqoIndustryDeckSlide.vue')
const registry = read('corvana/decks/componentRegistry.js')
const index = read('corvana/decks/deckIndex.js')
const viewer = read('pages/corvana/decks/[id].vue')

const scenes = [
  'opening',
  'problem',
  'artist-world',
  'show-mode',
  'remember',
  'message',
  'passport',
  'roster',
  'close',
]

for (const scene of scenes) {
  // Slide 1 of that deck is FaneqoCoverSlide, not an 'opening' product scene
  if (scene !== 'opening') assert.match(deck, new RegExp(`'${scene}'`), `deck includes ${scene}`)
  assert.match(slide, new RegExp(`scene === '${scene}'|sceneLabels[\\s\\S]*${scene}`), `component handles ${scene}`)
}

assert.equal((deck.match(/productSlide\(/g) || []).length, 8, 'deck has the cover plus eight product slides')
assert.match(deck, /totalSlides:\s*9/)
assert.doesNotMatch(deck, /MusicBizQR|Neon Avenue|momentum score|34%/i)
assert.match(deck, /The fan relationship platform for music/)
assert.doesNotMatch(deck, /speakerNotes|SAY:|POINT:/)
assert.doesNotMatch(viewer, /Speaker Notes|notes-button|showSpeakerNotes/)

assert.match(slide, /IndustryArtistProfile/)
assert.doesNotMatch(slide, /ProductMusicScene|ProductVideoScene|industry-artist-stage/)
const profile = read('corvana/decks/IndustryArtistProfile.vue')
const embed = read('pages/embed/artist-page.vue')
assert.match(profile, /\/embed\/artist-page/)
assert.match(profile, /VIEWPORT_WIDTH = 390/)
assert.match(profile, /scale\(\$\{scale\}\)/)
assert.match(profile, /faneqo:embed-artist-height/)
assert.match(profile, /scrolling="no"/)
assert.match(profile, /pointer-events:\s*none/)
assert.match(embed, /BandPageCybered/)
assert.match(embed, /deck-fold/)
assert.match(embed, /faneqo:embed-artist-height/)
assert.match(embed, /overflow:\s*hidden/)
assert.match(embed, /fetchBandBySlug/)
assert.match(embed, /layout:\s*false/)
assert.doesNotMatch(embed, /FanCaptureSection/)

const profileComponent = read('components/band/BandPageCybered.vue')
assert.match(profileComponent, /deckFold/)
// A flex ancestor breaks the `mx-auto` stage width inside the phone.
assert.doesNotMatch(profileComponent, /is-deck-fold[\s\S]{0,400}display:\s*flex/)
assert.match(slide, /ProductShowModeScene/)
assert.match(slide, /HomeV2ShowCheckIn/)
assert.match(slide, /HomeV2RoomRemembered/)
assert.match(slide, /HomeV2RoomMessenger/)
assert.match(slide, /FanPassportHome/)
assert.match(slide, /The artist can see who came back/)
assert.match(slide, /imageUrl:\s*artist\.heroImage/)
assert.match(slide, /Leslie Mendelson/)
assert.match(slide, /\/corvana\/deck\/leslie-mendelson\.png/)
assert.match(slide, /\/corvana\/deck\/developing-artist\.png/)
assert.match(slide, /\/corvana\/deck\/roster-band\.png/)
assert.match(slide, /object-fit:\s*cover/)
assert.match(slide, /word-spacing:\s*normal/)
assert.match(slide, /The audience is everywhere/)
assert.match(slide, /The relationship is nowhere/)
assert.match(slide, /Faneqo keeps that person with the artist/)
assert.match(slide, /You cannot write them/)
assert.match(slide, /You cannot find them tomorrow/)
assert.doesNotMatch(slide, /word-spacing:\s*0\.1/)
assert.doesNotMatch(slide, /ArtistWorkspacePicker|Touring Artist|Legacy Catalog|Neon Avenue/)
assert.match(slide, /QrcodeVue/)

assert.match(registry, /FaneqoIndustryDeckSlide/)
assert.match(index, /title:\s*'Faneqo Flagship'/)
assert.match(index, /slideCount:\s*10/)
assert.match(index, /\[flagshipDeck_industry\.slug\]:\s*flagshipDeck_industry/)
assert.match(index, /FLAGSHIP_DECK_PATH\s*=\s*'\/presentation'/)
assert.match(index, /FLAGSHIP_DECK_SLUG\s*=\s*'mbq-flagship-elite'/)
assert.doesNotMatch(index, /flagshipDeck_v1|managerDeck_v1|labelAgencyDeck_v1|investorLiteDeck_v1/)
assert.equal((index.match(/slug:\s*FLAGSHIP_DECK_SLUG/g) || []).length, 1)
assert.match(viewer, /currentSlide\?\.content\?\.fullBleed/)
assert.match(viewer, /dashboard-container\.is-full-bleed/)
assert.match(viewer, /slideIndexFromQuery/)
assert.match(viewer, /router\.push\('\/'\)/)

const publicDeck = read('pages/presentation.vue')
const legacyDeck = read('pages/deck.vue')
const header = read('components/Header.vue')
const home = read('components/home-v2/HomeV2Page.vue')
assert.match(publicDeck, /<DeckViewer :deck-slug="FLAGSHIP_DECK_SLUG" \/>/)
assert.match(legacyDeck, /path: FLAGSHIP_DECK_PATH/)
assert.match(header, /headerShowsTemporaryDeckLink/)
assert.match(header, /to="\/presentation"/)
assert.match(home, /to="\/presentation"/)

// The flagship: ten animated full-bleed scenes on the established public slug
const flagshipScenes = [
  'FaneqoCoverSlide',
  'FaneqoConnectSlide',
  'FaneqoHomeSlide',
  'FaneqoRoomSlide',
  'FaneqoNightSlide',
  'FaneqoConversationSlide',
  'FaneqoSupportSlide',
  'FaneqoInsightSlide',
  'FaneqoJourneySlide',
  'FaneqoClosingSlide',
]
assert.match(flagship, /slug:\s*'mbq-flagship-elite'/)
assert.match(flagship, /totalSlides:\s*10/)
flagshipScenes.forEach((key, i) => {
  assert.ok(flagship.includes(`slide(${i + 1}, `) && flagship.includes(`'${key}')`), `flagship slide ${i + 1} is ${key}`)
  assert.ok(registry.includes(key), `registry knows ${key}`)
  const source = read(`corvana/decks/${key}.vue`)
  assert.ok(source.includes('useSceneMotion(root,'), `${key} uses the shared scene motion`)
})
assert.match(read('corvana/decks/FaneqoInsightSlide.vue'), /Sample report\./, 'analytics stay labelled as sample data')
assert.match(read('corvana/decks/FaneqoRoomSlide.vue'), /fq-room__credit">Moon Dough, live/, 'live photo keeps its credit line')

const motion = read('corvana/decks/motion/useSceneMotion.js')
assert.match(motion, /prefers-reduced-motion: reduce/)
assert.ok(motion.includes('ctx?.revert()'))
assert.doesNotMatch(motion, /repeat:\s*-1|gsap\/ScrollTrigger/)
assert.match(viewer, /replayScene/)

console.log('Corvana industry deck source checks passed')
