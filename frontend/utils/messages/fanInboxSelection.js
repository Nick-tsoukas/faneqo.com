/**
 * Fan inbox selection: request rows vs canonical conversations.
 * Request presentation IDs stay `request:{id}` and must never be fetched as conversations.
 */

import { isRequestRowId, requestIdFromRow } from './fanIdentity.js'

export function conversationLoadFailureKind(status) {
  const code = Number(status)
  if (code === 403 || code === 404) return 'unavailable'
  return 'retry'
}

export function matchPendingRequest(rawId, requests = []) {
  if (!isRequestRowId(rawId)) return null
  const rid = requestIdFromRow(rawId)
  return (requests || []).find((row) => Number(row.requestId) === rid) || null
}

export function fanNumericRouteTarget(routeId) {
  if (routeId == null || routeId === '') return { action: 'none' }
  if (isRequestRowId(routeId)) {
    return { action: 'request', selectedId: String(routeId) }
  }
  return { action: 'conversation', conversationId: String(routeId) }
}

export function matchPendingRequestForUnavailableRoute(rawId, requests = []) {
  const explicit = matchPendingRequest(rawId, requests)
  if (explicit) return explicit
  if (rawId == null || rawId === '' || isRequestRowId(rawId)) return null
  return (requests || []).find((row) => String(row.requestId) === String(rawId)) || null
}

export function applyFanInboxPollTransition({
  selectedId,
  previousRequests = [],
  nextRequests = [],
  nextConversations = [],
} = {}) {
  if (!isRequestRowId(selectedId)) {
    return { action: 'keep', selectedId: selectedId || null }
  }
  const rid = requestIdFromRow(selectedId)
  const stillPending = (nextRequests || []).some((row) => Number(row.requestId) === rid)
  if (stillPending) {
    return { action: 'keep', selectedId }
  }
  const previous = (previousRequests || []).find((row) => Number(row.requestId) === rid)
  const artistId = previous?.artist?.id
  const conversation = artistId != null
    ? (nextConversations || []).find((row) => Number(row.artist?.id) === Number(artistId))
    : null
  if (conversation?.id) {
    return { action: 'open-conversation', conversationId: String(conversation.id) }
  }
  return { action: 'clear' }
}

export function applyArtistInboxPollTransition({
  selectedId,
  previousRequests = [],
  nextRequests = [],
  nextConversations = [],
  previousConversationIds = [],
} = {}) {
  if (!isRequestRowId(selectedId)) {
    return { action: 'keep', selectedId: selectedId || null }
  }
  const rid = requestIdFromRow(selectedId)
  const stillPending = (nextRequests || []).some((row) => Number(row.requestId) === rid)
  if (stillPending) {
    return { action: 'keep', selectedId }
  }
  const previous = (previousRequests || []).find((row) => Number(row.requestId) === rid)
  const fanId = previous?.fan?.fanId
  const known = new Set((previousConversationIds || []).map((id) => String(id)))
  const conversation = (nextConversations || []).find((row) => {
    if (fanId != null && Number(row.fan?.fanId) === Number(fanId)) return true
    return !known.has(String(row.id))
  })
  if (conversation?.id) {
    return { action: 'open-conversation', conversationId: String(conversation.id) }
  }
  return { action: 'clear' }
}
