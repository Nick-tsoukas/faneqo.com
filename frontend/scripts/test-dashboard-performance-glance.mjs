/**
 * Dashboard performance glance + module hierarchy contracts.
 * Run: node scripts/test-dashboard-performance-glance.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  GLANCE_METRICS,
  formatGlanceValue,
  formatGlanceTrend,
  formatGlanceRangeLabel,
  toGlanceRows,
} from '../composables/useDashboardGlance.js'
import {
  DASHBOARD_MODULE_ORDER,
  dashboardModuleOrder,
  showModeTakesPriority,
} from '../utils/dashboardModules.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const page = fs.readFileSync(path.join(root, 'pages/dashboard/index.vue'), 'utf8')
const glance = fs.readFileSync(path.join(root, 'components/dashboard/PerformanceGlance.vue'), 'utf8')
const showModeCard = fs.readFileSync(path.join(root, 'components/dashboard/ShowModeCard.vue'), 'utf8')

const at = (needle) => {
  const idx = page.indexOf(needle)
  assert.notStrictEqual(idx, -1, `dashboard is missing: ${needle}`)
  return idx
}

// ------------------------------------------------ glance renders on dashboard

assert.match(page, /<DashboardPerformanceGlance/)
assert.match(page, /import DashboardPerformanceGlance from '~\/components\/dashboard\/PerformanceGlance\.vue'/)

// Directly under the Dashboard heading, above everything else.
assert.ok(at('<h1 class="text-3xl md:text-4xl font-bold text-white">Dashboard</h1>') < at('<DashboardPerformanceGlance'))
assert.ok(at('<DashboardPerformanceGlance') < at('<!-- Banners -->'))
assert.ok(at('<DashboardPerformanceGlance') < at('<!-- Bands Section -->'))

// Three metrics, no chart, no extra analytics controls.
assert.deepEqual(GLANCE_METRICS.map((m) => m.key), ['views', 'qrScans', 'newFans'])
assert.deepEqual(GLANCE_METRICS.map((m) => m.label), ['Views', 'QR scans', 'New fans'])
assert.doesNotMatch(glance, /chart|Chart|canvas|echarts/)

// ------------------------------------------------------ current 7-day metrics

const payload = {
  ok: true,
  days: 7,
  metrics: {
    views: { current: 554, previous: 469, changePct: 18 },
    qrScans: { current: 87, previous: 66, changePct: 31 },
    newFans: { current: 14, previous: 13, changePct: 7 },
  },
}

const rows = toGlanceRows(payload)
assert.equal(rows.length, 3)
assert.deepEqual(
  rows.map((r) => `${r.display} ${r.label} ${r.trend.label}`),
  ['554 Views ↑18%', '87 QR scans ↑31%', '14 New fans ↑7%']
)
assert.equal(formatGlanceRangeLabel(7), 'Last 7 days')
assert.equal(formatGlanceRangeLabel(1), 'Last 24 hours')
assert.equal(formatGlanceRangeLabel(undefined), 'Last 7 days')

// -------------------------------------------------------------- value format

assert.equal(formatGlanceValue(0), '0')
assert.equal(formatGlanceValue(554), '554')
assert.equal(formatGlanceValue(1234), '1,234')
assert.equal(formatGlanceValue(12400), '12.4K')
assert.equal(formatGlanceValue(2500000), '2.5M')
// Never leak a broken number into the strip.
assert.equal(formatGlanceValue(null), '0')
assert.equal(formatGlanceValue(undefined), '0')
assert.equal(formatGlanceValue(NaN), '0')
assert.equal(formatGlanceValue(Infinity), '0')
assert.equal(formatGlanceValue(-5), '0')

// ------------------------------------------------------------ trend format

assert.deepEqual(formatGlanceTrend(18), {
  direction: 'up',
  value: 18,
  label: '↑18%',
  srLabel: '18% up versus the previous period',
})
assert.equal(formatGlanceTrend(-42).direction, 'down')
assert.equal(formatGlanceTrend(-42).label, '↓42%')

// No comparison, no meaningless badge, no NaN/Infinity.
assert.equal(formatGlanceTrend(null), null)
assert.equal(formatGlanceTrend(undefined), null)
assert.equal(formatGlanceTrend(0), null)
assert.equal(formatGlanceTrend(0.4), null)
assert.equal(formatGlanceTrend(NaN), null)
assert.equal(formatGlanceTrend(Infinity), null)
assert.equal(formatGlanceTrend(-Infinity), null)
assert.equal(formatGlanceTrend('nonsense'), null)

for (const pct of [null, undefined, 0, NaN, Infinity, -Infinity, 'x']) {
  const trend = formatGlanceTrend(pct)
  assert.ok(trend === null, `expected no trend for ${String(pct)}`)
}
for (const pct of [1, -1, 18, -99, 250]) {
  assert.doesNotMatch(formatGlanceTrend(pct).label, /NaN|Infinity/)
}

// -------------------------------------------------------- zero / new artist

const zeroRows = toGlanceRows({
  ok: true,
  days: 7,
  metrics: {
    views: { current: 0, previous: 0, changePct: null },
    qrScans: { current: 0, previous: 0, changePct: null },
    newFans: { current: 0, previous: 0, changePct: null },
  },
})
assert.deepEqual(zeroRows.map((r) => r.display), ['0', '0', '0'])
assert.deepEqual(zeroRows.map((r) => r.trend), [null, null, null])

// Missing payload entirely still yields a stable, compact strip.
const emptyRows = toGlanceRows(null)
assert.deepEqual(emptyRows.map((r) => `${r.display} ${r.label}`), ['0 Views', '0 QR scans', '0 New fans'])
assert.deepEqual(emptyRows.map((r) => r.trend), [null, null, null])

// Growth from a zero baseline is infinite, so the backend sends null.
assert.equal(toGlanceRows({ metrics: { views: { current: 9, previous: 0, changePct: null } } })[0].trend, null)

// -------------------------------------------------------------- analytics link

assert.match(glance, /:to="`\/analytics\/\$\{bandId\}`"/)
assert.match(glance, />\s*Analytics\s*<span aria-hidden="true">→<\/span>/)
// The strip creates curiosity; the Analytics link is its only control.
assert.doesNotMatch(glance, /<button|v-model|@click/)
assert.equal((glance.match(/<NuxtLink/g) || []).length, 1)

// One lightweight aggregate, not the heavy rollups/pulse reads.
const composable = fs.readFileSync(path.join(root, 'composables/useDashboardGlance.js'), 'utf8')
assert.match(composable, /'\/analytics\/dashboard-glance'/)
assert.doesNotMatch(composable, /analytics\/rollups|analytics\/pulse|muse\/aggregate/)

// ------------------------------------------------------------- module order

assert.deepEqual(DASHBOARD_MODULE_ORDER, [
  'artistPages',
  'showMode',
  'fanIntelligence',
  'events',
  'qrCodes',
  'teamAccess',
])

const artistPages = at('<!-- Bands Section -->')
const fanIntelligence = at('<FansDashboardCard')
const events = at('<!-- Events Section -->')
const qrCodes = at('<!-- QR Codes Section -->')
const teamAccess = at('<TeamAccessCard')

assert.ok(artistPages < fanIntelligence, 'Artist Pages must precede Fan Intelligence')
assert.ok(fanIntelligence < events, 'Fan Intelligence must precede Events')
assert.ok(events < qrCodes, 'Events must precede QR Codes')
assert.ok(qrCodes < teamAccess, 'QR Codes must precede Team Access')

// Team Access is administrative: last product block on the page.
for (const [label, idx] of [
  ['Artist Pages', artistPages],
  ['Fan Intelligence', fanIntelligence],
  ['Events', events],
  ['QR Codes', qrCodes],
]) {
  assert.ok(idx < teamAccess, `Team Access must come after ${label}`)
}
assert.equal(page.indexOf('<TeamAccessCard'), page.lastIndexOf('<TeamAccessCard'), 'Team Access must not be duplicated')

// ------------------------------------------------------- show mode ordering

assert.equal(showModeTakesPriority(null), false)
assert.equal(showModeTakesPriority({}), false)
assert.equal(showModeTakesPriority({ isLive: false, isScheduled: false }), false)
assert.equal(showModeTakesPriority({ isLive: true, isScheduled: false }), true)
assert.equal(showModeTakesPriority({ isLive: false, isScheduled: true }), false)

// Inactive: Show Mode follows Artist Pages.
const inactive = dashboardModuleOrder({ isLive: false, isScheduled: false })
assert.ok(inactive.indexOf('artistPages') < inactive.indexOf('showMode'))
assert.deepEqual(inactive, [
  'artistPages',
  'showMode',
  'fanIntelligence',
  'events',
  'qrCodes',
  'teamAccess',
])

// Active: Show Mode precedes Artist Pages, everything below is unchanged.
const active = dashboardModuleOrder({ isLive: true })
assert.ok(active.indexOf('showMode') < active.indexOf('artistPages'))
assert.deepEqual(active, [
  'showMode',
  'artistPages',
  'fanIntelligence',
  'events',
  'qrCodes',
  'teamAccess',
])
assert.deepEqual(dashboardModuleOrder({ isScheduled: true }), inactive)
assert.equal(active.indexOf('teamAccess'), active.length - 1)

// The swap is CSS-ordered so ShowModeCard is never unmounted mid-show.
assert.match(page, /:class="\['dashboard-primary', primaryLayoutClass\]"/)
assert.match(page, /showModeLeads \? 'primary-lead' : 'primary-follow'/)
assert.match(page, /showModeLeads\.value = showModeTakesPriority\(status\)/)
const leadOrder = /\.dashboard-primary > \.primary-lead \{\s*order: 1;/
const defaultOrder = /\.dashboard-primary > \* \{\s*order: 2;/
const followOrder = /\.dashboard-primary > \.primary-follow \{\s*order: 3;/
assert.match(page, leadOrder)
assert.match(page, defaultOrder)
assert.match(page, followOrder)

// Canonical show-mode state stays in ShowModeCard; the dashboard only mirrors it.
assert.match(showModeCard, /defineEmits\(\['status'\]\)/)
assert.match(showModeCard, /emit\('status', \{/)
assert.match(showModeCard, /isLive: isLive.value/)
assert.match(showModeCard, /isScheduled: false/)
assert.match(page, /@status="onShowModeStatus"/)
assert.doesNotMatch(page, /show-mode`/, 'dashboard must not re-fetch show-mode status')

// --------------------------------------------- existing behaviour preserved

assert.match(page, /router\.push\(`\/analytics\/\$\{band\.id\}`\)/)
assert.match(page, /router\.push\(`\/analyticsqr\/\$\{qr\.id\}`\)/)
assert.match(page, /router\.push\(`\/event-analytics\/\$\{ev\.id\}`\)/)
assert.match(page, /openDownloadForQr\(qr\.id\)/)
assert.match(page, /editItem\(qr\.id, 'editqr'\)/)
assert.match(page, /deleteItem\(qr\.id, 'qr'\)/)
assert.match(page, /deleteItem\(ev\.id, 'event'\)/)
assert.match(page, /deleteItem\(band\.id, 'band'\)/)
assert.match(page, /openShareDrawer\(band\)/)
assert.match(page, /copyBandLink\(band\.slug\)/)
assert.match(page, /startPayoutOnboarding\(band\.id\)/)
assert.match(page, /v-if="canCreateMoreQrs"/)
assert.match(page, /to="\/createband"/)
assert.match(page, /:to="createEventTo"/)
assert.match(page, /newEventPathForBand\(activeBand\.value\?\.id\)/)
assert.match(page, /:to="`\/dashboard\/team\/\$\{band\.id\}`"/)

// Permission and subscription gates survive the reorder.
assert.match(page, /v-if="hasBand && isActiveBandOwner && activeBand\?\.id"/)
assert.match(page, /v-if="hasBand && !loading && isActiveBandOwner"/)
assert.match(page, /:can-send-messages="canSendFanMessages"/)
assert.match(page, /:can-manage-fan-list="canManageFanList"/)
assert.match(page, /<PastDueBanner/)
assert.match(page, /<TrialBanner/)

// Every section still renders its loading skeleton.
assert.equal((page.match(/<SkeletonLoader \/>/g) || []).length, 3)

console.log('test-dashboard-performance-glance: ok')
