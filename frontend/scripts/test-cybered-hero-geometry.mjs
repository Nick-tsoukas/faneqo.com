/**
 * Cybered hero geometry tests.
 * Run: node scripts/test-cybered-hero-geometry.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import {
  CYBERED_HERO_DEFAULT_RATIO,
  CYBERED_HERO_DEEP_MOBILE_MAX_HEIGHT,
  CYBERED_HERO_DEEP_NAME_INSET,
  CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT,
  CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT,
  CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT,
  CYBERED_HERO_PORTRAIT_NAME_INSET,
  CYBERED_HERO_TALL_PORTRAIT_MAX_RATIO,
  CYBERED_HERO_TALL_SOURCE_MAX_RATIO,
  getCyberedHeroBand,
  getCyberedHeroRatio,
  isCyberedHeroTallPortrait,
  resolveCyberedHeroGeometry,
} from '../utils/media/cyberedHeroGeometry.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('conceptual shapes land in the expected band', () => {
  assert.equal(getCyberedHeroBand(2), 'wide')
  assert.equal(getCyberedHeroBand(1.5), 'landscape')
  assert.equal(getCyberedHeroBand(1), 'square')
  assert.equal(getCyberedHeroBand(0.8), 'portrait')
  assert.equal(getCyberedHeroBand(0.66), 'deep')
})

test('shell height follows natural ratio: portrait taller than square than wide', () => {
  const wide = resolveCyberedHeroGeometry({ width: 2000, height: 1000 })
  const square = resolveCyberedHeroGeometry({ width: 1300, height: 1300 })
  const portrait = resolveCyberedHeroGeometry({ width: 800, height: 1000 })
  const deep = resolveCyberedHeroGeometry({ width: 4096, height: 6144 })

  assert.equal(wide.ratio, 2)
  assert.equal(square.ratio, 1)
  assert.equal(portrait.ratio, 0.8)
  assert.ok(Math.abs(deep.ratio - 4096 / 6144) < 0.0001)
  assert.ok(portrait.ratio < square.ratio)
  assert.ok(square.ratio < wide.ratio)
  assert.ok(deep.ratio < portrait.ratio)
})

test('invalid metadata uses the safe default ratio', () => {
  assert.equal(getCyberedHeroRatio(null), null)
  assert.equal(getCyberedHeroRatio({ url: '/x.jpg' }), null)
  assert.equal(getCyberedHeroBand(null), 'landscape')
  assert.equal(resolveCyberedHeroGeometry(null).ratio, CYBERED_HERO_DEFAULT_RATIO)
  assert.equal(resolveCyberedHeroGeometry({ width: 0, height: 800 }).ratio, CYBERED_HERO_DEFAULT_RATIO)
  assert.deepEqual(resolveCyberedHeroGeometry({}).style, {
    '--fq-hero-ratio': String(CYBERED_HERO_DEFAULT_RATIO),
  })
})

test('known Faneqo source ratios stay on the photo', () => {
  const cases = [
    ['Moon Dough', 2047, 1151, 'wide'],
    ['Emerge', 1300, 1300, 'square'],
    ['BurningThunder', 1500, 1455, 'square'],
    ['Shannon Tehya', 800, 1000, 'portrait'],
    ['Andy Darling', 1000, 1333, 'portrait'],
    ['Badflower', 4096, 6144, 'deep'],
    ['JD Pinkus', 436, 703, 'deep'],
  ]
  for (const [name, width, height, expected] of cases) {
    const result = resolveCyberedHeroGeometry({ width, height })
    assert.equal(result.band, expected, `${name} should be ${expected}`)
    assert.equal(result.style['--fq-hero-ratio'], String(width / height))
  }
})

test('unwraps Strapi media and exposes ratio immediately', () => {
  const result = resolveCyberedHeroGeometry({
    data: { attributes: { url: '/a.jpg', width: 800, height: 1000 } },
  })
  assert.equal(result.band, 'portrait')
  assert.equal(result.ratio, 0.8)
  assert.equal(result.style['--fq-hero-ratio'], '0.8')
})

test('geometry style never includes transforms', () => {
  const style = resolveCyberedHeroGeometry({ width: 800, height: 1000 }).style
  assert.equal(style.transform, undefined)
  assert.equal(Object.keys(style).every((key) => key.startsWith('--fq-hero-')), true)
})

test('portrait and deep (ratio < 0.9) get the mobile hard-cap vars', () => {
  assert.equal(CYBERED_HERO_TALL_PORTRAIT_MAX_RATIO, 0.7)
  assert.equal(CYBERED_HERO_TALL_SOURCE_MAX_RATIO, 0.9)
  assert.equal(isCyberedHeroTallPortrait('portrait'), true)
  assert.equal(isCyberedHeroTallPortrait('deep'), true)
  assert.equal(isCyberedHeroTallPortrait('square'), false)
  assert.equal(isCyberedHeroTallPortrait('landscape'), false)
  assert.equal(isCyberedHeroTallPortrait('wide'), false)

  const deep = resolveCyberedHeroGeometry({ width: 4096, height: 6144 })
  const portrait = resolveCyberedHeroGeometry({ width: 800, height: 1000 })
  const square = resolveCyberedHeroGeometry({ width: 1300, height: 1300 })
  const landscape = resolveCyberedHeroGeometry({ width: 1500, height: 1000 })
  const wide = resolveCyberedHeroGeometry({ width: 2000, height: 1000 })

  assert.equal(CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT, '23.75rem')
  assert.equal(CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT, '26.875rem')
  assert.equal(parseFloat(CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT) * 16, 380)
  assert.equal(parseFloat(CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT) * 16, 430)
  assert.equal(
    CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT,
    'clamp(23.75rem, 48vh, 26.875rem)',
  )
  assert.equal(CYBERED_HERO_DEEP_MOBILE_MAX_HEIGHT, CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT)
  assert.equal(CYBERED_HERO_DEEP_NAME_INSET, CYBERED_HERO_PORTRAIT_NAME_INSET)
  assert.equal(CYBERED_HERO_PORTRAIT_NAME_INSET, '1rem')

  for (const result of [deep, portrait]) {
    assert.equal(isCyberedHeroTallPortrait(result.band), true)
    assert.equal(result.style['--fq-hero-portrait-height-mobile'], CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT)
    assert.equal(result.style['--fq-hero-portrait-min-mobile'], CYBERED_HERO_PORTRAIT_MOBILE_MIN_HEIGHT)
    assert.equal(result.style['--fq-hero-portrait-max-mobile'], CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT)
    assert.equal(result.style['--fq-hero-portrait-name-inset'], CYBERED_HERO_PORTRAIT_NAME_INSET)
    assert.equal(result.style['--fq-hero-deep-max-mobile'], CYBERED_HERO_PORTRAIT_MOBILE_MAX_HEIGHT)
  }

  assert.equal(square.style['--fq-hero-portrait-max-mobile'], undefined)
  assert.equal(landscape.style['--fq-hero-portrait-max-mobile'], undefined)
  assert.equal(wide.style['--fq-hero-portrait-max-mobile'], undefined)
  assert.equal(square.style['--fq-hero-deep-max-mobile'], undefined)
  assert.equal(wide.style['--fq-hero-deep-max-mobile'], undefined)
})

test('tall classification does not replace desktop ratio with source-driven mobile height', () => {
  const extreme = resolveCyberedHeroGeometry({ width: 1000, height: 3000 })
  assert.equal(extreme.band, 'deep')
  assert.equal(extreme.ratio, 1000 / 3000)
  assert.equal(extreme.style['--fq-hero-ratio'], String(1000 / 3000))
  assert.equal(extreme.style['--fq-hero-portrait-height-mobile'], CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT)
  assert.notEqual(extreme.style['--fq-hero-portrait-height-mobile'], String(extreme.ratio))
})

test('desktop hero is a cinematic height cap; mobile portrait cap is unchanged', () => {
  const css = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '../components/band/BandPageCybered.vue'),
    'utf8',
  )
  assert.match(css, /object-fit:\s*cover/)
  assert.match(css, /min-width: 1024px/)
  assert.match(css, /\.cybered-stage \{\s*max-width: 48rem;/)
  assert.match(css, /max-width:\s*clamp\(52rem, 68vw, 62rem\)/)
  assert.match(css, /height:\s*clamp\(31rem, 56vh, 35rem\)/)
  assert.match(css, /min-height: 31rem/)
  assert.match(css, /max-height: 35rem/)
  assert.match(css, /max-height: 42\.5rem/)
  assert.match(css, /\.cybered-hero-identity \{\s*bottom: 1\.75rem;/)
  assert.match(css, /line-height:\s*1\.15/)
  assert.match(css, /padding-bottom:\s*0\.18em/)
  assert.match(css, /margin-top:\s*-1\.25rem/)
  assert.match(css, /CYBERED_HERO_PORTRAIT_MOBILE_HEIGHT|clamp\(23\.75rem, 48vh, 26\.875rem\)/)
  assert.match(css, /@media \(max-width: 767px\)/)
  assert.doesNotMatch(css, /clamp\(25\.625rem, 50vh, 30rem\)/)
  assert.doesNotMatch(css, /max-w-3xl/)
})

console.log(`\ncybered-hero-geometry: ${passed} tests passed`)
