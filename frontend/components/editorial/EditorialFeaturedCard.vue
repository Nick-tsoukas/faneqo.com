<template>
  <a
    :href="item.url"
    target="_blank"
    rel="noopener noreferrer"
    class="editorial-featured group block w-full rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-[var(--editorial-accent,#34d399)]/25 hover:bg-white/[0.05] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--editorial-accent,#34d399)]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    @click="onClick"
  >
    <div class="relative w-full h-[200px] sm:h-[215px] md:h-[235px] bg-white/5 overflow-hidden">
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.title"
        class="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div v-else class="absolute inset-0 bg-gradient-to-br from-white/10 to-black/60" />
      <div class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" aria-hidden="true" />
      <div class="absolute top-3 left-3 z-10">
        <span class="editorial-category-pill">{{ categoryLabel }}</span>
      </div>
      <div
        v-if="item.contentType === 'video'"
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div class="w-12 h-12 rounded-full bg-black/50 backdrop-blur border border-white/20 flex items-center justify-center">
          <svg class="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
    <div class="p-4 sm:p-5">
      <h3 class="text-lg sm:text-xl font-bold text-white leading-snug line-clamp-3 sm:line-clamp-2 group-hover:text-white transition-colors">
        {{ item.title }}
      </h3>
      <p v-if="item.excerpt" class="mt-1.5 text-sm text-white/60 line-clamp-2 leading-relaxed">
        {{ item.excerpt }}
      </p>
      <div class="mt-3 flex items-center gap-2 text-sm font-semibold editorial-accent-text">
        <span>{{ actionLabel }}</span>
        <svg class="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
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
