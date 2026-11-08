/**
 * Demo bands for the /demo experience
 * These are fictional bands with realistic data for showcasing MBQ features
 */

export const demoBands = [
  {
    id: 'neon-avenue',
    name: 'Neon Avenue',
    slug: 'neon-avenue',
    bio: 'Indie pop for night drives and neon signs.',
    biotagline: 'New single out now — tap play below.',
    genre: 'Indie Pop',
    imageUrl: '/demo/neon-avenue.jpg',
    color: '#8B5CF6',
    links: {
      spotify: 'https://open.spotify.com/artist/demo',
      appleMusic: 'https://music.apple.com/artist/demo',
      youtube: 'https://youtube.com/@neonavenue',
      instagram: 'https://instagram.com/neonavenue',
      tiktok: 'https://tiktok.com/@neonavenue',
      twitter: 'https://twitter.com/neonavenue',
      website: 'https://neonavenue.com',
    },
    featuredSong: {
      title: 'Midnight Drive',
      duration: '3:42',
      audioUrl: '/demo/midnight-drive.mp3',
    },
    featuredVideo: {
      title: 'Midnight Drive (Official Video)',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnail: '/demo/neon-avenue-video.jpg',
    },
    upcomingEvents: [
      { city: 'Los Angeles', state: 'CA', venue: 'The Troubadour', date: '2026-02-15' },
      { city: 'San Francisco', state: 'CA', venue: 'The Fillmore', date: '2026-02-18' },
      { city: 'Portland', state: 'OR', venue: 'Crystal Ballroom', date: '2026-02-20' },
    ],
  },
  {
    id: 'steel-horizon',
    name: 'Steel Horizon',
    slug: 'steel-horizon',
    bio: 'Hard rock with heart. Arena-ready anthems.',
    biotagline: 'Tour dates just announced.',
    genre: 'Hard Rock',
    imageUrl: '/demo/steel-horizon.jpg',
    color: '#EF4444',
    links: {
      spotify: 'https://open.spotify.com/artist/demo2',
      appleMusic: 'https://music.apple.com/artist/demo2',
      youtube: 'https://youtube.com/@steelhorizon',
      instagram: 'https://instagram.com/steelhorizon',
      tiktok: 'https://tiktok.com/@steelhorizon',
      twitter: 'https://twitter.com/steelhorizon',
      website: 'https://steelhorizon.com',
    },
    featuredSong: {
      title: 'Thunder Road',
      duration: '4:18',
      audioUrl: '/demo/thunder-road.mp3',
    },
    featuredVideo: {
      title: 'Thunder Road (Live)',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnail: '/demo/steel-horizon-video.jpg',
    },
    upcomingEvents: [
      { city: 'Chicago', state: 'IL', venue: 'House of Blues', date: '2026-03-01' },
      { city: 'Detroit', state: 'MI', venue: 'The Fillmore Detroit', date: '2026-03-03' },
      { city: 'Cleveland', state: 'OH', venue: 'House of Blues Cleveland', date: '2026-03-05' },
    ],
  },
  {
    id: 'luna-wave',
    name: 'Luna Wave',
    slug: 'luna-wave',
    bio: 'Dreamy synths meet lo-fi beats.',
    biotagline: 'Stream the new EP everywhere.',
    genre: 'Electronic / Lo-Fi',
    imageUrl: '/demo/luna-wave.jpg',
    color: '#06B6D4',
    links: {
      spotify: 'https://open.spotify.com/artist/demo3',
      appleMusic: 'https://music.apple.com/artist/demo3',
      youtube: 'https://youtube.com/@lunawave',
      instagram: 'https://instagram.com/lunawave',
      tiktok: 'https://tiktok.com/@lunawave',
      soundcloud: 'https://soundcloud.com/lunawave',
      website: 'https://lunawave.io',
    },
    featuredSong: {
      title: 'Starlight Fade',
      duration: '3:56',
      audioUrl: '/demo/starlight-fade.mp3',
    },
    featuredVideo: {
      title: 'Starlight Fade (Visualizer)',
      youtubeId: 'dQw4w9WgXcQ',
      thumbnail: '/demo/luna-wave-video.jpg',
    },
    upcomingEvents: [
      { city: 'Austin', state: 'TX', venue: 'Mohawk', date: '2026-03-10' },
      { city: 'Dallas', state: 'TX', venue: 'Trees', date: '2026-03-12' },
      { city: 'Houston', state: 'TX', venue: 'White Oak Music Hall', date: '2026-03-14' },
    ],
  },
]

export const defaultDemoBand = demoBands[0]
