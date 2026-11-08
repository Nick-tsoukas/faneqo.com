import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist.js'

/** First Artist Spotlight instance. The template does not know this artist. */
export const artistSpotlightBadflower = {
  seriesLabel: 'Faneqo presents',
  headlineTop: 'Artist',
  headlineAccent: 'Spotlight',
  artistName: FALLBACK_SNAPSHOT.name,
  artistDescription: 'Los Angeles rock. Raw songs about mental health, identity, and modern life.',
  heroImage: FALLBACK_SNAPSHOT.heroImage,
  heroPosition: FALLBACK_SNAPSHOT.heroObjectPosition || 'center 10%',
  productLabel: 'Featured song',
  songTitle: FALLBACK_SNAPSHOT.featuredSong?.title || 'Ghost',
  songArt: '/images/ads/badflower/ok-im-sick.jpg',
  primaryBadgeText: 'Live on Faneqo',
  footerCTA: 'Discover more artists',
  footerWebsite: 'faneqo.com',
}
