'use strict';

function positiveId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
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

function todayDateString(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function durableShowEventTitle({
  bandName,
  venue,
  city,
  date,
  campaignId,
} = {}) {
  const place = trimText(venue) || trimText(city) || 'Live';
  const day = trimText(date) || todayDateString();
  const suffix = String(campaignId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-10) || 'show';
  const artist = trimText(bandName) || 'Show';
  return `${artist} · ${place} · ${day} · ${suffix}`.slice(0, 180);
}

function showCoverFromEvent(event) {
  const url = publicMediaUrl(event?.image);
  if (!url) return null;
  return {
    url,
    eventId: positiveId(event?.id),
    source: 'show_cover',
  };
}

module.exports = {
  positiveId,
  trimText,
  publicMediaUrl,
  todayDateString,
  durableShowEventTitle,
  showCoverFromEvent,
};
