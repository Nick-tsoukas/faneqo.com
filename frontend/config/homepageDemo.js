/**
 * Homepage artist phone demo — swap the demo by changing `artistSlug`.
 *
 * Priority: live Strapi artist → optional overrides → safe fallback snapshot.
 * Do not hard-code artist identity inside DemoArtistProfileShowcase.
 */
export const homepageDemoConfig = {
  /** Change this value to swap the homepage demo artist. */
  artistSlug: 'badflower',

  /**
   * Classic homepage carousel. The current homepage feature uses
   * `featuredShowcaseSlugs` instead — one artist at a time.
   */
  showcaseArtistSlugs: [
    'shannontehya',
    'emerge',
    'moondough',
    'andydarling',
    'ashesfall',
  ],

  /**
   * Editorial homepage feature. Live band records win; these snapshots keep
   * the same artists, music, and destinations if the request fails.
   * Order is the on-page order.
   */
  featuredShowcaseSlugs: ['shannontehya', 'moondough', 'emerge'],

  /**
   * Optional homepage-only overrides (shallow-merged onto normalized live data).
   * Use sparingly — prefer fixing the live artist record in Strapi.
   */
  overrides: {
    // Example:
    // bio: 'Shorter marketing bio…',
    // hideModules: ['events'],
    // featuredVideoId: 'wRFLvrBHI0E',

    /**
     * Local frontend hero assets — no Strapi wait.
     * Tall 1000×1500 portrait is used on the Artist Page demo (matches live Cybered).
     * The 2:1 mobile crop is only for short compact/carousel frames.
     * @see public/images/homepage/artists/
     */
    heroImage: '/images/homepage/artists/badflower-hero.webp',
    heroImageMobile: '/images/homepage/artists/badflower-hero-mobile.webp',
    /** Homepage hero crop only — keep faces in frame. Not used on live artist pages. */
    heroObjectPosition: 'center 10%',

    /**
     * Homepage story here is relationship, not payments.
     * Real public profiles keep SupportModule; this marketing demo does not.
     */
    showDemoSupportWhenEmpty: false,
  },
}

/**
 * Photography-first proof fallbacks — approved Faneqo artist assets only.
 * Used when live Strapi slugs fail so /home-v2 never loses the proof section.
 */
/**
 * Homepage proof phones — real YouTube thumbs, never the artist profile photo.
 */
export const SHOWCASE_FEATURED_VIDEOS = {
  andydarling: {
    youtubeId: '9FAxI20zeXI',
    title: 'Never Enough',
    thumbnailUrl: 'https://i.ytimg.com/vi/9FAxI20zeXI/hqdefault.jpg',
    embedUrl: 'https://www.youtube.com/embed/9FAxI20zeXI',
  },
  moondough: {
    youtubeId: 'jpP2JsT6uJA',
    title: 'Have A Nice Trip, See You Next Fall',
    thumbnailUrl: 'https://i.ytimg.com/vi/jpP2JsT6uJA/hqdefault.jpg',
    embedUrl: 'https://www.youtube.com/embed/jpP2JsT6uJA',
  },
  emerge: {
    youtubeId: 'HWZt7B57zcM',
    title: 'What You Want It To Be',
    thumbnailUrl: 'https://i.ytimg.com/vi/HWZt7B57zcM/hqdefault.jpg',
    embedUrl: 'https://www.youtube.com/embed/HWZt7B57zcM',
  },
  shannontehya: {
    youtubeId: 'Hb3hk1ZTL00',
    title: 'Change',
    thumbnailUrl: 'https://i.ytimg.com/vi/Hb3hk1ZTL00/hqdefault.jpg',
    embedUrl: 'https://www.youtube.com/embed/Hb3hk1ZTL00',
  },
  badflower: {
    youtubeId: 'wRFLvrBHI0E',
    title: 'Ghost',
    thumbnailUrl: 'https://i.ytimg.com/vi/wRFLvrBHI0E/hqdefault.jpg',
    embedUrl: 'https://www.youtube.com/embed/wRFLvrBHI0E',
  },
}

export const SHOWCASE_FALLBACK_ARTISTS = [
  {
    slug: 'shannontehya',
    name: 'Shannon Tehya',
    genre: 'Pop',
    bio: 'I’m your favorite pop star’s imaginary friend. Singer, dancer, distributor of chaos, fantasy character. Capital Region, NY.',
    heroImage: 'https://qrcode101.s3.us-east-1.amazonaws.com/a3f241_692a27b6b7f54cc99d9668ba78417271_mv2_e1e00ed0ca.jpg',
    heroObjectPosition: 'center 22%',
    featuredSong: {
      kind: 'spotify',
      title: 'Change',
      artistName: 'Shannon Tehya',
      spotifyUrl: 'https://open.spotify.com/track/0itmNHJBjYAcPiCBfIdQqj',
      thumbnailUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e02718489a9c4e9f044a1683b90',
      type: 'track',
    },
    streaming: [
      { name: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/1UA8UzBqI3rqJPqTXpzrLj' },
      { name: 'appleMusic', label: 'Apple Music', url: 'https://music.apple.com/us/artist/shannon-tehya/1663420689' },
      { name: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/channel/UCXdcV7_1cyzsJpVPuXd1ZLg' },
      { name: 'tidal', label: 'TIDAL', url: 'https://tidal.com/browse/artist/3913625' },
      { name: 'soundcloud', label: 'SoundCloud', url: 'https://soundcloud.com/tehyavining' },
      { name: 'bandcamp', label: 'Bandcamp', url: 'https://shannontehya.bandcamp.com/' },
    ],
    social: [
      { name: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/shannontehya/' },
      { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/shannon.morgello' },
      { name: 'threads', label: 'Threads', url: 'https://www.threads.com/@shannontehya' },
    ],
    fanList: { enabled: true, buttonLabel: 'Join Fan List' },
  },
  {
    slug: 'emerge',
    name: 'Emerge',
    genre: 'Modern Rock',
    bio: 'Heavy modern Rock, bringing the heat from Nashville, Tennessee.',
    heroImage: 'https://qrcode101.s3.us-east-1.amazonaws.com/61651_7df7eb9bab.png',
    heroObjectPosition: 'center 42%',
    featuredSong: {
      kind: 'spotify',
      title: 'Tolerance',
      artistName: 'Emerge',
      spotifyUrl: 'https://open.spotify.com/track/1SmCgcLbRgkiCIflMPPbWm',
      thumbnailUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e021342727ecc708abf866716f6',
      type: 'track',
    },
    streaming: [
      { name: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/5SHHjkQPizgzvEUJuQXD8j' },
      { name: 'appleMusic', label: 'Apple Music', url: 'https://music.apple.com/us/artist/emerge/464793001' },
      { name: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@Emergeofficialmusic' },
    ],
    social: [
      { name: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/emerge_music' },
      { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/emergeofficalmusic' },
    ],
    website: { url: 'https://emergemusic.net/home', label: 'Emerge Official Website' },
    merchUrl: 'https://emergemusic.net/store',
    fanList: { enabled: true, buttonLabel: 'Join Fan List' },
  },
  {
    slug: 'moondough',
    name: 'Moon Dough',
    genre: 'Indie Rock',
    bio: 'Moon Dough is a genre-blending indie rock project known for atmospheric textures, melodic hooks, and emotionally driven songwriting.',
    heroImage: 'https://qrcode101.s3.us-east-1.amazonaws.com/moondoug_6829e46a19.jpg',
    heroObjectPosition: 'center 28%',
    featuredSong: {
      kind: 'spotify',
      title: 'Odd Reasons',
      artistName: 'Moon Dough',
      spotifyUrl: 'https://open.spotify.com/track/1sMEsftN98Ui2ZwowEDF8l',
      thumbnailUrl: 'https://image-cdn-ak.spotifycdn.com/image/ab67616d00001e0217e82c9018b2221a86d2b8f7',
      type: 'track',
    },
    streaming: [
      { name: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/0kRKKlFroEhNFwLkonqTBv' },
      { name: 'bandcamp', label: 'Bandcamp', url: 'https://moondough.bandcamp.com' },
    ],
    social: [
      { name: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/moondoughmusic' },
      { name: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/moondoughmusic' },
    ],
    fanList: { enabled: true, buttonLabel: 'Join Fan List' },
  },
  {
    slug: 'andydarling',
    name: 'AnDy Darling',
    genre: 'Pop Punk, Alternative Pop, Punk',
    bio: 'AnDy Darling is an independent pop-punk artist blending rebellious hooks, sharp humor and Slavic identity.',
    heroImage: 'https://qrcode101.s3.us-east-1.amazonaws.com/andydarling_7d4caf6ff2.webp',
    heroObjectPosition: 'center 22%',
    featuredSong: {
      kind: 'spotify',
      title: 'KGB Daughter',
      artistName: 'AnDy Darling',
      spotifyUrl: 'https://open.spotify.com/track/78NiK4ugrbMdI1p3l8lDbY',
      thumbnailUrl: 'https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e028ad2e4a2e1a2ac8cca313976',
      type: 'track',
    },
    streaming: [
      { name: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/17lHzMGWPIhUW3ikEnoSb5' },
      { name: 'appleMusic', label: 'Apple Music', url: 'https://music.apple.com/us/artist/andy-darling/995923803' },
      { name: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@AndyDarlingAe' },
    ],
    fanList: { enabled: true, buttonLabel: 'Join Fan List' },
  },
  {
    slug: 'badflower',
    name: 'BADFLOWER',
    heroImage: '/images/homepage/artists/badflower-hero.webp',
  },
]

/** Demo-only payment buttons (never used for real Stripe checkout). */
export const DEMO_SUPPORT_BUTTONS = [
  {
    key: 'support_band',
    title: 'Support the Band',
    description: 'Help fuel the music. Every bit counts.',
    enabled: true,
    pricingMode: 'min',
    minAmount: 5,
  },
  {
    key: 'merch_table',
    title: 'Merch Table Payment',
    description: 'Buying merch at the show? Enter your total and pay securely.',
    enabled: true,
    pricingMode: 'min',
    minAmount: 1,
  },
  {
    key: 'pay_entry',
    title: 'Pay Entry',
    description: "Door entry for tonight's show.",
    enabled: true,
    pricingMode: 'min',
    minAmount: 5,
  },
]
