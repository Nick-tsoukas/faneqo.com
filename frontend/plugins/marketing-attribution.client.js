// ~/plugins/marketing-attribution.client.js
// Captures marketing attribution from ?ref= query param on any page load

import { useMarketingAttribution } from '~/composables/useMarketingAttribution';

export default defineNuxtPlugin((nuxtApp) => {
  const { setMarketingAttribution, getMarketingAttribution } = useMarketingAttribution();
  const config = useRuntimeConfig();

  // Map of band page slugs to marketer codes
  const bandPageToMarketer = {
    'shannontehya': 'shannon',
  };

  nuxtApp.hook('app:mounted', () => {
    // Check for ref query param or band page on initial load
    captureAttribution();
  });

  nuxtApp.hook('page:finish', () => {
    // Check for ref query param or band page on navigation
    captureAttribution();
  });

  async function captureAttribution() {
    // First check for ?ref= param
    await captureRefFromUrl();
    // Then check for band page attribution
    await captureBandPageAttribution();
  }

  async function captureBandPageAttribution() {
    try {
      const pathname = window.location.pathname;
      // Remove leading slash and get the slug
      const slug = pathname.replace(/^\//, '').split('/')[0].toLowerCase();
      
      if (bandPageToMarketer[slug]) {
        const marketerCode = bandPageToMarketer[slug];
        const existing = getMarketingAttribution();
        const isNewAttribution = !existing || existing.ref !== marketerCode;
        
        if (isNewAttribution) {
          setMarketingAttribution(marketerCode);
          console.log('[marketing-attribution] Captured from band page:', slug, '→', marketerCode);
          await trackClick(marketerCode);
        }
      }
    } catch (e) {
      console.warn('[marketing-attribution] Failed to capture band page attribution:', e);
    }
  }

  async function captureRefFromUrl() {
    try {
      const url = new URL(window.location.href);
      const ref = url.searchParams.get('ref');
      
      if (ref) {
        // Check if this is a new ref (not already stored)
        const existing = getMarketingAttribution();
        const isNewClick = !existing || existing.ref !== ref.trim().toLowerCase();
        
        setMarketingAttribution(ref);
        console.log('[marketing-attribution] Captured ref from URL:', ref);
        
        // Track the click if it's a new ref or first visit
        if (isNewClick) {
          await trackClick(ref);
        }
      }
    } catch (e) {
      console.warn('[marketing-attribution] Failed to capture ref:', e);
    }
  }

  async function trackClick(ref) {
    try {
      const normalizedRef = ref.trim().toLowerCase();
      await fetch(`${config.public.strapiUrl}/api/marketer/track-click/${encodeURIComponent(normalizedRef)}`, {
        method: 'POST',
      });
      console.log('[marketing-attribution] Click tracked for:', normalizedRef);
    } catch (e) {
      // Silent fail - don't break user experience for tracking
      console.warn('[marketing-attribution] Failed to track click:', e);
    }
  }
});
