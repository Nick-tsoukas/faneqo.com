/**
 * Persisted Cybered hero framing for Phone and Desktop.
 *
 * layoutConfig.imageFit stays the Recap / Night / share / other-style contract.
 * These helpers are only for BandPageCybered + the artist-page editor.
 */

import {
  DEFAULT_ARTIST_FOCAL_X,
  DEFAULT_ARTIST_FOCAL_Y,
  DEFAULT_ARTIST_ZOOM,
  clampArtistFocalPercent,
  clampArtistZoom,
  getCyberedHeroPhotoStyle,
} from './artistImage.js'

export const CYBERED_HERO_FIT_MODES = ['fill', 'full']

export const CYBERED_HERO_FIT_LABELS = {
  fill: 'Fill frame',
  full: 'Full photo',
}

export function normalizeCyberedHeroFit(value) {
  if (value == null || value === '') return 'fill'
  const mode = String(value).trim().toLowerCase()
  return mode === 'full' ? 'full' : 'fill'
}

export function isCyberedDesktopCropInherited(band) {
  return (
    band?.cyberedDesktopPositionX == null &&
    band?.cyberedDesktopPositionY == null &&
    band?.cyberedDesktopZoom == null
  )
}

function toFiniteNumber(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export function getDefaultCyberedSurfaceFraming() {
  return {
    fit: 'fill',
    positionX: DEFAULT_ARTIST_FOCAL_X,
    positionY: DEFAULT_ARTIST_FOCAL_Y,
    zoom: DEFAULT_ARTIST_ZOOM,
  }
}

export function resetCyberedSurfaceCrop(existing = {}) {
  return {
    fit: normalizeCyberedHeroFit(existing.fit),
    positionX: DEFAULT_ARTIST_FOCAL_X,
    positionY: DEFAULT_ARTIST_FOCAL_Y,
    zoom: DEFAULT_ARTIST_ZOOM,
  }
}

export function resolveCyberedSurfaceFraming(band, surface = 'phone') {
  const phone = {
    fit: normalizeCyberedHeroFit(band?.cyberedMobileFit),
    positionX: toFiniteNumber(band?.cyberedImagePositionX, DEFAULT_ARTIST_FOCAL_X),
    positionY: toFiniteNumber(band?.cyberedImagePositionY, DEFAULT_ARTIST_FOCAL_Y),
    zoom: toFiniteNumber(band?.cyberedImageZoom, DEFAULT_ARTIST_ZOOM),
  }
  if (surface !== 'desktop') return phone

  const inherited = isCyberedDesktopCropInherited(band)
  return {
    fit: normalizeCyberedHeroFit(band?.cyberedDesktopFit),
    positionX: inherited
      ? phone.positionX
      : toFiniteNumber(band?.cyberedDesktopPositionX, phone.positionX),
    positionY: inherited
      ? phone.positionY
      : toFiniteNumber(band?.cyberedDesktopPositionY, phone.positionY),
    zoom: inherited
      ? phone.zoom
      : toFiniteNumber(band?.cyberedDesktopZoom, phone.zoom),
  }
}

export function readCyberedSurfaceFraming(band) {
  return {
    phone: resolveCyberedSurfaceFraming(band, 'phone'),
    desktop: resolveCyberedSurfaceFraming(band, 'desktop'),
    desktopInherited: isCyberedDesktopCropInherited(band),
  }
}

/**
 * Public + editor photo style for one surface.
 * Full photo always renders contain + zoom 1 and leaves stored Fill crop intact.
 */
export function getCyberedSurfacePhotoStyle({
  fit,
  positionX,
  positionY,
  zoom,
} = {}) {
  if (normalizeCyberedHeroFit(fit) === 'full') {
    return {
      objectFit: 'contain',
      objectPosition: '50% 100%',
      transform: 'none',
      transformOrigin: '50% 100%',
    }
  }
  return {
    objectFit: 'cover',
    ...getCyberedHeroPhotoStyle({ positionX, positionY, zoom }),
  }
}

export function getCyberedDesktopPhotoVars(framing) {
  const style = getCyberedSurfacePhotoStyle(framing)
  return {
    '--hero-desk-object-fit': style.objectFit,
    '--hero-desk-object-position': style.objectPosition,
    '--hero-desk-transform': style.transform,
    '--hero-desk-transform-origin': style.transformOrigin,
  }
}

export function clampCyberedSurfaceFraming(next = {}) {
  return {
    fit: normalizeCyberedHeroFit(next.fit),
    positionX: clampArtistFocalPercent(next.positionX),
    positionY: clampArtistFocalPercent(next.positionY),
    zoom: clampArtistZoom(next.zoom),
  }
}

export function buildCyberedFramingSavePayload({
  phone,
  desktop,
  phoneDirty = false,
  desktopDirty = false,
} = {}) {
  const payload = {}
  if (phoneDirty && phone) {
    const next = clampCyberedSurfaceFraming(phone)
    payload.cyberedImagePositionX = Math.round(next.positionX)
    payload.cyberedImagePositionY = Math.round(next.positionY)
    payload.cyberedImageZoom = next.zoom
    payload.cyberedMobileFit = next.fit
  }
  if (desktopDirty && desktop) {
    const next = clampCyberedSurfaceFraming(desktop)
    payload.cyberedDesktopPositionX = Math.round(next.positionX)
    payload.cyberedDesktopPositionY = Math.round(next.positionY)
    payload.cyberedDesktopZoom = next.zoom
    payload.cyberedDesktopFit = next.fit
  }
  return payload
}
