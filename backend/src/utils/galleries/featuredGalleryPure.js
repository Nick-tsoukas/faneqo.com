'use strict';

/**
 * Featured Gallery is a single Band selection.
 * The published gallery record is an Artist Update. There is no Gallery collection.
 */

const updates = require('../artistUpdates/artistUpdatePure');

const PUBLIC_PHOTO_KEYS = ['id', 'url', 'thumbnailUrl', 'width', 'height', 'alt'];

function galleryCanonicalPath(bandSlug, gallerySlug) {
  const band = String(bandSlug || '').trim();
  const gallery = String(gallerySlug || '').trim();
  if (!band || !gallery) return '';
  return `/${band}/gallery/${gallery}`;
}

function displayablePhotos(update) {
  if (!update || update.visibility !== 'public') return [];
  const files = Array.isArray(update.media) ? update.media : (Array.isArray(update.mediaFiles) ? update.mediaFiles : []);
  return updates.serializeUpdateMediaList(files, {
    updateId: update.id,
    visibility: 'public',
    captions: null,
  }).filter((item) => item && item.protected !== true && item.url);
}

const ARTIST_PAGE_GALLERY_LAYOUTS = new Set(['default', 'smartlink', 'compact', 'bold']);

/**
 * true  — artist asked to show this gallery, even if one is already showing
 * false — artist turned the option off; never fill an empty artist page
 * undefined — unspecified; show it only when the artist page has no gallery
 */
function parseShowOnArtistPage(value) {
  if (value === true) return true;
  if (value === false) return false;
  return undefined;
}

function artistPageDisplaysGallery(pageStyle) {
  const style = String(pageStyle || 'smartlink').trim();
  return ARTIST_PAGE_GALLERY_LAYOUTS.has(style);
}

function featureBlockReason(update) {
  if (!update) return { error: 'not_found', status: 404, message: 'Gallery not found' };
  if (update.status === 'hidden') {
    return { error: 'ineligible', status: 400, message: 'This gallery is hidden.' };
  }
  if (update.status !== 'published') {
    return { error: 'ineligible', status: 400, message: 'Publish this gallery before showing it on your artist page.' };
  }
  if (update.visibility !== 'public') {
    return { error: 'ineligible', status: 400, message: 'Only galleries visible to Everyone can be shown on your artist page.' };
  }
  if (!displayablePhotos(update).length) {
    return { error: 'ineligible', status: 400, message: 'Add a photo before showing this gallery on your artist page.' };
  }
  return null;
}

function toPublicPhoto(item) {
  const full = item.largeUrl || item.url;
  return {
    id: item.id,
    url: full,
    thumbnailUrl: item.thumbnailUrl || item.thumbUrl || full || null,
    width: item.width || null,
    height: item.height || null,
    alt: item.alt || '',
  };
}

/**
 * One publicly listed gallery. Cover and count only — the gallery page
 * still loads the full photograph set. Same eligibility as featuring.
 */
function toPublicGalleryIndexCard(update, { bandSlug } = {}) {
  if (featureBlockReason(update)) return null;
  const photos = displayablePhotos(update).map(toPublicPhoto).filter((photo) => photo.url);
  const cover = photos[0];
  if (!cover) return null;
  const slug = update.slug || null;
  return {
    id: update.id,
    title: update.title || '',
    slug,
    canonicalPath: galleryCanonicalPath(bandSlug, slug),
    photoCount: photos.length,
    cover,
  };
}

function toPublicFeaturedGallery(update, { bandSlug } = {}) {
  const block = featureBlockReason(update);
  if (block) return null;
  const photos = displayablePhotos(update).map(toPublicPhoto).filter((photo) => photo.url);
  if (!photos.length) return null;
  const slug = update.slug || null;
  return {
    id: update.id,
    title: update.title || '',
    slug,
    photoCount: photos.length,
    canonicalPath: galleryCanonicalPath(bandSlug, slug),
    photos,
  };
}

function relationId(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value.id || value.data?.id || null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/** Mark the one listed gallery the band currently points at. */
function stampFeaturedOnProfile(rows, featuredId) {
  const id = relationId(featuredId);
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    featuredOnProfile: id != null && Number(row?.id) === Number(id),
  }));
}

module.exports = {
  PUBLIC_PHOTO_KEYS,
  galleryCanonicalPath,
  displayablePhotos,
  ARTIST_PAGE_GALLERY_LAYOUTS,
  parseShowOnArtistPage,
  artistPageDisplaysGallery,
  featureBlockReason,
  toPublicGalleryIndexCard,
  toPublicFeaturedGallery,
  relationId,
  stampFeaturedOnProfile,
};
