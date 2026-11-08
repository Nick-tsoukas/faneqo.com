/**
 * The few band fields an artist page's <head> needs (title, description,
 * preview image version), small enough to fetch during server rendering so
 * link previews and crawlers see the artist's name instead of the URL slug.
 */

export function pickArtistHeadFields(payload) {
  const d = payload?.data?.attributes || payload?.data || null
  if (!d || typeof d !== 'object' || !d.name) return null
  const str = (v) => (typeof v === 'string' ? v : '')
  return {
    name: str(d.name),
    bio: str(d.description) || str(d.bio),
    genre: str(d.genre) || str(d.genres),
    location: str(d.location) || str(d.hometown) || str(d.city),
    updatedAt: str(d.updatedAt),
  }
}
