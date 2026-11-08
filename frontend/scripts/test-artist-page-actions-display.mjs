/**
 * Artist Page website label + action dock contracts.
 * Run: node scripts/test-artist-page-actions-display.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { displayWebsiteLabel } from '../utils/displayWebsiteLabel.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')
const page = read('components/band/BandPageCybered.vue')
const publication = read('components/publication/PublicationCyberedLayout.vue')
const actions = read('components/band/ArtistPageActions.vue')
const fanCapture = read('components/band/FanCaptureSection.vue')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('website display strips protocol, www, and trailing slash', () => {
  assert.equal(displayWebsiteLabel('https://www.rockdamag.com/'), 'rockdamag.com')
  assert.equal(displayWebsiteLabel('http://rocksnaps.com/'), 'rocksnaps.com')
  assert.equal(displayWebsiteLabel('https://www.example.com/'), 'example.com')
})

test('website display keeps meaningful path and strips query/hash', () => {
  assert.equal(displayWebsiteLabel('https://artist.com/store'), 'artist.com/store')
  assert.equal(displayWebsiteLabel('https://artist.com/store/'), 'artist.com/store')
  assert.equal(displayWebsiteLabel('https://artist.com/store?ref=1#top'), 'artist.com/store')
  assert.equal(
    displayWebsiteLabel('https://lesliemendelson.com/', 'lesliemendelson.com?utm_source=chatgpt.com'),
    'lesliemendelson.com'
  )
  assert.equal(
    displayWebsiteLabel('https://lesliemendelson.com?utm_source=chatgpt.com'),
    'lesliemendelson.com'
  )
})

test('custom non-URL labels win; malformed values fail gracefully', () => {
  assert.equal(displayWebsiteLabel('https://www.rockdamag.com/', 'Visit us'), 'Visit us')
  assert.equal(displayWebsiteLabel('not a url'), 'not a url')
})

test('cybered artist page renders custom buttons outside publication mode', () => {
  assert.match(page, /visibleCustomButtons\.length > 0/)
  assert.match(page, /cybered-custom-links-section/)
  assert.match(page, /onCustomButtonClick/)
  assert.match(page, /:custom-buttons="customButtons"/)
  assert.match(page, /filter\(\(button\) => button\.url\)/)
  const streamingAt = page.indexOf('cybered-streaming-section')
  const socialAt = page.indexOf('cybered-social-section')
  const eventHubsAt = page.indexOf('Event Hubs')
  const customAt = page.indexOf('cybered-custom-links-section')
  assert.ok(customAt > streamingAt && customAt > socialAt && customAt > eventHubsAt, 'custom links come after the other button groups')
})

test('href and action emits stay on the original contracts', () => {
  assert.match(page, /:href="band\.websitelink"/)
  assert.match(page, /displayWebsiteLabel\(band\.websitelink, band\.websitelinktext\)/)
  assert.match(publication, /:href="band\.websitelink"/)
  assert.match(publication, /displayWebsiteLabel\(band\.websitelink, band\.websitelinktext\)/)
  assert.match(actions, /@click="onFollowClick"/)
  assert.match(actions, /@click="\$emit\('message'\)"/)
  assert.match(actions, /@click="\$emit\('share'\)"/)
  assert.match(actions, /grid-template-areas: 'message follow share'/)
})

test('fan-list module is not part of this pass', () => {
  assert.match(fanCapture, /joinArtistFanList/)
})

console.log(`test-artist-page-actions-display: ${passed} passed`)
