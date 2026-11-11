/**
 * Legal essentials: the Terms of Service and Privacy Policy state the
 * founder-approved policies, match the billing copy, invent no business
 * identity, and publish without incomplete placeholders after founder approval.
 * Run: node scripts/test-legal-pages.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileTemplate, parse } from '@vue/compiler-sfc'
import { LEGAL_INFO, legalReadyToPublish, legalMissingFields } from '../utils/legal/legalInfo.js'
import { PRO_PRICE_LABEL, TRIAL_DAYS, CANCEL_HOW } from '../utils/billing/billingTerms.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8')
const tos = read('pages/termsofservice.vue')
const privacy = read('pages/privacypolicy.vue')
const tpl = (src) => src.slice(0, src.lastIndexOf('</template>'))
let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('business identity: sole proprietor in Illinois, never an invented LLC or corporation', () => {
  assert.match(LEGAL_INFO.operatorStructure, /individual sole proprietor based in Illinois/)
  for (const [name, src] of [['terms', tos], ['privacy', privacy], ['legalInfo', read('utils/legal/legalInfo.js')]]) {
    const text = tpl(src).replace(/not a corporation or an LLC/g, '')
    assert.doesNotMatch(name === 'legalInfo' ? '' : text, /\bLLC\b|\bInc\.?\b|\bCorp(oration)?\b|\bLtd\b/i, `${name} claims an entity`)
  }
  for (const src of [tos, privacy]) assert.match(tpl(src), /Faneqo is not a corporation or an LLC/)
})

test('published identity and contact are accurate, without claiming email deliverability', () => {
  assert.equal(LEGAL_INFO.operatorLegalName, 'Nikolaos Tsoukas')
  assert.equal(LEGAL_INFO.supportEmail, 'support@faneqo.com')
  assert.equal(LEGAL_INFO.supportEmailVerified, false)
  assert.equal(LEGAL_INFO.mailingAddress, null)
  assert.equal(LEGAL_INFO.effectiveDate, 'November 10, 2026')
  assert.deepEqual(legalMissingFields(), [])
  assert.equal(legalReadyToPublish(), true)
  for (const src of [tos, privacy]) {
    assert.match(src, /<span v-if="info.operatorLegalName">\{\{ info.operatorLegalName \}\}<\/span>/)
    assert.match(src, /:href="\`mailto:\$\{info.supportEmail\}\`"/)
    assert.doesNotMatch(tpl(src), /\[to confirm: mailing address|\[recommended, to confirm:/)
    assert.doesNotMatch(src, /gmail\.com|720-?237|tel:/)
    assert.doesNotMatch(src, /December 1, 2024/)
  }
})

test('no unimplemented age gate; children privacy notice remains', () => {
  assert.doesNotMatch(tpl(tos), /at least 13|at least 18|info\.agePolicy|AGE_POLICY_RECOMMENDATION/)
  assert.match(tpl(privacy), /not directed to children under 13/)
  assert.doesNotMatch(tpl(privacy), /recommended, to confirm|info\.agePolicy/)
})

test('merch pickup is not described (not on the current artist page templates)', () => {
  for (const src of [tos, privacy]) assert.doesNotMatch(tpl(src), /merch/i)
})

test('terms: Pro price, trial, first charge, renewal and cancellation match the C3 billing copy', () => {
  assert.equal(LEGAL_INFO.proPrice, PRO_PRICE_LABEL)
  assert.equal(LEGAL_INFO.trialDays, TRIAL_DAYS)
  assert.ok(CANCEL_HOW.includes(LEGAL_INFO.cancelPath))
  const t = tpl(tos)
  assert.match(t, /\{\{ info.trialDays \}\}-day free trial of Faneqo Pro/)
  assert.match(t, /don’t\s+need a card to start it/)
  assert.match(t, /nothing is charged and Pro simply ends/)
  assert.match(t, /first charge happens when the trial ends/)
  assert.match(t, /start Pro early, the rest of your trial ends and you’re charged that day/)
  assert.match(t, /renews automatically every month/)
  assert.match(t, /future\s+renewals stop and Pro stays on until the end of the period you’ve already paid for/)
  assert.match(t, /show you the price, when the first charge\s+happens, how often it renews, and how to cancel/)
})

test('terms: legacy prices respected; restart at the current price', () => {
  const t = tpl(tos)
  assert.match(t, /earlier price \(for example \$7\/month\), you keep that price while\s+your subscription stays active/)
  assert.match(t, /cancel and later restart, the current price applies/)
})

test('terms: subscription refunds follow the approved policy and its four exceptions', () => {
  const t = tpl(tos)
  assert.match(t, /generally not refundable once you’ve been billed/)
  for (const re of [/charges we made by mistake/, /duplicate charges/, /anything the law requires us to refund/, /goodwill/]) assert.match(t, re)
})

test('terms: fan payments, 2% fee, Stripe role, approval, refunds and chargebacks', () => {
  const t = tpl(tos)
  assert.equal(LEGAL_INFO.platformFeePercent, 2)
  assert.match(t, /Stripe Connected Account Agreement/)
  assert.match(t, /Faneqo never sees or stores card numbers/)
  assert.match(t, /proceeds, so the fan pays the price shown/)
  assert.match(t, /separate from Faneqo’s fee/)
  assert.match(t, /Faneqo team approves the account/)
  assert.match(t, /Paying for Pro does not by itself turn on fan payments/)
  assert.match(t, /generally keeps its \{\{ info.platformFeePercent \}\}%\s+platform fee/)
  assert.match(t, /chargeback/)
  // Accurate for direct charges on Express accounts: the bank decides, Stripe debits the artist's balance.
  assert.match(t, /the fan’s bank decides the outcome,\s+not Faneqo or the artist/)
  assert.match(t, /Stripe takes the disputed amount and its\s+dispute fee from the artist’s Stripe balance/)
  assert.match(t, /returns the disputed amount if the dispute is\s+decided in the artist’s favor/)
  assert.match(t, /refund is paid back from the artist’s Stripe balance/)
  assert.match(t, /may be taken from the artist’s future payouts/)
  // No claim that the artist runs refunds or disputes in Stripe themselves.
  assert.doesNotMatch(t, /issue refunds through Stripe|artist is responsible for responding/)
})

test('privacy: describes verified collection, trackers, providers and fan-data access', () => {
  const t = tpl(privacy)
  for (const re of [/IP address and the approximate location/, /Google Analytics/, /Meta Pixel/, /Cloudflare/, /Stripe/, /Railway/, /Amazon Web Services/, /Resend/, /supporter wall/, /show check-ins/i, /unsubscribe link/, /do not sell personal information for money/]) {
    assert.match(t, re)
  }
  // Data-handling promises we can't verify are not made.
  assert.doesNotMatch(t, /within \d+ days|permanently delete|guarantee(?!\b it)/i)
})

test('navigation unchanged: same routes, cross-links between the two pages, sitemap entries kept', () => {
  assert.match(tpl(tos), /<NuxtLink to="\/privacypolicy"/)
  assert.match(tpl(privacy), /<NuxtLink to="\/termsofservice"/)
  const cfg = read('nuxt.config.ts')
  assert.match(cfg, /loc: '\/privacypolicy'/)
  assert.match(cfg, /loc: '\/termsofservice'/)
  assert.match(read('components/home-v2/HomeV2Page.vue'), /to="\/termsofservice"/)
})

test('both pages compile', () => {
  for (const [file, src] of [['termsofservice.vue', tos], ['privacypolicy.vue', privacy]]) {
    const { descriptor, errors } = parse(src, { filename: file })
    assert.equal(errors.length, 0, `${file} parse`)
    const out = compileTemplate({ source: descriptor.template.content, filename: file, id: file })
    assert.equal(out.errors.length, 0, `${file} template: ${out.errors.join(', ')}`)
  }
})

console.log(`\n=== legal pages: ${passed} passed ===`)
