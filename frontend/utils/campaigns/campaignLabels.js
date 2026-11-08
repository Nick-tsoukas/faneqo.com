/**
 * Artist-facing email history labels.
 * Backend status / audienceType values stay unchanged.
 */

import {
  sentAudienceLine,
  sentMetaLine,
  sentRowTitle,
  sentStatusLabel,
} from '../messages/sentPresentation.js'

function normalizeAudienceWords(label) {
  return String(label || '')
    .replace(/\bAll Fans\b/g, 'All fans')
    .replace(/\bShow Attendees\b/g, 'Show attendees')
}

export function formatCampaignStatusLabel(status) {
  return sentStatusLabel(status)
}

export function formatCampaignAudienceLabel(campaign) {
  if (!campaign) return 'Audience'
  if (campaign.audienceLabel) {
    const label = normalizeAudienceWords(campaign.audienceLabel)
    if (campaign.audienceDetail) return `${label} · ${campaign.audienceDetail}`
    return label
  }
  if (campaign.audienceType === 'show_attendees') {
    const detail = campaign.audienceDetail || campaign.show?.venue || campaign.show?.city
    return detail ? `Show attendees · ${detail}` : 'Show attendees'
  }
  if (campaign.audienceType === 'all_fans') return 'All fans'
  return campaign.audienceType || 'Audience'
}

const CHANNEL_LABELS = {
  in_app: 'Faneqo Inbox',
  email: 'Email',
}

export function formatCampaignChannelLabel(campaign) {
  return CHANNEL_LABELS[campaign?.channel] || CHANNEL_LABELS.email
}

export function formatFanCount(count) {
  const n = Number(count)
  if (!Number.isFinite(n) || n < 0) return ''
  return `${n} ${n === 1 ? 'fan' : 'fans'}`
}

/**
 * History rows lead with the message, Gallery, or audience — never a generic
 * "Inbox message" placeholder when better content exists.
 */
export function formatCampaignRowTitle(campaign) {
  return sentRowTitle(campaign)
}

/** Night / audience line, e.g. "The Rock · Sep 7". */
export function formatCampaignShowLine(campaign) {
  if (campaign?.audienceType !== 'show_attendees') return ''
  return sentAudienceLine(campaign)
}

/** Quiet reach facts, e.g. "18 people · Faneqo Inbox · 8 photos". */
export function formatCampaignReachLine(campaign) {
  return sentMetaLine(campaign)
}

export function formatCampaignAudienceLine(campaign) {
  const base = formatCampaignAudienceLabel(campaign)
  if (/\brecipient/.test(base)) return base
  const n = Number(campaign?.recipientCount)
  if (!Number.isFinite(n) || n < 0) return base
  return `${base} · ${n} ${n === 1 ? 'recipient' : 'recipients'}`
}
