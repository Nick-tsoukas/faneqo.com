/**
 * Artist Show Recap presentation. Same ShowRecap as public Night.
 * Does not invent slugs, attendance, or galleries.
 */

function text(value) {
  return String(value || '').trim()
}

function idOf(value) {
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? String(n) : ''
}

const ROLE_LABELS = {
  headliner: 'Headliner',
  co_headliner: 'Co-headliner',
  direct_support: 'Direct support',
  support: 'Support',
  opener: 'Opener',
  guest: 'Guest',
  other: 'Other',
}

export const LINEUP_ROLE_OPTIONS = [
  { value: 'headliner', label: 'Headliner' },
  { value: 'co_headliner', label: 'Co-headliner' },
  { value: 'direct_support', label: 'Direct support' },
  { value: 'support', label: 'Support' },
  { value: 'opener', label: 'Opener' },
  { value: 'guest', label: 'Guest' },
  { value: 'other', label: 'Other' },
]

export function lineupRoleLabel(role) {
  const key = text(role).toLowerCase().replace(/[\s-]+/g, '_')
  return ROLE_LABELS[key] || text(role)
}

const BILLING_TIER = {
  headliner: 'top',
  co_headliner: 'top',
  direct_support: 'mid',
  support: 'support',
  opener: 'support',
  guest: 'support',
  other: 'support',
}

export function lineupBillingTier(role) {
  const key = text(role).toLowerCase().replace(/[\s-]+/g, '_')
  return BILLING_TIER[key] || 'support'
}

export function galleryAudienceLabel(visibility) {
  if (visibility === 'show_attendees') return 'People who were there'
  if (visibility === 'fan_list') return 'Fans'
  return 'Public'
}

function mediaUrl(node) {
  if (!node) return ''
  if (typeof node === 'string') return text(node)
  return text(node.url || node.formats?.large?.url || node.formats?.medium?.url)
}

function clampFocal(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100) return 50
  return n
}

function mediaNode(value) {
  if (!value || typeof value !== 'object') return null
  return value
}

export function recapNightCoverUrl(recap) {
  const cover = recap?.coverImage && typeof recap.coverImage === 'object'
    ? recap.coverImage
    : recap?.cover
  return mediaUrl(cover)
}

export function recapNightHeroMedia(recap) {
  return mediaNode(recap?.heroImage) || mediaNode(recap?.hero)
}

export function recapNightHeroUrl(recap) {
  return mediaUrl(recapNightHeroMedia(recap))
}

export function recapNightHeroFocal(recap) {
  return {
    x: clampFocal(recap?.heroFocalX),
    y: clampFocal(recap?.heroFocalY),
  }
}

export function recapCoverUrl(recap) {
  return recapNightCoverUrl(recap)
}

export function recapEventArtworkUrl(recap) {
  const fromEvent = mediaUrl(recap?.event?.image || recap?.eventImage) || text(recap?.eventImageUrl)
  if (fromEvent) return fromEvent
  if (recapNightCoverUrl(recap)) return ''
  return text(recap?.showCoverUrl)
}

export function recapArtistImageUrl(recap, artistImage) {
  const band = recap?.band
  return text(artistImage)
    || mediaUrl(band?.bandImg)
    || mediaUrl(band?.image)
    || text(band?.imageUrl)
}

export function recapNightImageUrl(recap) {
  return recapNightCoverUrl(recap)
}

export function recapHeroUrl(recap, artistImage) {
  return recapNightCoverUrl(recap) || recapEventArtworkUrl(recap) || recapArtistImageUrl(recap, artistImage)
}

export function recapHeroPlan(recap, artistImage) {
  const artistUrl = recapArtistImageUrl(recap, artistImage)
  const eventUrl = recapEventArtworkUrl(recap)
  const nightUrl = recapNightCoverUrl(recap)
  const heroUrl = recapNightHeroUrl(recap)
  const focal = recapNightHeroFocal(recap)
  const backdropUrl = heroUrl || artistUrl
  const source = heroUrl ? 'night-hero' : (artistUrl ? 'artist' : 'none')
  let mode = 'type'
  if (backdropUrl && eventUrl) mode = 'artist-event'
  else if (backdropUrl) mode = 'artist'
  else if (eventUrl) mode = 'event'
  return {
    mode,
    source,
    artistUrl,
    eventUrl,
    nightUrl,
    heroUrl,
    backdropUrl,
    heroFocalX: focal.x,
    heroFocalY: focal.y,
    artistIsAtmosphere: Boolean(artistUrl) && !heroUrl,
    hasArtwork: Boolean(eventUrl),
    hasMemory: Boolean(nightUrl),
    hasNightHero: Boolean(heroUrl),
  }
}

export function recapPlaceLine({ venue, city, includeVenue = true } = {}) {
  return [includeVenue ? text(venue) : '', text(city)].filter(Boolean).join(' · ')
}

export function galleriesForRecap(items, recap) {
  const list = Array.isArray(items) ? items : []
  const recapId = idOf(recap?.id)
  const campaignId = text(recap?.campaignId)
  if (!recapId && !campaignId) return []
  return list.filter((row) => {
    if (row?.status && row.status !== 'published') return false
    const rowRecap = idOf(row?.showRecapId || row?.show?.showRecapId || row?.showRecap?.id)
    if (recapId && rowRecap === recapId) return true
    const rowCampaign = text(row?.showCampaignId || row?.campaignId || row?.showRecap?.campaignId)
    return !!(campaignId && rowCampaign && rowCampaign === campaignId)
  })
}

export function galleryPreviewUrl(gallery, fallbackUrl) {
  const first = Array.isArray(gallery?.media) ? gallery.media[0] : null
  return first?.url || first?.largeUrl || first?.thumbnailUrl || fallbackUrl || ''
}

export function mergeArtistNight(recap, night) {
  if (!recap) return recap
  if (!night) return recap
  return {
    ...recap,
    publicStory: night.publicStory ?? recap.publicStory,
    privateArtistNote: Object.prototype.hasOwnProperty.call(night, 'privateArtistNote')
      ? night.privateArtistNote
      : recap.privateArtistNote,
    lineup: Array.isArray(night.lineup) ? night.lineup : recap.lineup,
    nightSlug: night.nightSlug || recap.nightSlug,
    coverImage: Object.prototype.hasOwnProperty.call(night, 'cover') ? night.cover : recap.coverImage,
    showCoverUrl: Object.prototype.hasOwnProperty.call(night, 'cover')
      ? (night.cover?.url || '')
      : recap.showCoverUrl,
    cover: Object.prototype.hasOwnProperty.call(night, 'cover') ? night.cover : recap.cover,
    hero: Object.prototype.hasOwnProperty.call(night, 'hero') ? night.hero : recap.hero,
    heroImage: Object.prototype.hasOwnProperty.call(night, 'hero')
      ? night.hero
      : (Object.prototype.hasOwnProperty.call(night, 'heroImage') ? night.heroImage : recap.heroImage),
    heroFocalX: Object.prototype.hasOwnProperty.call(night, 'heroFocalX') ? night.heroFocalX : recap.heroFocalX,
    heroFocalY: Object.prototype.hasOwnProperty.call(night, 'heroFocalY') ? night.heroFocalY : recap.heroFocalY,
  }
}

export function recapIdentityLine({ venue, city, date, includeVenue = true } = {}) {
  return [includeVenue ? text(venue) : '', text(city), text(date)].filter(Boolean).join(' · ')
}

export function recapStatStrip({ checkedIn, newFans, interactions } = {}) {
  const there = Number(checkedIn) || 0
  const fresh = Number(newFans) || 0
  const acts = Number(interactions) || 0
  if (there <= 0 && fresh <= 0 && acts <= 0) return []
  return [
    { value: there, label: there === 1 ? 'was there' : 'were there' },
    { value: fresh, label: fresh === 1 ? 'new fan' : 'new fans' },
    { value: acts, label: acts === 1 ? 'interaction' : 'interactions' },
  ]
}

export function recapSummaryLine({ checkedIn, newFans, returning } = {}) {
  const there = Number(checkedIn) || 0
  const fresh = Number(newFans) || 0
  const back = Number(returning) || 0
  if (there <= 0 && fresh <= 0 && back <= 0) return ''
  const parts = []
  if (there === 1) parts.push('1 was there')
  else if (there > 0) parts.push(`${there} were there`)
  if (fresh > 0) parts.push(`${fresh} new`)
  if (back > 0) parts.push(`${back} returning`)
  return parts.join(' · ')
}
