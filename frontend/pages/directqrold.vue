
<template>
  <div>
    <div class="loading-container">
      <div class="spinner"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route  = useRoute();

onMounted(async () => {
  const base    = 'https://qrserver-production.up.railway.app';
  // Reconstruct the full URL that was stored in Strapi
  const origin  = window.location.origin;
  const fullUrl = origin + route.fullPath;
  console.debug('[QR PAGE] fullUrl =', fullUrl);

  try {
    // 1) Fetch by exact URL match
    const fetchUrl = 
      `${base}/api/qrs?filters[url][$eq]=${encodeURIComponent(fullUrl)}&populate=*`;
    console.debug('[QR PAGE] Fetching QR by URL →', fetchUrl);
    const qrResponse: any = await $fetch(fetchUrl, { method: 'GET' });
    console.debug('[QR PAGE] qrResponse:', qrResponse);

    const qrData = qrResponse.data;
    console.debug('[QR PAGE] qrData length =', Array.isArray(qrData) ? qrData.length : typeof qrData);
    if (!Array.isArray(qrData) || qrData.length === 0) {
      console.error('[QR PAGE] No QR record found for URL:', fullUrl);
      return router.push('/error');
    }

    // 2) Use the first matching QR entry
    const qr    = qrData[0];
    const qrId  = qr.id;
    const attrs = qr.attributes;
    console.debug('[QR PAGE] Using QR ID =', qrId, 'attrs =', attrs);

    // 3) AR redirect if enabled
    console.debug('[QR PAGE] arEnabled =', attrs.arEnabled);
    if (attrs.arEnabled) {
      const tmpl = attrs.template || 'test';
      console.debug(`[QR PAGE] AR enabled → redirect to /ar/${qrId}?template=${tmpl}`);
      return router.replace({
        path: `/ar/${qrId}`,
        query: { template: tmpl }
      });
    }

    // 4) Record the scan
    console.debug('[QR PAGE] Recording scan for QR ID:', qrId);
    await $fetch(`${base}/api/scans`, {
      method: 'POST',
      body: { data: { date: new Date().toISOString(), qr: qrId } }
    });

    // 5) Non-AR routing logic
    const { q_type, link, band, event, tour, album, stream } = attrs;
    console.debug('[QR PAGE] q_type =', q_type);

    if (q_type === 'bandProfile' && band?.data) {
      const slug = band.data.attributes.slug;
      console.debug('[QR PAGE] Redirecting to band catch-all /' + slug);
      return router.push(`/${slug}`);
    } else if (q_type === 'events' && event?.data) {
      const slug = event.data.attributes.slug;
      console.debug('[QR PAGE] Redirecting to /event/' + slug);
      return router.push(`/event/${slug}`);
    } else if (q_type === 'tours' && tour?.data) {
      const slug = tour.data.attributes.slug;
      console.debug('[QR PAGE] Redirecting to /tour/' + slug);
      return router.push(`/tour/${slug}`);
    } else if (q_type === 'albums' && album?.data) {
      const slug = album.data.attributes.slug;
      console.debug('[QR PAGE] Redirecting to /album/' + slug);
      return router.push(`/album/${slug}`);
    } else if (q_type === 'stream' && stream?.data) {
      const sid = stream.data.id;
      console.debug('[QR PAGE] Redirecting to /stream/' + sid);
      return router.push(`/stream/${sid}`);
    } else if (q_type === 'social') {
      console.debug('[QR PAGE] Redirecting to /social/' + qrId);
      return router.push(`/social/${qrId}`);
    } else if (q_type === 'externalURL' && link) {

  // ensure we have a valid absolute URL some deploy 
  const raw = link.trim();
  const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  console.debug('[QR PAGE] Redirecting externally to:', target);
  window.location.href = target;
      return;
    } else {
      console.warn('[QR PAGE] No matching QR type—sending to /dashboard');
      return router.push('/');
    }

  } catch (error) {
    console.error('[QR PAGE] Error in QR flow:', error);
    router.push('/error');
  }
});
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #000; z-index: 9999;
}
.spinner {
  border: 8px solid #444;
  border-top: 8px solid #0f0;
  border-radius: 50%;
  width: 60px; height: 60px;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
