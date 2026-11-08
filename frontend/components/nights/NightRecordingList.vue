<template>
  <ul v-if="rows.length" class="nrl">
    <li
      v-for="(row, index) in rows"
      :id="`nrl-${row.id}`"
      :key="row.id"
      :class="{ 'is-fresh': Number(row.id) === Number(freshId) }"
    >
      <NightRecordingItem :recording="row" :artist-name="artistName" />
      <p class="nrl__meta">{{ metaOf(row) }}</p>
      <div class="nrl__actions">
        <button type="button" :disabled="busy" @click="$emit('edit', row)">Edit</button>
        <button type="button" :disabled="index === 0 || busy" @click="$emit('move', row, -1)">Move up</button>
        <button type="button" :disabled="index === rows.length - 1 || busy" @click="$emit('move', row, 1)">Move down</button>
        <button type="button" class="is-danger" :disabled="busy" @click="$emit('remove', row)">Remove</button>
      </div>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import NightRecordingItem from '~/components/nights/NightRecordingItem.vue'
import {
  presentNightRecordings,
  recordingStatusLabel,
  visibilityLabel,
} from '~/utils/nights/nightRecordings'

const props = defineProps({
  recordings: { type: Array, default: () => [] },
  artistName: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  freshId: { type: [Number, String], default: null },
})

defineEmits(['edit', 'remove', 'move'])

const rows = computed(() => presentNightRecordings(props.recordings))

function metaOf(row) {
  return [visibilityLabel(row.visibility), recordingStatusLabel(row.status)]
    .filter(Boolean)
    .join(' · ')
}
</script>

<style scoped>
.nrl {
  margin: 0;
  padding: 0;
  list-style: none;
}
.nrl li {
  display: grid;
  gap: 0.55rem;
  padding: 1.15rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.nrl li:first-child { padding-top: 0.15rem; }
.nrl li.is-fresh { outline: 0; }
.nrl__meta {
  margin: 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.8125rem;
}
.nrl__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem 0.85rem;
}
.nrl__actions button {
  min-height: 44px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.62);
  font: inherit;
  font-size: 0.9375rem;
  cursor: pointer;
}
.nrl__actions button:disabled { opacity: 0.32; }
.nrl__actions .is-danger { color: #fca5a5; }
.nrl__actions button:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (prefers-reduced-motion: reduce) {
  .nrl * { transition: none !important; }
}
</style>
