<template>
  <div class="upd-new">
    <div v-if="loading" class="upd-new__boot">Opening…</div>
    <div v-else-if="!bandId" class="upd-new__boot">Sign in as the artist to share photos.</div>
    <ArtistUpdateComposer
      v-else-if="!published"
      :band-id="bandId"
      :band-name="bandName"
      :event-id="eventId"
      :show-recap-id="showRecapId"
      :show-label="showLabel"
      :back-to="backTo"
      @published="onPublished"
    />
    <div v-if="published" class="upd-new__done">
      <p class="upd-new__ok">Gallery published ✓</p>
      <p v-if="showLabel" class="upd-new__show">{{ showLabel }}</p>
      <p>{{ published.photoCount }} {{ published.photoCount === 1 ? 'photo' : 'photos' }}</p>
      <NuxtLink v-if="galleryPath" :to="galleryPath" class="upd-new__btn">View Gallery</NuxtLink>
      <NuxtLink v-if="showRecapId" :to="`/fans/recaps/${showRecapId}?message=1`" class="upd-new__btn is-ghost">Email the Room</NuxtLink>
      <NuxtLink
        v-if="published.visibility !== 'show_attendees'"
        :to="{ path: '/messages/compose', query: { audienceType: 'all_fans', ...(bandId ? { bandId: String(bandId) } : {}) } }"
        class="upd-new__btn is-ghost"
      >
        Email Fans
      </NuxtLink>
      <NuxtLink to="/updates" class="upd-new__btn is-ghost">Back to Updates</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import ArtistUpdateComposer from '~/components/updates/ArtistUpdateComposer.vue'
import { useBandTeam } from '~/composables/useBandTeam'
import { resolveComposerBand } from '~/utils/campaigns/resolveComposerBand'

definePageMeta({ middleware: ['hide-artist-updates', 'auth'] })
useHead({ title: 'New Update' })

const route = useRoute()
const { getMyBandAccess } = useBandTeam()
const { hint: activeBandHint, needsPicker } = useWorkspaceBand()
const loading = ref(true)
const bandId = ref(null)
const bandName = ref('')
const bandSlug = ref('')
const published = ref(null)

const eventId = computed(() => route.query.eventId || null)
const showRecapId = computed(() => route.query.recapId || null)
const showLabel = computed(() => String(route.query.show || ''))
const backTo = computed(() => String(route.query.from || '/updates'))
const galleryPath = computed(() =>
  published.value?.slug && bandSlug.value
    ? `/${bandSlug.value}/gallery/${published.value.slug}`
    : null
)

onMounted(async () => {
  try {
    const access = await getMyBandAccess()
    const band = resolveComposerBand(access, activeBandHint.value)
    if (!band && needsPicker.value) {
      await navigateTo('/dashboard')
      return
    }
    bandId.value = band?.bandId || null
    bandName.value = band?.name || ''
    bandSlug.value = band?.slug || ''
  } finally {
    loading.value = false
  }
})

function onPublished(row) {
  published.value = row
  if (row?.band?.slug) bandSlug.value = row.band.slug
}
</script>

<style scoped>
.upd-new {
  min-height: 100dvh;
  padding: calc(var(--header-height, 70px) + 0.5rem) 0 2rem;
  background: #050505;
  color: #fff;
}
.upd-new__boot { padding: 3rem 1rem; text-align: center; color: rgba(255,255,255,0.55); }
.upd-new__done { max-width: 36rem; margin: 0 auto; padding: 0 1rem 2rem; text-align: center; }
.upd-new__ok { color: #39ff14; font-weight: 750; }
.upd-new__show { margin: 0.15rem 0 0; color: rgba(255,255,255,0.62); }
.upd-new__btn {
  display: inline-flex; min-height: 44px; align-items: center; margin: 0.35rem;
  padding: 0.65rem 1rem; border-radius: 0.8rem; background: #39ff14; color: #052e16;
  text-decoration: none; font-weight: 700;
}
.upd-new__btn.is-ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,0.16); }
</style>
