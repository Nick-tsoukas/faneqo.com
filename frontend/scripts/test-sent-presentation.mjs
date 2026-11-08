/**
 * Sent list/detail presentation — communication history, not campaign software.
 * Run: node scripts/test-sent-presentation.mjs
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  formatSentPeople,
  groupSentByDay,
  hydrateSentGallery,
  sentAudienceLine,
  sentEmptyCopy,
  sentErrorCopy,
  sentGalleryMeta,
  sentHeaderTitle,
  sentMessageExcerpt,
  sentMetaLine,
  sentNextActions,
  sentNightTo,
  sentRowTitle,
  sentStatusLabel,
  skippedTotal,
  sentDeliverySummary,
} from '../utils/messages/sentPresentation.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    compileScript(descriptor, { id: rel, filename: rel })
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

const show = {
  showTitle: 'The Moon Show',
  venue: 'The Rock',
  city: 'Chicago',
  showStartedAt: '2026-09-07',
  recapId: 77,
}

assert.equal(
  sentMessageExcerpt({ bodyText: 'Thanks for coming out last night.\nSee you soon.' }),
  'Thanks for coming out last night.'
)
assert.equal(
  sentRowTitle({ subject: 'Inbox message', channel: 'in_app', bodyText: 'Thanks for coming out last night.' }),
  'Thanks for coming out last night.'
)
assert.equal(
  sentRowTitle({ subject: 'Inbox message', channel: 'in_app', audienceType: 'all_fans' }),
  'Sent to all fans'
)
assert.equal(
  sentRowTitle({
    subject: 'Inbox message',
    audienceType: 'show_attendees',
    show,
    gallery: { title: 'Backstage', photoCount: 8 },
  }),
  'Backstage'
)
assert.equal(
  sentRowTitle({
    subject: '',
    audienceType: 'show_attendees',
    gallery: { photoCount: 8 },
    show,
  }),
  '8 photos'
)
assert.equal(
  sentAudienceLine({ audienceType: 'all_fans' }),
  'All fans'
)
assert.equal(
  sentAudienceLine({ audienceType: 'show_attendees', show }),
  'The Rock · Sep 7'
)
assert.equal(
  sentMetaLine({
    audienceType: 'all_fans',
    recipientCount: 147,
    channel: 'in_app',
    gallery: { photoCount: 8 },
  }),
  '147 people · Faneqo Inbox · 8 photos'
)
assert.equal(sentGalleryMeta({ gallery: { photoCount: 1 } }), '1 photo')
assert.equal(formatSentPeople(1), '1 person')
assert.equal(sentStatusLabel('completed'), 'Sent')
assert.equal(sentStatusLabel('partially_failed'), 'Partial')
assert.equal(sentStatusLabel('failed'), 'Failed')
assert.equal(sentStatusLabel('sending'), 'Sending')
assert.equal(sentStatusLabel('queued'), 'Processing')

const delivery = sentDeliverySummary({
  channel: 'in_app',
  sentCount: 147,
  skippedCount: 2,
  failedCount: 0,
})
assert.equal(delivery.sentLabel, '147 conversations')
assert.equal(delivery.rest, '2 skipped · 0 failed')
assert.match(delivery.hint, /does not mark it read or seen/)

const emailDelivery = sentDeliverySummary({
  channel: 'email',
  sentCount: 144,
  skippedCount: 1,
  failedCount: 2,
})
assert.equal(emailDelivery.sentLabel, '144 sent')
assert.equal(emailDelivery.rest, '1 skipped · 2 failed')
assert.equal(skippedTotal({ skippedCount: 1, suppressedCount: 2 }), 3)

const grouped = groupSentByDay([
  { id: 1, createdAt: '2026-09-07T18:00:00.000Z' },
  { id: 2, createdAt: '2026-09-07T12:00:00.000Z' },
], new Date('2026-09-07T20:00:00.000Z'))
assert.equal(grouped.length, 1)
assert.equal(grouped[0].label, '')

const split = groupSentByDay([
  { id: 1, createdAt: '2026-09-07T18:00:00.000Z' },
  { id: 2, createdAt: '2026-09-04T12:00:00.000Z' },
], new Date('2026-09-07T20:00:00.000Z'))
assert.ok(split.length >= 2)
assert.ok(split.every((group) => group.label))

assert.equal(sentHeaderTitle({ bodyText: 'Thanks for coming out last night.', audienceType: 'all_fans' }), 'Sent to all fans')
assert.equal(sentEmptyCopy().heading, 'Nothing sent yet.')
assert.match(sentEmptyCopy().body, /all fans or a Night/)
assert.equal(sentErrorCopy().heading, 'Couldn’t load sent messages.')

const live = hydrateSentGallery(
  {
    show,
    gallery: { id: 9, title: 'Backstage', photoCount: 8 },
  },
  {
    id: 9,
    title: 'Backstage',
    media: [{ id: 1 }, { id: 2 }],
    photoCount: 8,
    band: { slug: 'the-rockers' },
    slug: 'moon-show',
    showRecap: { id: 77, nightSlug: 'the-moon-show' },
  }
)
assert.equal(live.media.length, 2)
assert.equal(live.show.venue, 'The Rock')

const actions = sentNextActions(
  { channel: 'in_app', audienceType: 'show_attendees', recapId: 77, sentCount: 83 },
  { gallery: live, bandId: 11 }
)
assert.equal(actions.primary.label, 'Continue conversations')
assert.equal(actions.primary.to, '/messages?tab=inbox')
assert.equal(actions.secondary.label, 'View Night')
assert.equal(sentNightTo({ audienceType: 'show_attendees' }, live), '/the-rockers/night/the-moon-show')

const failedActions = sentNextActions(
  { channel: 'in_app', audienceType: 'all_fans', status: 'failed', sentCount: 0 },
  { bandId: 11 }
)
assert.equal(failedActions.primary.label, 'Message this audience again')
assert.equal(failedActions.secondary, null)

const panel = read('components/messages/MessagesCampaignsPanel.vue')
assert.match(panel, /sentRowTitle/)
assert.match(panel, /sentEmptyCopy/)
assert.match(panel, /compose-all/)
assert.match(panel, /compose-show/)
assert.doesNotMatch(panel, /Inbox message/)
assert.doesNotMatch(panel, /Gallery attached/)
assert.match(panel, /<NuxtLink :to="`\/messages\/\$\{campaign\.id\}`" class="fq-camps__card/)
assert.match(panel, /\.fq-camps__card:focus-visible/)
assert.match(panel, /min-height: 44px/)
assert.match(panel, /max-width: 46rem/)

const detail = read('components/messages/FaneqoSentDetail.vue')
assert.match(detail, /What fans received/)
assert.match(detail, /FaneqoGalleryMessageCard/)
assert.match(detail, /FaneqoMediaLightbox/)
assert.match(detail, /preview/)
assert.match(detail, /Continue conversations|actions\.primary/)
assert.doesNotMatch(detail, /Gallery attached/)
assert.doesNotMatch(detail, /metric-value/)
assert.doesNotMatch(detail, /Delivered/)
assert.doesNotMatch(detail, /#39ff14/i)
assert.doesNotMatch(detail, /fq-gradient-primary/)

const page = read('pages/messages/[campaignId].vue')
assert.match(page, /FaneqoSentDetail/)
assert.match(page, /getById/)
assert.match(page, /hydrateSentGallery/)
assert.match(page, /sentMessagesPath\(\)/)
assert.doesNotMatch(page, /Back to Messages</)
assert.match(detail, /Back to Sent messages/)

const lab = read('config/messagingLab.js')
assert.match(lab, /sent-list/)
assert.match(lab, /sent-empty/)
assert.match(lab, /sent-detail-show-gallery/)
assert.match(lab, /messagingLabSent/)

compileSfc('components/messages/MessagesCampaignsPanel.vue')
compileSfc('components/messages/FaneqoSentDetail.vue')
compileSfc('components/messages/FaneqoSentLab.vue')

console.log('test-sent-presentation: ok')
