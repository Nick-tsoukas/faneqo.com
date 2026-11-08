<template>
  <section
    class="fq-gd"
    :class="{
      'is-single': context.count <= 1,
      'is-app-shell': appShell,
      'is-public-shell': !showDock && !appShell,
    }"
  >
    <header class="fq-gd__top">
      <NuxtLink class="fq-gd__back" :to="backTo">Back</NuxtLink>
      <button type="button" class="fq-gd__share" @click="emit('share')">
        {{ shareLabel }}
      </button>
    </header>

    <div class="fq-gd__context">
      <h1 class="fq-gd__artist">{{ context.artist }}</h1>
      <p v-if="context.collection" class="fq-gd__collection">{{ context.collection }}</p>
      <p v-if="context.place" class="fq-gd__place">{{ context.place }}</p>
      <p class="fq-gd__count">{{ context.countLabel }}</p>
      <p v-if="shownCaption" class="fq-gd__caption">{{ shownCaption }}</p>
      <button
        v-if="context.captionLong"
        type="button"
        class="fq-gd__more"
        @click="captionOpen = !captionOpen"
      >{{ captionOpen ? 'Less' : 'More' }}</button>
    </div>

    <MemoryDeck
      :memories="memories"
      :index="index"
      :reduced="reduced"
      @update:index="emit('select', $event)"
      @open="onOpen"
    />

    <div
      v-if="memories.length > 1"
      ref="thumbsEl"
      class="fq-gd__thumbs"
      role="listbox"
      aria-label="Gallery photographs"
    >
      <button
        v-for="(memory, i) in memories"
        :key="memory.id"
        type="button"
        role="option"
        class="fq-gd__thumb"
        :class="{ 'is-active': i === index }"
        :style="thumbStyle(memory)"
        :aria-selected="i === index"
        :aria-label="i === index ? `${memory.alt}, current photograph` : memory.alt"
        :data-gx-print="memory.id"
        @click="emit('select', i)"
      >
        <img :src="memory.thumbSrc || memory.src" alt="" :width="memory.width" :height="memory.height">
      </button>
    </div>

    <slot name="after" />

    <LabAppDock v-if="showDock" />
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import MemoryDeck from './MemoryDeck.vue'
import LabAppDock from './LabAppDock.vue'
import { normalizeDoorwayContext } from './galleryDoorway.js'

const props = defineProps({
  memories: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
  night: { type: Object, default: () => ({}) },
  backTo: { type: String, default: '/labs' },
  reduced: { type: Boolean, default: false },
  shareStatus: { type: String, default: '' },
  showDock: { type: Boolean, default: true },
  appShell: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'open', 'share'])
const captionOpen = ref(false)
const thumbsEl = ref(null)
const context = computed(() => normalizeDoorwayContext(props.night, props.memories))
const shownCaption = computed(() => {
  if (!context.value.caption) return ''
  return captionOpen.value ? context.value.caption : context.value.captionShort
})
const shareLabel = computed(() => {
  if (props.shareStatus === 'copied') return 'Link copied'
  if (props.shareStatus === 'shared') return 'Shared'
  return 'Share Gallery'
})

function thumbStyle(memory) {
  const w = Number(memory?.width) || 3
  const h = Number(memory?.height) || 4
  return { '--fq-gd-thumb-aspect': String(Math.max(0.45, Math.min(1.8, w / h))) }
}

watch(() => props.index, async () => {
  await nextTick()
  thumbsEl.value?.querySelector('.is-active')?.scrollIntoView({
    inline: 'center',
    block: 'nearest',
    behavior: props.reduced ? 'auto' : 'smooth',
  })
})

function onOpen(payload) {
  emit('open', payload)
}
</script>
