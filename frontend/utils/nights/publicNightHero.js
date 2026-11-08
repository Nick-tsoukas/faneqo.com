/**
 * Public Night opening image. Same conceptual hero as artist Show Recap:
 * night.hero ?? artist.image
 * Night Photo (cover) and Event artwork are never hero fallbacks.
 */

import { samePublicImageUrl } from './nightDisplay.js'

function text(value) {
  return String(value || '').trim()
}

export function clampPublicNightFocal(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0 || n > 100) return 50
  return n
}

export function publicNightHeroUrl(night) {
  return text(night?.hero?.url)
}

export function resolvePublicNightHero(payload = {}) {
  const night = payload.night || {}
  const artist = payload.artist || {}
  const heroUrl = publicNightHeroUrl(night)
  const artistUrl = text(artist.image?.url)
  const eventUrl = text(night.eventImage?.url)
  const coverUrl = text(night.cover?.url)
  const backdropUrl = heroUrl || artistUrl
  const source = heroUrl ? 'night-hero' : (artistUrl ? 'artist' : 'none')
  const showEvent = Boolean(eventUrl) && !samePublicImageUrl(eventUrl, backdropUrl)
  const showCover = Boolean(coverUrl)
    && !samePublicImageUrl(coverUrl, backdropUrl)
    && !samePublicImageUrl(coverUrl, eventUrl)
  return {
    source,
    backdropUrl,
    artistUrl,
    eventUrl: showEvent ? eventUrl : '',
    coverUrl: showCover ? coverUrl : '',
    heroFocalX: clampPublicNightFocal(night.heroFocalX),
    heroFocalY: clampPublicNightFocal(night.heroFocalY),
    hasNightHero: Boolean(heroUrl),
  }
}

export function mergePublicNightRefresh(prev, next) {
  if (!next?.night) return prev || next
  const night = { ...next.night }
  if (!Object.prototype.hasOwnProperty.call(next.night, 'hero') && prev?.night) {
    night.hero = prev.night.hero
    if (!Object.prototype.hasOwnProperty.call(next.night, 'heroFocalX')) {
      night.heroFocalX = prev.night.heroFocalX
    }
    if (!Object.prototype.hasOwnProperty.call(next.night, 'heroFocalY')) {
      night.heroFocalY = prev.night.heroFocalY
    }
  }
  return { ...next, night }
}
