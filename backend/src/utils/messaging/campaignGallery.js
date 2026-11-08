'use strict';

const { AUDIENCE_TYPES, CAMPAIGN_CHANNELS } = require('./audienceResolver');

function positiveId(value) {
  const id = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function relationId(value) {
  if (value == null) return null;
  if (typeof value === 'object') return positiveId(value.id || value.data?.id);
  return positiveId(value);
}

function validateCampaignGallery({ gallery, bandId, audienceType, channel, showRecapId }) {
  if (!gallery) return { error: 'gallery_not_available', message: 'Gallery is not available.' };
  if (channel !== CAMPAIGN_CHANNELS.IN_APP) {
    return { error: 'gallery_requires_inbox', message: 'Galleries can currently be sent through Faneqo Inbox.' };
  }
  if (relationId(gallery.band) !== positiveId(bandId)) {
    return { error: 'gallery_not_available', message: 'Gallery is not available.' };
  }
  if (gallery.status !== 'published' || Number(gallery.photoCount || gallery.media?.length || 0) < 1) {
    return { error: 'gallery_not_available', message: 'Publish this gallery before sending it.' };
  }

  if (audienceType === AUDIENCE_TYPES.SHOW_ATTENDEES) {
    if (
      gallery.visibility !== 'show_attendees'
      || !showRecapId
      || relationId(gallery.showRecap) !== positiveId(showRecapId)
    ) {
      return {
        error: 'gallery_show_mismatch',
        message: 'Choose the gallery created for this show.',
      };
    }
    return { error: null, gallery };
  }

  if (audienceType === AUDIENCE_TYPES.ALL_FANS) {
    if (gallery.visibility !== 'public') {
      return {
        error: 'gallery_audience_mismatch',
        message: 'Only a public gallery can be sent to all fans.',
      };
    }
    return { error: null, gallery };
  }

  return { error: 'unsupported_audience', message: 'This gallery cannot be sent to that audience.' };
}

module.exports = {
  positiveId,
  relationId,
  validateCampaignGallery,
};
