<template>
  <div class="picker">
    <label class="picker__search">
      <span class="sr-only">Search artists</span>
      <input
        v-model="query"
        type="search"
        placeholder="Search artists by name…"
        autocomplete="off"
        spellcheck="false"
        @input="onInput"
      />
    </label>

    <p v-if="error" class="picker__note is-error" role="alert">{{ error }}</p>
    <p v-else class="picker__note">
      <template v-if="loading && !rows.length">Loading artists…</template>
      <template v-else-if="query.trim().length >= 2">{{ rows.length }} match{{ rows.length === 1 ? '' : 'es' }} for “{{ query.trim() }}”</template>
      <template v-else>{{ total }} artist{{ total === 1 ? '' : 's' }} on Faneqo · newest first</template>
    </p>

    <ul class="picker__list" role="listbox" aria-label="Artists">
      <li v-if="showDemo && query.trim().length < 2">
        <button type="button" class="artist" :disabled="busy" @click="pick(DEMO_ARTIST_ROW)">
          <img class="artist__thumb" :src="DEMO_ARTIST_ROW.imageUrl" alt="" />
          <span class="artist__body">
            <span class="artist__name">{{ DEMO_ARTIST_ROW.name }} <em>Demo</em></span>
            <span class="artist__meta">{{ DEMO_ARTIST_ROW.genre }} · bundled photos, credits included</span>
          </span>
        </button>
      </li>
      <li v-for="row in rows" :key="row.slug">
        <button type="button" class="artist" :disabled="busy" :aria-busy="busy && busySlug === row.slug" @click="pick(row)">
          <img v-if="row.imageUrl" class="artist__thumb" :src="thumb(row.imageUrl)" alt="" loading="lazy" />
          <span v-else class="artist__thumb artist__thumb--empty" aria-hidden="true">{{ initials(row.name) }}</span>
          <span class="artist__body">
            <span class="artist__name">{{ row.name }}</span>
            <span class="artist__meta">{{ [row.genre, `faneqo.com/${row.slug}`].filter(Boolean).join(' · ') }}</span>
          </span>
          <span v-if="busy && busySlug === row.slug" class="artist__busy">Loading…</span>
        </button>
      </li>
    </ul>

    <button v-if="canLoadMore" type="button" class="picker__more" :disabled="loading" @click="loadMore">
      {{ loading ? 'Loading…' : `Show more (${rows.length} of ${total})` }}
    </button>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { DEMO_ARTIST_ROW, loadArtistSnapshot, searchArtists } from '@/features/ads/studio/studioApi.js'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'

/**
 * Searchable, paged artist picker backed by the studio's Nitro routes.
 * Emits `select` with the full artist snapshot once it is loaded.
 */
const props = defineProps({
  showDemo: { type: Boolean, default: true },
  pageSize: { type: Number, default: 24 },
})
const emit = defineEmits(['select', 'error'])

const query = ref('')
const rows = ref([])
const total = ref(0)
const loading = ref(false)
const busy = ref(false)
const busySlug = ref('')
const error = ref('')
let timer = null
let requestId = 0

const isSearch = computed(() => query.value.trim().length >= 2)
const canLoadMore = computed(() => !isSearch.value && rows.value.length < total.value)

function thumb(url) {
  return studioImageUrl(url)
}

function initials(name) {
  return String(name || '').split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
}

async function fetchRows({ append = false } = {}) {
  const id = ++requestId
  loading.value = true
  error.value = ''
  try {
    const res = await searchArtists({ q: isSearch.value ? query.value.trim() : '', start: append ? rows.value.length : 0, limit: props.pageSize })
    if (id !== requestId) return
    rows.value = append ? [...rows.value, ...res.rows] : res.rows
    total.value = isSearch.value ? res.rows.length : res.total
  } catch (err) {
    if (id !== requestId) return
    error.value = err?.statusCode === 404 ? 'The studio artist catalog is not available for this account.' : 'Artists could not be loaded. Try again.'
    rows.value = []
    total.value = 0
  } finally {
    if (id === requestId) loading.value = false
  }
}

function onInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => fetchRows(), 220)
}

function loadMore() {
  fetchRows({ append: true })
}

async function pick(row) {
  if (busy.value) return
  busy.value = true
  busySlug.value = row.slug
  error.value = ''
  try {
    const snapshot = await loadArtistSnapshot(row.slug)
    emit('select', snapshot, row)
  } catch (err) {
    error.value = err?.message || 'That artist could not be loaded.'
    emit('error', err)
  } finally {
    busy.value = false
    busySlug.value = ''
  }
}

onMounted(() => fetchRows())
onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.picker__search input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  color: #f7f9fc;
  font: inherit;
  font-size: 15px;
}

.picker__search input:focus-visible {
  outline: 1px solid rgba(126, 231, 255, 0.7);
  outline-offset: 2px;
}

.picker__note {
  margin: 0;
  color: rgba(247, 249, 252, 0.5);
  font-size: 12px;
  letter-spacing: 0.02em;
}

.picker__note.is-error { color: #ff8aa8; }

.picker__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: min(52vh, 520px);
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.artist {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 8px 10px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.artist:hover,
.artist:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.artist:disabled { cursor: progress; opacity: 0.7; }

.artist__thumb {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #15161b;
  color: rgba(247, 249, 252, 0.55);
  font-size: 13px;
  font-weight: 700;
  object-fit: cover;
}

.artist__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.artist__name {
  overflow: hidden;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist__name em {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(126, 231, 255, 0.14);
  color: #7ee7ff;
  font-size: 10px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  vertical-align: middle;
}

.artist__meta {
  overflow: hidden;
  color: rgba(247, 249, 252, 0.5);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.artist__busy {
  color: #7ee7ff;
  font-size: 12px;
  font-weight: 600;
}

.picker__more {
  align-self: flex-start;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  background: transparent;
  color: rgba(247, 249, 252, 0.8);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
}

.picker__more:disabled { opacity: 0.5; cursor: progress; }

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
