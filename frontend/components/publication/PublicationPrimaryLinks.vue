<template>
  <section v-if="links.length > 0" class="space-y-2.5" :style="accentStyle">
    <a
      v-for="link in links"
      :key="link.key"
      :href="link.url"
      target="_blank"
      rel="noopener noreferrer"
      class="pub-primary-link group flex items-center gap-3 w-full px-4 py-3.5 rounded-xl border border-white/12 bg-white/[0.04] hover:border-[var(--pub-accent)]/40 hover:bg-white/[0.06] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pub-accent)]/50"
      @click="onClick(link, $event)"
    >
      <div class="w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center shrink-0 group-hover:border-[var(--pub-accent)]/30 transition-colors">
        <img
          v-if="link.customIcon?.url"
          :src="link.customIcon.url"
          :alt="link.title || 'Link icon'"
          class="w-full h-full object-cover rounded-lg"
        />
        <svg v-else class="w-4 h-4 text-white/70 group-hover:text-[var(--pub-accent)] transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
      <div class="flex-1 min-w-0 text-left">
        <div class="text-white font-semibold text-sm sm:text-base truncate">{{ link.title }}</div>
        <div v-if="link.subtitle" class="text-white/45 text-xs truncate mt-0.5">{{ link.subtitle }}</div>
      </div>
      <svg class="w-4 h-4 text-white/25 group-hover:text-[var(--pub-accent)] shrink-0 transition-colors" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </a>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  links: { type: Array, default: () => [] },
  accentColor: { type: String, default: '#34d399' },
});

const emit = defineEmits(['link-click']);

const accentStyle = computed(() => ({
  '--pub-accent': props.accentColor,
}));

function onClick(link, e) {
  emit('link-click', {
    name: link.platformName || link.source || 'custom',
    url: link.url,
    label: link.title,
  });
}
</script>
