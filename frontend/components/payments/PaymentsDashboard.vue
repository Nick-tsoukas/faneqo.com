<template>
  <section class="pay" aria-labelledby="pay-title">
    <!-- Header: what, when, export -->
    <header class="pay__head">
      <div>
        <h3 id="pay-title" class="pay__title">Payments</h3>
        <p class="pay__sub">{{ rangeLabel }}</p>
      </div>
      <div class="pay__controls">
        <div class="pay-seg" role="tablist" aria-label="Period">
          <button
            v-for="p in PERIODS"
            :key="p.key"
            type="button"
            role="tab"
            :aria-selected="period === p.key"
            :class="{ 'is-on': period === p.key }"
            @click="setPeriod(p.key)"
          >{{ p.label }}</button>
        </div>
        <button type="button" class="pay-btn" :disabled="exporting" @click="exportCsv">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11" /><path d="M7 10l5 5 5-5" /><path d="M5 20h14" /></svg>
          {{ exporting ? 'Exporting…' : 'Export CSV' }}
        </button>
      </div>
    </header>

    <p v-if="reportError" class="pay__error" role="alert">{{ reportError }} <button type="button" @click="loadReport">Retry</button></p>

    <!-- Figures -->
    <dl class="pay-figs" :class="{ 'is-loading': reportLoading }">
      <div class="pay-fig">
        <dt>Gross volume</dt>
        <dd class="pay-fig__value">{{ money(totals.grossCents) }}</dd>
        <dd v-if="delta('grossCents')" class="pay-fig__delta" :class="delta('grossCents').cls">{{ delta('grossCents').text }}</dd>
      </div>
      <div class="pay-fig">
        <dt>Payments</dt>
        <dd class="pay-fig__value">{{ count(totals.paidCount) }}</dd>
        <dd v-if="delta('paidCount')" class="pay-fig__delta" :class="delta('paidCount').cls">{{ delta('paidCount').text }}</dd>
      </div>
      <div class="pay-fig">
        <dt>Average payment</dt>
        <dd class="pay-fig__value">{{ money(totals.averageCents) }}</dd>
      </div>
      <div class="pay-fig">
        <dt>Refunded</dt>
        <dd class="pay-fig__value">{{ money(totals.refundedCents) }}</dd>
        <dd class="pay-fig__note">Received after refunds: {{ money(totals.receivedCents) }}</dd>
      </div>
    </dl>

    <!-- Fees and net, only as far as Stripe has reported them -->
    <div v-if="totals.paidCount" class="pay-fees">
      <div><span>Faneqo fee</span><b>{{ money(totals.fees.platformFeeCents) }}</b></div>
      <div><span>Stripe fees</span><b>{{ money(totals.fees.stripeFeeCents) }}</b></div>
      <div><span>Net proceeds</span><b>{{ totals.fees.coveredCount ? money(totals.fees.netProceedsCents) : '—' }}</b></div>
      <p class="pay-fees__note">
        <template v-if="totals.fees.complete">From Stripe, for every payment in this period. Net is after fees and refunds.</template>
        <template v-else-if="totals.fees.coveredCount">Fees and net cover {{ totals.fees.coveredCount }} of {{ totals.paidCount }} payments; older payments were made before fee details were recorded.</template>
        <template v-else>Fee details are recorded for new payments. Payments in this period were made before that.</template>
      </p>
    </div>

    <!-- Chart -->
    <figure class="pay-chart" aria-label="Gross payment volume over time">
      <figcaption>
        <span>Gross volume by {{ report?.series?.unit || 'day' }}</span>
        <span v-if="hover" class="pay-chart__tip">{{ bucketLabel(hover) }} · {{ money(hover.grossCents) }} · {{ hover.count }} {{ hover.count === 1 ? 'payment' : 'payments' }}</span>
      </figcaption>
      <div class="pay-chart__plot" @mouseleave="hover = null">
        <div v-if="!points.length || !maxBucket" class="pay-chart__empty">No payments in this period.</div>
        <div
          v-for="(p, i) in points"
          v-else
          :key="p.start"
          class="pay-chart__col"
          :class="{ 'is-hover': hover === p }"
          :title="`${bucketLabel(p)}: ${money(p.grossCents)}`"
          @mouseenter="hover = p"
          @focus="hover = p"
          tabindex="0"
        >
          <span class="pay-chart__bar" :style="{ height: `${p.grossCents ? Math.max(3, (p.grossCents / maxBucket) * 100) : 0}%` }"></span>
        </div>
      </div>
      <div v-if="points.length" class="pay-chart__axis" aria-hidden="true">
        <span>{{ bucketLabel(points[0]) }}</span>
        <span>{{ bucketLabel(points[points.length - 1]) }}</span>
      </div>
    </figure>

    <!-- Transactions -->
    <div class="pay-tx">
      <div class="pay-tx__head">
        <h4>Transactions</h4>
        <div class="pay-tx__filters">
          <label class="pay-field pay-field--search">
            <span class="sr-only">Search</span>
            <input v-model="filters.q" type="search" placeholder="Search description or reference" @input="debouncedLoad">
          </label>
          <label class="pay-field">
            <span class="sr-only">Status</span>
            <select v-model="filters.status" @change="reloadTx">
              <option value="">All statuses</option>
              <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </label>
          <label v-if="types.length" class="pay-field">
            <span class="sr-only">Type</span>
            <select v-model="filters.type" @change="reloadTx">
              <option value="">All types</option>
              <option v-for="t in types" :key="t" :value="t">{{ typeLabel(t) }}</option>
            </select>
          </label>
          <label class="pay-field">
            <span class="sr-only">From</span>
            <input v-model="filters.from" type="date" @change="reloadTx">
          </label>
          <label class="pay-field">
            <span class="sr-only">To</span>
            <input v-model="filters.to" type="date" @change="reloadTx">
          </label>
        </div>
      </div>

      <p v-if="txError" class="pay__error" role="alert">{{ txError }} <button type="button" @click="loadTx">Retry</button></p>

      <div v-if="!txLoading && !rows.length && !txError" class="pay-tx__empty">
        <template v-if="hasFilters">No transactions match these filters.</template>
        <template v-else>No payments yet. When fans pay through your payment buttons, every transaction appears here.</template>
      </div>

      <!-- Desktop table -->
      <div v-if="rows.length" class="pay-table" :class="{ 'is-loading': txLoading }">
        <table>
          <thead>
            <tr><th>Date</th><th>Description</th><th>Status</th><th class="num">Amount</th><th class="num">Fees</th><th class="num">Net</th></tr>
          </thead>
          <tbody>
            <tr v-for="t in rows" :key="t.id" tabindex="0" @click="openTx(t)" @keydown.enter="openTx(t)">
              <td class="pay-table__date">{{ shortDate(t.paidAt || t.createdAt) }}</td>
              <td>
                <span class="pay-table__desc">{{ t.description || typeLabel(t.type) || 'Payment' }}</span>
                <span class="pay-table__ref">{{ t.reference }}</span>
              </td>
              <td><span class="pay-status" :class="`is-${t.status}`">{{ statusLabel(t.status) }}</span></td>
              <td class="num">
                <span :class="{ 'is-struck': t.status === 'refunded' }">{{ money(t.amountCents) }}</span>
                <span v-if="t.refundedAmountCents && t.status !== 'refunded'" class="pay-table__minus">−{{ money(t.refundedAmountCents) }}</span>
              </td>
              <td class="num muted">{{ feeText(t) }}</td>
              <td class="num">{{ t.netCents == null ? '—' : money(t.netCents) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <ul v-if="rows.length" class="pay-cards" :class="{ 'is-loading': txLoading }">
        <li v-for="t in rows" :key="t.id">
          <button type="button" @click="openTx(t)">
            <span class="pay-cards__top">
              <span class="pay-cards__desc">{{ t.description || typeLabel(t.type) || 'Payment' }}</span>
              <span class="pay-cards__amount" :class="{ 'is-struck': t.status === 'refunded' }">{{ money(t.amountCents) }}</span>
            </span>
            <span class="pay-cards__bottom">
              <span>{{ shortDate(t.paidAt || t.createdAt) }}</span>
              <span class="pay-status" :class="`is-${t.status}`">{{ statusLabel(t.status) }}</span>
            </span>
          </button>
        </li>
      </ul>

      <nav v-if="pagination.total > 0" class="pay-pager" aria-label="Transaction pages">
        <span>{{ rangeText }}</span>
        <div>
          <button type="button" class="pay-btn" :disabled="pagination.page <= 1 || txLoading" @click="goPage(pagination.page - 1)">Previous</button>
          <button type="button" class="pay-btn" :disabled="pagination.page >= pagination.pageCount || txLoading" @click="goPage(pagination.page + 1)">Next</button>
        </div>
      </nav>
    </div>

    <!-- Transaction detail drawer -->
    <Teleport to="body">
      <Transition name="pay-drawer">
        <div v-if="selected" class="pay-drawer" role="dialog" aria-modal="true" aria-labelledby="pay-drawer-title" @keydown.esc="selected = null">
          <button type="button" class="pay-drawer__backdrop" aria-label="Close" @click="selected = null"></button>
          <aside ref="drawerEl" class="pay-drawer__panel" tabindex="-1">
            <header class="pay-drawer__head">
              <p id="pay-drawer-title">Transaction</p>
              <button type="button" class="pay-drawer__close" aria-label="Close" @click="selected = null">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </header>
            <p class="pay-drawer__amount" :class="{ 'is-struck': selected.status === 'refunded' }">{{ money(selected.amountCents) }}</p>
            <p class="pay-drawer__desc">{{ selected.description || typeLabel(selected.type) || 'Payment' }}</p>
            <span class="pay-status" :class="`is-${selected.status}`">{{ statusLabel(selected.status) }}</span>

            <dl class="pay-drawer__rows">
              <div><dt>Date</dt><dd>{{ longDate(selected.paidAt || selected.createdAt) }}</dd></div>
              <div v-if="selected.type"><dt>Payment type</dt><dd>{{ typeLabel(selected.type) }}</dd></div>
              <div><dt>Reference</dt><dd class="mono">{{ selected.reference }}</dd></div>
              <div v-if="selected.refundedAmountCents"><dt>Refunded</dt><dd>{{ money(selected.refundedAmountCents) }}<span v-if="selected.refundedAt" class="muted"> · {{ shortDate(selected.refundedAt) }}</span></dd></div>
              <div v-if="selected.disputeStatus"><dt>Dispute</dt><dd>{{ disputeLabel(selected.disputeStatus) }}</dd></div>
            </dl>

            <dl class="pay-drawer__rows pay-drawer__money">
              <div><dt>Amount</dt><dd>{{ money(selected.amountCents) }}</dd></div>
              <div><dt>Faneqo fee</dt><dd>{{ selected.platformFeeCents == null ? '—' : `−${money(selected.platformFeeCents)}` }}</dd></div>
              <div><dt>Stripe fee</dt><dd>{{ selected.stripeFeeCents == null ? '—' : `−${money(selected.stripeFeeCents)}` }}</dd></div>
              <div v-if="selected.refundedAmountCents"><dt>Refunds</dt><dd>−{{ money(selected.refundedAmountCents) }}</dd></div>
              <div class="is-total"><dt>Net to you</dt><dd>{{ selected.netCents == null ? 'Not yet reported' : money(selected.netCents) }}</dd></div>
            </dl>
            <p v-if="selected.netCents == null && isSucceeded(selected.status)" class="pay-drawer__note">Stripe hadn’t reported fees for this payment when it was recorded. See it in your Stripe dashboard.</p>

            <div v-if="selected.stripePaymentIntentId" class="pay-drawer__stripe">
              <span>Stripe payment</span>
              <code>{{ selected.stripePaymentIntentId }}</code>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'

const props = defineProps({
  bandId: { type: [Number, String], required: true },
})

const config = useRuntimeConfig()
const token = useStrapiToken()

const PERIODS = [
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '90d', label: '90D' },
  { key: '365d', label: '1Y' },
  { key: 'all', label: 'All' },
]
const STATUS_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'partially_refunded', label: 'Partially refunded' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'canceled', label: 'Canceled' },
]
const TYPE_LABELS = {
  tip_band: 'Tip', support_band: 'Support', pay_merch: 'Merch', merch_table: 'Merch table',
  pay_entry: 'Entry', help_get_home: 'Help us get home', after_show_support: 'After-show support',
}

const period = ref('30d')
const report = ref(null)
const reportLoading = ref(false)
const reportError = ref('')
const hover = ref(null)

const rows = ref([])
const types = ref([])
const pagination = reactive({ page: 1, pageSize: 25, total: 0, pageCount: 1 })
const filters = reactive({ q: '', status: '', type: '', from: '', to: '' })
const txLoading = ref(false)
const txError = ref('')
const selected = ref(null)
const drawerEl = ref(null)
const exporting = ref(false)

const EMPTY = { paidCount: 0, grossCents: 0, refundedCents: 0, receivedCents: 0, averageCents: 0, fees: { coveredCount: 0, complete: false, platformFeeCents: 0, stripeFeeCents: 0, netProceedsCents: 0 } }
const totals = computed(() => report.value?.totals || EMPTY)
const points = computed(() => report.value?.series?.points || [])
const maxBucket = computed(() => Math.max(0, ...points.value.map((p) => p.grossCents)))
const hasFilters = computed(() => Object.values(filters).some(Boolean))

const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((Number(cents) || 0) / 100)
const count = (v) => new Intl.NumberFormat('en-US').format(Number(v) || 0)
const shortDate = (v) => (v ? new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')
const longDate = (v) => (v ? new Date(v).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')
const typeLabel = (t) => TYPE_LABELS[t] || (t ? t.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()) : '')
const statusLabel = (s) => STATUS_OPTIONS.find((o) => o.value === s)?.label || 'Pending'
const isSucceeded = (s) => ['paid', 'partially_refunded', 'refunded', 'disputed'].includes(s)
const disputeLabel = (s) => ({ needs_response: 'Needs response', under_review: 'Under review', won: 'Won', lost: 'Lost', warning_needs_response: 'Inquiry: needs response', warning_under_review: 'Inquiry: under review', warning_closed: 'Inquiry closed' }[s] || s)
const feeText = (t) => (t.platformFeeCents == null && t.stripeFeeCents == null ? '—' : money((t.platformFeeCents || 0) + (t.stripeFeeCents || 0)))

const rangeLabel = computed(() => {
  const r = report.value?.range
  if (!r) return 'Payments made through your Faneqo payment buttons'
  const end = new Date(new Date(r.end).getTime() - 86400000)
  return `${shortDate(r.start)} – ${shortDate(end)}`
})

const rangeText = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(pagination.total, pagination.page * pagination.pageSize)
  return `${count(start)}–${count(end)} of ${count(pagination.total)}`
})

function bucketLabel(p) {
  if (!p) return ''
  const d = new Date(p.start)
  const unit = report.value?.series?.unit
  if (unit === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function delta(key) {
  const prev = report.value?.previous
  if (!prev || !(key in prev)) return null
  const now = Number(totals.value[key]) || 0
  const before = Number(prev[key]) || 0
  if (!before && !now) return null
  if (!before) return { text: 'New this period', cls: 'is-up' }
  const pct = Math.round(((now - before) / before) * 100)
  if (pct === 0) return { text: 'Same as previous period', cls: '' }
  return { text: `${pct > 0 ? '+' : ''}${pct}% vs previous period`, cls: pct > 0 ? 'is-up' : 'is-down' }
}

const authHeaders = () => (token.value ? { Authorization: `Bearer ${token.value}` } : {})
const base = () => `${config.public.strapiUrl}/api/bands/${props.bandId}/payments`

function txQuery(page = pagination.page) {
  const q = { page, pageSize: pagination.pageSize }
  for (const [k, v] of Object.entries(filters)) if (v) q[k] = v
  return q
}

async function loadReport() {
  if (!token.value || !props.bandId) return
  reportLoading.value = true
  reportError.value = ''
  try {
    report.value = await $fetch(`${base()}/report`, { headers: authHeaders(), query: { period: period.value } })
  } catch {
    reportError.value = 'Couldn’t load payment figures.'
  } finally {
    reportLoading.value = false
  }
}

async function loadTx(page = pagination.page) {
  if (!token.value || !props.bandId) return
  txLoading.value = true
  txError.value = ''
  try {
    const res = await $fetch(`${base()}/transactions`, { headers: authHeaders(), query: txQuery(page) })
    rows.value = res?.data || []
    Object.assign(pagination, res?.pagination || {})
    types.value = res?.filters?.types || []
  } catch {
    txError.value = 'Couldn’t load transactions.'
  } finally {
    txLoading.value = false
  }
}

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => loadTx(1), 300)
}
const reloadTx = () => loadTx(1)
const goPage = (p) => loadTx(p)

function setPeriod(key) {
  if (period.value === key) return
  period.value = key
  loadReport()
}

async function openTx(t) {
  selected.value = t
  await nextTick()
  drawerEl.value?.focus()
}

async function exportCsv() {
  exporting.value = true
  try {
    const q = txQuery(1)
    delete q.page; delete q.pageSize
    const blob = await $fetch(`${base()}/export`, { headers: authHeaders(), query: q, responseType: 'blob' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `faneqo-payments-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  } catch {
    txError.value = 'Export failed. Please try again.'
  } finally {
    exporting.value = false
  }
}

watch(() => props.bandId, () => { loadReport(); loadTx(1) })
onMounted(() => { loadReport(); loadTx(1) })
</script>

<style scoped>
.pay {
  --ink: #f5f3ef;
  --muted: #9a9ca6;
  --quiet: #6e7079;
  --hair: rgba(245, 243, 239, 0.09);
  --panel: #101116;
  --up: #5ad19a;
  --down: #f0a07a;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.pay p, .pay h3, .pay h4, .pay dl, .pay dd { margin: 0; }
.pay svg { display: block; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
.muted { color: var(--muted); }
.mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.8125rem; }
.is-struck { color: var(--quiet); text-decoration: line-through; }

.pay__head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 1rem; }
.pay__title { font-size: 1.375rem; font-weight: 700; letter-spacing: -0.02em; }
.pay__sub { margin-top: 0.2rem; color: var(--muted); font-size: 0.875rem; }
.pay__controls { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.pay__error { margin-top: 1rem; color: #fca5a5; font-size: 0.875rem; }
.pay__error button { margin-left: 0.4rem; color: var(--ink); text-decoration: underline; }

.pay-seg { display: inline-flex; padding: 0.2rem; border-radius: 0.7rem; background: rgba(245, 243, 239, 0.05); box-shadow: inset 0 0 0 1px var(--hair); }
.pay-seg button { min-width: 2.75rem; min-height: 2.25rem; padding: 0 0.7rem; border-radius: 0.55rem; color: var(--muted); font-size: 0.8125rem; font-weight: 600; }
.pay-seg button.is-on { background: var(--ink); color: #0b0b0e; }
.pay-seg button:focus-visible, .pay-btn:focus-visible { outline: 2px solid #8b6cff; outline-offset: 2px; }

.pay-btn { display: inline-flex; align-items: center; gap: 0.45rem; min-height: 2.5rem; padding: 0 0.95rem; border-radius: 0.7rem; box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font-size: 0.8125rem; font-weight: 600; }
.pay-btn:hover:not(:disabled) { background: rgba(245, 243, 239, 0.06); }
.pay-btn:disabled { opacity: 0.45; cursor: default; }
.pay-btn svg { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* Figures: a ruled line, not a card grid */
.pay-figs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 1.75rem; border-top: 1px solid rgba(245, 243, 239, 0.22); transition: opacity 0.2s ease; }
.pay-figs.is-loading, .pay-table.is-loading, .pay-cards.is-loading { opacity: 0.5; }
.pay-fig { display: flex; flex-direction: column; padding: 1.1rem 1.25rem 1.1rem 0; }
.pay-fig + .pay-fig { padding-left: 1.25rem; border-left: 1px solid var(--hair); }
.pay-fig dt { color: var(--muted); font-size: 0.8125rem; font-weight: 500; }
.pay-fig__value { margin-top: 0.35rem; font-size: clamp(1.6rem, 2.6vw, 2.2rem); font-weight: 650; letter-spacing: -0.035em; line-height: 1.1; }
.pay-fig__delta, .pay-fig__note { margin-top: 0.35rem; color: var(--quiet); font-size: 0.75rem; }
.pay-fig__delta.is-up { color: var(--up); }
.pay-fig__delta.is-down { color: var(--down); }

.pay-fees { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 2rem; padding: 0.9rem 0; border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); font-size: 0.875rem; }
.pay-fees > div { display: flex; gap: 0.5rem; }
.pay-fees span { color: var(--muted); }
.pay-fees b { font-weight: 600; }
.pay-fees__note { flex-basis: 100%; color: var(--quiet); font-size: 0.75rem; line-height: 1.5; }

/* Chart */
.pay-chart { margin: 1.75rem 0 0; }
.pay-chart figcaption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 0.5rem; color: var(--muted); font-size: 0.8125rem; }
.pay-chart__tip { color: var(--ink); font-weight: 600; }
.pay-chart__plot { position: relative; display: flex; align-items: flex-end; gap: 3px; height: 10rem; margin-top: 0.9rem; border-bottom: 1px solid var(--hair); }
.pay-chart__empty { position: absolute; inset: 0; display: grid; place-items: center; color: var(--quiet); font-size: 0.875rem; }
.pay-chart__col { display: flex; flex: 1; align-items: flex-end; height: 100%; outline: none; cursor: default; }
.pay-chart__bar { display: block; width: 100%; border-radius: 3px 3px 0 0; background: rgba(155, 135, 255, 0.55); transition: background 0.15s ease; }
.pay-chart__col.is-hover .pay-chart__bar, .pay-chart__col:focus-visible .pay-chart__bar { background: #b7a8ff; }
.pay-chart__axis { display: flex; justify-content: space-between; margin-top: 0.5rem; color: var(--quiet); font-size: 0.75rem; }

/* Transactions */
.pay-tx { margin-top: 2.25rem; }
.pay-tx__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.9rem; }
.pay-tx__head h4 { font-size: 1.0625rem; font-weight: 650; }
.pay-tx__filters { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.pay-field input, .pay-field select { min-height: 2.5rem; padding: 0 0.75rem; border-radius: 0.6rem; border: 0; background: rgba(245, 243, 239, 0.05); box-shadow: inset 0 0 0 1px var(--hair); color: var(--ink); font-size: 0.8125rem; color-scheme: dark; }
.pay-field--search input { width: 15rem; }
.pay-field input:focus-visible, .pay-field select:focus-visible { outline: 2px solid #8b6cff; outline-offset: 1px; }
.pay-tx__empty { margin-top: 1.25rem; padding: 2.5rem 1rem; border-radius: 0.9rem; box-shadow: inset 0 0 0 1px var(--hair); color: var(--muted); font-size: 0.9375rem; text-align: center; }

.pay-table { margin-top: 1rem; overflow-x: auto; transition: opacity 0.2s ease; }
.pay-table table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.pay-table th { padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--hair); color: var(--quiet); font-size: 0.75rem; font-weight: 600; text-align: left; white-space: nowrap; }
.pay-table td { padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--hair); vertical-align: middle; }
.pay-table tbody tr { cursor: pointer; transition: background 0.12s ease; }
.pay-table tbody tr:hover, .pay-table tbody tr:focus-visible { background: rgba(245, 243, 239, 0.035); outline: none; }
.pay-table .num { text-align: right; white-space: nowrap; }
.pay-table__date { color: var(--muted); white-space: nowrap; }
.pay-table__desc { display: block; font-weight: 550; }
.pay-table__ref { display: block; margin-top: 0.1rem; color: var(--quiet); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.6875rem; letter-spacing: 0.04em; }
.pay-table__minus { display: block; color: var(--down); font-size: 0.75rem; }

.pay-status { display: inline-block; padding: 0.15rem 0.55rem; border-radius: 999px; background: rgba(245, 243, 239, 0.07); color: var(--muted); font-size: 0.75rem; font-weight: 600; white-space: nowrap; }
.pay-status.is-paid { background: rgba(90, 209, 154, 0.12); color: var(--up); }
.pay-status.is-partially_refunded, .pay-status.is-refunded { background: rgba(240, 160, 122, 0.12); color: var(--down); }
.pay-status.is-disputed, .pay-status.is-failed { background: rgba(252, 165, 165, 0.12); color: #fca5a5; }

.pay-cards { display: none; margin: 1rem 0 0; padding: 0; list-style: none; }
.pay-cards li + li { border-top: 1px solid var(--hair); }
.pay-cards button { display: grid; gap: 0.35rem; width: 100%; padding: 0.95rem 0.1rem; text-align: left; }
.pay-cards__top, .pay-cards__bottom { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.pay-cards__desc { font-weight: 600; }
.pay-cards__amount { font-size: 1.0625rem; font-weight: 650; }
.pay-cards__bottom { color: var(--muted); font-size: 0.8125rem; }

.pay-pager { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.75rem; margin-top: 1rem; color: var(--muted); font-size: 0.8125rem; }
.pay-pager > div { display: flex; gap: 0.5rem; }

/* Drawer */
.pay-drawer { position: fixed; inset: 0; z-index: 80; display: flex; justify-content: flex-end; }
.pay-drawer__backdrop { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.55); }
.pay-drawer__panel { position: relative; width: min(26rem, 100%); height: 100%; overflow-y: auto; padding: 1.5rem 1.5rem 2rem; background: #0e0f13; box-shadow: -1px 0 0 var(--hair); color: #f5f3ef; font-variant-numeric: tabular-nums; outline: none; }
.pay-drawer__head { display: flex; align-items: center; justify-content: space-between; }
.pay-drawer__head p { margin: 0; color: #9a9ca6; font-size: 0.8125rem; font-weight: 600; }
.pay-drawer__close { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; border-radius: 0.6rem; color: #f5f3ef; }
.pay-drawer__close:hover { background: rgba(245, 243, 239, 0.06); }
.pay-drawer__close svg { width: 1.2rem; height: 1.2rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
.pay-drawer__amount { margin: 1.25rem 0 0; font-size: 2.4rem; font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; }
.pay-drawer__desc { margin: 0.35rem 0 0.75rem; color: #9a9ca6; font-size: 0.9375rem; }
.pay-drawer__rows { margin: 1.5rem 0 0; }
.pay-drawer__rows > div { display: flex; justify-content: space-between; gap: 1.25rem; padding: 0.7rem 0; border-bottom: 1px solid rgba(245, 243, 239, 0.08); font-size: 0.875rem; }
.pay-drawer__rows dt { color: #9a9ca6; }
.pay-drawer__rows dd { margin: 0; text-align: right; overflow-wrap: anywhere; }
.pay-drawer__money > div.is-total { border-bottom: 0; font-weight: 650; }
.pay-drawer__note { margin: 0.5rem 0 0; color: #6e7079; font-size: 0.75rem; line-height: 1.5; }
.pay-drawer__stripe { display: grid; gap: 0.3rem; margin-top: 1.5rem; padding: 0.8rem; border-radius: 0.7rem; background: rgba(245, 243, 239, 0.04); font-size: 0.75rem; }
.pay-drawer__stripe span { color: #6e7079; }
.pay-drawer__stripe code { color: #c9cad1; font-size: 0.75rem; overflow-wrap: anywhere; }
.pay-drawer-enter-active, .pay-drawer-leave-active { transition: opacity 0.2s ease; }
.pay-drawer-enter-active .pay-drawer__panel, .pay-drawer-leave-active .pay-drawer__panel { transition: transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1); }
.pay-drawer-enter-from, .pay-drawer-leave-to { opacity: 0; }
.pay-drawer-enter-from .pay-drawer__panel, .pay-drawer-leave-to .pay-drawer__panel { transform: translateX(100%); }

@media (max-width: 860px) {
  .pay-figs { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .pay-fig:nth-child(3) { padding-left: 0; border-left: 0; }
  .pay-fig:nth-child(n + 3) { border-top: 1px solid var(--hair); }
}

@media (max-width: 640px) {
  .pay-table { display: none; }
  .pay-cards { display: block; }
  .pay-field--search { flex-basis: 100%; }
  .pay-field--search input { width: 100%; }
  .pay-tx__filters > .pay-field:not(.pay-field--search) { flex: 1 1 45%; }
  .pay-tx__filters select, .pay-tx__filters input[type='date'] { width: 100%; }
  .pay-controls { width: 100%; }
}

@media (prefers-reduced-motion: reduce) {
  .pay-drawer-enter-active, .pay-drawer-leave-active, .pay-drawer-enter-active .pay-drawer__panel, .pay-drawer-leave-active .pay-drawer__panel { transition: none; }
}
</style>
