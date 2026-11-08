<template>
  <Teleport to="body">
    <div
      class="fq-pick fq-msg-accents"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fq-pick-title"
      @keydown="onDialogKey"
    >
      <div class="fq-pick__backdrop" @click="$emit('close')" />
      <Motion
        ref="sheetRef"
        class="fq-pick__sheet"
        tabindex="-1"
        v-bind="sheetMotion"
      >
        <header class="fq-pick__head">
          <div>
            <h2 id="fq-pick-title" class="fq-pick__title">New conversation</h2>
            <p class="fq-pick__lead">{{ lead }}</p>
          </div>
          <FaneqoIconButton name="close" aria-label="Close" @click="$emit('close')" />
        </header>

        <div class="fq-pick__modes" role="tablist" aria-label="New conversation type">
          <button
            type="button"
            role="tab"
            class="fq-pick__mode"
            :class="{ 'is-active': mode === 'fans' }"
            :aria-selected="mode === 'fans'"
            @click="mode = 'fans'"
          >
            Fans
          </button>
          <button
            type="button"
            role="tab"
            class="fq-pick__mode"
            :class="{ 'is-active': mode === 'artists' }"
            :aria-selected="mode === 'artists'"
            @click="mode = 'artists'"
          >
            Artists
          </button>
        </div>

        <label v-if="showSearch" class="fq-pick__search">
          <span class="sr-only">{{ mode === 'artists' ? 'Search artists' : 'Search fans' }}</span>
          <component :is="icons.search" :size="16" :stroke-width="1.75" aria-hidden="true" />
          <input
            ref="searchRef"
            v-model="query"
            type="search"
            :placeholder="mode === 'artists' ? 'Search artists...' : 'Search fans.'"
            autocomplete="off"
            @input="onSearch"
          />
        </label>

        <div v-if="mode === 'artists'">
          <div v-if="artistLoading" class="fq-pick__skel" role="status" aria-label="Loading artists">
            <div v-for="n in 5" :key="n" class="fq-pick__skel-row">
              <span class="fq-pick__skel-avatar" />
              <span class="fq-pick__skel-lines">
                <span class="fq-pick__skel-line fq-pick__skel-line--w" />
                <span class="fq-pick__skel-line" />
              </span>
            </div>
          </div>
          <div v-else-if="artistError" class="fq-pick__status">
            <p>Couldn't search artists.</p>
            <button type="button" class="fq-pick__retry" @click="searchArtists">Try again</button>
          </div>
          <div v-else-if="query.trim().length < 2" class="fq-pick__status">
            <p class="fq-pick__status-title">Find an artist</p>
            <p>Search by name, then send a message request as yourself.</p>
          </div>
          <div v-else-if="!artistRows.length" class="fq-pick__status">
            No artists match that search.
          </div>
          <ul v-else class="fq-pick__list" role="list">
            <li v-for="band in artistRows" :key="band.id">
              <button
                type="button"
                class="fq-pick__row fq-go"
                :disabled="startingId === band.id"
                :aria-label="`Message ${band.name}`"
                @click="selectArtist(band)"
              >
                <FaneqoFanIdentity
                  class="min-w-0 flex-1"
                  :name="band.name"
                  :context="band.genre || 'Artist'"
                  :avatar-url="band.imageUrl || ''"
                  size="sm"
                >
                  <template #trailing>
                    <span class="fq-pick__action is-go">
                      Message
                      <component :is="icons.chevronRight" class="fq-arrow" :size="16" :stroke-width="2" />
                    </span>
                  </template>
                </FaneqoFanIdentity>
              </button>
            </li>
          </ul>
        </div>

        <template v-else>
        <div v-if="loading" class="fq-pick__skel" role="status" aria-label="Loading fans">
          <div v-for="n in 5" :key="n" class="fq-pick__skel-row">
            <span class="fq-pick__skel-avatar" />
            <span class="fq-pick__skel-lines">
              <span class="fq-pick__skel-line fq-pick__skel-line--w" />
              <span class="fq-pick__skel-line" />
            </span>
          </div>
        </div>

        <div v-else-if="error" class="fq-pick__status">
          <p>Couldn't load your fans.</p>
          <button type="button" class="fq-pick__retry" @click="load">Try again</button>
        </div>

        <div v-else-if="showZeroMembers" class="fq-pick__status">
          <p class="fq-pick__status-title">No Faneqo members yet</p>
          <p>Fans need a Faneqo account before you can start a private conversation.</p>
          <NuxtLink to="/dashboard#fan-intelligence" class="fq-pick__link" @click="$emit('close')">
            View Fan Intelligence
          </NuxtLink>
        </div>

        <div v-else-if="showOnlySelf" class="fq-pick__status">
          <p class="fq-pick__status-title">No one else to message yet</p>
          <p>Your own fan profile doesn’t count. Another fan needs a Faneqo account.</p>
          <NuxtLink to="/dashboard#fan-intelligence" class="fq-pick__link" @click="$emit('close')">
            View Fan Intelligence
          </NuxtLink>
        </div>

        <div v-else-if="!visibleRows.length" class="fq-pick__status">
          No fans match that search.
        </div>

        <ul v-else class="fq-pick__list" role="list">
          <li v-for="fan in visibleRows" :key="fan.id">
            <button
              type="button"
              class="fq-pick__row fq-go"
              :disabled="!fan.canDirectMessage || startingId === fan.id"
              :aria-label="rowLabel(fan)"
              @click="select(fan)"
            >
              <FaneqoFanIdentity
                class="min-w-0 flex-1"
                :name="fan.displayName"
                :context="fanContext(fan)"
                :avatar-url="fan.avatarUrl || ''"
                :initials="fan.initials || ''"
                size="sm"
              >
                <template v-if="fan.canDirectMessage" #trailing>
                  <span class="fq-pick__action">
                    Message
                    <component :is="icons.chevronRight" class="fq-arrow" :size="16" :stroke-width="2" />
                  </span>
                </template>
              </FaneqoFanIdentity>
              <span v-if="!fan.canDirectMessage" class="fq-pick__wait">Not on Faneqo yet</span>
            </button>
          </li>
        </ul>
        </template>

        <p v-if="startError" class="fq-pick__fail" role="alert">
          Couldn't start that conversation. Try again.
        </p>
      </Motion>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Motion } from 'motion-v'
import { onKeyStroke, useDebounceFn, usePreferredReducedMotion } from '@vueuse/core'
import FaneqoFanIdentity from '~/components/messages/FaneqoFanIdentity.vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { useInbox } from '~/composables/useInbox'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { artistFacingDisplayName, formatArtistFanContext, fanInitials } from '~/utils/messages/fanIdentity'
import { inboxUiLog } from '~/utils/messages/inboxUiLog'
import { motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  bandId: { type: [Number, String], required: true },
})

const emit = defineEmits(['close', 'started', 'request-artist'])

const icons = faneqoIcons
const config = useRuntimeConfig()
const { listDmCandidates, startConversation } = useInbox()
const mode = ref('fans')
const query = ref('')
const rows = ref([])
const artistRows = ref([])
const loading = ref(true)
const artistLoading = ref(false)
const error = ref(false)
const artistError = ref(false)
const startingId = ref(null)
const startError = ref(false)
const searchRef = ref(null)
const sheetRef = ref(null)
const previousOverflow = ref('')
const lastFocus = ref(null)
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')

const eligibleCount = computed(() => rows.value.filter((fan) => fan.canDirectMessage).length)
const memberCount = computed(() => rows.value.filter((fan) => fan.isFaneqoMember).length)
const showZeroMembers = computed(
  () => !loading.value && !error.value && !query.value.trim() && eligibleCount.value === 0 && memberCount.value === 0
)
const showOnlySelf = computed(
  () => !loading.value && !error.value && !query.value.trim() && eligibleCount.value === 0 && memberCount.value > 0
)
const showSearch = computed(() => {
  if (mode.value === 'artists') return true
  return !error.value && !showZeroMembers.value && !showOnlySelf.value
})
const lead = computed(() => (
  mode.value === 'artists'
    ? 'Find an artist and send a message request.'
    : 'Message someone from your Fan List.'
))
const visibleRows = computed(() => {
  if (query.value.trim()) return rows.value
  return rows.value.filter((fan) => fan.canDirectMessage)
})
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

function fanContext(fan) {
  return fan.context || formatArtistFanContext(fan)
}

function rowLabel(fan) {
  if (fan.canDirectMessage) return `Message ${fan.displayName}`
  return `${fan.displayName} is not on Faneqo yet`
}

function normalizeFan(fan) {
  const displayName = artistFacingDisplayName(fan)
  return {
    ...fan,
    displayName,
    initials: fan.initials || fanInitials(displayName),
    avatarUrl: fan.avatarUrl || null,
    context: formatArtistFanContext({ ...fan, displayName }),
  }
}

async function load() {
  loading.value = true
  error.value = false
  inboxUiLog('dm-candidates:load:start', { bandId: props.bandId })
  try {
    const data = await listDmCandidates({
      bandId: props.bandId,
      search: query.value.trim(),
    })
    const raw = Array.isArray(data?.fans)
      ? data.fans
      : Array.isArray(data?.data?.fans)
        ? data.data.fans
        : []
    rows.value = raw.map(normalizeFan)
    inboxUiLog('selector:loaded', {
      candidateCount: rows.value.length,
      memberCount: rows.value.filter((fan) => fan.isFaneqoMember).length,
      eligibleCount: rows.value.filter((fan) => fan.canDirectMessage).length,
    })
  } catch (err) {
    error.value = true
    inboxUiLog('dm-candidates:load:error', { status: err?.status || err?.statusCode || 'unknown' })
  } finally {
    loading.value = false
  }
}

const onSearch = useDebounceFn(() => {
  if (mode.value === 'artists') searchArtists()
  else load()
}, 220)

async function searchArtists() {
  const q = query.value.trim()
  if (q.length < 2) {
    artistRows.value = []
    artistLoading.value = false
    artistError.value = false
    return
  }
  artistLoading.value = true
  artistError.value = false
  try {
    const data = await $fetch(`${config.public.strapiUrl}/api/bands/search`, {
      query: { q, limit: 12 },
    })
    artistRows.value = Array.isArray(data?.data) ? data.data : []
  } catch (err) {
    artistError.value = true
    artistRows.value = []
    inboxUiLog('artist-search:error', { status: err?.status || err?.statusCode || 'unknown' })
  } finally {
    artistLoading.value = false
  }
}

function selectArtist(band) {
  if (!band?.id || startingId.value) return
  startingId.value = band.id
  inboxUiLog('new-message:artist', { bandId: band.id })
  emit('request-artist', {
    id: band.id,
    name: band.name,
    slug: band.slug,
    imageUrl: band.imageUrl,
    genre: band.genre,
  })
}

watch(mode, () => {
  query.value = ''
  artistRows.value = []
  artistError.value = false
  startError.value = false
  startingId.value = null
})

async function select(fan) {
  if (!fan?.canDirectMessage || startingId.value) return
  startingId.value = fan.id
  startError.value = false
  inboxUiLog('conversation:start', { fanId: fan.id, bandId: props.bandId })
  try {
    const result = await startConversation({ bandId: props.bandId, fanId: fan.id })
    const id = result?.conversationId || result?.conversation?.id
    inboxUiLog('conversation:resolved', { conversationId: id, created: result?.created, fanId: fan.id, bandId: props.bandId, status: 200 })
    if (!id) {
      startingId.value = null
      startError.value = true
      inboxUiLog('conversation:start:error', { reason: 'missing_conversation_id', fanId: fan.id, bandId: props.bandId })
      return
    }
    emit('started', { conversationId: id, created: result?.created })
  } catch (err) {
    startingId.value = null
    startError.value = true
    inboxUiLog('conversation:start:error', { status: err?.status || err?.statusCode || 'unknown' })
  }
}

function focusable() {
  const root = sheetRef.value?.$el || sheetRef.value
  if (!root?.querySelectorAll) return []
  return [...root.querySelectorAll('button, [href], input, textarea, [tabindex]:not([tabindex="-1"])')]
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
  searchRef.value?.focus()
})

onBeforeUnmount(() => {
  document.body.style.overflow = previousOverflow.value
  if (lastFocus.value && typeof lastFocus.value.focus === 'function') {
    lastFocus.value.focus()
  }
})
</script>

<style>
@import '~/assets/css/faneqo-messaging-accents.css';
</style>

<style scoped>
.fq-pick {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: end center;
}

@media (min-width: 640px) {
  .fq-pick {
    place-items: center;
  }
}

.fq-pick__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
}

.fq-pick__sheet {
  position: relative;
  width: 100%;
  max-height: 92dvh;
  display: flex;
  flex-direction: column;
  border-radius: 1.15rem 1.15rem 0 0;
  background: var(--fq-surface, #0B0C10);
  border: 1px solid var(--fq-border-strong, rgba(255, 255, 255, 0.11));
  overflow: hidden;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

@media (min-width: 640px) {
  .fq-pick__sheet {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(86dvh, 40rem);
    border-radius: 1.15rem;
  }
}

.fq-pick__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0.95rem 0.75rem 0.35rem 1.1rem;
}

.fq-pick__title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}

.fq-pick__lead {
  margin: 0.28rem 0 0;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.82rem;
  line-height: 1.4;
}

.fq-pick__modes {
  display: flex;
  gap: 0.2rem;
  margin: 0.15rem 1rem 0.2rem;
  padding: 0.18rem;
  border-radius: 0.7rem;
  background: var(--fq-surface-raised, #111217);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
}

.fq-pick__mode {
  flex: 1;
  min-height: 32px;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
}

.fq-pick__mode.is-active {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.fq-pick__search {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.45rem 1rem 0.65rem;
  padding: 0 0.7rem;
  min-height: 38px;
  border-radius: 0.7rem;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface-raised, #111217);
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
}

.fq-pick__search input {
  flex: 1;
  min-height: 36px;
  border: 0;
  background: transparent;
  color: #fff;
  outline: none;
  font-size: 0.86rem;
}

.fq-pick__search:focus-within {
  border-color: rgba(57, 213, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 213, 255, 0.18);
}

.fq-pick__list {
  margin: 0;
  padding: 0 0.45rem 1rem;
  list-style: none;
  overflow-y: auto;
}

.fq-pick__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  width: 100%;
  padding: 0.62rem 0.55rem;
  border: 0;
  border-radius: 0.55rem;
  background: transparent;
  color: #fff;
  cursor: pointer;
  min-height: 56px;
}

.fq-pick__row:hover:not(:disabled) {
  background: var(--fq-surface-hover, #14161B);
}

.fq-pick__row:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: -2px;
}

.fq-pick__row:disabled {
  cursor: default;
  opacity: 0.72;
}

.fq-pick__action {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.78rem;
  font-weight: 650;
}

.fq-pick__action.is-go {
  color: var(--fq-accent-mint, #45E3AE);
}

.fq-pick__wait {
  margin-left: auto;
  font-size: 0.7rem;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
}

.fq-pick__status {
  padding: 1.7rem 1.2rem 2rem;
  text-align: center;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
  font-size: 0.88rem;
  line-height: 1.45;
}

.fq-pick__status-title {
  margin: 0 0 0.4rem;
  color: #fff;
  font-size: 1.05rem;
  font-weight: 700;
}

.fq-pick__retry,
.fq-pick__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 0.85rem;
  padding: 0 0.2rem;
  border: 0;
  background: none;
  color: var(--fq-accent-mint, #45E3AE);
  font-weight: 650;
  cursor: pointer;
  text-decoration: none;
}

.fq-pick__fail {
  margin: 0;
  padding: 0.4rem 1rem 1rem;
  text-align: center;
  color: var(--fq-state-error, #fca5a5);
  font-size: 0.8rem;
}

.fq-pick__skel {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.35rem 1rem 1.2rem;
}

.fq-pick__skel-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.fq-pick__skel-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  flex-shrink: 0;
}

.fq-pick__skel-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.fq-pick__skel-line {
  display: block;
  height: 0.5rem;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
}

.fq-pick__skel-line--w {
  width: 42%;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>
