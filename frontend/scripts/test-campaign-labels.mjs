/**
 * Artist-facing email labels. Backend statuses stay unchanged.
 * Run: node scripts/test-campaign-labels.mjs
 */
import assert from 'node:assert/strict'
import {
  formatCampaignAudienceLine,
  formatCampaignReachLine,
  formatCampaignRowTitle,
  formatCampaignShowLine,
  formatCampaignStatusLabel,
} from '../utils/campaigns/campaignLabels.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('backend statuses map to email language', () => {
  assert.equal(formatCampaignStatusLabel('completed'), 'Sent')
  assert.equal(formatCampaignStatusLabel('partially_failed'), 'Partial')
  assert.equal(formatCampaignStatusLabel('failed'), 'Failed')
  assert.equal(formatCampaignStatusLabel('queued'), 'Processing')
  assert.equal(formatCampaignStatusLabel('sending'), 'Sending')
  assert.equal(formatCampaignStatusLabel('canceled'), 'Canceled')
  assert.equal(formatCampaignStatusLabel('draft'), 'Draft')
})

test('audience uses plain language and recipient counts', () => {
  assert.equal(
    formatCampaignAudienceLine({ audienceType: 'all_fans', recipientCount: 3 }),
    'All fans · 3 recipients'
  )
  assert.equal(
    formatCampaignAudienceLine({ audienceType: 'all_fans', recipientCount: 1 }),
    'All fans · 1 recipient'
  )
  assert.equal(
    formatCampaignAudienceLine({ audienceLabel: 'All Fans', recipientCount: 12 }),
    'All fans · 12 recipients'
  )
})

test('history rows count people, not recipients', () => {
  assert.equal(
    formatCampaignReachLine({ audienceType: 'all_fans', recipientCount: 18, channel: 'in_app' }),
    '18 people · Faneqo Inbox'
  )
  assert.equal(
    formatCampaignReachLine({ audienceType: 'show_attendees', recipientCount: 1, channel: 'in_app' }),
    '1 person · Faneqo Inbox'
  )
  assert.equal(
    formatCampaignReachLine({ audienceType: 'all_fans', recipientCount: 4, channel: 'email' }),
    '4 people · Email'
  )
})

test('show context uses recap fields, not audience jargon', () => {
  assert.equal(
    formatCampaignShowLine({
      audienceType: 'show_attendees',
      show: { showTitle: 'the party', venue: 'The Vix', showStartedAt: '2026-09-03' },
    }),
    'The Vix · Sep 3'
  )
  assert.equal(
    formatCampaignShowLine({ audienceType: 'show_attendees', show: {}, audienceDetail: 'The Vix' }),
    'The Vix'
  )
  assert.equal(formatCampaignShowLine({ audienceType: 'all_fans' }), '')
})

test('row title leads with the message, falling back only when empty', () => {
  assert.equal(
    formatCampaignRowTitle({ subject: 'Thanks for coming out tonight!', channel: 'in_app' }),
    'Thanks for coming out tonight!'
  )
  assert.equal(
    formatCampaignRowTitle({ subject: 'Inbox message', channel: 'in_app', bodyText: 'Thanks for coming out last night.' }),
    'Thanks for coming out last night.'
  )
  assert.equal(
    formatCampaignRowTitle({ subject: 'Inbox message', channel: 'in_app', audienceType: 'all_fans' }),
    'Sent to all fans'
  )
  assert.equal(
    formatCampaignRowTitle({ subject: '', channel: 'email', audienceType: 'all_fans' }),
    'Sent to all fans'
  )
})

console.log(`\n=== campaign labels: ${passed} passed ===`)
