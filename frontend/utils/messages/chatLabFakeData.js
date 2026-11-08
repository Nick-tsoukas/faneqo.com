/**
 * Fake Inbox data for /messages/chat-lab only.
 * Fictional fans / demo band — no real PII.
 */

/** Demo artist identity (artist-side Inbox = BurningThunder) */
export const LAB_ARTIST_USER = {
  id: 'artist-burningthunder',
  displayName: 'BurningThunder',
  avatarUrl: null,
  bandName: 'BurningThunder',
}

function initialsAvatar(label, bg = '#2a2140', fg = '#e9d5ff') {
  const text = String(label || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('') || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="48" fill="${bg}"/>
    <text x="48" y="54" text-anchor="middle" font-family="system-ui,Segoe UI,sans-serif" font-size="34" font-weight="600" fill="${fg}">${text}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

LAB_ARTIST_USER.avatarUrl = initialsAvatar('BurningThunder', '#1a1028', '#f0abfc')

const now = Date.now()
const minutes = (n) => new Date(now - n * 60 * 1000).toISOString()
const hours = (n) => new Date(now - n * 60 * 60 * 1000).toISOString()
const days = (n) => new Date(now - n * 24 * 60 * 60 * 1000).toISOString()

const fanAvatar = (name, bg) => initialsAvatar(name, bg)

/** @type {import('./chatUiAdapter').FaneqoConversation[]} */
export const LAB_CONVERSATIONS = [
  {
    id: 'conv-sarah',
    fan: {
      fanId: 'fan-sarah',
      displayName: 'Sarah Miller',
      city: 'Nashville',
      tier: 'Superfan',
      showCount: 2,
      fanSince: 'Jul 2026',
      avatarUrl: fanAvatar('Sarah Miller', '#312e81'),
    },
    unreadCount: 2,
    updatedAt: now - 8 * 60 * 1000,
    lastMessagePreview: 'That Nashville show was incredible.',
    lastMessageAt: minutes(8),
    fanTyping: false,
    fanOnline: true,
  },
  {
    id: 'conv-nick',
    fan: {
      fanId: 'fan-nick',
      displayName: 'Nick Torres',
      city: 'Chicago',
      tier: 'Engaged',
      showCount: 1,
      avatarUrl: fanAvatar('Nick Torres', '#164e63'),
    },
    unreadCount: 0,
    updatedAt: now - 45 * 60 * 1000,
    lastMessagePreview: 'Are you coming back to Chicago?',
    lastMessageAt: minutes(45),
    fanTyping: false,
    fanOnline: false,
  },
  {
    id: 'conv-emily',
    fan: {
      fanId: 'fan-emily',
      displayName: 'Emily Davis',
      city: 'Knoxville',
      tier: 'Warm',
      showCount: 1,
      avatarUrl: fanAvatar('Emily Davis', '#4c1d95'),
    },
    unreadCount: 1,
    updatedAt: now - 90 * 60 * 1000,
    lastMessagePreview: 'Where can I get the hoodie?',
    lastMessageAt: hours(1.5),
    fanTyping: false,
    fanOnline: true,
  },
  {
    id: 'conv-james',
    fan: {
      fanId: 'fan-james',
      displayName: 'James Carter',
      city: 'Nashville',
      tier: 'Superfan',
      showCount: 3,
      avatarUrl: fanAvatar('James Carter', '#14532d'),
    },
    unreadCount: 0,
    updatedAt: now - 26 * 60 * 60 * 1000,
    lastMessagePreview: 'Thanks for the show!',
    lastMessageAt: days(1),
    fanTyping: false,
    fanOnline: false,
  },
  {
    id: 'conv-ashley',
    fan: {
      fanId: 'fan-ashley',
      displayName: 'Ashley Reed',
      city: 'Atlanta',
      tier: 'New',
      showCount: 1,
      avatarUrl: fanAvatar('Ashley Reed', '#831843'),
    },
    unreadCount: 0,
    updatedAt: now - 2 * 24 * 60 * 60 * 1000,
    lastMessagePreview: 'Will there be VIP for the next show?',
    lastMessageAt: days(2),
    fanTyping: false,
    fanOnline: false,
  },
  {
    id: 'conv-marcus',
    fan: {
      fanId: 'fan-marcus',
      displayName: 'Marcus Hale',
      city: 'Memphis',
      tier: 'Engaged',
      showCount: 2,
      avatarUrl: fanAvatar('Marcus Hale', '#1e3a5f'),
    },
    unreadCount: 0,
    updatedAt: now - 3 * 24 * 60 * 60 * 1000,
    lastMessagePreview: 'Got the setlist tattoo. No regrets.',
    lastMessageAt: days(3),
    fanTyping: false,
    fanOnline: false,
  },
]

/** @type {Record<string, import('./chatUiAdapter').FaneqoMessage[]>} */
export const LAB_MESSAGES_BY_CONVERSATION = {
  'conv-sarah': [
    {
      id: 'msg-s1',
      conversationId: 'conv-sarah',
      senderRole: 'fan',
      senderId: 'fan-sarah',
      senderName: 'Sarah Miller',
      body: 'Hey — just got home from the Nashville show.',
      createdAt: hours(6),
      status: 'seen',
      avatarUrl: LAB_CONVERSATIONS[0].fan.avatarUrl,
    },
    {
      id: 'msg-s2',
      conversationId: 'conv-sarah',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: 'Glad you came ❤️ What was your favorite song?',
      createdAt: hours(5),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
    },
    {
      id: 'msg-s3',
      conversationId: 'conv-sarah',
      senderRole: 'fan',
      senderId: 'fan-sarah',
      senderName: 'Sarah Miller',
      body: 'That Nashville show was incredible.',
      createdAt: minutes(12),
      status: 'delivered',
      avatarUrl: LAB_CONVERSATIONS[0].fan.avatarUrl,
    },
    {
      id: 'msg-s4',
      conversationId: 'conv-sarah',
      senderRole: 'fan',
      senderId: 'fan-sarah',
      senderName: 'Sarah Miller',
      body: 'Are you coming back to Chicago?',
      createdAt: minutes(8),
      status: 'delivered',
      avatarUrl: LAB_CONVERSATIONS[0].fan.avatarUrl,
    },
  ],
  'conv-nick': [
    {
      id: 'msg-n1',
      conversationId: 'conv-nick',
      senderRole: 'fan',
      senderId: 'fan-nick',
      senderName: 'Nick Torres',
      body: 'Are you coming back to Chicago?',
      createdAt: hours(2),
      status: 'seen',
      avatarUrl: LAB_CONVERSATIONS[1].fan.avatarUrl,
    },
    {
      id: 'msg-n2',
      conversationId: 'conv-nick',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: "We're working on Chicago. Stay close.",
      createdAt: minutes(40),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
    },
  ],
  'conv-emily': [
    {
      id: 'msg-e1',
      conversationId: 'conv-emily',
      senderRole: 'fan',
      senderId: 'fan-emily',
      senderName: 'Emily Davis',
      body: 'Where can I get the hoodie?',
      createdAt: hours(3),
      status: 'delivered',
      avatarUrl: LAB_CONVERSATIONS[2].fan.avatarUrl,
    },
    {
      id: 'msg-e2',
      conversationId: 'conv-emily',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: 'Merch is on the artist page.',
      createdAt: hours(2),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
    },
    {
      id: 'msg-e3',
      conversationId: 'conv-emily',
      senderRole: 'fan',
      senderId: 'fan-emily',
      senderName: 'Emily Davis',
      body: 'Where can I get the hoodie?',
      createdAt: hours(1.5),
      status: 'delivered',
      avatarUrl: LAB_CONVERSATIONS[2].fan.avatarUrl,
    },
  ],
  'conv-james': [
    {
      id: 'msg-j1',
      conversationId: 'conv-james',
      senderRole: 'fan',
      senderId: 'fan-james',
      senderName: 'James Carter',
      body: 'Thanks for the show!',
      createdAt: days(1),
      status: 'seen',
      avatarUrl: LAB_CONVERSATIONS[3].fan.avatarUrl,
    },
    {
      id: 'msg-j2',
      conversationId: 'conv-james',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: 'Thanks for coming ❤️ Means a lot.',
      createdAt: new Date(Date.parse(days(1)) + 10 * 60 * 1000).toISOString(),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
    },
  ],
  'conv-ashley': [
    {
      id: 'msg-a1',
      conversationId: 'conv-ashley',
      senderRole: 'fan',
      senderId: 'fan-ashley',
      senderName: 'Ashley Reed',
      body: 'Will there be VIP for the next show?',
      createdAt: days(2),
      status: 'seen',
      avatarUrl: LAB_CONVERSATIONS[4].fan.avatarUrl,
    },
    {
      id: 'msg-a2',
      conversationId: 'conv-ashley',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: 'Looking into a meet & greet for the next run. Stay tuned!',
      createdAt: new Date(Date.parse(days(2)) + 30 * 60 * 1000).toISOString(),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
      replyTo: {
        id: 'msg-a1',
        body: 'Will there be VIP for the next show?',
        senderId: 'fan-ashley',
        senderName: 'Ashley Reed',
      },
    },
  ],
  'conv-marcus': [
    {
      id: 'msg-m1',
      conversationId: 'conv-marcus',
      senderRole: 'fan',
      senderId: 'fan-marcus',
      senderName: 'Marcus Hale',
      body: 'Got the setlist tattoo. No regrets.',
      createdAt: days(3),
      status: 'seen',
      avatarUrl: LAB_CONVERSATIONS[5].fan.avatarUrl,
    },
    {
      id: 'msg-m2',
      conversationId: 'conv-marcus',
      senderRole: 'artist',
      senderId: LAB_ARTIST_USER.id,
      senderName: 'BurningThunder',
      body: 'That is wild — send us a pic sometime.',
      createdAt: new Date(Date.parse(days(3)) + 2 * 60 * 60 * 1000).toISOString(),
      status: 'seen',
      avatarUrl: LAB_ARTIST_USER.avatarUrl,
    },
  ],
}

/**
 * Fan-facing Messages concept — artists the fan follows.
 * Pure UI demo; not VAC rooms from the artist list.
 */
export const LAB_FAN_INBOX = [
  {
    id: 'fan-inbox-bt',
    artistName: 'BurningThunder',
    verified: true,
    unreadCount: 1,
    preview: 'Thanks for coming last night…',
    updatedAt: minutes(20),
    avatarUrl: LAB_ARTIST_USER.avatarUrl,
  },
  {
    id: 'fan-inbox-bf',
    artistName: 'Badflower',
    verified: true,
    unreadCount: 0,
    preview: 'New tour dates are live',
    updatedAt: hours(10),
    avatarUrl: initialsAvatar('Badflower', '#3f1d2e', '#f9a8d4'),
  },
  {
    id: 'fan-inbox-sd',
    artistName: 'Superdrag',
    verified: true,
    unreadCount: 0,
    preview: 'See you in Nashville',
    updatedAt: days(2),
    avatarUrl: initialsAvatar('Superdrag', '#1c1917', '#fdba74'),
  },
]

export const LAB_FAN_THREAD_BURNINGTHUNDER = [
  {
    id: 'ft-1',
    from: 'artist',
    name: 'BurningThunder',
    body: 'Thanks for coming last night ❤️',
    at: minutes(40),
  },
  {
    id: 'ft-2',
    from: 'fan',
    name: 'You',
    body: 'That encore was unreal. When are you back?',
    at: minutes(30),
  },
  {
    id: 'ft-3',
    from: 'artist',
    name: 'BurningThunder',
    body: "We're working on more dates — Nashville & Chicago first.",
    at: minutes(20),
  },
]

export function cloneLabState() {
  return {
    conversations: LAB_CONVERSATIONS.map((c) => ({
      ...c,
      fan: { ...c.fan },
    })),
    messagesById: Object.fromEntries(
      Object.entries(LAB_MESSAGES_BY_CONVERSATION).map(([id, msgs]) => [
        id,
        msgs.map((m) => ({ ...m, replyTo: m.replyTo ? { ...m.replyTo } : null })),
      ])
    ),
  }
}

export function filterConversations(conversations, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
  if (!q) return conversations || []
  return (conversations || []).filter((c) => {
    const name = c.fan?.displayName || ''
    const city = c.fan?.city || ''
    const preview = c.lastMessagePreview || ''
    return `${name} ${city} ${preview}`.toLowerCase().includes(q)
  })
}
