/**
 * Band Profile Layout Configuration Utilities
 * 
 * Provides a future-proof "defaults + merge + sanitize" system for
 * customizable band profile page layouts.
 * 
 * Version 1 - Initial implementation
 */

export interface SectionConfig {
  id: string;
  enabled: boolean;
}

export interface ButtonsConfig {
  streaming: string[];
  social: string[];
  eventHubs: string[];
}

export type ArtistImageFitMode = 'auto' | 'fill' | 'full';

export interface LayoutConfig {
  version: number;
  sections: SectionConfig[];
  buttons: ButtonsConfig;
  /** Artist photo fit. Stored here to avoid a new Strapi band field. */
  imageFit?: ArtistImageFitMode;
}

/**
 * Section IDs that can be reordered/toggled.
 * Hero (image, name, bio) is always first and NOT part of this config.
 */
export const SECTION_IDS = [
  'audio',         // Featured Song
  'video',         // Featured Video
  'website',       // Website Link
  'customButtons', // Custom Links
  'streaming',     // Streaming Links
  'social',        // Social Media
  'eventHubs',     // Event Hubs
  'events',        // Upcoming + Past Events
  'merch',         // Merch Concierge
  'payments',      // Tip/Payment buttons
  'follow',        // Follow the Band CTA
] as const;

export type SectionId = typeof SECTION_IDS[number];

/**
 * Human-readable labels for sections (for the editor UI)
 */
export const SECTION_LABELS: Record<SectionId, string> = {
  audio: 'Featured Song',
  video: 'Featured Video',
  website: 'Website Link',
  customButtons: 'Custom Links',
  streaming: 'Streaming Links',
  social: 'Social Media',
  eventHubs: 'Event Hubs',
  events: 'Events',
  merch: 'Merch Concierge',
  payments: 'Tip the Band',
  follow: 'Follow CTA',
};

/**
 * Default streaming platform order (matches current live order)
 */
export const DEFAULT_STREAMING_ORDER = [
  'youtube',
  'youtubeMusic',
  'spotify',
  'appleMusic',
  'soundcloud',
  'bandcamp',
  'deezer',
  'twitch',
  'reverbnation',
  // New platforms
  'amazonMusic',
  'tidal',
  'pandora',
  'audiomack',
  'mixcloud',
  'beatport',
  'napster',
  'vimeo',
  'kick',
] as const;

/**
 * Default social platform order (matches current live order)
 */
export const DEFAULT_SOCIAL_ORDER = [
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  // New platforms
  'threads',
  'discord',
  'telegram',
  'reddit',
  'pinterest',
  'linkedin',
  'whatsapp',
  'snapchat',
  'patreon',
] as const;

/**
 * Default event hub platform order
 */
export const DEFAULT_EVENT_HUB_ORDER = [
  'bandsintown',
  'songkick',
  'jambase',
  'relix',
] as const;

/**
 * The default layout configuration.
 * This represents the CURRENT live band page order exactly.
 * All sections enabled, in the order they appear today.
 */
export const DEFAULT_LAYOUT: LayoutConfig = {
  version: 1,
  sections: [
    { id: 'audio', enabled: true },
    { id: 'video', enabled: true },
    { id: 'website', enabled: true },
    { id: 'customButtons', enabled: true },
    { id: 'streaming', enabled: true },
    { id: 'social', enabled: true },
    { id: 'eventHubs', enabled: true },
    { id: 'events', enabled: true },
    { id: 'merch', enabled: true },
    { id: 'payments', enabled: true },
    { id: 'follow', enabled: true },
  ],
  buttons: {
    streaming: [...DEFAULT_STREAMING_ORDER],
    social: [...DEFAULT_SOCIAL_ORDER],
    eventHubs: [...DEFAULT_EVENT_HUB_ORDER],
  },
};

/**
 * Set of valid section IDs for quick lookup
 */
const VALID_SECTION_IDS = new Set<string>(SECTION_IDS);

/**
 * Set of valid streaming platform IDs
 */
const VALID_STREAMING_IDS = new Set<string>(DEFAULT_STREAMING_ORDER);

/**
 * Set of valid social platform IDs
 */
const VALID_SOCIAL_IDS = new Set<string>(DEFAULT_SOCIAL_ORDER);

/**
 * Set of valid event hub platform IDs
 */
const VALID_EVENT_HUB_IDS = new Set<string>(DEFAULT_EVENT_HUB_ORDER);

/**
 * Safely parse a layout config that might be malformed.
 * Returns null if input is not a valid object.
 */
function safeParseConfig(input: unknown): Partial<LayoutConfig> | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return null;
  }
  return input as Partial<LayoutConfig>;
}

/**
 * Remove duplicates from an array while preserving order
 */
function uniqueArray<T>(arr: T[]): T[] {
  const seen = new Set<T>();
  return arr.filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}

/**
 * Normalize and merge a user's layoutConfig with defaults.
 * 
 * Rules:
 * - If input is null/undefined/invalid → return DEFAULT_LAYOUT
 * - Unknown section IDs are ignored
 * - New default sections not in user config are appended (enabled by default)
 * - Unknown button IDs are ignored
 * - Missing button arrays fall back to defaults
 * - Duplicates are removed
 * 
 * @param input - The raw layoutConfig from the band (may be null/undefined/malformed)
 * @returns A fully normalized LayoutConfig safe to use for rendering
 */
export function normalizeLayoutConfig(input: unknown): LayoutConfig {
  const parsed = safeParseConfig(input);
  
  if (!parsed) {
    return { ...DEFAULT_LAYOUT };
  }

  // Normalize sections
  let sections: SectionConfig[] = [];
  const seenSectionIds = new Set<string>();

  if (Array.isArray(parsed.sections)) {
    for (const item of parsed.sections) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        VALID_SECTION_IDS.has(item.id) &&
        !seenSectionIds.has(item.id)
      ) {
        seenSectionIds.add(item.id);
        sections.push({
          id: item.id,
          enabled: typeof item.enabled === 'boolean' ? item.enabled : true,
        });
      }
    }
  }

  // Append any default sections not present in user config
  for (const defaultSection of DEFAULT_LAYOUT.sections) {
    if (!seenSectionIds.has(defaultSection.id)) {
      sections.push({ ...defaultSection });
    }
  }

  // Normalize buttons
  let streamingButtons: string[] = [];
  let socialButtons: string[] = [];
  let eventHubButtons: string[] = [];

  if (parsed.buttons && typeof parsed.buttons === 'object') {
    // Streaming buttons
    if (Array.isArray(parsed.buttons.streaming)) {
      streamingButtons = parsed.buttons.streaming.filter(
        (id): id is string => typeof id === 'string' && VALID_STREAMING_IDS.has(id)
      );
      streamingButtons = uniqueArray(streamingButtons);
    }

    // Social buttons
    if (Array.isArray(parsed.buttons.social)) {
      socialButtons = parsed.buttons.social.filter(
        (id): id is string => typeof id === 'string' && VALID_SOCIAL_IDS.has(id)
      );
      socialButtons = uniqueArray(socialButtons);
    }

    // Event hub buttons
    if (Array.isArray(parsed.buttons.eventHubs)) {
      eventHubButtons = parsed.buttons.eventHubs.filter(
        (id): id is string => typeof id === 'string' && VALID_EVENT_HUB_IDS.has(id)
      );
      eventHubButtons = uniqueArray(eventHubButtons);
    }
  }

  // If no valid streaming buttons, use defaults
  if (streamingButtons.length === 0) {
    streamingButtons = [...DEFAULT_STREAMING_ORDER];
  } else {
    // Append any missing default streaming platforms at the end
    for (const defaultId of DEFAULT_STREAMING_ORDER) {
      if (!streamingButtons.includes(defaultId)) {
        streamingButtons.push(defaultId);
      }
    }
  }

  // If no valid social buttons, use defaults
  if (socialButtons.length === 0) {
    socialButtons = [...DEFAULT_SOCIAL_ORDER];
  } else {
    // Append any missing default social platforms at the end
    for (const defaultId of DEFAULT_SOCIAL_ORDER) {
      if (!socialButtons.includes(defaultId)) {
        socialButtons.push(defaultId);
      }
    }
  }

  // If no valid event hub buttons, use defaults
  if (eventHubButtons.length === 0) {
    eventHubButtons = [...DEFAULT_EVENT_HUB_ORDER];
  } else {
    // Append any missing default event hub platforms at the end
    for (const defaultId of DEFAULT_EVENT_HUB_ORDER) {
      if (!eventHubButtons.includes(defaultId)) {
        eventHubButtons.push(defaultId);
      }
    }
  }

  const imageFit = normalizeStoredImageFit((parsed as LayoutConfig).imageFit);

  return {
    version: typeof parsed.version === 'number' ? parsed.version : 1,
    sections,
    buttons: {
      streaming: streamingButtons,
      social: socialButtons,
      eventHubs: eventHubButtons,
    },
    ...(imageFit ? { imageFit } : {}),
  };
}

function normalizeStoredImageFit(value: unknown): ArtistImageFitMode | undefined {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === 'fill' || mode === 'full' || mode === 'auto') return mode;
  return undefined;
}

/**
 * Check if a section is enabled in the normalized config
 */
export function isSectionEnabled(config: LayoutConfig, sectionId: SectionId): boolean {
  const section = config.sections.find((s) => s.id === sectionId);
  return section?.enabled ?? true;
}

/**
 * Get the ordered list of enabled sections
 */
export function getEnabledSections(config: LayoutConfig): SectionConfig[] {
  return config.sections.filter((s) => s.enabled);
}

/**
 * Create a minimal layout config for saving (only differences from default)
 * For now, we save the full config for simplicity and future-proofing.
 */
export function createSaveableConfig(config: LayoutConfig): LayoutConfig {
  const imageFit = normalizeStoredImageFit(config.imageFit);
  return {
    version: 1,
    sections: config.sections.map((s) => ({ id: s.id, enabled: s.enabled })),
    buttons: {
      streaming: [...config.buttons.streaming],
      social: [...config.buttons.social],
      eventHubs: [...config.buttons.eventHubs],
    },
    ...(imageFit ? { imageFit } : {}),
  };
}

/**
 * Check if a config is effectively the default (for UI hints)
 */
export function isDefaultConfig(config: LayoutConfig): boolean {
  // Check sections order and enabled state
  if (config.sections.length !== DEFAULT_LAYOUT.sections.length) {
    return false;
  }
  
  for (let i = 0; i < config.sections.length; i++) {
    if (
      config.sections[i].id !== DEFAULT_LAYOUT.sections[i].id ||
      config.sections[i].enabled !== DEFAULT_LAYOUT.sections[i].enabled
    ) {
      return false;
    }
  }

  // Check streaming buttons order
  if (config.buttons.streaming.length !== DEFAULT_LAYOUT.buttons.streaming.length) {
    return false;
  }
  for (let i = 0; i < config.buttons.streaming.length; i++) {
    if (config.buttons.streaming[i] !== DEFAULT_LAYOUT.buttons.streaming[i]) {
      return false;
    }
  }

  // Check social buttons order
  if (config.buttons.social.length !== DEFAULT_LAYOUT.buttons.social.length) {
    return false;
  }
  for (let i = 0; i < config.buttons.social.length; i++) {
    if (config.buttons.social[i] !== DEFAULT_LAYOUT.buttons.social[i]) {
      return false;
    }
  }

  // Check event hub buttons order
  if (config.buttons.eventHubs.length !== DEFAULT_LAYOUT.buttons.eventHubs.length) {
    return false;
  }
  for (let i = 0; i < config.buttons.eventHubs.length; i++) {
    if (config.buttons.eventHubs[i] !== DEFAULT_LAYOUT.buttons.eventHubs[i]) {
      return false;
    }
  }

  return true;
}
