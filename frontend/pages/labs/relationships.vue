<template>
  <LabsShell title="Relationships">
    <p class="labs-note">
      Internal inspector for the RelationshipEvent ledger. Not artist product UI.
      Historical fans may have no events yet — no backfill in Phase 04.
    </p>

    <section class="labs-card">
      <h2>Band</h2>
      <select :value="queryBandId" @change="onBandChange">
        <option value="">No band selected</option>
        <option v-for="band in bands" :key="band.bandId" :value="String(band.bandId)">
          {{ band.name || `Band ${band.bandId}` }} ({{ band.role }})
        </option>
      </select>
    </section>

    <section v-if="bandId" class="labs-card">
      <h2>Fan</h2>
      <form class="labs-search" @submit.prevent="searchFans">
        <input v-model="queryText" type="search" placeholder="Search email or name" />
        <button type="submit">Search</button>
      </form>
      <p v-if="fanError" class="labs-note">{{ fanError }}</p>
      <ul v-if="fans.length" class="labs-fans">
        <li v-for="fan in fans" :key="fan.id">
          <button type="button" class="labs-fan" @click="selectFan(fan.id)">
            {{ fan.emailMasked }} · {{ fan.status }} · id {{ fan.id }}
          </button>
        </li>
      </ul>
      <p v-else-if="searched" class="labs-note">No fans matched.</p>
    </section>

    <section v-if="fan" class="labs-card">
      <h2>Identity</h2>
      <p>Fan id: <code>{{ fan.id }}</code></p>
      <p>Email: <code>{{ fan.emailMasked }}</code></p>
      <p>Status: <code>{{ fan.status }}</code></p>
      <p>Joined: <code>{{ fan.subscribedAt || '—' }}</code></p>
    </section>

    <section v-if="fan" class="labs-card">
      <h2>Relationship events</h2>
      <p v-if="timelineError" class="labs-note">{{ timelineError }}</p>
      <p v-else-if="empty" class="labs-note">
        No relationship events have been recorded for this fan yet.
        Canonical fan/attendance data may exist independently.
      </p>
      <table v-else class="labs-table">
        <thead>
          <tr>
            <th>Type</th>
            <th>occurredAt</th>
            <th>source</th>
            <th>visibility</th>
            <th>metadata</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="event in events" :key="event.id">
            <td>{{ event.type }}</td>
            <td>{{ event.occurredAt }}</td>
            <td>{{ event.sourceType }}#{{ event.sourceId }}</td>
            <td>{{ event.visibility }}</td>
            <td><code>{{ formatMeta(event.metadata) }}</code></td>
          </tr>
        </tbody>
      </table>
      <button v-if="nextCursor" type="button" class="labs-more" @click="loadMore">
        Load older
      </button>
    </section>
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'
import { useBandTeam } from '~/composables/useBandTeam'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Relationships',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const router = useRouter()
const { getMyBandAccess } = useBandTeam()
const { fetchRelationshipFans, fetchRelationshipTimeline } = useLabsFeatures()

const bands = ref([])
const fans = ref([])
const events = ref([])
const fan = ref(null)
const nextCursor = ref(null)
const empty = ref(false)
const searched = ref(false)
const queryText = ref('')
const fanError = ref('')
const timelineError = ref('')

const queryBandId = computed(() => (route.query.bandId ? String(route.query.bandId) : ''))
const bandId = computed(() => queryBandId.value)
const fanId = computed(() => (route.query.fanId ? String(route.query.fanId) : ''))

function onBandChange(event) {
  const value = event.target.value
  const query = { ...route.query }
  if (value) query.bandId = value
  else delete query.bandId
  delete query.fanId
  router.replace({ query })
}

function selectFan(id) {
  router.replace({ query: { ...route.query, fanId: String(id) } })
}

function formatMeta(meta) {
  if (!meta || typeof meta !== 'object') return '—'
  try {
    return JSON.stringify(meta)
  } catch {
    return '—'
  }
}

async function searchFans() {
  fanError.value = ''
  searched.value = true
  if (!bandId.value) return
  try {
    const data = await fetchRelationshipFans(bandId.value, queryText.value)
    fans.value = data?.fans || []
  } catch {
    fanError.value = 'Unable to search fans.'
    fans.value = []
  }
}

async function loadTimeline({ append = false } = {}) {
  timelineError.value = ''
  if (!bandId.value || !fanId.value) {
    fan.value = null
    events.value = []
    return
  }
  try {
    const data = await fetchRelationshipTimeline({
      bandId: bandId.value,
      fanId: fanId.value,
      cursor: append ? nextCursor.value : null,
    })
    fan.value = data?.fan || null
    const page = data?.events || []
    events.value = append ? [...events.value, ...page] : page
    nextCursor.value = data?.nextCursor || null
    empty.value = !append && Boolean(data?.empty)
  } catch {
    timelineError.value = 'Unable to load timeline.'
    if (!append) {
      fan.value = null
      events.value = []
    }
  }
}

async function loadMore() {
  if (!nextCursor.value) return
  await loadTimeline({ append: true })
}

async function loadBands() {
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
  } catch {
    bands.value = []
  }
}

watch([bandId, fanId], () => {
  events.value = []
  nextCursor.value = null
  loadTimeline()
})

watch(bandId, () => {
  fans.value = []
  searched.value = false
  if (bandId.value) searchFans()
})

onMounted(async () => {
  await loadBands()
  if (bandId.value) await searchFans()
  if (fanId.value) await loadTimeline()
})
</script>

<style scoped>
.labs-card {
  margin: 0 0 1.25rem;
  padding: 1rem 1.1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}
.labs-card h2 {
  margin: 0 0 0.6rem;
  font-size: 1rem;
}
.labs-note {
  margin: 0.25rem 0 1rem;
  color: #9aa6b5;
  font-size: 0.9rem;
}
.labs-card select,
.labs-search input,
.labs-search button,
.labs-more {
  background: #111217;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 0.4rem;
  padding: 0.35rem 0.5rem;
}
.labs-search {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}
.labs-fans {
  list-style: none;
  padding: 0;
  margin: 0;
}
.labs-fan {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: #e8eaed;
  border: 0;
  padding: 0.35rem 0;
  cursor: pointer;
}
.labs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.labs-table th,
.labs-table td {
  text-align: left;
  padding: 0.4rem 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  vertical-align: top;
}
.labs-more {
  margin-top: 0.75rem;
}
</style>
