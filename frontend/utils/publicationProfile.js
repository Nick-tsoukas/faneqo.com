/**
 * Publication profile helpers — layout mode, link tiering, default copy.
 * Triggered when band.editorialShowcaseEnabled === true.
 */

export const PUBLICATION_ACCENT = '#34d399';

export const PUBLICATION_HEADER_IMAGE_MODE = {
  CONTAIN_BLUR: 'contain_blur',
  CINEMATIC_COVER: 'cinematic_cover',
};

export const DEFAULT_PUBLICATION_HEADER_IMAGE_MODE = PUBLICATION_HEADER_IMAGE_MODE.CONTAIN_BLUR;

export const PUBLICATION_FAN_DEFAULTS = {
  headline: 'Subscribe for the latest coverage',
  message:
    'Get updates on interviews, concert reviews, videos, photo galleries, and new music coverage.',
  buttonLabel: 'Subscribe',
  successMessage: "You're subscribed.",
};

export function isPublicationProfile(band) {
  return band?.editorialShowcaseEnabled === true;
}

export function getPublicationAccent(band) {
  return band?.editorialAccentColor || PUBLICATION_ACCENT;
}

/** Publication header image treatment when editorialShowcaseEnabled is true. */
export function getPublicationHeaderImageMode(band) {
  const mode = band?.publicationHeaderImageMode;
  if (mode === PUBLICATION_HEADER_IMAGE_MODE.CINEMATIC_COVER) {
    return PUBLICATION_HEADER_IMAGE_MODE.CINEMATIC_COVER;
  }
  return DEFAULT_PUBLICATION_HEADER_IMAGE_MODE;
}

export function isPublicationCinematicHeader(band) {
  return getPublicationHeaderImageMode(band) === PUBLICATION_HEADER_IMAGE_MODE.CINEMATIC_COVER;
}

export function getPublicationFanCaptureCopy(band) {
  return {
    headline: band?.fanCaptureHeadline?.trim() || PUBLICATION_FAN_DEFAULTS.headline,
    message: band?.fanCaptureMessage?.trim() || PUBLICATION_FAN_DEFAULTS.message,
    buttonLabel: band?.fanCaptureButtonLabel?.trim() || PUBLICATION_FAN_DEFAULTS.buttonLabel,
    successMessage:
      band?.fanCaptureSuccessMessage?.trim() || PUBLICATION_FAN_DEFAULTS.successMessage,
  };
}

const GENERIC_SECTION_NAMES = /^our publication$/i;

function parseShortNameFromSectionTitle(sectionTitle) {
  const title = String(sectionTitle || '').trim();
  if (!title) return '';
  const match = title.match(/^Latest from (.+)$/i);
  if (!match?.[1]) return '';
  const candidate = match[1].trim();
  if (candidate.length < 2 || candidate.length > 40) return '';
  if (GENERIC_SECTION_NAMES.test(candidate)) return '';
  return candidate;
}

/**
 * Short publication brand name for section headings (e.g. "Rock DNA").
 * Uses explicit publicationShortName when set, otherwise parses the editorial
 * section title when it follows the "Latest from {name}" convention.
 */
export function getPublicationShortName(band) {
  const explicit = String(band?.publicationShortName || '').trim();
  if (explicit) return explicit;

  const storedTitle = String(band?.editorialSectionTitle || '').trim();
  const fromStored = parseShortNameFromSectionTitle(storedTitle);
  if (fromStored) return fromStored;

  return '';
}

/** Heading for custom interview/submission link groups on publication profiles. */
export function getPublicationFeaturedHeading(band) {
  const shortName = getPublicationShortName(band);
  if (shortName) {
    return `Get featured by ${shortName}`;
  }
  return 'Get featured';
}

function normalizeCustomButtons(buttons) {
  if (!Array.isArray(buttons)) return [];
  return buttons
    .filter((b) => b?.url && String(b.url).trim())
    .map((b) => ({
      id: b.id,
      title: String(b.title || '').trim() || 'Learn more',
      subtitle: String(b.subtitle || '').trim(),
      url: String(b.url).trim(),
      iconName: b.iconName || '',
      customIcon: b.customIcon?.data?.attributes || b.customIcon || null,
      source: 'custom',
      key: `custom-${b.id || b.url}`,
    }));
}

/**
 * Up to 3 primary CTAs: website first, then custom buttons.
 */
export function buildPrimaryLinks(band, customButtons = []) {
  const links = [];
  const website = String(band?.websitelink || '').trim();
  if (website) {
    links.push({
      key: 'website',
      title: String(band?.websitelinktext || '').trim() || 'Visit Website',
      subtitle: 'Official website',
      url: website,
      source: 'website',
      platformName: 'website',
    });
  }

  const customs = normalizeCustomButtons(customButtons);
  for (const btn of customs) {
    if (links.length >= 3) break;
    links.push({
      ...btn,
      platformName: 'custom',
    });
  }

  return links;
}

export function getPrimaryLinkKeys(primaryLinks) {
  const list = Array.isArray(primaryLinks) ? primaryLinks : [];
  return new Set(list.map((l) => l.key));
}

/**
 * Platforms for icon strip — visible streaming/social not used as sole primary duplicate.
 */
export function buildSecondaryPlatforms(band, hiddenLinks = [], streamingPlatforms = [], socialPlatforms = []) {
  const hidden = new Set(Array.isArray(hiddenLinks) ? hiddenLinks : []);
  const streaming = Array.isArray(streamingPlatforms) ? streamingPlatforms : [];
  const social = Array.isArray(socialPlatforms) ? socialPlatforms : [];
  const items = [];
  const seen = new Set();

  for (const p of [...streaming, ...social]) {
    const url = band?.[p.name];
    if (!url || hidden.has(p.name) || seen.has(p.name)) continue;
    seen.add(p.name);
    items.push({ ...p, url });
  }

  return items;
}
