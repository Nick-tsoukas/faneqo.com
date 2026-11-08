/**
 * Gallery share intents.
 *
 * This is a payload builder, not a sharing system. Execution belongs to the
 * canonical public helper `utils/share/faneqoShare.js` — the same one the
 * Gallery Archive, Public Night and Night Gallery Viewer already call. There
 * is no second drawer, no second fallback chain and no second URL rule here.
 *
 * TWO INTENTS
 * -----------
 *   photo    the photograph on screen, carrying its gallery context
 *   gallery  the complete Gallery / Night
 *
 * The Share button inside the viewer defaults to `photo`, because that is
 * what the fan is looking at.
 *
 * WHAT IS NEVER SHARED
 * --------------------
 * A media URL. Ever. Both intents resolve to the gallery's canonical public
 * path, optionally carrying `#photo-<mediaId>` so the right photograph
 * reopens. The server re-checks access on every read, so a gated gallery's
 * link still challenges the viewer — link reach and audience access are
 * different things, and only the server decides the second one.
 *
 * The preview image comes from `payload.share.image` alone, which the backend
 * has already reduced to a public-safe image (`galleryShareImage` falls back
 * to the Night cover for any gated gallery, never to gallery media). We run it
 * through `shareImageUrl` anyway, which rejects signed S3 and protected URLs.
 *
 * ANALYTICS
 * ---------
 * The canonical public share helper deliberately emits none — see its header.
 * The only share analytics path that exists (`useShareKit.trackShareAction` →
 * `/api/pulse/shareables/track`) is keyed on `shareableId` and `cardType`,
 * which a photograph in a Night does not have; feeding it invented ids would
 * pollute the dashboard feed rather than measure anything. So this builder
 * adds no events. That is also the only way to guarantee the brief's "no
 * duplicate events": there are none to duplicate. If gallery share metrics
 * are wanted, that is a Share Kit 2.0 decision, not a viewer decision.
 */

import { faneqoShareUrl, shareFaneqoUrl } from '../../../utils/share/faneqoShare.js'
import { shareImageUrl } from '../../../utils/site/faneqoOrigin.js'
import { galleryPhotoHash } from './galleryViewerHistory.js'

function text(value) {
  return String(value ?? '').trim()
}

/**
 * Can this gallery be shared at all?
 * A locked gallery has nothing the recipient could be shown, and a gallery
 * with no canonical path has no address. Both fail closed.
 */
export function canShareGallery(model) {
  if (!model) return false
  if (model.locked) return false
  if (model.unavailable) return false
  return Boolean(text(model.canonicalPath))
}

/**
 * Honest copy about who a link will actually open for. Fans should never be
 * surprised by the reach of something they just sent.
 */
export function galleryShareReachNote(model) {
  if (!model) return ''
  return model.isPublic
    ? 'Anyone with this link can open this gallery.'
    : 'This link still checks who is opening it. Only people with access will see the photos.'
}

/**
 * Absolute, clean, public deep link to one photograph.
 * `faneqoShareUrl` strips `from`/`photo` and any existing hash first, so the
 * hash we append is the only one on the URL.
 */
export function galleryPhotoShareUrl({ canonicalPath, photoId, origin } = {}) {
  return faneqoShareUrl({ canonicalPath, origin, hash: galleryPhotoHash(photoId) })
}

export function galleryShareUrl({ canonicalPath, origin } = {}) {
  return faneqoShareUrl({ canonicalPath, origin })
}

/**
 * Both intents for the current state of the viewer.
 * Titles and descriptions prefer the backend share contract, because that is
 * what the OG tags on the destination will say.
 */
export function galleryShareIntents({ model, photo = null, origin = '' } = {}) {
  if (!canShareGallery(model)) return null

  const identity = model.identity || {}
  const share = model.share || {}
  const canonicalPath = text(model.canonicalPath)
  const title = text(share.title)
    || [identity.artistName, identity.title].filter(Boolean).join(' · ')
    || 'A night on Faneqo'
  const description = text(share.description) || text(identity.caption) || 'Photos from the night.'
  const image = shareImageUrl(share.image)

  const galleryIntent = {
    kind: 'gallery',
    title,
    text: description,
    canonicalPath,
    url: galleryShareUrl({ canonicalPath, origin }),
    image,
    requiresAccess: !model.isPublic,
    reachNote: galleryShareReachNote(model),
  }

  if (!photo) return { gallery: galleryIntent, photo: null, default: galleryIntent }

  const photoIntent = {
    kind: 'photo',
    photoId: text(photo.id),
    /* The photograph is the subject; the gallery is the context it needs. */
    title,
    text: text(photo.caption) || text(photo.alt) || description,
    canonicalPath,
    hash: galleryPhotoHash(photo.id),
    url: galleryPhotoShareUrl({ canonicalPath, photoId: photo.id, origin }),
    image,
    requiresAccess: !model.isPublic,
    reachNote: galleryShareReachNote(model),
  }

  return { gallery: galleryIntent, photo: photoIntent, default: photoIntent }
}

/**
 * Execute an intent through the canonical helper — OS share sheet first, then
 * clipboard, then the legacy copy path. No forked fallback chain lives here.
 */
export async function runGalleryShare(intent, { origin = '' } = {}, environment = {}) {
  if (!intent?.url) {
    const error = new Error('Link is unavailable')
    error.code = 'share_unavailable'
    throw error
  }
  return shareFaneqoUrl({
    title: intent.title,
    text: intent.text,
    canonicalPath: intent.canonicalPath,
    hash: intent.hash,
    origin,
  }, environment)
}
