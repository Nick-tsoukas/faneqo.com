import { computed, unref } from 'vue';
import {
  isPublicationProfile,
  getPublicationAccent,
  buildPrimaryLinks,
  buildSecondaryPlatforms,
  getPrimaryLinkKeys,
} from '@/utils/publicationProfile';

/**
 * Resolve an input that may be a getter function, a ref/computed, or a raw value.
 * Callers of this composable pass getters (e.g. `() => props.hiddenLinks`), which
 * `unref` does NOT invoke — so we must call functions explicitly here.
 */
function resolveValue(source) {
  return typeof source === 'function' ? source() : unref(source);
}

/** Always return a plain array regardless of the resolved input shape. */
function toSafeArray(source) {
  const raw = resolveValue(source);
  if (Array.isArray(raw)) return raw;
  if (raw instanceof Set) return [...raw];
  return [];
}

export function usePublicationProfile(band, options = {}) {
  const bandRef = computed(() => resolveValue(band) || null);
  const customButtonsRef = computed(() => toSafeArray(options.customButtons));
  const hiddenLinksRef = computed(() => toSafeArray(options.hiddenLinks));
  const streamingPlatformsRef = computed(() => toSafeArray(options.streamingPlatforms));
  const socialPlatformsRef = computed(() => toSafeArray(options.socialPlatforms));

  const isPublication = computed(() => isPublicationProfile(bandRef.value));
  const accentColor = computed(() => getPublicationAccent(bandRef.value));

  const primaryLinks = computed(() =>
    buildPrimaryLinks(bandRef.value, customButtonsRef.value)
  );

  const primaryLinkKeys = computed(() => getPrimaryLinkKeys(primaryLinks.value));

  const secondaryPlatforms = computed(() =>
    buildSecondaryPlatforms(
      bandRef.value,
      hiddenLinksRef.value,
      streamingPlatformsRef.value,
      socialPlatformsRef.value
    )
  );

  return {
    isPublication,
    accentColor,
    primaryLinks,
    primaryLinkKeys,
    secondaryPlatforms,
  };
}
