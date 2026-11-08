/**
 * Fan Account V1 — Slice D2: avatar frontend integration.
 * Run: node scripts/test-fan-avatar.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { isFanAuthPath, isFaneqoAppPath } from '../utils/ui/appSurface.js'
import { fanNavActiveTab, isFanNavVisible } from '../utils/ui/fanNav.js'
import {
  FAN_AVATAR_ACCEPT,
  FAN_AVATAR_ACCEPT_TYPES,
  FAN_AVATAR_FIELD,
  FAN_AVATAR_MAX_BYTES,
  fanAvatarClientCheck,
  fanAvatarErrorMessage,
  fanProfilePatchBody,
  resolveFanAvatarUrl,
} from '../utils/fan/fanProfileIdentity.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  const script = compileScript(descriptor, { id: rel, filename: rel })
  assert.ok(script.content, `${rel} script compiled`)
  const template = compileTemplate({
    source: descriptor.template.content,
    filename: rel,
    id: rel,
  })
  assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  return { source }
}

const page = read('pages/fan/profile.vue')
const home = read('pages/fan/index.vue')
const avatar = read('components/fan/FanAvatar.vue')
const control = read('components/fan/FanAvatarControl.vue')
const composable = read('composables/useFanProfile.js')
const messagesHome = read('components/messages/FanMessagesHome.vue')
const login = read('pages/fan/login.vue')
const verify = read('pages/fan/verify.vue')

test('touched avatar SFCs compile', () => {
  compileSfc('pages/fan/profile.vue')
  compileSfc('components/fan/FanAvatar.vue')
  compileSfc('components/fan/FanAvatarControl.vue')
  compileSfc('pages/fan/index.vue')
})

test('avatarUrl renders; null uses the Slice C placeholder', () => {
  assert.match(avatar, /v-if="resolvedUrl && !broken"/)
  assert.match(avatar, /v-else-if="initials"/)
  assert.match(avatar, /:is="icons\.user"/)
  assert.match(avatar, /@error="broken = true"/)
  assert.match(avatar, /object-position: center/)
  assert.match(page, /FanAvatarControl/)
  assert.match(page, /:avatar-url="profile\?\.avatarUrl"/)
  assert.match(home, /:avatar-url="fanProfile\?\.avatarUrl"/)
  assert.doesNotMatch(avatar, /email\.split|split\('@'\)/)
  assert.doesNotMatch(control, /email\.split|split\('@'\)/)
})

test('file picker is limited to jpeg, png, and webp', () => {
  assert.equal(FAN_AVATAR_ACCEPT, 'image/jpeg,image/png,image/webp')
  assert.deepEqual(FAN_AVATAR_ACCEPT_TYPES, ['image/jpeg', 'image/png', 'image/webp'])
  assert.match(control, /type="file"/)
  assert.match(control, /:accept="accept"/)
  assert.match(control, /FAN_AVATAR_ACCEPT/)
  assert.doesNotMatch(control, /image\/gif|image\/svg|video\/|application\/pdf|image\/\*/)
  assert.doesNotMatch(control, /capture=/)
})

test('avatar tap target and file input are labeled; loading is announced', () => {
  const fileInput = control.match(/<input[\s\S]*?type="file"[\s\S]*?>/)
  assert.ok(fileInput, 'file input exists')
  assert.match(fileInput[0], /:aria-label="hitLabel"/)
  assert.match(control, /hitLabel = computed\(\(\) => \(\s*hasAvatar\.value \? 'Change profile photo' : 'Add profile photo'\s*\)\)/)
  assert.match(control, /class="fan-avatar-control__hit"/)
  assert.match(control, /:aria-busy="busy \? 'true' : undefined"/)
  assert.match(control, /role="status"/)
  assert.match(control, /min-height: 48px/)
})

test('selected photo opens a center-cover preview before upload', () => {
  assert.match(control, /URL\.createObjectURL\(file\)/)
  assert.match(control, /previewOpen/)
  assert.match(control, /Photo preview/)
  assert.match(control, /object-fit: cover/)
  assert.match(control, /object-position: center/)
  assert.match(control, /Use photo/)
  assert.doesNotMatch(control, /crop editor|face detection|zoom|pinch/i)
})

test('upload POSTs multipart with the avatar field only', () => {
  assert.equal(FAN_AVATAR_FIELD, 'avatar')
  assert.match(composable, /async function uploadAvatar/)
  assert.match(composable, /new FormData\(\)/)
  assert.match(composable, /body\.append\(FAN_AVATAR_FIELD, file/)
  assert.match(composable, /\/api\/fan-account\/avatar/)
  assert.match(composable, /method: 'POST'/)
  assert.doesNotMatch(composable, /append\(['"]fileId|append\(['"]avatarId|append\(['"]profileId/)
  assert.doesNotMatch(composable, /body\.append\(['"]avatarUrl/)
})

test('successful upload replaces local profile from the response', () => {
  assert.match(composable, /profile\.value = normalize\(res\?\.data\)/)
  assert.match(page, /await uploadAvatar\(file\)/)
  assert.match(page, /flashSaved\('Photo updated'\)/)
  assert.doesNotMatch(page, /reload\(|location\.href|window\.location/)
})

test('failed replacement does not clear the previous avatarUrl', () => {
  const uploadBlock = composable.slice(
    composable.indexOf('async function uploadAvatar'),
    composable.indexOf('async function removeAvatar')
  )
  assert.match(uploadBlock, /profile\.value = normalize\(res\?\.data\)/)
  assert.match(uploadBlock, /applyError/)
  assert.doesNotMatch(uploadBlock, /avatarUrl:\s*null/)
  assert.doesNotMatch(uploadBlock, /profile\.value = null/)
  assert.match(control, /:avatar-url="avatarUrl"/)
  assert.doesNotMatch(control, /previewUrl \|\| avatarUrl/)
})

test('remove calls DELETE and restores the placeholder from the response', () => {
  assert.match(composable, /async function removeAvatar/)
  assert.match(composable, /method: 'DELETE'/)
  assert.match(page, /await removeAvatar\(\)/)
  assert.match(control, /Remove profile photo\?/)
  assert.match(control, /Remove photo/)
  assert.match(control, /Change photo/)
})

test('upload errors map to fan-facing copy', () => {
  assert.equal(
    fanAvatarErrorMessage({ name: 'avatar_invalid_type' }),
    'Choose a JPEG, PNG, or WebP image.'
  )
  assert.equal(
    fanAvatarErrorMessage({ name: 'avatar_too_large' }),
    'Choose an image smaller than 4 MB.'
  )
  assert.equal(
    fanAvatarErrorMessage({ name: 'avatar_process_failed' }),
    "We couldn't process that photo. Try another image."
  )
  assert.equal(
    fanAvatarErrorMessage({ name: 'avatar_upload_failed' }),
    'Photo upload failed. Try again.'
  )
  assert.equal(
    fanAvatarErrorMessage({ name: 'avatar_associate_failed' }),
    "Couldn't save that photo. Try again."
  )
  assert.equal(fanAvatarErrorMessage({ name: 'unauthorized' }), null)
  assert.match(composable, /fanAvatarErrorMessage/)
})

test('client warns about oversize and rejected types before upload', () => {
  assert.equal(FAN_AVATAR_MAX_BYTES, 4 * 1024 * 1024)
  assert.equal(fanAvatarClientCheck({ type: 'image/gif', size: 12 }).ok, false)
  assert.equal(fanAvatarClientCheck({ type: 'image/gif', size: 12 }).code, 'avatar_invalid_type')
  assert.equal(
    fanAvatarClientCheck({ type: 'image/jpeg', size: FAN_AVATAR_MAX_BYTES + 1 }).code,
    'avatar_too_large'
  )
  assert.equal(fanAvatarClientCheck({ type: 'image/jpeg', size: 1200 }).ok, true)
  assert.match(control, /fanAvatarClientCheck\(file\)/)
  assert.match(page, /onAvatarReject/)
})

test('avatar mutations never PATCH profile or call the legacy POST', () => {
  const uploadBlock = composable.slice(
    composable.indexOf('async function uploadAvatar'),
    composable.indexOf('function clearError')
  )
  assert.doesNotMatch(uploadBlock, /method: 'PATCH'/)
  assert.doesNotMatch(uploadBlock, /\/api\/fan-account\/profile/)
  assert.doesNotMatch(composable, /updateFanProfile/)
  assert.deepEqual(
    Object.keys(fanProfilePatchBody({
      displayName: 'Nik',
      firstName: 'Nik',
      lastName: 'T',
      avatarUrl: '/uploads/x.webp',
      avatar: 9,
    })),
    ['displayName', 'firstName', 'lastName']
  )
})

test('avatar upload does not pretend to complete the profile', () => {
  const uploadBlock = composable.slice(
    composable.indexOf('async function uploadAvatar'),
    composable.indexOf('function clearError')
  )
  assert.doesNotMatch(uploadBlock, /profileCompletedAt\s*=/)
  assert.match(page, /Photo updated/)
  assert.doesNotMatch(page, /profile complete|profileCompletedAt/)
})

test('relative avatar URLs resolve against Strapi; protected URLs stay hidden', () => {
  assert.equal(
    resolveFanAvatarUrl('/uploads/a.webp', 'https://cdn.example'),
    'https://cdn.example/uploads/a.webp'
  )
  assert.equal(
    resolveFanAvatarUrl('https://cdn.example/a.webp', 'https://ignored'),
    'https://cdn.example/a.webp'
  )
  assert.equal(resolveFanAvatarUrl('blob:http://localhost/1'), 'blob:http://localhost/1')
  assert.equal(resolveFanAvatarUrl('faneqo-protected:abc', 'https://cdn.example'), null)
  assert.equal(resolveFanAvatarUrl(null), null)
})

test('login, verify, and Messages stay untouched', () => {
  assert.equal(isFanNavVisible('/fan/login'), false)
  assert.equal(isFanNavVisible('/fan/verify'), false)
  assert.equal(isFanAuthPath('/fan/login'), true)
  assert.equal(isFaneqoAppPath('/fan/login'), false)
  assert.equal(fanNavActiveTab('/fan/profile'), 'profile')
  assert.doesNotMatch(login, /FanAvatarControl|uploadAvatar|fan-account\/avatar/)
  assert.doesNotMatch(verify, /FanAvatarControl|uploadAvatar|fan-account\/avatar/)
  assert.doesNotMatch(messagesHome, /FanAvatarControl|uploadAvatar|fan-account\/avatar/)
  assert.doesNotMatch(home, /FanAvatarControl/)
})

test('fan home keeps reading the shared profile cache', () => {
  assert.match(home, /useFanProfile/)
  assert.match(home, /useState\('fan-profile'|loadProfile/)
  assert.match(composable, /useState\('fan-profile'/)
})

console.log(`\n=== fan avatar: ${passed} passed ===`)
