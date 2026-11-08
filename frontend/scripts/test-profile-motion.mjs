/**
 * Cybered profile motion token tests.
 * Run: node scripts/test-profile-motion.mjs
 */
import assert from 'node:assert/strict'
import {
  PROFILE_DURATION,
  PROFILE_HERO_SCALE,
  isReducedMotion,
  profileFirstContentMotion,
  profileHeroIdentityMotion,
  profileHeroImageMotion,
  profileHeroMetaMotion,
  profileSectionMotion,
} from '../utils/ui/profileMotion.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('reduced motion strips scale and travel', () => {
  assert.equal(isReducedMotion('reduce'), true)
  assert.equal(isReducedMotion('no-preference'), false)

  const hero = profileHeroImageMotion(true)
  assert.equal(hero.initial.scale, 1)
  assert.equal(hero.animate.scale, 1)
  assert.equal(hero.transition.duration, 0)

  const name = profileHeroIdentityMotion(true)
  assert.equal(name.initial.y, 0)
  assert.equal(name.initial.opacity, 1)

  const section = profileSectionMotion(true, 0.4)
  assert.equal(section.initial.y, 0)
  assert.equal(section.animate.opacity, 1)
})

test('cinematic variants stay short and non-springy', () => {
  const hero = profileHeroImageMotion(false)
  assert.equal(hero.initial.scale, PROFILE_HERO_SCALE)
  assert.ok(hero.initial.scale <= 1.03)
  assert.equal(hero.transition.duration, PROFILE_DURATION.hero)
  assert.ok(hero.transition.duration <= 0.6)
  assert.ok(!hero.transition.type)

  const name = profileHeroIdentityMotion(false)
  assert.equal(name.transition.delay, 0.09)
  assert.ok(name.initial.y <= 12)

  const meta = profileHeroMetaMotion(false)
  assert.ok(meta.transition.delay > name.transition.delay)

  const content = profileFirstContentMotion(false)
  assert.ok(content.transition.delay > meta.transition.delay)
  assert.ok(content.transition.delay + content.transition.duration < 0.85)
})

test('section reveal is quieter than the hero', () => {
  const section = profileSectionMotion(false)
  assert.ok(section.transition.duration < PROFILE_DURATION.hero)
  assert.ok(section.initial.y <= 14)
  assert.equal(section.initial.scale, undefined)
})

console.log(`\nprofile-motion: ${passed} tests passed`)
