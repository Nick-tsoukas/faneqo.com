/**
 * Home V2 opening — hero isolation, product theater, no nested scroll.
 * Run: node scripts/test-home-v2-opening.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  HOME_V2_HQ_REFRESH_PRIORITY,
  HOME_V2_OPENING_MOTION,
  HOME_V2_STORY_REFRESH_PRIORITY,
  homeV2PinTravelPx,
} from '../utils/home-v2/openingMotion.js'
import {
  HOME_V2_PRODUCT_SCENES,
  HOME_V2_THEATER_MOTION,
  homeV2ProductScenes,
} from '../utils/home-v2/productTheater.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

assert.deepEqual(
  HOME_V2_PRODUCT_SCENES.map((c) => c.id),
  ['music', 'video', 'fanList', 'support', 'showMode']
)
assert.equal(homeV2ProductScenes().length, 5)
assert.equal(HOME_V2_PRODUCT_SCENES.at(-1).id, 'showMode')
assert.ok(HOME_V2_PRODUCT_SCENES.at(-1).hold >= HOME_V2_PRODUCT_SCENES[3].hold)

for (const key of [
  'desktopScrollVh',
  'scrub',
  'handoffHold',
  'enterY',
  'mobileFromY',
]) {
  assert.equal(typeof HOME_V2_THEATER_MOTION[key], 'number')
}
assert.ok(HOME_V2_THEATER_MOTION.desktopScrollVh >= 3)
assert.ok(HOME_V2_THEATER_MOTION.desktopScrollVh <= 4)
assert.equal(homeV2PinTravelPx(3.35, 1000), 3350)
assert.notEqual(homeV2PinTravelPx(3.35, 1000), 3.35)
assert.ok(
  HOME_V2_HQ_REFRESH_PRIORITY > HOME_V2_STORY_REFRESH_PRIORITY,
  'HQ theater must refresh before Act 3 so pin-spacer geometry exists'
)
assert.equal(typeof HOME_V2_OPENING_MOTION.heroThought, 'number')

const openingFiles = [
  'components/home-v2/HomeV2Hero.vue',
  'components/home-v2/HomeV2HeroPortrait.vue',
  'components/home-v2/product-theater/HomeV2ProductTheater.vue',
  'composables/home-v2/useHomeV2ProductTheater.js',
  'composables/home-v2/useHomeV2HeroMotion.js',
]

for (const file of openingFiles) {
  const src = read(file)
  assert.doesNotMatch(
    src,
    /overflow-y\s*:\s*(auto|scroll)/,
    `${file} must not capture vertical scrolling`
  )
}

const theater = read('components/home-v2/product-theater/HomeV2ProductTheater.vue')
assert.match(theater, /v2-theater__stage/)
assert.match(theater, /overflow-y:\s*hidden/)
assert.doesNotMatch(theater, /v2-hq-film/)
assert.doesNotMatch(theater, /position:\s*sticky/)
assert.doesNotMatch(theater, /touch-action/)
assert.match(theater, /data-scene/)
assert.match(theater, /ProductMusicScene/)
assert.match(theater, /ProductVideoScene/)
assert.match(theater, /ProductFanListScene/)
assert.match(theater, /ProductSupportScene/)
assert.match(theater, /ProductShowModeScene/)

const scenesDir = [
  'components/home-v2/product-theater/scenes/ProductMusicScene.vue',
  'components/home-v2/product-theater/scenes/ProductVideoScene.vue',
  'components/home-v2/product-theater/scenes/ProductFanListScene.vue',
  'components/home-v2/product-theater/scenes/ProductSupportScene.vue',
  'components/home-v2/product-theater/scenes/ProductShowModeScene.vue',
]
for (const file of scenesDir) {
  const src = read(file)
  assert.doesNotMatch(src, /<form/)
  assert.doesNotMatch(src, /<iframe/)
  assert.doesNotMatch(src, /<audio/)
  assert.doesNotMatch(src, /overflow-y\s*:\s*(auto|scroll)/)
}

const hq = read('components/home-v2/HomeV2Headquarters.vue')
assert.match(hq, /HomeV2ProductTheater/)
assert.doesNotMatch(hq, /v2-hq-film/)
assert.doesNotMatch(hq, /useHomeV2ProductStage/)

const page = read('components/home-v2/HomeV2Page.vue')
assert.match(page, /HomeV2Hero/)
assert.match(page, /HomeV2Headquarters/)
assert.match(page, /v2-opening-bridge/)
assert.doesNotMatch(page, /overflow-x-hidden/)
assert.doesNotMatch(page, /HomeHeroSection/)
assert.doesNotMatch(page, /HomeHeadquartersSection/)

const engine = read('composables/home-v2/useHomeV2ProductTheater.js')
assert.match(engine, /pin: pinEl/)
assert.match(engine, /homeV2PinTravelPx\(M\.desktopScrollVh, window\.innerHeight\)/)
assert.match(engine, /HOME_V2_HQ_REFRESH_PRIORITY/)
assert.match(engine, /home-v2-hq-desktop/)
assert.doesNotMatch(engine, /currentY/)
assert.doesNotMatch(engine, /v2-hq-film/)
assert.doesNotMatch(engine, /scroller\s*:/)
assert.doesNotMatch(engine, /overflow-y\s*:\s*(auto|scroll)/)
assert.doesNotMatch(engine, /scrollTop/)

const heroMotion = read('composables/home-v2/useHomeV2HeroMotion.js')
assert.match(heroMotion, /onComplete/)
assert.match(heroMotion, /is-settled/)
assert.doesNotMatch(heroMotion, /gsap\.set\([^)]*autoAlpha:\s*0/)
assert.match(heroMotion, /tl\.from\(/)

const heroCss = read('components/home-v2/HomeV2Hero.vue')
assert.doesNotMatch(heroCss, /100svh - var\(--header-height, 64px\) - 2\.5rem/)
assert.match(heroCss, /100svh - var\(--header-height, 70px\)/)
assert.match(heroCss, /\.v2-hero__world \{[\s\S]*?width:\s*min\(/)

const v2page = read('pages/home-v2.vue')
assert.match(v2page, /home-v2-route/)
assert.match(v2page, /height:\s*auto/)
assert.doesNotMatch(v2page, /overflow-x:\s*hidden/)

const index = read('pages/index.vue')
assert.doesNotMatch(index, /HomeV2Hero|HomeV2Headquarters|useHomeV2ProductStage|HomeV2ProductTheater/)
assert.doesNotMatch(index, /home-v2\/openingMotion/)
assert.doesNotMatch(index, /home-v2\/productTheater/)

const hero = read('components/home/HomeHeroSection.vue')
assert.match(hero, /LOCKED: current production homepage hero/)
const lockedHq = read('components/home/HomeHeadquartersSection.vue')
assert.match(lockedHq, /LOCKED: current production/)

console.log('home-v2 opening theater checks ok')
