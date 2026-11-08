/**
 * Flagship deck motion guards (the fixes from the 2026-11 motion audit):
 *   - scene timelines are built paused and start after the scene has painted
 *     and its photographs are decoded (capped), so an entrance never begins
 *     part-way through because of the mount frame
 *   - an unmounted scene never starts playing
 *   - the viewer prefetches neighbouring scenes' code
 *   - the selected support chip's pulse is not cut by another tween's transform clear
 * Run: node scripts/test-deck-motion-start.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

const motion = read('corvana/decks/motion/useSceneMotion.js')
const viewer = read('pages/corvana/decks/[id].vue')

test('timelines are built paused and played after paint + decode', () => {
  assert.match(motion, /gsap\.timeline\(\{ paused: true/)
  assert.match(motion, /Promise\.race\(\[decoded\(root\), wait\(DECODE_CAP_MS\)\]\)/)
  assert.match(motion, /\.then\(afterPaint\)/)
  assert.match(motion, /tl\.play\(0\)/)
  assert.match(motion, /const DECODE_CAP_MS = \d+/)
  assert.ok(Number(motion.match(/DECODE_CAP_MS = (\d+)/)[1]) <= 1000, 'decode cap stays short')
})

test('an unmounted scene never starts', () => {
  assert.match(motion, /if \(ctx !== live\) return/)
  assert.match(motion, /onBeforeUnmount\(\(\) => \{\s*ctx\?\.revert\(\)\s*ctx = null/)
})

test('reduced motion still skips the timeline', () => {
  assert.match(motion, /prefers-reduced-motion: reduce/)
  assert.match(motion, /if \(reduce\) return/)
})

test('viewer prefetches neighbouring scenes and transitions only opacity/transform', () => {
  assert.match(viewer, /function prefetchNeighbours\(index\)/)
  assert.match(viewer, /__asyncLoader\?\.\(\)/)
  assert.match(viewer, /watch\(currentSlideIndex, prefetchNeighbours\)/)
  assert.match(viewer, /transition: opacity 0\.3s ease, transform 0\.3s ease;/)
  assert.doesNotMatch(viewer, /transition: all 0\.3s ease/)
  assert.match(viewer, /mode="out-in"/)
})

test('support chips keep their transform for the selection pulse', () => {
  const support = read('corvana/decks/FaneqoSupportSlide.vue')
  assert.match(support, /fq-pay__amounts span'\), 1\.6, \{[^}]*clearProps: 'visibility'/)
})

console.log(`\n${passed} passed`)
