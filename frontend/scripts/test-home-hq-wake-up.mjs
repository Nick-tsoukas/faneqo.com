/**
 * Mobile headquarters mockup wake-up tokens.
 * Run: node scripts/test-home-hq-wake-up.mjs
 */
import assert from 'node:assert/strict'
import {
  HOME_HERO_WAKE,
  HOME_HQ_WAKE,
  homeHeroFrameMotion,
  homeHeroImageMotion,
  homeHeroMusicMotion,
  homeHeroPhoneMotion,
  homeHeroTitleMotion,
  homeHeroWakeMusicDelay,
  homeHeroWakeSettleStart,
} from '../utils/ui/homeHeroWakeUp.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('phone entrance matches the requested settle, not a 3D gimmick', () => {
  const motion = homeHeroPhoneMotion(false, HOME_HQ_WAKE)
  assert.equal(motion.initial.opacity, 0)
  assert.equal(motion.initial.y, 16)
  assert.equal(motion.initial.scale, 0.985)
  assert.equal(motion.initial.rotate, undefined)
  assert.ok(motion.transition.duration >= 0.45)
  assert.ok(motion.transition.duration <= 0.65)
  assert.ok(motion.transition.delay <= 0.28)
})

test('mobile clip and hero settle are tighter than the desktop hero phone', () => {
  assert.ok(HOME_HQ_WAKE.clipHeightMobile < HOME_HERO_WAKE.clipHeightMobile)
  assert.ok(HOME_HQ_WAKE.clipHeightMobile >= 480)
  assert.ok(HOME_HQ_WAKE.clipHeightMobile <= 540)
  assert.ok(HOME_HQ_WAKE.settledHeight < HOME_HQ_WAKE.arrivalHeight)
  assert.ok(HOME_HQ_WAKE.settledHeight < HOME_HERO_WAKE.settledHeight)
  assert.ok(HOME_HQ_WAKE.arrivalHeight < HOME_HERO_WAKE.arrivalHeight)
  const arrival = homeHeroFrameMotion(false, false, HOME_HQ_WAKE)
  const settled = homeHeroFrameMotion(false, true, HOME_HQ_WAKE)
  assert.equal(arrival.animate.height, `${HOME_HQ_WAKE.arrivalHeight}px`)
  assert.equal(settled.animate.height, `${HOME_HQ_WAKE.settledHeight}px`)
})

test('hero image crop tightens only after settle', () => {
  const open = homeHeroImageMotion(false, false, HOME_HQ_WAKE)
  const tight = homeHeroImageMotion(false, true, HOME_HQ_WAKE)
  assert.equal(open.animate.scale, HOME_HQ_WAKE.imageScaleFrom)
  assert.equal(tight.animate.scale, HOME_HQ_WAKE.imageScaleTo)
  assert.ok(HOME_HQ_WAKE.imageScaleTo > HOME_HQ_WAKE.imageScaleFrom)
  assert.ok(HOME_HQ_WAKE.imageScaleTo <= 1.06)
})

test('reduced motion jumps to the settled product view', () => {
  const frame = homeHeroFrameMotion(true, false, HOME_HQ_WAKE)
  const phone = homeHeroPhoneMotion(true, HOME_HQ_WAKE)
  const music = homeHeroMusicMotion(true, HOME_HQ_WAKE)
  const title = homeHeroTitleMotion(true, false, HOME_HQ_WAKE)
  const image = homeHeroImageMotion(true, false, HOME_HQ_WAKE)
  assert.equal(frame.animate.height, `${HOME_HQ_WAKE.settledHeight}px`)
  assert.equal(frame.transition.duration, 0)
  assert.equal(phone.initial.opacity, 1)
  assert.equal(music.initial.opacity, 1)
  assert.equal(title.animate.y, -HOME_HQ_WAKE.titleShift)
  assert.equal(image.animate.scale, HOME_HQ_WAKE.imageScaleTo)
})

test('headquarters sequence finishes faster than the desktop hero', () => {
  const hqSettle = homeHeroWakeSettleStart(HOME_HQ_WAKE)
  const heroSettle = homeHeroWakeSettleStart()
  assert.ok(hqSettle < heroSettle)
  assert.ok(hqSettle >= 0.85)
  assert.ok(hqSettle <= 1.15)
  assert.equal(HOME_HQ_WAKE.playCueDuration, 0)
  assert.ok(homeHeroWakeMusicDelay(HOME_HQ_WAKE) > hqSettle)
})

console.log(`\nhome-hq-wake-up: ${passed} tests passed`)
