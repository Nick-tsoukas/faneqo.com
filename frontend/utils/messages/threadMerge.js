/**
 * Inbox thread merge — shared by artist and fan clients.
 * Reconciles optimistic rows via clientMessageId. Never logs bodies.
 */

export function compareInboxMessageOrder(a, b) {
  const at = new Date(a?.createdAt || 0).getTime()
  const bt = new Date(b?.createdAt || 0).getTime()
  if (at !== bt) return at - bt
  const an = Number(a?.id)
  const bn = Number(b?.id)
  if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn
  return String(a?.id || '').localeCompare(String(b?.id || ''))
}

export function isInboxAuthError(err) {
  const status = err?.status || err?.statusCode || err?.data?.error?.status
  return Number(status) === 401
}

/**
 * Merge incoming server/optimistic rows into the current thread.
 * Same clientMessageId + optimistic → one bubble.
 */
function mergeAttachments(prevList, nextList) {
  const prev = (prevList || []).filter(Boolean)
  const next = (nextList || []).filter(Boolean)
  if (!next.length) return prev
  return next.map((item, index) => mergeAttachment(prev[index], item)).filter(Boolean)
}

function mergeAttachment(prev, next) {
  if (!next && !prev) return null
  if (!next) return prev
  const keepLocalPreview = prev?.url && String(prev.url).startsWith('blob:')
  return {
    ...next,
    url: keepLocalPreview ? prev.url : next.url,
    mediaId: next.mediaId || prev?.mediaId || null,
  }
}

export function mergeInboxThread(existing, incoming) {
  const byId = new Map()
  const byClient = new Map()

  function forget(msg) {
    if (!msg) return
    byId.delete(String(msg.id))
    if (msg.clientMessageId) byClient.delete(String(msg.clientMessageId))
  }

  function remember(msg) {
    if (!msg || msg.id == null) return
    byId.set(String(msg.id), msg)
    if (msg.clientMessageId) byClient.set(String(msg.clientMessageId), msg)
  }

  for (const msg of existing || []) remember(msg)

  for (const msg of incoming || []) {
    if (!msg || msg.id == null) continue
    const clientKey = msg.clientMessageId ? String(msg.clientMessageId) : null
    const prevClient = clientKey ? byClient.get(clientKey) : null
    if (prevClient && prevClient.optimistic && !msg.optimistic) {
      forget(prevClient)
      remember({
        ...msg,
        optimistic: false,
        status: msg.seenByRecipient ? 'seen' : (msg.status || 'sent'),
        attachment: mergeAttachment(prevClient.attachment, msg.attachment),
        attachments: mergeAttachments(prevClient.attachments || [prevClient.attachment], msg.attachments || [msg.attachment]),
      })
      continue
    }
    remember(msg)
  }

  return [...byId.values()].sort(compareInboxMessageOrder)
}
