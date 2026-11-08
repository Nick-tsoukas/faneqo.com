/**
 * Local band-profile design lab fixture.
 *
 * Fake data only. Never loaded in production routes.
 * Add future states here (long name, missing image, many links, etc.).
 */

export const BAND_PROFILE_LAB_VARIANT = 'polish-test'

export const BAND_PROFILE_LAB_SILENT_AUDIO =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'

export const neonStaticBandFixture = {
  id: 'lab-neon-static',
  slug: 'neon-static',
  name: 'NEON STATIC',
  genre: 'Alternative Rock, Indie Rock',
  bio: 'Los Angeles four-piece writing taut, nocturnal rock about distance, voltage, and the rooms that keep you honest. After Midnight is the sound of the last light still on.',
  biotagline: '',
  isBandNameInLogo: false,
  fanCaptureEnabled: true,
  fanCaptureHeadline: '',
  fanCaptureMessage: '',
  fanCaptureButtonLabel: '',
  fanCaptureSuccessMessage: '',
  officialMerchUrl: 'https://example.com/neon-static-merch',
  cyberedImagePositionX: 50,
  cyberedImagePositionY: 42,
  cyberedImageZoom: 1,
  bandImg: {
    url: '/__dev/band-profile/hero.svg',
    width: 1600,
    height: 1000,
  },
  singlesong: {
    title: 'After Midnight',
    isEmbed: false,
    cover: { url: '/__dev/band-profile/art.svg' },
    song: { url: BAND_PROFILE_LAB_SILENT_AUDIO },
  },
  singlevideo: {
    title: 'After Midnight',
    thumbnailUrl: '/__dev/band-profile/video.svg',
  },
  youtube: 'https://www.youtube.com/@neonstatic',
  spotify: 'https://open.spotify.com/artist/neonstatic',
  appleMusic: 'https://music.apple.com/us/artist/neon-static',
  amazonMusic: 'https://music.amazon.com/artists/neon-static',
  facebook: 'https://www.facebook.com/neonstatic',
  instagram: 'https://www.instagram.com/neonstatic',
  twitter: 'https://x.com/neonstatic',
  tiktok: 'https://www.tiktok.com/@neonstatic',
  discord: 'https://discord.gg/neonstatic',
}

export const neonStaticFanCaptureCopy = {
  headline: "Join NEON STATIC's fan list",
  message: 'Get show updates, new music, and messages directly from the band.',
  buttonLabel: 'Join Fan List',
  successMessage: "You're on the list.",
}
