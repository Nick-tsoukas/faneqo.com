/**
 * Local-only Messaging Home / Inbox fixtures.
 * Never imported by production /messages routes.
 */
import { galleryLabConcertPrints } from './galleryArchiveLab.js'
import { FANEQO_FAN_FALLBACK } from '../utils/messages/fanIdentity.js'

const ARTIST_AVATAR = 'https://qrcode101.s3.us-east-1.amazonaws.com/medium_gary_bendig_6_G_Mq7_A_Gx_Nb_E_unsplash_33c44247ac.jpg'
const FAN_AVATAR = 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=240&q=70'

export const MESSAGING_LAB_ARTIST = {
  id: 'artist-rockers',
  displayName: 'You',
}

export const MESSAGING_LAB_FAN_USER = {
  id: 'fan-mike',
  displayName: 'You',
}

const now = Date.now()
const minutes = (n) => new Date(now - n * 60 * 1000).toISOString()
const hours = (n) => new Date(now - n * 60 * 60 * 1000).toISOString()

function nightShow() {
  return {
    title: 'The Moon Show',
    venue: 'The Rock',
    city: 'Chicago',
    date: '2026-09-07',
  }
}

function galleryRef(count, extras = {}) {
  const media = galleryLabConcertPrints(count)
  return {
    id: extras.id || `lab-gallery-${count}`,
    title: extras.title || 'Show photos',
    photoCount: count,
    visibility: extras.visibility || 'show_attendees',
    media,
    show: extras.show === null ? null : (extras.show || nightShow()),
    band: { name: 'The Rockers', slug: 'the-rockers' },
    slug: extras.slug || 'moon-show',
  }
}

function msg(id, { role = 'artist', body = '', at, gallery = null, attachments = [], status = 'seen' } = {}) {
  const mineArtist = role === 'artist'
  return {
    id: String(id),
    conversationId: 'conv-mike',
    senderRole: role,
    senderId: role === 'artist' ? 'band' : 'fan',
    senderName: role === 'artist' ? 'The Rockers' : 'Mike',
    body,
    createdAt: at || minutes(2),
    status,
    isMine: mineArtist,
    avatarUrl: role === 'artist' ? ARTIST_AVATAR : FAN_AVATAR,
    attachments,
    attachment: attachments[0] || null,
    galleryReference: gallery,
  }
}

const namedFan = {
  fanId: 41,
  displayName: 'Mike',
  initials: 'M',
  avatarUrl: FAN_AVATAR,
  context: '3 shows',
  showCount: 3,
}

const unnamedFan = {
  fanId: 42,
  displayName: FANEQO_FAN_FALLBACK,
  initials: 'F',
  avatarUrl: null,
  context: '3 shows',
  showCount: 3,
}

export function messagingLabConversations(kind = 'many') {
  if (kind === 'empty') return []
  if (kind === 'one') {
    return [{
      id: 'conv-mike',
      kind: 'conversation',
      fan: namedFan,
      unreadCount: 0,
      lastMessagePreview: 'See you at the next one.',
      lastMessageAt: minutes(12),
      updatedAt: now - 12 * 60 * 1000,
    }]
  }
  const rows = [
    {
      id: 'conv-mike',
      kind: 'conversation',
      fan: namedFan,
      unreadCount: kind === 'unread' ? 2 : 0,
      lastMessagePreview: 'Shared photos from The Rock',
      lastMessageAt: minutes(8),
      updatedAt: now - 8 * 60 * 1000,
    },
    {
      id: 'conv-unnamed',
      kind: 'conversation',
      fan: unnamedFan,
      unreadCount: kind === 'unread' ? 1 : 0,
      lastMessagePreview: 'Shared photos from The Rock',
      lastMessageAt: hours(2),
      updatedAt: now - 2 * 60 * 60 * 1000,
    },
    {
      id: 'conv-sarah',
      kind: 'conversation',
      fan: {
        fanId: 43,
        displayName: 'Sarah M.',
        initials: 'SM',
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=70',
        context: '1 show',
        showCount: 1,
      },
      unreadCount: 0,
      lastMessagePreview: 'That room was loud.',
      lastMessageAt: hours(26),
      updatedAt: now - 26 * 60 * 60 * 1000,
    },
  ]
  if (kind === 'request') {
    rows.unshift({
      id: 'request:9',
      kind: 'request',
      requestId: 9,
      fan: {
        fanId: 90,
        displayName: 'Alex',
        initials: 'A',
        avatarUrl: null,
        context: '',
        showCount: 0,
      },
      unreadCount: 0,
      lastMessagePreview: 'Are you coming back this fall?',
      lastMessageAt: minutes(40),
      updatedAt: now - 40 * 60 * 1000,
      initialMessage: 'Are you coming back this fall?',
      requestStatus: 'pending',
    })
  }
  return rows
}

export function messagingLabFanConversations() {
  return [{
    id: 'conv-mike',
    kind: 'conversation',
    fan: {
      displayName: 'The Rockers',
      initials: 'TR',
      avatarUrl: ARTIST_AVATAR,
      context: '3 Nights together',
    },
    artist: {
      id: 7,
      name: 'The Rockers',
      slug: 'the-rockers',
      avatarUrl: ARTIST_AVATAR,
    },
    unreadCount: 0,
    lastMessagePreview: 'Shared photos from The Rock',
    lastMessageAt: minutes(8),
    updatedAt: now - 8 * 60 * 1000,
    showCount: 3,
  }]
}

function groupedArtistNotes(at) {
  return [
    msg(21, { role: 'artist', body: 'Thanks for coming out last night.', at: minutes(at) }),
    msg(22, { role: 'artist', body: 'That last song felt different with the room singing it.', at: minutes(at - 1) }),
    msg(23, { role: 'artist', body: 'See you at the next one.', at: minutes(at - 2), status: 'seen' }),
  ]
}

export function messagingLabMessages(kind = 'night-gallery') {
  if (kind === 'one') {
    return [msg(1, { role: 'artist', body: 'Thanks for coming out last night.', at: minutes(20), status: 'seen' })]
  }
  if (kind === 'grouped') {
    return [
      msg(10, { role: 'fan', body: 'Still thinking about that encore.', at: minutes(40) }),
      ...groupedArtistNotes(38),
    ]
  }
  if (kind === 'image') {
    return [
      msg(11, { role: 'fan', body: 'From the rail.', at: minutes(30) }),
      msg(12, {
        role: 'artist',
        body: '',
        at: minutes(28),
        attachments: galleryLabConcertPrints(1),
      }),
    ]
  }
  if (kind === 'gallery-1') {
    return [msg(31, { role: 'artist', body: 'One from the night.', at: minutes(12), gallery: galleryRef(1) })]
  }
  if (kind === 'gallery-2') {
    return [msg(32, { role: 'artist', body: '', at: minutes(12), gallery: galleryRef(2) })]
  }
  if (kind === 'gallery-8' || kind === 'night-gallery') {
    return [
      msg(40, { role: 'fan', body: 'That room was loud.', at: minutes(50) }),
      msg(41, {
        role: 'artist',
        body: 'A few from the night.',
        at: minutes(12),
        gallery: galleryRef(8),
      }),
      ...groupedArtistNotes(10),
    ]
  }
  if (kind === 'fan-real') {
    return [
      msg(501, { role: 'fan', body: 'hi', at: hours(30) }),
      msg(502, {
        role: 'artist',
        body: 'hello fan',
        at: hours(29),
        gallery: galleryRef(3, { title: 'View photos', id: 'lab-real-1' }),
      }),
      msg(503, {
        role: 'artist',
        body: 'look!',
        at: hours(20),
        gallery: galleryRef(3, { title: 'View photos', id: 'lab-real-2' }),
      }),
      msg(504, { role: 'fan', body: 'thanks', at: hours(19) }),
      msg(505, { role: 'artist', body: 'thanks for coming out 🤘', at: hours(8) }),
      msg(506, { role: 'artist', body: 'hello', at: hours(8) }),
      msg(507, { role: 'artist', body: 'new test', at: minutes(90) }),
      msg(508, { role: 'fan', body: 'works', at: minutes(80) }),
      msg(509, {
        role: 'artist',
        body: 'hello fan',
        at: minutes(40),
        gallery: galleryRef(2, { id: 'lab-real-3' }),
      }),
      msg(510, {
        role: 'artist',
        body: '',
        at: minutes(12),
        gallery: galleryRef(8, { id: 'lab-real-4' }),
      }),
    ]
  }
  if (kind === 'long') {
    const rows = []
    for (let i = 0; i < 108; i += 1) {
      const artistTurn = i % 3 !== 0
      rows.push(msg(100 + i, {
        role: artistTurn ? 'artist' : 'fan',
        body: artistTurn
          ? `Keep this one close. Note ${i + 1}.`
          : `Still here. ${i + 1}.`,
        at: minutes(400 - i),
        status: artistTurn ? 'seen' : 'sent',
      }))
    }
    rows.push(msg(400, {
      role: 'artist',
      body: 'Photos from The Rock.',
      at: minutes(4),
      gallery: galleryRef(8, { id: 'lab-long-gallery' }),
    }))
    return rows
  }
  return messagingLabMessages('night-gallery')
}

export const MESSAGING_LAB_CASES = {
  'artist-inbox': {
    title: 'Artist inbox',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'night-gallery',
  },
  'artist-empty-thread': {
    title: 'No thread selected',
    role: 'artist',
    conversations: 'many',
    selected: null,
    messages: 'night-gallery',
  },
  'artist-empty-inbox': {
    title: 'Empty inbox',
    role: 'artist',
    conversations: 'empty',
    selected: null,
    messages: 'one',
  },
  'artist-one': {
    title: 'One conversation',
    role: 'artist',
    conversations: 'one',
    selected: 'conv-mike',
    messages: 'one',
  },
  'artist-unread': {
    title: 'Unread',
    role: 'artist',
    conversations: 'unread',
    selected: 'conv-unnamed',
    messages: 'grouped',
  },
  'artist-request': {
    title: 'Request',
    role: 'artist',
    conversations: 'request',
    selected: 'request:9',
    messages: 'one',
  },
  'artist-grouped': {
    title: 'Grouped messages',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'grouped',
  },
  'artist-gallery-1': {
    title: 'Gallery 1 photo',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'gallery-1',
  },
  'artist-gallery-2': {
    title: 'Gallery 2 photos',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'gallery-2',
  },
  'artist-gallery-8': {
    title: 'Night gallery',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'gallery-8',
  },
  'artist-long': {
    title: 'Long conversation',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'long',
  },
  'artist-loading': {
    title: 'Loading',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'night-gallery',
    loading: true,
  },
  'artist-error': {
    title: 'Error',
    role: 'artist',
    conversations: 'many',
    selected: 'conv-mike',
    messages: 'night-gallery',
    error: true,
  },
  'fan-thread': {
    title: 'Fan thread',
    role: 'fan',
    conversations: 'fan',
    selected: 'conv-mike',
    messages: 'night-gallery',
  },
  'fan-real-thread': {
    title: 'Fan real thread',
    role: 'fan',
    conversations: 'fan',
    selected: 'conv-mike',
    messages: 'fan-real',
  },
  'fan-empty': {
    title: 'Fan empty',
    role: 'fan',
    conversations: 'empty',
    selected: null,
    messages: 'one',
  },
  'compose-all-fans': {
    title: 'All fans',
    surface: 'composer',
    composer: 'all-fans',
  },
  'compose-all-empty': {
    title: 'All fans empty',
    surface: 'composer',
    composer: 'all-empty',
  },
  'compose-show': {
    title: 'Show selected',
    surface: 'composer',
    composer: 'show',
  },
  'compose-show-picker': {
    title: 'Show picker',
    surface: 'composer',
    composer: 'show-picker',
  },
  'compose-show-empty': {
    title: 'Show no eligible',
    surface: 'composer',
    composer: 'show-empty',
  },
  'compose-private': {
    title: 'Private',
    surface: 'composer',
    composer: 'private',
  },
  'compose-gallery': {
    title: 'Night Gallery',
    surface: 'composer',
    composer: 'gallery',
  },
  'compose-review': {
    title: 'Send review',
    surface: 'composer',
    composer: 'review',
  },
  'compose-sending': {
    title: 'Sending',
    surface: 'composer',
    composer: 'sending',
  },
  'compose-success': {
    title: 'Success',
    surface: 'composer',
    composer: 'success',
  },
  'compose-failure': {
    title: 'Failure',
    surface: 'composer',
    composer: 'failure',
  },
  'sent-list': {
    title: 'Sent list',
    surface: 'sent',
    sent: 'list',
  },
  'sent-long': {
    title: 'Sent long',
    surface: 'sent',
    sent: 'long',
  },
  'sent-empty': {
    title: 'Sent empty',
    surface: 'sent',
    sent: 'empty',
  },
  'sent-all-fans': {
    title: 'Sent all fans',
    surface: 'sent',
    sent: 'detail-all',
  },
  'sent-show': {
    title: 'Sent show',
    surface: 'sent',
    sent: 'detail-show',
  },
  'sent-gallery-1': {
    title: 'Sent 1 photo',
    surface: 'sent',
    sent: 'detail-gallery-1',
  },
  'sent-gallery-8': {
    title: 'Sent 8 photos',
    surface: 'sent',
    sent: 'detail-gallery-8',
  },
  'sent-failed': {
    title: 'Sent failed',
    surface: 'sent',
    sent: 'detail-failed',
  },
  'sent-partial': {
    title: 'Sent partial',
    surface: 'sent',
    sent: 'detail-partial',
  },
  'sent-detail-text': {
    title: 'Sent text',
    surface: 'sent',
    sent: 'detail-text',
  },
  'sent-detail-gallery': {
    title: 'Sent gallery',
    surface: 'sent',
    sent: 'detail-gallery-8',
  },
  'sent-detail-show-gallery': {
    title: 'Sent Night gallery',
    surface: 'sent',
    sent: 'detail-show-gallery',
  },
}

export function messagingLabComposer(kind = 'all-fans') {
  const recap = {
    id: 77,
    showTitle: 'The Moon Show',
    venue: 'The Rock',
    city: 'Chicago',
    showStartedAt: '2026-09-07',
    checkedInShowCount: 83,
  }
  const gallery = galleryRef(8, { title: 'Backstage' })
  const base = {
    bandName: 'The Rockers',
    audienceType: 'all_fans',
    recap: null,
    eligible: 147,
    unavailable: 2,
    note: 'Thanks for showing up. We felt that room.',
    gallery: null,
    step: 'compose',
    channel: 'in_app',
    peerName: 'Mike',
    showCount: 3,
    avatarUrl: FAN_AVATAR,
    error: '',
  }
  const variants = {
    'all-fans': base,
    'all-empty': { ...base, eligible: 0, note: '' },
    show: { ...base, audienceType: 'show_attendees', recap, eligible: 83, unavailable: 0 },
    'show-picker': { ...base, audienceType: 'show_attendees', recap: null, step: 'picker', eligible: 0 },
    'show-empty': { ...base, audienceType: 'show_attendees', recap, eligible: 0, note: '' },
    private: { ...base, audienceType: 'private', eligible: 0, note: '' },
    gallery: { ...base, audienceType: 'show_attendees', recap, eligible: 83, gallery },
    review: { ...base, audienceType: 'show_attendees', recap, eligible: 83, gallery, step: 'review' },
    sending: { ...base, eligible: 147, step: 'sending' },
    success: { ...base, eligible: 147, step: 'success' },
    failure: { ...base, audienceType: 'show_attendees', recap, eligible: 83, gallery, step: 'review', error: 'Couldn’t send this message. Try again.' },
  }
  return variants[kind] || base
}

function sentShow() {
  return {
    showTitle: 'The Moon Show',
    venue: 'The Rock',
    city: 'Chicago',
    showStartedAt: '2026-09-07',
    recapId: 77,
    nightSlug: 'the-moon-show',
  }
}

function sentRow(id, extras = {}) {
  return {
    id,
    subject: extras.subject || 'Inbox message',
    bodyText: extras.bodyText ?? extras.body ?? '',
    audienceType: extras.audienceType || 'all_fans',
    channel: extras.channel || 'in_app',
    status: extras.status || 'completed',
    recipientCount: extras.recipientCount ?? 147,
    sentCount: extras.sentCount ?? extras.recipientCount ?? 147,
    failedCount: extras.failedCount ?? 0,
    skippedCount: extras.skippedCount ?? 0,
    suppressedCount: extras.suppressedCount ?? 0,
    show: extras.show || null,
    gallery: extras.gallery || null,
    createdAt: extras.createdAt || hours(2),
    completedAt: extras.completedAt || extras.createdAt || hours(2),
    recapId: extras.recapId || extras.show?.recapId || null,
  }
}

export function messagingLabSent(kind = 'list') {
  const show = sentShow()
  const g1 = galleryRef(1, { title: 'Backstage', id: 'lab-sent-1' })
  const g8 = galleryRef(8, { title: 'Backstage', id: 'lab-sent-8' })
  const allFans = sentRow(41, {
    bodyText: 'Thanks for coming out last night.',
    createdAt: hours(3),
  })
  const showMsg = sentRow(42, {
    audienceType: 'show_attendees',
    bodyText: 'What a room. We felt every chorus.',
    show,
    recipientCount: 83,
    sentCount: 83,
    createdAt: hours(20),
  })
  const galleryOne = sentRow(43, {
    audienceType: 'show_attendees',
    bodyText: '',
    show,
    gallery: { id: g1.id, title: g1.title, slug: g1.slug, photoCount: 1 },
    recipientCount: 83,
    sentCount: 83,
    createdAt: hours(28),
  })
  const galleryEight = sentRow(44, {
    audienceType: 'show_attendees',
    bodyText: 'A few frames from the night.',
    show,
    gallery: { id: g8.id, title: g8.title, slug: g8.slug, photoCount: 8 },
    recipientCount: 83,
    sentCount: 83,
    createdAt: hours(50),
  })
  const failed = sentRow(45, {
    bodyText: 'New song this Friday.',
    status: 'failed',
    sentCount: 0,
    failedCount: 147,
    createdAt: hours(70),
  })
  const partial = sentRow(46, {
    bodyText: 'Merch table is open until 11.',
    status: 'partially_failed',
    sentCount: 144,
    skippedCount: 1,
    failedCount: 2,
    createdAt: hours(90),
  })
  const textOnly = sentRow(47, {
    bodyText: 'Thanks for showing up. We felt that room.',
    createdAt: hours(4),
  })

  const list = [allFans, showMsg, galleryOne, galleryEight, failed, partial]
  const long = [
    allFans,
    textOnly,
    showMsg,
    sentRow(48, { bodyText: 'See you in October.', createdAt: hours(100), recipientCount: 12 }),
    galleryEight,
    sentRow(49, {
      audienceType: 'show_attendees',
      bodyText: 'Last night was the one.',
      show,
      createdAt: hours(140),
      recipientCount: 61,
      sentCount: 61,
    }),
    galleryOne,
    partial,
    failed,
  ]

  const details = {
    'detail-all': { campaign: allFans, gallery: null },
    'detail-show': { campaign: showMsg, gallery: null },
    'detail-text': { campaign: textOnly, gallery: null },
    'detail-gallery-1': { campaign: { ...galleryOne, bodyText: '' }, gallery: g1 },
    'detail-gallery-8': { campaign: galleryEight, gallery: g8 },
    'detail-show-gallery': {
      campaign: galleryEight,
      gallery: { ...g8, band: { name: 'The Rockers', slug: 'the-rockers' }, showRecap: { id: 77, nightSlug: 'the-moon-show' } },
    },
    'detail-failed': { campaign: failed, gallery: null },
    'detail-partial': { campaign: partial, gallery: null },
  }

  if (kind === 'empty') return { mode: 'list', campaigns: [] }
  if (kind === 'long') return { mode: 'list', campaigns: long }
  if (kind === 'list') return { mode: 'list', campaigns: list }
  return { mode: 'detail', ...(details[kind] || details['detail-all']) }
}

export function resolveMessagingLabCase(id) {
  return MESSAGING_LAB_CASES[id] || MESSAGING_LAB_CASES['artist-inbox']
}
