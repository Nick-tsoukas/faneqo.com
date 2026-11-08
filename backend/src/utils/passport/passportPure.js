'use strict';

const SAVE_KEY_PREFIX = 'passport-gallery:v1';
const MAX_SAVED_GALLERIES = 60;
const MAX_PASSPORT_MEMORIES = 80;
const PER_FAN_ATTENDANCE_CAP = 200;
const PASSPORT_GALLERY_MEDIA_CAP = 8;

function positiveId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function gallerySaveKey(userId, artistUpdateId) {
  const uid = positiveId(userId);
  const updateId = positiveId(artistUpdateId);
  if (!uid || !updateId) return null;
  return `${SAVE_KEY_PREFIX}:${uid}:${updateId}`;
}

function gallerySharePath(artistUpdateId) {
  const id = positiveId(artistUpdateId);
  return id ? `/fan/passport/gallery/${id}` : null;
}

function memoryPath(attendanceId) {
  const id = positiveId(attendanceId);
  return id ? `/fan/passport/nights/${id}` : null;
}

function relId(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return positiveId(value.id ?? value.data?.id);
  return positiveId(value);
}

function trimText(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text || null;
}

function publicMediaUrl(file) {
  if (!file || typeof file !== 'object') return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  const raw = formats.medium?.url || formats.small?.url || formats.thumbnail?.url || file.url || null;
  const url = raw ? String(raw) : '';
  if (!url || url.startsWith('faneqo-protected://')) return null;
  return url;
}

/** Memory artwork must keep the original frame. Strapi formats can crop. */
function publicArtworkUrl(file) {
  if (!file || typeof file !== 'object') return null;
  const formats = file.formats && typeof file.formats === 'object' ? file.formats : {};
  const raw = file.url || formats.large?.url || formats.medium?.url || formats.small?.url || null;
  const url = raw ? String(raw) : '';
  if (!url || url.startsWith('faneqo-protected://')) return null;
  return url;
}

/**
 * One canonical attendance night = one Passport memory.
 * Prefer event, then Show Mode campaign, then the attendance row itself.
 */
function memoryIdentityKey(attendance) {
  const eventId = relId(attendance?.eventId ?? attendance?.event);
  if (eventId) return `event:${eventId}`;
  const campaign = trimText(attendance?.campaignId);
  if (campaign) return `campaign:${campaign}`;
  const attendanceId = positiveId(attendance?.id);
  return attendanceId ? `attendance:${attendanceId}` : null;
}

function pickCanonicalMemoryRow(rows) {
  const list = (rows || []).filter((row) => row && positiveId(row.id));
  if (!list.length) return null;
  return list.slice().sort((a, b) => {
    const ta = new Date(a.checkedInAt || 0).getTime();
    const tb = new Date(b.checkedInAt || 0).getTime();
    if (ta !== tb) return ta - tb;
    return Number(a.id) - Number(b.id);
  })[0];
}

function dedupeAttendancesToMemories(rows) {
  const groups = new Map();
  for (const row of rows || []) {
    if (!row || row.suppressedDuplicate === true) continue;
    const key = memoryIdentityKey(row);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()]
    .map((group) => pickCanonicalMemoryRow(group))
    .filter(Boolean)
    .sort((a, b) => {
      const tb = new Date(b.checkedInAt || 0).getTime();
      const ta = new Date(a.checkedInAt || 0).getTime();
      if (ta !== tb) return tb - ta;
      return Number(b.id) - Number(a.id);
    });
}

/**
 * Night memory artwork — never the artist portrait.
 * Artist image is relationship identity, not a fake Night image.
 */
function resolveMemoryArtwork({
  heroUrl = null,
  posterUrl = null,
  eventImageUrl = null,
  artistImageUrl = null,
} = {}) {
  void artistImageUrl;
  const hero = trimText(heroUrl);
  if (hero) return { url: hero, source: 'night_hero' };
  const poster = trimText(posterUrl);
  if (poster) return { url: poster, source: 'night_poster' };
  const eventUrl = trimText(eventImageUrl);
  if (eventUrl) return { url: eventUrl, source: 'show_cover' };
  return { url: null, source: 'fallback' };
}

function resolveNightMedia({ heroUrl = null, posterUrl = null, eventImageUrl = null } = {}) {
  return {
    hero: trimText(heroUrl),
    poster: trimText(posterUrl),
    event: trimText(eventImageUrl),
  };
}

function serializePassportLineup(lineup) {
  if (!Array.isArray(lineup)) return [];
  return lineup
    .map((row, index) => {
      const name = trimText(row?.name);
      if (!name) return null;
      return {
        name,
        role: trimText(row?.role),
        order: Number.isInteger(row?.order) ? row.order : index,
        bandId: relId(row?.bandId) || null,
      };
    })
    .filter(Boolean);
}

function uniquePlaceNames(values) {
  const seen = new Set();
  const names = [];
  for (const value of values || []) {
    const name = trimText(value);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }
  return names;
}

function attendanceSortTime(row) {
  return new Date(row?.checkedInAt || row?.showDate || 0).getTime();
}

/**
 * Server-derived relationship facts from the full unique-night set
 * for one artist. Do not compute this on a paginated client list.
 */
function relationshipFactsByArtist(uniqueAttendances, { includeOrdinals = true } = {}) {
  const groups = new Map();
  for (const row of uniqueAttendances || []) {
    const bandId = relId(row.band?.id ?? row.band);
    if (!bandId) continue;
    if (!groups.has(bandId)) groups.set(bandId, []);
    groups.get(bandId).push(row);
  }
  const facts = new Map();
  for (const [bandId, rows] of groups) {
    const chrono = rows.slice().sort((a, b) => {
      const ta = attendanceSortTime(a);
      const tb = attendanceSortTime(b);
      if (ta !== tb) return ta - tb;
      return Number(a.id) - Number(b.id);
    });
    const ordinalById = new Map();
    if (includeOrdinals) {
      chrono.forEach((row, index) => ordinalById.set(Number(row.id), index + 1));
    }
    const first = chrono[0] || null;
    const latest = chrono[chrono.length - 1] || null;
    facts.set(Number(bandId), {
      nightCount: chrono.length,
      cities: uniquePlaceNames(chrono.map((row) => row.city)),
      firstNightDate: trimText(first?.showDate) || trimText(first?.checkedInAt),
      latestNightDate: trimText(latest?.showDate) || trimText(latest?.checkedInAt),
      ordinalById,
    });
  }
  return facts;
}

function galleryMatchesAttendance(gallery, attendance) {
  if (!gallery || !attendance) return false;
  const eventId = relId(attendance.eventId ?? attendance.event);
  const campaignId = trimText(attendance.campaignId);
  const galleryEvent = relId(gallery.eventId ?? gallery.show?.eventId ?? gallery.event);
  const galleryCampaign = trimText(
    gallery.showCampaignId || gallery.campaignId || gallery.show?.campaignId || gallery.showRecap?.campaignId
  );
  if (eventId && galleryEvent && String(eventId) === String(galleryEvent)) return true;
  if (campaignId && galleryCampaign && campaignId === galleryCampaign) return true;
  return false;
}

function attachGalleriesToMemories(memories, galleries) {
  const list = Array.isArray(galleries) ? galleries : [];
  return (memories || []).map((memory) => {
    const matched = list.filter((gallery) => galleryMatchesAttendance(gallery, memory));
    const seen = new Set();
    const unique = [];
    for (const gallery of matched) {
      const id = positiveId(gallery.id);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      unique.push(gallery);
    }
    unique.sort((a, b) => {
      const tb = new Date(b.publishedAt || 0).getTime();
      const ta = new Date(a.publishedAt || 0).getTime();
      if (ta !== tb) return tb - ta;
      return Number(b.id) - Number(a.id);
    });
    return { ...memory, galleries: unique };
  });
}

function showFactsFromAttendance(attendance, event, recap) {
  const date = trimText(attendance?.showDate)
    || trimText(event?.date)
    || trimText(recap?.showStartedAt)
    || trimText(attendance?.checkedInAt)
    || null;
  return {
    title: trimText(attendance?.showTitle) || trimText(event?.title) || trimText(recap?.showTitle) || null,
    venue: trimText(attendance?.venue) || trimText(event?.venue) || trimText(recap?.venue) || null,
    city: trimText(attendance?.city) || trimText(event?.city) || trimText(recap?.city) || null,
    region: trimText(attendance?.region) || trimText(event?.state) || trimText(recap?.region) || null,
    date,
    eventId: relId(attendance?.eventId ?? attendance?.event) || relId(event?.id) || relId(recap?.eventId) || null,
    campaignId: trimText(attendance?.campaignId) || trimText(recap?.campaignId) || null,
    showRecapId: relId(recap?.id) || null,
  };
}

function serializePassportMediaItem(item) {
  if (!item || typeof item !== 'object') return null;
  const url = trimText(item.url) || trimText(item.thumbnailUrl) || trimText(item.src);
  if (!url || url.startsWith('faneqo-protected://')) return null;
  return {
    id: item.id || item.mediaId || null,
    url,
    thumbnailUrl: trimText(item.thumbnailUrl),
    alt: trimText(item.alt) || trimText(item.alternativeText) || 'Show photo',
    width: item.width || null,
    height: item.height || null,
  };
}

function serializePassportGallery(gallery, { includeMedia = false } = {}) {
  if (!gallery || !positiveId(gallery.id)) return null;
  const media = Array.isArray(gallery.media) ? gallery.media : [];
  const preview = media[0] || null;
  const attached = includeMedia
    ? media.slice(0, PASSPORT_GALLERY_MEDIA_CAP).map(serializePassportMediaItem).filter(Boolean)
    : [];
  return {
    id: gallery.id,
    title: trimText(gallery.title),
    slug: trimText(gallery.slug),
    photoCount: Number(gallery.photoCount || media.length || 0),
    preview: preview ? {
      url: preview.thumbnailUrl || preview.url || null,
      alt: preview.alt || preview.alternativeText || 'Show photo',
    } : null,
    media: attached,
    sharePath: gallerySharePath(gallery.id),
    canonicalPath: trimText(gallery.canonicalPath) || trimText(gallery.show?.canonicalPath),
    youWereThere: gallery.youWereThere !== false,
    locked: !!gallery.locked,
  };
}

function serializePassportMemory({
  attendance,
  artist,
  event,
  recap,
  galleries,
  relationship = null,
} = {}) {
  const attendanceId = positiveId(attendance?.id);
  if (!attendanceId) return null;
  const show = showFactsFromAttendance(attendance, event, recap);
  const heroUrl = publicArtworkUrl(recap?.heroImage) || trimText(recap?.heroUrl);
  const posterUrl = publicArtworkUrl(recap?.coverImage) || trimText(recap?.coverUrl);
  const eventImageUrl = publicArtworkUrl(event?.image) || trimText(event?.imageUrl);
  const artwork = resolveMemoryArtwork({
    heroUrl,
    posterUrl,
    eventImageUrl,
  });
  const attached = (galleries || [])
    .map((gallery, index) => serializePassportGallery(gallery, { includeMedia: index === 0 }))
    .filter(Boolean);
  const nightSlug = trimText(recap?.nightSlug);
  const showOrdinal = Number.isInteger(relationship?.showOrdinal) && relationship.showOrdinal > 0
    ? relationship.showOrdinal
    : null;
  return {
    id: attendanceId,
    attendanceId,
    youWereThere: true,
    path: memoryPath(attendanceId),
    artist: artist ? {
      id: positiveId(artist.id),
      name: trimText(artist.name) || 'Artist',
      slug: trimText(artist.slug),
      imageUrl: trimText(artist.imageUrl) || publicArtworkUrl(artist.bandImg),
    } : null,
    show: {
      ...show,
      nightSlug,
    },
    night: {
      publicStory: trimText(recap?.publicStory),
      lineup: serializePassportLineup(recap?.lineup),
      heroUrl,
      posterUrl,
      eventImageUrl,
      publicPath: nightSlug && artist?.slug
        ? `/${String(artist.slug).replace(/^\/+|\/+$/g, '')}/night/${nightSlug}`
        : null,
    },
    nightMedia: resolveNightMedia({ heroUrl, posterUrl, eventImageUrl }),
    artwork,
    galleries: attached,
    galleryCount: attached.length,
    photoCount: attached.reduce((sum, gallery) => sum + Number(gallery.photoCount || 0), 0),
    showOrdinal,
    relationship: relationship ? {
      nightCount: Number(relationship.nightCount || 0) || null,
      cities: Array.isArray(relationship.cities) ? relationship.cities : [],
      firstNightDate: trimText(relationship.firstNightDate),
      latestNightDate: trimText(relationship.latestNightDate),
      showOrdinal,
    } : null,
    checkedInAt: attendance.checkedInAt || null,
  };
}

module.exports = {
  SAVE_KEY_PREFIX,
  MAX_SAVED_GALLERIES,
  MAX_PASSPORT_MEMORIES,
  PER_FAN_ATTENDANCE_CAP,
  PASSPORT_GALLERY_MEDIA_CAP,
  positiveId,
  relId,
  trimText,
  publicMediaUrl,
  publicArtworkUrl,
  gallerySaveKey,
  gallerySharePath,
  memoryPath,
  memoryIdentityKey,
  pickCanonicalMemoryRow,
  dedupeAttendancesToMemories,
  resolveMemoryArtwork,
  resolveNightMedia,
  serializePassportLineup,
  relationshipFactsByArtist,
  galleryMatchesAttendance,
  attachGalleriesToMemories,
  showFactsFromAttendance,
  serializePassportMediaItem,
  serializePassportGallery,
  serializePassportMemory,
};
