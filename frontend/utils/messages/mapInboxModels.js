/**
 * Map Strapi Inbox DTOs → FaneqoChat presentation models.
 * Does not invent delivered; maps seenByRecipient → seen.
 */

import { normalizeFaneqoMediaList } from '../media/faneqoMedia.js'
import { artistFacingDisplayName, fanInitials, formatArtistFanContext } from './fanIdentity.js'
import { formatNightsTogetherLabel } from './threadPresentation.js'

function mapGalleryReference(row) {
  const gallery = row?.galleryReference
  if (!gallery) return null
  if (gallery.locked || gallery.unavailable) {
    return {
      id: gallery.id || null,
      locked: true,
      unavailable: true,
      media: [],
      photoCount: 0,
      show: null,
    }
  }
  return {
    ...gallery,
    media: normalizeFaneqoMediaList(gallery.media),
  }
}

function mapMessageMedia(row) {
  const raw = Array.isArray(row?.attachments)
    ? row.attachments
    : (row?.attachment ? [row.attachment] : [])
  return normalizeFaneqoMediaList(raw)
}

export function mapArtistConversation(row) {
  if (!row) return null
  const last = row.lastMessage
  const fan = row.fan || {}
  const displayName = artistFacingDisplayName(fan)
  return {
    id: String(row.id),
    kind: 'conversation',
    fan: {
      fanId: fan.fanId || null,
      displayName,
      initials: fan.initials || fanInitials(displayName),
      avatarUrl: fan.avatarUrl || null,
      context: formatArtistFanContext({ ...fan, displayName }),
      showCount: Number(fan.showCount ?? fan.checkedInShowCount) || 0,
    },
    unreadCount: row.unreadCount || 0,
    lastMessagePreview: last?.preview || '',
    lastMessageAt: last?.createdAt || null,
    updatedAt: last?.createdAt ? new Date(last.createdAt).getTime() : Number(row.id) || 0,
    blocked: !!row.blocked,
    messagingAvailable: row.messagingAvailable !== false,
  }
}

export function mapFanConversation(row) {
  if (!row) return null
  const last = row.lastMessage
  const name = row.artist?.name || 'Artist'
  const showCount = Number(row.showCount ?? row.artist?.showCount) || 0
  return {
    id: String(row.id),
    kind: 'conversation',
    fan: {
      displayName: name,
      initials: fanInitials(name),
      avatarUrl: row.artist?.avatarUrl || null,
      context: formatNightsTogetherLabel(showCount),
    },
    artist: {
      id: row.artist?.id || null,
      name,
      slug: row.artist?.slug || null,
      avatarUrl: row.artist?.avatarUrl || null,
    },
    unreadCount: row.unreadCount || 0,
    lastMessagePreview: last?.preview || '',
    lastMessageAt: last?.createdAt || null,
    updatedAt: last?.createdAt ? new Date(last.createdAt).getTime() : Number(row.id) || 0,
    blocked: !!row.blocked,
    messagingAvailable: row.messagingAvailable !== false,
    showCount,
  }
}

export function mapInboxMessage(row, { conversationId, peerName, peerAvatar, selfName } = {}) {
  if (!row) return null
  const mine = !!row.isMine
  const fromBand = row.senderSide === 'band'
  let status = 'sent'
  if (mine && row.seenByRecipient) status = 'seen'
  const attachments = mapMessageMedia(row)
  return {
    id: String(row.id),
    conversationId: String(conversationId || ''),
    senderRole: fromBand ? 'artist' : 'fan',
    senderId: row.senderSide,
    senderName: mine ? selfName || 'You' : peerName || (fromBand ? 'Artist' : 'Fan'),
    body: row.bodyText || '',
    createdAt: row.createdAt,
    status,
    avatarUrl: mine ? null : peerAvatar || null,
    isMine: mine,
    clientMessageId: row.clientMessageId || null,
    seenByRecipient: !!row.seenByRecipient,
    attachment: attachments[0] || null,
    attachments,
    galleryReference: mapGalleryReference(row),
  }
}

export function mapOptimisticMessage({
  conversationId,
  clientMessageId,
  body,
  senderRole,
  senderName,
  attachment = null,
  attachments = null,
  galleryReference = null,
}) {
  const media = mapMessageMedia({ attachments: attachments || (attachment ? [attachment] : []) })
  return {
    id: `opt-${clientMessageId}`,
    conversationId: String(conversationId),
    senderRole,
    senderId: senderRole === 'artist' ? 'band' : 'fan',
    senderName: senderName || 'You',
    body,
    createdAt: new Date().toISOString(),
    status: 'sending',
    isMine: true,
    clientMessageId,
    optimistic: true,
    attachment: media[0] || null,
    attachments: media,
    galleryReference: mapGalleryReference({ galleryReference }),
  }
}

export function mapArtistRequest(row) {
  if (!row) return null
  const fan = row.fan || {}
  const created = row.createdAt || null
  const displayName = artistFacingDisplayName(fan)
  return {
    id: `request:${row.id}`,
    kind: 'request',
    requestId: row.id,
    fan: {
      fanId: fan.fanId || null,
      displayName,
      initials: fan.initials || fanInitials(displayName),
      avatarUrl: fan.avatarUrl || null,
      context: formatArtistFanContext({ ...fan, displayName }),
      showCount: Number(fan.showCount ?? fan.checkedInShowCount) || 0,
    },
    unreadCount: 0,
    lastMessagePreview: row.initialMessagePreview || row.initialMessage || '',
    lastMessageAt: created,
    updatedAt: created ? new Date(created).getTime() : Number(row.id) || 0,
    blocked: false,
    messagingAvailable: false,
    requestStatus: row.status || 'pending',
    initialMessage: row.initialMessage || row.initialMessagePreview || '',
  }
}

export function mapFanRequest(row) {
  if (!row) return null
  const name = row.artist?.name || 'Artist'
  const created = row.createdAt || null
  return {
    id: `request:${row.id}`,
    kind: 'request',
    requestId: row.id,
    fan: {
      displayName: name,
      initials: fanInitials(name),
      avatarUrl: row.artist?.avatarUrl || null,
      context: 'Request pending',
    },
    artist: {
      id: row.artist?.id || null,
      name,
      slug: row.artist?.slug || null,
      avatarUrl: row.artist?.avatarUrl || null,
    },
    unreadCount: 0,
    lastMessagePreview: '',
    lastMessageAt: created,
    updatedAt: created ? new Date(created).getTime() : Number(row.id) || 0,
    blocked: false,
    messagingAvailable: false,
    requestStatus: row.status || 'pending',
  }
}
