/**
 * Editorial Showcase helpers — content types, labels, and item normalization.
 */

export const EDITORIAL_CONTENT_TYPES = [
  { value: 'article', label: 'Article' },
  { value: 'video', label: 'Video' },
  { value: 'interview', label: 'Interview' },
  { value: 'concert_review', label: 'Concert Review' },
  { value: 'music_news', label: 'Music News' },
  { value: 'photo_gallery', label: 'Photo Gallery' },
  { value: 'album_review', label: 'Album Review' },
];

export const EDITORIAL_MAX_ITEMS = 6;

// Used only when a profile saved no title and has no name to put in one.
export const DEFAULT_SECTION_TITLE = 'Latest stories';
export const DEFAULT_ARCHIVE_LABEL = 'Explore the archive';

/** Fallback headings built from the profile's own publication name. Saved titles always win. */
export function editorialDefaults(publicationName) {
  const name = String(publicationName || '').trim();
  if (!name) return { sectionTitle: DEFAULT_SECTION_TITLE, archiveLabel: DEFAULT_ARCHIVE_LABEL };
  return { sectionTitle: `Latest from ${name}`, archiveLabel: `Explore ${name}` };
}

const ACTION_LABELS = {
  article: 'Read Article',
  video: 'Watch Video',
  interview: 'Read Interview',
  concert_review: 'Read Review',
  music_news: 'Read Article',
  photo_gallery: 'View Gallery',
  album_review: 'Read Review',
};

const ANALYTICS_PLATFORMS = {
  article: 'editorial_article',
  video: 'editorial_video',
  interview: 'editorial_interview',
  concert_review: 'editorial_concert_review',
  music_news: 'editorial_music_news',
  photo_gallery: 'editorial_photo_gallery',
  album_review: 'editorial_album_review',
};

const TYPE_DISPLAY = {
  article: 'Article',
  video: 'Video',
  interview: 'Interview',
  concert_review: 'Concert Review',
  music_news: 'Music News',
  photo_gallery: 'Photo Gallery',
  album_review: 'Album Review',
};

export function getEditorialActionLabel(contentType) {
  return ACTION_LABELS[contentType] || 'Read More';
}

export function getEditorialAnalyticsPlatform(contentType) {
  return ANALYTICS_PLATFORMS[contentType] || 'editorial_article';
}

export function getEditorialTypeLabel(contentType) {
  return TYPE_DISPLAY[contentType] || 'Article';
}

export function resolveEditorialImageUrl(image, strapiBase = '') {
  if (!image) return null;
  let url = null;
  if (typeof image === 'string') {
    url = image;
  } else {
    url =
      image.url ||
      image?.data?.attributes?.url ||
      image?.attributes?.url ||
      null;
  }
  if (url && url.startsWith('/') && strapiBase) {
    url = `${String(strapiBase).replace(/\/$/, '')}${url}`;
  }
  return url;
}

export function normalizeEditorialItem(raw, strapiBase = '') {
  if (!raw || typeof raw !== 'object') return null;

  const title = String(raw.title || '').trim();
  const url = String(raw.url || '').trim();
  if (!title || !url || !/^https?:\/\//i.test(url)) return null;

  const contentType = ANALYTICS_PLATFORMS[raw.contentType]
    ? raw.contentType
    : 'article';

  return {
    id: raw.id ?? null,
    contentType,
    title,
    url,
    category: String(raw.category || '').trim() || null,
    excerpt: String(raw.excerpt || '').trim() || null,
    isFeatured: raw.isFeatured === true,
    imageUrl: resolveEditorialImageUrl(raw.image, strapiBase),
  };
}

export function resolveEditorialShowcase(items, enabled, sectionTitle, archiveUrl, archiveLabel, strapiBase = '', publicationName = '') {
  if (!enabled) return null;

  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => normalizeEditorialItem(item, strapiBase))
    .filter(Boolean);

  if (normalized.length === 0) return null;

  let featuredIndex = normalized.findIndex((i) => i.isFeatured);
  if (featuredIndex === -1) featuredIndex = 0;

  const featured = normalized[featuredIndex];
  const supporting = normalized.filter((_, idx) => idx !== featuredIndex);

  const archiveHref =
    archiveUrl && /^https?:\/\//i.test(String(archiveUrl).trim())
      ? String(archiveUrl).trim()
      : null;

  const defaults = editorialDefaults(publicationName);
  return {
    sectionTitle: String(sectionTitle || '').trim() || defaults.sectionTitle,
    featured,
    supporting,
    archiveHref,
    archiveLabel: String(archiveLabel || '').trim() || defaults.archiveLabel,
  };
}

export const EDITORIAL_EXCERPT_MAX = 160;
export const EDITORIAL_TITLE_MAX = 120;

/**
 * Returns a map of field -> message for an editorial item, or {} when valid.
 * Mirrors the backend's title/url/contentType requirements.
 */
export function validateEditorialItem(item) {
  const errors = {};
  const title = String(item?.title || '').trim();
  const url = String(item?.url || '').trim();
  const excerpt = String(item?.excerpt || '');

  if (!title) errors.title = 'Title is required.';
  if (!url) errors.url = 'URL is required.';
  else if (!/^https?:\/\//i.test(url)) errors.url = 'Enter a valid http:// or https:// URL.';
  if (!item?.contentType) errors.contentType = 'Choose a content type.';
  if (excerpt.length > EDITORIAL_EXCERPT_MAX) {
    errors.excerpt = `Keep the excerpt under ${EDITORIAL_EXCERPT_MAX} characters.`;
  }
  return errors;
}

/** A complete, publishable story (passes the same gate as the public renderer). */
export function isCompleteEditorialItem(item) {
  return Object.keys(validateEditorialItem(item)).length === 0;
}

export function createEmptyEditorialItem() {
  return {
    contentType: 'article',
    title: '',
    url: '',
    category: '',
    excerpt: '',
    isFeatured: false,
    image: null,
    imagePreviewUrl: null,
    _pendingImageFile: null,
  };
}
