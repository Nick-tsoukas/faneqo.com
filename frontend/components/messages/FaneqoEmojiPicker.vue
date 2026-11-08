<template>
  <div class="fq-emoji">
    <div v-if="showQuick" class="fq-emoji__quick" role="list" aria-label="Quick emoji">
      <button
        v-for="emo in quickRow"
        :key="emo"
        type="button"
        class="fq-emoji__chip"
        :aria-label="`Insert ${emo}`"
        @click="pick(emo)"
      >
        {{ emo }}
      </button>
    </div>

    <ClientOnly>
      <Motion
        v-if="open && pickerReady"
        :style="floatingStyles"
        v-bind="popoverMotion(reduced)"
        class="fq-emoji__pop"
        role="dialog"
        aria-label="Emoji picker"
      >
        <div ref="floatingRef" class="fq-emoji__shell">
          <p v-if="loadError" class="fq-emoji__fail">
            Couldn't load emoji.
            <button type="button" class="fq-emoji__retry" @click="loadPicker">Try again</button>
          </p>
          <emoji-picker
            v-else
            class="dark fq-emoji__el"
            @emoji-click="onPickerClick"
          />
        </div>
      </Motion>
    </ClientOnly>
  </div>
</template>

<script setup>
/**
 * Client-only wrapper around emoji-picker-element.
 * Do not import the package from other files.
 */
import { computed, onMounted, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { useLocalStorage, usePreferredReducedMotion } from '@vueuse/core'
import { useFaneqoFloating } from '~/composables/useFaneqoFloating'
import { popoverMotion } from '~/utils/ui/motionTokens'

const STARTER = ['❤️', '🔥', '🤘', '🙌', '😂', '👀', '🎸']

const props = defineProps({
  open: { type: Boolean, default: false },
  showQuick: { type: Boolean, default: false },
  referenceEl: { type: Object, default: null },
  placement: { type: String, default: 'top-start' },
})

const emit = defineEmits(['select', 'close', 'update:open'])

const recent = useLocalStorage('faneqo.chat-lab.recent-emoji', [])
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const pickerReady = ref(false)
const loadError = ref(false)
let loading = false

  const { floatingRef, floatingStyles, setOpen, referenceRef } = useFaneqoFloating({
    placement: props.placement || 'top-start',
    offset: 10,
  onOpenChange(isOpen) {
    if (!isOpen) emit('close')
  },
})

watch(
  () => props.referenceEl,
  (el) => {
    referenceRef.value = el
  },
  { immediate: true }
)

watch(
  () => props.open,
  async (isOpen) => {
    setOpen(isOpen)
    if (isOpen) await loadPicker()
  }
)

const quickRow = computed(() => {
  const rec = (recent.value || []).filter(Boolean)
  const merged = [...rec, ...STARTER]
  const seen = new Set()
  const out = []
  for (const e of merged) {
    if (seen.has(e)) continue
    seen.add(e)
    out.push(e)
    if (out.length >= 7) break
  }
  return out
})

async function loadPicker() {
  if (pickerReady.value || loading) return
  if (!import.meta.client) return
  loading = true
  loadError.value = false
  try {
    await import('emoji-picker-element')
    pickerReady.value = true
  } catch (err) {
    console.warn('[FaneqoEmojiPicker] failed to load', err)
    loadError.value = true
  } finally {
    loading = false
  }
}

function remember(emoji) {
  const next = [emoji, ...(recent.value || []).filter((e) => e !== emoji)].slice(0, 16)
  recent.value = next
}

function pick(emoji) {
  if (!emoji) return
  remember(emoji)
  emit('select', emoji)
}

function onPickerClick(evt) {
  const unicode = evt?.detail?.unicode || evt?.detail?.emoji?.unicode
  if (unicode) pick(unicode)
}

onMounted(() => {
  if (props.open) loadPicker()
})
</script>

<style scoped>
.fq-emoji__quick {
  display: flex;
  gap: 0.2rem;
  flex-wrap: wrap;
}

.fq-emoji__chip {
  min-width: 36px;
  min-height: 36px;
  border: 0;
  background: transparent;
  font-size: 1.05rem;
  border-radius: 0.55rem;
  cursor: pointer;
}

.fq-emoji__chip:hover,
.fq-emoji__chip:focus-visible {
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.fq-emoji__pop {
  z-index: 80;
}

.fq-emoji__shell {
  border-radius: 0.9rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #18181b;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
}

.fq-emoji__fail {
  margin: 0;
  padding: 0.9rem 1rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.82rem;
}

.fq-emoji__retry {
  margin-left: 0.35rem;
  color: var(--fq-accent-mint, #45E3AE);
  background: none;
  border: 0;
  cursor: pointer;
  font-weight: 600;
}

.fq-emoji__el {
  --background: #18181b;
  --border-color: rgba(255, 255, 255, 0.08);
  --button-hover-background: rgba(255, 255, 255, 0.08);
  --button-active-background: rgba(57, 213, 255, 0.18);
  --input-border-color: rgba(255, 255, 255, 0.12);
  --input-font-color: #fafafa;
  --input-placeholder-color: rgba(255, 255, 255, 0.4);
  --category-font-color: rgba(255, 255, 255, 0.55);
  --indicator-color: #39D5FF;
  --outline-color: #39D5FF;
  width: min(352px, calc(100vw - 24px));
  height: 360px;
}
</style>
