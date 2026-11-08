/**
 * Native Artist Page Follow helpers.
 * Follow truth is server timestamps, not Fan existence or email status.
 */

import { sanitizeFanReturnTo } from './safeFanReturnTo.js'

export const FAN_FOLLOW_INTENT = 'follow'
export const FAN_FOLLOW_INTENT_QUERY = 'feq_intent'

export function isFollowingFan(row) {
  if (!row) return false
  if (typeof row.isFollowing === 'boolean') return row.isFollowing
  const followedAt = row.followedAt ? new Date(row.followedAt).getTime() : null
  if (followedAt == null || Number.isNaN(followedAt)) return false
  const unfollowedAt = row.unfollowedAt ? new Date(row.unfollowedAt).getTime() : null
  return unfollowedAt == null || Number.isNaN(unfollowedAt) || unfollowedAt < followedAt
}

/** Email / Fan List contactability. Independent of Follow timestamps. */
export function isContactableFan(row) {
  return String(row?.status || '') === 'subscribed'
}

export const ARTIST_REL_SESSION_PREFIX = 'faneqo-artist-rel:'

export function artistRelSessionKey(bandId) {
  if (bandId == null || bandId === '') return ''
  return `${ARTIST_REL_SESSION_PREFIX}${bandId}`
}

export function readArtistRelSession(bandId) {
  const key = artistRelSessionKey(bandId)
  if (!key || typeof sessionStorage === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      followed: !!parsed?.followed,
      subscribed: !!parsed?.subscribed,
    }
  } catch {
    return null
  }
}

export function writeArtistRelSession(bandId, { followed = false, subscribed = false } = {}) {
  const key = artistRelSessionKey(bandId)
  if (!key || typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(key, JSON.stringify({ followed: !!followed, subscribed: !!subscribed }))
  } catch {
    /* private mode */
  }
}

export function artistFollowReturnTo(slug) {
  const path = `/${String(slug || '').replace(/^\/+/, '')}`
  if (!slug) return null
  return sanitizeFanReturnTo(`${path}?${FAN_FOLLOW_INTENT_QUERY}=${FAN_FOLLOW_INTENT}`, {
    fallback: path,
  })
}

export function hasFollowIntent(query) {
  return String(query?.[FAN_FOLLOW_INTENT_QUERY] || '') === FAN_FOLLOW_INTENT
}

export function stripFollowIntentQuery(query = {}) {
  const next = { ...query }
  delete next[FAN_FOLLOW_INTENT_QUERY]
  return next
}
