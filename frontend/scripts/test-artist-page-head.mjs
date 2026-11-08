/**
 * Artist page <head> is server-rendered from the artist's name and bio, so
 * shared links and crawlers don't show the URL slug ("939waby").
 * Run: node scripts/test-artist-page-head.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript } from '@vue/compiler-sfc'
import { pickArtistHeadFields } from '../utils/band/artistPageHead.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('keeps only the head fields from the public band payload', () => {
  const head = pickArtistHeadFields({
    data: { name: '93.9 WABY', slug: '939waby', bio: "Albany's Rock Station", genre: 'Rock', city: 'Albany', updatedAt: '2026-10-28T10:00:00Z', paymentButtons: [{}], songs: [1, 2] },
  })
  assert.deepEqual(head, { name: '93.9 WABY', bio: "Albany's Rock Station", genre: 'Rock', location: 'Albany', updatedAt: '2026-10-28T10:00:00Z' })
})

test('prefers description over bio, and reads Strapi attributes shape', () => {
  assert.equal(pickArtistHeadFields({ data: { name: 'A', description: 'desc', bio: 'bio' } }).bio, 'desc')
  assert.equal(pickArtistHeadFields({ data: { attributes: { name: 'Emerge' } } }).name, 'Emerge')
})

test('missing band, failed fetch or nameless band gives null (page falls back to the slug)', () => {
  assert.equal(pickArtistHeadFields(null), null)
  assert.equal(pickArtistHeadFields({}), null)
  assert.equal(pickArtistHeadFields({ data: { slug: 'x' } }), null)
})

test('band page fetches head fields during SSR and uses them for title, description and preview', () => {
  const rel = 'pages/[bandSlug]/index.vue'
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: rel, filename: rel }).content
  assert.match(script, /useAsyncData\(\s*`artist-head-\$\{headSlug\}`/)
  assert.match(script, /transform: pickArtistHeadFields, server: true/)
  assert.match(script, /\.catch\(\(\) => null\)/, 'a failed head fetch never breaks the page')
  assert.match(script, /headBand = computed\(\(\) => band\.value\?\.data \|\| serverHead\.value \|\| \{\}\)/)
  assert.match(script, /ogBandName = computed\(\(\) => headBand\.value\.name \|\| currentBandSlug\.value\)/)
  assert.match(script, /const d = headBand\.value/)
})

console.log(`\n${passed} passed`)
