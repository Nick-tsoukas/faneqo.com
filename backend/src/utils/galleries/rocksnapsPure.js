'use strict';

/**
 * RockSnaps publication is a second surface on an artist-update gallery.
 * The configured band id is the authority. The slug is only a mismatch tripwire.
 * Missing or invalid configuration fails closed.
 */

const updates = require('../artistUpdates/artistUpdatePure');

const EXPECTED_SLUG = 'rocksnapsphotography';
const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;
const LIST_SCAN_LIMIT = 200;
const SIGNED_URL = /X-Amz-Signature|X-Amz-Credential|X-Amz-Security-Token/i;

const PUBLIC_LIST_KEYS = [
  'slug',
  'title',
  'description',
  'cover',
  'photoCount',
  'publishedAt',
  'rocksnapsPublishedAt',
  'artist',
];
const PUBLIC_DETAIL_KEYS = [...PUBLIC_LIST_KEYS, 'photos'];
const PUBLIC_PHOTO_KEYS = ['order', 'url', 'thumbnailUrl', 'width', 'height', 'alt', 'caption'];
const PUBLIC_COVER_KEYS = ['url', 'width', 'height', 'alt'];
const PUBLIC_ARTIST_KEYS = ['name', 'slug'];

function readConfig(env = process.env) {
  const raw = String(env.ROCKSNAPS_BAND_ID ?? '').trim();
  if (!/^[1-9]\d*$/.test(raw)) {
    return { ok: false, reason: 'unconfigured', bandId: null, expectedSlug: EXPECTED_SLUG };
  }
  return { ok: true, reason: 'configured', bandId: Number(raw), expectedSlug: EXPECTED_SLUG };
}

function relationId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number' || typeof value === 'string') {
    const id = parseInt(value, 10);
    return Number.isFinite(id) && id > 0 ? id : null;
  }
  if (Array.isArray(value)) return relationId(value[0]);
  if (typeof value === 'object') {
    if (value.id != null) return relationId(value.id);
    if (value.connect != null) return relationId(value.connect);
    if (value.set != null) return relationId(value.set);
  }
  return null;
}

function bandMatches(band, config) {
  if (!config?.ok || !band) return false;
  const id = relationId(band.id != null ? band.id : band);
  return id === config.bandId && String(band.slug || '') === config.expectedSlug;
}

function parseFlag(value) {
  if (value === true || value === false) return { value };
  return {
    error: 'invalid_flag',
    status: 400,
    message: 'showOnRockSnaps must be true or false.',
  };
}

function safeUrl(value) {
  const raw = value ? String(value) : '';
  if (!raw || raw.startsWith('faneqo-protected://')) return null;
  if (SIGNED_URL.test(raw)) return null;
  return raw;
}

function descriptionOf(update) {
  const text = String(update?.bodyText || '').trim();
  return text || null;
}

function publicPhotos(update) {
  if (!update || update.visibility !== 'public' || update.status !== 'published' || update.showOnRockSnaps !== true) {
    return [];
  }
  const files = Array.isArray(update.media) ? update.media : [];
  const captions = update.mediaCaptions && typeof update.mediaCaptions === 'object' ? update.mediaCaptions : null;
  return updates.serializeUpdateMediaList(files, {
    updateId: update.id,
    visibility: 'public',
    captions,
  }).map((item) => {
    if (!item || item.protected === true) return null;
    const url = safeUrl(item.largeUrl) || safeUrl(item.originalUrl) || safeUrl(item.url);
    const thumbnailUrl = safeUrl(item.thumbnailUrl) || safeUrl(item.url) || url;
    if (!url || !thumbnailUrl) return null;
    return {
      mediaId: item.mediaId || item.id || null,
      order: item.order,
      url,
      thumbnailUrl,
      width: item.width || null,
      height: item.height || null,
      alt: item.alt || '',
      caption: item.caption || null,
    };
  }).filter(Boolean);
}

function coverFromPhotos(update, photos) {
  const coverId = parseInt(update?.coverMediaId, 10);
  if (coverId) {
    const chosen = photos.find((photo) => Number(photo.mediaId) === coverId);
    if (chosen) return chosen;
  }
  return photos[0] || null;
}

function presentCover(photo) {
  if (!photo) return null;
  return {
    url: photo.url,
    width: photo.width,
    height: photo.height,
    alt: photo.alt || '',
  };
}

function presentPhoto(photo) {
  return {
    order: photo.order,
    url: photo.url,
    thumbnailUrl: photo.thumbnailUrl,
    width: photo.width,
    height: photo.height,
    alt: photo.alt || '',
    caption: photo.caption || null,
  };
}

function presentArtist(band) {
  return {
    name: band?.name ? String(band.name) : '',
    slug: band?.slug ? String(band.slug) : '',
  };
}

function toListCard(update, band) {
  const photos = publicPhotos(update);
  const cover = coverFromPhotos(update, photos);
  if (!cover) return null;
  return {
    slug: update.slug || null,
    title: update.title || '',
    description: descriptionOf(update),
    cover: presentCover(cover),
    photoCount: photos.length,
    publishedAt: update.publishedAt || null,
    rocksnapsPublishedAt: update.rocksnapsPublishedAt || null,
    artist: presentArtist(band),
  };
}

function toDetail(update, band) {
  const card = toListCard(update, band);
  if (!card) return null;
  const photos = publicPhotos(update).map(presentPhoto);
  return { ...card, photos };
}

function comparePublication(a, b) {
  const aRock = a?.rocksnapsPublishedAt || '';
  const bRock = b?.rocksnapsPublishedAt || '';
  if (aRock !== bRock) return aRock < bRock ? 1 : -1;
  const aPublished = a?.publishedAt || '';
  const bPublished = b?.publishedAt || '';
  if (aPublished !== bPublished) return aPublished < bPublished ? 1 : -1;
  return String(a?.slug || '').localeCompare(String(b?.slug || ''));
}

function parsePage(query = {}) {
  const pageMissing = query.page == null || query.page === '';
  const sizeMissing = query.pageSize == null || query.pageSize === '';
  const page = pageMissing ? 1 : Number(query.page);
  const pageSize = sizeMissing ? DEFAULT_PAGE_SIZE : Number(query.pageSize);
  if (!Number.isInteger(page) || page < 1) {
    return { error: 'invalid_page', status: 400, message: 'Page must be a positive integer.' };
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    return { error: 'invalid_page', status: 400, message: `pageSize must be between 1 and ${MAX_PAGE_SIZE}.` };
  }
  return { page, pageSize };
}

function paginate(rows, { page, pageSize }) {
  const list = Array.isArray(rows) ? rows : [];
  const start = (page - 1) * pageSize;
  return {
    data: list.slice(start, start + pageSize),
    meta: {
      page,
      pageSize,
      total: list.length,
      pageCount: list.length === 0 ? 0 : Math.ceil(list.length / pageSize),
    },
  };
}

/**
 * Last line of defense for writes that do not go through the RockSnaps route.
 * An explicit false with no timestamp is a no-op. Enabling requires the
 * configured band, a published public gallery, and a rising-edge timestamp.
 */
function sanitizeRocksnapsWrite(data, context = {}) {
  if (!data || typeof data !== 'object') return { action: 'ignore' };
  const hasFlag = Object.prototype.hasOwnProperty.call(data, 'showOnRockSnaps');
  const hasAt = Object.prototype.hasOwnProperty.call(data, 'rocksnapsPublishedAt');
  if (!hasFlag && !hasAt) return { action: 'ignore' };

  const enabling = data.showOnRockSnaps === true;
  const clientStamp = hasAt && data.rocksnapsPublishedAt != null && data.rocksnapsPublishedAt !== '';
  if (!enabling && !clientStamp) {
    if (hasFlag) data.showOnRockSnaps = false;
    if (hasAt) data.rocksnapsPublishedAt = null;
    return { action: 'ignore' };
  }

  const eligible = context.allowed === true
    && context.status === 'published'
    && context.visibility === 'public';

  if (!enabling || !eligible) {
    data.showOnRockSnaps = false;
    if (!enabling && context.allowed === true) {
      if (hasAt) delete data.rocksnapsPublishedAt;
    } else {
      data.rocksnapsPublishedAt = null;
    }
    return { action: enabling ? 'forced-off' : 'disabled' };
  }

  data.showOnRockSnaps = true;
  if (context.currentlyEnabled === true) {
    if (hasAt) delete data.rocksnapsPublishedAt;
  } else {
    data.rocksnapsPublishedAt = context.now || new Date().toISOString();
  }
  return { action: 'enabled' };
}

function decorateManage(data, env = process.env) {
  if (!data || typeof data !== 'object') return data;
  const config = readConfig(env);
  const eligible = config.ok
    && Number(data.bandId) === config.bandId
    && String(data.bandSlug || '') === config.expectedSlug;
  const enabled = data.showOnRockSnaps === true;
  const publishedPublic = data.status === 'published' && data.visibility === 'public';
  let reason = null;
  if (eligible && !enabled) {
    if (data.status === 'hidden') reason = 'This gallery is hidden.';
    else if (data.status !== 'published') reason = 'Publish this gallery before showing it on RockSnaps.';
    else if (data.visibility !== 'public') reason = 'Make this gallery public before showing it on RockSnaps.';
  }
  data.rocksnaps = {
    eligible,
    enabled: eligible && enabled,
    publishedAt: eligible && enabled ? (data.rocksnapsPublishedAt || null) : null,
    canEnable: eligible && publishedPublic,
    reason,
  };
  delete data.showOnRockSnaps;
  delete data.rocksnapsPublishedAt;
  return data;
}

/**
 * Authenticated gallery-list status. A hidden or restricted gallery is not
 * described as on RockSnaps, even when the stored flag is still true.
 * Unrelated bands receive no RockSnaps field.
 */
function stampManageList(row, eligible) {
  if (!row || typeof row !== 'object') return row;
  const onRockSnaps = eligible === true
    && row.showOnRockSnaps === true
    && row.status === 'published'
    && row.visibility === 'public';
  delete row.showOnRockSnaps;
  delete row.rocksnapsPublishedAt;
  if (eligible === true) row.rocksnaps = { onRockSnaps };
  else delete row.rocksnaps;
  return row;
}

function notFound() {
  return { error: 'not_found', status: 404, message: 'Gallery not found' };
}

module.exports = {
  EXPECTED_SLUG,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  LIST_SCAN_LIMIT,
  PUBLIC_LIST_KEYS,
  PUBLIC_DETAIL_KEYS,
  PUBLIC_PHOTO_KEYS,
  PUBLIC_COVER_KEYS,
  PUBLIC_ARTIST_KEYS,
  readConfig,
  relationId,
  bandMatches,
  parseFlag,
  safeUrl,
  publicPhotos,
  toListCard,
  toDetail,
  comparePublication,
  parsePage,
  paginate,
  sanitizeRocksnapsWrite,
  decorateManage,
  stampManageList,
  notFound,
};
