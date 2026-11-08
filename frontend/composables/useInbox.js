/**
 * Artist + fan Inbox API client.
 * Campaigns stay in useMessageCampaigns — do not mix.
 */
import { inboxErrorCopy, inboxUiLog } from '~/utils/messages/inboxUiLog'

const CONVERSATION_UPLOAD_TIMEOUT_MS = 60 * 1000

function createUploadDeadline(parentSignal, timeoutMs = CONVERSATION_UPLOAD_TIMEOUT_MS) {
  const controller = new AbortController()
  let timedOut = false
  const abortFromParent = () => controller.abort()
  if (parentSignal?.aborted) controller.abort()
  else parentSignal?.addEventListener?.('abort', abortFromParent, { once: true })
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)
  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    clear: () => {
      clearTimeout(timer)
      parentSignal?.removeEventListener?.('abort', abortFromParent)
    },
  }
}

function inboxOperation(method, path) {
  if (path.includes('dm-candidates')) return 'dm-candidates'
  if (path.endsWith('/start') || path.includes('/conversations/start')) return 'conversation-start'
  if (path.includes('/unread-count')) return 'unread-count'
  if (path.includes('/media/delivery')) return 'media-delivery'
  if (path.includes('/media') && method === 'POST') return 'media-upload'
  if (path.includes('/media')) return 'media-stream'
  if (path.includes('/messages') && method === 'POST') return 'send'
  if (path.includes('/messages')) return 'messages'
  if (path.includes('/read')) return 'read'
  if (path.includes('/unblock')) return 'unblock'
  if (path.includes('/block')) return 'block'
  if (path.includes('/fan-account/conversations')) return 'fan-list'
  if (path.includes('/fan-account/message-status')) return 'message-status'
  if (path.includes('/fan-account/profile')) return 'fan-profile'
  if (path.includes('/fan-account/message-requests')) return 'fan-request'
  if (path.includes('/conversations/requests') && path.includes('/accept')) return 'request-accept'
  if (path.includes('/conversations/requests') && path.includes('/decline')) return 'request-decline'
  if (path.includes('/conversations/requests')) return 'request-list'
  if (/\/conversations\/[^/?]+$/.test(path)) return 'thread'
  if (path.includes('/conversations')) return 'list'
  return 'inbox'
}

function conversationIdFromPath(path) {
  const match = String(path).match(/\/conversations\/(\d+)/)
  return match ? match[1] : undefined
}

function makeInboxError({ status, name, message, data }) {
  const err = new Error(message || 'Request failed')
  err.status = status
  err.statusCode = status
  err.data = data || { error: { status, name, message } }
  err.inboxCopy = inboxErrorCopy(err)
  return err
}

export function useInbox() {
  const config = useRuntimeConfig()
  const token = useStrapiToken()
  const baseUrl = config.public.strapiUrl || 'http://localhost:1337'

  async function inboxFetch(path, options = {}) {
    const method = String(options.method || 'GET').toUpperCase()
    const operation = inboxOperation(method, path)
    const started = Date.now()
    const jwt = token.value
    const bandId = options.query?.bandId || options.body?.bandId
    const conversationId = conversationIdFromPath(path)
    const fanId = options.body?.fanId

    inboxUiLog('request:start', { operation, bandId, conversationId, fanId })

    if (!jwt) {
      inboxUiLog('request:error', {
        operation,
        status: 401,
        reason: 'missing_token',
        latencyMs: Date.now() - started,
      })
      throw makeInboxError({
        status: 401,
        name: 'unauthorized',
        message: 'Authentication required',
      })
    }

    try {
      const response = await $fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${jwt}`,
          ...(options.headers || {}),
        },
      })

      const latencyMs = Date.now() - started
      if (response?.error && !response?.data) {
        const status = Number(response.error.status) || 400
        inboxUiLog('request:error', {
          operation,
          status,
          reason: response.error.name || 'error_envelope',
          requestId: response.error.requestId,
          latencyMs,
        })
        throw makeInboxError({
          status,
          name: response.error.name,
          message: response.error.message || 'Request failed',
          data: response,
        })
      }

      inboxUiLog('request:end', { operation, status: 200, latencyMs, bandId, conversationId })
      return response?.data || response
    } catch (err) {
      if (!err.inboxCopy) {
        inboxUiLog('request:error', {
          operation,
          status: err?.status || err?.statusCode || 'unknown',
          reason: err?.data?.error?.name || err?.name,
          requestId: err?.data?.error?.requestId,
          latencyMs: Date.now() - started,
        })
        err.inboxCopy = inboxErrorCopy(err)
      }
      throw err
    }
  }

  function listConversations({ bandId, page = 1, pageSize = 20 }) {
    return inboxFetch('/api/conversations', { query: { bandId, page, pageSize } })
  }

  function unreadCount({ bandId }) {
    return inboxFetch('/api/conversations/unread-count', { query: { bandId } })
  }

  function listDmCandidates({ bandId, search = '', limit = 40 }) {
    return inboxFetch('/api/conversations/dm-candidates', { query: { bandId, search, limit } })
  }

  function startConversation({ bandId, fanId }) {
    return inboxFetch('/api/conversations/start', {
      method: 'POST',
      body: { bandId, fanId },
    })
  }

  function getConversation(conversationId) {
    return inboxFetch(`/api/conversations/${conversationId}`)
  }

  function listMessages(conversationId, { beforeId, afterId, limit } = {}) {
    const query = {}
    if (beforeId) query.beforeId = beforeId
    if (afterId) query.afterId = afterId
    if (limit) query.limit = limit
    return inboxFetch(`/api/conversations/${conversationId}/messages`, { query })
  }

  function sendMessage(conversationId, {
    bodyText,
    clientMessageId,
    attachmentMediaId,
    attachmentMediaIds,
    artistUpdateId,
  }) {
    const ids = Array.isArray(attachmentMediaIds)
      ? attachmentMediaIds
      : (attachmentMediaId ? [attachmentMediaId] : [])
    return inboxFetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: {
        bodyText,
        clientMessageId,
        ...(ids.length === 1 ? { attachmentMediaId: ids[0] } : {}),
        ...(ids.length ? { attachmentMediaIds: ids } : {}),
        ...(artistUpdateId ? { artistUpdateId } : {}),
      },
    })
  }

  function getMediaDelivery({ signal } = {}) {
    return inboxFetch('/api/conversations/media/delivery', { signal })
  }

  async function uploadConversationMedia(file, { conversationId, signal, deliveryReady } = {}) {
    if (!token.value) {
      const err = new Error('Authentication required')
      err.status = 401
      throw err
    }
    if (!conversationId) {
      const err = new Error('Conversation is required')
      err.status = 400
      throw err
    }
    if (deliveryReady !== true) {
      const delivery = await getMediaDelivery({ signal })
      if (delivery?.ready !== true && delivery?.data?.ready !== true) {
        const err = new Error('Protected delivery is not available.')
        err.status = 503
        err.code = 'gated_delivery_unavailable'
        throw err
      }
    }
    const body = new FormData()
    body.append('files', file)
    const deadline = createUploadDeadline(signal)
    let result
    try {
      result = await inboxFetch(`/api/conversations/${conversationId}/media`, {
        method: 'POST',
        body,
        signal: deadline.signal,
      })
    } catch (err) {
      if (!deadline.timedOut()) throw err
      const timeoutError = new Error('Upload took too long. Tap Retry.')
      timeoutError.status = 408
      timeoutError.code = 'upload_timeout'
      throw timeoutError
    } finally {
      deadline.clear()
    }
    const media = result?.id ? result : (result?.media || result?.data || result)
    if (!media?.id) {
      const err = new Error('Upload did not return a file')
      err.status = 500
      throw err
    }
    return {
      mediaId: media.id,
      id: media.id,
      width: media.width || null,
      height: media.height || null,
      alt: 'Image',
      mime: media.mime || 'image/webp',
      protected: true,
    }
  }

  function markRead(conversationId, throughMessageId) {
    return inboxFetch(`/api/conversations/${conversationId}/read`, {
      method: 'POST',
      body: { throughMessageId },
    })
  }

  function blockConversation(conversationId) {
    return inboxFetch(`/api/conversations/${conversationId}/block`, { method: 'POST' })
  }

  function unblockConversation(conversationId) {
    return inboxFetch(`/api/conversations/${conversationId}/unblock`, { method: 'POST' })
  }

  function listFanConversations({ page = 1, pageSize = 20 } = {}) {
    return inboxFetch('/api/fan-account/conversations', { query: { page, pageSize } })
  }

  function fanUnreadCount() {
    return inboxFetch('/api/fan-account/conversations/unread-count')
  }

  function listMessageRequests({ bandId }) {
    return inboxFetch('/api/conversations/requests', { query: { bandId } })
  }

  function getMessageRequest(requestId) {
    return inboxFetch(`/api/conversations/requests/${requestId}`)
  }

  function acceptMessageRequest(requestId) {
    return inboxFetch(`/api/conversations/requests/${requestId}/accept`, { method: 'POST' })
  }

  function declineMessageRequest(requestId) {
    return inboxFetch(`/api/conversations/requests/${requestId}/decline`, { method: 'POST' })
  }

  function getFanMessageStatus({ bandId }) {
    return inboxFetch('/api/fan-account/message-status', { query: { bandId } })
  }

  function updateFanProfile({ bandId, firstName, lastName }) {
    return inboxFetch('/api/fan-account/profile', {
      method: 'POST',
      body: { bandId, firstName, lastName },
    })
  }

  function listFanMessageRequests() {
    return inboxFetch('/api/fan-account/message-requests')
  }

  function createFanMessageRequest({ bandId, bodyText, firstName, lastName }) {
    return inboxFetch('/api/fan-account/message-requests', {
      method: 'POST',
      body: { bandId, bodyText, firstName, lastName },
    })
  }

  return {
    listConversations,
    unreadCount,
    listDmCandidates,
    startConversation,
    getConversation,
    listMessages,
    sendMessage,
    getMediaDelivery,
    uploadConversationMedia,
    markRead,
    blockConversation,
    unblockConversation,
    listFanConversations,
    fanUnreadCount,
    listMessageRequests,
    getMessageRequest,
    acceptMessageRequest,
    declineMessageRequest,
    getFanMessageStatus,
    updateFanProfile,
    listFanMessageRequests,
    createFanMessageRequest,
  }
}
