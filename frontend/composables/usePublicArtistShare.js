/**
 * Branding for the public artist currently on screen.
 * The dock reads this. It never treats the value as authority:
 * resolveDockShareTarget drops it unless the slug matches the route.
 */

import { artistSharePath } from '~/utils/share/artistShareQr'

export const PUBLIC_ARTIST_SHARE_KEY = 'faneqo-public-artist-share'

export function usePublicArtistShare() {
  const artist = useState(PUBLIC_ARTIST_SHARE_KEY, () => null)

  function publish(next) {
    const slug = String(next?.slug || '').trim()
    if (!artistSharePath(slug)) {
      return
    }
    const name = String(next?.name || '').trim()
    const image = typeof next?.profileImage === 'string' ? next.profileImage.trim() : ''
    artist.value = {
      slug,
      name,
      profileImage: image || null,
    }
  }

  return { artist, publish }
}
