'use strict';

const MARKER_PREFIX = '[[faneqo-gallery:v1:';
const MARKER_RE = /^\[\[faneqo-gallery:v1:(\d+)\]\](?:\n([\s\S]*))?$/;

function positiveId(value) {
  const id = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function containsReservedMarker(value) {
  return String(value || '').includes('[[faneqo-gallery:');
}

function encodeGalleryReference(artistUpdateId, bodyText = '') {
  const id = positiveId(artistUpdateId);
  if (!id) return null;
  const body = String(bodyText || '').trim();
  return `${MARKER_PREFIX}${id}]]${body ? `\n${body}` : ''}`;
}

function parseGalleryReference(value) {
  const raw = String(value || '');
  const match = raw.match(MARKER_RE);
  if (!match) return { artistUpdateId: null, bodyText: raw };
  return {
    artistUpdateId: positiveId(match[1]),
    bodyText: String(match[2] || '').trim(),
  };
}

function unavailableGalleryReference(artistUpdateId) {
  const id = positiveId(artistUpdateId);
  return id
    ? {
        id,
        locked: true,
        unavailable: true,
        media: [],
        photoCount: 0,
        show: null,
      }
    : null;
}

module.exports = {
  MARKER_PREFIX,
  positiveId,
  containsReservedMarker,
  encodeGalleryReference,
  parseGalleryReference,
  unavailableGalleryReference,
};
