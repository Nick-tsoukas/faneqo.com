/**
 * Presentation-only Living Gallery context.
 * Not Event schema. Not canonical Gallery truth.
 * Never invent venue, city, date, or show linkage.
 */

function text(value) {
  return String(value || '').trim()
}

export function joinContextParts(parts, separator = ' · ') {
  return (Array.isArray(parts) ? parts : [])
    .map((part) => text(part))
    .filter(Boolean)
    .join(separator)
}

export function inferShowLinked(input = {}) {
  if (input.showLinked === true) return true
  if (input.showLinked === false) return false
  return Boolean(
    text(input.venueName || input.venue)
    || text(input.city)
    || text(input.state)
    || text(input.date || input.displayDate),
  )
}

export function normalizeLivingGalleryContext(input = {}, extras = {}) {
  const memory = extras.memory && typeof extras.memory === 'object' ? extras.memory : null
  const artistName = text(input.artistName || input.artist)
  const galleryTitle = text(input.galleryTitle)
  const galleryCaption = text(input.galleryCaption)
  const venueName = text(input.venueName || input.venue)
  const city = text(input.city)
  const state = text(input.state)
  const date = text(input.displayDate || input.date)
  const showLinked = inferShowLinked({
    ...input,
    venueName,
    venue: venueName,
    city,
    state,
    date,
  })
  const activeIndex = Math.max(0, Number(extras.activeIndex ?? input.activeIndex) || 0)
  const total = Math.max(0, Number(extras.total ?? input.total) || 0)

  return {
    artistName,
    galleryTitle,
    galleryCaption,
    showLinked,
    venueName,
    city,
    state,
    date,
    photographer: text(memory?.photographer || input.photographer),
    galleryId: text(input.galleryId),
    activeIndex,
    total,
  }
}

export function livingGalleryVisibleContext(input = {}, options = {}) {
  const ctx = input && typeof input === 'object' && 'artistName' in input
    ? input
    : normalizeLivingGalleryContext(input)
  const compact = options.compact === true
  return {
    artist: ctx.artistName,
    secondary: ctx.venueName || ctx.galleryTitle,
    venue: ctx.venueName,
    place: compact
      ? ''
      : joinContextParts([
        joinContextParts([ctx.city, ctx.state], ' '),
        ctx.date,
      ]),
  }
}

/**
 * Info expands the memory. It does not restate chrome.
 * Hierarchy when fields exist: Caption → Artist → Venue → City/date → Photographer.
 * replaceChrome: identity is hidden; place/date may appear as the expansion.
 */
export function livingGalleryInfoGroups(input = {}, memory = null, options = {}) {
  const ctx = normalizeLivingGalleryContext(input, { memory })
  const visible = livingGalleryVisibleContext(ctx, { compact: options.compact === true })
  const omitVisible = options.omitVisible === true
  const replaceChrome = options.replaceChrome === true
  const chromeShowsPlace = omitVisible && !options.compact && !replaceChrome
  const chromeShowsVenue = omitVisible && visible.secondary === ctx.venueName && !replaceChrome
  const chromeShowsTitle = omitVisible && visible.secondary === ctx.galleryTitle && !replaceChrome
  const chromeShowsArtist = omitVisible && !replaceChrome && Boolean(visible.artist)
  const photoCaption = text(memory?.caption)
  const story = []
  const place = []
  const credit = []

  if (photoCaption) story.push({ kind: 'caption', text: photoCaption })
  else if (ctx.galleryCaption) story.push({ kind: 'caption', text: ctx.galleryCaption })

  if (ctx.galleryTitle && !chromeShowsTitle && (ctx.galleryTitle !== visible.secondary || replaceChrome || !omitVisible)) {
    if (!ctx.showLinked || ctx.galleryTitle !== ctx.venueName) {
      story.push({ kind: 'title', text: ctx.galleryTitle })
    }
  }

  if (ctx.artistName && (!chromeShowsArtist || replaceChrome)) {
    story.push({ kind: 'artist', text: ctx.artistName })
  }

  if (ctx.venueName && !chromeShowsVenue && (replaceChrome || !omitVisible)) {
    place.push({ label: 'Venue', value: ctx.venueName })
  }
  const cityState = joinContextParts([ctx.city, ctx.state], ' ')
  if (cityState && !chromeShowsPlace) place.push({ label: 'Place', value: cityState })
  if (ctx.date && !chromeShowsPlace) place.push({ label: 'Date', value: ctx.date })
  if (ctx.photographer) credit.push({ label: 'Photography', value: ctx.photographer })

  return { story, place, credit }
}

/**
 * Info as photographic editorial, not a metadata table.
 * Ordered lines, no labels: caption → artist → venue → city/date → credit.
 * Missing values are absent, never rendered empty. Text is passed through as
 * authored — this never re-cases artist or venue names.
 */
export function livingGalleryEditorialLines(input = {}, memory = null, options = {}) {
  const groups = livingGalleryInfoGroups(input, memory, options)
  const ctx = normalizeLivingGalleryContext(input, { memory })
  const lines = []

  for (const item of groups.story) {
    lines.push({ kind: item.kind, text: item.text })
  }
  if (ctx.venueName && groups.place.some((row) => row.label === 'Venue')) {
    lines.push({ kind: 'venue', text: ctx.venueName })
  }
  const place = joinContextParts([
    groups.place.find((row) => row.label === 'Place')?.value,
    groups.place.find((row) => row.label === 'Date')?.value,
  ])
  if (place) lines.push({ kind: 'place', text: place })
  if (ctx.photographer) {
    lines.push({ kind: 'credit', text: `Photography by ${ctx.photographer}` })
  }
  return lines
}

/**
 * The caption plate under a print.
 *
 * A plate leads with what the photograph *is*, then says who and where in one
 * quiet line. Three stacked tracked-caps fields — artist, venue, city/date —
 * read as a metadata label, which is the opposite of a memory. When the
 * photograph carries no caption the identity line becomes the lead and is set
 * larger, so the plate never opens on a whisper.
 *
 * `place` is emitted separately and only drawn where the composition has room.
 */
export function livingGalleryPlate(input = {}, memory = null) {
  const ctx = normalizeLivingGalleryContext(input, { memory })
  const caption = text(memory?.caption) || ctx.galleryCaption
  const identity = joinContextParts([
    ctx.artistName,
    ctx.venueName || ctx.galleryTitle,
  ])
  return {
    caption,
    identity,
    place: joinContextParts([
      joinContextParts([ctx.city, ctx.state], ' '),
      ctx.date,
    ]),
    // Without a caption the identity has to carry the plate on its own.
    lead: caption ? 'caption' : 'identity',
  }
}

export function livingGalleryInfoRows(input = {}, memory = null, options = {}) {
  const groups = livingGalleryInfoGroups(input, memory, options)
  const rows = []
  for (const item of groups.story) {
    const label = item.kind === 'title'
      ? 'Gallery'
      : item.kind === 'artist'
        ? 'Artist'
        : 'Caption'
    rows.push({ label, value: item.text })
  }
  rows.push(...groups.place)
  rows.push(...groups.credit)
  return rows
}
