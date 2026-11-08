'use strict';

const assert = require('assert');
const { validateCampaignGallery } = require('../src/utils/messaging/campaignGallery');

function gallery(overrides = {}) {
  return {
    id: 91,
    band: { id: 7 },
    showRecap: { id: 44 },
    visibility: 'show_attendees',
    status: 'published',
    media: [{ id: 1 }, { id: 2 }],
    ...overrides,
  };
}

assert.equal(validateCampaignGallery({
  gallery: gallery(), bandId: 7, audienceType: 'show_attendees', channel: 'in_app', showRecapId: 44,
}).error, null);

assert.equal(validateCampaignGallery({
  gallery: gallery(), bandId: 7, audienceType: 'show_attendees', channel: 'email', showRecapId: 44,
}).error, 'gallery_requires_inbox');

assert.equal(validateCampaignGallery({
  gallery: gallery(), bandId: 8, audienceType: 'show_attendees', channel: 'in_app', showRecapId: 44,
}).error, 'gallery_not_available');

assert.equal(validateCampaignGallery({
  gallery: gallery(), bandId: 7, audienceType: 'show_attendees', channel: 'in_app', showRecapId: 45,
}).error, 'gallery_show_mismatch');

assert.equal(validateCampaignGallery({
  gallery: gallery({ visibility: 'public', showRecap: null }),
  bandId: 7,
  audienceType: 'all_fans',
  channel: 'in_app',
  showRecapId: null,
}).error, null);

assert.equal(validateCampaignGallery({
  gallery: gallery(), bandId: 7, audienceType: 'all_fans', channel: 'in_app', showRecapId: null,
}).error, 'gallery_audience_mismatch');

assert.equal(validateCampaignGallery({
  gallery: gallery({ status: 'draft' }), bandId: 7, audienceType: 'show_attendees', channel: 'in_app', showRecapId: 44,
}).error, 'gallery_not_available');

console.log('test-gallery-reference-campaigns: ok');
