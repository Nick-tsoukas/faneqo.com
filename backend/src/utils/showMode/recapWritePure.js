'use strict';

/**
 * Recap writes: system metrics may refresh; artist-authored Night fields must not.
 */

const ARTIST_AUTHORED_RECAP_KEYS = [
  'publicStory',
  'privateArtistNote',
  'lineup',
  'coverImage',
  'nightSlug',
  'coverShareIdentity',
  'heroImage',
  'heroFocalX',
  'heroFocalY',
];

const SYSTEM_METADATA_KEYS = ['generatedBy', 'bandName'];

function stripArtistAuthoredFields(data) {
  if (!data || typeof data !== 'object') return data;
  const next = { ...data };
  for (const key of ARTIST_AUTHORED_RECAP_KEYS) {
    delete next[key];
  }
  return next;
}

function mergeRecapMetadata(previous, nextMetadata) {
  const prior = previous && typeof previous.metadata === 'object' && previous.metadata
    ? { ...previous.metadata }
    : {};
  const incoming = nextMetadata && typeof nextMetadata === 'object' ? { ...nextMetadata } : {};
  const merged = { ...prior, ...incoming };
  for (const key of SYSTEM_METADATA_KEYS) {
    if (incoming[key] != null) merged[key] = incoming[key];
  }
  return merged;
}

function buildRecapUpdateData({ recapData, previous = null, seeds = {} } = {}) {
  const data = stripArtistAuthoredFields({ ...recapData });
  data.metadata = mergeRecapMetadata(previous, recapData?.metadata);

  if (!previous?.nightSlug && seeds.nightSlug) {
    data.nightSlug = seeds.nightSlug;
  }
  const previousCover = previous?.coverImage?.id || previous?.coverImage || null;
  if (!previousCover && seeds.coverImage) {
    data.coverImage = seeds.coverImage;
  }
  return data;
}

function artistAuthoredKeysPresent(data) {
  if (!data || typeof data !== 'object') return [];
  return ARTIST_AUTHORED_RECAP_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(data, key));
}

module.exports = {
  ARTIST_AUTHORED_RECAP_KEYS,
  FUTURE_ARTIST_AUTHORED_RECAP_KEYS: ARTIST_AUTHORED_RECAP_KEYS,
  stripArtistAuthoredFields,
  mergeRecapMetadata,
  buildRecapUpdateData,
  artistAuthoredKeysPresent,
};
