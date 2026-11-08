/**
 * Faneqo ↔ Advanced Chat (vue-advanced-chat) UI adapter.
 *
 * Faneqo owns conversations/messages/identity.
 * This module only maps presentation models so the vendor library
 * does not leak across the app.
 *
 * No Strapi / network calls here.
 */

import { formatArtistFanContext, isFallbackFanDisplay } from './fanIdentity.js'

/**
 * @typedef {Object} FaneqoChatUser
 * @property {string} id
 * @property {string} displayName
 * @property {string|null} [avatarUrl]
 * @property {'online'|'offline'} [presence]
 */

/**
 * @typedef {Object} FaneqoFanContext
 * @property {string} displayName
 * @property {string|null} [city]
 * @property {string|null} [tier]
 * @property {number|null} [showCount]
 * @property {string|null} [fanSince]
 * @property {string|null} [fanId]
 * @property {string|null} [avatarUrl]
 */

/**
 * @typedef {Object} FaneqoConversation
 * @property {string} id
 * @property {FaneqoFanContext} fan
 * @property {number} unreadCount
 * @property {number|string} updatedAt
 * @property {string|null} [lastMessagePreview]
 * @property {string|null} [lastMessageAt]
 * @property {boolean} [fanTyping]
 * @property {boolean} [fanOnline]
 */

/**
 * @typedef {Object} FaneqoMessage
 * @property {string} id
 * @property {string} conversationId
 * @property {'artist'|'fan'|'system'} senderRole
 * @property {string} senderId
 * @property {string} senderName
 * @property {string} body
 * @property {string|Date|number} createdAt
 * @property {'sending'|'sent'|'delivered'|'seen'|'failed'} [status]
 * @property {{ id: string, body: string, senderId: string, senderName?: string }|null} [replyTo]
 * @property {string|null} [avatarUrl]
 */

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function formatChatTimestamp(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function formatChatDate(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

/** Relative list timestamp: 8m, 2h, Yesterday, Mon */
export function formatRelativeListTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h`
  const day = Math.floor(hr / 24)
  if (day === 1) return 'Yesterday'
  if (day < 7) return d.toLocaleDateString(undefined, { weekday: 'short' })
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * One concise context line.
 * Prefers: Nashville · 2 shows · Fan List
 */
export function formatFanContextLine(fan) {
  if (!fan) return ''
  return formatArtistFanContext(fan)
}

export function fanFirstName(displayName) {
  if (!displayName || isFallbackFanDisplay(displayName)) return 'them'
  const trimmed = String(displayName).trim()
  const parts = trimmed.split(/\s+/)
  if (!parts[0]) return 'them'
  if (/^(the|a|an)$/i.test(parts[0]) && parts.length > 1) return trimmed
  return parts[0]
}

/** Optional first-thread composer inserts. Never AI-generated. */
export const FIRST_THREAD_STARTERS = [
  'Thanks for coming out 🤘',
  'Appreciate the support!',
  'Hope to see you at the next show.',
]

/**
 * Faneqo conversation → vue-advanced-chat room
 */
export function toChatRoom(conversation, { currentUserId, currentUserName = 'You', currentUserAvatar = null } = {}) {
  const fan = conversation.fan || {}
  const fanId = fan.fanId || `fan-${conversation.id}`
  const roomInfo = formatFanContextLine(fan)
  const unread = conversation.unreadCount || 0

  const users = [
    {
      _id: String(currentUserId),
      username: currentUserName,
      avatar: currentUserAvatar || undefined,
      status: { state: 'online', lastChanged: '' },
    },
    {
      _id: String(fanId),
      username: fan.displayName || 'Faneqo fan',
      avatar: fan.avatarUrl || undefined,
      status: {
        state: conversation.fanOnline ? 'online' : 'offline',
        lastChanged: '',
      },
    },
  ]

  const typingUsers = conversation.fanTyping ? [String(fanId)] : []

  return {
    roomId: String(conversation.id),
    roomName: fan.displayName || 'Conversation',
    avatar: fan.avatarUrl || undefined,
    unreadCount: unread,
    index: conversation.updatedAt,
    roomInfo: roomInfo || undefined,
    lastMessage: conversation.lastMessagePreview
      ? {
          _id: `last-${conversation.id}`,
          content: conversation.lastMessagePreview,
          senderId: fanId,
          username: fan.displayName,
          timestamp: conversation.lastMessageAt
            ? formatRelativeListTime(conversation.lastMessageAt)
            : '',
          saved: true,
          distributed: true,
          seen: unread === 0,
          new: unread > 0,
        }
      : undefined,
    users,
    typingUsers,
  }
}

export function toChatRooms(conversations, opts) {
  return (conversations || []).map((c) => toChatRoom(c, opts))
}

export function toChatMessage(message) {
  const status = message.status || 'sent'
  const reply = message.replyTo
    ? {
        _id: message.replyTo.id,
        content: message.replyTo.body,
        senderId: message.replyTo.senderId,
      }
    : undefined

  return {
    _id: String(message.id),
    content: message.body || '',
    senderId: String(message.senderId),
    username: message.senderName || '',
    avatar: message.avatarUrl || undefined,
    date: formatChatDate(message.createdAt),
    timestamp: formatChatTimestamp(message.createdAt),
    system: message.senderRole === 'system',
    saved: status !== 'failed' && status !== 'sending',
    distributed: status === 'delivered' || status === 'seen',
    seen: status === 'seen',
    deleted: false,
    failure: status === 'failed',
    disableActions: false,
    disableReactions: true,
    replyMessage: reply,
  }
}

export function toChatMessages(messages) {
  return (messages || []).map(toChatMessage)
}

export function fromChatSendEvent(detail, { artistUserId, artistName = 'You' } = {}) {
  const content = detail?.content ?? detail?.[0]?.content ?? ''
  const roomId = detail?.roomId ?? detail?.[0]?.roomId
  const replyMessage = detail?.replyMessage ?? detail?.[0]?.replyMessage

  return {
    conversationId: roomId != null ? String(roomId) : null,
    body: String(content || '').trim(),
    senderRole: 'artist',
    senderId: String(artistUserId),
    senderName: artistName,
    replyTo: replyMessage
      ? {
          id: String(replyMessage._id || replyMessage.id || ''),
          body: String(replyMessage.content || ''),
          senderId: String(replyMessage.senderId || ''),
        }
      : null,
  }
}

/**
 * Soft, personal dark theme — Instagram/iMessage restraint, Faneqo accents sparingly.
 */
export function getFaneqoChatStyles() {
  return {
    general: {
      color: '#f4f4f5',
      colorSpinner: '#c084fc',
      borderStyle: '1px solid rgba(255,255,255,0.06)',
      colorButtonClear: '#e9d5ff',
      colorButton: '#ffffff',
      backgroundColorButton: '#9333ea',
      backgroundInput: '#18181b',
      colorPlaceholder: 'rgba(255,255,255,0.38)',
      colorCaret: '#e879f9',
      backgroundScrollIcon: '#18181b',
    },
    container: {
      border: 'none',
      borderRadius: '0px',
      boxShadow: 'none',
    },
    header: {
      background: '#09090b',
      colorRoomName: '#fafafa',
      colorRoomInfo: 'rgba(255,255,255,0.48)',
    },
    footer: {
      background: '#09090b',
      borderStyleInput: '1px solid rgba(255,255,255,0.10)',
      borderInputSelected: 'rgba(232,121,249,0.55)',
      backgroundReply: 'rgba(147,51,234,0.14)',
      backgroundTagActive: 'rgba(255,255,255,0.06)',
      backgroundTag: '#18181b',
    },
    content: {
      background: '#000000',
    },
    sidemenu: {
      background: '#09090b',
      backgroundHover: 'rgba(255,255,255,0.035)',
      backgroundActive: 'rgba(147,51,234,0.14)',
      colorActive: '#f5d0fe',
      borderColorSearch: 'rgba(255,255,255,0.08)',
    },
    dropdown: {
      background: '#18181b',
      backgroundHover: 'rgba(255,255,255,0.06)',
    },
    message: {
      // Fan / other — soft slate, no border feel
      background: '#27272a',
      // Artist (me) — subtle magenta-violet wash, not neon
      backgroundMe: 'rgba(147,51,234,0.38)',
      color: '#fafafa',
      colorStarted: 'rgba(255,255,255,0.38)',
      backgroundDeleted: '#3f3f46',
      backgroundSelected: 'rgba(147,51,234,0.18)',
      colorDeleted: 'rgba(255,255,255,0.45)',
      colorUsername: 'rgba(255,255,255,0.42)',
      colorTimestamp: 'rgba(255,255,255,0.36)',
      backgroundDate: 'rgba(255,255,255,0.05)',
      colorDate: 'rgba(255,255,255,0.50)',
      backgroundSystem: 'rgba(255,255,255,0.05)',
      colorSystem: 'rgba(255,255,255,0.50)',
      backgroundMedia: 'rgba(0,0,0,0.25)',
      backgroundReply: 'rgba(0,0,0,0.28)',
      colorReplyUsername: '#f0abfc',
      colorReply: 'rgba(255,255,255,0.55)',
      colorTag: '#f0abfc',
      backgroundImage: '#27272a',
      colorNewMessages: '#e879f9',
      backgroundScrollCounter: '#9333ea',
      colorScrollCounter: '#fff',
      backgroundReaction: '#27272a',
      borderStyleReaction: '1px solid transparent',
      backgroundReactionHover: '#3f3f46',
      borderStyleReactionHover: '1px solid rgba(255,255,255,0.08)',
      colorReactionCounter: '#fafafa',
      backgroundReactionMe: 'rgba(147,51,234,0.25)',
      borderStyleReactionMe: '1px solid transparent',
      backgroundReactionHoverMe: 'rgba(147,51,234,0.35)',
      borderStyleReactionHoverMe: '1px solid rgba(232,121,249,0.4)',
      colorReactionCounterMe: '#f5d0fe',
      backgroundAudioRecord: '#eb4034',
      backgroundAudioLine: 'rgba(255,255,255,0.15)',
      backgroundAudioProgress: '#e879f9',
      backgroundAudioProgressSelector: '#f0abfc',
      colorFileExtension: 'rgba(255,255,255,0.45)',
    },
    markdown: {
      background: 'rgba(255,255,255,0.05)',
      border: 'rgba(255,255,255,0.08)',
      color: '#f472b6',
      colorMulti: '#fafafa',
    },
    room: {
      colorUsername: '#fafafa',
      colorMessage: 'rgba(255,255,255,0.48)',
      colorTimestamp: 'rgba(255,255,255,0.32)',
      colorStateOnline: '#34d399',
      colorStateOffline: 'rgba(255,255,255,0.28)',
      backgroundCounterBadge: '#d946ef',
      colorCounterBadge: '#ffffff',
    },
    emoji: {
      background: '#18181b',
    },
    icons: {
      search: 'rgba(255,255,255,0.40)',
      add: '#e879f9',
      toggle: '#fafafa',
      menu: 'rgba(255,255,255,0.55)',
      close: 'rgba(255,255,255,0.40)',
      closeImage: '#fff',
      file: '#e879f9',
      paperclip: 'rgba(255,255,255,0.35)',
      closeOutline: '#fff',
      closePreview: '#fff',
      send: '#e879f9',
      sendDisabled: 'rgba(255,255,255,0.22)',
      emoji: 'rgba(255,255,255,0.45)',
      emojiReaction: 'rgba(255,255,255,0.40)',
      document: '#e879f9',
      pencil: '#e879f9',
      checkmark: 'rgba(255,255,255,0.40)',
      checkmarkSeen: '#34d399',
      eye: 'rgba(255,255,255,0.40)',
      dropdownMessage: 'rgba(255,255,255,0.40)',
      dropdownMessageBackground: 'rgba(0,0,0,0.28)',
      dropdownRoom: 'rgba(255,255,255,0.40)',
      dropdownScroll: '#09090b',
      microphone: 'rgba(255,255,255,0.40)',
      audioPlay: '#e879f9',
      audioPause: '#e879f9',
      audioCancel: '#f87171',
      audioConfirm: '#34d399',
    },
  }
}

export function getChatTextMessages({ fanName = null, emptyTitle = null } = {}) {
  const first = fanName ? fanFirstName(fanName) : null
  return {
    ROOMS_EMPTY: emptyTitle || 'No conversations yet',
    ROOM_EMPTY: 'No messages yet',
    NEW_MESSAGES: 'New messages',
    MESSAGE_DELETED: 'This message was deleted',
    MESSAGES_EMPTY: 'Say hello',
    CONVERSATION_STARTED: 'Conversation started',
    TYPE_MESSAGE: first ? `Message ${first}...` : 'Write a message…',
    SEARCH: 'Search conversations',
    IS_ONLINE: 'Online',
    LAST_SEEN: 'Last seen ',
    IS_TYPING: 'is typing...',
    CANCEL_SELECT_MESSAGE: 'Cancel',
  }
}
