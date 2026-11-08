<template>
  <div class="rboard">
    <p class="rboard__lede">
      Artist × fan history. Canonical shows, sparse Moments, and the
      thresholds that actually matter. Not Passport. Not a score.
    </p>

    <section class="rboard__pick">
      <label class="rboard__label" for="rel-band">Band</label>
      <select id="rel-band" :value="queryBandId" @change="onBandChange">
        <option value="">No band selected</option>
        <option v-for="band in bands" :key="band.bandId" :value="String(band.bandId)">
          {{ band.name || `Band ${band.bandId}` }} ({{ band.role }})
        </option>
      </select>

      <form v-if="bandId" class="rboard__search" @submit.prevent="searchFans">
        <label class="rboard__label" for="rel-fan">Fan</label>
        <div class="rboard__row">
          <input
            id="rel-fan"
            v-model="queryText"
            type="search"
            placeholder="Search name"
            autocomplete="off"
          >
          <button type="submit">Search</button>
        </div>
      </form>
      <p v-if="fanError" class="rboard__note">{{ fanError }}</p>
      <ul v-if="fans.length" class="rboard__fans">
        <li v-for="fan in fans" :key="fan.id">
          <button type="button" class="rboard__fan" @click="selectFan(fan.id)">
            {{ fanLabel(fan) }}
          </button>
        </li>
      </ul>
    </section>

    <div class="rboard__toolbar">
      <span class="rboard__label">Width</span>
      <div class="rboard__pills" role="group" aria-label="Preview width">
        <button
          v-for="w in widths"
          :key="w"
          type="button"
          class="rboard__pill"
          :class="{ 'is-on': width === w }"
          :aria-pressed="width === w"
          @click="width = w"
        >
          {{ w }}
        </button>
      </div>
    </div>

    <section v-if="live" class="rboard__block">
      <header class="rboard__head">
        <p class="rboard__kicker">Live</p>
        <h2>This relationship</h2>
      </header>
      <p v-if="loadError" class="rboard__note">Unable to load this relationship.</p>
      <div v-else class="rboard__stage-wrap">
        <div class="rboard__stage" :style="{ width: `${width}px` }">
          <LabsRelationshipStory v-bind="live" />
        </div>
      </div>
    </section>

    <section
      v-for="row in cases"
      :key="row.key"
      class="rboard__block"
    >
      <header class="rboard__head">
        <p class="rboard__kicker">{{ row.key === 'thesis' ? 'Visual thesis' : 'Fixture' }}</p>
        <h2>{{ row.title }}</h2>
        <p>{{ row.note }}</p>
      </header>
      <div class="rboard__stage-wrap">
        <div class="rboard__stage" :style="{ width: `${width}px` }">
          <LabsRelationshipStory v-bind="row.story" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LabsRelationshipStory from '@/components/labs/LabsRelationshipStory.vue'
import { relationshipLabCaseList } from '@/config/relationshipLab'
import { useBandTeam } from '~/composables/useBandTeam'
import { useLabsFeatures } from '~/composables/useLabsFeatures'

const widths = [390, 430, 1280]
const width = ref(390)

const route = useRoute()
const router = useRouter()
const { getMyBandAccess } = useBandTeam()
const { fetchRelationshipFans, fetchArtistFanProgression } = useLabsFeatures()

const bands = ref([])
const fans = ref([])
const live = ref(null)
const queryText = ref('')
const fanError = ref('')
const loadError = ref('')

const queryBandId = computed(() => (route.query.bandId ? String(route.query.bandId) : ''))
const bandId = computed(() => queryBandId.value)
const fanId = computed(() => (route.query.fanId ? String(route.query.fanId) : ''))

const cases = relationshipLabCaseList

function fanLabel(fan) {
  const name = String(fan.firstName || '').trim()
  return name || fan.emailMasked || `Fan ${fan.id}`
}

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

async function searchFans() {
  fanError.value = ''
  if (!bandId.value) return
  try {
    const data = await fetchRelationshipFans(bandId.value, queryText.value)
    fans.value = data?.fans || []
  } catch {
    fanError.value = 'Unable to search fans.'
    fans.value = []
  }
}

function toStory(data) {
  if (!data) return null
  return {
    artistName: data.band?.name || '',
    fanName: data.fan?.displayName || data.fan?.firstName || '',
    joinedAt: data.joinedAt,
    shows: data.shows,
    communication: data.communication,
    moments: data.moments || [],
    milestones: data.milestones || [],
  }
}

async function loadProgression() {
  loadError.value = ''
  live.value = null
  if (!bandId.value || !fanId.value) return
  try {
    const data = await fetchArtistFanProgression({
      bandId: bandId.value,
      fanId: fanId.value,
    })
    live.value = toStory(data)
  } catch {
    loadError.value = 'Unable to load this relationship.'
  }
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
  loadProgression()
})

watch(bandId, () => {
  fans.value = []
  if (bandId.value) searchFans()
})

onMounted(async () => {
  await loadBands()
  if (bandId.value) await searchFans()
  if (fanId.value) await loadProgression()
})
</script>

<style scoped>
.rboard {
  font-family: Poppins, sans-serif;
  color: #f7f9fc;
}
.rboard__lede {
  margin: 0 0 1.4rem;
  max-width: 38rem;
  color: #9aa6b5;
  font-size: 0.95rem;
  line-height: 1.55;
}
.rboard__pick {
  margin: 0 0 1.6rem;
}
.rboard__label {
  display: block;
  margin: 0 0 0.4rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.rboard__pick select,
.rboard__search input,
.rboard__search button,
.rboard__pill {
  background: #0b0e14;
  color: #f7f9fc;
  border: 1px solid rgba(255, 255, 255, 0.12);
  min-height: 44px;
  padding: 0 0.75rem;
  font: inherit;
}
.rboard__pick select {
  width: min(100%, 24rem);
  margin-bottom: 1rem;
}
.rboard__row {
  display: flex;
  gap: 0.5rem;
  max-width: 28rem;
}
.rboard__search input {
  flex: 1;
}
.rboard__search button,
.rboard__pill,
.rboard__fan {
  cursor: pointer;
}
.rboard__fans {
  list-style: none;
  margin: 0.75rem 0 0;
  padding: 0;
}
.rboard__fan {
  display: block;
  width: 100%;
  text-align: left;
  min-height: 44px;
  background: transparent;
  color: #f7f9fc;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  font: inherit;
  padding: 0.45rem 0;
}
.rboard__note {
  color: #9aa6b5;
  font-size: 0.9rem;
}
.rboard__toolbar {
  margin: 0 0 1.8rem;
}
.rboard__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}
.rboard__pill.is-on {
  color: #fff;
  border-color: rgba(255, 255, 255, 0.35);
}
.rboard__block {
  margin: 0 0 2.6rem;
}
.rboard__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.rboard__head h2 {
  margin: 0.3rem 0 0;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}
.rboard__head p {
  margin: 0.35rem 0 0;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.rboard__stage-wrap {
  margin-top: 1rem;
  overflow-x: auto;
  background: #050608;
}
.rboard__stage {
  max-width: 100%;
  padding: 1.1rem 1rem 1.5rem;
}
</style>
