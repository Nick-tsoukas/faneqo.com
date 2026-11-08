<template>
  <section
    v-if="showcase"
    class="editorial-showcase"
    :style="{ '--editorial-accent': accentColor }"
  >
    <div class="flex items-end justify-between gap-4 mb-5">
      <h2 class="text-xl sm:text-2xl font-bold text-white leading-tight tracking-tight">
        {{ showcase.sectionTitle }}
      </h2>
      <span v-if="totalCount > 1" class="shrink-0 text-white/35 text-xs font-medium pb-1">
        {{ totalCount }} stories
      </span>
    </div>

    <EditorialFeaturedCard
      :item="showcase.featured"
      class="mb-5"
      @click="onItemClick"
    />

    <!-- Single supporting story: render full width -->
    <EditorialContentCard
      v-if="showcase.supporting.length === 1"
      :item="showcase.supporting[0]"
      class="mb-5"
      @click="onItemClick"
    />

    <!-- Multiple supporting stories: 2-col grid on desktop, swipe carousel on mobile -->
    <div v-else-if="showcase.supporting.length > 1" class="mb-5">
      <div class="editorial-supporting flex gap-4 overflow-x-auto snap-x snap-mandatory pb-1 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible">
        <EditorialContentCard
          v-for="item in showcase.supporting"
          :key="item.id || item.url + item.title"
          :item="item"
          class="snap-start shrink-0 w-[85%] sm:w-[58%] md:w-auto"
          @click="onItemClick"
        />
      </div>
      <p class="md:hidden text-center text-white/35 text-xs mt-2">
        Swipe for more &rarr;
      </p>
    </div>

    <a
      v-if="showcase.archiveHref"
      :href="showcase.archiveHref"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl border border-white/12 bg-white/[0.03] text-sm font-semibold text-white/90 hover:text-[var(--editorial-accent,#34d399)] hover:border-[var(--editorial-accent,#34d399)]/35 hover:bg-white/[0.05] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editorial-accent,#34d399)]/60"
      @click="onArchiveClick"
    >
      {{ showcase.archiveLabel }}
      <svg class="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { resolveEditorialShowcase, getEditorialAnalyticsPlatform } from '@/utils/editorialShowcase';
import { getPublicationShortName } from '@/utils/publicationProfile';
import EditorialFeaturedCard from '@/components/editorial/EditorialFeaturedCard.vue';
import EditorialContentCard from '@/components/editorial/EditorialContentCard.vue';

const props = defineProps({
  band: { type: Object, required: true },
  accentColor: { type: String, default: '#34d399' },
  strapiBaseUrl: { type: String, default: '' },
});

const emit = defineEmits(['link-click']);

const config = useRuntimeConfig();
const strapiBase = computed(() => props.strapiBaseUrl || config.public.strapiUrl || '');

const showcase = computed(() =>
  resolveEditorialShowcase(
    props.band.editorialItems,
    props.band.editorialShowcaseEnabled === true,
    props.band.editorialSectionTitle,
    props.band.editorialArchiveUrl,
    props.band.editorialArchiveLabel,
    strapiBase.value,
    getPublicationShortName(props.band) || props.band.name
  )
);

const totalCount = computed(() => {
  const s = showcase.value;
  if (!s) return 0;
  return 1 + (Array.isArray(s.supporting) ? s.supporting.length : 0);
});

function onItemClick({ item }) {
  emit('link-click', {
    name: getEditorialAnalyticsPlatform(item.contentType),
    url: item.url,
    label: item.title,
  });
}

function onArchiveClick() {
  if (!showcase.value?.archiveHref) return;
  emit('link-click', {
    name: 'editorial_archive',
    url: showcase.value.archiveHref,
    label: showcase.value.archiveLabel,
  });
}
</script>

<style scoped>
/* Hide the horizontal scrollbar on the mobile supporting-story carousel while keeping scroll. */
.editorial-supporting {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.editorial-supporting::-webkit-scrollbar {
  display: none;
}

/* Category pills — CSS var colors (Tailwind /90 breaks on var()) */
.editorial-showcase :deep(.editorial-category-pill) {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1.2;
  backdrop-filter: blur(8px);
  color: var(--editorial-accent, #34d399);
  border: 1px solid color-mix(in srgb, var(--editorial-accent, #34d399) 45%, transparent);
  background: color-mix(in srgb, var(--editorial-accent, #34d399) 14%, rgba(0, 0, 0, 0.6));
}

.editorial-showcase :deep(.editorial-accent-text) {
  color: var(--editorial-accent, #34d399);
}

.editorial-showcase :deep(.editorial-action-row) {
  color: rgba(255, 255, 255, 0.7);
  transition: color 0.2s ease;
}

.editorial-showcase :deep(.group:hover .editorial-action-row) {
  color: var(--editorial-accent, #34d399);
}
</style>
