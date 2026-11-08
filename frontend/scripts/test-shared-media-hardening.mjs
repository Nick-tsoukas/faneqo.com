/**
 * 05B.7 shared-media hardening contracts.
 * Run: node scripts/test-shared-media-hardening.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8')
}

const composer = read('components/messages/FaneqoMessageComposer.vue')
assert.match(composer, /publicFallbackAllowed/)
assert.match(composer, /attachmentsEnabled/)
assert.match(composer, /Photo attachments aren’t available right now/)
assert.doesNotMatch(composer, /if \(!props\.conversationId\) \{\s*return defaultUpload/)
assert.match(composer, /if \(policy\.fallback\) \{\s*return defaultUpload/)
assert.match(composer, /queue\.clear\(\{ revokePreviews: false \}\)/)
assert.match(composer, /:disabled="disabled"/)
assert.match(composer, /:can-add="queue\.canAdd"/)
assert.doesNotMatch(composer, /:disabled="disabled \|\| !attachmentsEnabled"/)
assert.doesNotMatch(composer, /:can-add="queue\.canAdd && attachmentsEnabled"/)
assert.match(composer, /pendingUploadCount/)
assert.match(composer, /Uploading/)

const updates = read('components/updates/ArtistUpdateComposer.vue')
assert.match(updates, /publishIdempotencyKey/)
assert.match(updates, /Photos can be up to 8 MB|8 MB each/)
assert.match(updates, /publishedLock/)
// Honest item counts, one polite live region — never a fake byte percentage.
assert.match(updates, /of \$\{maxPhotos\} selected/)
assert.match(updates, /queue\.readyCount/)
assert.match(updates, /aria-live="polite"/)

const lightbox = read('components/media/FaneqoMediaLightbox.vue')
assert.match(lightbox, /fq-mlb__filmstrip/)
assert.match(lightbox, /aria-current/)
assert.match(lightbox, /scrollIntoView/)
assert.match(lightbox, /z-index:\s*100000000/)
assert.match(lightbox, /Swipe down to close/)

const inbox = read('composables/useInbox.js')
assert.match(inbox, /attachmentMediaIds/)
assert.match(inbox, /clientMessageId/)
assert.match(inbox, /CONVERSATION_UPLOAD_TIMEOUT_MS/)
assert.match(inbox, /upload_timeout/)

const chat = read('components/messages/MessagesHome.vue')
assert.match(chat, /clientMessageId/)
assert.match(chat, /attachmentMediaIds/)
assert.match(chat, /status: 'failed'/)
assert.match(chat, /onRetry/)

const chatEngine = read('components/messages/FaneqoChatEngine.client.vue')
assert.match(chatEngine, /initialFollowConversationId/)
assert.match(chatEngine, /\{ immediate: true \}/)
assert.match(chatEngine, /historyResolved\.value/)
assert.match(chatEngine, /scrollToBottom\('auto'\)/)
assert.doesNotMatch(chatEngine, /scrollByConv/)

const grid = read('components/media/FaneqoMediaGrid.vue')
assert.match(grid, /Photo unavailable/)
assert.match(grid, /is-broken/)
assert.doesNotMatch(grid, /hidden\.value = new Set/)

const homepage = [
  'pages/index.vue',
  'components/marketing/CinematicArtistWorld.vue',
]
for (const rel of homepage) {
  const before = fs.existsSync(path.join(root, rel))
  assert.ok(before, rel)
}

console.log('test-shared-media-hardening: ok')
