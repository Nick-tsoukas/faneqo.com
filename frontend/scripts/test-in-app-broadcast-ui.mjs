import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { formatShowIdentity } from '../utils/campaigns/formatShowIdentity.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

const composerState = read('composables/useCampaignComposer.js')
assert.match(composerState, /defaultChannel[\s\S]*'in_app'/)
assert.match(composerState, /previewAudience\([\s\S]*channel: requestedChannel/)
assert.match(composerState, /createCampaign\([\s\S]*channel: channel\.value/)
assert.match(composerState, /isInbox\.value \|\| stripTestSubjectPrefix/)
assert.doesNotMatch(composerState, /Everyone eligible was messaged recently/)

const composerUi = read('components/dashboard/fans/FanCampaignComposer.vue')
const inboxPreview = read('components/dashboard/fans/FanCampaignInboxPreview.vue')
assert.match(composerUi, /intentTitle/)
assert.match(composerUi, /Message all fans/)
assert.match(composerUi, /Message a show/)
assert.match(composerUi, /Each fan receives this privately\./)
assert.match(composerUi, /Attach Gallery/)
assert.match(composerUi, /icons\.plus/)
assert.match(composerUi, />\s*Review message\s*</)
assert.match(composerUi, /Faneqo Inbox/)
assert.match(composerUi, />\s*Email\s*</)
assert.match(composerUi, /@click="channel = 'in_app'"/)
assert.match(composerUi, /@click="channel = 'email'"/)
assert.match(composerUi, /FanCampaignInboxPreview/)
assert.match(composerUi, /FaneqoComposerAudience/)
assert.match(composerUi, /channelReach\.in_app\.eligible/)
assert.match(composerUi, /channelReach\.email\.eligible/)
assert.match(composerUi, /:disabled="submitting \|\| !!selectedGallery"/)
assert.match(composerUi, /fcc-delivery__check/)
assert.match(composerUi, /box-shadow: inset 0 0 0 1px rgba\(245, 245, 246/)
assert.match(composerUi, /background: #f5f5f6/)
assert.match(composerUi, /showIdentity/)
assert.match(composerUi, /formatShowIdentity/)
assert.match(composerUi, /This is close to what each fan will receive/)
assert.match(composerUi, /sendActionText/)
assert.match(composerUi, /composerSendLabel/)
assert.match(composerUi, /Preview as fan/)
assert.match(composerUi, /reviewPreviewOpen/)
assert.match(composerUi, /View sent message/)
assert.doesNotMatch(composerUi, /Send private message/)
assert.doesNotMatch(composerUi, /<dt>Band<\/dt>/)
assert.doesNotMatch(composerUi, /Show attendees/)
assert.doesNotMatch(composerUi, /Send private messages/)
assert.doesNotMatch(composerUi, /1 PRIVATE MESSAGE/)
assert.doesNotMatch(composerUi, /PRIVATE INBOX/)
assert.doesNotMatch(composerUi, /New fan message/)
assert.doesNotMatch(composerUi, /One private conversation per fan/)
assert.doesNotMatch(composerUi, /never creates a group chat/)
assert.doesNotMatch(composerUi, /Confirm this .* before it goes out/)
assert.doesNotMatch(composerUi, /Private messages queued/)
assert.doesNotMatch(composerUi, /Email queued/)
assert.match(composerUi, /successCopy/)
assert.match(composerUi, /View sent message/)
assert.match(composerUi, /sentMessagesPath\(true\)/)
assert.match(composerUi, /runWithContext/)
assert.match(composerUi, /navigateTo\(sentMessagesPath\(true\), \{ replace: true \}\)/)
assert.match(composerUi, /sendAndReturnToSent/)
assert.match(composerUi, /scheduleSentRedirect/)
assert.match(composerUi, /POST_SEND_SENT_HOLD_MS = 1100/)
assert.match(composerUi, /POST_SEND_SENT_HOLD_REDUCED_MS = 800/)
assert.match(composerUi, /step\.value === 'success' \|\| allowLeave\.value/)
assert.doesNotMatch(composerUi, /if \(next === 'success'\) goToSentAfterSuccess/)
assert.doesNotMatch(composerUi, /router\.replace\(sentMessagesPath/)
assert.match(composerState, /allowLeave\.value = true/)
assert.match(composerState, /return \{ ok: true \}/)
assert.match(composerState, /return \{ ok: false \}/)
assert.match(composerState, /step\.value = 'success'/)
assert.match(composerState, /step\.value = 'review'/)
assert.doesNotMatch(composerState, /navigateTo/)
assert.match(composerState, /createCampaign\([\s\S]*channel: channel\.value/)
assert.ok(
  composerUi.indexOf('id="fcc-note"') < composerUi.indexOf('id="fcc-delivery-label"'),
  'message field must appear before delivery'
)
assert.ok(
  composerUi.indexOf('id="fcc-delivery-label"') < composerUi.indexOf('Attach Gallery'),
  'media must stay below delivery'
)
assert.match(composerState, /composerReachCopy/)
assert.match(inboxPreview, /What fans receive/)
assert.match(inboxPreview, /No fan can see another recipient/)
assert.match(inboxPreview, /FaneqoGalleryMessageCard/)

assert.equal(
  formatShowIdentity({ showTitle: 'the party', showStartedAt: '2026-09-03' }),
  'the party · Sep 3'
)
assert.equal(
  formatShowIdentity({ venue: 'The Chapel', showStartedAt: '2026-09-03' }),
  'The Chapel · Sep 3'
)
assert.equal(formatShowIdentity({}), '')

const composePage = read('pages/messages/compose.vue')
assert.match(composePage, /Message a show/)
assert.match(composePage, /Message all fans/)
assert.match(composePage, /:show-recap="recap"/)
assert.match(composePage, /needsNight/)
assert.match(composePage, /MessagesShowPicker/)
assert.doesNotMatch(composePage, /Choose a Show Recap before messaging/)
assert.doesNotMatch(composePage, /New fan message/)

const campaignDetail = read('pages/messages/[campaignId].vue')
assert.match(campaignDetail, /FaneqoSentDetail/)
assert.match(campaignDetail, /hydrateSentGallery/)
const sentDetail = read('components/messages/FaneqoSentDetail.vue')
assert.match(sentDetail, /What fans received/)
assert.doesNotMatch(sentDetail, /Delivered/)
const sentCopy = read('utils/messages/sentPresentation.js')
assert.match(sentCopy, /does not mark it read or seen/)

const showApi = read('composables/useShowRecaps.js')
assert.match(showApi, /query: \{ channel \}/)
assert.match(showApi, /channel: message\?\.channel \|\| 'email'/)
assert.match(showApi, /useCookie\('strapi_jwt'\)/)
assert.match(showApi, /async function recapHeaders/)
assert.doesNotMatch(showApi, /Authorization: `Bearer \$\{token\.value\}`/)

const showUi = read('components/dashboard/fans/ShowMessageComposer.vue')
assert.match(showUi, /Reach the room again/)
assert.match(showUi, /Separate private conversation per fan/)
assert.match(showUi, /audienceType: 'show_attendees'/)
assert.match(showUi, /path: '\/messages\/compose'/)
assert.match(showUi, /Faneqo Inbox can reach the same fan again/)
assert.doesNotMatch(showUi, /cooling down for Inbox/)

const history = read('components/messages/MessagesCampaignsPanel.vue')
assert.match(history, /metaLine\(campaign\)/)
assert.match(history, /Sent|Nothing sent yet/)

// Channel language for history rows now lives with the other campaign labels.
const labels = read('utils/campaigns/campaignLabels.js')
assert.match(labels, /in_app: 'Faneqo Inbox'/)
assert.match(sentCopy, /channel === 'in_app'/)

console.log('In-app broadcast UI contract checks passed.')
