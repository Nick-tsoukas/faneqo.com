/**
 * Show Mode dashboard control surface.
 * Run: node scripts/test-show-mode-dashboard-integration.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const cardPath = path.join(root, 'components/dashboard/ShowModeCard.vue')
const sheetPath = path.join(root, 'components/dashboard/show-mode/ShowModeSetupSheet.vue')
const recentPath = path.join(root, 'components/dashboard/show-mode/LatestShowRecapPanel.vue')
const livePath = path.join(root, 'pages/show-live.vue')
const card = fs.readFileSync(cardPath, 'utf8')
const sheet = fs.readFileSync(sheetPath, 'utf8')
const recent = fs.readFileSync(recentPath, 'utf8')
const live = fs.readFileSync(livePath, 'utf8')
const page = fs.readFileSync(path.join(root, 'pages/dashboard/index.vue'), 'utf8')

function compileSfc(source, filename) {
  const { descriptor, errors } = parse(source, { filename })
  assert.deepEqual(errors, [], `${filename} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, { id: filename, filename })
    assert.ok(script.content, `${filename} script compiled`)
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename,
      id: filename,
    })
    assert.deepEqual(template.errors, [], `${filename} template compile errors`)
  }
}

compileSfc(card, 'ShowModeCard.vue')
compileSfc(sheet, 'ShowModeSetupSheet.vue')
compileSfc(recent, 'LatestShowRecapPanel.vue')

const block = (source, selector) => {
  const start = source.indexOf(`\n${selector}`)
  assert.notStrictEqual(start, -1, `missing rule: ${selector}`)
  const open = source.indexOf('{', start)
  const close = source.indexOf('}', open)
  return source.slice(open + 1, close)
}

const cardRule = block(card, '.show-mode-card {')
assert.match(cardRule, /width: 100%/)
assert.doesNotMatch(cardRule, /max-width/)
assert.match(cardRule, /--fq-surface/)
assert.match(cardRule, /--fq-border/)
assert.match(cardRule, /border-radius: 1rem/)
assert.match(block(page, '.dashboard-primary {'), /flex-direction: column/)

assert.match(card, /Playing tonight\?/)
assert.match(card, /Set up tonight/)
assert.match(card, /Fans check in\. You keep the connection\./)
assert.match(card, /v-if="isFirstTime"/)
assert.doesNotMatch(card, /Turn tonight's crowd into fans you can reach again/)
assert.doesNotMatch(card, /Fan check-ins/)
assert.doesNotMatch(card, /Capture real fans/)
assert.doesNotMatch(card, /At the show/)
assert.doesNotMatch(card, /After the show/)
assert.doesNotMatch(card, /KEEP THE CONNECTION/)
assert.doesNotMatch(card, /sm-chips/)
assert.doesNotMatch(card, /Collapse/)
assert.doesNotMatch(card, /Expand/)
assert.doesNotMatch(card, /uiCollapsed/)

assert.doesNotMatch(card, /It will activate automatically/)
assert.doesNotMatch(card, /Activate Now/)
assert.doesNotMatch(card, /show-mode\/activate-now/)
assert.doesNotMatch(card, /Show Mode is ready for/)

assert.match(card, /ShowModeSetupSheet/)
assert.match(sheet, /Set up tonight/)
assert.match(sheet, /type="datetime-local"/)
assert.match(sheet, /performanceStartsAt/)
assert.match(sheet, /performanceEndsAt/)
assert.match(sheet, /timezone/)
assert.match(sheet, /Start Show Mode/)
assert.match(sheet, /font-size: 16px/)
assert.match(sheet, /lockOverlayScroll/)
assert.match(sheet, /useFocusTrap/)
assert.match(sheet, /Night details/)
assert.match(sheet, /Night photo/)
assert.match(sheet, /A photo from tonight/)
assert.match(sheet, /Change photo/)
assert.match(sheet, /sms__pair/)
assert.match(sheet, /min\(44rem/)
assert.match(sheet, /100dvh/)
assert.match(sheet, /formatSetupClockLabel/)
assert.doesNotMatch(card, /activation-form/)
assert.doesNotMatch(card, /Add tonight's details, then activate/)

assert.match(card, /alreadyLiveFromResponse/)
assert.match(card, /Show Mode is already live\./)
assert.match(card, /show-mode\/manual/)

assert.match(card, /checked in/)
assert.match(card, /new fans/)
assert.match(card, /checkInsThisSession/)
assert.match(card, /fansCapturedThisSession/)
assert.match(card, /Ends \{\{ endsLabel \}\}/)
assert.match(card, /effectiveEndsAt \|\| showModeStatus\.value\?\.endsAt/)
assert.match(card, />Open Live View</)
// Band-aware since Multi-Band Workspace: Live View opens the card's own band.
assert.match(card, /:to="showLivePath"/)
assert.match(card, /workspaceLinkTo\('\/show-live'\)/)
assert.doesNotMatch(card, /Auto-off/)
assert.doesNotMatch(card, /Turn Off Show Mode/)
assert.doesNotMatch(card, /Open Live Show View/)

assert.match(card, />End Show</)
assert.match(card, /End Show\?/)
assert.match(card, /Keep Show Live/)
assert.match(card, /Fan check-in closes/)
assert.match(card, /show-mode\/deactivate/)
assert.match(card, /confirmEnd/)

assert.match(card, /maybeStartRecapAfterAutoEnd/)
assert.match(card, /beginRecapWatch\(priorCampaignId\)/)
assert.match(card, /rememberLiveSession/)
assert.match(card, /lastSession/)
assert.match(card, /pendingPayload/)
assert.match(card, /Preparing your Night/)
assert.match(card, /Preparing your Night/)
assert.match(card, /Still preparing/)
assert.match(card, /View Night/)
assert.match(card, /\/fans\/recaps\/\$\{endedRecap\.id\}\?from=dashboard/)
assert.match(card, /Add photos/)
assert.match(card, /Message attendees/)
assert.match(card, /Your Night is still being prepared/)
assert.match(card, /Try again/)
assert.match(card, /View all Nights/)
assert.doesNotMatch(card, /Keep the room with you/)
assert.match(card, /dismissRecapPanel/)
assert.match(card, />Done</)
assert.match(card, /We're collecting attendance, fan activity and show details/)

assert.match(recent, /Last show/)
assert.match(recent, /View recap/)
assert.match(recent, /View all Nights/)
assert.match(recent, /to="\/nights"/)
assert.doesNotMatch(recent, /Share photos from tonight/)
assert.doesNotMatch(recent, /Message the Room/)
assert.doesNotMatch(recent, /Open Night/)
assert.doesNotMatch(recent, /latest-stats/)
assert.doesNotMatch(card, /Show All Recaps/)
assert.doesNotMatch(card, /checkedInShowCount === 1 \? 'Check-in'/)

assert.match(card, /background: #f3f3f4/)
assert.match(card, /color: #08090a/)
assert.doesNotMatch(card, /linear-gradient\(135deg, #4ca6ff/)
assert.doesNotMatch(card, /from-purple-600 to-pink-600/)
assert.doesNotMatch(card, /#9100ff|#91/)

// Show Live resolves its band through the shared active-workspace helper and
// no longer falls back to the most recently updated owned band.
assert.match(live, /useWorkspaceBand\(/)
assert.match(live, /await requireActiveBand\(\)/)
assert.doesNotMatch(live, /resolveWorkspaceBand/)
assert.doesNotMatch(live, /'sort\[0\]': 'updatedAt:desc'/)

assert.match(page, /:class="\['dashboard-primary', primaryLayoutClass\]"/)
assert.match(page, /showModeLeads\.value \? 'show-mode-leads' : 'show-mode-docked'/)
assert.match(page, /<ShowModeCard\s*\n\s*v-if="hasBand && activeBand\?\.id"/)
// Event card labels now come from the shared activation policy, which also
// owns time eligibility. See test-event-show-mode-activation.mjs.
assert.match(page, /eventShowModeControl\(/)
assert.match(page, /\{\{ ev\.showModeControl\.label \}\}/)
assert.match(page, /show-mode\/from-event/)
assert.match(page, /canOperateShowMode/)
assert.match(page, /Show Mode is already active/)
assert.match(card, /id="dashboard-show-mode"/)
assert.doesNotMatch(page, /#39ff14/i)
assert.match(page, /action-btn-show-mode/)
assert.match(card, /@media \(min-width: 768px\)/)
assert.match(block(card, '.sm-primary,'), /min-height: 48px/)

const fixture = fs.readFileSync(path.join(root, 'pages/__dev/show-mode.vue'), 'utf8')
assert.match(fixture, /\$\{row\.id\}/)
assert.match(fixture, /idle-first/)
assert.match(fixture, /idle-returning/)
assert.match(fixture, /setup/)
assert.match(fixture, /live/)
assert.match(fixture, /end-confirm/)
assert.match(fixture, /generating/)
assert.match(fixture, /ready/)
assert.match(fixture, /timeout/)

console.log('test-show-mode-dashboard-integration: ok')
