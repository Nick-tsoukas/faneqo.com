/**
 * The template families. Each entry is the whole contract for a family:
 * supported formats, curated variants, copy presets, default content from an
 * artist snapshot, which media the content uses (for rights), and how many
 * scenes it renders. Pure data: no Vue imports, so Node tests can load it.
 * Components are bound in templates/index.js.
 *
 * Content objects are plain JSON. Everything an editor control changes lives
 * here, nothing lives in component state.
 */
import { PRODUCT_ANGLES, PRODUCT_STYLES, productStyle, productStyleContent } from './campaigns.js'
import { EDUCATION_TOPICS } from './education.js'

const ALL = ['post', 'feed', 'story', 'square']

function firstSentence(text, max = 110) {
  const raw = String(text || '').trim()
  if (!raw) return ''
  const sentence = raw.split(/(?<=[.!?])\s+/)[0] || raw
  return sentence.length <= max ? sentence : `${sentence.slice(0, max - 1).trim()}…`
}

function siteFor(snapshot) {
  return snapshot?.slug ? `faneqo.com/${snapshot.slug}` : 'faneqo.com'
}

export const ACCENTS = [
  { id: 'violet', label: 'Violet', hex: '#c084fc' },
  { id: 'magenta', label: 'Magenta', hex: '#ff4ad8' },
  { id: 'cyan', label: 'Cyan', hex: '#67e8f9' },
  { id: 'ember', label: 'Ember', hex: '#ff7a45' },
  { id: 'gold', label: 'Gold', hex: '#f5c451' },
  { id: 'moss', label: 'Moss', hex: '#7ddc8a' },
  { id: 'bone', label: 'Bone', hex: '#e7e2d6' },
]

/* Photograph treatment presets: how much shade a frame lays over the photograph. Absent on older creatives = balanced. */
export const PHOTO_TREATMENTS = [
  { id: 'natural', label: 'Natural', hint: 'Less shade. For photographs that are already dark or moody.' },
  { id: 'balanced', label: 'Balanced', hint: 'The frame as designed.' },
  { id: 'deep', label: 'Deep', hint: 'More shade. For bright, high-key photographs.' },
]

/*
 * Artist Spotlight design styles. Stored as `content.style`. Creatives saved
 * before styles existed have no `style` and keep rendering as `legacy`; only
 * new creatives default to `editorial`. Never migrate records silently.
 */
export const SPOTLIGHT_STYLES = [
  { id: 'editorial', label: 'Editorial Icon', hint: 'Magazine cover. The photograph bleeds; the name is the masthead.' },
  { id: 'cinematic', label: 'Cinematic Immersion', hint: 'One-sheet. The photograph fills the frame; type sits in the shade.' },
  { id: 'culture', label: 'Contemporary Music Culture', hint: 'Poster. A spine rail, a placed print, the name and its echo.' },
  { id: 'legacy', label: 'Original', hint: 'The first Artist Spotlight, with its Photo band, Portrait and Page excerpt layouts.' },
]
export const SPOTLIGHT_DEFAULT_STYLE = 'editorial'
export const SPOTLIGHT_STYLE_IDS = SPOTLIGHT_STYLES.map((s) => s.id)

/** The style a spotlight renders with. Missing or unknown = legacy (the pre-style rendering). */
export function spotlightStyle(content) {
  const id = content?.style
  return SPOTLIGHT_STYLE_IDS.includes(id) ? id : 'legacy'
}

/** Music Industry Insights. One post, two compositions. Missing or unknown style renders as Bold Insight. */
export const INSIGHT_STYLES = [
  { id: 'bold', label: 'Bold Insight', hint: 'The headline is the poster. The last line carries the accent.' },
  { id: 'playbook', label: 'Music Playbook', hint: 'A titled note: headline, numbered takeaway, short explanation.' },
]
export const INSIGHT_DEFAULT_STYLE = 'bold'
export const INSIGHT_STYLE_IDS = INSIGHT_STYLES.map((s) => s.id)

export function insightStyle(content) {
  const id = content?.style
  return INSIGHT_STYLE_IDS.includes(id) ? id : INSIGHT_DEFAULT_STYLE
}

export const TEMPLATE_FAMILIES = [
  {
    id: 'artist-spotlight',
    name: 'Artist Spotlight',
    short: 'Spotlight',
    tagline: 'Introduce an artist. Photograph first, featured song second.',
    needsArtist: true,
    formats: ALL,
    defaultFormat: 'post',
    styles: SPOTLIGHT_STYLES,
    variants: [
      { id: 'photo', label: 'Photo band', hint: 'Headline, photograph, song row, name.' },
      { id: 'portrait', label: 'Portrait', hint: 'Full-bleed photograph, type at the base.' },
      { id: 'product', label: 'Page excerpt', hint: 'Photograph inside the artist page.' },
    ],
    /* Layout variants belong to the Original style only; the new styles each have one composition per format. */
    showVariants: (content) => spotlightStyle(content) === 'legacy',
    headlines: [
      { top: 'Artist', accent: 'Spotlight' },
      { top: 'Now on', accent: 'Faneqo' },
      { top: 'Meet', accent: '{artist}' },
      { top: 'New on', accent: 'the list' },
    ],
    ctas: ['Discover more artists', 'Visit the artist page', 'Follow on Faneqo', 'Hear the featured song'],
    fields: ['artist', 'style', 'photo', 'focal', 'treatment', 'headline', 'description', 'songArt', 'badge', 'cta', 'variant'],
    defaults(snapshot) {
      const name = snapshot?.name || 'Artist'
      return {
        style: SPOTLIGHT_DEFAULT_STYLE,
        variant: 'photo',
        seriesLabel: 'Faneqo presents',
        headlineTop: 'Artist',
        headlineAccent: 'Spotlight',
        artistName: name,
        description: firstSentence(snapshot?.tagline || snapshot?.bio) || '',
        photo: snapshot?.hero || null,
        focal: snapshot?.hero?.focal || { x: 50, y: 30 },
        songTitle: snapshot?.song?.title || '',
        songArt: snapshot?.song?.art || null,
        badgeText: 'Live on Faneqo',
        cta: 'Discover more artists',
        site: 'faneqo.com',
      }
    },
    media: (content) => [content.photo, content.songTitle ? content.songArt : null],
    scenes: () => 1,
    summary: (content) => `${content.artistName || ''}`.trim(),
  },
  {
    id: 'song-spotlight',
    name: 'Song Spotlight',
    short: 'Song',
    tagline: 'Album art is the star. A release campaign in one frame.',
    needsArtist: true,
    formats: ALL,
    defaultFormat: 'post',
    variants: [
      { id: 'cover', label: 'Cover', hint: 'Artwork centred over a colour glow.' },
      { id: 'bleed', label: 'Room', hint: 'The artwork, blurred, fills the field.' },
      { id: 'sleeve', label: 'Sleeve', hint: 'Record half-drawn from the sleeve.' },
    ],
    kickers: ['Featured song', 'New release', 'Now playing', 'Out now', 'Single'],
    ctas: ['Listen on the artist page', 'Hear it on Faneqo', 'Stream it now', 'Play the featured song'],
    fields: ['artist', 'art', 'kicker', 'title', 'line', 'release', 'accent', 'player', 'cta', 'variant'],
    defaults(snapshot) {
      const release = snapshot?.releases?.find((r) => r.art) || null
      const art = snapshot?.song?.art || release?.art || null
      return {
        variant: 'cover',
        kicker: 'Featured song',
        title: snapshot?.song?.title || release?.title || 'Song title',
        artistName: snapshot?.name || 'Artist',
        line: '',
        releaseLabel: release?.releaseDate ? release.releaseDate.slice(0, 4) : '',
        art,
        accent: null,
        playerExcerpt: true,
        cta: 'Listen on the artist page',
        site: siteFor(snapshot),
      }
    },
    media: (content) => [content.art],
    scenes: () => 1,
    summary: (content) => [content.title, content.artistName].filter(Boolean).join(' · '),
  },
  {
    id: 'product-showcase',
    name: 'Product Showcase',
    short: 'Product',
    tagline: 'What Faneqo gives an artist, shown with the real page.',
    needsArtist: false,
    formats: ALL,
    defaultFormat: 'feed',
    styles: PRODUCT_STYLES,
    showVariants(content) {
      return productStyle(content) === 'page'
    },
    styleContent: productStyleContent,
    angles: PRODUCT_ANGLES,
    variants: [
      { id: 'stack', label: 'Framed', hint: 'The page sits inside the frame.' },
      { id: 'bleed', label: 'Bleed', hint: 'The page runs off the bottom edge.' },
    ],
    excerpts: [
      { id: 'page', label: 'Artist page' },
      { id: 'song', label: 'Featured song' },
      { id: 'fanlist', label: 'Fan list' },
      { id: 'shows', label: 'Shows' },
      { id: 'gallery', label: 'Gallery' },
    ],
    headlines: [
      { top: 'Your entire', accent: 'music world.', support: 'Music, video, links, shows, and fans — one artist page.' , excerpt: 'page' },
      { top: 'Your music.', accent: 'One tap away.', support: 'The featured song plays right on your page.', excerpt: 'song' },
      { top: 'Own your', accent: 'fan list.', support: 'Fans join from your page. You keep the list.', excerpt: 'fanlist' },
      { top: 'Every show.', accent: 'One place.', support: 'Dates, venues, and tickets where fans already look.', excerpt: 'shows' },
      { top: 'Nights worth', accent: 'remembering.', support: 'Share the photos from the show with the people who were there.', excerpt: 'gallery' },
    ],
    ctas: ['Start your page', 'See how it works', 'Build yours at faneqo.com', 'Claim your artist page'],
    fields: ['artist', 'style', 'angle', 'excerpt', 'headline', 'support', 'photo', 'excerptArt', 'showcaseLinks', 'cta', 'variant'],
    defaults(snapshot) {
      return {
        variant: 'stack',
        kicker: 'One page. One world.',
        headlineTop: 'Your entire',
        headlineAccent: 'music world.',
        accentLine: false,
        support: 'Music, video, links, shows, and fans — one artist page.',
        excerpt: 'page',
        photo: snapshot?.hero || null,
        songArt: snapshot?.song?.art || null,
        cta: 'Start your page',
        site: 'faneqo.com',
      }
    },
    media: (content) => [content.photo, content.excerpt === 'page' || content.excerpt === 'song' ? content.songArt : null],
    scenes: () => 1,
    summary: (content) => `${content.headlineTop || ''} ${content.headlineAccent || ''}`.trim(),
  },
  {
    id: 'type-statement',
    name: 'Typography Statement',
    short: 'Statement',
    tagline: 'Brand statements that hold the frame without a photograph.',
    needsArtist: false,
    formats: ALL,
    defaultFormat: 'post',
    variants: [
      { id: 'statement', label: 'Statement', hint: 'Left-aligned, vertically centred.' },
      { id: 'poster', label: 'Poster', hint: 'Centred, stacked, one accent word.' },
      { id: 'manifesto', label: 'Manifesto', hint: 'Headline, hairline, a short paragraph.' },
    ],
    presets: [
      { id: 'bands-need-fans', lines: [{ text: 'Bands', tone: 'plain' }, { text: 'need', tone: 'muted' }, { text: 'fans.', tone: 'accent' }], support: 'Not more links. Fans who come back.', cta: 'Start your page' },
      { id: 'deserves-more', lines: [{ text: 'Your music', tone: 'plain' }, { text: 'deserves', tone: 'plain' }, { text: 'more.', tone: 'accent' }], support: 'One page for your songs, shows, and the people who love them.', cta: 'See how it works' },
      { id: 'stop-renting', lines: [{ text: 'Stop', tone: 'plain' }, { text: 'renting', tone: 'accent' }, { text: 'your audience.', tone: 'plain' }], support: 'Algorithms change. Your fan list is yours.', cta: 'Own your fan list' },
      { id: 'headquarters', lines: [{ text: 'Your band\'s', tone: 'muted' }, { text: 'headquarters.', tone: 'plain' }], support: 'Music, video, shows, fans. One link.', cta: 'Build yours' },
      { id: 'one-link', lines: [{ text: 'One link.', tone: 'plain' }, { text: 'Every fan.', tone: 'accent' }], support: '', cta: 'Start your page' },
      { id: 'came-back', lines: [{ text: 'The fans', tone: 'plain' }, { text: 'who came', tone: 'plain' }, { text: 'back.', tone: 'accent' }], support: 'Faneqo remembers who showed up. So you can.', cta: 'See how it works' },
    ],
    scales: [
      { id: 'xl', label: 'XL' },
      { id: 'l', label: 'L' },
      { id: 'm', label: 'M' },
      { id: 's', label: 'S' },
    ],
    ctas: ['Start your page', 'See how it works', 'Own your fan list', 'Build yours'],
    fields: ['preset', 'lines', 'scale', 'weight', 'support', 'photo', 'veil', 'cta', 'variant'],
    defaults(snapshot) {
      return {
        variant: 'statement',
        kicker: 'Faneqo',
        lines: [{ text: 'Bands', tone: 'plain' }, { text: 'need', tone: 'muted' }, { text: 'fans.', tone: 'accent' }],
        scale: 'l',
        weight: 'heavy',
        support: 'Not more links. Fans who come back.',
        photo: null,
        focal: snapshot?.hero?.focal || null,
        veil: 0.72,
        cta: 'Start your page',
        site: 'faneqo.com',
      }
    },
    media: (content) => [content.photo],
    scenes: () => 1,
    summary: (content) => (content.lines || []).map((l) => (typeof l === 'string' ? l : l.text)).join(' '),
  },
  {
    id: 'education',
    name: 'Musician Education',
    short: 'Education',
    tagline: 'Useful posts and carousels for working artists.',
    needsArtist: false,
    formats: ['square', 'post', 'story'],
    defaultFormat: 'square',
    carousel: true,
    variants: [
      { id: 'editorial', label: 'Editorial', hint: 'Open type on the dark field.' },
      { id: 'cards', label: 'Cards', hint: 'Each slide inside a soft card.' },
    ],
    topics: EDUCATION_TOPICS,
    ctas: ['Build your page', 'Start your page', 'Learn more'],
    fields: ['topic', 'cover', 'slides', 'closing', 'cta', 'variant'],
    defaults() {
      const topic = EDUCATION_TOPICS[0]
      return {
        variant: 'editorial',
        topic: topic.id,
        kicker: 'Faneqo notes',
        cover: { ...topic.cover },
        slides: topic.slides.map((s) => ({ ...s })),
        closing: { ...topic.closing },
        cta: topic.closing.cta,
        site: 'faneqo.com',
      }
    },
    media: () => [],
    scenes: (content) => 1 + (content.slides || []).filter((s) => s && (s.title || s.body)).length + (content.closing && (content.closing.headline || content.closing.cta) ? 1 : 0),
    summary: (content) => content.cover?.headline || '',
  },
  {
    id: 'insights',
    name: 'Music Industry Insights',
    short: 'Insights',
    tagline: 'One idea for working musicians, set like a music publication.',
    needsArtist: false,
    formats: ALL,
    defaultFormat: 'feed',
    defaultStyle: INSIGHT_DEFAULT_STYLE,
    styles: INSIGHT_STYLES,
    variants: [],
    fields: ['style', 'category', 'statement', 'insight', 'support'],
    defaults() {
      return {
        style: INSIGHT_DEFAULT_STYLE,
        category: 'Fan list',
        statement: "Your followers aren't your fan list.",
        insight: 'Give the crowd one easy way to follow you.',
        support: 'Turn passing attention into lasting fan relationships.',
        site: 'faneqo.com',
      }
    },
    media: () => [],
    scenes: () => 1,
    summary: (content) => String(content.statement || '').trim(),
  },
  {
    id: 'show-promo',
    name: 'Show Promotion',
    short: 'Show',
    tagline: 'A show poster built from the artist\'s real event.',
    needsArtist: true,
    formats: ALL,
    defaultFormat: 'post',
    variants: [
      { id: 'poster', label: 'Poster', hint: 'Full-bleed photograph.' },
      { id: 'ticket', label: 'Ticket', hint: 'Photo band and a ticket-stub details block.' },
    ],
    headlines: ['Live', 'Live in {city}', 'One night only', 'See you there', 'Next show'],
    ctas: ['Tickets & details', 'Get tickets', 'Details on the artist page', 'RSVP on Faneqo'],
    fields: ['artist', 'show', 'photo', 'focal', 'headline', 'cta', 'variant'],
    defaults(snapshot) {
      const show = snapshot?.upcomingShows?.[0] || null
      return {
        variant: 'poster',
        kicker: 'Live',
        headline: show?.city ? `Live in ${show.city}` : 'Live',
        artistName: snapshot?.name || 'Artist',
        show: show ? { ...show } : null,
        photo: snapshot?.hero || show?.image || null,
        focal: snapshot?.hero?.focal || { x: 50, y: 30 },
        cta: 'Tickets & details',
        site: siteFor(snapshot),
      }
    },
    media: (content) => [content.photo || content.show?.image],
    scenes: () => 1,
    summary: (content) => [content.artistName, content.show?.city].filter(Boolean).join(' · '),
  },
]

export const TEMPLATE_IDS = TEMPLATE_FAMILIES.map((family) => family.id)

export function templateFamily(id) {
  return TEMPLATE_FAMILIES.find((family) => family.id === id) || null
}

/** Fill a headline preset's {artist} / {city} tokens from a snapshot or content. */
export function fillToken(text, values = {}) {
  return String(text || '').replace(/\{(\w+)\}/g, (_, key) => (values[key] != null && values[key] !== '' ? String(values[key]) : ''))
    .replace(/\s{2,}/g, ' ')
    .trim()
}
