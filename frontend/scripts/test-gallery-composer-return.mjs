/**
 * Post-publish "Use in original message" is composer-return only.
 * Run: node scripts/test-gallery-composer-return.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildGalleryComposerReturn,
  isGalleryComposerReturn,
} from '../utils/updates/galleryComposerReturn.js'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8')

assert.equal(
  buildGalleryComposerReturn({ from: '/fans/recaps/123', galleryId: 9 }),
  null,
  'Show Recap from hides the button',
)
assert.equal(
  buildGalleryComposerReturn({ from: '/dashboard', returnGallery: '1', galleryId: 9 }),
  null,
  'dashboard from stays hidden even with a forged flag',
)
assert.equal(
  buildGalleryComposerReturn({ from: '/galleries', galleryId: 9 }),
  null,
)
assert.equal(
  isGalleryComposerReturn({ from: '/messages/compose', returnGallery: '1' }),
  true,
)
assert.equal(
  buildGalleryComposerReturn({
    from: '/messages/compose?audienceType=show_attendees&recapId=3',
    returnGallery: '1',
    galleryId: 41,
  }),
  '/messages/compose?audienceType=show_attendees&recapId=3&galleryId=41',
)
assert.equal(
  buildGalleryComposerReturn({
    from: '/messages/compose?audienceType=all_fans',
    galleryId: 41,
  }),
  null,
  'composer path without explicit returnGallery stays hidden',
)

const studio = read('pages/galleries/new.vue')
assert.match(studio, /buildGalleryComposerReturn/)
/* The publish reveal shows the return link; the page hands it the composer return path. */
assert.ok(studio.includes(`:return-path="returnWithGallery || ''"`), 'page hands the reveal the composer return path')
assert.ok(read('components/galleries/GalleryPublishReveal.vue').includes('<NuxtLink v-if="returnPath" :to="returnPath">Use in original message</NuxtLink>'), 'reveal shows the return link')
assert.match(studio, /returnGallery: route\.query\.returnGallery/)
assert.doesNotMatch(
  studio,
  /if \(!published\.value\?\.id \|\| backTo\.value === '\/galleries'\) return null/,
)

const picker = read('components/messages/FaneqoGalleryPicker.vue')
assert.match(picker, /buildComposerGalleryCreateQuery/)
assert.match(picker, /Upload new photos/)

const recapLaunch = read('utils/updates/sharePhotosFromRecap.js')
assert.doesNotMatch(recapLaunch, /returnGallery/)

const inboxComposer = read('components/messages/FaneqoMessageComposer.vue')
assert.match(inboxComposer, /useMediaUploadQueue/)
assert.match(inboxComposer, /FANEQO_DM_MAX_IMAGES/)
assert.match(inboxComposer, /FaneqoMediaPicker/)
assert.doesNotMatch(inboxComposer, /returnGallery/)
assert.doesNotMatch(inboxComposer, /:return-to=/)

console.log('test-gallery-composer-return: ok')
