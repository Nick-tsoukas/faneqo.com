/**
 * RockSnaps create-page preference.
 *
 * The checkbox defaults ON for an eligible band. The database default stays
 * false. A stored OFF survives a resumed draft. A restricted audience cannot
 * publish to RockSnaps, and returning to Everyone restores the stored choice.
 *
 * Run: node scripts/test-rocksnaps-create.mjs
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  clearRocksnapsCreatePreference,
  readRocksnapsCreatePreference,
  rocksnapsCreateState,
  writeRocksnapsCreatePreference,
} from '../utils/galleries/rocksnapsCreate.js'
import { rocksnapsOverviewLabel } from '../utils/galleries/rocksnapsOverview.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function memoryStorage(seed = {}) {
  const data = { ...seed }
  return {
    getItem(key) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null },
    setItem(key, value) { data[key] = String(value) },
    removeItem(key) { delete data[key] },
    data,
  }
}

test('a new draft defaults ON and an explicit OFF survives the same session', () => {
  const storage = memoryStorage()
  assert.equal(readRocksnapsCreatePreference(storage, 'sess-a'), true)
  writeRocksnapsCreatePreference(storage, 'sess-a', false)
  assert.equal(readRocksnapsCreatePreference(storage, 'sess-a'), false)
  assert.equal(readRocksnapsCreatePreference(storage, 'sess-b'), true)
  writeRocksnapsCreatePreference(storage, 'sess-a', true)
  assert.equal(readRocksnapsCreatePreference(storage, 'sess-a'), true)
  clearRocksnapsCreatePreference(storage, 'sess-a')
  assert.equal(readRocksnapsCreatePreference(storage, 'sess-a'), true)
})

test('public ON publishes to RockSnaps and OFF or a restricted audience does not', () => {
  const on = rocksnapsCreateState({
    eligible: true,
    preference: true,
    visibility: 'public',
    selectedVisibility: 'public',
  })
  assert.equal(on.visible, true)
  assert.equal(on.pressed, true)
  assert.equal(on.shouldEnable, true)
  assert.equal(on.blockedReason, '')

  const off = rocksnapsCreateState({
    eligible: true,
    preference: false,
    visibility: 'public',
    selectedVisibility: 'public',
  })
  assert.equal(off.pressed, false)
  assert.equal(off.shouldEnable, false)
  assert.equal(off.disabled, false)

  for (const audience of ['fan_list', 'show_attendees']) {
    const blocked = rocksnapsCreateState({
      eligible: true,
      preference: true,
      visibility: audience,
      selectedVisibility: audience,
    })
    assert.equal(blocked.pressed, false)
    assert.equal(blocked.disabled, true)
    assert.equal(blocked.shouldEnable, false)
    assert.match(blocked.blockedReason, /Everyone/)
  }

  const unsavedFans = rocksnapsCreateState({
    eligible: true,
    preference: true,
    visibility: 'public',
    selectedVisibility: 'fan_list',
  })
  assert.equal(unsavedFans.pressed, false)
  assert.equal(unsavedFans.shouldEnable, false)

  const restored = rocksnapsCreateState({
    eligible: true,
    preference: true,
    visibility: 'public',
    selectedVisibility: 'public',
  })
  assert.equal(restored.pressed, true)
  assert.equal(restored.shouldEnable, true)
})

test('another band never sees the control or an automatic enable', () => {
  const other = rocksnapsCreateState({
    eligible: false,
    preference: true,
    visibility: 'public',
    selectedVisibility: 'public',
  })
  assert.equal(other.visible, false)
  assert.equal(other.shouldEnable, false)
})

test('the gallery create page asks the backend and keeps the database default off', () => {
  const page = read('pages/galleries/new.vue')
  const composer = read('components/updates/ArtistUpdateComposer.vue')
  const updates = read('pages/updates/new.vue')
  assert.match(page, /rocksnaps/)
  /* The publish reveal shows the RockSnaps status the page passes in. */
  assert.ok(page.includes(':rocksnaps="published.rocksnapsEnabled === true"'), 'page passes the RockSnaps status to the reveal')
  assert.ok(read('components/galleries/GalleryPublishReveal.vue').includes('<p v-if="rocksnaps" class="reveal__aside">Showing on RockSnaps.</p>'), 'reveal shows the RockSnaps status')
  assert.doesNotMatch(updates, /rocksnaps/)
  assert.match(composer, /getRocksnapsCapability/)
  assert.match(composer, /setRocksnapsPublication/)
  assert.match(composer, /Automatically display this gallery on rocksnaps.com when published/)
  assert.match(composer, /This gallery is published on Faneqo, but it was not enabled for RockSnaps/)
  assert.match(composer, /Open gallery editor/)
  assert.match(composer, /v-if="rocksnapsState\.visible"/)
  const publishAt = composer.indexOf('await finishRocksnapsAfterPublish')
  const patchAt = composer.indexOf('await setRocksnapsPublication(row.id, true)')
  const successAt = composer.indexOf('rocksnapsEnabled: true')
  assert.ok(publishAt > 0 && patchAt > publishAt && successAt > patchAt)
  // The database default lives in the backend repo. Check it when the sibling
  // checkout exists (local workspace); CI for this repo checks out only the
  // frontend, and qrserver's own scripts/test-rocksnaps-contract.js owns it there.
  const schemaPath = resolve(root, '../../qrserver/src/api/artist-update/content-types/artist-update/schema.json')
  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, 'utf8')
    assert.match(schema, /"showOnRockSnaps":\s*\{[^}]*"default":\s*false/s)
  } else {
    console.log('  --  backend schema not checked out here; default-off is covered by qrserver tests')
  }
  assert.doesNotMatch(composer, /ROCKSNAPS_BAND_ID/)
  assert.doesNotMatch(page, /ROCKSNAPS_BAND_ID/)
})

test('the gallery overview labels RockSnaps from the server and adds no toggle', () => {
  assert.equal(rocksnapsOverviewLabel({ rocksnaps: { onRockSnaps: true } }), 'On RockSnaps')
  assert.equal(rocksnapsOverviewLabel({ rocksnaps: { onRockSnaps: false } }), 'Not on RockSnaps')
  assert.equal(rocksnapsOverviewLabel({ slug: 'rocksnapsphotography', showOnRockSnaps: true }), '')
  assert.equal(rocksnapsOverviewLabel({}), '')

  const item = read('components/galleries/FaneqoGalleryArchiveItem.vue')
  const index = read('pages/galleries/index.vue')
  assert.match(item, /rocksnapsOverviewLabel/)
  assert.match(item, /Show on artist page/)
  assert.doesNotMatch(item, /aria-pressed/)
  assert.doesNotMatch(item, /setRocksnapsPublication/)
  assert.doesNotMatch(index, /rocksnapsphotography/)
  assert.doesNotMatch(index, /ROCKSNAPS_BAND_ID/)
})

test('the create composer still compiles', () => {
  const source = read('components/updates/ArtistUpdateComposer.vue')
  const { descriptor, errors } = parse(source, { filename: 'ArtistUpdateComposer.vue' })
  assert.deepEqual(errors, [])
  const script = compileScript(descriptor, { id: 'auc', filename: 'ArtistUpdateComposer.vue' })
  assert.match(script.content, /loadRocksnapsCapability/)
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: 'ArtistUpdateComposer.vue',
    id: 'auc',
  })
  assert.deepEqual(template.errors, [])
})

console.log(`${passed} passed`)
