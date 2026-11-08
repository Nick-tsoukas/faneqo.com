<template>
  <NuxtLink :to="entry.href" class="saved" :aria-label="`${entry.title}, ${countLine}`">
    <div class="saved__stack">
      <FaneqoGalleryStack
        :media="entry.media"
        :title="entry.title"
        :count="entry.photoCount"
        size="compact"
        :interactive="false"
        :browsable="false"
      />
    </div>
    <div class="saved__meta">
      <p class="saved__title">{{ entry.title }}</p>
      <p v-if="entry.place" class="saved__place">{{ entry.place }}</p>
      <p class="saved__count">
        {{ countLine }}<template v-if="entry.youWereThere"> · You were there</template>
      </p>
    </div>
  </NuxtLink>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoGalleryStack from '~/components/media/FaneqoGalleryStack.vue'

const props = defineProps({
  entry: { type: Object, required: true },
})

const countLine = computed(() => {
  const n = Number(props.entry?.photoCount) || 0
  return n === 1 ? '1 photo' : `${n} photos`
})
</script>

<style scoped>
.saved {
  display: grid;
  grid-template-columns: 6.5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: center;
  min-height: 44px;
  color: inherit;
  text-decoration: none;
}
.saved:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 4px;
}
.saved__stack {
  min-width: 0;
  pointer-events: none;
}
.saved__meta {
  min-width: 0;
  display: grid;
  gap: 0.2rem;
}
.saved__title {
  margin: 0;
  overflow: hidden;
  color: #f7f9fc;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.saved__place,
.saved__count {
  margin: 0;
  color: rgba(247, 249, 252, 0.5);
  font-size: 0.8rem;
  line-height: 1.4;
}
.saved__count { color: rgba(247, 249, 252, 0.4); }
.saved:hover .saved__title { text-decoration: underline; text-underline-offset: 3px; }
</style>
