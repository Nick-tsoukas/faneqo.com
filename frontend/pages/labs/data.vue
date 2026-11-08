<template>
  <LabsShell title="Data integrity">
    <p class="labs-note">
      Read-only inspector for fan and attendance uniqueness. No merge, delete, or
      “Fix”. This reflects the connected API database only.
      Production constraint status is UNKNOWN until that host is audited separately.
    </p>

    <p v-if="loadError" class="labs-note">Unable to load integrity audit.</p>

    <template v-else>
    <section class="labs-card">
      <h2>Environment</h2>
      <p>Connected database: <code>{{ environmentLabel }}</code></p>
      <p class="labs-note">{{ environmentNote }}</p>
      <p class="labs-note">Production status: {{ productionStatus }}</p>
    </section>

    <section class="labs-card">
      <h2>Constraint readiness</h2>
      <table class="labs-table">
        <thead>
          <tr>
            <th>Constraint</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Fan uniqueness</td>
            <td>{{ constraints.fanUniqueness || 'UNKNOWN' }}</td>
          </tr>
          <tr>
            <td>Campaign attendance</td>
            <td>{{ constraints.campaignAttendance || 'UNKNOWN' }}</td>
          </tr>
          <tr>
            <td>Event attendance</td>
            <td>{{ constraints.eventAttendance || 'UNKNOWN' }}</td>
          </tr>
        </tbody>
      </table>
      <p class="labs-note">
        Unique index apply:
        fan {{ apply.fan || '—' }} · campaign {{ apply.campaignAttendance || '—' }} · event
        {{ apply.eventAttendance || '—' }}
      </p>
    </section>

    <section class="labs-card">
      <h2>Fan identity</h2>
      <p class="labs-status">{{ labels.fanIdentity || 'UNKNOWN' }}</p>
      <p>Duplicate groups: <code>{{ fans.groups }}</code></p>
      <p>Excess rows: <code>{{ fans.excessRows }}</code></p>
      <p>Largest group: <code>{{ fans.largestGroup }}</code></p>
      <p>Key coverage: <code>{{ formatPct(fans.keyCoveragePct) }}</code></p>
      <p>Identity-key index: <code>{{ fans.identityKeyIndex || 'UNKNOWN' }}</code></p>
    </section>

    <section class="labs-card">
      <h2>Campaign attendance</h2>
      <p class="labs-status">{{ labels.campaignAttendance || 'UNKNOWN' }}</p>
      <p>Duplicate groups: <code>{{ attendance.campaignGroups }}</code></p>
      <p>Key coverage: <code>{{ formatPct(attendance.campaignKeyCoveragePct) }}</code></p>
      <p>Identity-key index: <code>{{ attendance.campaignIdentityKeyIndex || 'UNKNOWN' }}</code></p>
    </section>

    <section class="labs-card">
      <h2>Event attendance</h2>
      <p class="labs-status">{{ labels.eventAttendance || 'UNKNOWN' }}</p>
      <p>Duplicate groups: <code>{{ attendance.eventGroups }}</code></p>
      <p>Key coverage: <code>{{ formatPct(attendance.eventKeyCoveragePct) }}</code></p>
      <p>Identity-key index: <code>{{ attendance.eventIdentityKeyIndex || 'UNKNOWN' }}</code></p>
      <p>Rows with both campaign and event: <code>{{ attendance.bothCampaignAndEvent }}</code></p>
      <p>
        suppressedDuplicate never true:
        <code>{{ formatBool(attendance.neverSuppressedTrue) }}</code>
      </p>
    </section>
    </template>
  </LabsShell>
</template>

<script setup>
import LabsShell from '@/components/labs/LabsShell.vue'

definePageMeta({
  middleware: ['auth', 'labs'],
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Labs · Data',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const { fetchIntegrity } = useLabsFeatures()

const loadError = ref(false)
const payload = ref(null)

const constraints = computed(() => payload.value?.constraints || {})
const fans = computed(() => payload.value?.fans || { groups: '—', excessRows: '—', largestGroup: '—' })
const attendance = computed(() => payload.value?.attendance || {
  campaignGroups: '—',
  eventGroups: '—',
  bothCampaignAndEvent: '—',
  neverSuppressedTrue: null,
})
const productionStatus = computed(() => payload.value?.productionStatus || 'UNKNOWN')
const labels = computed(() => payload.value?.labels || {})
const apply = computed(() => payload.value?.uniqueIndexApplicability || {})
const environmentLabel = computed(() => payload.value?.environment?.label || 'unknown')
const environmentNote = computed(() => payload.value?.environment?.note || 'Connected database only. Production is UNKNOWN until audited on Railway.')

function formatBool(value) {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return 'unknown'
}

function formatPct(value) {
  if (value == null || value === '') return '—'
  return `${value}%`
}

onMounted(async () => {
  loadError.value = false
  try {
    payload.value = await fetchIntegrity()
  } catch {
    loadError.value = true
  }
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
.labs-card p,
.labs-note {
  margin: 0.25rem 0;
  color: #9aa6b5;
  font-size: 0.9rem;
}
.labs-status {
  margin: 0 0 0.6rem;
  color: #e8eef7;
  font-size: 0.95rem;
  font-weight: 600;
}
.labs-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.92rem;
}
.labs-table th,
.labs-table td {
  text-align: left;
  padding: 0.4rem 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
</style>
