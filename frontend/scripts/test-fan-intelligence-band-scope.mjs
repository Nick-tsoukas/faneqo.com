/**
 * Fan Intelligence is explicitly band-scoped on the dashboard and /fans.
 * Run: node scripts/test-fan-intelligence-band-scope.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

const card = read('components/dashboard/fans/FansDashboardCard.vue')
const useFans = read('composables/useFans.js')
const dashboard = read('pages/dashboard/index.vue')
const fansPage = read('pages/fans/index.vue')
const importModal = read('components/dashboard/fans/FansImportModal.vue')
const primaryBand = read('composables/usePrimaryBandId.js')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('dashboard glance and Fan Intelligence share the one validated activeBand', () => {
  assert.match(dashboard, /<DashboardPerformanceGlance[\s\S]*:band-id="activeBand\.id"/)
  assert.match(dashboard, /<FansDashboardCard[\s\S]*:band-id="activeBand\?\.id"/)
  assert.match(dashboard, /const activeBand = computed\(\(\) => workspace\.value\.band\)/)
  // activeBand comes from the resolver, never from an unvalidated array index.
  assert.match(
    dashboard,
    /resolveDashboardWorkspace\(bandItems\.value, route\.query\.bandId\)/
  )
})

test('FansDashboardCard passes its bandId into list, analytics, detail, and export', () => {
  assert.match(card, /getFans\(\{\s*bandId: props\.bandId/)
  assert.match(card, /getAnalytics\(props\.bandId\)/)
  assert.match(card, /fetchFanDetail\(fan\.id, props\.bandId\)/)
  assert.match(card, /exportFans\(props\.bandId\)/)
  assert.match(card, /:band-id="bandId"/)
})

test('useFans requires and sends bandId on every Fan Intelligence request', () => {
  assert.match(useFans, /function requireBandId\(bandId\)/)
  assert.match(useFans, /params\.set\('bandId', requireBandId\(bandId\)\)/)
  assert.match(useFans, /my-fans-analytics\?bandId=\$\{requireBandId\(bandId\)\}/)
  assert.match(useFans, /\$\{fanId\}\/detail\?bandId=\$\{requireBandId\(bandId\)\}/)
  assert.match(useFans, /export\?bandId=\$\{requireBandId\(bandId\)\}/)
  assert.match(useFans, /bandId: requireBandId\(bandId\)/)
  assert.doesNotMatch(useFans, /getUserBand/)
})

test('list and analytics always use the same band argument', () => {
  assert.match(useFans, /getAnalytics\(bandId\)/)
  assert.match(card, /getFans\(\{\s*bandId: props\.bandId/)
  assert.match(card, /getAnalytics\(props\.bandId\)/)
  assert.match(fansPage, /getFans\(\{[\s\S]*bandId: id/)
  assert.match(fansPage, /getFanAnalytics\(id\)/)
})

test('/fans resolves the dashboard primary band and never calls unscoped getFans', () => {
  assert.match(fansPage, /usePrimaryBandId/)
  assert.match(fansPage, /:band-id="bandId"/)
  assert.match(fansPage, /exportFans\(id\)/)
  assert.doesNotMatch(fansPage, /getFans\(\{\s*page:/)
  assert.doesNotMatch(fansPage, /getFanAnalytics\(\)/)
  assert.doesNotMatch(fansPage, /exportFans\(\)/)
})

test('usePrimaryBandId resolves through the shared active-workspace helper', () => {
  // It used to ask /bands for the most recently updated owned band, which is
  // a different artist than the workspace on screen once a user has two.
  assert.match(primaryBand, /useWorkspaceBand\(/)
  assert.match(primaryBand, /await requireActiveBand\(\)/)
  assert.doesNotMatch(primaryBand, /sort\[0\]': 'updatedAt:desc'/)
  assert.doesNotMatch(primaryBand, /filters\[users_permissions_user\]\[id\]\[\$eq\]/)
})

test('empty state names check-in as a real acquisition path', () => {
  assert.match(card, /Fans who join your list or check in at a show appear here\./)
})

test('import writes to the named band, not an inferred one', () => {
  assert.match(importModal, /bandId: \{/)
  assert.match(importModal, /importFans\(parsedFans\.value, props\.bandId\)/)
  assert.match(importModal, /if \(!props\.bandId\) return/)
})

console.log(`test-fan-intelligence-band-scope: ${passed} ok`)
