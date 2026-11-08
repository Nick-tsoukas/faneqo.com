import YourBandDeservesMore from './YourBandDeservesMore.vue'
import StopRentingYourAudience from './StopRentingYourAudience.vue'
import YourEntireMusicWorld from './YourEntireMusicWorld.vue'
import StillUsingABasicLinkInBio from './StillUsingABasicLinkInBio.vue'
import ArtistSpotlightBadflower from './ArtistSpotlightBadflower.vue'

const adComponents = {
  'your-band-deserves-more': YourBandDeservesMore,
  'stop-renting-your-audience': StopRentingYourAudience,
  'your-entire-music-world': YourEntireMusicWorld,
  'still-using-a-basic-link-in-bio': StillUsingABasicLinkInBio,
  'artist-spotlight': ArtistSpotlightBadflower,
}

export function adComponentFor(slug) {
  return adComponents[slug] || null
}
