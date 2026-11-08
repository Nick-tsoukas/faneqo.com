'use strict';

/**
 * Public Night / Gallery share contract.
 * Presentation only. Attendance and media access stay in existing engines.
 */

const mediaPure = require('../artistUpdates/protectedMediaPure');

const SHARE_DESCRIPTION_MAX = 200;
const PUBLIC_NIGHT_ROOT_KEYS = ['artist', 'night', 'viewer', 'galleries', 'recordings', 'share'];
const PUBLIC_GALLERY_ROOT_KEYS = ['artist', 'gallery', 'night', 'viewer', 'share', 'unavailable'];
const PUBLIC_ARTIST_KEYS = ['id', 'name', 'slug', 'image', 'imageFit', 'focalX', 'focalY'];
const PUBLIC_NIGHT_KEYS = [
  'nightSlug',
  'title',
  'venue',
  'city',
  'region',
  'country',
  'date',
  'performanceStartsAt',
  'performanceEndsAt',
  'timezone',
  'publicStory',
  'lineup',
  'cover',
  'eventImage',
  'hero',
  'heroFocalX',
  'heroFocalY',
  'attendanceCount',
];
const PUBLIC_GALLERY_KEYS = [
  'id',
  'slug',
  'title',
  'caption',
  'visibility',
  'photoCount',
  'publishedAt',
  'locked',
  'lockReason',
  'youWereThere',
  'media',
  'canonicalPath',
];
const PUBLIC_VIEWER_KEYS = ['authenticated', 'youWereThere', 'showOrdinal', 'isArtist'];
const PUBLIC_SHARE_KEYS = ['canonicalPath', 'title', 'description', 'image'];
const PUBLIC_IMAGE_KEYS = ['url', 'width', 'height', 'alternativeText'];
const PUBLIC_LINEUP_KEYS = ['name', 'role', 'order', 'bandId'];

const FORBIDDEN_PUBLIC_KEYS = [
  'privateArtistNote',
  'campaignId',
  'showModeLastCampaignId',
  'showModeLastContext',
  'showModeLastDeactivationReason',
  'showModeMetadata',
  'stripeAccountId',
  'users_permissions_user',
  'metadata',
  'messagesSentCount',
  'lastMessageSentAt',
  'lastMessageRecipientCount',
  'captureSurfaceBreakdown',
  'cityBreakdown',
  'interactionBreakdown',
  'newFanCheckIns',
  'knownFanCheckIns',
  'averageCheckInConfidence',
  'fansCaptured',
  'suppressedDuplicate',
];

function displayableUrl(url) {
  const raw = url ? String(url) : '';
  if (!raw || raw.startsWith('faneqo-protected://')) return null;
  // Signed capability URLs only. Public S3 objects stay displayable.
  if (/X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token/i.test(raw)) return null;
  return raw;
}

function toPublicSafeImage(value) {
  if (!value || typeof value !== 'object') return null;
  if (mediaPure.isProtectedFile(value) || value.protected === true) return null;
  const formats = value.formats && typeof value.formats === 'object' ? value.formats : {};
  const raw = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || value.url || null;
  const url = displayableUrl(raw);
  if (!url) return null;
  return {
    url,
    width: value.width || formats.medium?.width || null,
    height: value.height || formats.medium?.height || null,
    alternativeText: value.alternativeText || value.alt || null,
  };
}

function nightCoverImage({ recap } = {}) {
  return toPublicSafeImage(recap?.coverImage) || null;
}

function nightShareImage({ recap, event, artist } = {}) {
  return toPublicSafeImage(recap?.coverImage)
    || toPublicSafeImage(event?.image)
    || toPublicSafeImage(artist?.bandImg || artist?.image)
    || null;
}

function nightHeroImage({ recap } = {}) {
  return toPublicSafeImage(recap?.heroImage) || null;
}

function nightHeroFocal(value) {
  if (value == null || value === '') return 50;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  return 50;
}

function firstPublicGalleryImage(files) {
  const list = Array.isArray(files) ? files : [];
  for (const file of list) {
    const image = toPublicSafeImage(file);
    if (image) return image;
  }
  return null;
}

function galleryShareImage({ visibility, mediaFiles, recap, event, artist } = {}) {
  if (visibility === 'public') {
    return firstPublicGalleryImage(mediaFiles)
      || nightShareImage({ recap, event, artist });
  }
  return nightShareImage({ recap, event, artist });
}

function cleanSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, '');
}

function nightCanonicalPath(bandSlug, nightSlug) {
  const band = cleanSlug(bandSlug);
  const night = cleanSlug(nightSlug);
  if (!band || !night) return null;
  return `/${band}/night/${night}`;
}

function galleryCanonicalPath(bandSlug, gallerySlug) {
  const band = cleanSlug(bandSlug);
  const gallery = cleanSlug(gallerySlug);
  if (!band || !gallery) return null;
  return `/${band}/gallery/${gallery}`;
}

function excerpt(text, max = SHARE_DESCRIPTION_MAX) {
  const cleaned = String(text || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trim()}…`;
}

function placeLine({ artistName, venue, city } = {}) {
  const artist = String(artistName || '').trim();
  const hall = String(venue || '').trim();
  const town = String(city || '').trim();
  if (artist && hall && town) return `${artist} at ${hall} · ${town}`;
  if (artist && hall) return `${artist} at ${hall}`;
  if (artist && town) return `${artist} in ${town}`;
  if (hall && town) return `${hall} · ${town}`;
  return artist || hall || town || null;
}

function nightShareTitle({ artistName, venue, city } = {}) {
  return placeLine({ artistName, venue, city }) || 'A night on Faneqo';
}

function nightShareDescription({ publicStory, artistName, venue, city, privateArtistNote } = {}) {
  if (privateArtistNote) {
    // Explicitly ignored. Private notes never enter share copy.
  }
  return excerpt(publicStory)
    || placeLine({ artistName, venue, city })
    || 'A night worth remembering.';
}

function galleryShareDescription({
  visibility,
  caption,
  publicStory,
  artistName,
  venue,
  city,
  privateArtistNote,
} = {}) {
  if (privateArtistNote) {
    // Explicitly ignored.
  }
  if (visibility === 'public') {
    return excerpt(caption)
      || excerpt(publicStory)
      || placeLine({ artistName, venue, city })
      || 'Photos from the night.';
  }
  return excerpt(publicStory)
    || placeLine({ artistName, venue, city })
    || 'Photos from the night.';
}

function publicLineup(lineup) {
  if (!Array.isArray(lineup)) return null;
  return lineup.map((row, index) => ({
    name: row?.name || null,
    role: row?.role || null,
    order: Number.isInteger(row?.order) ? row.order : index,
    bandId: row?.bandId || null,
  }));
}

function publicArtist({
  id,
  name,
  slug,
  image,
  bandImg,
  layoutConfig,
  cyberedImagePositionX,
  cyberedImagePositionY,
} = {}) {
  if (!id && !slug && !name) return null;
  const fit = layoutConfig && typeof layoutConfig === 'object' ? layoutConfig.imageFit : null;
  const focalX = Number(cyberedImagePositionX);
  const focalY = Number(cyberedImagePositionY);
  return {
    id: id || null,
    name: name ? String(name).trim() : null,
    slug: slug || null,
    image: toPublicSafeImage(image || bandImg),
    imageFit: fit || null,
    focalX: Number.isFinite(focalX) ? focalX : null,
    focalY: Number.isFinite(focalY) ? focalY : null,
  };
}

function publicViewer({
  authenticated = false,
  youWereThere = false,
  showOrdinal = null,
  isArtist = false,
} = {}) {
  const viewer = {
    authenticated: !!authenticated,
    youWereThere: !!youWereThere,
  };
  if (youWereThere && Number.isInteger(showOrdinal) && showOrdinal > 0) {
    viewer.showOrdinal = showOrdinal;
  }
  if (isArtist) viewer.isArtist = true;
  return viewer;
}

function anonymousViewer() {
  return { authenticated: false, youWereThere: false };
}

function publicNightFields({
  recap,
  event,
  artist,
  attendanceCount = 0,
} = {}) {
  const date = recap?.performanceStartsAt || recap?.showStartedAt || event?.date || null;
  return {
    nightSlug: recap?.nightSlug || null,
    title: recap?.showTitle || event?.title || null,
    venue: recap?.venue || event?.venue || null,
    city: recap?.city || event?.city || null,
    region: recap?.region || event?.state || null,
    country: recap?.country || event?.country || null,
    date,
    performanceStartsAt: recap?.performanceStartsAt || recap?.showStartedAt || null,
    performanceEndsAt: recap?.performanceEndsAt || recap?.showEndedAt || null,
    timezone: recap?.timezone || null,
    publicStory: recap?.publicStory || null,
    lineup: publicLineup(recap?.lineup),
    cover: nightCoverImage({ recap }),
    eventImage: toPublicSafeImage(event?.image),
    hero: nightHeroImage({ recap }),
    heroFocalX: nightHeroFocal(recap?.heroFocalX),
    heroFocalY: nightHeroFocal(recap?.heroFocalY),
    attendanceCount: Number.isFinite(Number(attendanceCount)) ? Number(attendanceCount) : 0,
  };
}

function nightShare({ artist, night, recap, event } = {}) {
  const artistName = artist?.name || null;
  return {
    canonicalPath: nightCanonicalPath(artist?.slug, night?.nightSlug || recap?.nightSlug),
    title: nightShareTitle({
      artistName,
      venue: night?.venue || recap?.venue,
      city: night?.city || recap?.city,
    }),
    description: nightShareDescription({
      publicStory: night?.publicStory || recap?.publicStory,
      artistName,
      venue: night?.venue || recap?.venue,
      city: night?.city || recap?.city,
      privateArtistNote: recap?.privateArtistNote,
    }),
    image: nightShareImage({ recap, event, artist }),
  };
}

function galleryShare({
  artist,
  gallerySlug,
  visibility,
  caption,
  mediaFiles,
  recap,
  event,
} = {}) {
  return {
    canonicalPath: galleryCanonicalPath(artist?.slug, gallerySlug),
    title: nightShareTitle({
      artistName: artist?.name,
      venue: recap?.venue || event?.venue,
      city: recap?.city || event?.city,
    }),
    description: galleryShareDescription({
      visibility,
      caption,
      publicStory: recap?.publicStory,
      artistName: artist?.name,
      venue: recap?.venue || event?.venue,
      city: recap?.city || event?.city,
      privateArtistNote: recap?.privateArtistNote,
    }),
    image: galleryShareImage({
      visibility,
      mediaFiles,
      recap,
      event,
      artist,
    }),
  };
}

function publicGalleryCard(teaser, { bandSlug } = {}) {
  if (!teaser) return null;
  return {
    // Lets a signed-in fan save an open gallery to Passport. The save route
    // re-checks access; a locked gallery gets no id.
    id: teaser.locked ? null : (Number(teaser.id) || null),
    slug: teaser.slug || null,
    title: teaser.title || null,
    caption: teaser.locked ? '' : (teaser.bodyText || ''),
    visibility: teaser.visibility || null,
    photoCount: teaser.photoCount || 0,
    publishedAt: teaser.publishedAt || null,
    locked: !!teaser.locked,
    lockReason: teaser.locked ? (teaser.lockReason || null) : null,
    youWereThere: !!teaser.youWereThere,
    media: teaser.locked ? [] : (Array.isArray(teaser.media) ? teaser.media : []),
    canonicalPath: galleryCanonicalPath(bandSlug, teaser.slug),
  };
}

function collectKeys(value, out = new Set()) {
  if (!value || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    value.forEach((item) => collectKeys(item, out));
    return out;
  }
  for (const [key, child] of Object.entries(value)) {
    out.add(key);
    collectKeys(child, out);
  }
  return out;
}

function publicPayloadForbiddenKeys(payload) {
  const keys = collectKeys(payload);
  return FORBIDDEN_PUBLIC_KEYS.filter((key) => keys.has(key));
}

function payloadContainsText(payload, needle) {
  if (!needle) return false;
  return JSON.stringify(payload).includes(String(needle));
}

module.exports = {
  SHARE_DESCRIPTION_MAX,
  PUBLIC_NIGHT_ROOT_KEYS,
  PUBLIC_GALLERY_ROOT_KEYS,
  PUBLIC_ARTIST_KEYS,
  PUBLIC_NIGHT_KEYS,
  PUBLIC_GALLERY_KEYS,
  PUBLIC_VIEWER_KEYS,
  PUBLIC_SHARE_KEYS,
  PUBLIC_IMAGE_KEYS,
  PUBLIC_LINEUP_KEYS,
  FORBIDDEN_PUBLIC_KEYS,
  toPublicSafeImage,
  nightCoverImage,
  nightShareImage,
  nightHeroImage,
  nightHeroFocal,
  firstPublicGalleryImage,
  galleryShareImage,
  nightCanonicalPath,
  galleryCanonicalPath,
  excerpt,
  placeLine,
  nightShareTitle,
  nightShareDescription,
  galleryShareDescription,
  publicLineup,
  publicArtist,
  publicViewer,
  anonymousViewer,
  publicNightFields,
  nightShare,
  galleryShare,
  publicGalleryCard,
  publicPayloadForbiddenKeys,
  payloadContainsText,
};
