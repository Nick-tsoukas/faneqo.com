/**
 * Search results link only when the caller asks them to.
 * Header search keeps artist-page links. Messages search selects an artist.
 * Run: node scripts/test-band-search-result-action.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  const script = compileScript(descriptor, { id: rel, filename: rel })
  assert.ok(script.content, `${rel} script compiled`)
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  return { source, script: script.content, template: descriptor.template.content }
}

function sliceBetween(source, start, end) {
  const from = source.indexOf(start)
  assert.ok(from >= 0, `missing start: ${start}`)
  const to = source.indexOf(end, from + start.length)
  assert.ok(to > from, `missing end: ${end}`)
  return source.slice(from, to)
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const card = compileSfc('components/BandSearchCard.vue')
const modal = compileSfc('components/BandSearchModal.vue')
const messages = compileSfc('components/messages/FanMessagesHome.vue')
const header = compileSfc('components/Header.vue')
const request = read('composables/useFanMessageRequest.js')

test('linked results stay a real artist-page link', () => {
  assert.match(card.script, /linkResults:\s*\{[^}]*default:\s*true/s)
  assert.match(card.template, /:is="linkResults \? 'NuxtLink' : 'button'"/)
  assert.match(card.template, /:to="linkResults \? `\/\$\{band\.slug\}` : undefined"/)
  assert.match(card.template, /@click="\$emit\('select', band\)"/)
  assert.doesNotMatch(card.template, /@click\.prevent/)
  assert.match(card.template, /w-full text-left/)
})

test('action results are a button and do not navigate', () => {
  assert.match(card.template, /:type="linkResults \? undefined : 'button'"/)
  assert.doesNotMatch(card.template, /<NuxtLink/)
  const buttonBranch = card.template
  assert.match(buttonBranch, /'button'/)
  assert.equal(buttonBranch.includes('.prevent'), false)
})

test('modal defaults to links and passes the flag through', () => {
  assert.match(modal.script, /linkResults:\s*\{[^}]*default:\s*true/s)
  assert.match(modal.template, /:link-results="linkResults"/)
  assert.match(modal.script, /function onBandSelect\(band\) \{\s*emit\('select', band\)\s*close\(\)/)
  const keys = sliceBetween(modal.script, 'function handleKeydown', 'onMounted')
  assert.match(keys, /onBandSelect\(results\.value\[selectedIndex\.value\]\)/)
  assert.doesNotMatch(keys, /router\.|navigateTo|band\.slug/)
})

test('header search still links and navigates on select', () => {
  const usage = sliceBetween(header.template, '<!-- Band Search Modal -->', '</client-only>')
  assert.match(usage, /<BandSearchModal/)
  assert.doesNotMatch(usage, /link-results/)
  assert.match(header.script, /function onBandSelect\(band\) \{\s*router\.push\(`\/\$\{band\.slug\}`\)/)
})

test('messages search selects an artist and stays on Messages', () => {
  const usage = sliceBetween(messages.template, '<BandSearchModal', '/>')
  assert.match(usage, /:link-results="false"/)
  assert.match(usage, /@select="onPickArtist"/)
  assert.match(usage, /heading="Message an artist"/)
  const pick = sliceBetween(messages.script, 'async function onPickArtist', 'function onMessageContinueFree')
  assert.match(pick, /beginArtistRequest\(/)
  assert.match(pick, /bandSlug: band\.slug/)
  assert.doesNotMatch(pick, /router\.|navigateTo\(`\/\$\{/)
  assert.match(messages.template, /<FanMessageRequestSheet/)
})

test('request sheet branches are unchanged', () => {
  const tap = sliceBetween(request, 'async function onMessageTap', 'async function beginArtistRequest')
  assert.match(tap, /openSheet\('pending'\)/)
  assert.match(tap, /openSheet\('name'\)/)
  assert.match(tap, /openSheet\('compose'\)/)
  assert.match(tap, /navigateTo\(`\/fan\/messages\/\$\{status\.value\.conversationId\}`\)/)
  const begin = sliceBetween(request, 'async function beginArtistRequest', 'async function sendAuthLink')
  assert.match(begin, /await loadStatus\(bandId\)/)
  assert.match(begin, /await onMessageTap\(/)
  assert.doesNotMatch(begin, /router\.|\/\$\{bandSlug\}/)
})

console.log(`\n${passed} band-search result tests passed`)
