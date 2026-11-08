/**
 * Product Showcase campaigns. A style is a different advertisement, not a
 * recolored headline. Missing or unknown style stays the approved artist-page film.
 */

export const PRODUCT_STYLES = [
  { id: 'page', label: 'Artist page', hint: 'The phone film. The real page, with music and links.' },
  { id: 'fan-list', label: 'Fan list', hint: 'Followers are not a list you own. The join card, and gallery photographs when the artist has them.' },
  { id: 'night', label: 'The night', hint: 'Concert photographs and the gallery they belong to.' },
  { id: 'show', label: 'The show', hint: 'The next real date on the page. This treatment stays a still. Nothing is invented when there is no show.' },
]

export const PRODUCT_STYLE_IDS = PRODUCT_STYLES.map((style) => style.id)

export function productStyle(content) {
  const id = content?.style
  return PRODUCT_STYLE_IDS.includes(id) ? id : 'page'
}

/** Public gallery photographs only. A profile photo is not a gallery. */
export function galleryPhotos(snapshot) {
  const seen = new Set()
  const frames = []
  for (const photo of (snapshot?.galleries || []).flatMap((gallery) => gallery?.photos || [])) {
    if (!photo?.url || seen.has(photo.url)) continue
    seen.add(photo.url)
    frames.push(photo)
  }
  return frames.slice(0, 4)
}

/** Gallery photographs, then the profile photo when a campaign has nothing else. */
export function campaignFrames(snapshot) {
  const frames = galleryPhotos(snapshot)
  if (frames.length) return frames
  if (snapshot?.hero?.url) return [snapshot.hero]
  return []
}

export function campaignGalleryTitle(snapshot) {
  const title = String(snapshot?.galleries?.[0]?.title || '').trim()
  return title || ''
}

export function campaignShow(snapshot) {
  return snapshot?.upcomingShows?.[0] || null
}

const COPY = {
  'fan-list': {
    kicker: 'Fan list',
    headlineTop: 'Your followers',
    headlineAccent: "aren't your fan list.",
    support: 'Turn passing attention into a list you keep.',
    cta: 'Start your page',
    excerpt: 'fanlist',
  },
  night: {
    kicker: 'Gallery',
    headlineTop: 'The night',
    headlineAccent: 'lives on.',
    support: 'The photographs stay with the artist.',
    cta: 'See the gallery',
    excerpt: 'gallery',
  },
  show: {
    kicker: 'Shows',
    headlineTop: 'Your show ends.',
    headlineAccent: "The connection doesn't.",
    support: 'The date stays on the page. So do the people who were there.',
    cta: 'Start your page',
    excerpt: 'shows',
  },
}

/** Copy and excerpt for a newly chosen style. Page keeps the existing defaults. */
export function productStyleContent(style, snapshot) {
  const copy = COPY[style]
  if (!copy) return null
  const next = { ...copy }
  if (style === 'night') {
    const frame = campaignFrames(snapshot)[0]
    if (frame) next.photo = frame
  }
  return next
}

/**
 * Curated angles. They replace lines on the open creative. They do not
 * change the artist, the photograph, or the style.
 */
export const PRODUCT_ANGLES = [
  { id: 'followers', style: 'fan-list', label: 'Followers', kicker: 'Fan list', headlineTop: 'Your followers', headlineAccent: "aren't your fan list.", support: 'A follow on someone else\'s app is not a list you can reach.', cta: 'Start your page' },
  { id: 'after', style: 'fan-list', label: 'After the show', kicker: 'Fan list', headlineTop: 'Your show ends.', headlineAccent: "Your fan connection doesn't.", support: 'The room goes home. The list stays with you.', cta: 'Start your page' },
  { id: 'passing', style: 'fan-list', label: 'Passing attention', kicker: 'Fan list', headlineTop: 'Turn passing', headlineAccent: 'attention into fans.', support: 'One place to stay close, instead of hoping they find you again.', cta: 'Start your page' },
  { id: 'keep', style: 'fan-list', label: 'Keep them', kicker: 'Fan list', headlineTop: 'Keep the fans', headlineAccent: 'who came back.', support: 'Music, shows, photos, and messages — directly from you.', cta: 'Start your page' },
  { id: 'lives', style: 'night', label: 'The night', kicker: 'Gallery', headlineTop: 'The night', headlineAccent: 'lives on.', support: 'The photographs stay with the artist.', cta: 'See the gallery' },
  { id: 'story', style: 'night', label: 'A story', kicker: 'Gallery', headlineTop: 'Every show', headlineAccent: 'has a story.', support: 'The room, the light, and the people who were there.', cta: 'See the gallery' },
  { id: 'more', style: 'night', label: 'More than photos', kicker: 'Gallery', headlineTop: 'More than', headlineAccent: 'a photo gallery.', support: 'The night leads back to the music, the shows, and the list.', cta: 'See the gallery' },
  { id: 'ends', style: 'show', label: 'After', kicker: 'Shows', headlineTop: 'Your show ends.', headlineAccent: "The connection doesn't.", support: 'The date stays on the page. So do the people who were there.', cta: 'Start your page' },
  { id: 'room', style: 'show', label: 'The room', kicker: 'Shows', headlineTop: 'One room.', headlineAccent: 'One page.', support: 'The date, the venue, and a way to stay close.', cta: 'Start your page' },
  { id: 'dates', style: 'show', label: 'Every date', kicker: 'Shows', headlineTop: 'Every date.', headlineAccent: 'One page.', support: 'Fans already look here. Put the show where they are.', cta: 'Start your page' },
]

export function anglesForStyle(style) {
  const id = PRODUCT_STYLE_IDS.includes(style) ? style : 'page'
  return PRODUCT_ANGLES.filter((angle) => angle.style === id)
}
