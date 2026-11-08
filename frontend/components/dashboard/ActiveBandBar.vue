<template>
  <div class="active-band">
    <span class="active-band__avatar">
      <NuxtImg
        v-if="band.imageUrl"
        provider="ipx"
        format="webp"
        :src="band.imageUrl"
        class="active-band__img"
        width="72"
        height="72"
        loading="lazy"
        decoding="async"
        :modifiers="{ fit: 'cover' }"
      />
      <span v-else aria-hidden="true">{{ initial }}</span>
    </span>

    <span class="active-band__meta">
      <span class="active-band__label">Workspace</span>
      <span class="active-band__name">{{ band.name || band.title || 'Untitled artist' }}</span>
    </span>

    <NuxtLink to="/dashboard" class="active-band__switch">Switch artist</NuxtLink>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  band: {
    type: Object,
    required: true,
  },
})

const initial = computed(() => {
  const name = String(props.band?.name || props.band?.title || '').trim()
  return name ? name.charAt(0).toUpperCase() : '?'
})
</script>

<style scoped>
.active-band {
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  max-width: 100%;
  padding: 0.4rem 0.5rem 0.4rem 0.4rem;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 999px;
  background: var(--fq-surface, #0b0c10);
}

.active-band__avatar {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--fq-surface-tinted, #0d0b10);
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.85rem;
  font-weight: 700;
}

.active-band__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.active-band__meta {
  display: flex;
  min-width: 0;
  flex-direction: column;
  line-height: 1.2;
}

.active-band__label {
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.active-band__name {
  overflow: hidden;
  max-width: 11rem;
  color: var(--fq-text-primary, #f5f5f6);
  font-size: 0.875rem;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-band__switch {
  flex-shrink: 0;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.75rem;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 160ms ease, color 160ms ease;
}

.active-band__switch:hover,
.active-band__switch:focus-visible {
  background: rgba(255, 255, 255, 0.1);
  color: var(--fq-text-primary, #f5f5f6);
}
</style>
