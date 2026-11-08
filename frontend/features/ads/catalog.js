export const adsCatalog = [
  {
    slug: 'your-band-deserves-more',
    title: 'Your Band Deserves More',
    formats: ['story'],
    kind: 'Motion / Deck',
    sceneCount: 3,
  },
  {
    slug: 'stop-renting-your-audience',
    title: 'Stop Renting Your Audience',
    formats: ['feed', 'story'],
    kind: 'Static / Image',
    sceneCount: 1,
  },
  {
    slug: 'your-entire-music-world',
    title: 'Your Entire Music World',
    subject: 'badflower',
    formats: ['feed', 'story'],
    kind: 'Static / Image',
    sceneCount: 1,
  },
  {
    slug: 'still-using-a-basic-link-in-bio',
    title: 'Still Using a Basic Link in Bio?',
    formats: ['feed', 'story'],
    kind: 'Static / Image',
    sceneCount: 1,
  },
  {
    slug: 'artist-spotlight',
    title: 'Artist Spotlight',
    subject: 'badflower',
    formats: ['post', 'feed', 'story'],
    kind: 'Static / Image',
    sceneCount: 1,
  },
]

export function findAd(slug) {
  return adsCatalog.find((ad) => ad.slug === slug) || null
}
