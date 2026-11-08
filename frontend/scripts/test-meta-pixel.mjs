/**
 * Meta pixel and signup conversion guards.
 * Run: node scripts/test-meta-pixel.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

const plugin = read('plugins/meta-pixel.client.js')
const tracking = read('composables/useMetaTracking.js')
const capi = read('server/api/meta/capi.post.js')
const signup = read('pages/signup.vue')
const success = read('pages/signupSuccess.vue')
const social = read('utils/auth/socialLogin.js')
const firebase = read('composables/useFirebase.ts')
const confirmSocial = read('server/api/stripe/confirm-social.ts')

assert.match(plugin, /fbq\('init', '2397193350740405'\)/)
assert.equal((plugin.match(/2397193350740405/g) || []).length, 1)
assert.equal((plugin.match(/fbq\('track', 'PageView'\)/g) || []).length, 1)
assert.match(plugin, /page:finish/)
assert.doesNotMatch(plugin, /console\.log/)
assert.match(plugin, /connect\.facebook\.net/)

assert.match(tracking, /eventID: eventId/)
assert.match(tracking, /mbq_fired_\$\{eventKey\}/)
assert.match(tracking, /event_id: eventId/)

assert.match(capi, /2397193350740405/)
assert.match(capi, /CompleteRegistration/)
assert.match(capi, /StartTrial/)
assert.match(capi, /ViewContent/)
assert.doesNotMatch(capi, /'Lead'|'Purchase'|'Subscribe'/)
assert.match(capi, /Authorization: `Bearer \$\{accessToken\}`/)
assert.doesNotMatch(capi, /access_token=/)
assert.match(capi, /skipped: true/)
assert.match(capi, /user_data\.em = sha256/)

const registerAt = signup.indexOf('await registerUser(')
const trackedAt = signup.indexOf('await trackSignupCompleted(')
assert.ok(registerAt > 0 && trackedAt > registerAt)
assert.match(signup, /CompleteRegistration/)
assert.match(signup, /StartTrial/)
assert.doesNotMatch(signup, /standardName:\s*'Lead'|event_name:\s*'Lead'|SignupStarted/)

assert.doesNotMatch(success, /fbq|CompleteRegistration|\/api\/meta\/capi/)
assert.match(signup, /\/signupSuccess/)

const newUser = social.slice(social.indexOf('async function newUserFlow'))
const existingUser = social.slice(
  social.indexOf('async function existingUserFlow'),
  social.indexOf('async function newUserFlow')
)
assert.match(newUser, /accountCreated: true/)
assert.match(newUser, /trialStarted: true/)
assert.doesNotMatch(existingUser, /accountCreated/)
assert.match(firebase, /if \(res\.accountCreated\)/)
assert.match(firebase, /if \(res\.trialStarted\)/)
assert.match(confirmSocial, /result\.accountCreated/)
assert.doesNotMatch(firebase, /event_name:\s*'Lead'/)

console.log('meta pixel: ok')
