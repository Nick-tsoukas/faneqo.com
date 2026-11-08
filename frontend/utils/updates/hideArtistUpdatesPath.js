/**
 * Hide the legacy Artist Updates admin hubs only.
 * The durable public gallery is /{bandSlug}/gallery/{slug}.
 * Legacy /{bandSlug}/updates/{slug} stays reachable and redirects there.
 */

export function hideArtistUpdatesRedirect(path) {
  const clean = String(path || '').split('?')[0]
  if (clean === '/updates' || clean.startsWith('/updates/')) {
    return '/dashboard'
  }
  return null
}
