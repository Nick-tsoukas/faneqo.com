<template>
  <a
    :href="item.url"
    target="_blank"
    rel="noopener noreferrer"
    class="editorial-card group flex flex-col h-full rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-[var(--editorial-accent,#34d399)]/25 hover:bg-white/[0.05] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editorial-accent,#34d399)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    @click="onClick"
  >
    <div class="relative aspect-[16/10] bg-white/5 overflow-hidden shrink-0">
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.title"
        class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div v-else class="absolute inset-0 bg-gradient-to-br from-white/8 to-black/50" />
      <div
        v-if="item.contentType === 'video'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div class="w-10 h-10 rounded-full bg-black/50 backdrop-blur border border-white/15 flex items-center justify-center">
          <svg class="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
    <div class="flex flex-col flex-1 p-4">
      <span class="editorial-category-pill mb-1.5">{{ categoryLabel }}</span>
      <h4 class="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-white/95">
        {{ item.title }}
      </h4>
      <p v-if="item.excerpt" class="mt-1.5 text-xs text-white/50 line-clamp-2 leading-relaxed flex-1">
        {{ item.excerpt }}
      </p>
      <div class="mt-3 pt-2 flex items-center gap-1.5 text-xs font-medium editorial-action-row">
        <span>{{ actionLabel }}</span>
        <svg class="w-3.5 h-3.5 opacity-60" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </div>
    </div>
  </a>
</template>

<script setup>
import { computed } from 'vue';
import {
  getEditorialActionLabel,
  getEditorialTypeLabel,
} from '@/utils/editorialShowcase';

const props = defineProps({
  item: { type: Object, required: true },
});

const emit = defineEmits(['click']);

const actionLabel = computed(() => getEditorialActionLabel(props.item.contentType));
const categoryLabel = computed(() =>
  props.item.category || getEditorialTypeLabel(props.item.contentType)
);

function onClick(e) {
  emit('click', { item: props.item, event: e });
}
</script>
