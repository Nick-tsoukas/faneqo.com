/**
 * LOCAL DEV ONLY — fake Cybered artist for visual testing.
 * Loaded exclusively behind `import.meta.dev`. Never write this to Strapi.
 */

export const FANEQO_TEST_BAND_SLUG = 'faneqo-test-band'

/** Existing local tall portrait (1000×1500) — exercises the Cybered `deep` cap. */
export const FANEQO_TEST_BAND_HERO_URL = '/images/homepage/artists/badflower-hero.webp'
export const FANEQO_TEST_BAND_HERO_WIDTH = 1000
export const FANEQO_TEST_BAND_HERO_HEIGHT = 1500

export function isFaneqoTestBandSlug(slug) {
  return String(slug || '').toLowerCase() === FANEQO_TEST_BAND_SLUG
}

export function getFaneqoTestBandPayload() {
  return {
    data: {
      id: 'dev-faneqo-test-band',
      name: 'Faneqo Test Band',
      slug: FANEQO_TEST_BAND_SLUG,
      pageStyle: 'smartlink',
      genre: 'Alt Rock',
      bio: 'Local-only Cybered fixture for hero sizing, name overlap, and Featured Music spacing. Not a real artist.',
      bandImg: {
        url: FANEQO_TEST_BAND_HERO_URL,
        width: FANEQO_TEST_BAND_HERO_WIDTH,
        height: FANEQO_TEST_BAND_HERO_HEIGHT,
        alternativeText: 'Faneqo Test Band tall portrait',
        mime: 'image/webp',
      },
      cyberedImagePositionX: 48,
      cyberedImagePositionY: 22,
      cyberedImageZoom: 1.06,
      singlesong: {
        title: 'Neon Static',
        isEmbed: false,
        song: { url: '/dev/faneqo-test-band/featured.wav' },
        cover: { url: FANEQO_TEST_BAND_HERO_URL },
      },
      singlevideo: {
        title: 'Neon Static (Official Video)',
        youtubeid: 'aqz-KE-bpKQ',
      },
      spotify: 'https://example.com/faneqo-test-band/spotify',
      appleMusic: 'https://example.com/faneqo-test-band/apple-music',
      youtube: 'https://example.com/faneqo-test-band/youtube',
      instagram: 'https://example.com/faneqo-test-band/instagram',
      tiktok: 'https://example.com/faneqo-test-band/tiktok',
      twitter: 'https://example.com/faneqo-test-band/twitter',
      website: 'https://example.com/faneqo-test-band',
      customButtons: [
        {
          id: 'dev-test-tour',
          title: 'Tour dates',
          subtitle: 'Example link',
          url: 'https://example.com/faneqo-test-band/tour',
        },
        {
          id: 'dev-test-merch',
          title: 'Merch',
          subtitle: 'Example link',
          url: 'https://example.com/faneqo-test-band/merch',
        },
      ],
      fanCaptureEnabled: false,
      paymentsEnabled: false,
      stripeOnboardingComplete: false,
      isDevFixture: true,
    },
  }
}
