/**
 * Broadcast composer → Gallery create hop draft + explicit return contract.
 * Run: node scripts/test-composer-gallery-hop.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import {
  clearComposerGalleryHop,
  composerGalleryHopScope,
  loadComposerGalleryHop,
  saveComposerGalleryHop,
} from '../utils/campaigns/composerGalleryHop.js'
import {
  buildComposerGalleryCreateQuery,
  buildGalleryComposerResume,
  buildGalleryComposerReturn,
  isCompatibleBroadcastGallery,
  isComposerGalleryCreatePath,
  isGalleryComposerReturn,
} from '../utils/updates/galleryComposerReturn.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

function memoryStorage() {
  const map = new Map()
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => { map.set(key, String(value)) },
    removeItem: (key) => { map.delete(key) },
  }
}

const storage = memoryStorage()
const draftKey = saveComposerGalleryHop(storage, {
  bandId: 12,
  audienceType: 'all_fans',
  recapId: '',
  channel: 'in_app',
  subject: '',
  note: 'New photos from tonight',
  draftKey: 'hopkey12abcdef',
})
assert.equal(draftKey, 'hopkey12abcdef')
assert.equal(
  composerGalleryHopScope({ bandId: 12, audienceType: 'all_fans' }),
  '12:all_fans:',
)

const restored = loadComposerGalleryHop(storage, {
  draftKey: 'hopkey12abcdef',
  bandId: 12,
  audienceType: 'all_fans',
})
assert.equal(restored.note, 'New photos from tonight')
assert.equal(
  loadComposerGalleryHop(storage, { bandId: 99, audienceType: 'all_fans', draftKey: 'hopkey12abcdef' }),
  null,
  'wrong band cannot read hop',
)

const viaLatest = loadComposerGalleryHop(storage, {
  bandId: 12,
  audienceType: 'all_fans',
})
assert.equal(viaLatest.note, 'New photos from tonight')

clearComposerGalleryHop(storage, {
  draftKey: 'hopkey12abcdef',
  bandId: 12,
  audienceType: 'all_fans',
})
assert.equal(loadComposerGalleryHop(storage, { bandId: 12, audienceType: 'all_fans' }), null)

assert.equal(isComposerGalleryCreatePath('/galleries/new'), true)
assert.equal(isComposerGalleryCreatePath('/galleries'), false)

const allFansCreate = buildComposerGalleryCreateQuery({
  bandId: 12,
  from: '/messages/compose?audienceType=all_fans&galleryId=9&draftKey=oldkey12',
  audienceType: 'all_fans',
  draftKey: 'hopkey12abcdef',
})
assert.equal(allFansCreate.context, 'general')
assert.equal(allFansCreate.returnGallery, '1')
assert.equal(allFansCreate.draftKey, 'hopkey12abcdef')
assert.equal(allFansCreate.from, '/messages/compose?audienceType=all_fans')
assert.ok(!allFansCreate.recapId)

const showCreate = buildComposerGalleryCreateQuery({
  bandId: 12,
  from: '/messages/compose?audienceType=show_attendees&recapId=7',
  audienceType: 'show_attendees',
  recapId: 7,
  draftKey: 'hopkey12abcdef',
})
assert.equal(showCreate.context, 'show')
assert.equal(showCreate.recapId, '7')
assert.equal(showCreate.returnGallery, '1')

assert.equal(
  isGalleryComposerReturn({ from: '/fans/recaps/7', returnGallery: '1' }),
  false,
)
assert.equal(
  buildGalleryComposerReturn({
    from: '/messages/compose?audienceType=all_fans',
    returnGallery: '1',
    galleryId: 456,
    draftKey: 'hopkey12abcdef',
  }),
  '/messages/compose?audienceType=all_fans&galleryId=456&draftKey=hopkey12abcdef',
)
assert.equal(
  buildGalleryComposerResume({
    from: '/messages/compose?audienceType=all_fans',
    returnGallery: '1',
    draftKey: 'hopkey12abcdef',
  }),
  '/messages/compose?audienceType=all_fans&draftKey=hopkey12abcdef',
)
assert.equal(
  buildGalleryComposerReturn({
    from: '/messages/compose?audienceType=all_fans',
    galleryId: 456,
    draftKey: 'hopkey12abcdef',
  }),
  null,
  'from alone is not composer-return intent',
)

assert.equal(
  isCompatibleBroadcastGallery(
    { id: 1, status: 'published', visibility: 'public' },
    { audienceType: 'all_fans' },
  ),
  true,
)
assert.equal(
  isCompatibleBroadcastGallery(
    { id: 1, status: 'archived', visibility: 'public' },
    { audienceType: 'all_fans' },
  ),
  false,
)
assert.equal(
  isCompatibleBroadcastGallery(
    { id: 1, status: 'published', visibility: 'show_attendees', showRecapId: 7 },
    { audienceType: 'all_fans' },
  ),
  false,
)
assert.equal(
  isCompatibleBroadcastGallery(
    { id: 2, status: 'published', visibility: 'show_attendees', showRecapId: 7 },
    { audienceType: 'show_attendees', recapId: 7 },
  ),
  true,
)
assert.equal(
  isCompatibleBroadcastGallery(
    { id: 2, status: 'published', visibility: 'show_attendees', showRecapId: 8 },
    { audienceType: 'show_attendees', recapId: 7 },
  ),
  false,
)

const picker = read('components/messages/FaneqoGalleryPicker.vue')
assert.match(picker, /Upload new photos/)
assert.match(picker, /No galleries yet/)
assert.match(picker, /buildComposerGalleryCreateQuery/)
assert.match(picker, /emit\('create'/)
assert.doesNotMatch(picker, /authorized gallery reference—not copied photos/)
assert.doesNotMatch(picker, /v-else-if="!galleries\.length"[\s\S]*Create a gallery/)

const composer = read('components/dashboard/fans/FanCampaignComposer.vue')
assert.match(composer, /startGalleryCreate/)
assert.match(composer, /saveComposerGalleryHop/)
assert.match(composer, /restoreComposerHop/)
assert.match(composer, /isComposerGalleryCreatePath\(to\.path\) && allowLeave/)
assert.match(composer, />\s*Change\s*</)
assert.match(composer, /removeGallery/)

const composePage = read('pages/messages/compose.vue')
assert.match(composePage, /initialGalleryId/)
assert.match(composePage, /route\.query\.galleryId/)

const studio = read('pages/galleries/new.vue')
assert.match(studio, /returningToComposer/)
assert.match(studio, /navigateTo\(dest, \{ replace: true \}\)/)
assert.match(studio, /buildGalleryComposerResume/)
assert.match(studio, /Use in original message/)
assert.match(studio, /returnGallery: route\.query\.returnGallery/)

const inboxComposer = read('components/messages/FaneqoMessageComposer.vue')
assert.match(inboxComposer, /startInboxGalleryCreate/)
assert.match(inboxComposer, /from: '\/messages'/)
assert.doesNotMatch(inboxComposer, /returnGallery/)
assert.doesNotMatch(inboxComposer, /saveComposerGalleryHop/)

console.log('test-composer-gallery-hop: ok')
