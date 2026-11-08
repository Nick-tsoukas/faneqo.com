'use strict';

/**
 * Positive allowlist for public Band serialization.
 * New Band schema fields do not appear here until explicitly added.
 */

const PUBLIC_BAND_SCALAR_KEYS = [
  'id',
  'name',
  'slug',
  'genre',
  'bio',
  'biotagline',
  'isBandNameInLogo',
  'websitelink',
  'websitelinktext',
  'facebook',
  'instagram',
  'twitch',
  'appleMusic',
  'soundcloud',
  'deezer',
  'youtube',
  'bandcamp',
  'twitter',
  'whatsapp',
  'tiktok',
  'spotify',
  'snapchat',
  'reverbnation',
  'youtubeMusic',
  'amazonMusic',
  'tidal',
  'pandora',
  'audiomack',
  'mixcloud',
  'beatport',
  'napster',
  'vimeo',
  'kick',
  'threads',
  'discord',
  'telegram',
  'reddit',
  'pinterest',
  'linkedin',
  'bandsintown',
  'songkick',
  'patreon',
  'jambase',
  'relix',
  'labelUrl',
  'officialMerchUrl',
  'labelName',
  'bookingEmail',
  'managementEmail',
  'pressEmail',
  'bookingAgent',
  'hiddenLinks',
  'layoutConfig',
  'layoutVersion',
  'pageStyle',
  'buttonStyle',
  'newReleaseDate',
  'nowBannerOverride',
  'paymentButtons',
  'paymentsEnabled',
  'fanCaptureEnabled',
  'fanCaptureHeadline',
  'fanCaptureMessage',
  'fanCaptureButtonLabel',
  'fanCaptureSuccessMessage',
  'cyberedImagePositionX',
  'cyberedImagePositionY',
  'cyberedImageZoom',
  'cyberedDesktopPositionX',
  'cyberedDesktopPositionY',
  'cyberedDesktopZoom',
  'cyberedDesktopFit',
  'cyberedMobileFit',
  'editorialShowcaseEnabled',
  'publicationHeaderImageMode',
  'editorialSectionTitle',
  'editorialArchiveUrl',
  'editorialArchiveLabel',
  'showModeEnabled',
  'showModeStatus',
  'showModeEndsAt',
  'showModeStartedAt',
  'showModeTitle',
  'showModeVenue',
  'showModeCity',
  'showModeEventId',
  'showModeCampaignId',
];

const PUBLIC_BAND_RELATION_KEYS = [
  'bandImg',
  'events',
  'tours',
  'albums',
  'singlesong',
  'singlevideo',
  'videos',
  'customButtons',
  'editorialItems',
  'members',
  'featuredGallery',
];

const FORBIDDEN_PUBLIC_BAND_KEYS = [
  'showModeLastCampaignId',
  'showModeLastContext',
  'showModeLastDeactivationReason',
  'showModePerformanceStartsAt',
  'showModePerformanceEndsAt',
  'showModeActivatedAt',
  'showModeEndedAt',
  'showModeMetadata',
  'showModeAutoManaged',
  'showModeScheduledStartAt',
  'showModeScheduledEndAt',
  'showModeLastAutoDeactivatedAt',
  'showModeLastManualOverrideAt',
  'showModeSourceDetail',
  'showModeType',
  'showModeRegion',
  'showModeCountry',
  'showModeTimezone',
  'stripeAccountId',
  'stripeOnboardingComplete',
  'users_permissions_user',
  'link_clicks',
  'fans',
  'qrs',
  'externalAccounts',
  'externalMetrics',
  'merchConcierge',
  'media_plays',
  'band_page_views',
];

/**
 * Authenticated owner/manager/viewer may see these extras on GET /bands and
 * GET /bands/:id. findBySlug never includes them.
 * showModeCampaignId stays on the public allowlist: the artist page check-in
 * client currently sends it to attendance endpoints.
 */
const OWNER_BAND_SCALAR_KEYS = [
  'stripeAccountId',
  'stripeOnboardingComplete',
];

const PUBLIC_BAND_KEY_SET = new Set([
  ...PUBLIC_BAND_SCALAR_KEYS,
  ...PUBLIC_BAND_RELATION_KEYS,
]);

const OWNER_BAND_KEY_SET = new Set([
  ...PUBLIC_BAND_KEY_SET,
  ...OWNER_BAND_SCALAR_KEYS,
]);

function pickAllowed(source, keys) {
  const out = {};
  for (const key of keys) {
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
}

function toPublicBand(band) {
  if (!band || typeof band !== 'object') return null;
  return {
    ...pickAllowed(band, PUBLIC_BAND_SCALAR_KEYS),
    ...pickAllowed(band, PUBLIC_BAND_RELATION_KEYS),
  };
}

function toOwnerBand(band) {
  if (!band || typeof band !== 'object') return null;
  return {
    ...toPublicBand(band),
    ...pickAllowed(band, OWNER_BAND_SCALAR_KEYS),
  };
}

function publicBandHasForbidden(payload, { owner = false } = {}) {
  if (!payload || typeof payload !== 'object') return [];
  const allowed = owner ? OWNER_BAND_KEY_SET : PUBLIC_BAND_KEY_SET;
  return Object.keys(payload).filter((key) => {
    if (owner && OWNER_BAND_SCALAR_KEYS.includes(key)) return false;
    return FORBIDDEN_PUBLIC_BAND_KEYS.includes(key) || !allowed.has(key);
  });
}

module.exports = {
  PUBLIC_BAND_SCALAR_KEYS,
  PUBLIC_BAND_RELATION_KEYS,
  OWNER_BAND_SCALAR_KEYS,
  FORBIDDEN_PUBLIC_BAND_KEYS,
  toPublicBand,
  toOwnerBand,
  publicBandHasForbidden,
};
