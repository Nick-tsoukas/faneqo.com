/**
 * Artist Sent list/detail presentation.
 * Uses campaign history/detail fields only. Does not invent delivery, read, or Night truth.
 */

import { formatShowNightDate } from '../shows/formatShowNightDate.js'
import { galleryPath, nightPath, nightPathFromRecap } from '../nights/publicNightPaths.js'
import { allFansComposeTo, showComposeTo } from '../campaigns/messagesHomeRoutes.js'

const GENERIC_TITLES = new Set([
  'inbox message',
  'untitled email',
  'untitled message',
  'message the room',
  'fan message',
])

const STATUS_LABELS = {
  draft: 'Draft',
  queued: 'Processing',
  sending: 'Sending',
  completed: 'Sent',
  partially_failed: 'Partial',
  failed: 'Failed',
  canceled: 'Canceled',
}

export function isGenericSentTitle(value) {
  return GENERIC_TITLES.has(String(value || '').trim().toLowerCase())
}

export function firstMeaningfulLine(text) {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines[0] || ''
}

export function sentMessageExcerpt(campaign = {}) {
  const body = firstMeaningfulLine(campaign.bodyText || campaign.bodyExcerpt || '')
  if (body) return body
  const subject = firstMeaningfulLine(campaign.subject)
  if (subject && !isGenericSentTitle(subject)) return subject
  return ''
}

export function sentAudienceIdentity(campaign = {}) {
  if (campaign.audienceType === 'show_attendees') {
    const night = sentNightContext(campaign)
    const place = night.place || night.title
    if (place) return `Message to ${place}`
    return 'Message to a Night'
  }
  return 'Sent to all fans'
}

export function sentRowTitle(campaign = {}) {
  const excerpt = sentMessageExcerpt(campaign)
  if (excerpt) return excerpt
  const galleryTitle = String(campaign.gallery?.title || '').trim()
  if (galleryTitle && !isGenericSentTitle(galleryTitle)) return galleryTitle
  const photos = sentGalleryMeta(campaign)
  if (photos) return photos
  return sentAudienceIdentity(campaign)
}

export function sentNightContext(campaign = {}) {
  const show = campaign.show || campaign.gallery?.show || {}
  const date = formatShowNightDate(show.date || show.showStartedAt || show.showEndedAt || '')
  const place = String(show.venue || show.city || '').trim()
  const title = String(show.showTitle || show.title || '').trim()
  const titleDistinct = title && title.toLowerCase() !== place.toLowerCase()
  return {
    kicker: [place, date].filter(Boolean).join(' · '),
    place,
    date,
    title: titleDistinct ? title : '',
  }
}

export function sentAudienceLine(campaign = {}) {
  if (campaign.audienceType === 'show_attendees') {
    const night = sentNightContext(campaign)
    if (night.kicker && night.title) return night.kicker
    if (night.kicker) return night.kicker
    if (night.title) return night.title
    return String(campaign.audienceDetail || '').trim() || 'This Night'
  }
  return 'All fans'
}

export function sentAudienceTitle(campaign = {}) {
  if (campaign.audienceType !== 'show_attendees') return ''
  return sentNightContext(campaign).title
}

export function formatSentPeople(count) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 0) return ''
  return `${n} ${n === 1 ? 'person' : 'people'}`
}

export function sentChannelLabel(campaign = {}) {
  if (campaign.channel === 'in_app') return 'Faneqo Inbox'
  if (campaign.channel === 'email') return 'Email'
  return ''
}

export function sentGalleryMeta(campaign = {}) {
  const count = Number(campaign.gallery?.photoCount)
  if (!campaign.gallery || !Number.isFinite(count) || count < 1) return ''
  return count === 1 ? '1 photo' : `${count} photos`
}

export function sentMetaLine(campaign = {}) {
  const parts = [formatSentPeople(campaign.recipientCount), sentChannelLabel(campaign)]
  const photos = sentGalleryMeta(campaign)
  if (photos) parts.push(photos)
  return parts.filter(Boolean).join(' · ')
}

export function sentStatusLabel(status) {
  return STATUS_LABELS[status] || status || 'Unknown'
}

export function sentStatusKind(status) {
  if (status === 'completed') return 'ok'
  if (status === 'sending') return 'live'
  if (status === 'queued') return 'queued'
  if (status === 'partially_failed') return 'partial'
  if (status === 'failed') return 'fail'
  return 'muted'
}

export function sentWhenKey(campaign = {}) {
  return campaign.completedAt || campaign.queuedAt || campaign.createdAt || ''
}

export function formatSentListWhen(campaign, now = new Date()) {
  const raw = sentWhenKey(campaign)
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  const time = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(d)
  if (d.toDateString() === now.toDateString()) return `Today · ${time}`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return sentDayLabel(raw, now)
}

export function sentDayLabel(raw, now = new Date()) {
  if (!raw) return ''
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return ''
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(d)
}

export function groupSentByDay(campaigns = [], now = new Date()) {
  const rows = Array.isArray(campaigns) ? campaigns : []
  const days = new Set(rows.map((row) => sentDayLabel(sentWhenKey(row), now)).filter(Boolean))
  if (days.size < 2) {
    return [{ key: 'all', label: '', items: rows }]
  }
  const groups = []
  const index = new Map()
  for (const row of rows) {
    const label = sentDayLabel(sentWhenKey(row), now) || 'Earlier'
    if (!index.has(label)) {
      const group = { key: label, label, items: [] }
      index.set(label, group)
      groups.push(group)
    }
    index.get(label).items.push(row)
  }
  return groups
}

export function sentHeaderTitle(campaign = {}) {
  const excerpt = sentMessageExcerpt(campaign)
  if (excerpt) return sentAudienceIdentity(campaign)
  return sentRowTitle(campaign)
}

export function skippedTotal(campaign = {}) {
  return (Number(campaign.skippedCount) || 0) + (Number(campaign.suppressedCount) || 0)
}

export function sentDeliverySummary(campaign = {}) {
  const sent = Number(campaign.sentCount) || 0
  const skipped = skippedTotal(campaign)
  const failed = Number(campaign.failedCount) || 0
  const isInbox = campaign.channel === 'in_app'
  return {
    sent,
    skipped,
    failed,
    sentLabel: isInbox
      ? `${sent} ${sent === 1 ? 'conversation' : 'conversations'}`
      : `${sent} sent`,
    rest: [
      skipped ? `${skipped} skipped` : '',
      failed ? `${failed} failed` : (skipped ? '0 failed' : ''),
    ].filter(Boolean).join(' · '),
    hint: isInbox && sent > 0
      ? 'A conversation counts here after the message is added. Faneqo does not mark it read or seen.'
      : '',
  }
}

export function mapCampaignShowToGalleryShow(show = {}) {
  if (!show || typeof show !== 'object') return null
  const venue = String(show.venue || '').trim()
  const city = String(show.city || '').trim()
  const title = String(show.showTitle || show.title || '').trim()
  const date = show.date || show.showStartedAt || show.showEndedAt || ''
  if (!venue && !city && !title && !date) return null
  return { title, venue, city, date }
}

export function hydrateSentGallery(campaign = {}, live = null) {
  const stub = campaign.gallery
  if (!stub && !live) return null
  const show = live?.show || mapCampaignShowToGalleryShow(campaign.show)
  const media = Array.isArray(live?.media) ? live.media : []
  const photoCount = Number(live?.photoCount || media.length || stub?.photoCount) || 0
  return {
    ...(stub || {}),
    ...(live || {}),
    title: String(live?.title || stub?.title || '').trim(),
    slug: live?.slug || stub?.slug || null,
    photoCount,
    media,
    show,
    band: live?.band || stub?.band || null,
    unavailable: Boolean(live?.unavailable || stub?.unavailable || stub?.locked),
  }
}

export function sentGalleryTo(gallery = {}) {
  const bandSlug = gallery?.band?.slug
  const slug = gallery?.slug
  return galleryPath(bandSlug, slug)
}

export function sentNightTo(campaign = {}, gallery = null) {
  const live = gallery || campaign.gallery || {}
  const recap = live.showRecap || live.show || campaign.show || {}
  const bandSlug = live.band?.slug || recap.band?.slug
  const fromRecap = nightPathFromRecap(recap, bandSlug)
  if (fromRecap) return fromRecap
  const nightSlug = recap.nightSlug
  if (nightSlug && bandSlug) return nightPath(bandSlug, nightSlug)
  const recapId = recap.id || recap.recapId || campaign.showRecapId || campaign.recapId
  if (recapId && campaign.audienceType === 'show_attendees') return `/fans/recaps/${recapId}`
  return null
}

export function sentComposeAgainTo(campaign = {}, bandId = null) {
  if (campaign.audienceType === 'all_fans') return allFansComposeTo(bandId, 'sent')
  const recapId = campaign.recapId || campaign.showRecapId || campaign.show?.id || campaign.show?.recapId
  if (campaign.audienceType === 'show_attendees' && recapId) {
    return showComposeTo(recapId, bandId, 'sent')
  }
  return null
}

export function sentNextActions(campaign = {}, { bandId = null, gallery = null } = {}) {
  const nightTo = sentNightTo(campaign, gallery)
  const galleryTo = sentGalleryTo(gallery || campaign.gallery)
  const againTo = sentComposeAgainTo(campaign, bandId)
  const sent = Number(campaign.sentCount) || 0
  const failed = campaign.status === 'failed' || sent < 1
  const conversations = campaign.channel === 'in_app' && sent > 0
    ? { to: '/messages?tab=inbox', label: 'Continue conversations' }
    : null

  let primary = null
  let secondary = null
  if (failed && againTo) primary = { to: againTo, label: 'Message this audience again' }
  else if (conversations) primary = conversations
  else if (nightTo) primary = { to: nightTo, label: 'View Night' }
  else if (againTo) primary = { to: againTo, label: 'Message this audience again' }

  if (primary === conversations && nightTo) secondary = { to: nightTo, label: 'View Night' }
  else if (primary === conversations && galleryTo) secondary = { to: galleryTo, label: 'Open Gallery' }
  else if (primary && againTo && primary.to !== againTo && !failed) {
    secondary = { to: againTo, label: 'Message this audience again' }
  }

  return { primary, secondary }
}

export function sentEmptyCopy() {
  return {
    heading: 'Nothing sent yet.',
    body: 'Messages you send to all fans or a Night will appear here.',
  }
}

export function sentErrorCopy() {
  return {
    heading: 'Couldn’t load sent messages.',
    body: 'Check your connection and try again.',
  }
}
