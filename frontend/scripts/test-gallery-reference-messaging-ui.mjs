/**
 * Gallery-reference messaging UI contracts.
 * Run: node scripts/test-gallery-reference-messaging-ui.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const inbox = read('composables/useInbox.js')
const updates = read('composables/useArtistUpdates.js')
const mapper = read('utils/messages/mapInboxModels.js')
const composer = read('components/messages/FaneqoMessageComposer.vue')
const picker = read('components/messages/FaneqoGalleryPicker.vue')
const card = read('components/messages/FaneqoGalleryMessageCard.vue')
const engine = read('components/messages/FaneqoChatEngine.client.vue')
const home = read('components/messages/MessagesHome.vue')

assert.match(inbox, /artistUpdateId/)
assert.match(inbox, /\.\.\.\(artistUpdateId \? \{ artistUpdateId \} : \{\}\)/)
assert.match(updates, /\/api\/artist-updates\/manage/)
assert.match(updates, /data\.map\(normalizeUpdate\)/)

assert.match(composer, /FaneqoGalleryPicker/)
assert.match(composer, /FaneqoGalleryMessageCard/)
assert.match(composer, /selectedGallery/)
assert.match(composer, /galleryReference: selectedGallery\.value/)
assert.match(composer, /!selectedGallery && !queue\.items\.length/)
assert.match(picker, /Upload new photos/)
assert.match(picker, /isCompatibleBroadcastGallery/)
assert.match(picker, /No galleries yet/)
assert.match(picker, /row\.visibility === 'show_attendees'|audienceType === 'show_attendees'/)

assert.match(card, /saveGallery\(props\.gallery\.id\)/)
assert.match(card, /sharePassportGallery/)
assert.match(card, /Saved to your FanPassport/)
assert.match(card, /This gallery is no longer available/)
assert.match(card, /FaneqoGalleryStack/)
assert.match(card, /size="attachment"/)
assert.match(card, /onStackActivate/)

assert.match(mapper, /galleryReference: mapGalleryReference\(row\)/)
assert.match(mapper, /locked: true/)
assert.match(engine, /FaneqoGalleryMessageCard/)
assert.match(engine, /viewer-role="viewerRole"/)
assert.match(engine, /allow-gallery="viewerRole === 'artist'/)
assert.match(engine, /!msg\.galleryReference && messageAttachments\(msg\)\.length/)
assert.match(engine, /isGroupedWithPrevious/)
assert.match(engine, /isLastGalleryInSenderRun|showGalleryActions/)
assert.match(card, /hideActions/)
assert.match(card, /isGenericGalleryTitle/)
assert.match(card, /galleryMessageTitle/)
assert.match(home, /:band-id="bandId"/)
assert.match(home, /artistUpdateId: galleryReference\?\.id \|\| null/)
assert.match(home, /gallerySharePreview/)
assert.doesNotMatch([inbox, updates, mapper, composer, picker, card, engine, home].join('\n'), /\/api\/labs\/relationship/)

console.log('test-gallery-reference-messaging-ui: ok')
