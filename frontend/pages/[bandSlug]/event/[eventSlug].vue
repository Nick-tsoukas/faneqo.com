<template>
  <div class="relative bg-black text-white min-h-screen pt-[var(--header-height)] pb-20 overflow-hidden">
    <div class="pointer-events-none absolute inset-0 -z-10">
      <div class="absolute -top-24 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-purple-500/20 blur-3xl"></div>
      <div class="absolute -bottom-28 right-[-120px] h-[520px] w-[520px] rounded-full bg-emerald-500/15 blur-3xl"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-black via-black to-black"></div>
    </div>

    <div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-10">
      <div class="flex items-center justify-between gap-3">
        <NuxtLink
          :to="`/${String(route.params.bandSlug || '')}`"
          class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 hover:text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back
        </NuxtLink>

        <div v-if="eventData?.band?.data?.attributes?.name" class="text-xs text-white/50 truncate">
          {{ eventData.band.data.attributes.name }}
        </div>
      </div>

      <div v-if="loading" class="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div class="text-white/70">Loading event…</div>
      </div>

      <div v-else-if="error" class="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <div class="text-red-200 font-semibold">Couldn’t load this event</div>
        <div class="mt-1 text-red-200/80 text-sm">{{ error }}</div>
      </div>

      <div v-else class="mt-6">
        <EventPosterFrame
          v-if="posterUrl"
          :src="posterUrl"
          :alt="eventData.title ? `${eventData.title} poster` : 'Event poster'"
          priority
          @open="posterOpen = true"
        />

        <header class="event-head" :class="{ 'mt-6': posterUrl }">
          <h1 class="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {{ eventData.title || 'Event' }}
          </h1>

          <div class="mt-3 flex flex-wrap gap-2 text-sm text-white/70">
            <span v-if="eventData.date" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <path d="M3 10h18" />
                <path d="M5 6h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
              </svg>
              {{ formatDate(eventData.date) }}
            </span>

            <span v-if="eventData.time" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-purple-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              {{ formatTime(eventData.time) }}
            </span>

            <span v-if="eventData.doorsTime" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/70" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 21h18" />
                <path d="M7 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16" />
                <path d="M10 12h.01" />
              </svg>
              Doors {{ formatTime(eventData.doorsTime) }}
            </span>

            <span v-if="eventData.venue || eventData.city || eventData.state" class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1">
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 21s7-4.4 7-11a7 7 0 0 0-14 0c0 6.6 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span class="truncate">{{ eventData.venue || `${eventData.city || ''}${eventData.state ? `, ${eventData.state}` : ''}` }}</span>
            </span>
          </div>

          <div class="mt-5 flex flex-wrap items-center gap-3">
            <a
              v-if="eventData.link"
              :href="eventData.link"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/25 to-violet-500/25 border border-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M3 10h18" />
                <path d="M7 15h1" />
                <path d="M6 19h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3z" />
              </svg>
              {{ eventData.ticketLabel || 'Tickets' }}
            </a>

            <div v-if="eventData.link && eventData.priceLine" class="text-sm text-white/55">
              {{ eventData.priceLine }}
            </div>

            <a
              v-if="eventData.website && !eventData.link"
              :href="eventData.website"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 hover:text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/70" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M10 14a5 5 0 0 1 0-7l.8-.8a5 5 0 0 1 7 7l-.8.8" />
                <path d="M14 10a5 5 0 0 1 0 7l-.8.8a5 5 0 1 1-7-7l.8-.8" />
              </svg>
              Link
            </a>
          </div>
        </header>

        <div class="mt-6 grid gap-4 lg:grid-cols-3">
          <div class="lg:col-span-2 space-y-4">
            <section v-if="descriptionHTML" class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-center gap-2 text-white font-semibold">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 15a4 4 0 0 1-4 4H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
                </svg>
                About this event
              </div>
              <div
                class="prose prose-invert max-w-none text-base leading-relaxed mt-4"
                v-html="descriptionHTML"
              ></div>
            </section>

            <section class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-center gap-2 text-white font-semibold">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-purple-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="M4.9 4.9l1.4 1.4" />
                  <path d="M17.7 17.7l1.4 1.4" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="M4.9 19.1l1.4-1.4" />
                  <path d="M17.7 6.3l1.4-1.4" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
                Details
              </div>

              <div class="mt-4 grid sm:grid-cols-2 gap-3">
                <div v-if="eventData.date" class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="text-xs text-white/60">Date</div>
                  <div class="mt-1 text-white font-semibold">{{ formatDate(eventData.date) }}</div>
                </div>
                <div v-if="eventData.time" class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="text-xs text-white/60">Time</div>
                  <div class="mt-1 text-white font-semibold">{{ formatTime(eventData.time) }}</div>
                </div>
                <div v-if="eventData.venue" class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="text-xs text-white/60">Venue</div>
                  <div class="mt-1 text-white font-semibold">{{ eventData.venue }}</div>
                </div>
                <div v-if="eventData.city || eventData.state" class="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div class="text-xs text-white/60">City</div>
                  <div class="mt-1 text-white font-semibold">{{ eventData.city }}<span v-if="eventData.city && eventData.state">, </span>{{ eventData.state }}</div>
                </div>
                <div v-if="eventData.address" class="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
                  <div class="text-xs text-white/60">Address</div>
                  <div class="mt-1 text-white font-semibold">{{ eventData.address }}</div>
                </div>
              </div>
            </section>
          </div>

          <div class="space-y-4">
            <section v-if="eventData.contactEmail || eventData.contactPhone" class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-center gap-2 text-white font-semibold">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M21 8v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" />
                  <path d="M21 8l-9 6-9-6" />
                  <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2" />
                </svg>
                Contact
              </div>

              <div class="mt-4 space-y-3">
                <a
                  v-if="eventData.contactEmail"
                  :href="`mailto:${eventData.contactEmail}`"
                  class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <div class="min-w-0">
                    <div class="text-xs text-white/60">Email</div>
                    <div class="text-sm font-semibold text-white truncate">{{ eventData.contactEmail }}</div>
                  </div>
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
                <a
                  v-if="eventData.contactPhone"
                  :href="`tel:${eventData.contactPhone}`"
                  class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <div class="min-w-0">
                    <div class="text-xs text-white/60">Phone</div>
                    <div class="text-sm font-semibold text-white truncate">{{ eventData.contactPhone }}</div>
                  </div>
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M22 16.92V21a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5 3h4.09a2 2 0 0 1 2 1.72c.12.81.3 1.6.54 2.36a2 2 0 0 1-.45 2.11L9.91 10.91a16 16 0 0 0 3.18 3.18l1.72-1.27a2 2 0 0 1 2.11-.45c.76.24 1.55.42 2.36.54A2 2 0 0 1 22 16.92z" />
                  </svg>
                </a>
              </div>
            </section>

            <section v-if="eventData.ageRestriction || eventData.band?.data" class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-center gap-2 text-white font-semibold">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-purple-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" />
                  <path d="M20 21a8 8 0 0 0-16 0" />
                </svg>
                Notes
              </div>

              <div class="mt-4 space-y-3">
                <div v-if="eventData.ageRestriction" class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div class="text-xs text-white/60">Age restriction</div>
                  <div class="text-sm font-semibold text-white">{{ eventData.ageRestriction }}</div>
                </div>
                <div v-if="eventData.band?.data" class="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                  <div class="text-xs text-white/60">Band</div>
                  <div class="text-sm font-semibold text-white">{{ eventData.band.data.attributes.name }}</div>
                </div>
              </div>
            </section>

            <section v-if="hasSocialLinks" class="rounded-2xl border border-white/10 bg-black/20 p-5">
              <div class="flex items-center gap-2 text-white font-semibold">
                <svg viewBox="0 0 24 24" class="h-5 w-5 text-emerald-200" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M18 8a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h7a3 3 0 0 0 3-3" />
                  <path d="M10 12l8-8" />
                  <path d="M15 4h3v3" />
                </svg>
                Links
              </div>

              <div class="mt-4 grid gap-2">
                <a
                  v-for="row in socialRows"
                  :key="row.key"
                  :href="row.href"
                  target="_blank"
                  rel="noopener"
                  class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
                >
                  <div class="min-w-0">
                    <div class="text-xs text-white/60">{{ row.label }}</div>
                    <div class="text-sm font-semibold text-white truncate">{{ row.short }}</div>
                  </div>
                  <svg viewBox="0 0 24 24" class="h-4 w-4 text-white/60" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7" />
                    <path d="M7 7h10v10" />
                  </svg>
                </a>
              </div>
            </section>
          </div>
        </div>

        <FaneqoMediaLightbox
          :open="posterOpen"
          :items="posterItems"
          :title="eventData.title || 'Event poster'"
          zoomable
          @close="posterOpen = false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useRuntimeConfig } from "#imports";

import { format, parse } from "date-fns";
import { formatCalendarDate } from "~/utils/dates/calendarDate";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import EventPosterFrame from "@/components/events/EventPosterFrame.vue";
import FaneqoMediaLightbox from "@/components/media/FaneqoMediaLightbox.vue";

const route = useRoute();
const router = useRouter();
const { findOne } = useStrapi();
const eventData = ref({});
const loading = ref(false);
const error = ref(null);
const config = useRuntimeConfig();
const event = ref({});
const posterOpen = ref(false);

const posterUrl = computed(() => {
  const image = eventData.value?.image;
  return image?.data?.attributes?.url || image?.url || "";
});

const posterItems = computed(() => {
  if (!posterUrl.value) return [];
  return [
    {
      url: posterUrl.value,
      largeUrl: posterUrl.value,
      alt: eventData.value?.title ? `${eventData.value.title} poster` : "Event poster",
    },
  ];
});

// Convert ProseMirror JSON to HTML
const descriptionHTML = computed(() => {
  if (!eventData.value?.description) return "";
  return generateHTML(eventData.value.description, [StarterKit, Underline]);
});

async function fetchEvent() {
  const bandSlug = route.params.bandSlug;
  const eventSlug = route.params.eventSlug;

  try {
    loading.value = true;
    const res = await fetch(
      `${config.public.strapiUrl}/api/events?` +
        `filters[slug][$eq]=${encodeURIComponent(eventSlug)}` +
        `&populate=band,image`
    );
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    const { data } = await res.json();
    if (!data.length) {
      // no such event → back to band page
      return router.replace(`/${bandSlug}`);
    }

    eventData.value = {
      id: data[0].id,
      ...data[0].attributes,
    };
  } catch (err) {
    console.error("[fetchEvent]", err);
    error.value = err.message || "Unknown error";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await fetchEvent();

  // Track Event View with rich analytics data
  try {
    const eventId = eventData.value?.id;
    const bandId = eventData.value?.band?.data?.id || null;
    const eventTitle = eventData.value?.title || "Untitled Event";

    if (eventId) {
      // Check for QR entry (via query param or sessionStorage)
      const urlParams = new URLSearchParams(window.location.search);
      const isQrEntry = urlParams.has('qr') || urlParams.has('scan') || sessionStorage.getItem('qr_entry') === 'true';
      const qrId = urlParams.get('qr') || urlParams.get('qrId') || null;
      
      // Get or create session/visitor IDs (privacy-safe, no PII)
      let visitorId = localStorage.getItem('_vid');
      if (!visitorId) {
        visitorId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        localStorage.setItem('_vid', visitorId);
      }
      let sessionId = sessionStorage.getItem('_sid');
      if (!sessionId) {
        sessionId = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
        sessionStorage.setItem('_sid', sessionId);
      }

      await fetch(`${config.public.strapiUrl}/api/event-page-views/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventId,
          band: bandId,
          title: eventTitle,
          timestamp: new Date().toISOString(),
          pageUrl: window.location.href,
          path: window.location.pathname,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
          screenW: window.screen?.width || null,
          screenH: window.screen?.height || null,
          tzOffset: new Date().getTimezoneOffset(),
          lang: navigator.language || '',
          sessionId,
          visitorId,
          entryType: isQrEntry ? 'qr' : 'web',
          qrId: qrId ? Number(qrId) : null,
        }),
      });
      console.log("📈 Event view tracked");
    }
  } catch (err) {
    console.error("⚠️ Failed to track event view:", err);
  }
});

//   onMounted(async () => {
//     // 1) Fetch the event so we know the band slug
//     try {
//       const { data } = await findOne('events', route.params.id, {
//         populate: ['image', 'band'],
//       })
//       eventData.value = data.attributes
//       if (data.attributes.band?.data) {
//         eventData.value.band = data.attributes.band
//       }
//     } catch (err) {
//       console.error('Error fetching event data:', err)
//       return
//     }

//   })

// The rest of your utility functions...

const formattedDescription = computed(() =>
  eventData.value?.description
    ? eventData.value.description.replace(/\n/g, "<br>")
    : ""
);

const formatDate = (dateStr) =>
  formatCalendarDate(dateStr, { month: "long", day: "numeric", year: "numeric" });

function formatTime(timeStr) {
  if (!timeStr) return "";
  try {
    const pattern = timeStr.includes(".") ? "HH:mm:ss.SSS" : "HH:mm:ss";
    return format(parse(timeStr, pattern, new Date()), "h:mm a");
  } catch {
    return timeStr;
  }
}

const hasSocialLinks = computed(() =>
  ["facebook", "twitter", "instagram", "youtube", "tiktok", "website"].some(
    (key) => eventData.value[key]
  )
);

const socialRows = computed(() => {
  const rows = [];
  const add = (key, label) => {
    const href = eventData.value?.[key];
    if (!href) return;
    const short = String(href)
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/$/, "");
    rows.push({ key, label, href, short });
  };

  add("website", "Website");
  add("instagram", "Instagram");
  add("youtube", "YouTube");
  add("tiktok", "TikTok");
  add("facebook", "Facebook");
  add("twitter", "Twitter / X");
  return rows;
});
</script>

<style scoped>
.container {
  max-width: 1200px;
}

.prose p {
  margin-block-start: 1em;
  margin-block-end: 1em;
  margin-bottom: 1rem;
}
.prose p:empty::before {
  content: "\00a0"; /* a single non‑breaking space */
  display: block; /* ensure it occupies its own line */
}

.prose strong {
  font-weight: 600;
}

.event-head {
  padding: 0.15rem 0.1rem 0.25rem;
}
</style>
