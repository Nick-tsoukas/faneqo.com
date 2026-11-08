<template>
  <LabsShell title="Experience studio">
    <LabsExperienceHub />

    <p v-if="loadError" class="labs-note">Unable to load band session. Experiences above still open.</p>
    <section v-else class="labs-session">
      <h2>Session</h2>
      <p>
        Band context for live inspectors.
        <code>{{ displayBandId || 'No band selected.' }}</code>
      </p>
      <div v-if="bands.length" class="labs-bands">
        <label for="labs-band">Band</label>
        <select id="labs-band" :value="queryBandId" @change="onBandChange">
          <option value="">No band selected</option>
          <option v-for="band in bands" :key="band.bandId" :value="String(band.bandId)">
            {{ band.name || `Band ${band.bandId}` }} ({{ band.role }})
          </option>
        </select>
      </div>
    </section>
  </LabsShell>
</template>

<script setup>
import LabsExperienceHub from '@/components/labs/LabsExperienceHub.vue'
import LabsShell from '@/components/labs/LabsShell.vue'
import { useBandTeam } from '~/composables/useBandTeam'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Experience studio',
  meta: [{ name: 'robots', content: 'noindex, nofollow, noarchive' }],
})

const route = useRoute()
const router = useRouter()
const { fetchLabsStatus } = useLabsFeatures()
const { getMyBandAccess } = useBandTeam()

const loadError = ref(false)
const status = ref(null)
const bands = ref([])

const queryBandId = computed(() => (route.query.bandId ? String(route.query.bandId) : ''))
const displayBandId = computed(() =>
  status.value?.bandId != null ? String(status.value.bandId) : queryBandId.value
)

function onBandChange(event) {
  const value = event.target.value
  const query = { ...route.query }
  if (value) query.bandId = value
  else delete query.bandId
  router.replace({ query })
}

async function load() {
  loadError.value = false
  try {
    const access = await getMyBandAccess()
    const owned = (access?.owned || []).map((row) => ({
      bandId: row.bandId,
      name: row.name || row.bandName,
      role: 'owner',
    }))
    const team = (access?.teamAccess || []).map((row) => ({
      bandId: row.bandId,
      name: row.name || row.bandName,
      role: row.role || 'member',
    }))
    bands.value = [...owned, ...team]
    status.value = await fetchLabsStatus(queryBandId.value || null)
  } catch {
    loadError.value = true
  }
}

watch(queryBandId, () => {
  load()
}, { immediate: true })
</script>

<style scoped>
.labs-note {
  color: #9aa6b5;
}
.labs-session {
  margin-top: 0.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.labs-session h2 {
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.labs-session p {
  margin: 0;
  color: rgba(247, 249, 252, 0.45);
  font-size: 0.88rem;
}
.labs-session code {
  color: rgba(247, 249, 252, 0.7);
}
.labs-bands {
  margin-top: 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 24rem;
}
.labs-bands label {
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.4);
}
.labs-bands select {
  min-height: 44px;
  background: #0b0e14;
  color: #f7f9fc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 0 0.7rem;
  font: inherit;
}
</style>
