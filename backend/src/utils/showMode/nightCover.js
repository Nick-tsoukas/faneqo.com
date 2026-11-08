'use strict';

const { authorizeUploadFile } = require('../inbox/inboxPure');
const mediaPure = require('../artistUpdates/protectedMediaPure');
const showCover = require('./showCoverPure');
const night = require('./nightEnrichmentPure');

async function authorizePublicNightCover(strapi, userId, mediaId) {
  const id = showCover.positiveId(mediaId);
  if (!id) {
    return { error: 'invalid_cover', status: 400, message: 'Night cover is not available' };
  }
  const file = await strapi.entityService.findOne('plugin::upload.file', id);
  if (mediaPure.isProtectedFile(file)) {
    return {
      error: 'protected_cover',
      status: 400,
      message: 'Night cover must be a public image.',
    };
  }
  const auth = authorizeUploadFile(file, userId);
  if (auth.error) {
    return {
      error: auth.error === 'invalid_attachment' ? 'invalid_cover' : auth.error,
      status: 400,
      message: auth.message || 'Night cover is not available',
    };
  }
  return { file };
}

function coverMediaIdFromMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  return night.positiveId(metadata.coverMediaId);
}

function withCoverMediaId(metadata, coverMediaId) {
  const next = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  if (coverMediaId) next.coverMediaId = coverMediaId;
  else delete next.coverMediaId;
  return Object.keys(next).length ? next : null;
}

module.exports = {
  authorizePublicNightCover,
  coverMediaIdFromMetadata,
  withCoverMediaId,
};
