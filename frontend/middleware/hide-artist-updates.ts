// Legacy Artist Updates admin hubs stay hidden.
// /{bandSlug}/updates/{slug} is the durable gallery viewer and must stay reachable.
import { hideArtistUpdatesRedirect } from '~/utils/updates/hideArtistUpdatesPath'

export default defineNuxtRouteMiddleware((to) => {
  const dest = hideArtistUpdatesRedirect(to.path)
  if (dest) return navigateTo(dest)
})
