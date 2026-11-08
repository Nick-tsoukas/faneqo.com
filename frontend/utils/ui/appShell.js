/**
 * Route-owned app shell context.
 *
 * A Fan is also a users-permissions user, so "someone is logged in" must never
 * decide navigation by itself. /fan/* is Fan Mode even when that user also
 * owns an artist page. /fans is artist Fan Intelligence, not Fan Mode.
 */
import { isFanAuthPath, isFaneqoAppPath } from './appSurface.js'
import { isFanSectionPath } from './fanNav.js'

export const APP_SHELL = Object.freeze({
  PUBLIC: 'public',
  ARTIST: 'artist',
  FAN: 'fan',
  FAN_AUTH: 'fan-auth',
})

/**
 * Artist/admin workspaces. Kept separate from isFaneqoAppPath so adding a
 * shell prefix (e.g. /galleries) does not change public-vs-app page chrome.
 */
const ARTIST_SHELL_PREFIXES = [
  '/dashboard',
  '/messages',
  '/fans',
  '/account',
  '/createband',
  '/editband',
  '/analytics',
  '/analyticsqr',
  '/updates',
  '/show-live',
  '/event-analytics',
  '/saved',
  '/galleries',
]

function matchesPrefix(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`)
}

export function resolveAppShellContext(path) {
  if (isFanAuthPath(path)) return APP_SHELL.FAN_AUTH
  if (isFanSectionPath(path)) return APP_SHELL.FAN
  const raw = String(path || '').split('?')[0]
  if (ARTIST_SHELL_PREFIXES.some((prefix) => matchesPrefix(raw, prefix))) {
    return APP_SHELL.ARTIST
  }
  if (isFaneqoAppPath(raw)) return APP_SHELL.ARTIST
  return APP_SHELL.PUBLIC
}

export function isFanShellContext(path) {
  return resolveAppShellContext(path) === APP_SHELL.FAN
}

export function headerLogoTo(path) {
  return resolveAppShellContext(path) === APP_SHELL.FAN ? '/fan' : '/'
}

export function headerSearchCopy(path) {
  const ctx = resolveAppShellContext(path)
  return ctx === APP_SHELL.FAN || ctx === APP_SHELL.FAN_AUTH
    ? 'Search artists'
    : 'Search bands'
}

export function headerLogoutTo(path) {
  return resolveAppShellContext(path) === APP_SHELL.FAN ? '/fan/login' : '/'
}

export function headerShowsArtistAdmin(path) {
  return resolveAppShellContext(path) === APP_SHELL.ARTIST
}

/**
 * Workspace-escape chrome. Route stays PUBLIC; capability may still unlock
 * artist destinations so an artist is never stranded on a public page.
 * /fan/* always wins. hasUser / userSlug alone are not capability.
 */
export function headerShowsArtistWorkspaceNav(
  path,
  { hasArtistWorkspaceAccess = false } = {}
) {
  const ctx = resolveAppShellContext(path)
  if (ctx === APP_SHELL.FAN || ctx === APP_SHELL.FAN_AUTH) return false
  if (ctx === APP_SHELL.ARTIST) return true
  if (ctx === APP_SHELL.PUBLIC) return !!hasArtistWorkspaceAccess
  return false
}

/** Logged-out PUBLIC chrome may keep Home / Signup / Login. */
export function headerShowsPublicGuestNav(path, { hasUser = false } = {}) {
  return resolveAppShellContext(path) === APP_SHELL.PUBLIC && !hasUser
}

/**
 * Logged-in fan on a public page. Header (not the /fan bottom bar) is the
 * way home — Artist Page already owns the Follow / Message / Share dock.
 */
export function headerShowsFanPublicNav(
  path,
  { hasUser = false, hasArtistWorkspaceAccess = false } = {}
) {
  return (
    resolveAppShellContext(path) === APP_SHELL.PUBLIC &&
    !!hasUser &&
    !hasArtistWorkspaceAccess
  )
}

function fanPrimaryLinks() {
  return [
    { to: '/fan', label: 'Artists' },
    { to: '/fan/messages', label: 'Messages' },
    { to: '/fan/passport', label: 'Passport' },
  ]
}

export function headerShowsTemporaryDeckLink(path) {
  const raw = String(path || '').split('?')[0]
  return raw === '/' || raw === '/presentation' || raw === '/deck'
}

function withTemporaryDeckLink(links, path) {
  if (!headerShowsTemporaryDeckLink(path)) return links
  if (links.some((link) => link.to === '/presentation')) return links
  const next = links.slice()
  const homeIndex = next.findIndex((link) => link.to === '/')
  next.splice(homeIndex >= 0 ? homeIndex + 1 : 0, 0, { to: '/presentation', label: 'Presentation' })
  return next
}

export function headerAccountTo(path) {
  return resolveAppShellContext(path) === APP_SHELL.FAN ? '/fan/profile' : '/account'
}

function artistWorkspacePrimaryLinks(slug, { includeGalleriesWithoutSlug = false } = {}) {
  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: (slug || includeGalleriesWithoutSlug) ? '/messages' : '/fan/messages', label: 'Messages' },
  ]
  if (slug) {
    links.push({ to: '/galleries', label: 'Galleries' })
    links.push({ to: `/${slug}`, label: 'Artist Page' })
  } else if (includeGalleriesWithoutSlug) {
    links.push({ to: '/galleries', label: 'Galleries' })
  }
  return links
}

/**
 * Desktop primary text links.
 * userSlug never overrides Fan Mode.
 * hasUser / userSlug never prove artist capability on PUBLIC.
 */
export function headerPrimaryLinks(
  path,
  {
    hasUser = false,
    userSlug = null,
    hasArtistWorkspaceAccess = false,
    artistSlug = null,
  } = {}
) {
  const ctx = resolveAppShellContext(path)
  const workspaceSlug = artistSlug || userSlug

  if (ctx === APP_SHELL.FAN) {
    return fanPrimaryLinks()
  }

  if (ctx === APP_SHELL.FAN_AUTH) {
    if (hasUser) return []
    return [
      { to: '/', label: 'Home' },
      { to: '/fan/login', label: 'Login' },
    ]
  }

  if (ctx === APP_SHELL.PUBLIC) {
    if (!hasUser) {
      return withTemporaryDeckLink([
        { to: '/', label: 'Home' },
        { to: '/signup', label: 'Signup' },
        { to: '/login', label: 'Login' },
      ], path)
    }
    // Fan-only: keep the canonical fan way home. Artist capability still
    // unlocks workspace links so an artist is never stranded.
    if (!hasArtistWorkspaceAccess) return withTemporaryDeckLink(fanPrimaryLinks(), path)
    return withTemporaryDeckLink(
      artistWorkspacePrimaryLinks(workspaceSlug, { includeGalleriesWithoutSlug: true }),
      path
    )
  }

  if (!hasUser) {
    return withTemporaryDeckLink([
      { to: '/', label: 'Home' },
      { to: '/signup', label: 'Signup' },
      { to: '/login', label: 'Login' },
    ], path)
  }

  return withTemporaryDeckLink(artistWorkspacePrimaryLinks(workspaceSlug), path)
}

export function headerPrimaryLabels(path, options) {
  return headerPrimaryLinks(path, options).map((link) => link.label)
}

export function headerForbiddenFanDestinations() {
  return ['/dashboard', '/galleries', '/account', '/saved']
}

/**
 * Universal /login gateway. Default stays Artist / Team.
 * An explicit `as=fan` or a safe /fan redirect opens Fan mode.
 */
export function resolveLoginGatewayMode({ as, redirectIsFan = false } = {}) {
  const requested = String(as || '').toLowerCase()
  if (requested === 'fan') return 'fan'
  if (requested === 'artist' || requested === 'team') return 'artist'
  if (redirectIsFan) return 'fan'
  return 'artist'
}
