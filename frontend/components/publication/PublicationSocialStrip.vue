<template>
  <section v-if="platforms.length > 0" class="pt-2" :style="accentStyle">
    <h3 class="text-white/35 text-[10px] font-bold uppercase tracking-widest mb-3">
      More links
    </h3>
    <div class="flex flex-wrap gap-2">
      <a
        v-for="platform in platforms"
        :key="platform.name"
        :href="platform.url"
        target="_blank"
        rel="noopener noreferrer"
        :title="platform.label"
        :aria-label="platform.label"
        class="pub-social-icon group w-11 h-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center hover:border-[var(--pub-accent)]/35 hover:bg-white/[0.08] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pub-accent)]/50"
        @click.prevent="onClick(platform)"
      >
        <PlatformIcon
          :existing-icon="platform.img"
          :iconify="platform.iconify"
          :color="platform.color || '#ffffff'"
          :alt="platform.label"
          class-name="w-5 h-5 opacity-80 group-hover:opacity-100 transition-opacity"
        />
      </a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import PlatformIcon from '@/components/ui/PlatformIcon.vue';

const props = defineProps({
  platforms: { type: Array, default: () => [] },
  accentColor: { type: String, default: '#34d399' },
});

const emit = defineEmits(['link-click']);

const accentStyle = computed(() => ({
  '--pub-accent': props.accentColor,
}));

function onClick(platform) {
  emit('link-click', {
    name: platform.name,
    url: platform.url,
    label: platform.label,
  });
}
</script>
