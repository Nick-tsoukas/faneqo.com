<template>
  <main class="galleries">
    <FaneqoGalleryArchive
      :items="items"
      :band-slug="bandSlug"
      :artist-name="artistName"
      :can-create="!!bandId"
      :loading="loading"
      :error="error"
      :created-id="createdId"
      @retry="load"
      @changed="load"
      @featured="onFeatured"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FaneqoGalleryArchive from '~/components/galleries/FaneqoGalleryArchive.vue'
import { useArtistUpdates } from '~/composables/useArtistUpdates'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'
import { applyArtistPageFeature } from '~/utils/galleries/artistPageFeature'

definePageMeta({ middleware: 'auth' })
useHead({ title: 'Galleries · Faneqo', meta: [{ name: 'robots', content: 'noindex' }] })

const route = useRoute()
const { requireActiveBand } = useWorkspaceBand()
const { listMine } = useArtistUpdates()
const loading = ref(true)
const error = ref(false)
const bandId = ref(null)
const bandSlug = ref('')
const artistName = ref('')
const items = ref([])
const createdId = computed(() => String(route.query.created || ''))

onMounted(async () => {
  try {
    // Multi-band artists reach the picker rather than another artist's shelves.
    const band = await requireActiveBand()
    bandId.value = band?.bandId || null
    bandSlug.value = band?.slug || ''
    artistName.value = band?.name || band?.bandName || ''
    if (bandId.value) await load()
  } finally {
    loading.value = false
  }
})

function onFeatured({ id, featuredOnProfile }) {
  items.value = applyArtistPageFeature(items.value, id, featuredOnProfile)
}

async function load() {
  error.value = false
  try {
    const result = await listMine({ bandId: bandId.value })
    items.value = Array.isArray(result?.data) ? result.data : []
  } catch {
    error.value = true
    items.value = []
  }
}
</script>

<style scoped>
.galleries {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
}
</style>
