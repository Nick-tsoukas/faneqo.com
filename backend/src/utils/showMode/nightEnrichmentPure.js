'use strict';

/**
 * Post-show Night enrichment on ShowRecap.
 * Artist-authored fields only. No HTML. No private text on Band.
 */

const PUBLIC_STORY_MAX = 5000;
const PRIVATE_NOTE_MAX = 10000;
const LINEUP_MAX = 50;
const LINEUP_NAME_MAX = 160;
const LINEUP_ROLE_MAX = 40;

const LINEUP_ROLES = [
  'headliner',
  'co_headliner',
  'direct_support',
  'support',
  'opener',
  'guest',
  'other',
];

const ROLE_ALIASES = {
  headline: 'headliner',
  headliner: 'headliner',
  coheadliner: 'co_headliner',
  co_headliner: 'co_headliner',
  'co-headliner': 'co_headliner',
  directsupport: 'direct_support',
  direct_support: 'direct_support',
  'direct-support': 'direct_support',
  support: 'support',
  opener: 'opener',
  opening: 'opener',
  guest: 'guest',
  other: 'other',
};

const ARTIST_NIGHT_FIELDS = [
  'publicStory',
  'privateArtistNote',
  'lineup',
  'coverImage',
  'nightSlug',
  'heroImage',
  'heroFocalX',
  'heroFocalY',
];

const DEFAULT_HERO_FOCAL = 50;

function trimText(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return null;
  const text = value.replace(/\r\n/g, '\n').trim();
  return text || null;
}

function stripHtml(value) {
  if (typeof value !== 'string') return value;
  return value.replace(/<[^>]*>/g, '');
}

function normalizeMultiline(value, { max, field }) {
  if (value === undefined) return { omitted: true };
  if (value === null) return { value: null };
  if (typeof value !== 'string') {
    return { error: 'invalid_text', field, status: 400, message: `${field} must be text.` };
  }
  const cleaned = trimText(stripHtml(value));
  if (!cleaned) return { value: null };
  if (cleaned.length > max) {
    return {
      error: 'text_too_long',
      field,
      status: 400,
      message: `${field} must be ${max} characters or fewer.`,
    };
  }
  return { value: cleaned };
}

function normalizePublicStory(value) {
  return normalizeMultiline(value, { max: PUBLIC_STORY_MAX, field: 'publicStory' });
}

function normalizePrivateArtistNote(value) {
  return normalizeMultiline(value, { max: PRIVATE_NOTE_MAX, field: 'privateArtistNote' });
}

function positiveId(value) {
  if (value && typeof value === 'object') {
    return positiveId(value.id ?? value.data?.id);
  }
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeRole(value) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string') {
    return { error: 'invalid_lineup_role', status: 400, message: 'Lineup role must be text.' };
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > LINEUP_ROLE_MAX) {
    return { error: 'invalid_lineup_role', status: 400, message: 'Lineup role is too long.' };
  }
  const key = trimmed.toLowerCase().replace(/[\s-]+/g, '_');
  const compact = trimmed.toLowerCase().replace(/[\s_-]+/g, '');
  const mapped = ROLE_ALIASES[key] || ROLE_ALIASES[compact];
  if (mapped) return mapped;
  if (LINEUP_ROLES.includes(key)) return key;
  return 'other';
}

function slugPart(value, max = 40) {
  const text = String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return text.slice(0, max) || '';
}

function campaignSuffix(campaignId) {
  const raw = String(campaignId || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  return raw.slice(-8) || 'night';
}

function nightDateSlug(iso, timeZone) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || 'UTC',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).formatToParts(date);
    const month = (parts.find((part) => part.type === 'month')?.value || '')
      .toLowerCase()
      .replace('.', '');
    const day = parts.find((part) => part.type === 'day')?.value;
    const year = parts.find((part) => part.type === 'year')?.value;
    if (!month || !day || !year) return null;
    return `${month}-${day}-${year}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function buildNightSlug({
  venue,
  city,
  showTitle,
  performanceStartsAt,
  showStartedAt,
  timezone,
  campaignId,
} = {}) {
  const place = slugPart(venue, 40) || slugPart(showTitle, 40) || slugPart(city, 32) || 'night';
  const cityPart = slugPart(city, 24);
  const datePart = nightDateSlug(performanceStartsAt || showStartedAt, timezone) || 'show';
  const suffix = campaignSuffix(campaignId);
  const parts = [place];
  if (cityPart && cityPart !== place) parts.push(cityPart);
  parts.push(datePart, suffix);
  return parts.filter(Boolean).join('-').replace(/-+/g, '-').slice(0, 120);
}

function normalizeLineup(value) {
  if (value === undefined) return { omitted: true };
  if (value === null) return { value: null };
  if (!Array.isArray(value)) {
    return { error: 'invalid_lineup', status: 400, message: 'Lineup must be an array.' };
  }
  if (value.length > LINEUP_MAX) {
    return {
      error: 'lineup_too_long',
      status: 400,
      message: `Lineup cannot have more than ${LINEUP_MAX} members.`,
    };
  }
  if (value.length === 0) return { value: [] };

  const seenBandIds = new Set();
  const seenNames = new Set();
  const items = [];

  for (let index = 0; index < value.length; index += 1) {
    const raw = value[index];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: 'invalid_lineup', status: 400, message: 'Each lineup entry must be an object.' };
    }
    const name = trimText(raw.name);
    if (!name) {
      return { error: 'invalid_lineup_name', status: 400, message: 'Lineup name is required.' };
    }
    if (name.length > LINEUP_NAME_MAX) {
      return { error: 'invalid_lineup_name', status: 400, message: 'Lineup name is too long.' };
    }
    const nameKey = name.toLowerCase();
    if (seenNames.has(nameKey)) {
      return { error: 'duplicate_lineup_name', status: 400, message: 'Lineup names must be unique.' };
    }
    seenNames.add(nameKey);

    let bandId = null;
    if (raw.bandId != null && raw.bandId !== '') {
      bandId = positiveId(raw.bandId);
      if (!bandId) {
        return { error: 'invalid_lineup_band', status: 400, message: 'Linked lineup band is invalid.' };
      }
      if (seenBandIds.has(bandId)) {
        return {
          error: 'duplicate_lineup_band',
          status: 400,
          message: 'A band can only appear once in the lineup.',
        };
      }
      seenBandIds.add(bandId);
    }

    const role = normalizeRole(raw.role);
    if (role && typeof role === 'object' && role.error) return role;

    items.push({
      name,
      bandId,
      role: role || null,
      order: index,
    });
  }

  return { value: items };
}

function coverIdFromValue(value) {
  if (value == null) return null;
  return positiveId(value.id ?? value);
}

function hasArtistCover(recap) {
  return !!coverIdFromValue(recap?.coverImage);
}

function resolveHeroFocal(value) {
  if (value == null || value === '') return DEFAULT_HERO_FOCAL;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0 && n <= 100) return n;
  return DEFAULT_HERO_FOCAL;
}

function normalizeHeroFocal(value, field = 'heroFocal') {
  if (value === undefined) return { omitted: true };
  if (value === null || value === '') return { value: null };
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    return {
      error: 'invalid_hero_focal',
      field,
      status: 400,
      message: `${field} must be a number from 0 to 100.`,
    };
  }
  return { value: n };
}

function publicCoverUrl(file) {
  if (!file || typeof file !== 'object') return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  const raw = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || file.url || null;
  const url = raw ? String(raw) : '';
  if (!url || url.startsWith('faneqo-protected://')) return null;
  return url;
}

function toPublicSafeHero(file) {
  const url = publicCoverUrl(file);
  if (!url) return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  return {
    url,
    width: file.width || formats.medium?.width || null,
    height: file.height || formats.medium?.height || null,
    alternativeText: file.alternativeText || file.alt || null,
  };
}

function toArtistHero(file) {
  const pub = toPublicSafeHero(file);
  if (!pub) return null;
  return {
    id: file.id || null,
    ...pub,
  };
}

function mediaObject(value) {
  return value && typeof value === 'object' ? value : null;
}

function toPublicNight(recap) {
  if (!recap || typeof recap !== 'object') return null;
  const cover = mediaObject(recap.coverImage);
  const coverUrl = publicCoverUrl(cover);
  return {
    id: recap.id,
    nightSlug: recap.nightSlug || null,
    showTitle: recap.showTitle || null,
    venue: recap.venue || null,
    city: recap.city || null,
    region: recap.region || null,
    country: recap.country || null,
    timezone: recap.timezone || null,
    showModeType: recap.showModeType || null,
    showStartedAt: recap.showStartedAt || null,
    showEndedAt: recap.showEndedAt || null,
    performanceStartsAt: recap.performanceStartsAt || recap.showStartedAt || null,
    performanceEndsAt: recap.performanceEndsAt || recap.showEndedAt || null,
    publicStory: recap.publicStory || null,
    lineup: Array.isArray(recap.lineup) ? recap.lineup : null,
    cover: coverUrl ? {
      id: cover.id || null,
      url: coverUrl,
    } : null,
    hero: toPublicSafeHero(mediaObject(recap.heroImage)),
    heroFocalX: resolveHeroFocal(recap.heroFocalX),
    heroFocalY: resolveHeroFocal(recap.heroFocalY),
  };
}

function toArtistNight(recap, { includePrivateNote = false } = {}) {
  const pub = toPublicNight(recap) || {};
  const night = {
    ...pub,
    hero: toArtistHero(mediaObject(recap?.heroImage)),
    campaignId: recap?.campaignId || null,
    eventId: recap?.eventId || null,
    fansCaptured: recap?.fansCaptured ?? 0,
    checkedInShowCount: recap?.checkedInShowCount ?? 0,
    recapGeneratedAt: recap?.recapGeneratedAt || null,
  };
  if (includePrivateNote) night.privateArtistNote = recap?.privateArtistNote || null;
  return night;
}

function publicNightLeaksPrivateNote(payload) {
  if (!payload || typeof payload !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(payload, 'privateArtistNote');
}

module.exports = {
  PUBLIC_STORY_MAX,
  PRIVATE_NOTE_MAX,
  LINEUP_MAX,
  LINEUP_NAME_MAX,
  LINEUP_ROLE_MAX,
  LINEUP_ROLES,
  ARTIST_NIGHT_FIELDS,
  DEFAULT_HERO_FOCAL,
  trimText,
  positiveId,
  normalizePublicStory,
  normalizePrivateArtistNote,
  normalizeLineup,
  normalizeRole,
  normalizeHeroFocal,
  resolveHeroFocal,
  buildNightSlug,
  campaignSuffix,
  nightDateSlug,
  slugPart,
  coverIdFromValue,
  hasArtistCover,
  publicCoverUrl,
  toPublicSafeHero,
  toArtistHero,
  toPublicNight,
  toArtistNight,
  publicNightLeaksPrivateNote,
};
