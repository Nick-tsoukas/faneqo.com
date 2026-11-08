<template>
  <Teleport to="body">
    <div
      class="fq-show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fq-show-title"
      @keydown="onDialogKey"
    >
      <div class="fq-show__backdrop" @click="$emit('close')" />
      <Motion
        ref="sheetRef"
        class="fq-show__sheet"
        tabindex="-1"
        v-bind="sheetMotion"
      >
        <header class="fq-show__head">
          <div>
            <h2 id="fq-show-title" class="fq-show__title">Message a show</h2>
            <p class="fq-show__lead">Choose a recent Night. People who were there receive this privately.</p>
          </div>
          <FaneqoIconButton name="close" aria-label="Close" @click="$emit('close')" />
        </header>

        <div v-if="loading" class="fq-show__status" role="status">Loading shows…</div>
        <div v-else-if="error" class="fq-show__status">
          <p>Couldn't load your shows.</p>
          <button type="button" class="fq-show__retry" @click="load">Try again</button>
        </div>
        <div v-else-if="!rows.length" class="fq-show__status">
          <p class="fq-show__status-title">No show recaps yet</p>
          <p>Activate Show Mode at a gig to capture the room, then message those fans from here.</p>
          <NuxtLink to="/dashboard" class="fq-show__link" @click="$emit('close')">Go to Dashboard</NuxtLink>
        </div>
        <ul v-else class="fq-show__list" role="list">
          <li v-for="recap in rows" :key="recap.id">
            <button
              type="button"
              class="fq-show__row"
              :disabled="!canMessage(recap)"
              :aria-label="rowLabel(recap)"
              @click="pick(recap)"
            >
              <span class="fq-show__name">{{ recap.showTitle || recap.venue || 'Live show' }}</span>
              <span class="fq-show__meta">{{ recapLine(recap) }}</span>
              <span v-if="!canMessage(recap)" class="fq-show__wait">No check-ins yet</span>
              <span v-else class="fq-show__count">
                {{ recap.checkedInShowCount }}
                {{ recap.checkedInShowCount === 1 ? 'fan' : 'fans' }}
              </span>
            </button>
          </li>
        </ul>
      </Motion>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { Motion } from 'motion-v'
import { onKeyStroke, usePreferredReducedMotion } from '@vueuse/core'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { useShowRecaps } from '~/composables/useShowRecaps'
import { motionTokens } from '~/utils/ui/motionTokens'

const emit = defineEmits(['close', 'select'])

const { getRecaps } = useShowRecaps()
const rows = ref([])
const loading = ref(true)
const error = ref(false)
const sheetRef = ref(null)
const lastFocus = ref(null)
const previousOverflow = ref('')
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')

const sheetMotion = computed(() => {
  if (reduced.value) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      transition: motionTokens.micro,
    }
  }
  return {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: motionTokens.standard,
  }
})

function canMessage(recap) {
  return Number(recap?.checkedInShowCount) > 0
}

function recapLine(recap) {
  const date = recap.showStartedAt || recap.recapGeneratedAt
  const when = date
    ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : ''
  return [when, recap.venue, recap.city].filter(Boolean).join(' · ')
}

function rowLabel(recap) {
  const title = recap.showTitle || recap.venue || 'this show'
  if (!canMessage(recap)) return `${title} has no check-ins yet`
  return `Message fans from ${title}`
}

async function load() {
  loading.value = true
  error.value = false
  try {
    const result = await getRecaps({ page: 1, pageSize: 20 })
    rows.value = Array.isArray(result?.data) ? result.data : []
  } catch {
    error.value = true
    rows.value = []
  } finally {
    loading.value = false
  }
}

function pick(recap) {
  if (!canMessage(recap) || !recap?.id) return
  emit('select', recap)
}

function focusable() {
  const root = sheetRef.value?.$el || sheetRef.value
  if (!root?.querySelectorAll) return []
  return [...root.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true')
}

function onDialogKey(evt) {
  if (evt.key !== 'Tab') return
  const items = focusable()
  if (!items.length) return
  const first = items[0]
  const last = items[items.length - 1]
  if (evt.shiftKey && document.activeElement === first) {
    evt.preventDefault()
    last.focus()
  } else if (!evt.shiftKey && document.activeElement === last) {
    evt.preventDefault()
    first.focus()
  }
}

onKeyStroke('Escape', (evt) => {
  evt.preventDefault()
  emit('close')
})

onMounted(async () => {
  lastFocus.value = document.activeElement
  previousOverflow.value = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  load()
  await nextTick()
  const root = sheetRef.value?.$el || sheetRef.value
  root?.querySelector('button')?.focus()
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow.value
  if (lastFocus.value && typeof lastFocus.value.focus === 'function') {
    lastFocus.value.focus()
  }
})
</script>

<style scoped>
.fq-show {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: end center;
  color: #fff;
}

@media (min-width: 640px) {
  .fq-show {
    place-items: center;
  }
}

.fq-show__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
}

.fq-show__sheet {
  position: relative;
  width: 100%;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem 1.15rem 0 0;
  background: var(--fq-surface, #0B0C10);
  color: #fff;
  border: 1px solid var(--fq-border-strong, rgba(255, 255, 255, 0.11));
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (min-width: 640px) {
  .fq-show__sheet {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(86dvh, 40rem);
    border-radius: 1.15rem;
  }
}

.fq-show__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.95rem 0.75rem 0.55rem 1.1rem;
}

.fq-show__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 750;
  letter-spacing: -0.02em;
  color: #fff;
}

.fq-show__lead {
  margin: 0.28rem 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.82rem;
  line-height: 1.4;
}

.fq-show__list {
  margin: 0;
  padding: 0.25rem 0.65rem 0.85rem;
  list-style: none;
  overflow: auto;
}

.fq-show__row {
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-areas:
    "name count"
    "meta count";
  gap: 0.12rem 0.75rem;
  width: 100%;
  min-height: 56px;
  padding: 0.75rem 0.7rem;
  border: 0;
  border-radius: 0.8rem;
  background: transparent;
  color: #fff;
  text-align: left;
  cursor: pointer;
}

.fq-show__row:hover,
.fq-show__row:focus-visible {
  background: rgba(255, 255, 255, 0.05);
  outline: none;
}

.fq-show__row:disabled {
  cursor: default;
  opacity: 0.55;
}

.fq-show__name {
  grid-area: name;
  font-size: 0.95rem;
  font-weight: 650;
}

.fq-show__meta {
  grid-area: meta;
  color: rgba(255, 255, 255, 0.46);
  font-size: 0.75rem;
}

.fq-show__count,
.fq-show__wait {
  grid-area: count;
  align-self: center;
  font-size: 0.72rem;
  font-weight: 650;
}

.fq-show__count {
  color: #bbf7d0;
}

.fq-show__wait {
  color: rgba(255, 255, 255, 0.42);
}

.fq-show__status {
  padding: 2rem 1.25rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  line-height: 1.45;
}

.fq-show__status-title {
  margin: 0 0 0.35rem;
  color: #fff;
  font-weight: 700;
}

.fq-show__retry,
.fq-show__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 0.85rem;
  padding: 0.5rem 0.9rem;
  border-radius: 0.7rem;
  font-weight: 650;
  cursor: pointer;
}

.fq-show__retry {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: #fff;
}

.fq-show__link {
  color: var(--fq-accent-mint, #45E3AE);
  text-decoration: none;
}
</style>
