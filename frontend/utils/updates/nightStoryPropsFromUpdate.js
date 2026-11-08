export function nightStoryPropsFromUpdate(update, { artistName } = {}) {
  const row = update || {}
  const hasShowContext = !!(
    row.show
    && (row.show.venue || row.show.city || row.show.eventId || row.show.date || row.visibility === 'show_attendees')
  )
  return {
    artistName: artistName || row.band?.name || '',
    city: hasShowContext ? (row.show?.city || '') : '',
    venue: hasShowContext ? (row.show?.venue || '') : '',
    date: hasShowContext ? (row.show?.date || null) : null,
    title: row.title || '',
    caption: row.bodyText || '',
    youWereThere: !!row.youWereThere,
    firstShow: !!row.relationship?.firstShow,
    locked: !!row.locked,
    lockReason: row.lockReason || '',
    visibility: row.visibility || '',
    media: row.media || [],
    photoCount: row.photoCount || 0,
    hasShowContext,
    bandSlug: row.band?.slug || '',
    slug: row.slug || '',
  }
}
