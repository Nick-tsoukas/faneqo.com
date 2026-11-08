/**
 * Show Mode + Nights product pass.
 * Run: node scripts/test-show-mode-nights-pass.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  groupNightsByYear,
  nightHistoryEyebrow,
  nightHistoryStatsLine,
  nightHistoryTeaserUrl,
  nightHistoryTitle,
  NIGHTS_ALIAS_PATH,
  NIGHTS_LIST_PATH,
} from '../utils/nights/nightHistory.js'
import { artistWorldReturnLabel } from '../utils/nights/artistWorldReturn.js'
import { isFaneqoAppPath } from '../utils/ui/appSurface.js'
import { resolveShowModeUiState } from '../utils/show-mode/showModeUiState.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const filename = path.basename(rel)
  const { descriptor, errors } = parse(source, { filename })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    compileScript(descriptor, { id: filename, filename })
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename,
      id: filename,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

const card = read('components/dashboard/ShowModeCard.vue')
const sheet = read('components/dashboard/show-mode/ShowModeSetupSheet.vue')
const recent = read('components/dashboard/show-mode/LatestShowRecapPanel.vue')
const nights = read('pages/fans/recaps/index.vue')
const row = read('components/nights/NightHistoryRow.vue')
const recapPage = read('pages/fans/recaps/[id].vue')
const fixture = read('pages/__dev/show-mode.vue')
const nightsFixture = read('pages/__dev/nights.vue')

compileSfc('components/dashboard/ShowModeCard.vue')
compileSfc('components/dashboard/show-mode/ShowModeSetupSheet.vue')
compileSfc('components/dashboard/show-mode/LatestShowRecapPanel.vue')
compileSfc('components/nights/NightHistoryRow.vue')
compileSfc('pages/fans/recaps/index.vue')
compileSfc('pages/__dev/show-mode.vue')
compileSfc('pages/__dev/nights.vue')

// DASHBOARD
assert.match(card, /Playing tonight\?/)
assert.match(card, /v-if="isFirstTime"/)
assert.match(card, /LatestShowRecapPanel/)
assert.match(recent, /Last show/)
assert.match(recent, /View recap/)
assert.match(recent, /View all Nights/)
assert.match(recent, /to="\/nights"/)
assert.equal(resolveShowModeUiState({
  status: { status: 'live', enabled: true },
  recapState: 'ready',
  recapAlertVisible: true,
}), 'live')

// SETUP
assert.match(sheet, /Set up tonight/)
assert.match(sheet, /Prepare the Night before fans arrive/)
assert.match(sheet, /Where/)
assert.match(sheet, /When/)
assert.match(sheet, /Night details/)
assert.match(sheet, /type="datetime-local"/)
assert.match(sheet, /performanceStartsAt/)
assert.match(sheet, /coverMediaId/)
assert.match(sheet, /Start Show Mode/)
assert.match(sheet, /lockOverlayScroll/)
assert.match(sheet, /useFocusTrap/)
assert.match(sheet, /min\(44rem/)
assert.match(sheet, /100dvh/)
assert.match(sheet, /sms__pair/)
assert.match(sheet, /grid-template-columns: 1fr 1fr/)
assert.match(sheet, /Change photo/)
assert.match(sheet, /A photo from tonight/)
assert.match(sheet, /Uploading/)
assert.match(sheet, /font-size: 16px/)
assert.match(sheet, /min-height: 48px/)
assert.match(sheet, /safe-area-inset-bottom/)
assert.doesNotMatch(sheet, /width: min\(28rem/)

// LIVE
assert.match(card, /live__kicker/)
assert.match(card, /\bLIVE\b/)
assert.match(card, /checked in/)
assert.match(card, /new fans/)
assert.match(card, /Ends \{\{ endsLabel \}\}/)
assert.match(card, /Open Live View/)
assert.match(card, /End Show\?/)
assert.match(card, /Keep Show Live/)
assert.match(card, /Fan check-in closes/)
assert.match(card, /Faneqo prepares your Night/)
assert.match(card, /lockOverlayScroll\(END_LOCK\)/)
assert.match(card, /useFocusTrap/)

// AFTER
assert.match(card, /Preparing your Night/)
assert.match(card, /We're collecting attendance, fan activity and show details/)
assert.match(card, /Your Night is ready/)
assert.match(card, /View Night/)
assert.match(card, /maybeStartRecapAfterAutoEnd/)
assert.match(card, /Your Night is still being prepared/)
assert.match(card, /Try again/)

// HISTORY
assert.match(nights, />Nights</)
assert.match(nights, /Your shows, remembered/)
assert.match(nights, /alias: \['\/nights'\]/)
assert.match(nights, /No Nights yet/)
assert.match(nights, /When you use Show Mode, your Nights will live here/)
assert.match(nights, /Set up tonight/)
assert.match(nights, /getRecaps/)
assert.match(nights, /groupNightsByYear/)
assert.match(nights, /NightHistoryRow/)
assert.match(row, /View Night/)
assert.match(row, /Edit Night/)
assert.match(row, /Preview fan view/)
assert.match(row, /Share photos/)
assert.match(row, /Message attendees/)
assert.match(row, /nightHistoryTeaserUrl/)
assert.match(row, /:loading="lazy \? 'lazy' : 'eager'"/)
assert.match(recapPage, /label: 'Nights'/)
assert.match(read('components/dashboard/fans/ShowRecapDetailContent.vue'), /query\.edit/)
assert.doesNotMatch(nights, /linear-gradient\(135deg, #1a1a2e/)
assert.doesNotMatch(nights, /from-purple-600/)

assert.equal(NIGHTS_LIST_PATH, '/fans/recaps')
assert.equal(NIGHTS_ALIAS_PATH, '/nights')
assert.equal(isFaneqoAppPath('/nights'), true)
assert.equal(artistWorldReturnLabel({ from: '/fans/recaps' }), 'Nights')
assert.equal(artistWorldReturnLabel({ from: '/nights' }), 'Nights')
assert.equal(artistWorldReturnLabel({ from: '/fan/passport' }), 'Passport')

const sample = {
  id: 88,
  showTitle: 'hello new show 3',
  venue: 'The Rock',
  city: 'Chicago',
  showStartedAt: '2026-09-03T21:00:00',
  checkedInShowCount: 2,
  fansCaptured: 2,
  heroImage: { formats: { medium: { url: '/teaser-hero.jpg' } }, url: '/hero-original.jpg' },
  coverImage: { url: '/cover-original.jpg' },
}
assert.equal(nightHistoryTitle(sample), 'hello new show 3')
assert.equal(nightHistoryEyebrow(sample), 'SEP 3 · CHICAGO')
assert.equal(nightHistoryStatsLine(sample), '2 were there · 2 new fans')
assert.equal(nightHistoryTeaserUrl(sample), '/teaser-hero.jpg')
assert.equal(nightHistoryTeaserUrl({
  coverImage: { protected: true, url: '/secret.jpg' },
}), '')
assert.equal(groupNightsByYear([sample]).length, 1)
assert.equal(groupNightsByYear([
  sample,
  { ...sample, id: 9, showStartedAt: '2025-11-08T21:00:00' },
]).length, 2)

// RESPONSIVE / overflow
assert.match(nights, /overflow-x: clip/)
assert.match(card, /overflow-x: clip/)
assert.match(sheet, /minmax\(0, 1fr\)|min-width: 0/)
assert.match(row, /min-width: 0/)
assert.match(card, /@media \(min-width: 768px\)/)
assert.match(sheet, /@media \(min-width: 768px\)/)
assert.match(row, /@media \(min-width: 1024px\)/)

// FIXTURES
for (const state of ['idle-first', 'idle-returning', 'setup', 'live', 'end-confirm', 'generating', 'ready', 'timeout']) {
  assert.match(fixture, new RegExp(state))
}
for (const state of ['empty', 'one', 'many']) {
  assert.match(nightsFixture, new RegExp(state))
}

console.log('test-show-mode-nights-pass: ok')
