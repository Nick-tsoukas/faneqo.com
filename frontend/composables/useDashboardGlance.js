import { computed, ref, unref } from 'vue'

/**
 * Dashboard performance glance.
 *
 * Reads one lightweight aggregate (`/analytics/dashboard-glance`) rather than
 * the full rollups/pulse payloads. This strip is situational awareness, not
 * the Analytics page.
 */

export const GLANCE_METRICS = [
  { key: 'views', label: 'Views' },
  { key: 'qrScans', label: 'QR scans' },
  { key: 'newFans', label: 'New fans' },
]

export function formatGlanceValue(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return '0'

  const rounded = Math.round(n)
  if (rounded < 10000) return rounded.toLocaleString('en-US')

  // Keeps the mobile columns from wrapping once an artist gets real traffic.
  const compact = rounded >= 1000000 ? rounded / 1000000 : rounded / 1000
  const suffix = rounded >= 1000000 ? 'M' : 'K'
  const trimmed = compact >= 100 ? Math.round(compact) : Math.round(compact * 10) / 10
  return `${trimmed}${suffix}`
}

/**
 * Returns null whenever a trend would be dishonest or meaningless: no
 * comparison period, an infinite jump from zero, or a change that rounds to 0%.
 * Callers render the bare number in that case.
 */
export function formatGlanceTrend(changePct) {
  if (changePct === null || changePct === undefined) return null

  const pct = Number(changePct)
  if (!Number.isFinite(pct)) return null

  const rounded = Math.round(pct)
  if (rounded === 0) return null

  const direction = rounded > 0 ? 'up' : 'down'
  const magnitude = Math.abs(rounded)

  return {
    direction,
    value: rounded,
    label: `${direction === 'up' ? '↑' : '↓'}${magnitude}%`,
    srLabel: `${magnitude}% ${direction} versus the previous period`,
  }
}

export function toGlanceRows(payload) {
  const metrics = payload?.metrics || {}

  return GLANCE_METRICS.map(({ key, label }) => {
    const metric = metrics[key] || {}
    const current = Number(metric.current)

    return {
      key,
      label,
      value: Number.isFinite(current) ? current : 0,
      display: formatGlanceValue(metric.current),
      trend: formatGlanceTrend(metric.changePct),
    }
  })
}

export function formatGlanceRangeLabel(days) {
  const n = Number(days)
  if (!Number.isFinite(n) || n <= 0) return 'Last 7 days'
  return n === 1 ? 'Last 24 hours' : `Last ${Math.trunc(n)} days`
}

export function useDashboardGlance(bandId, { days = 7 } = {}) {
  const client = useStrapiClient()

  const payload = ref(null)
  const loading = ref(false)
  const loaded = ref(false)
  const failed = ref(false)

  const rows = computed(() => toGlanceRows(payload.value))
  const rangeLabel = computed(() => formatGlanceRangeLabel(payload.value?.days ?? days))

  async function load() {
    const id = unref(bandId)
    if (!id) {
      payload.value = null
      loaded.value = false
      return
    }

    loading.value = true
    failed.value = false

    try {
      const data = await client('/analytics/dashboard-glance', {
        params: { bandId: id, days },
      })
      payload.value = data?.ok ? data : null
      loaded.value = !!payload.value
    } catch (err) {
      // A missing strip is better than a broken dashboard.
      console.error('[Dashboard] Failed to load performance glance:', err)
      payload.value = null
      loaded.value = false
      failed.value = true
    } finally {
      loading.value = false
    }
  }

  return { rows, rangeLabel, loading, loaded, failed, load }
}
