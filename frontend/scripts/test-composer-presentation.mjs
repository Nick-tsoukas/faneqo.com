import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'node:url'
import {
  composerAudienceWho,
  composerEmptyCopy,
  composerPlaceholder,
  composerReachCopy,
  composerSendLabel,
  composerSuccessCopy,
  formatComposerNightContext,
  galleryNightLine,
  groupComposerGalleries,
} from '../utils/messages/composerPresentation.js'
import { isCompatibleBroadcastGallery } from '../utils/updates/galleryComposerReturn.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

assert.deepEqual(
  composerAudienceWho({ audienceType: 'all_fans' }),
  {
    kicker: 'Everyone',
    title: 'All fans',
    detail: 'Everyone currently eligible to receive this message.',
  }
)

const night = formatComposerNightContext({
  showTitle: 'The Moon Show',
  venue: 'The Rock',
  showStartedAt: '2026-09-07',
})
assert.equal(night.kicker, 'Sep 7 · The Rock')
assert.equal(night.title, 'The Moon Show')

assert.equal(composerPlaceholder({ audienceType: 'all_fans' }), 'Say something to your fans…')
assert.equal(composerPlaceholder({ audienceType: 'show_attendees' }), 'Say something to everyone who was there…')
assert.equal(composerPlaceholder({ audienceType: 'private', peerName: 'Mike' }), 'Message Mike…')

assert.equal(
  composerReachCopy({ audienceType: 'all_fans', eligible: 147, unavailable: 2 }),
  '147 fans can receive this · 2 unavailable'
)
assert.equal(
  composerReachCopy({ audienceType: 'show_attendees', eligible: 83 }),
  '83 fans can receive this'
)
assert.equal(
  composerReachCopy({ audienceType: 'show_attendees', eligible: 0 }),
  'No eligible attendees for this Night.'
)

assert.equal(composerSendLabel({ eligible: 147, audienceType: 'all_fans' }), 'Send to all fans')
assert.equal(composerSendLabel({ eligible: 83, audienceType: 'show_attendees' }), 'Send to 83 fans')
assert.equal(composerSuccessCopy({ eligible: 83 }).title, 'Sent to 83 people.')

const cooling = composerEmptyCopy({ reason: 'all_cooling', isInbox: true })
assert.match(cooling.body, /not waiting on the email cooldown/)
const emailCooling = composerEmptyCopy({ reason: 'all_cooling', isInbox: false })
assert.match(emailCooling.body, /24 hours/)

const grouped = groupComposerGalleries([
  { id: 1, title: 'Backstage', show: { venue: 'The Rock', date: '2026-09-07' }, visibility: 'show_attendees' },
  { id: 2, title: 'Tour photos', visibility: 'public' },
])
assert.equal(grouped.nights.length, 1)
assert.equal(grouped.general.length, 1)
assert.equal(galleryNightLine(grouped.nights[0]), 'Sep 7 · The Rock')

assert.equal(
  isCompatibleBroadcastGallery(
    { id: 9, status: 'published', visibility: 'show_attendees', showRecapId: '77', media: [{}], photoCount: 2 },
    { audienceType: 'show_attendees', recapId: '77' }
  ),
  true
)
assert.equal(
  isCompatibleBroadcastGallery(
    { id: 9, status: 'published', visibility: 'show_attendees', showRecapId: '88', media: [{}], photoCount: 2 },
    { audienceType: 'show_attendees', recapId: '77' }
  ),
  false
)

const lab = read('config/messagingLab.js')
assert.match(lab, /compose-all-fans/)
assert.match(lab, /messagingLabComposer/)

const composerUi = read('components/dashboard/fans/FanCampaignComposer.vue')
const composerState = read('composables/useCampaignComposer.js')
assert.match(composerState, /submitting\.value = true/)
assert.match(composerUi, /:disabled="submitting"/)
assert.doesNotMatch(composerUi, /Send private message/)
assert.match(read('pages/messages/compose.vue'), /needsNight/)
assert.match(read('components/messages/FaneqoGalleryPicker.vue'), /Choose a Gallery/)
assert.match(read('components/messages/FaneqoGalleryPicker.vue'), /Recent Nights/)
assert.match(read('pages/__dev/messages.vue'), /FaneqoComposerLab/)

console.log('test-composer-presentation: ok')
