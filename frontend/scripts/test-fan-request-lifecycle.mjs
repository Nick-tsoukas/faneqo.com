/**
 * Fan → artist request lifecycle (M1).
 * Run: node scripts/test-fan-request-lifecycle.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { isRequestRowId } from '../utils/messages/fanIdentity.js'
import {
  applyArtistInboxPollTransition,
  applyFanInboxPollTransition,
  conversationLoadFailureKind,
  fanNumericRouteTarget,
  matchPendingRequest,
  matchPendingRequestForUnavailableRoute,
} from '../utils/messages/fanInboxSelection.js'

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

test('touched request-lifecycle SFCs compile', () => {
  compileSfc('components/messages/FanMessagesHome.vue')
  compileSfc('components/messages/FaneqoChatEngine.client.vue')
  compileSfc('components/messages/MessagesHome.vue')
})

test('pending request selection does not call getConversation', () => {
  const home = read('components/messages/FanMessagesHome.vue')
  assert.match(home, /fanNumericRouteTarget/)
  assert.match(home, /routeTarget\.action === 'request'/)
  assert.match(home, /selectPendingRequest/)
  assert.match(home, /matchPendingRequestForUnavailableRoute/)
  assert.doesNotMatch(
    home,
    /if \(pending[\s\S]{0,80}getConversation/
  )
})

test('pending UI renders and composer stays hidden', () => {
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  assert.match(engine, /Request pending/)
  assert.match(engine, /Your message request is waiting for the artist\./)
  assert.match(engine, /v-if="showComposer"/)
  assert.match(engine, /!props\.messagesError/)
  assert.match(engine, /!props\.conversationUnavailable/)
  assert.match(engine, /isRequestRowId\(props\.selectedConversationId\)/)
})

test('failed conversation hides composer and 403/404 leave the thread', () => {
  const home = read('components/messages/FanMessagesHome.vue')
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  assert.match(home, /conversationLoadFailureKind/)
  assert.match(home, /clearUnavailableThread/)
  assert.match(home, /This conversation isn't available/)
  assert.match(engine, /conversationUnavailable/)
  assert.match(engine, /Back to Messages/)
  assert.equal(conversationLoadFailureKind(403), 'unavailable')
  assert.equal(conversationLoadFailureKind(404), 'unavailable')
  assert.equal(conversationLoadFailureKind(500), 'retry')
  assert.equal(conversationLoadFailureKind(0), 'retry')
})

test('explicit request rows stay request presentation ids', () => {
  const requests = [{ id: 'request:42', requestId: 42, artist: { id: 10, name: 'BurningThunder' } }]
  assert.equal(matchPendingRequest('request:42', requests)?.requestId, 42)
  assert.equal(matchPendingRequest('42', requests), null)
  assert.equal(matchPendingRequest('77', requests), null)
  assert.equal(isRequestRowId('42'), false)
  assert.deepEqual(fanNumericRouteTarget('request:42'), { action: 'request', selectedId: 'request:42' })
})

test('numeric conversation route is not hijacked by a same-id request', () => {
  const requests = [{ id: 'request:42', requestId: 42, artist: { id: 10, name: 'BurningThunder' } }]
  assert.deepEqual(fanNumericRouteTarget('42'), { action: 'conversation', conversationId: '42' })
  assert.equal(matchPendingRequest('42', requests), null)
  assert.equal(matchPendingRequestForUnavailableRoute('42', requests)?.requestId, 42)
  const home = read('components/messages/FanMessagesHome.vue')
  assert.match(home, /fanNumericRouteTarget\(id\)/)
  assert.match(home, /inbox\.getConversation\(cid\)/)
})

test('accepted request poll opens the canonical conversation', () => {
  const previous = [{ id: 'request:42', requestId: 42, artist: { id: 10, name: 'BurningThunder' } }]
  const nextConversations = [{ id: '77', artist: { id: 10, name: 'BurningThunder' } }]
  const opened = applyFanInboxPollTransition({
    selectedId: 'request:42',
    previousRequests: previous,
    nextRequests: [],
    nextConversations,
  })
  assert.deepEqual(opened, { action: 'open-conversation', conversationId: '77' })
})

test('stale request selection clears safely', () => {
  const cleared = applyFanInboxPollTransition({
    selectedId: 'request:42',
    previousRequests: [{ id: 'request:42', requestId: 42, artist: { id: 10 } }],
    nextRequests: [],
    nextConversations: [],
  })
  assert.deepEqual(cleared, { action: 'clear' })
  const kept = applyFanInboxPollTransition({
    selectedId: 'request:42',
    previousRequests: [{ id: 'request:42', requestId: 42 }],
    nextRequests: [{ id: 'request:42', requestId: 42 }],
    nextConversations: [],
  })
  assert.deepEqual(kept, { action: 'keep', selectedId: 'request:42' })
})

test('artist accept poll also leaves a stale request selection', () => {
  const opened = applyArtistInboxPollTransition({
    selectedId: 'request:9',
    previousRequests: [{ id: 'request:9', requestId: 9, fan: { fanId: 100 } }],
    nextRequests: [],
    nextConversations: [{ id: '77', fan: { fanId: 100 } }],
    previousConversationIds: [],
  })
  assert.deepEqual(opened, { action: 'open-conversation', conversationId: '77' })
})

test('valid fan conversation uses artist identity from the row', () => {
  const engine = read('components/messages/FaneqoChatEngine.client.vue')
  const home = read('components/messages/FanMessagesHome.vue')
  assert.match(engine, /row\.artist\?\.name \|\| row\.fan\?\.displayName \|\| 'Artist'/)
  assert.match(home, /rememberThreadArtist/)
  assert.match(home, /conv\?\.artist/)
})

test('existing conversation opens the conversation route, not a request', () => {
  const request = read('composables/useFanMessageRequest.js')
  const home = read('components/messages/FanMessagesHome.vue')
  assert.match(request, /status\.value\.state === 'conversation' && status\.value\.conversationId/)
  assert.match(request, /navigateTo\(`\/fan\/messages\/\$\{status\.value\.conversationId\}`\)/)
  assert.match(request, /existingConversation && result\.conversationId/)
  assert.doesNotMatch(request, /\/fan\/messages\/\$\{.*request/)
  assert.match(home, /navigateTo\(`\/fan\/messages\/\$\{next\}`\)/)
  assert.match(home, /navigateTo\('\/fan\/messages', \{ replace: true \}\)/)
})

console.log(`\n=== fan request lifecycle: ${passed} passed ===`)
