<template>
  <div class="w-full max-w-5xl mx-auto">
    <div
      v-for="(item, idx) in faqs"
      :key="idx"
      class="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-black/40 overflow-hidden mb-3 last:mb-0"
    >
      <button
        @click="toggle(idx)"
        class="flex justify-between w-full py-4 px-4 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/40 hover:bg-white/5 transition"
      >
        <span class="text-left text-lg font-medium text-white">
          {{ item.question }}
        </span>
        <svg
          :class="{'transform rotate-180': openIndex === idx}"
          class="w-6 h-6 text-white transition-transform duration-200 shrink-0"
          fill="none"
          stroke="white"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        v-show="openIndex === idx"
        class="px-4 pb-5 text-white/80 prose prose-invert prose-sm max-w-none"
      >
        {{ item.answer }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, defineProps } from 'vue';

const props = defineProps({
  faqs: {
    type: Array,
    required: true,
    validator: (arr) =>
      arr.every(
        (x) =>
          typeof x.question === 'string' && typeof x.answer === 'string'
      ),
  },
});

const openIndex = ref(null);

function toggle(i) {
  openIndex.value = openIndex.value === i ? null : i;
}
</script>

<style scoped>
/* Optional: style the prose text if you want Markdown‐style paragraphs */
.prose-sm p {
  margin-bottom: 0.75rem;
}
</style>
