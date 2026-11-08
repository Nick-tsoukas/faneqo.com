/**
 * Homepage above-the-fold opening reveal — one motion owner, one entrance.
 * Run: node scripts/test-home-opening-reveal.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  homeRevealInFold,
  observeHomeScrollReveals,
  playHomeHeadquartersReveal,
  playHomeHeroReveal,
} from '../utils/ui/homeProductReveal.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

globalThis.window = { innerHeight: 800 }
globalThis.getComputedStyle = () => ({ getPropertyValue: () => '-24%' })

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

/** Records every tween a reveal schedules so we can assert the whole shape. */
function recorder() {
  const tweens = []
  const sets = []
  const timeline = {
    fromTo(target, from, to, position) {
      tweens.push({ target, from, to, position, duration: to.duration || 0 })
      return timeline
    },
    add(_fn, position) {
      tweens.push({ target: '(callback)', from: {}, to: {}, position, duration: 0 })
      return timeline
    },
  }
  return {
    tweens,
    sets,
    gsap: {
      timeline: () => timeline,
      set: (target, vars) => sets.push({ target, vars }),
    },
  }
}

function laterNode(kind, top) {
  return {
    kind,
    getAttribute: (attr) => (attr === 'data-reveal-later' ? kind : null),
    getBoundingClientRect: () => ({ top, bottom: top + 160 }),
  }
}

const HQ_NODES = {
  '.home-hq-kicker': 'kicker',
  '.home-hq-phrase': 'phrase',
  '.home-hq-word': 'word',
  '.home-hq-support': 'support',
  '[data-reveal="shell"]': 'shell',
  '[data-reveal="photo"]': 'photo',
  '[data-reveal="name"]': 'name',
  '[data-reveal="bio"]': 'bio',
  '[data-reveal="music"]': 'music',
  '[data-reveal="video"]': 'video',
  '.hero-profile-container': 'phone',
}

function makeScope(later = [], signals = []) {
  return {
    querySelector: (sel) => HQ_NODES[sel] ?? null,
    querySelectorAll: (sel) => {
      if (sel === '[data-reveal-later]') return later
      if (sel === '.hero-signal') return signals
      return []
    },
  }
}

function endsAt(tweens) {
  return tweens.reduce((max, t) => Math.max(max, t.position + t.duration), 0)
}

function targets(tweens) {
  return tweens.map((t) => t.target)
}

test('the HQ phone has one motion owner — nothing inside it animates separately', () => {
  const rec = recorder()
  playHomeHeadquartersReveal(rec.gsap, makeScope(), null)
  const hit = targets(rec.tweens)
  for (const inner of ['name', 'bio', 'music', 'video']) {
    assert.ok(
      !hit.includes(inner),
      `"${inner}" lives inside the phone and must not get its own opening beat`
    )
  }
  assert.ok(hit.includes('shell'))
  assert.ok(hit.includes('photo'))
})

test('the phone shell settles as one object inside the locked band', () => {
  const rec = recorder()
  playHomeHeadquartersReveal(rec.gsap, makeScope(), null)
  const shell = rec.tweens.find((t) => t.target === 'shell')
  assert.ok(shell.from.autoAlpha >= 0.88 && shell.from.autoAlpha <= 0.92)
  assert.ok(shell.from.y >= 8 && shell.from.y <= 12)
  assert.equal(shell.from.scale, 0.995)
  assert.equal(shell.from.x, undefined, 'no sideways drift — the phone is centred')
  assert.ok(shell.duration >= 0.38 && shell.duration <= 0.48)
  assert.equal(shell.to.autoAlpha, 1)
})

test('the hero photo scales without a second opacity fade', () => {
  const rec = recorder()
  playHomeHeadquartersReveal(rec.gsap, makeScope(), null)
  const photo = rec.tweens.find((t) => t.target === 'photo')
  assert.equal(photo.from.scale, 1.01)
  assert.equal(photo.from.autoAlpha, undefined)
  assert.equal(photo.to.autoAlpha, undefined)
  const shell = rec.tweens.find((t) => t.target === 'shell')
  assert.equal(photo.position, shell.position, 'photo and shell read as one object')
})

test('the whole mobile opening lands well inside the budget', () => {
  const rec = recorder()
  playHomeHeadquartersReveal(rec.gsap, makeScope(), null)
  assert.ok(endsAt(rec.tweens) <= 0.65, 'above-the-fold opening must stay under ~650ms')
})

test('modules already on screen keep their server-rendered state', () => {
  const inFold = laterNode('show', 420)
  const belowFold = laterNode('fans', 1400)
  assert.equal(homeRevealInFold(inFold, 28), true)
  assert.equal(homeRevealInFold(belowFold, 28), false)

  const rec = recorder()
  playHomeHeadquartersReveal(rec.gsap, makeScope([inFold, belowFold]), null)
  const staged = rec.sets.filter((s) => s.vars.autoAlpha === 0).map((s) => s.target.kind)
  assert.deepEqual(staged, ['fans'], 'only off-screen modules may be hidden after paint')
})

test('the scroll observer only watches what was actually staged', () => {
  const inFold = laterNode('show', 420)
  const belowFold = laterNode('fans', 1400)
  const observed = []
  globalThis.IntersectionObserver = class {
    observe(el) {
      observed.push(el.kind)
    }
    unobserve() {}
    disconnect() {}
  }
  observeHomeScrollReveals(recorder().gsap, makeScope([inFold, belowFold]))
  assert.deepEqual(observed, ['fans'], 'observing an unstaged element re-hides visible content')
  delete globalThis.IntersectionObserver
})

test('the desktop hero phone reveals once', () => {
  const signals = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]
  const rec = recorder()
  playHomeHeroReveal(rec.gsap, makeScope([], signals))
  const hit = targets(rec.tweens)
  assert.ok(!hit.includes('name'), 'the artist name arrives with the phone, not after it')

  const phone = rec.tweens.find((t) => t.target === 'phone')
  assert.ok(phone.from.autoAlpha >= 0.88 && phone.from.autoAlpha <= 0.92)
  assert.ok(phone.from.y >= 8 && phone.from.y <= 12)
  assert.equal(phone.from.scale, 0.995)
  assert.equal(phone.from.x, undefined)

  for (const signal of rec.tweens.filter((t) => signals.includes(t.target))) {
    assert.ok(signal.from.autoAlpha > 0, 'CSS paints signals visible — never snap them to 0')
  }
  assert.ok(endsAt(rec.tweens) <= 0.65)
})

test('neither homepage phone starts the showcase wake sequence', () => {
  for (const file of [
    'components/home/HomeHeadquartersSection.vue',
    'components/home/HomeHeroSection.vue',
  ]) {
    const src = read(file)
    assert.match(src, /DemoArtistProfileShowcase/)
    assert.doesNotMatch(
      src,
      /wake-up|wakeUp|wake-variant|wakeVariant/,
      `${file} must not add a child wake sequence on top of the GSAP reveal`
    )
  }
})

test('reduced motion skips the reveal entirely and leaves the settled state', () => {
  const hq = read('components/home/HomeHeadquartersSection.vue')
  assert.match(hq, /if \(homePrefersReducedMotion\(\)\) \{\s*\n\s*played = true\s*\n\s*return/)
  const hero = read('components/home/HomeHeroSection.vue')
  assert.match(hero, /if \(homePrefersReducedMotion\(\)\) return/)
})

console.log(`\nhome-opening-reveal: ${passed} tests passed`)
