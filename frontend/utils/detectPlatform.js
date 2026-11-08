/**
 * Platform Detection Utility
 * Auto-detects platform from URL and returns icon/label info
 */

const PLATFORM_CONFIG = {
  youtube: {
    pattern: /youtube\.com|youtu\.be/i,
    label: 'YouTube',
    iconify: 'mdi:youtube',
  },
  spotify: {
    pattern: /spotify\.com/i,
    label: 'Spotify',
    iconify: 'mdi:spotify',
  },
  appleMusic: {
    pattern: /music\.apple\.com/i,
    label: 'Apple Music',
    iconify: 'simple-icons:applemusic',
  },
  soundcloud: {
    pattern: /soundcloud\.com/i,
    label: 'SoundCloud',
    iconify: 'mdi:soundcloud',
  },
  bandcamp: {
    pattern: /bandcamp\.com/i,
    label: 'Bandcamp',
    iconify: 'simple-icons:bandcamp',
  },
  instagram: {
    pattern: /instagram\.com/i,
    label: 'Instagram',
    iconify: 'mdi:instagram',
  },
  tiktok: {
    pattern: /tiktok\.com/i,
    label: 'TikTok',
    iconify: 'ic:baseline-tiktok',
  },
  facebook: {
    pattern: /facebook\.com/i,
    label: 'Facebook',
    iconify: 'mdi:facebook',
  },
  twitter: {
    pattern: /twitter\.com|x\.com/i,
    label: 'X / Twitter',
    iconify: 'ri:twitter-x-fill',
  },
  patreon: {
    pattern: /patreon\.com/i,
    label: 'Patreon',
    iconify: 'simple-icons:patreon',
  },
  discord: {
    pattern: /discord\.gg|discord\.com/i,
    label: 'Discord',
    iconify: 'ic:baseline-discord',
  },
  twitch: {
    pattern: /twitch\.tv/i,
    label: 'Twitch',
    iconify: 'mdi:twitch',
  },
  shopify: {
    pattern: /\.myshopify\.com|shopify\.com/i,
    label: 'Shop',
    iconify: 'simple-icons:shopify',
  },
  etsy: {
    pattern: /etsy\.com/i,
    label: 'Etsy',
    iconify: 'simple-icons:etsy',
  },
  eventbrite: {
    pattern: /eventbrite\.com/i,
    label: 'Eventbrite',
    iconify: 'simple-icons:eventbrite',
  },
  ticketmaster: {
    pattern: /ticketmaster\.com/i,
    label: 'Ticketmaster',
    iconify: 'mdi:ticket',
  },
  venmo: {
    pattern: /venmo\.com/i,
    label: 'Venmo',
    iconify: 'simple-icons:venmo',
  },
  cashapp: {
    pattern: /cash\.app/i,
    label: 'Cash App',
    iconify: 'simple-icons:cashapp',
  },
  paypal: {
    pattern: /paypal\.com|paypal\.me/i,
    label: 'PayPal',
    iconify: 'mdi:paypal',
  },
  threads: {
    pattern: /threads\.net/i,
    label: 'Threads',
    iconify: 'simple-icons:threads',
  },
  linkedin: {
    pattern: /linkedin\.com/i,
    label: 'LinkedIn',
    iconify: 'mdi:linkedin',
  },
  reddit: {
    pattern: /reddit\.com/i,
    label: 'Reddit',
    iconify: 'mdi:reddit',
  },
  telegram: {
    pattern: /t\.me|telegram\.org/i,
    label: 'Telegram',
    iconify: 'mdi:telegram',
  },
  whatsapp: {
    pattern: /whatsapp\.com|wa\.me/i,
    label: 'WhatsApp',
    iconify: 'mdi:whatsapp',
  },
  snapchat: {
    pattern: /snapchat\.com/i,
    label: 'Snapchat',
    iconify: 'mdi:snapchat',
  },
  deezer: {
    pattern: /deezer\.com/i,
    label: 'Deezer',
    iconify: 'simple-icons:deezer',
  },
  tidal: {
    pattern: /tidal\.com/i,
    label: 'TIDAL',
    iconify: 'simple-icons:tidal',
  },
  amazonMusic: {
    pattern: /music\.amazon\.|amazon\.com\/music/i,
    label: 'Amazon Music',
    iconify: 'simple-icons:amazonmusic',
  },
  bandsintown: {
    pattern: /bandsintown\.com/i,
    label: 'Bandsintown',
    iconify: 'simple-icons:bandsintown',
  },
  songkick: {
    pattern: /songkick\.com/i,
    label: 'Songkick',
    iconify: 'simple-icons:songkick',
  },
}

/**
 * Detect platform from URL
 * @param {string} url - The URL to analyze
 * @returns {{ platformKey: string, label: string, iconify: string }}
 */
export function detectPlatform(url) {
  if (!url) {
    return { platformKey: 'link', label: 'Link', iconify: 'mdi:link-variant' }
  }

  const normalizedUrl = url.toLowerCase()

  for (const [key, config] of Object.entries(PLATFORM_CONFIG)) {
    if (config.pattern.test(normalizedUrl)) {
      return {
        platformKey: key,
        label: config.label,
        iconify: config.iconify,
      }
    }
  }

  return { platformKey: 'link', label: 'Link', iconify: 'mdi:link-variant' }
}

/**
 * Check if URL is internal (same domain or relative path)
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
export function isInternalUrl(url) {
  if (!url) return false
  if (url.startsWith('/')) return true
  
  try {
    const urlObj = new URL(url)
    const internalDomains = ['musicbizqr.com', 'www.musicbizqr.com', 'localhost']
    return internalDomains.some(domain => urlObj.hostname.includes(domain))
  } catch {
    return false
  }
}

/**
 * Get all available platform configs (for dropdown selection)
 * @returns {Array<{ key: string, label: string, iconify: string }>}
 */
export function getAllPlatforms() {
  return Object.entries(PLATFORM_CONFIG).map(([key, config]) => ({
    key,
    label: config.label,
    iconify: config.iconify,
  }))
}
