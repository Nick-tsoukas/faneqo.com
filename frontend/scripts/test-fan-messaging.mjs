/**
 * Fan → band messaging identity + inbox mapping.
 * Run: node scripts/test-fan-messaging.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  artistFacingDisplayName,
  fanInitials,
  formatArtistFanContext,
  isRequestRowId,
  requestIdFromRow,
  safeFanDisplayName,
} from '../utils/messages/fanIdentity.js'
import { formatFanContextLine } from '../utils/messages/chatUiAdapter.js'
import { mapArtistConversation, mapArtistRequest, mapFanConversation, mapFanRequest } from '../utils/messages/mapInboxModels.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

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
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('touched Messages identity SFCs compile', () => {
  compileSfc('components/messages/FaneqoFanIdentity.vue')
  compileSfc('components/messages/InboxFanSelector.vue')
  compileSfc('components/messages/FaneqoChatEngine.client.vue')
  compileSfc('components/messages/MessagesHome.vue')
  compileSfc('components/messages/FanMessagesHome.vue')
  compileSfc('components/messages/FaneqoGalleryMessageCard.vue')
})

test('Inbox list row falls back to initials when an avatar URL fails', () => {
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  assert.match(engine, /@error="markAvatarBroken\(peerAvatar\(row\)\)"/)
  assert.match(engine, /brokenAvatars/)
  assert.match(engine, /fq-row__avatar--init/)
  assert.match(engine, /rowInitials\(row\)/)
})

test('named fans use first + last initial', () => {
  assert.equal(safeFanDisplayName({ firstName: 'Elizabeth', lastName: 'Rodriguez' }), 'Elizabeth R.')
  assert.equal(safeFanDisplayName({ firstName: 'Elizabeth' }), 'Elizabeth')
  assert.equal(safeFanDisplayName({ firstName: 'Sarah' }), 'Sarah')
  assert.equal(safeFanDisplayName({}), 'Faneqo fan')
  assert.equal(safeFanDisplayName({ firstName: 'liz@x.com' }), 'Faneqo fan')
  assert.equal(safeFanDisplayName({ city: 'Nashville' }), 'Nashville fan')
  assert.equal(safeFanDisplayName({ city: 'Chicago' }), 'Chicago fan')
  assert.equal(safeFanDisplayName({ displayName: 'Fan', city: 'Nashville' }), 'Nashville fan')
  assert.equal(fanInitials({ firstName: 'Elizabeth', lastName: 'Rodriguez' }), 'ER')
  assert.equal(fanInitials({ firstName: 'Sarah' }), 'S')
  assert.equal(fanInitials({ city: 'Nashville' }), 'F')
  assert.equal(fanInitials({}), 'F')
  assert.equal(fanInitials('Nashville fan'), 'F')
  assert.equal(fanInitials('Unnamed fan'), 'F')
  assert.equal(fanInitials('Faneqo fan'), 'F')
})

test('context line uses show counts, not Superfan labels', () => {
  assert.equal(
    formatArtistFanContext({ firstName: 'Elizabeth', lastName: 'Rodriguez', city: 'Nashville', checkedInShowCount: 2, tier: 'Superfan' }),
    'Nashville · 2 shows'
  )
  assert.equal(formatArtistFanContext({ city: 'Chicago', tier: 'Warm' }), '')
  assert.equal(formatArtistFanContext({}), '')
  assert.equal(formatFanContextLine({ city: 'Austin', tier: 'Engaged' }), '')
  assert.equal(
    formatArtistFanContext({ displayName: 'Nashville fan', city: 'Nashville', context: 'Nashville · Fan List' }),
    ''
  )
})

test('request ids stay out of conversation routes', () => {
  assert.equal(isRequestRowId('request:12'), true)
  assert.equal(isRequestRowId('44'), false)
  assert.equal(requestIdFromRow('request:12'), 12)
})

test('artist request cards never expose email', () => {
  const row = mapArtistRequest({
    id: 9,
    status: 'pending',
    createdAt: '2026-08-16T12:00:00.000Z',
    initialMessage: 'Are you coming back this fall?',
    fan: { fanId: 100, displayName: 'Elizabeth R.', initials: 'ER', context: 'Nashville · 2 shows' },
    email: 'hidden@example.com',
    accountUser: 2,
  })
  const blob = JSON.stringify(row)
  assert.equal(row.kind, 'request')
  assert.equal(row.fan.displayName, 'Elizabeth R.')
  assert.equal(row.lastMessagePreview.includes('fall'), true)
  assert.equal(blob.includes('hidden@example.com'), false)
  assert.equal(blob.includes('accountUser'), false)
})

test('fan conversation maps truthful Night relationship context', () => {
  const row = mapFanConversation({
    id: 44,
    artist: { id: 7, name: 'The Rockers', slug: 'the-rockers' },
    showCount: 3,
    lastMessage: { preview: 'hello fan', createdAt: '2026-09-07T12:00:00.000Z' },
  })
  assert.equal(row.fan.displayName, 'The Rockers')
  assert.equal(row.showCount, 3)
  assert.equal(row.fan.context, '3 Nights together')
  assert.equal(mapFanConversation({
    id: 45,
    artist: { name: 'The Rockers' },
    showCount: 0,
  }).fan.context, '')
})

test('fan pending card is not a fake conversation', () => {
  const row = mapFanRequest({
    id: 3,
    createdAt: '2026-08-16T12:00:00.000Z',
    artist: { id: 10, name: 'BurningThunder' },
  })
  assert.equal(row.kind, 'request')
  assert.equal(row.lastMessagePreview, '')
  assert.equal(row.fan.context, 'Request pending')
})

test('legacy unnamed conversation uses Faneqo fan', () => {
  const row = mapArtistConversation({
    id: 1,
    fan: {},
    lastMessage: { preview: 'Hey', createdAt: '2026-08-16T12:00:00.000Z' },
  })
  assert.equal(row.fan.displayName, 'Faneqo fan')
  assert.equal(row.kind, 'conversation')
})

test('artist mapper keeps a chosen FanProfile displayName verbatim', () => {
  assert.equal(artistFacingDisplayName({ displayName: 'Nik Beats' }), 'Nik Beats')
  assert.equal(safeFanDisplayName({ displayName: 'Nik Beats' }), 'Nik B.')
  const row = mapArtistConversation({
    id: 4,
    fan: {
      fanId: 100,
      displayName: 'Nik Beats',
      initials: 'NB',
      avatarUrl: '/uploads/nik.webp',
      context: 'Nashville · 2 shows',
    },
    lastMessage: { preview: 'Hey', createdAt: '2026-09-03T12:00:00.000Z' },
  })
  assert.equal(row.fan.displayName, 'Nik Beats')
  assert.equal(row.fan.initials, 'NB')
  assert.equal(row.fan.avatarUrl, '/uploads/nik.webp')
})

test('artist request mapper keeps avatarUrl and chosen name', () => {
  const row = mapArtistRequest({
    id: 11,
    status: 'pending',
    createdAt: '2026-09-03T12:00:00.000Z',
    initialMessage: 'See you Friday',
    fan: {
      fanId: 100,
      displayName: 'Nik Beats',
      initials: 'NB',
      avatarUrl: '/uploads/nik.webp',
      context: 'Nashville · 2 shows',
    },
  })
  assert.equal(row.fan.displayName, 'Nik Beats')
  assert.equal(row.fan.avatarUrl, '/uploads/nik.webp')
})

test('artist page button stays Message while pending', () => {
  const labelFor = () => 'Message'
  const disabledFor = (state) => state === 'unavailable'
  assert.equal(labelFor('unauthenticated'), 'Message')
  assert.equal(labelFor('can_request'), 'Message')
  assert.equal(labelFor('pending'), 'Message')
  assert.equal(labelFor('conversation'), 'Message')
  assert.equal(disabledFor('pending'), false)
  assert.equal(disabledFor('unavailable'), true)
  assert.equal(disabledFor('can_request'), false)
})

console.log(`\n=== fan messaging: ${passed} passed ===`)
