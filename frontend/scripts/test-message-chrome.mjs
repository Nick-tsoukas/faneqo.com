/**
 * Route chrome + campaign-phase helpers used by Messages.
 * Run: node scripts/test-message-chrome.mjs
 */
import assert from 'node:assert/strict'
import { isImmersiveMessagesPath, isMessagesWorkspacePath } from '../utils/messages/messageChrome.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('hub routes keep global nav; threads and compose are immersive', () => {
  assert.equal(isImmersiveMessagesPath('/messages'), false)
  assert.equal(isImmersiveMessagesPath('/messages?tab=campaigns'), false)
  assert.equal(isImmersiveMessagesPath('/messages?tab=sent'), false)
  assert.equal(isImmersiveMessagesPath('/fan/messages'), false)
  assert.equal(isImmersiveMessagesPath('/messages/inbox/12'), true)
  assert.equal(isImmersiveMessagesPath('/messages/compose'), true)
  assert.equal(isImmersiveMessagesPath('/fan/messages/99'), true)
})

test('workspace routes own viewport padding; compose is not a workspace shell', () => {
  assert.equal(isMessagesWorkspacePath('/messages'), true)
  assert.equal(isMessagesWorkspacePath('/messages?tab=campaigns'), true)
  assert.equal(isMessagesWorkspacePath('/messages?tab=sent'), true)
  assert.equal(isMessagesWorkspacePath('/messages/inbox/12'), true)
  assert.equal(isMessagesWorkspacePath('/fan/messages'), true)
  assert.equal(isMessagesWorkspacePath('/fan/messages/99'), true)
  assert.equal(isMessagesWorkspacePath('/messages/compose'), false)
  assert.equal(isMessagesWorkspacePath('/dashboard'), false)
})

console.log(`\n=== message chrome: ${passed} passed ===`)
