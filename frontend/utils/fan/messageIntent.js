/**
 * Message resume after magic-link verification.
 * The artist and intent travel in the return path. The draft stays local.
 */

import { FAN_FOLLOW_INTENT_QUERY, stripFollowIntentQuery } from './artistFollow.js'
import { sanitizeFanReturnTo } from './safeFanReturnTo.js'

export const FAN_MESSAGE_INTENT = 'message'
const DRAFT_PREFIX = 'faneqo-message-draft:'

export function artistMessageReturnTo(bandSlug) {
  const slug = String(bandSlug || '').trim()
  if (!slug) return null
  return sanitizeFanReturnTo(
    `/${slug}?${FAN_FOLLOW_INTENT_QUERY}=${FAN_MESSAGE_INTENT}`,
    { fallback: null },
  )
}

export function hasMessageIntent(query) {
  const raw = query?.[FAN_FOLLOW_INTENT_QUERY]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === FAN_MESSAGE_INTENT
}

export function stripMessageIntentQuery(query) {
  return stripFollowIntentQuery(query)
}

export function writeMessageDraft(bandId, draft) {
  if (typeof sessionStorage === 'undefined' || bandId == null || bandId === '') return
  const bodyText = String(draft?.bodyText || '').slice(0, 2000)
  const firstName = String(draft?.firstName || '').slice(0, 80)
  const lastName = String(draft?.lastName || '').slice(0, 80)
  const key = `${DRAFT_PREFIX}${bandId}`
  try {
    if (!bodyText && !firstName && !lastName) {
      sessionStorage.removeItem(key)
      return
    }
    sessionStorage.setItem(key, JSON.stringify({ bodyText, firstName, lastName }))
  } catch {
    /* private mode */
  }
}

export function readMessageDraft(bandId) {
  if (typeof sessionStorage === 'undefined' || bandId == null || bandId === '') return null
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${bandId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      bodyText: String(parsed?.bodyText || ''),
      firstName: String(parsed?.firstName || ''),
      lastName: String(parsed?.lastName || ''),
    }
  } catch {
    return null
  }
}
