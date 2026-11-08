/**
 * Inbox thread merge tests (no Vue test runner in this repo).
 * Run: node scripts/test-inbox-thread-merge.mjs
 */
import assert from 'node:assert/strict'
import { mergeInboxThread, compareInboxMessageOrder, isInboxAuthError } from '../utils/messages/threadMerge.js'

function opt(clientMessageId) {
  return {
    id: `opt-${clientMessageId}`,
    clientMessageId,
    body: 'hi',
    createdAt: '2026-08-14T12:00:00.000Z',
    optimistic: true,
    status: 'sending',
    isMine: true,
  }
}

function server(id, clientMessageId, extra = {}) {
  return {
    id: String(id),
    clientMessageId,
    body: 'hi',
    createdAt: extra.createdAt || '2026-08-14T12:00:00.100Z',
    optimistic: false,
    seenByRecipient: extra.seenByRecipient || false,
    status: extra.seenByRecipient ? 'seen' : 'sent',
    isMine: true,
  }
}

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('poll + optimistic same clientMessageId is one bubble', () => {
  const merged = mergeInboxThread([opt('abc')], [server(812, 'abc')])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, '812')
  assert.equal(merged[0].optimistic, false)
  assert.equal(merged[0].status, 'sent')
})

test('send response after poll does not duplicate', () => {
  const afterPoll = mergeInboxThread([opt('abc')], [server(812, 'abc')])
  const afterSend = mergeInboxThread(afterPoll, [server(812, 'abc')])
  assert.equal(afterSend.length, 1)
  assert.equal(afterSend[0].id, '812')
})

test('stable order uses createdAt then numeric id', () => {
  const a = server(2, 'a', { createdAt: '2026-08-14T12:00:00.000Z' })
  const b = server(1, 'b', { createdAt: '2026-08-14T12:00:00.000Z' })
  const merged = mergeInboxThread([a], [b])
  assert.deepEqual(merged.map((m) => m.id), ['1', '2'])
  assert.ok(compareInboxMessageOrder(b, a) < 0)
})

test('optimistic image keeps local preview and one bubble', () => {
  const local = {
    ...opt('img-1'),
    attachment: { type: 'image', url: 'blob:http://local/preview', mediaId: 9 },
  }
  const remote = {
    ...server(900, 'img-1'),
    attachment: { type: 'image', url: 'https://cdn.example/show.jpg' },
  }
  const merged = mergeInboxThread([local], [remote])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].id, '900')
  assert.equal(merged[0].attachment.url, 'blob:http://local/preview')
  assert.equal(merged[0].attachment.mediaId, 9)
})

test('optimistic 4-image message reconciles to one bubble', () => {
  const local = {
    ...opt('set-4'),
    attachments: [1, 2, 3, 4].map((n) => ({
      type: 'image',
      url: `blob:http://local/${n}`,
      mediaId: n,
    })),
  }
  const remote = {
    ...server(901, 'set-4'),
    attachments: [1, 2, 3, 4].map((n) => ({
      type: 'image',
      url: `https://cdn.example/${n}.jpg`,
      mediaId: n,
    })),
  }
  const merged = mergeInboxThread([local], [remote])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].attachments.length, 4)
  assert.equal(merged[0].attachments[0].url, 'blob:http://local/1')
  assert.equal(merged[0].attachments[3].mediaId, 4)
})

test('401 is an auth error; 500 is not', () => {
  assert.equal(isInboxAuthError({ status: 401 }), true)
  assert.equal(isInboxAuthError({ statusCode: 401 }), true)
  assert.equal(isInboxAuthError({ status: 500 }), false)
})

console.log(`\n=== thread merge: ${passed} passed ===\n`)
