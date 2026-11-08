/**
 * Per-conversation draft persistence.
 * Keyed by conversationId. No identity / PII besides the typed draft text.
 */
import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export function useConversationDrafts(storageKey = 'faneqo.inbox.drafts') {
  const drafts = useLocalStorage(storageKey, {})

  function getDraft(conversationId) {
    if (!conversationId) return ''
    return String(drafts.value?.[conversationId] || '')
  }

  function setDraft(conversationId, text) {
    if (!conversationId) return
    const next = { ...(drafts.value || {}) }
    const trimmedKeep = String(text || '')
    if (!trimmedKeep.trim()) delete next[conversationId]
    else next[conversationId] = trimmedKeep
    drafts.value = next
  }

  function clearDraft(conversationId) {
    setDraft(conversationId, '')
  }

  function preview(conversationId, max = 42) {
    const raw = getDraft(conversationId).replace(/\s+/g, ' ').trim()
    if (!raw) return ''
    if (raw.length <= max) return raw
    return `${raw.slice(0, max).trimEnd()}…`
  }

  const draftConversationIds = computed(() =>
    Object.keys(drafts.value || {}).filter((id) => String(drafts.value[id] || '').trim())
  )

  return {
    drafts,
    getDraft,
    setDraft,
    clearDraft,
    preview,
    draftConversationIds,
  }
}
