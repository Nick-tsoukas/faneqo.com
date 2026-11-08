<template>
  <header class="awc" :class="{ 'is-overlay': overlay, 'is-quiet': quiet }">
    <button
      v-if="showBack"
      type="button"
      class="awc__back"
      :aria-label="backAria"
      @click="onBack"
    >
      ←<span v-if="backText" class="awc__back-text">{{ backText }}</span>
    </button>
    <NuxtLink v-if="!quiet" :to="artistPath" class="awc__artist">
      {{ artistName }}
    </NuxtLink>
    <span v-else class="awc__artist" aria-hidden="true" />
    <button
      v-if="allowShare"
      type="button"
      class="awc__share"
      :disabled="sharing"
      @click="$emit('share')"
    >
      {{ sharing ? 'Opening…' : 'Share' }}
    </button>
    <span v-else class="awc__spacer" aria-hidden="true" />
  </header>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  artistName: { type: String, default: 'Artist' },
  artistPath: { type: String, default: '/' },
  artistImage: { type: String, default: '' },
  backTo: { type: String, default: '' },
  backLabel: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  allowShare: { type: Boolean, default: false },
  sharing: { type: Boolean, default: false },
  overlay: { type: Boolean, default: false },
  quiet: { type: Boolean, default: false },
})

defineEmits(['share'])
const router = useRouter()

const backText = computed(() => {
  if (props.quiet) return ''
  const label = String(props.backLabel || '').replace(/^Back to\s+/i, '').trim()
  if (!label || label === props.artistName) return ''
  return label
})
const backAria = computed(() => props.backLabel
  ? (String(props.backLabel).startsWith('Back') ? props.backLabel : `Back to ${props.backLabel}`)
  : `Back to ${props.artistName}`)

function onBack() {
  if (props.backTo) {
    navigateTo(props.backTo)
    return
  }
  if (import.meta.client && window.history.length > 1) {
    router.back()
    return
  }
  navigateTo(props.artistPath)
}
</script>

<style scoped>
.awc {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: minmax(2.75rem, max-content) minmax(6.5rem, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  min-height: calc(52px + env(safe-area-inset-top, 0px));
  padding: calc(0.35rem + env(safe-area-inset-top, 0px)) 0.7rem 0.35rem;
  background: rgba(5, 5, 6, 0.88);
  backdrop-filter: blur(10px);
}
.awc__back,
.awc__share {
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.7rem;
  border: 0;
  background: transparent;
  color: #f5f5f6;
  font: inherit;
  cursor: pointer;
}
.awc__back {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 1.2rem;
  padding: 0 0.15rem 0 0;
  max-width: min(42vw, 11.5rem);
}
.awc__back-text {
  font-size: 0.82rem;
  font-weight: 650;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.awc__share {
  justify-self: end;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: #15181e;
  font-size: 0.88rem;
  font-weight: 600;
}
.awc__share:disabled { opacity: 0.55; cursor: wait; }
.awc__share:focus-visible,
.awc__back:focus-visible,
.awc__artist:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}
.awc__artist {
  display: block;
  min-width: 0;
  min-height: 44px;
  padding: 0.55rem 0;
  color: #f5f5f6;
  text-decoration: none;
  text-align: center;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.awc__spacer { width: 44px; }
.awc.is-quiet {
  background: rgba(5, 5, 6, 0.62);
}
.awc.is-quiet .awc__share {
  border: 0;
  background: transparent;
  font-weight: 600;
  color: rgba(245, 245, 246, 0.86);
}
.awc.is-overlay {
  position: absolute;
  left: 0;
  right: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.42) 0%, transparent 100%);
  backdrop-filter: none;
}
.awc.is-overlay .awc__share {
  background: rgba(5, 5, 6, 0.52);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}
</style>
