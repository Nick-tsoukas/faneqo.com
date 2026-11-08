/**
 * Artist Page fan-capture relationship + post-join account continuation.
 * Run: node scripts/test-fan-capture-relationship.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { FAN_ACCOUNT_PROMPTS_ENABLED } from '../config/fanAccountFeatureFlags.js'

const here = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(here, '..', rel), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.scriptSetup || descriptor.script) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
}

const capture = read('components/band/FanCaptureSection.vue')
const conversion = read('composables/useFanAccountConversion.js')
const prompt = read('components/fan/FanAccountPrompt.vue')
const flags = read('config/fanAccountFeatureFlags.js')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

test('global account prompts stay off', () => {
  assert.equal(FAN_ACCOUNT_PROMPTS_ENABLED, false)
  assert.match(flags, /FAN_ACCOUNT_PROMPTS_ENABLED = false/)
  assert.match(conversion, /if \(!isFanAccountPromptsEnabled\(\)\) return false/)
})

test('join still creates the fan first via subscribe', () => {
  assert.match(capture, /joinArtistFanList/)
  assert.match(read('utils/fan/joinArtistFanList.js'), /\/api\/fans\/subscribe/)
  assert.match(capture, /visitorToken: getVisitorToken\(\) \|\| undefined/)
  assert.doesNotMatch(capture, /\/api\/fans\/already-joined/)
  assert.doesNotMatch(capture, /is this email/i)
})

test('signed-in membership is self-scoped, not an email lookup', () => {
  assert.match(capture, /\/api\/fan-account\/artists/)
  assert.match(capture, /Authorization: `Bearer \$\{strapiToken\.value\}`/)
  assert.match(capture, /alreadyJoined\.value = true/)
  assert.match(capture, /match\?\.status === 'subscribed'/)
  assert.match(capture, /fail closed/)
})

test('signed-in email can prefill; already-joined hides the form', () => {
  assert.match(capture, /user\.value\?\.email/)
  assert.match(capture, /v-if="showEmailField"/)
  assert.match(capture, /v-if="showArtistJoinedState"/)
  assert.match(capture, /joinedDisplayMessage/)
})

test('anonymous success opens the existing account sheet without enabling global prompts', () => {
  assert.match(conversion, /function showAfterFanJoin/)
  assert.match(conversion, /trigger: 'fan_list_join'/)
  assert.doesNotMatch(conversion, /function showAfterFanJoin[\s\S]*isFanAccountPromptsEnabled/)
  assert.match(capture, /showAfterFanJoin\(/)
  assert.match(capture, /!user\.value/)
  assert.match(prompt, /useFanAccountConversion/)
  assert.match(prompt, /Create free account/)
})

test('account prompt still sends sanitized returnTo and join email', () => {
  assert.match(conversion, /emailInput: normalized/)
  assert.match(prompt, /context\?\.returnTo \|\| route\.fullPath/)
  assert.match(conversion, /async function requestLink\(\{ email, returnTo \}/)
})

test('signed-in join uses account email, sends JWT, then lazy-claims via artists', () => {
  assert.match(capture, /const accountEmail = String\(user\.value\?\.email/)
  assert.match(capture, /email: accountEmail \|\| email\.value/)
  assert.match(capture, /authToken: strapiToken\.value/)
  assert.match(read('utils/fan/joinArtistFanList.js'), /Bearer \$\{authToken\}/)
  assert.match(capture, /if \(user\.value\) \{\s*await resolveSignedInMembership\(\)/)
  assert.match(capture, /alreadyJoined\.value = true/)
})

test('signed-in join converges to already-joined copy, not a second form', () => {
  assert.match(capture, /if \(alreadyJoined\.value\) return alreadyJoinedTitle\.value/)
  assert.match(capture, /You're already on \$\{name\}'s fan list/)
  assert.match(capture, /showEmailField = computed\(\(\) => !contactable\.value\)/)
  assert.match(capture, /return success\.value \|\| alreadyJoined\.value/)
})

test('anonymous prompt dismiss and request-link failure do not roll back join', () => {
  assert.match(conversion, /if \(trigger === 'fan_list_join'\) fanListJoinDismissed\.value = true/)
  assert.match(conversion, /if \(fanListJoinDismissed\.value\) return false/)
  assert.doesNotMatch(conversion, /success\.value = false/)
  assert.doesNotMatch(prompt, /success\.value = false/)
  assert.match(prompt, /prompt\.value\.error/)
  assert.match(conversion, /prompt\.value\.error =/)
  assert.match(capture, /success\.value = true/)
  assert.match(capture, /showAfterFanJoin\(/)
})

test('magic-link verify returns through sanitizer; artist page then reads claimed artists', () => {
  const verify = read('pages/fan/verify.vue')
  assert.match(verify, /resolveFanLoginReturnTo\(res\?\.data\?\.redirectTo/)
  assert.match(prompt, /context\?\.returnTo \|\| route\.fullPath/)
  assert.match(capture, /\/api\/fan-account\/artists/)
  assert.match(conversion, /emailInput: normalized/)
})

test('fan-capture relationship SFCs compile', () => {
  compileSfc('components/band/FanCaptureSection.vue')
  compileSfc('components/fan/FanAccountPrompt.vue')
})

console.log(`test-fan-capture-relationship: ${passed} passed`)
