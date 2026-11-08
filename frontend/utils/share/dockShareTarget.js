/**
 * Mobile dock Share target.
 *
 * Workspace navigation and public sharing are different questions.
 * A public route slug, when present, is the only artist this drawer may share.
 * The signed-in band is used only when no public artist route is on screen,
 * and only for branding when it is the same slug as that route.
 */

import { artistSharePath } from './artistShareQr.js'
import { WORKSPACE_MODE } from '../ui/artistWorkspace.js'

export function readRouteBandSlug(param) {
  const value = Array.isArray(param) ? param[0] : param
  return String(value ?? '').trim()
}

export function sameArtistSlug(a, b) {
  const left = artistSharePath(a).replace(/^\//, '').toLowerCase()
  const right = artistSharePath(b).replace(/^\//, '').toLowerCase()
  return Boolean(left) && left === right
}

function cleanImage(value) {
  if (typeof value !== 'string') return null
  const image = value.trim()
  return image || null
}

function cleanName(value) {
  return String(value || '').trim()
}

function identityFrom(band) {
  if (!band?.slug || !artistSharePath(band.slug)) return null
  return {
    slug: artistSharePath(band.slug).slice(1),
    name: cleanName(band.name),
    profileImage: cleanImage(band.profileImage),
  }
}

/**
 * What the artist page (or gallery) may publish for dock branding.
 * A loaded band is applied only when its slug is the route slug.
 * Otherwise the route slug is shared with no name and no image.
 * Returns null when the route is not a shareable public artist.
 */
export function publicArtistShareRecord({ routeSlug, loaded } = {}) {
  const route = readRouteBandSlug(routeSlug)
  if (!route || !artistSharePath(route)) return null
  const loadedIdentity = identityFrom(loaded)
  const aligned = loadedIdentity && sameArtistSlug(loadedIdentity.slug, route)
  return {
    slug: aligned ? loadedIdentity.slug : artistSharePath(route).slice(1).toLowerCase(),
    name: aligned ? loadedIdentity.name : '',
    profileImage: aligned ? loadedIdentity.profileImage : null,
  }
}

/**
 * Workspace share band. An active single or scoped band wins.
 * Several bands and no validated choice keep the dock's existing band
 * rather than guessing. Branding from that existing band is kept only
 * when it is the same artist.
 */
export function resolveWorkspaceShareBand({ active = null, mode = '', legacyBand = null } = {}) {
  const reliable = (mode === WORKSPACE_MODE.SINGLE || mode === WORKSPACE_MODE.SCOPED)
    ? identityFrom(active)
    : null
  const legacy = identityFrom(legacyBand)
  if (reliable) {
    const same = legacy && sameArtistSlug(legacy.slug, reliable.slug)
    return {
      slug: reliable.slug,
      name: reliable.name || (same ? legacy.name : ''),
      profileImage: same ? legacy.profileImage : null,
    }
  }
  return legacy
}

function unavailable() {
  return {
    available: false,
    context: 'unavailable',
    slug: '',
    name: '',
    profileImage: null,
  }
}

function present(context, slug, name, profileImage) {
  return {
    available: Boolean(artistSharePath(slug)),
    context,
    slug: artistSharePath(slug).slice(1),
    name: cleanName(name),
    profileImage: cleanImage(profileImage),
  }
}

/**
 * Dock Share identity.
 * A public artist param always wins, including when its slug is not shareable
 * (sharing stays off — the workspace band is not a substitute).
 * With no public param, the workspace share band is used.
 */
export function resolveDockShareTarget({
  routeSlug = '',
  publicArtist = null,
  workspace = null,
} = {}) {
  const route = readRouteBandSlug(routeSlug)
  if (route) {
    const record = publicArtistShareRecord({
      routeSlug: route,
      loaded: publicArtist,
    })
    if (!record) return unavailable()
    const workspaceMatch = identityFrom(workspace)
    const sameWorkspace = workspaceMatch && sameArtistSlug(workspaceMatch.slug, record.slug)
    return present(
      'public',
      record.slug,
      record.name || (sameWorkspace ? workspaceMatch.name : ''),
      record.profileImage || (sameWorkspace ? workspaceMatch.profileImage : null),
    )
  }

  const workspaceIdentity = identityFrom(workspace)
  if (!workspaceIdentity) return unavailable()
  return present(
    'workspace',
    workspaceIdentity.slug,
    workspaceIdentity.name,
    workspaceIdentity.profileImage,
  )
}

/** True when the artist being shared changed and an open drawer must close. */
export function shareTargetChanged(previousSlug, nextSlug) {
  return String(previousSlug || '') !== String(nextSlug || '')
}
