<template>
  <section v-if="plan.recordings.length" class="pnr">
    <h2>From the stage</h2>

    <template v-if="plan.mixed">
      <div v-if="plan.audio.length" class="pnr__group">
        <h3>Hear the night</h3>
        <ul class="pnr__list">
          <li v-for="row in plan.audio" :key="row.id">
            <NightRecordingItem :recording="row" :artist-name="artistName" />
          </li>
        </ul>
      </div>
      <div v-if="plan.video.length" class="pnr__group">
        <h3>Watch the night</h3>
        <ul class="pnr__list">
          <li v-for="row in plan.video" :key="row.id">
            <NightRecordingItem :recording="row" :artist-name="artistName" />
          </li>
        </ul>
      </div>
    </template>

    <ul v-else class="pnr__list">
      <li v-for="row in plan.recordings" :key="row.id">
        <NightRecordingItem :recording="row" :artist-name="artistName" />
      </li>
    </ul>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import NightRecordingItem from '~/components/nights/NightRecordingItem.vue'
import { recordingSectionPlan } from '~/utils/nights/nightRecordings'

const props = defineProps({
  recordings: { type: Array, default: () => [] },
  artistName: { type: String, default: '' },
})

const plan = computed(() => recordingSectionPlan(props.recordings))
</script>

<style scoped>
.pnr { min-width: 0; }
.pnr h2,
.pnr h3 {
  margin: 0 0 0.95rem;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(245, 245, 246, 0.72);
}
.pnr h3 { margin-top: 0.15rem; }
.pnr__group + .pnr__group { margin-top: 1.8rem; }
.pnr__list {
  display: grid;
  gap: 1.35rem;
  margin: 0;
  padding: 0;
  list-style: none;
}
@media (min-width: 768px) {
  .pnr__list { gap: 1.6rem; }
}
</style>
