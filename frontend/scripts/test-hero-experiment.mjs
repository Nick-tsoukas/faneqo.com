/**
 * Focused checks for the LOCAL-ONLY artist hero experiment.
 * Run: node scripts/test-hero-experiment.mjs
 *
 * Guards the two things that matter most:
 *   1. the mobile framing contract is untouched
 *   2. the experiment cannot activate without dev + the query flag, and
 *      cannot write to the Band API
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from 'vue/compiler-sfc'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(join(root, rel), 'utf8')

function compiles(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.equal(errors.length, 0, `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) compileScript(descriptor, { id: 'test' })
  return source
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const {
  resolveAdaptivePresentation,
  normalizeHeroExperimentMode,
  normalizeHeroExperimentFit,
  normalizeHeroExperimentState,
  seedDesktopFraming,
  heroExperimentStorageKey,
  getExperimentDesktopPhotoStyle,
  getAdaptivePhotoStyle,
  HERO_ADAPTIVE_FALLBACK,
} = await import('../utils/media/heroExperiment.js')

const { getCyberedHeroPhotoStyle } = await import('../utils/media/artistImage.js')

/* ------------------------------------------------ adaptive policy */

test('adaptive policy classifies the audit fixtures', () => {
  assert.equal(resolveAdaptivePresentation(1365 / 2048), 'editorial')   // tall portrait
  assert.equal(resolveAdaptivePresentation(1200 / 1800), 'editorial')   // portrait + instrument
  assert.equal(resolveAdaptivePresentation(1.0), 'editorial')           // square
  assert.equal(resolveAdaptivePresentation(2000 / 1333), 'cinematic')   // normal landscape
  assert.equal(resolveAdaptivePresentation(2400 / 1600), 'cinematic')   // group of 5
  assert.equal(resolveAdaptivePresentation(3000 / 1000), 'panorama')    // very wide group
})

test('missing or invalid dimensions use a stable fallback', () => {
  assert.equal(resolveAdaptivePresentation(null), HERO_ADAPTIVE_FALLBACK)
  assert.equal(resolveAdaptivePresentation(undefined), HERO_ADAPTIVE_FALLBACK)
  assert.equal(resolveAdaptivePresentation(0), HERO_ADAPTIVE_FALLBACK)
  assert.equal(resolveAdaptivePresentation(Number.NaN), HERO_ADAPTIVE_FALLBACK)
  assert.equal(resolveAdaptivePresentation(-3), HERO_ADAPTIVE_FALLBACK)
})

test('presentation is stable near boundaries (no resize flip-flop)', () => {
  // just under the cinematic boundary, already editorial -> stays editorial
  assert.equal(resolveAdaptivePresentation(1.34, 'editorial'), 'editorial')
  // just over, already cinematic -> stays cinematic
  assert.equal(resolveAdaptivePresentation(1.29, 'cinematic'), 'cinematic')
  // panorama edge holds
  assert.equal(resolveAdaptivePresentation(2.36, 'panorama'), 'panorama')
  // with no history the hard thresholds apply
  assert.equal(resolveAdaptivePresentation(1.29, null), 'editorial')
  assert.equal(resolveAdaptivePresentation(1.34, null), 'cinematic')
})

/* ------------------------------------------------ mobile preservation */

test('experiment never alters the mobile photo style helper', () => {
  for (const f of [
    { positionX: 50, positionY: 50, zoom: 1 },
    { positionX: 48, positionY: 22, zoom: 1.06 },
    { positionX: 0, positionY: 100, zoom: 2 },
    { positionX: undefined, positionY: undefined, zoom: undefined },
  ]) {
    const style = getCyberedHeroPhotoStyle(f)
    assert.ok(style.objectPosition.endsWith('%'))
    assert.match(style.transform, /^scale\(/)
    assert.equal(Object.keys(style).length, 3, 'mobile style shape must not grow')
  }
  // The live hero still binds the canonical helper for its inline style.
  const cybered = read('components/band/BandPageCybered.vue')
  assert.match(cybered, /getCyberedSurfacePhotoStyle\(phoneHeroFraming/)
  assert.match(cybered, /resolveCyberedSurfaceFraming\(props\.band, 'phone'\)/)
  assert.match(cybered, /:style="heroImageStyle"/)
})

test('every experiment CSS rule is inside the 1024px breakpoint', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  assert.ok(cybered.includes('LOCAL-ONLY HERO EXPERIMENT'), 'experiment style block not found')
  // Anchor on the first real selector of the block (it runs to end of <style>),
  // then strip comments — slicing mid-comment would leave a dangling body.
  const block = cybered
    .slice(cybered.indexOf('.cybered-hero-identity__aside {'))
    .replace(/\/\*[\s\S]*?\*\//g, '')
  assert.ok(block.length > 500, 'experiment style block too short')

  // Only one rule may sit outside the media query: the inert aside default.
  const outside = block.slice(0, block.indexOf('@media (min-width: 1024px)'))
  const outsideSelectors = outside.match(/^\.[a-z][\w-]*[^{]*\{/gim) || []
  assert.deepEqual(
    outsideSelectors.map((s) => s.replace(/\s*\{$/, '').trim()),
    ['.cybered-hero-identity__aside'],
  )
  assert.match(outside, /\.cybered-hero-identity__aside\s*\{\s*display:\s*none;\s*\}/)

  // Every hx selector inside must be gated on the data attribute.
  const inside = block.slice(block.indexOf('@media (min-width: 1024px)'))
  for (const sel of inside.match(/^\s*\.band-page-cybered[^{,]*/gim) || []) {
    assert.match(sel, /\[data-hx-mode=/, `ungated experiment selector: ${sel.trim()}`)
  }
  // No experiment rule may target a max-width / mobile breakpoint.
  assert.doesNotMatch(inside, /@media[^)]*max-width/)
})

test('improved full photo centers the name and never restyles the fade', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  const improved = cybered
    .slice(cybered.indexOf("data-hx-mode='improved'] .cybered-hero-photo"))
    .split('Option B')[0]
  assert.match(improved, /\[data-hx-fit='full'\] \.cybered-hero-identity/)
  assert.match(improved, /text-align:\s*center/)
  assert.match(improved, /\[data-hx-fit='full'\] \.cybered-hero-name/)
  assert.match(improved, /text-wrap:\s*balance/)
  assert.doesNotMatch(improved, /cybered-hero-fade/)
  assert.doesNotMatch(improved, /background-image:\s*linear-gradient/)
  // Fill Frame name alignment is not overridden.
  assert.doesNotMatch(
    improved.replace(/\[data-hx-fit='full'\][\s\S]*?cybered-hero-identity[\s\S]*?\}/, ''),
    /cybered-hero-identity\s*\{[^}]*text-align/,
  )
})

test('improved spacing is desktop-gated and collapses an empty intro', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  assert.match(cybered, /class="cybered-intro /)
  assert.match(cybered, /:data-hx-intro="heroExperimentIntroKind"/)
  assert.match(cybered, /\[data-hx-intro='none'\] \.cybered-main-sections/)
  assert.match(cybered, /heroExperimentPreview\.value\.name \|\| props\.band\?\.name/)
})

test('experiment attributes are absent in original mode', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  assert.match(cybered, /heroExperimentMode !== 'original' \? heroExperimentMode : undefined/)
  assert.match(cybered, /heroExperimentMode\.value === 'original' \? undefined :/)
})

/* ------------------------------------------------ dev + flag gating */

test('gate requires import.meta.dev AND the query flag', () => {
  const composable = read('composables/useHeroExperiment.js')
  assert.match(composable, /const isDev = Boolean\(import\.meta\.dev\)/)
  assert.match(composable, /isDev && flagged\.value/)
  assert.match(composable, /String\(value \?\? ''\) === '1'/)
})

/** Strip comments so prose about a field is not mistaken for using it. */
function code(rel) {
  return read(rel)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

test('experiment never calls the Band API or upload endpoints', () => {
  for (const rel of [
    'composables/useHeroExperiment.js',
    'utils/media/heroExperiment.js',
    'components/band/HeroExperimentPanel.vue',
  ]) {
    assert.doesNotMatch(
      code(rel),
      /\$fetch|useFetch|fetch\(|api\/bands|api\/upload|method:\s*['"](PUT|POST)/i,
      rel,
    )
  }
})

test('experiment does not write the canonical mobile fields or imageFit', () => {
  for (const rel of ['composables/useHeroExperiment.js', 'utils/media/heroExperiment.js']) {
    const src = code(rel)
    // layoutConfig must not be touched at all.
    assert.doesNotMatch(src, /layoutConfig/, rel)
    // Reading band.cyberedImagePositionX to seed is fine; emitting it as an
    // object key would mean building a write payload.
    assert.doesNotMatch(src, /^\s*cybered(Image)?(Position|Zoom)\w*\s*:/m, rel)
  }
  // The only place those fields are written stays the real editor, untouched.
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  assert.doesNotMatch(editor, /heroExperiment/i, 'editor must be untouched by the experiment')
})

/* ------------------------------------------------ local state */

test('desktop framing seeds once from mobile then stays independent', () => {
  const band = { slug: 'x', cyberedImagePositionX: 48, cyberedImagePositionY: 22, cyberedImageZoom: 1.06 }
  assert.deepEqual(seedDesktopFraming(band), { positionX: 48, positionY: 22, zoom: 1.06, fit: 'fill' })

  // stored desktop values win over mobile values
  const restored = normalizeHeroExperimentState(
    { mode: 'improved', desktop: { positionX: 10, positionY: 90, zoom: 1.5, fit: 'fill' } },
    band,
  )
  assert.deepEqual(restored.desktop, { positionX: 10, positionY: 90, zoom: 1.5, fit: 'fill' })
  assert.equal(restored.mode, 'improved')
})

test('full photo pins zoom to 1', () => {
  const band = { slug: 'x', cyberedImageZoom: 1.8 }
  const state = normalizeHeroExperimentState({ desktop: { fit: 'full', zoom: 1.9 } }, band)
  assert.equal(state.desktop.fit, 'full')
  assert.equal(state.desktop.zoom, 1)
  const style = getExperimentDesktopPhotoStyle({ fit: 'full', zoom: 1.9, positionX: 10, positionY: 90 })
  assert.equal(style.objectFit, 'contain')
  assert.equal(style.transform, 'none')
})

test('fill photo style matches the live cover contract', () => {
  const style = getExperimentDesktopPhotoStyle({ fit: 'fill', positionX: 48, positionY: 22, zoom: 1.06 })
  const live = getCyberedHeroPhotoStyle({ positionX: 48, positionY: 22, zoom: 1.06 })
  assert.equal(style.objectFit, 'cover')
  assert.equal(style.objectPosition, live.objectPosition)
  assert.equal(style.transform, live.transform)
  assert.equal(style.transformOrigin, live.transformOrigin)
})

test('editorial and panorama preserve the whole photograph', () => {
  for (const p of ['editorial', 'panorama']) {
    const style = getAdaptivePhotoStyle(p, { fit: 'fill', zoom: 2, positionX: 0, positionY: 0 })
    assert.equal(style.objectFit, 'contain', p)
    assert.equal(style.transform, 'none', p)
  }
})

test('storage key is scoped by artist and image identity', () => {
  const a = heroExperimentStorageKey({ slug: 'melissa', bandImg: { id: 7, url: '/u/a.jpg' } })
  const b = heroExperimentStorageKey({ slug: 'melissa', bandImg: { id: 8, url: '/u/b.jpg' } })
  const c = heroExperimentStorageKey({ slug: 'other', bandImg: { id: 7, url: '/u/a.jpg' } })
  assert.notEqual(a, b, 'replacing the photo must not inherit stale framing')
  assert.notEqual(a, c, 'different artists must not share framing')
  assert.equal(a, 'fq-hero-experiment:v1:melissa:/u/a.jpg')

  // Strapi v4 nested shape resolves to the same identity as the flat shape.
  assert.equal(
    heroExperimentStorageKey({ slug: 'melissa', bandImg: { data: { attributes: { url: '/u/a.jpg' } } } }),
    a,
  )
  // A node with no url must still differentiate photos, not collapse to one key.
  assert.notEqual(
    heroExperimentStorageKey({ slug: 'm', bandImg: { id: 7 } }),
    heroExperimentStorageKey({ slug: 'm', bandImg: { id: 8 } }),
  )
  assert.match(heroExperimentStorageKey({ slug: 'm' }), /:no-image$/)
})

test('normalizers reject junk', () => {
  assert.equal(normalizeHeroExperimentMode('nope'), 'original')
  assert.equal(normalizeHeroExperimentMode('ADAPTIVE'), 'adaptive')
  assert.equal(normalizeHeroExperimentFit('contain'), 'fill')
  assert.equal(normalizeHeroExperimentFit('FULL'), 'full')
  const s = normalizeHeroExperimentState('garbage', { slug: 'x' })
  assert.equal(s.mode, 'original')
  assert.equal(s.desktop.positionX, 50)
})

/* ------------------------------------------------ component integrity */

test('components compile and reuse existing building blocks', () => {
  const cybered = compiles('components/band/BandPageCybered.vue')
  compiles('components/band/HeroExperimentPanel.vue')
  // Reuses the real actions component, not a copy.
  assert.match(cybered, /import ArtistPageActions from '@\/components\/band\/ArtistPageActions\.vue'/)
  // Panel is dev-gated at the render site.
  assert.match(cybered, /v-if="heroExperimentEnabled"/)
  // Exactly one <h1> element. Count in the template only, comments stripped,
  // so prose about the heading is not counted as a heading.
  const { descriptor } = parse(cybered, { filename: 'BandPageCybered.vue' })
  const template = (descriptor.template?.content || '').replace(/<!--[\s\S]*?-->/g, '')
  assert.equal((template.match(/<h1[\s>]/g) || []).length, 1, 'exactly one h1 in the hero')
})

test('editorial swaps actions rather than exposing two', () => {
  const cybered = read('components/band/BandPageCybered.vue')
  assert.match(cybered, /cybered-actions-wrap--card/)
  assert.match(
    cybered,
    /\[data-hx-presentation='editorial'\] \.cybered-actions-wrap--card \{\s*display: none;/,
  )
  assert.match(cybered, /\.cybered-hero-identity__aside \{\s*display: none;\s*\}/)
})

test('panel controls are keyboard reachable', () => {
  const panel = read('components/band/HeroExperimentPanel.vue')
  assert.match(panel, /aria-expanded/)
  assert.match(panel, /aria-controls="fq-hx-body"/)
  assert.match(panel, /role="radiogroup"/)
  assert.match(panel, /focus-visible/)
  // native inputs only — no div-as-control
  assert.match(panel, /type="radio"/)
  assert.match(panel, /type="range"/)
})

console.log(`\ntest-hero-experiment: ok (${passed} tests)`)
