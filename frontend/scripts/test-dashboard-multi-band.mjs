/**
 * Multi-Band Workspace.
 * Run: node scripts/test-dashboard-multi-band.mjs
 *
 * One user may own several bands. `?bandId=` is a navigation hint; the only
 * ids that may ever resolve are the ones already present in `bandItems`,
 * which is built from GET /api/me/band-access.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

import {
  DASHBOARD_WORKSPACE,
  dashboardPathForBand,
  newEventPathForBand,
  parseBandIdHint,
  resolveDashboardWorkspace,
  scopeEventsToBand,
} from '../utils/ui/dashboardWorkspace.js'
import {
  WORKSPACE_MODE,
  resolveActiveWorkspaceBand,
  withActiveBand,
} from '../utils/ui/artistWorkspace.js'
import { resolveComposerBand } from '../utils/campaigns/resolveComposerBand.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')

const dashboard = read('pages/dashboard/index.vue')
const newEventPage = read('pages/newevent.vue')
const picker = read('components/dashboard/ArtistWorkspacePicker.vue')
const bandBar = read('components/dashboard/ActiveBandBar.vue')
const teamPage = read('pages/dashboard/team/[bandId].vue')
const accountPage = read('pages/account.vue')
const showModeCard = read('components/dashboard/ShowModeCard.vue')
const recapsComposable = read('composables/useShowRecaps.js')
const fansPage = read('pages/fans/index.vue')

function compileSfc(rel) {
  const { descriptor, errors } = parse(read(rel), { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  const script = compileScript(descriptor, { id: rel, filename: rel })
  assert.ok(script.content, `${rel} script compiled`)
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('touched multi-band SFCs compile', () => {
  compileSfc('pages/dashboard/index.vue')
  compileSfc('pages/dashboard/team/[bandId].vue')
  compileSfc('pages/account.vue')
  compileSfc('components/dashboard/ArtistWorkspacePicker.vue')
  compileSfc('components/dashboard/ActiveBandBar.vue')
  compileSfc('components/dashboard/ShowModeCard.vue')
  compileSfc('pages/fans/index.vue')
})

const ONE = { id: 11, name: 'Solo', isOwner: true }
const TWO = { id: 22, name: 'Second', isOwner: false, accessRole: 'manager' }
const PAIR = [ONE, TWO]

// ------------------------------------------------------------ single band

test("zero or one band stays on today's dashboard, never the picker", () => {
  assert.equal(resolveDashboardWorkspace([], undefined).mode, DASHBOARD_WORKSPACE.SINGLE)
  assert.equal(resolveDashboardWorkspace([], undefined).band, null)

  const single = resolveDashboardWorkspace([ONE], undefined)
  assert.equal(single.mode, DASHBOARD_WORKSPACE.SINGLE)
  assert.equal(single.band, ONE)
  assert.equal(single.redirect, null)
})

test('a single-band user cannot address another band through the URL', () => {
  // 999 is not theirs; they still get their own band, never band 999.
  const forged = resolveDashboardWorkspace([ONE], '999')
  assert.equal(forged.mode, DASHBOARD_WORKSPACE.SINGLE)
  assert.equal(forged.band, ONE)
})

// ----------------------------------------------------------- picker step

test('several bands with no choice yet lands on the picker', () => {
  const result = resolveDashboardWorkspace(PAIR, undefined)
  assert.equal(result.mode, DASHBOARD_WORKSPACE.PICKER)
  assert.equal(result.band, null)
  assert.equal(result.redirect, null)
})

test('an authorized bandId opens exactly that band', () => {
  const first = resolveDashboardWorkspace(PAIR, '11')
  assert.equal(first.mode, DASHBOARD_WORKSPACE.SCOPED)
  assert.equal(first.band, ONE)

  const second = resolveDashboardWorkspace(PAIR, 22)
  assert.equal(second.mode, DASHBOARD_WORKSPACE.SCOPED)
  assert.equal(second.band, TWO)
})

// -------------------------------------------------- authorization boundary

test('an unauthorized bandId reveals nothing and returns to the picker', () => {
  for (const forged of ['999', 999, '0', '-3', 'abc', '11abc', '1e1', ' ', '']) {
    const result = resolveDashboardWorkspace(PAIR, forged)
    assert.notEqual(
      result.mode,
      DASHBOARD_WORKSPACE.SCOPED,
      `bandId ${JSON.stringify(forged)} must not open a workspace`
    )
    assert.equal(result.band, null, `bandId ${JSON.stringify(forged)} must not leak a band`)
  }
})

test('an unusable bandId is stripped from the URL rather than silently swapped', () => {
  assert.equal(resolveDashboardWorkspace(PAIR, '999').redirect, '/dashboard')
  // Absent is not an error, so there is nothing to strip.
  assert.equal(resolveDashboardWorkspace(PAIR, undefined).redirect, null)
})

test('array and junk query values never throw or resolve', () => {
  assert.equal(parseBandIdHint(['22', '11']), 22)
  assert.equal(parseBandIdHint(null), null)
  assert.equal(parseBandIdHint({}), null)
  assert.equal(parseBandIdHint('12.5'), null)
  assert.equal(resolveDashboardWorkspace(PAIR, ['999']).mode, DASHBOARD_WORKSPACE.PICKER)
})

test('malformed band rows are dropped, not treated as a workspace', () => {
  assert.equal(
    resolveDashboardWorkspace([null, undefined, {}], undefined).mode,
    DASHBOARD_WORKSPACE.SINGLE
  )
  assert.equal(resolveDashboardWorkspace([ONE, null, {}], undefined).band, ONE)
})

// ------------------------------------------------------------------ links

test('dashboardPathForBand carries the band, and degrades safely', () => {
  assert.equal(dashboardPathForBand(22), '/dashboard?bandId=22')
  assert.equal(dashboardPathForBand('22'), '/dashboard?bandId=22')
  assert.equal(dashboardPathForBand(null), '/dashboard')
  assert.equal(dashboardPathForBand('../evil'), '/dashboard')
})

test('newEventPathForBand carries the open artist into create event', () => {
  assert.equal(newEventPathForBand(22), '/newevent?bandId=22')
  assert.equal(newEventPathForBand('22'), '/newevent?bandId=22')
  assert.equal(newEventPathForBand(null), '/newevent')
  assert.equal(newEventPathForBand('../evil'), '/newevent')
})

test('create event keeps the open artist on the way in and the way back', () => {
  assert.match(dashboard, /newEventPathForBand\(activeBand\.value\?\.id\)/)
  assert.match(newEventPage, /parseBandIdHint\(route\.query\.bandId\)/)
  assert.match(newEventPage, /dashboardPathForBand\(newEvent\.value\.band\)/)
  assert.match(newEventPage, /dashboardPathForBand\(newEvent\.value\.band \?\? route\.query\.bandId\)/)
  assert.doesNotMatch(newEventPage, /router\.push\('\/dashboard'\)/)
})

// ----------------------------------------------------------------- events

test('scoped events keep the active band plus band-less legacy events', () => {
  const events = [
    { id: 1, bandId: 11 },
    { id: 2, bandId: 22 },
    { id: 3, bandId: null },
  ]
  assert.deepEqual(scopeEventsToBand(events, 11).map((e) => e.id), [1, 3])
  assert.deepEqual(scopeEventsToBand(events, 22).map((e) => e.id), [2, 3])
  // No active band means no scoping.
  assert.deepEqual(scopeEventsToBand(events, null).map((e) => e.id), [1, 2, 3])
})

// -------------------------------------------------------------- dashboard

test('the dashboard resolves one activeBand and never indexes bandItems', () => {
  assert.match(dashboard, /resolveDashboardWorkspace\(bandItems\.value, route\.query\.bandId\)/)
  assert.match(dashboard, /const activeBand = computed\(\(\) => workspace\.value\.band\)/)

  // No live bandItems[0] / primaryBand left outside HTML comments.
  const live = dashboard.replace(/<!--[\s\S]*?-->/g, '')
  assert.doesNotMatch(live, /bandItems\[0\]/)
  assert.doesNotMatch(live, /bandItems\.value\[0\]/)
  assert.doesNotMatch(live, /primaryBand/)
})

test('every band-scoped dashboard module is fed the active band', () => {
  assert.match(dashboard, /<DashboardPerformanceGlance[\s\S]*?:band-id="activeBand\.id"/)
  assert.match(dashboard, /<ShowModeCard[\s\S]*?:band-id="activeBand\.id"/)
  assert.match(dashboard, /<FansDashboardCard[\s\S]*?:band-id="activeBand\?\.id"/)
  assert.match(dashboard, /<TeamAccessCard[\s\S]*?:band-id="activeBand\.id"/)
  assert.match(dashboard, /const bandId = activeBand\.value\?\.id/)
})

test('ShowModeCard remounts on switch because it has no bandId watcher', () => {
  assert.match(dashboard, /<ShowModeCard[\s\S]*?:key="`show-mode-\$\{activeBand\.id\}`"/)
})

test('a scoped workspace lists only its own artist page and events', () => {
  assert.match(dashboard, /v-for="\(band, idx\) in workspaceBands"/)
  assert.match(dashboard, /v-for="\(ev, idx\) in workspaceEvents"/)
  assert.match(
    dashboard,
    /isScopedWorkspace\.value && activeBand\.value \? \[activeBand\.value\] : bandItems\.value/
  )
  assert.match(dashboard, /scopeEventsToBand\(eventItems\.value, activeBand\.value\.id\)/)
})

test('an unusable bandId is replaced in history, not pushed', () => {
  assert.match(dashboard, /if \(redirect\) router\.replace\(redirect\)/)
})

test('the picker replaces the dashboard instead of rendering beside it', () => {
  assert.match(dashboard, /<ArtistWorkspacePicker v-if="showPicker" :bands="bandItems" \/>/)
  assert.match(dashboard, /<template v-else>/)
  // Never flash the picker while the band list is still loading.
  assert.match(
    dashboard,
    /!loading\.value && workspace\.value\.mode === DASHBOARD_WORKSPACE\.PICKER/
  )
})

// ----------------------------------------------------------------- picker

test('each picker card shows image, name, role, and Open workspace', () => {
  assert.match(picker, /dashboardPathForBand\(band\.id\)/)
  assert.match(picker, /card__img/)
  assert.match(picker, /object-fit: contain/)
  assert.match(picker, /fit: 'contain'/)
  assert.doesNotMatch(picker, /object-fit: cover/)
  assert.match(picker, /card__fallback/)
  assert.match(picker, /\{\{ band\.name \|\| band\.title \|\| 'Untitled artist' \}\}/)
  assert.match(picker, /Open workspace/)
  assert.match(picker, /function roleLabel/)
  assert.match(picker, /Your artists/)
})

test('the picker links only to bands it was handed', () => {
  // No band-access fetch of its own, and no raw route query.
  assert.doesNotMatch(picker, /getMyBandAccess/)
  assert.doesNotMatch(picker, /route\.query/)
})

// ------------------------------------------------------- switch-artist bar

test('the scoped header carries the artist and a way back to the picker', () => {
  assert.match(
    dashboard,
    /<DashboardActiveBandBar v-if="isScopedWorkspace && activeBand" :band="activeBand" \/>/
  )
  assert.match(bandBar, /Switch artist/)
  assert.match(bandBar, /to="\/dashboard"/)
  assert.match(bandBar, /active-band__avatar/)
  assert.match(bandBar, /active-band__name/)
})

// ---------------------------------------------------- band-preserving links

test('Team Access returns to the workspace it was opened from', () => {
  assert.match(teamPage, /dashboardPathForBand\(bandId\.value\)/)
  assert.match(teamPage, /:to="dashboardPath"/)
  // The forbidden state must still land on the picker, not a band URL.
  assert.match(teamPage, /<NuxtLink to="\/dashboard" class="inline-block mt-4/)
})

test('Team Access still scopes every mutation to its own :bandId', () => {
  for (const call of [
    /inviteBandMember\(bandId\.value, \{/,
    /updateBandMemberRole\(bandId\.value, member\.id, nextRole\)/,
    /removeBandMember\(bandId\.value, member\.id\)/,
    /revokeBandInvite\(bandId\.value, invite\.id\)/,
    /resendBandInvite\(bandId\.value, invite\.id\)/,
  ]) {
    assert.match(teamPage, call)
  }
  // bandId is the route param and nothing else.
  assert.match(teamPage, /const bandId = computed\(\(\) => route\.params\.bandId\)/)
})

// ------------------------------------------------------- recap band scope

/**
 * GET /api/show-recaps/latest/me falls back to "first owned band" when no
 * bandId is sent, so an unscoped call would show band A's Night inside band
 * B's workspace. Every caller that knows its band must name it.
 */
test('latest recap is requested for a named band, not an inferred one', () => {
  assert.match(recapsComposable, /const getLatestRecap = async \(bandId = null\)/)
  assert.match(recapsComposable, /\.\.\.\(bandId \? \{ params: \{ bandId \} \} : \{\}\)/)
})

test('ShowModeCard asks for its own band\'s recap on both paths', () => {
  assert.equal((showModeCard.match(/getLatestRecap\(props\.bandId\)/g) || []).length, 2)
  assert.doesNotMatch(showModeCard, /getLatestRecap\(\)/)
})

test('Fan Intelligence recap matches the band its fans came from', () => {
  assert.match(fansPage, /getLatestRecap\(id\)/)
  assert.doesNotMatch(fansPage, /getLatestRecap\(\)/)
})

test('Account opens the workspace for the band that was clicked', () => {
  assert.match(accountPage, /:to="dashboardPathForBand\(band\.bandId\)"/)
  assert.equal(
    (accountPage.match(/dashboardPathForBand\(band\.bandId\)/g) || []).length,
    2
  )
})

// --------------------------------------------- global workspace navigation
//
// The dashboard being correct is not enough: a manager who opens Band B and
// then taps Artist Page, Galleries, Messages, Nights, or Live View must stay
// in Band B. Every surface below used to answer "first owned band".

const header = read('components/Header.vue')
const galleriesPage = read('pages/galleries/index.vue')
const galleryStudio = read('pages/galleries/new.vue')
const recapsPage = read('pages/fans/recaps/index.vue')
const showLivePage = read('pages/show-live.vue')
const composePage = read('pages/messages/compose.vue')
const campaignPage = read('pages/messages/[campaignId].vue')
const messagesHome = read('components/messages/MessagesHome.vue')
const updatesPage = read('pages/updates/index.vue')
const workspaceComposable = read('composables/useWorkspaceBand.js')
const primaryBandComposable = read('composables/usePrimaryBandId.js')

const A = { bandId: 11, slug: 'band-a', name: 'Band A', permissions: { sendFanMessages: true } }
const B = { bandId: 22, slug: 'band-b', name: 'Band B', permissions: { sendFanMessages: true } }
const BOTH = { owned: [A, B], teamAccess: [] }
const ONLY_A = { owned: [A], teamAccess: [] }

test('global workspace SFCs compile', () => {
  compileSfc('components/Header.vue')
  compileSfc('pages/galleries/index.vue')
  compileSfc('pages/galleries/new.vue')
  compileSfc('pages/fans/recaps/index.vue')
  compileSfc('pages/show-live.vue')
  compileSfc('pages/messages/compose.vue')
  compileSfc('pages/messages/[campaignId].vue')
  compileSfc('components/messages/MessagesHome.vue')
  compileSfc('pages/updates/index.vue')
  compileSfc('pages/updates/new.vue')
})

test('one authorized band resolves without a hint and ignores forged ones', () => {
  for (const hint of [undefined, null, '22', 22, 'abc', '']) {
    const r = resolveActiveWorkspaceBand(ONLY_A, hint)
    assert.equal(r.mode, WORKSPACE_MODE.SINGLE, `hint ${String(hint)}`)
    assert.equal(r.band.bandId, 11)
  }
})

test('two bands with no hint refuse to guess', () => {
  for (const hint of [undefined, null, '', ' ', []]) {
    const r = resolveActiveWorkspaceBand(BOTH, hint)
    assert.equal(r.mode, WORKSPACE_MODE.PICKER, `hint ${JSON.stringify(hint)}`)
    assert.equal(r.band, null)
  }
})

test('an authorized hint opens exactly that band', () => {
  const r = resolveActiveWorkspaceBand(BOTH, '22')
  assert.equal(r.mode, WORKSPACE_MODE.SCOPED)
  assert.equal(r.band.bandId, 22)
  assert.equal(r.band.slug, 'band-b')
  assert.equal(resolveActiveWorkspaceBand(BOTH, ['11']).band.bandId, 11)
})

test('a forged hint never opens another artist', () => {
  for (const hint of ['999', 999, '0', '-3', 'abc', '11abc', '1e1', '<script>']) {
    const r = resolveActiveWorkspaceBand(BOTH, hint)
    assert.equal(r.mode, WORKSPACE_MODE.PICKER, `hint ${String(hint)}`)
    assert.equal(r.band, null, `hint ${String(hint)} leaked a band`)
  }
})

test('no authorized band is distinct from an unchosen one', () => {
  const r = resolveActiveWorkspaceBand({ owned: [], teamAccess: [] }, '11')
  assert.equal(r.mode, WORKSPACE_MODE.NONE)
  assert.equal(r.band, null)
})

test('permission filtering can leave exactly one sendable band', () => {
  const mixed = {
    owned: [A],
    teamAccess: [{ ...B, permissions: { sendFanMessages: false } }],
  }
  const r = resolveActiveWorkspaceBand(mixed, undefined, 'sendFanMessages')
  assert.equal(r.mode, WORKSPACE_MODE.SINGLE)
  assert.equal(r.band.bandId, 11)
  // Unfiltered, the same payload is still ambiguous.
  assert.equal(resolveActiveWorkspaceBand(mixed, undefined).mode, WORKSPACE_MODE.PICKER)
})

test('team access counts as an authorized workspace', () => {
  const r = resolveActiveWorkspaceBand({ owned: [A], teamAccess: [B] }, '22')
  assert.equal(r.mode, WORKSPACE_MODE.SCOPED)
  assert.equal(r.band.bandId, 22)
  assert.equal(r.band.isOwner, false)
})

test('Band B links carry Band B, and single-band URLs are untouched', () => {
  const scoped = resolveActiveWorkspaceBand(BOTH, '22')
  assert.equal(withActiveBand('/galleries', scoped), '/galleries?bandId=22')
  assert.equal(withActiveBand('/messages', scoped), '/messages?bandId=22')
  assert.equal(withActiveBand('/show-live', scoped), '/show-live?bandId=22')
  assert.equal(withActiveBand('/band-b', scoped), '/band-b?bandId=22')
  assert.equal(withActiveBand('/updates?tab=all', scoped), '/updates?tab=all&bandId=22')

  const single = resolveActiveWorkspaceBand(ONLY_A, undefined)
  assert.equal(withActiveBand('/galleries', single), '/galleries')
  assert.equal(withActiveBand('/messages', single), '/messages')

  const picker = resolveActiveWorkspaceBand(BOTH, undefined)
  assert.equal(withActiveBand('/galleries', picker), '/galleries')
})

test('link building never double-tags or rewrites absolute URLs', () => {
  const scoped = resolveActiveWorkspaceBand(BOTH, '22')
  assert.equal(withActiveBand('/messages?bandId=11', scoped), '/messages?bandId=11')
  assert.equal(withActiveBand('https://faneqo.com/x', scoped), 'https://faneqo.com/x')
  assert.equal(withActiveBand('', scoped), '')
  assert.equal(withActiveBand(null, scoped), null)
})

test('the composer refuses to substitute another artist', () => {
  // Regression: this returned candidates[0] and let Band B compose to Band A.
  assert.equal(resolveComposerBand(BOTH, undefined), null)
  assert.equal(resolveComposerBand(BOTH, '999'), null)
  assert.equal(resolveComposerBand(BOTH, '22').bandId, 22)
  // One candidate is unambiguous, so today's single-band behaviour is kept.
  assert.equal(resolveComposerBand(ONLY_A, undefined).bandId, 11)
  assert.equal(resolveComposerBand(ONLY_A, '999').bandId, 11)
})

test('band access has exactly one useAsyncData definition', () => {
  // Two handlers under one key is a silent trap: Nuxt keeps whichever
  // registered first, so the header and the pages would diverge.
  assert.match(workspaceComposable, /useAsyncData\(\s*\n?\s*ACCESS_KEY/)
  assert.doesNotMatch(header, /useAsyncData\(\s*\n?\s*'user-band-access'/)
  assert.doesNotMatch(header, /getMyBandAccess/)
})

test('the shared helper treats every hint source as a hint', () => {
  assert.match(workspaceComposable, /route\.query\.bandId \?\? readStoredActiveBandId\(\)/)
  assert.match(workspaceComposable, /resolveActiveWorkspaceBand\(/)
  // The picker is the only answer when nothing validates.
  assert.match(workspaceComposable, /WORKSPACE_MODE\.PICKER[\s\S]{0,120}navigateTo\('\/dashboard'\)/)
  // Access must be settled first, or a page would think the user has no bands.
  assert.match(workspaceComposable, /await ensureAccess\(\)/)
})

test('only a scoped workspace is remembered, and switching forgets it', () => {
  assert.match(workspaceComposable, /mode === WORKSPACE_MODE\.SCOPED[\s\S]{0,120}writeStoredActiveBandId/)
  assert.match(dashboard, /watch\(showPicker[\s\S]{0,120}writeStoredActiveBandId\(null\)/)
  assert.match(dashboard, /isScopedWorkspace\.value \? activeBand\.value\?\.id : null/)
})

test('the header opens the active artist, not the first owned one', () => {
  // The header consumes the shared helper rather than resolving for itself.
  assert.match(header, /resolved: activeWorkspace,\s*\n\} = useWorkspaceBand\(\)/)
  assert.match(header, /const userSlug = computed\(\(\) =>\s*bandAccessResolved\.value \? activeWorkspace\.value\.band\?\.slug \|\| null : null\s*\)/)
  assert.doesNotMatch(header, /userSlug = computed\(\(\) => workspaceBand/)
  // Artist Page, Galleries and Messages all carry the workspace.
  assert.match(header, /withActiveBand\('\/messages', activeWorkspace\.value\)/)
  assert.match(header, /withActiveBand\('\/galleries', activeWorkspace\.value\)/)
  assert.match(header, /withActiveBand\(link\.to, activeWorkspace\.value\)/)
})

test('header chrome still keys off capability, not the chosen band', () => {
  // A multi-band artist sitting on the picker must not be served fan chrome.
  assert.match(header, /const hasArtistWorkspaceAccess = computed\(\(\) => !!workspaceBand\.value\)/)
})

test('every artist tool resolves through the one shared helper', () => {
  for (const [name, src] of [
    ['galleries', galleriesPage],
    ['gallery studio', galleryStudio],
    ['nights', recapsPage],
    ['show live', showLivePage],
    ['compose', composePage],
    ['campaign detail', campaignPage],
    ['messages home', messagesHome],
    ['updates', updatesPage],
    ['fan intelligence', primaryBandComposable],
  ]) {
    assert.match(src, /useWorkspaceBand\(/, `${name} uses the shared helper`)
  }
})

test('no artist tool parses ?bandId= on its own any more', () => {
  for (const [name, src] of [
    ['galleries', galleriesPage],
    ['gallery studio', galleryStudio],
    ['compose', composePage],
    ['campaign detail', campaignPage],
    ['messages home', messagesHome],
    ['fan intelligence', primaryBandComposable],
  ]) {
    assert.doesNotMatch(src, /route\.query\.bandId/, `${name} still parses the query itself`)
  }
})

test('Band B keeps Band B across every listed destination', () => {
  // Galleries, Nights, Show Live and Updates ask the helper for a band and
  // get sent to the picker instead of a fallback.
  for (const [name, src] of [
    ['galleries', galleriesPage],
    ['nights', recapsPage],
    ['show live', showLivePage],
    ['updates', updatesPage],
  ]) {
    assert.match(src, /await requireActiveBand\(\)/, `${name} requires an active band`)
  }
  // Messaging surfaces keep their sendFanMessages filter and add the guard.
  for (const [name, src] of [
    ['compose', composePage],
    ['gallery studio', galleryStudio],
    ['messages home', messagesHome],
  ]) {
    assert.match(src, /needsPicker/, `${name} guards the picker case`)
    assert.match(src, /navigateTo\('\/dashboard'\)/, `${name} returns to the picker`)
  }
})

test('Show Live no longer falls back to the most recently updated band', () => {
  assert.doesNotMatch(showLivePage, /sort\[0\]'?\]?:\s*'updatedAt:desc'/)
  assert.doesNotMatch(showLivePage, /resolveWorkspaceBand/)
})

test('Nights are requested for the resolved band, in order', () => {
  assert.match(recapsComposable, /params: \{ page, pageSize, \.\.\.\(bandId \? \{ bandId \} : \{\}\)[, ]/)
  assert.match(recapsPage, /bandId: activeBandId\.value/)
  // The band must be known before the first page is fetched.
  assert.match(recapsPage, /await loadWorkspace\(\)[\s\S]{0,40}await loadMore\(\)/)
})

test('Live View opens the band whose card was clicked', () => {
  assert.match(showModeCard, /workspaceLinkTo\('\/show-live'\)/)
  assert.match(showModeCard, /:to="showLivePath"/)
  assert.doesNotMatch(showModeCard, /to="\/show-live"/)
})

test('recap generation names its band', () => {
  // Unhinted, the API resolves "first owned band" and files an empty recap for
  // this campaign under the wrong artist.
  assert.match(recapsComposable, /generateRecap = async \(campaignId, bandId = null\)/)
  assert.match(recapsComposable, /body: \{ campaignId, \.\.\.\(bandId \? \{ bandId \} : \{\}\) \}/)
  assert.match(showModeCard, /generateRecap\(endedCampaignId\.value, props\.bandId\)/)
})

test('Artist Updates composer keeps the workspace it was opened from', () => {
  const updatesNew = read('pages/updates/new.vue')
  assert.match(updatesNew, /useWorkspaceBand\(/)
  assert.match(updatesNew, /resolveComposerBand\(access, activeBandHint\.value\)/)
  assert.doesNotMatch(updatesNew, /route\.query\.bandId/)
})

test('Fan Intelligence stops asking the API to pick a band', () => {
  assert.doesNotMatch(primaryBandComposable, /updatedAt:desc/)
  assert.doesNotMatch(primaryBandComposable, /client\('\/bands'/)
  assert.match(primaryBandComposable, /await requireActiveBand\(\)/)
})

console.log(`test-dashboard-multi-band: ok (${passed} tests)`)
