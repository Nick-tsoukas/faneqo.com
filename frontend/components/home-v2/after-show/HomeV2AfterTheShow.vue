<template>
  <section
    :id="sectionId"
    ref="rootEl"
    class="ats"
    aria-label="After the show: check in, remember the room, message them"
  >
    <div class="ats__stage" aria-hidden="true">
      <div class="ats__beam ats__beam--hot"></div>
      <div class="ats__beam ats__beam--cool"></div>
    </div>

    <div class="ats__inner">
      <HomeV2ShowNight v-if="withShowNight" :copy="copy.night" :artist-name="artistName" :fan="fan" />
      <HomeV2RoomRemembered
        :copy="copy.remember"
        :fan="fan"
        :neighbors="neighbors"
        :after-count="129"
      />
      <HomeV2MessageTheNight
        :copy="copy.message"
        :artist-name="artistName"
        :venue="venue"
        :once="messengerOnce"
        :gallery="gallery"
        :hide-cta="hideMessageCta"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import HomeV2ShowNight from '@/components/home-v2/after-show/HomeV2ShowNight.vue'
import HomeV2RoomRemembered from '@/components/home-v2/after-show/HomeV2RoomRemembered.vue'
import HomeV2MessageTheNight from '@/components/home-v2/after-show/HomeV2MessageTheNight.vue'
import { useHomeV2AfterTheShow } from '~/composables/home-v2/useHomeV2AfterTheShow.js'
import {
  AFTER_THE_SHOW_FAN,
  AFTER_THE_SHOW_NEIGHBORS,
  afterTheShowCopy,
} from '~/utils/home-v2/afterTheShow.js'

const props = defineProps({
  artist: { type: Object, default: null },
  // Homepage V3 options; the defaults keep the original chapter exactly as it was
  sectionId: { type: String, default: 'after-the-show' },
  withShowNight: { type: Boolean, default: true },
  venueName: { type: String, default: 'Nashville' },
  gallery: { type: Array, default: null },
  messengerOnce: { type: Boolean, default: false },
  hideMessageCta: { type: Boolean, default: false },
})

const artistName = computed(() => String(props.artist?.name || 'BADFLOWER').toUpperCase())
const venue = computed(() => props.venueName)
const copy = computed(() => afterTheShowCopy(artistName.value))
const fan = AFTER_THE_SHOW_FAN
const neighbors = AFTER_THE_SHOW_NEIGHBORS

const rootEl = ref(null)
let revert = null

onMounted(async () => {
  await nextTick()
  if (rootEl.value) revert = useHomeV2AfterTheShow(rootEl)
})

onUnmounted(() => {
  revert?.()
  revert = null
})
</script>

<style scoped>
.ats {
  position: relative;
  z-index: 10;
  overflow-x: clip;
  background: #050608;
}

.ats__stage {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.ats__beam {
  position: absolute;
  border-radius: 50%;
}

.ats__beam--hot {
  width: min(48rem, 130%);
  height: min(48rem, 130%);
  left: -24%;
  top: 4%;
  background: radial-gradient(circle, rgba(255, 79, 216, 0.16) 0%, rgba(139, 108, 255, 0.08) 42%, transparent 72%);
}

.ats__beam--cool {
  width: min(36rem, 90%);
  height: min(36rem, 90%);
  right: -18%;
  bottom: 8%;
  background: radial-gradient(circle, rgba(76, 166, 255, 0.1) 0%, transparent 70%);
}

.ats__inner {
  position: relative;
  z-index: 1;
  width: min(100% - 1.5rem, 72rem);
  margin: 0 auto;
  padding: 1.25rem 0 2rem;
}

@media (min-width: 640px) {
  .ats__inner {
    width: min(100% - 3rem, 72rem);
    padding: 2.5rem 0 3.5rem;
  }
}
</style>
