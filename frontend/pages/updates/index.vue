<template>
  <div class="upd-hub">
    <header class="upd-hub__bar">
      <div>
        <h1>Artist Updates</h1>
        <p>Share photos and moments directly with your fans.</p>
      </div>
      <NuxtLink
        v-if="bandId"
        :to="newPath"
        class="upd-hub__cta"
      >
        <component :is="icons.plus" :size="16" :stroke-width="2.2" aria-hidden="true" />
        New Update
      </NuxtLink>
    </header>

    <div v-if="loading" class="upd-hub__boot" role="status">Loading updates…</div>
    <div v-else-if="!bandId" class="upd-hub__empty">
      <h2>Sign in as the artist</h2>
      <p>Updates are published from the band account.</p>
    </div>
    <div v-else-if="error" class="upd-hub__empty" role="alert">
      <h2>Couldn’t load your updates.</h2>
      <button type="button" class="upd-hub__ghost" @click="load">Try again</button>
    </div>
    <div v-else-if="!items.length" class="upd-hub__empty">
      <span class="upd-hub__icon" aria-hidden="true">
        <component :is="icons.images" :size="26" :stroke-width="1.6" />
      </span>
      <h2>Share something with your fans</h2>
      <p>Post photos and galleries from shows, rehearsals, tour, or wherever the band is.</p>
      <NuxtLink :to="newPath" class="upd-hub__cta">Create an Update</NuxtLink>
      <NuxtLink to="/dashboard" class="upd-hub__soft">From a recent show? Share Photos from Show Mode →</NuxtLink>
    </div>
    <ul v-else class="upd-hub__list">
      <li v-for="item in items" :key="item.id">
        <NuxtLink :to="galleryPath(item)" class="upd-hub__card">
          <div class="upd-hub__copy">
            <h2>{{ item.title || item.show?.city || 'Photos' }}</h2>
            <p class="upd-hub__meta">{{ cardMeta(item) }}</p>
            <p class="upd-hub__vis">
              <component :is="visIcon(item.visibility)" :size="13" :stroke-width="1.9" aria-hidden="true" />
              {{ visLabel(item.visibility) }}
              <span v-if="item.status === 'published'"> · Published</span>
            </p>
          </div>
          <FaneqoMediaGrid
            v-if="previewMedia(item).length"
            :items="previewMedia(item)"
            variant="gallery"
            :interactive="false"
          />
          <span class="upd-hub__view">View Gallery →</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

definePageMeta({ middleware: ['hide-artist-updates', 'auth'] })
useHead({ title: 'Artist Updates' })

const { requireActiveBand } = useWorkspaceBand()
const { listForBand } = useArtistUpdates()
const icons = faneqoIcons
const loading = ref(true)
const error = ref(false)
const bandId = ref(null)
const bandSlug = ref('')
const items = ref([])

const newPath = computed(() => {
  const query = new URLSearchParams({
    from: '/updates',
    ...(bandId.value ? { bandId: String(bandId.value) } : {}),
  })
  return `/updates/new?${query.toString()}`
})

onMounted(async () => {
  try {
    const band = await requireActiveBand()
    bandId.value = band?.bandId || null
    bandSlug.value = band?.slug || ''
    if (bandId.value) await load()
  } finally {
    loading.value = false
  }
})

async function load() {
  if (!bandId.value) return
  error.value = false
  try {
    const result = await listForBand({ bandId: bandId.value, bandSlug: bandSlug.value })
    items.value = result?.data?.updates || []
  } catch {
    error.value = true
    items.value = []
  }
}

function previewMedia(item) {
  return (item.media || []).slice(0, 3)
}

function galleryPath(item) {
  if (item?.slug && bandSlug.value) return `/${bandSlug.value}/gallery/${item.slug}`
  return '/updates'
}

function cardMeta(item) {
  const date = item.publishedAt || item.show?.date
  const when = date
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date))
    : ''
  const count = item.photoCount
    ? `${item.photoCount} ${item.photoCount === 1 ? 'photo' : 'photos'}`
    : ''
  return [item.show?.city, when, count].filter(Boolean).join(' · ')
}

function visLabel(visibility) {
  if (visibility === 'fan_list') return 'Fan List'
  if (visibility === 'show_attendees') return 'Show attendees'
  return 'Everyone'
}

function visIcon(visibility) {
  if (visibility === 'fan_list') return icons.users
  if (visibility === 'show_attendees') return icons.ticket
  return icons.globe
}
</script>

<style scoped>
.upd-hub {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 0.7rem) 1.15rem 2.5rem;
  background:
    radial-gradient(800px 340px at 6% -10%, rgba(57, 255, 20, 0.07), transparent 50%),
    radial-gradient(640px 280px at 100% 0%, rgba(145, 0, 255, 0.07), transparent 46%),
    #050505;
  color: #fff;
}
.upd-hub__bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  max-width: 54rem;
  margin: 0 auto 1.4rem;
}
.upd-hub__bar h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}
.upd-hub__bar p {
  margin: 0.2rem 0 0;
  color: rgba(255, 255, 255, 0.52);
  font-size: 0.88rem;
}
.upd-hub__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 44px;
  padding: 0 0.95rem;
  border-radius: 0.85rem;
  background: #39ff14;
  color: #052e16;
  font-weight: 750;
  text-decoration: none;
  flex-shrink: 0;
}
.upd-hub__cta:focus-visible {
  outline: 2px solid #39ff14;
  outline-offset: 2px;
}
.upd-hub__list {
  max-width: 54rem;
  margin: 0 auto;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
}
.upd-hub__card {
  display: block;
  padding: 0.15rem 0 0.2rem;
  color: inherit;
  text-decoration: none;
}
.upd-hub__copy h2 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 750;
  letter-spacing: -0.02em;
}
.upd-hub__meta,
.upd-hub__vis {
  margin: 0.28rem 0 0;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.8rem;
}
.upd-hub__vis {
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: rgba(255, 255, 255, 0.42);
}
.upd-hub__card :deep(.fq-media-grid) {
  margin-top: 0.75rem;
}
.upd-hub__view {
  display: inline-block;
  margin-top: 0.7rem;
  color: #39ff14;
  font-weight: 650;
  font-size: 0.88rem;
}
.upd-hub__empty,
.upd-hub__boot {
  max-width: 28rem;
  margin: 3.5rem auto;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}
.upd-hub__empty h2,
.upd-hub__boot {
  color: #fff;
}
.upd-hub__empty p {
  margin: 0.5rem 0 1.1rem;
  line-height: 1.5;
}
.upd-hub__icon {
  display: grid;
  place-items: center;
  width: 3.25rem;
  height: 3.25rem;
  margin: 0 auto 1rem;
  border-radius: 1rem;
  color: #39ff14;
  background: rgba(57, 255, 20, 0.08);
}
.upd-hub__soft {
  display: block;
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.5);
  text-decoration: none;
  font-size: 0.85rem;
}
.upd-hub__ghost {
  min-height: 44px;
  padding: 0 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: #fff;
  cursor: pointer;
}
@media (max-width: 639px) {
  .upd-hub__bar {
    flex-direction: column;
  }
  .upd-hub__cta {
    width: 100%;
    justify-content: center;
  }
}
</style>
