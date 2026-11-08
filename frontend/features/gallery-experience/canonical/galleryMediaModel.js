/**
 * The gallery boundary. Normalize once, here, and nowhere else.
 *
 * Every component downstream of this file sees one flat shape. None of them
 * knows about Strapi nesting, protected-media capability URLs, format
 * dictionaries, Event, Show Recap or Gallery schemas. That knowledge stops at
 * this module, which is the only reason a single viewer can serve every
 * legitimate gallery entry point.
 *
 * Input is the canonical public payload from
 * `GET /api/public/bands/:bandSlug/galleries/:gallerySlug`, already run
 * through `normalizeFaneqoMediaList` by `usePublicNight`. We do not re-derive
 * authorization here: a locked gallery arrives with `media: []` and stays
 * empty. Frontend visibility is not authorization.
 */

import {
  gallerySrcset,
  gallerySizes,
  selectGalleryMediaSource,
  mediaAspectRatio,
} from '../../../utils/media/faneqoGalleryLayout.js'
import { resolveFaneqoMediaSrc, normalizeFaneqoMediaList } from '../../../utils/media/faneqoMedia.js'
import { displayPlaceName, formatNightDateLong } from '../../../utils/nights/nightDisplay.js'
import { galleryPath, nightPath } from '../../../utils/nights/publicNightPaths.js'
import { getBestArtistImageSource } from '../../../utils/media/artistImage.js'

function text(value) {
  return String(value ?? '').trim()
}

function srcsetCandidates(srcset) {
  const raw = text(srcset)
  if (!raw) return []
  return raw.split(',').map((part) => {
    const token = part.trim()
    const space = token.lastIndexOf(' ')
    if (space < 0) return null
    const src = token.slice(0, space).trim()
    const width = Number(String(token.slice(space + 1)).replace(/w$/i, ''))
    if (!src || !Number.isFinite(width) || width <= 0) return null
    return { src, width }
  }).filter(Boolean)
}

/**
 * One photograph, in the only shape the overview and viewer understand.
 *
 * `width`/`height` are intrinsic and load-bearing: the wall reserves its rows
 * from them and the viewer computes contain scale from them. A photograph
 * without dimensions still renders, but it costs a reflow, so treat a missing
 * dimension as a data defect worth fixing upstream.
 */
export function normalizeGalleryPhoto(item, index = 0, { origin = '' } = {}) {
  if (!item || item.unavailable === true) return null

  const stage = selectGalleryMediaSource(item, { role: 'lightbox', targetCssPx: 1400, dpr: 2 })
  const thumb = selectGalleryMediaSource(item, { role: 'thumb' })
  const src = resolveFaneqoMediaSrc(stage?.url || item.largeUrl || item.url, origin)
  if (!src) return null

  const srcset = gallerySrcset(item, { role: 'lightbox' })
  const resolvedSrcset = srcset
    ? srcsetCandidates(srcset)
      .map((row) => ({ src: resolveFaneqoMediaSrc(row.src, origin), width: row.width }))
      .filter((row) => row.src)
    : []

  return {
    id: text(item.mediaId || item.id) || `photo-${index}`,
    index,
    src,
    /** Largest honest source. Enlargement is a last resort, so ask big first. */
    fullSrc: resolveFaneqoMediaSrc(item.largeUrl || item.originalUrl || item.url, origin) || src,
    /** Already decoded in the wall — this is what makes an open instant. */
    thumbSrc: resolveFaneqoMediaSrc(thumb?.url || item.thumbnailUrl || item.thumbUrl, origin) || src,
    srcset: resolvedSrcset.length > 1
      ? resolvedSrcset.map((row) => `${row.src} ${row.width}w`).join(', ')
      : '',
    srcsetCandidates: resolvedSrcset,
    sizes: gallerySizes('lightbox'),
    thumbSizes: gallerySizes('thumb'),
    width: Number(item.width) || null,
    height: Number(item.height) || null,
    aspectRatio: mediaAspectRatio(item),
    alt: text(item.alt || item.alternativeText),
    caption: text(item.caption),
    visibility: text(item.visibility) || null,
    protected: item.protected === true,
  }
}

export function normalizeGalleryPhotos(list, { origin = '' } = {}) {
  const rows = Array.isArray(list) ? list : []
  return rows
    .map((item, index) => normalizeGalleryPhoto(item, index, { origin }))
    .filter(Boolean)
    // Re-index after filtering so `index` is always the on-screen position.
    .map((photo, index) => ({ ...photo, index }))
}

/**
 * Who this Night belongs to.
 *
 * The gallery must read as an artist's Night without becoming a profile page,
 * so identity is a name, a circle and a line of context — nothing more. The
 * band image comes from the real `artist.image` relation; there is no
 * prototype identity and no invented venue or date.
 */
export function normalizeGalleryIdentity(payload = {}, { bandSlug = '' } = {}) {
  const artist = payload.artist || {}
  const gallery = payload.gallery || {}
  const night = payload.night && typeof payload.night === 'object' ? payload.night : null

  // Place names are data; the threshold shows them as names, not as slugs.
  const venue = displayPlaceName(night?.venue)
  const city = displayPlaceName(night?.city)
  const region = text(night?.region || night?.state)
  const date = formatNightDateLong(night?.date || night?.performanceStartsAt, night?.timezone)
  // A gallery can exist without a show. Never imply a Night that is not linked.
  const showLinked = Boolean(night && (venue || city || region || date))

  const place = [venue, [city, region].filter(Boolean).join(', ')].filter(Boolean).join(' · ')
  const image = getBestArtistImageSource(artist.image, 'thumb')
  const slug = text(artist.slug) || text(bandSlug)
  const name = text(artist.name)

  const count = Number(gallery.photoCount)
  const photoCount = Number.isFinite(count) && count > 0
    ? count
    : (Array.isArray(gallery.media) ? gallery.media.length : 0)

  return {
    artistName: name,
    artistPath: slug ? `/${slug}` : '',
    artistImage: image.src ? image : null,
    /** Only if it is already Faneqo's fallback — never a cheap gradient. */
    artistInitial: name ? name.slice(0, 1).toUpperCase() : '',
    focalX: Number.isFinite(Number(artist.focalX)) ? Number(artist.focalX) : 50,
    focalY: Number.isFinite(Number(artist.focalY)) ? Number(artist.focalY) : 50,
    title: text(gallery.title) || text(night?.title) || 'Gallery',
    caption: text(gallery.caption),
    placeLine: showLinked ? place : '',
    dateLine: showLinked ? date : '',
    photoCount,
    nightPath: showLinked ? nightPath(slug, night?.nightSlug) : null,
    nightTitle: text(night?.title),
    showLinked,
  }
}

/**
 * The whole model for one gallery. This is what a page hands the overview.
 */
export function normalizeGalleryModel(payload = {}, { bandSlug = '', origin = '' } = {}) {
  const gallery = payload.gallery || {}
  const locked = gallery.locked === true
  const visibility = text(gallery.visibility) || 'public'
  const canonicalPath = text(payload.share?.canonicalPath)
    || text(gallery.canonicalPath)
    || galleryPath(text(payload.artist?.slug) || bandSlug, gallery.slug)
    || ''

  return {
    identity: normalizeGalleryIdentity(payload, { bandSlug }),
    // A locked gallery has no media to normalize, and we never invent any.
    photos: locked ? [] : normalizeGalleryPhotos(gallery.media, { origin }),
    locked,
    lockReason: text(gallery.lockReason) || null,
    visibility,
    /** Only a `public` gallery's link opens for anyone. Fail closed. */
    isPublic: visibility === 'public',
    slug: text(gallery.slug),
    canonicalPath,
    share: payload.share || null,
    viewer: payload.viewer || null,
    unavailable: payload.unavailable === true,
  }
}

/**
 * Escape hatch for surfaces that hold raw Strapi media rather than a public
 * payload (Show Recap previews, Passport, message galleries). It runs the same
 * normalization so those callers still get exactly one model shape.
 */
export function galleryModelFromMedia(media, {
  identity = {},
  visibility = 'public',
  canonicalPath = '',
  origin = '',
} = {}) {
  return {
    identity: {
      artistName: '',
      artistPath: '',
      artistImage: null,
      artistInitial: '',
      focalX: 50,
      focalY: 50,
      title: 'Gallery',
      caption: '',
      placeLine: '',
      dateLine: '',
      photoCount: Array.isArray(media) ? media.length : 0,
      nightPath: null,
      nightTitle: '',
      showLinked: false,
      ...identity,
    },
    photos: normalizeGalleryPhotos(normalizeFaneqoMediaList(media), { origin }),
    locked: false,
    lockReason: null,
    visibility,
    isPublic: visibility === 'public',
    slug: '',
    canonicalPath: text(canonicalPath),
    share: null,
    viewer: null,
    unavailable: false,
  }
}
