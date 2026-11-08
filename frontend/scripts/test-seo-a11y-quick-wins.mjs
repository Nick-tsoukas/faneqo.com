/**
 * Small SEO / accessibility guards:
 *   - layouts allow pinch-zoom (WCAG 1.4.4)
 *   - the homepage title is not suffixed with the brand twice
 *   - band OG images use a stable version, never the request time
 * Run: node scripts/test-seo-a11y-quick-wins.mjs
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

test('layouts do not disable zoom', () => {
  for (const rel of ['layouts/default.vue', 'layouts/auth.vue', 'layouts/agency.vue']) {
    assert.ok(!/user-scalable\s*=\s*no/.test(read(rel)), `${rel} disables zoom`)
    assert.ok(!/maximum-scale\s*=\s*1(\.0)?\b/.test(read(rel)), `${rel} caps zoom`)
  }
})

test('homepage title skips the site title template', () => {
  const src = read('utils/home/homepageContent.js')
  assert.ok(/title: 'Faneqo \|/.test(src))
  assert.ok(/titleTemplate: '%s'/.test(src))
})

test('band OG image version never falls back to the request time', () => {
  for (const rel of ['pages/[bandSlug]/index.vue', 'pages/share/band/[bandSlug].vue']) {
    const src = read(rel)
    const line = src.split('\n').find((l) => /CacheVersion = computed|cacheVersion = computed/.test(l))
    assert.ok(line, `${rel}: version computed missing`)
    assert.ok(!/Date\.now\(\)/.test(line), `${rel}: uses Date.now()`)
  }
})

console.log(`\n${passed} passed`)
