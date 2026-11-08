// composables/useBeacon.js
import { useRuntimeConfig } from '#imports';

export function useBeacon() {
  const config = useRuntimeConfig();
  console.log('→ sending media-play to', config.public.strapiUrl);

  /**
   * Tracks a media play (song or video) by POSTing to Strapi.
   * @param {number} bandId
   * @param {'song'|'video'} mediaType
   * @param {string} title
   */
  async function trackMediaPlay(bandId, mediaType, title) {
    const res = await fetch(
      `${config.public.strapiUrl}/api/media-plays/track`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bandId, mediaType, title }),
      }
    );
    console.log('← media-play response', res.status);
    return res;
  }

  /**
   * Tracks an outbound link click using Beacon API (or fetch fallback),
   * then navigates to the destination URL after a short delay.
   * @param {number} bandId
   * @param {string} platform
   * @param {string} destinationUrl
   */
  function sendLinkClickBeacon(bandId, platform, metadata = {}) {
    const apiUrl = `${config.public.strapiUrl}/api/link-clicks/track`;
    const payload = { bandId, platform };
    if (metadata.linkUrl) payload.linkUrl = metadata.linkUrl;
    if (metadata.linkLabel) payload.linkLabel = metadata.linkLabel;
    const data = JSON.stringify(payload);

    console.log('Tracking click:', payload);

    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      const result = navigator.sendBeacon(apiUrl, blob);
      console.log('Beacon result:', result);
    } else {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: data,
        keepalive: true,
      })
        .then((res) => console.log('Fetch tracking success', res))
        .catch((err) => console.error('Error tracking click:', err));
    }
  }

  const trackClick = (bandId, platform, destinationUrl, metadata = {}) => {
    sendLinkClickBeacon(bandId, platform, metadata);

    setTimeout(() => {
      window.location.href = destinationUrl;
    }, 300);
  };

  /** Record link click without navigating away (e.g. target="_blank" outbound links). */
  const trackClickBeacon = (bandId, platform, metadata = {}) => {
    sendLinkClickBeacon(bandId, platform, metadata);
  };

  return { trackClick, trackClickBeacon, trackMediaPlay };
}
