/**
 * Slice 1 Messages home information architecture.
 * Artist-facing Inbox | Sent, with direct All Fans / show compose routes.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  allFansComposeTo,
  isSentTab,
  sentMessagesPath,
  showComposeTo,
} from '../utils/campaigns/messagesHomeRoutes.js'
import { composerBackTarget } from '../utils/campaigns/resolveComposerBand.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

assert.equal(isSentTab('sent'), true)
assert.equal(isSentTab('campaigns'), true)
assert.equal(isSentTab(undefined, 'campaigns'), true)
assert.equal(isSentTab(undefined, 'inbox'), false)
assert.deepEqual(sentMessagesPath(), { path: '/messages', query: { tab: 'sent' } })
assert.deepEqual(sentMessagesPath(true), { path: '/messages', query: { tab: 'sent', refresh: '1' } })
assert.deepEqual(allFansComposeTo(5), {
  path: '/messages/compose',
  query: { from: 'messages', audienceType: 'all_fans', bandId: '5' },
})
assert.deepEqual(showComposeTo(44, 5), {
  path: '/messages/compose',
  query: {
    from: 'messages',
    audienceType: 'show_attendees',
    recapId: '44',
    channel: 'in_app',
    bandId: '5',
  },
})
assert.equal(composerBackTarget('messages').path, '/messages?tab=sent&refresh=1')

const home = read('components/messages/MessagesHome.vue')
assert.match(home, />\s*Inbox\s*</)
assert.match(home, />\s*Sent\s*</)
assert.doesNotMatch(home, />\s*Conversations\s*</)
assert.doesNotMatch(home, />\s*Campaigns\s*</)
assert.match(home, /goComposeAllFans/)
assert.match(home, /openShowPicker/)
assert.match(home, /MessagesAudienceActions/)
assert.match(home, /MessagesShowPicker/)
assert.match(home, /allFansComposeTo/)
assert.match(home, /showComposeTo/)
assert.match(home, /isSentTab/)
assert.match(home, /query: \{ tab: 'sent' \}/)
assert.match(home, /return_from_compose/)

const actions = read('components/messages/MessagesAudienceActions.vue')
assert.match(actions, /Message all fans/)
assert.match(actions, /Message a show/)
assert.match(actions, /min\(100%, 28rem\)/)

const picker = read('components/messages/MessagesShowPicker.vue')
assert.match(picker, /getRecaps/)
assert.match(picker, /Message a show/)
assert.doesNotMatch(picker, /MessageCampaign/)
assert.match(picker, /\.fq-show__title[\s\S]*color:\s*#fff/)
assert.match(picker, /\.fq-show__lead[\s\S]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.62\)/)
assert.match(picker, /\.fq-show__sheet[\s\S]*color:\s*#fff/)

const compose = read('pages/messages/compose.vue')
assert.match(compose, /audienceType === 'show_attendees'/)
assert.match(compose, /getRecapDetail/)

const history = read('components/messages/MessagesCampaignsPanel.vue')
assert.match(history, /Nothing sent yet|Sent/)
assert.match(history, /compose-all/)
assert.match(history, /compose-show/)
assert.doesNotMatch(history, /New broadcast/)
// Completed sends stay neutral: green belongs to the mark, not the row.
assert.match(history, /\.fq-camps__status\.is-ok \{[\s\S]*?--fq-text-secondary/)
assert.match(history, /\.fq-camps__status\.is-ok :deep\(svg\) \{[\s\S]*?--fq-state-success/)
// In-flight keeps a hue of its own so reduced motion still reads as live.
assert.match(history, /\.fq-camps__status\.is-live \{[\s\S]*?--fq-state-progress/)
// History is compact clickable rows, not a column table.
assert.doesNotMatch(history, /fq-camps__cols/)
assert.match(history, /sentRowTitle/)
assert.match(history, /sentAudienceLine/)
assert.match(history, /sentMetaLine/)
assert.doesNotMatch(history, /Audience messages you’ve sent to fans/)
assert.doesNotMatch(history, /Inbox message/)

// Sent history stays reachable: the whole row is a link to the detail route.
assert.match(history, /<NuxtLink :to="`\/messages\/\$\{campaign\.id\}`" class="fq-camps__card/)
assert.match(history, /\.fq-camps__card:focus-visible/)
assert.match(history, /\.fq-camps__card \{[\s\S]*?min-height: 44px/)

// The detail screen returns to the Sent list by destination, not by history.
const detail = read('pages/messages/[campaignId].vue')
assert.match(detail, /sentMessagesPath\(\)/)
assert.match(detail, /FaneqoSentDetail/)
assert.doesNotMatch(detail, /Back to Messages</)

const sentDetail = read('components/messages/FaneqoSentDetail.vue')
assert.match(sentDetail, />\s*Sent messages\s*</)
assert.match(sentDetail, /Back to Sent messages/)
assert.match(sentDetail, /What fans received/)

// Post-send still lands on Sent and never forces the artist into detail.
const composerUi = read('components/dashboard/fans/FanCampaignComposer.vue')
assert.match(composerUi, /navigateTo\(sentMessagesPath\(true\), \{ replace: true \}\)/)
assert.doesNotMatch(composerUi, /navigateTo\(`\/messages\/\$\{/)

// New conversation belongs to Inbox, beside the audience actions.
assert.match(home, /<MessagesTabCta[\s\S]*?v-if="tab === 'inbox'"/)
assert.match(home, /msg-home__reach/)
assert.match(home, /--fq-messages-max: 96rem/)

// Active state reads in ink and weight, and the tab reserves its active width.
assert.match(home, /\.msg-home__tab \{[\s\S]*?font-weight: 500/)
assert.match(home, /\.msg-home__tab\.is-active \{[\s\S]*?font-weight: 700/)
assert.match(home, /\.msg-home__tab-text::after \{[\s\S]*?content: attr\(data-label\)/)

const cta = read('components/messages/MessagesTabCta.vue')
assert.match(cta, /New conversation/)
assert.doesNotMatch(cta, /New broadcast/)
assert.doesNotMatch(cta, /New message/)

const empty = read('components/messages/MessagesInboxEmpty.vue')
assert.match(empty, /No conversations yet/)
assert.match(empty, /Start a private conversation/)
assert.doesNotMatch(empty, /Reach your fans/)
assert.doesNotMatch(empty, /Message all fans/)
assert.doesNotMatch(empty, /Each fan receives this privately/)
assert.doesNotMatch(empty, /msg-empty__search/)

const reach = read('components/messages/MessagesReachPanel.vue')
assert.doesNotMatch(reach, /Each fan receives this privately/)
assert.doesNotMatch(reach, /Message all fans/)
assert.doesNotMatch(reach, /Message a show/)
assert.match(reach, /Your conversations/)
assert.match(reach, /Start a conversation/)

console.log('Messages home IA contract checks passed.')
