/**
 * Lightweight campaign composer drafts.
 * Keyed by bandId + audienceType. Stores subject + body only — never emails.
 */
import { useLocalStorage } from '@vueuse/core'

const STORAGE_KEY = 'faneqo.campaign-composer.drafts'
const SUBSTANTIAL_NOTE = 12
const SUBSTANTIAL_SUBJECT = 4

export function useCampaignComposerDrafts() {
  const drafts = useLocalStorage(STORAGE_KEY, {})

  function draftKey(bandId, audienceType) {
    if (!bandId || !audienceType) return ''
    return `${bandId}:${audienceType}`
  }

  function getDraft(bandId, audienceType) {
    const key = draftKey(bandId, audienceType)
    if (!key) return { subject: '', note: '' }
    const row = drafts.value?.[key]
    if (!row || typeof row !== 'object') return { subject: '', note: '' }
    return {
      subject: String(row.subject || ''),
      note: String(row.note || ''),
    }
  }

  function setDraft(bandId, audienceType, { subject, note } = {}) {
    const key = draftKey(bandId, audienceType)
    if (!key) return
    const nextSubject = String(subject || '')
    const nextNote = String(note || '')
    const next = { ...(drafts.value || {}) }
    if (!nextSubject.trim() && !nextNote.trim()) {
      delete next[key]
    } else {
      next[key] = {
        subject: nextSubject,
        note: nextNote,
        updatedAt: Date.now(),
      }
    }
    drafts.value = next
  }

  function clearDraft(bandId, audienceType) {
    setDraft(bandId, audienceType, { subject: '', note: '' })
  }

  function isSubstantial({ subject, note, defaultSubject = '' } = {}) {
    const body = String(note || '').trim()
    if (body.length >= SUBSTANTIAL_NOTE) return true
    const sub = String(subject || '').trim()
    const fallback = String(defaultSubject || '').trim()
    if (!sub) return false
    if (fallback && sub === fallback) return false
    return sub.length >= SUBSTANTIAL_SUBJECT
  }

  return {
    getDraft,
    setDraft,
    clearDraft,
    isSubstantial,
  }
}
