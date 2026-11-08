<template>
  <ol class="passport-list">
    <li v-for="entry in galleries" :key="entry.saveId || entry.gallery?.id" class="passport-list__night">
      <ShowNightStory
        v-bind="storyProps(entry)"
        :update-id="entry.gallery?.id"
        saved
        allow-passport
        allow-share
        :saving="savingIds.includes(Number(entry.gallery?.id))"
        :sharing="sharingIds.includes(Number(entry.gallery?.id))"
        :action-status="actionStatus[entry.gallery?.id] || ''"
        @remove="emit('remove', entry)"
        @share="emit('share', entry)"
      />
      <NuxtLink :to="entry.sharePath" class="passport-list__open">Open this memory</NuxtLink>
    </li>
  </ol>
</template>

<script setup>
import ShowNightStory from '~/components/updates/ShowNightStory.vue'
import { nightStoryPropsFromUpdate } from '~/utils/updates/nightStoryPropsFromUpdate'

defineProps({
  galleries: { type: Array, default: () => [] },
  savingIds: { type: Array, default: () => [] },
  sharingIds: { type: Array, default: () => [] },
  actionStatus: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['remove', 'share'])

function storyProps(entry) {
  const gallery = entry?.gallery || {}
  return nightStoryPropsFromUpdate(gallery, { artistName: gallery.band?.name })
}
</script>

<style scoped>
.passport-list {
  list-style: none;
  display: grid;
  gap: clamp(2.8rem, 8vw, 5rem);
  margin: 0;
  padding: 0;
}
.passport-list__night {
  position: relative;
  padding-bottom: clamp(2.5rem, 7vw, 4.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.passport-list__open {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 0.4rem;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.78rem;
  text-decoration: none;
  border-bottom: 1px solid rgba(247, 249, 252, 0.16);
}
.passport-list__open:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
</style>
