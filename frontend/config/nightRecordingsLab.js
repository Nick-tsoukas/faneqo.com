/**
 * Night Recording lab fixtures. Presentation only — not a second product surface.
 */

const youtube = {
  type: 'youtube',
  resourceType: 'video',
  resourceId: 'dQw4w9WgXcQ',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
}

const spotify = {
  type: 'spotify',
  resourceType: 'track',
  resourceId: '3n3Ppam7vgaVa1iaRUc9Lp',
  url: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
}

export function nightRecordingFixture(partial = {}) {
  return {
    id: 1,
    title: 'Ghost — Live at The Rock',
    caption: '',
    kind: 'video',
    source: 'youtube',
    visibility: 'public',
    status: 'published',
    sortOrder: 0,
    duration: null,
    locked: false,
    lockReason: null,
    youWereThere: false,
    provider: youtube,
    media: null,
    poster: null,
    ...partial,
  }
}

export const nightRecordingLabStates = {
  empty: [],
  youtube: [
    nightRecordingFixture(),
  ],
  spotify: [
    nightRecordingFixture({
      id: 2,
      title: 'The River',
      kind: 'audio',
      source: 'spotify',
      provider: spotify,
    }),
  ],
  audio: [
    nightRecordingFixture({
      id: 3,
      title: 'Ghost — Live at The Rock',
      kind: 'audio',
      source: 'upload',
      duration: 272,
      provider: null,
      media: { id: 11, url: '/__dev/band-profile/video.svg', mime: 'audio/mpeg', type: 'audio' },
    }),
  ],
  video: [
    nightRecordingFixture({
      id: 4,
      title: 'Encore',
      source: 'upload',
      provider: null,
      media: { id: 12, url: '/__dev/band-profile/video.svg', mime: 'video/mp4', type: 'video' },
    }),
  ],
  mixed: [
    nightRecordingFixture({
      id: 5,
      title: 'Ghost — Live at The Rock',
      kind: 'audio',
      source: 'upload',
      duration: 272,
      sortOrder: 0,
      provider: null,
      media: { id: 11, url: '/__dev/band-profile/video.svg', mime: 'audio/mpeg', type: 'audio' },
    }),
    nightRecordingFixture({
      id: 6,
      title: 'The last chorus',
      sortOrder: 1,
    }),
  ],
  many: [
    nightRecordingFixture({ id: 21, title: 'Soundcheck', kind: 'audio', source: 'spotify', provider: spotify, sortOrder: 0 }),
    nightRecordingFixture({ id: 22, title: 'Opener', sortOrder: 1 }),
    nightRecordingFixture({ id: 23, title: 'Main set', sortOrder: 2 }),
    nightRecordingFixture({ id: 24, title: 'Encore one', kind: 'audio', source: 'upload', duration: 184, provider: null, media: { id: 31, url: '/__dev/band-profile/video.svg', mime: 'audio/mpeg', type: 'audio' }, sortOrder: 3 }),
    nightRecordingFixture({ id: 25, title: 'Encore two — the one that went long enough to wrap onto another line', sortOrder: 4 }),
  ],
  locked: [
    nightRecordingFixture({
      id: 7,
      title: 'After the lights',
      kind: 'audio',
      source: 'spotify',
      visibility: 'show_attendees',
      locked: true,
      lockReason: 'show_attendees',
      provider: null,
      media: null,
    }),
  ],
  long: [
    nightRecordingFixture({
      id: 8,
      title: 'The Midnight Revival Orchestra play the song everyone thought they had retired',
      caption: 'This one stayed in the room after the house lights came up.',
    }),
  ],
}

export function nightRecordingLabNight(state = 'mixed') {
  const recordings = nightRecordingLabStates[state] || nightRecordingLabStates.mixed
  return {
    artist: { name: 'Badflower', slug: 'badflower', image: { url: '/__dev/band-profile/art.svg' } },
    night: {
      nightSlug: 'nashville-sep-5',
      title: 'The Moon Show',
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'Tennessee',
      date: '2026-09-05',
      publicStory: 'The room was already loud before we walked on. Thank you for staying until the last note.',
      lineup: [
        { name: 'The Mics', role: 'co_headliner' },
        { name: 'Arrow Head', role: 'co_headliner' },
        { name: 'Badflower', role: 'headliner' },
      ],
      cover: { url: '/__dev/gallery/portrait-crowd.svg', alternativeText: 'Night cover' },
      attendanceCount: 147,
    },
    viewer: { authenticated: true, youWereThere: true, showOrdinal: 2 },
    galleries: [
      {
        slug: 'live-set',
        title: 'From the floor',
        photoCount: 8,
        locked: false,
        media: [
          { url: '/__dev/gallery/portrait-crowd.svg' },
          { url: '/__dev/gallery/landscape-stage.svg' },
        ],
        canonicalPath: '/badflower/gallery/live-set',
      },
    ],
    recordings,
    share: { canonicalPath: '/badflower/night/nashville-sep-5', title: 'Badflower', description: '' },
  }
}
