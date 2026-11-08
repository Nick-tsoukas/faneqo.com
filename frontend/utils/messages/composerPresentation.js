/**
 * Artist composer copy and Night/audience presentation.
 * Does not invent eligibility, cooldown, or Gallery permissions.
 */
import { formatShowIdentity } from '../campaigns/formatShowIdentity.js'
import { formatShowNightDate } from '../shows/formatShowNightDate.js'

export function formatComposerNightContext(recap = {}, options = {}) {
  const date = formatShowNightDate(
    recap.showStartedAt || recap.recapGeneratedAt || recap.date || '',
    { timeZone: recap.timezone || recap.timeZone || options.timeZone }
  )
  const venue = String(recap.venue || recap.city || '').trim()
  const title = String(recap.showTitle || '').trim()
  const kicker = [date, venue].filter(Boolean).join(' · ')
  return {
    kicker,
    title: title || venue || 'This Night',
    compact: formatShowIdentity(recap, options),
  }
}

export function composerPlaceholder({ audienceType, peerName } = {}) {
  if (audienceType === 'private') {
    const name = String(peerName || '').trim()
    return name ? `Message ${name}…` : 'Write a message…'
  }
  if (audienceType === 'show_attendees') {
    return 'Say something to everyone who was there…'
  }
  return 'Say something to your fans…'
}

export function composerAudienceWho({ audienceType, recap, peerName, showCount } = {}) {
  if (audienceType === 'private') {
    return {
      kicker: 'Private message',
      title: String(peerName || 'Faneqo fan').trim() || 'Faneqo fan',
      detail: Number(showCount) > 0
        ? `${showCount} ${Number(showCount) === 1 ? 'show' : 'shows'}`
        : '',
    }
  }
  if (audienceType === 'show_attendees') {
    const night = formatComposerNightContext(recap)
    return {
      kicker: night.kicker || 'This Night',
      title: night.title,
      detail: 'People who were there',
    }
  }
  return {
    kicker: 'Everyone',
    title: 'All fans',
    detail: 'Everyone currently eligible to receive this message.',
  }
}

export function composerReachCopy({
  audienceType,
  eligible = 0,
  unavailable = 0,
  loading = false,
  testMode = false,
} = {}) {
  if (loading) return 'Checking who can receive this…'
  const n = Number(eligible) || 0
  if (testMode) {
    return `${n} ${n === 1 ? 'test recipient' : 'test recipients'}`
  }
  const people = `${n} ${n === 1 ? 'fan' : 'fans'} can receive this`
  if (audienceType === 'show_attendees') {
    return n ? `${people}` : 'No eligible attendees for this Night.'
  }
  const extra = Number(unavailable) > 0 ? ` · ${unavailable} unavailable` : ''
  return n ? `${people}${extra}` : 'No fans are available for this message yet.'
}

export function composerEmptyCopy({ audienceType, reason, isInbox } = {}) {
  if (reason === 'all_cooling') {
    return {
      heading: isInbox
        ? 'No eligible Faneqo fans are available right now.'
        : 'Everyone eligible was emailed recently.',
      body: isInbox
        ? 'Faneqo Inbox is not waiting on the email cooldown. Try again shortly, or write to a specific fan.'
        : 'Email waits 24 hours before writing the same fan again. You can still send in Faneqo Inbox.',
    }
  }
  if (audienceType === 'show_attendees') {
    return {
      heading: 'No eligible attendees for this Night.',
      body: 'Check-ins from this show are what make this message possible.',
    }
  }
  if (reason === 'no_recipients') {
    return {
      heading: 'No fans are available for this message yet.',
      body: 'When people check in or join your list, they will appear here.',
    }
  }
  return {
    heading: 'Messaging isn’t available right now',
    body: 'Try again in a moment.',
  }
}

export function composerSendLabel({ eligible = 0, testMode = false, audienceType } = {}) {
  const n = Number(eligible) || 0
  if (testMode) {
    return `Send to ${n} ${n === 1 ? 'test recipient' : 'test recipients'}`
  }
  if (audienceType === 'all_fans' && n > 0) return `Send to all fans`
  return `Send to ${n} ${n === 1 ? 'fan' : 'fans'}`
}

export function composerSuccessCopy({ eligible = 0, isInbox = true } = {}) {
  const n = Number(eligible) || 0
  return {
    title: `Sent to ${n} ${n === 1 ? 'person' : 'people'}.`,
    body: isInbox
      ? 'Each fan receives this in their private conversation.'
      : 'Each fan receives this as email from your band.',
  }
}

export function groupComposerGalleries(rows = []) {
  const nights = []
  const general = []
  for (const row of Array.isArray(rows) ? rows : []) {
    if (row?.show || row?.visibility === 'show_attendees') nights.push(row)
    else general.push(row)
  }
  return { nights, general }
}

export function galleryNightLine(gallery = {}) {
  const show = gallery.show || {}
  const date = formatShowNightDate(show.date || show.showStartedAt || '')
  const place = String(show.venue || show.city || '').trim()
  return [date, place].filter(Boolean).join(' · ')
}
