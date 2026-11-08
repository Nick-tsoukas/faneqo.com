// ~/composables/useMarketingAttribution.js
// Marketing attribution capture for referral tracking (30-day window)

const STORAGE_KEY = 'mbq_marketing_attribution';
const COOKIE_KEY = 'mbq_ref';
const ATTRIBUTION_WINDOW_DAYS = 30;

export function useMarketingAttribution() {
  /**
   * Set marketing attribution from a ref code
   * Overwrites any existing attribution
   */
  function setMarketingAttribution(refCode) {
    if (!refCode || typeof refCode !== 'string') return;

    const normalizedCode = refCode.trim().toLowerCase();
    if (!normalizedCode) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const attribution = {
      ref: normalizedCode,
      capturedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    // Store in localStorage (primary)
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
      }
    } catch (e) {
      console.warn('[useMarketingAttribution] localStorage write failed:', e);
    }

    // Store in cookie (backup)
    try {
      if (typeof document !== 'undefined') {
        const cookieValue = encodeURIComponent(JSON.stringify(attribution));
        document.cookie = `${COOKIE_KEY}=${cookieValue}; path=/; max-age=${ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60}; SameSite=Lax`;
      }
    } catch (e) {
      console.warn('[useMarketingAttribution] cookie write failed:', e);
    }

    console.log('[useMarketingAttribution] Attribution set:', attribution);
  }

  /**
   * Get current marketing attribution (if valid)
   * Returns null if no attribution or expired
   */
  function getMarketingAttribution() {
    let attribution = null;

    // Try localStorage first
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          attribution = JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('[useMarketingAttribution] localStorage read failed:', e);
    }

    // Fallback to cookie if localStorage empty
    if (!attribution) {
      try {
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === COOKIE_KEY && value) {
              attribution = JSON.parse(decodeURIComponent(value));
              break;
            }
          }
        }
      } catch (e) {
        console.warn('[useMarketingAttribution] cookie read failed:', e);
      }
    }

    // Validate attribution
    if (attribution && isMarketingAttributionValid(attribution)) {
      return attribution;
    }

    return null;
  }

  /**
   * Check if attribution is valid (not expired)
   */
  function isMarketingAttributionValid(attribution = null) {
    const attr = attribution || getMarketingAttribution();
    if (!attr || !attr.ref || !attr.expiresAt) return false;

    const expiresAt = new Date(attr.expiresAt);
    const now = new Date();

    return expiresAt > now;
  }

  /**
   * Clear marketing attribution from storage
   */
  function clearMarketingAttribution() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('[useMarketingAttribution] localStorage clear failed:', e);
    }

    try {
      if (typeof document !== 'undefined') {
        document.cookie = `${COOKIE_KEY}=; path=/; max-age=0`;
      }
    } catch (e) {
      console.warn('[useMarketingAttribution] cookie clear failed:', e);
    }

    console.log('[useMarketingAttribution] Attribution cleared');
  }

  /**
   * Get the ref code if attribution is valid, otherwise null
   */
  function getValidRefCode() {
    const attribution = getMarketingAttribution();
    if (attribution && isMarketingAttributionValid(attribution)) {
      return attribution.ref;
    }
    return null;
  }

  return {
    setMarketingAttribution,
    getMarketingAttribution,
    isMarketingAttributionValid,
    clearMarketingAttribution,
    getValidRefCode,
  };
}
