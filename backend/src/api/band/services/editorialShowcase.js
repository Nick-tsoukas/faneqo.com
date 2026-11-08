'use strict';

const {
  hasEditorialShowcaseAccess,
  isAllowlistedEmail,
} = require('../../../../config/editorialShowcase');

const EDITORIAL_FIELDS = [
  'editorialShowcaseEnabled',
  'publicationHeaderImageMode',
  'editorialSectionTitle',
  'editorialArchiveUrl',
  'editorialArchiveLabel',
  'editorialItems',
];

const VALID_PUBLICATION_HEADER_IMAGE_MODES = new Set(['contain_blur', 'cinematic_cover']);

const VALID_CONTENT_TYPES = new Set([
  'article',
  'video',
  'interview',
  'concert_review',
  'music_news',
  'photo_gallery',
  'album_review',
]);

const MAX_ITEMS = 6;
const MAX_EXCERPT = 160;

function normalizeUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    if (/^www\./i.test(url)) url = `https://${url}`;
    else url = `https://www.${url}`;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

function stripHtml(str) {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

function sanitizeItem(item) {
  if (!item || typeof item !== 'object') return null;

  const title = stripHtml(String(item.title || '')).trim();
  const url = normalizeUrl(item.url);
  const contentType = VALID_CONTENT_TYPES.has(item.contentType)
    ? item.contentType
    : 'article';

  if (!title || !url) return null;

  let excerpt = stripHtml(String(item.excerpt || '')).trim();
  if (excerpt.length > MAX_EXCERPT) {
    excerpt = excerpt.slice(0, MAX_EXCERPT);
  }

  const category = stripHtml(String(item.category || '')).trim() || null;

  const sanitized = {
    contentType,
    title,
    url,
    category,
    excerpt: excerpt || null,
    isFeatured: item.isFeatured === true,
  };

  if (item.image != null) {
    if (typeof item.image === 'number' || typeof item.image === 'string') {
      sanitized.image = item.image;
    } else if (item.image?.id) {
      sanitized.image = item.image.id;
    }
  }

  if (item.id) sanitized.id = item.id;

  return sanitized;
}

function sanitizeEditorialItems(items) {
  if (!Array.isArray(items)) return [];

  const sanitized = items
    .map(sanitizeItem)
    .filter(Boolean)
    .slice(0, MAX_ITEMS);

  let featuredIndex = sanitized.findIndex((i) => i.isFeatured);
  if (featuredIndex === -1 && sanitized.length > 0) {
    sanitized[0].isFeatured = true;
    featuredIndex = 0;
  } else if (featuredIndex !== -1) {
    sanitized.forEach((item, idx) => {
      item.isFeatured = idx === featuredIndex;
    });
  }

  return sanitized;
}

/**
 * Removes every editorial key from a payload. On create the profile starts
 * with the showcase off. On update the keys are only dropped, so whatever the
 * profile already stores is left exactly as it is.
 */
function stripEditorialFields(data, { mode = 'create' } = {}) {
  if (!data || typeof data !== 'object') return;
  for (const key of EDITORIAL_FIELDS) {
    delete data[key];
  }
  if (mode !== 'update') data.editorialShowcaseEnabled = false;
}

/**
 * Someone without the editorial entitlement (a manager, or an account that
 * lost access) cannot change editorial settings, and saving an unrelated
 * field never switches an enabled publication off.
 */
function sanitizeEditorialPayload(data, user, { mode = 'create' } = {}) {
  if (!data || typeof data !== 'object') return data;

  if (!hasEditorialShowcaseAccess(user)) {
    stripEditorialFields(data, { mode });
    return data;
  }

  const hasEditorialKeys = EDITORIAL_FIELDS.some((k) =>
    Object.prototype.hasOwnProperty.call(data, k)
  );
  if (!hasEditorialKeys) return data;

  if ('editorialShowcaseEnabled' in data) {
    data.editorialShowcaseEnabled = data.editorialShowcaseEnabled === true;
  }

  if ('publicationHeaderImageMode' in data) {
    data.publicationHeaderImageMode = VALID_PUBLICATION_HEADER_IMAGE_MODES.has(
      data.publicationHeaderImageMode
    )
      ? data.publicationHeaderImageMode
      : 'contain_blur';
  }

  if ('editorialSectionTitle' in data) {
    const t = stripHtml(String(data.editorialSectionTitle || '')).trim();
    data.editorialSectionTitle = t || null;
  }

  if ('editorialArchiveUrl' in data) {
    data.editorialArchiveUrl = normalizeUrl(data.editorialArchiveUrl);
  }

  if ('editorialArchiveLabel' in data) {
    const l = stripHtml(String(data.editorialArchiveLabel || '')).trim();
    data.editorialArchiveLabel = l || null;
  }

  if ('editorialItems' in data) {
    data.editorialItems = sanitizeEditorialItems(data.editorialItems);
    if (!data.editorialShowcaseEnabled) {
      data.editorialItems = data.editorialItems || [];
    }
  }

  return data;
}

async function syncEditorialAccessForUser(strapi, user) {
  if (!user?.id || !user?.email) return user;
  if (user.editorialShowcaseAccess === true) return user;
  if (!isAllowlistedEmail(user.email)) return user;

  try {
    await strapi.entityService.update(
      'plugin::users-permissions.user',
      user.id,
      { data: { editorialShowcaseAccess: true } }
    );
    return { ...user, editorialShowcaseAccess: true };
  } catch (err) {
    strapi.log.warn('[editorialShowcase] Failed to sync user access:', err?.message);
    return user;
  }
}

async function resolveRequestUser(strapi, ctx) {
  const authUser = ctx.state?.user;
  if (!authUser?.id) return null;

  try {
    const full = await strapi.entityService.findOne(
      'plugin::users-permissions.user',
      authUser.id,
      { fields: ['id', 'email', 'editorialShowcaseAccess'] }
    );
    return syncEditorialAccessForUser(strapi, full);
  } catch {
    return authUser;
  }
}

module.exports = {
  EDITORIAL_FIELDS,
  MAX_ITEMS,
  sanitizeEditorialPayload,
  stripEditorialFields,
  sanitizeEditorialItems,
  resolveRequestUser,
  syncEditorialAccessForUser,
  hasEditorialShowcaseAccess,
};
