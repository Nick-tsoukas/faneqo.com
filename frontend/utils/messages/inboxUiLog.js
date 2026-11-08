/**
 * Dev-only Inbox UI logs. Never log body, JWT, email, or tokens.
 */
export function inboxUiLog(event, fields = {}) {
  if (!import.meta.dev) return
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
  console.info(`[Faneqo Inbox UI] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`)
}

export function newClientMessageId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `cmsg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

export function inboxErrorCopy(err) {
  const status = err?.status || err?.statusCode || err?.data?.error?.status
  const name = err?.data?.error?.name || err?.name
  if (status === 401 || name === 'unauthorized') {
    return { title: 'Sign in required', body: 'Your session expired. Sign in again to keep messaging.' }
  }
  if (status === 403 || name === 'forbidden') {
    return { title: 'Not available', body: "You don't have access to this conversation." }
  }
  if (status === 404) {
    return { title: 'Conversation unavailable', body: "This conversation isn't available." }
  }
  if (status === 409 || name === 'conversation_not_available' || name === 'fan_not_available') {
    return { title: "Can't message right now", body: 'Messaging is not available for this fan.' }
  }
  if (status === 429 || name === 'rate_limited') {
    return { title: 'Slow down', body: 'Too many messages. Try again in a moment.' }
  }
  if (name === 'needs_first_name') {
    return { title: 'What should the band call you?', body: 'Add your first name to send a message request.' }
  }
  if (name === 'unavailable') {
    return { title: "Can't message right now", body: 'Messaging is not available for this artist right now.' }
  }
  if (name === 'empty_message') return { title: 'Write a message', body: 'Add a note or image before sending.' }
  if (name === 'invalid_attachment' || name === 'invalid_attachment_type' || name === 'attachment_too_large') {
    if (name === 'attachment_too_large') {
      return { title: "Couldn't attach image", body: 'Photos can be up to 8 MB.' }
    }
    return { title: "Couldn't attach image", body: 'This photo format isn’t supported yet. Choose a JPEG, PNG, or WebP.' }
  }
  if (name === 'gated_delivery_unavailable') {
    return { title: "Photos aren't available", body: 'Photo attachments aren’t available right now. You can still send a text message.' }
  }
  if (name === 'message_too_long') return { title: 'Message too long', body: 'Shorten your note and try again.' }
  return { title: "Couldn't send", body: 'Something went wrong. Try again.' }
}
