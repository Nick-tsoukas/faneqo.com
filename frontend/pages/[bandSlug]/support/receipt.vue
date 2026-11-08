<template>
  <main class="rcpt-page">
    <div class="rcpt-wrap">
      <!-- Loading -->
      <section v-if="state === 'loading'" class="rcpt rcpt--quiet" aria-busy="true" aria-live="polite">
        <div class="rcpt__skeleton" aria-hidden="true">
          <span class="sk sk--icon"></span><span class="sk sk--title"></span><span class="sk sk--amount"></span>
          <span class="sk sk--line"></span><span class="sk sk--line"></span><span class="sk sk--line"></span>
        </div>
        <p class="rcpt__sr">Loading your receipt…</p>
      </section>

      <!-- A receipt Stripe has spoken for -->
      <article v-else-if="receipt && view" class="rcpt" :class="`is-${view.tone}`" aria-labelledby="rcpt-title">
        <header class="rcpt__brand">
          <img src="/faneqo-wordmark-editorial.png?v=2" alt="Faneqo" width="3398" height="901">
          <span>Receipt</span>
        </header>

        <div class="rcpt__status" role="status" aria-live="polite">
          <span class="rcpt__icon" aria-hidden="true">
            <svg v-if="view.tone === 'ok'" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
            <svg v-else-if="view.tone === 'wait'" viewBox="0 0 24 24" class="is-spin"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
            <svg v-else-if="view.tone === 'refund'" viewBox="0 0 24 24"><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>
            <svg v-else viewBox="0 0 24 24"><path d="M12 8v5" /><path d="M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </span>
          <h1 id="rcpt-title" class="rcpt__title">{{ view.title }}</h1>
          <p class="rcpt__amount" :class="{ 'is-struck': view.strike }">{{ money(receipt.amountCents) }}</p>
          <p class="rcpt__line">{{ view.line }}</p>
        </div>

        <dl class="rcpt__details">
          <div v-if="receipt.recipientName"><dt>Paid to</dt><dd>{{ receipt.recipientName }}</dd></div>
          <div v-if="receipt.description"><dt>For</dt><dd>{{ receipt.description }}</dd></div>
          <div><dt>Date</dt><dd>{{ dateTime(receipt.paidAt || receipt.createdAt) }}</dd></div>
          <div v-if="receipt.refundedAmountCents > 0"><dt>Refunded</dt><dd>{{ money(receipt.refundedAmountCents) }}</dd></div>
          <div v-if="receipt.refundedAmountCents > 0 && receipt.refundedAmountCents < receipt.amountCents"><dt>Total charged</dt><dd>{{ money(receipt.amountCents - receipt.refundedAmountCents) }}</dd></div>
          <div><dt>Status</dt><dd><span class="rcpt__pill">{{ view.pill }}</span></dd></div>
          <div><dt>Reference</dt><dd class="rcpt__mono">{{ receipt.reference }}</dd></div>
        </dl>

        <p v-if="view.note" class="rcpt__note">{{ view.note }}</p>

        <div v-if="state === 'pending-timeout'" class="rcpt__actions rcpt__actions--single">
          <button type="button" class="rcpt-btn rcpt-btn--primary" @click="restartPolling">Check again</button>
        </div>

        <div class="rcpt__actions no-print">
          <button v-if="view.tone !== 'wait'" type="button" class="rcpt-btn rcpt-btn--primary" @click="printReceipt">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3h10v6" /><rect x="4" y="9" width="16" height="8" rx="2" /><path d="M7 14h10v7H7z" /></svg>
            Print receipt
          </button>
          <button v-if="canCopy" type="button" class="rcpt-btn" @click="copyLink">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h8" /></svg>
            {{ copied ? 'Link copied' : 'Copy receipt link' }}
          </button>
          <NuxtLink :to="recipientPath" class="rcpt-btn">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            Back to {{ receipt.recipientName || 'the page' }}
          </NuxtLink>
        </div>

        <footer class="rcpt__foot">
          Payment processed securely by Stripe for {{ receipt.recipientName || 'the recipient' }} on Faneqo.
          Keep this reference for your records.
        </footer>
      </article>

      <!-- No receipt to show -->
      <section v-else class="rcpt rcpt--quiet is-warn" aria-labelledby="rcpt-empty">
        <header class="rcpt__brand">
          <img src="/faneqo-wordmark-editorial.png?v=2" alt="Faneqo" width="3398" height="901">
        </header>
        <div class="rcpt__status">
          <span class="rcpt__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 8v5" /><path d="M12 16.5h.01" /><circle cx="12" cy="12" r="9" /></svg>
          </span>
          <h1 id="rcpt-empty" class="rcpt__title">{{ state === 'unverified' ? 'We couldn’t check this payment' : 'Receipt not found' }}</h1>
          <p class="rcpt__line">
            <template v-if="state === 'unverified'">This doesn’t mean the payment failed. Check your connection and try again, or look for the receipt email from Stripe.</template>
            <template v-else>This receipt link is missing or no longer valid. If you were charged, your card statement and the Stripe email receipt show the payment.</template>
          </p>
        </div>
        <div class="rcpt__actions no-print">
          <button v-if="state === 'unverified'" type="button" class="rcpt-btn rcpt-btn--primary" @click="load">Try again</button>
          <NuxtLink :to="recipientPath" class="rcpt-btn">Back to the page</NuxtLink>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const route = useRoute()
const config = useRuntimeConfig()

const bandSlug = String(route.params.bandSlug || '')
const token = route.query.r ? String(route.query.r) : ''
const legacyId = route.query.sm ? String(route.query.sm) : ''

// loading | loaded | pending-timeout | notfound | unverified
const state = ref('loading')
const receipt = ref(null)
const copied = ref(false)

// A pending payment is re-checked on a short, bounded schedule (~40s total).
const POLL_DELAYS = [1500, 2000, 3000, 4000, 5000, 6000, 8000, 10000]
let pollTimer = null
let pollIndex = 0

const recipientPath = computed(() => `/${receipt.value?.recipientSlug || bandSlug}`)
const canCopy = computed(() => !!token && typeof navigator !== 'undefined')

const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: (receipt.value?.currency || 'usd').toUpperCase() }).format((Number(cents) || 0) / 100)
const dateTime = (v) => (v ? new Date(v).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—')

/** Wording for each verified status. Success is only ever shown for paid states. */
const view = computed(() => {
  const r = receipt.value
  if (!r) return null
  const to = r.recipientName || 'the recipient'
  switch (r.status) {
    case 'paid':
      return { tone: 'ok', title: 'Payment confirmed', line: `Your payment to ${to} was successful. Thank you.`, pill: 'Paid' }
    case 'partially_refunded':
      return { tone: 'ok', title: 'Payment confirmed', line: `Your payment to ${to} was successful. Part of it has been refunded.`, pill: 'Partially refunded' }
    case 'refunded':
      return { tone: 'refund', title: 'Payment refunded', line: `This payment to ${to} was refunded in full.`, pill: 'Refunded', strike: true, note: 'Refunds usually reach your card within 5 to 10 business days.' }
    case 'disputed':
      return { tone: 'warn', title: 'Payment under dispute', line: `A dispute was opened with your bank for this payment to ${to}.`, pill: 'Disputed', note: 'Your bank handles disputes directly.' }
    case 'failed':
      return { tone: 'warn', title: 'Payment failed', line: 'The payment didn’t go through and you were not charged.', pill: 'Failed', strike: true }
    case 'canceled':
      return { tone: 'warn', title: 'Checkout canceled', line: 'This checkout was closed before payment. You were not charged.', pill: 'Canceled', strike: true }
    default:
      return state.value === 'pending-timeout'
        ? { tone: 'wait', title: 'Still processing', line: 'Your bank hasn’t confirmed this payment yet.', pill: 'Processing', note: 'This can take a few minutes. You can safely close this page; the receipt link will update once it settles.' }
        : { tone: 'wait', title: 'Confirming your payment', line: `We’re confirming your payment to ${to} with Stripe.`, pill: 'Processing' }
  }
})

async function fetchReceipt() {
  const api = config.public.strapiUrl
  const url = token
    ? `${api}/api/payment-receipts/${encodeURIComponent(token)}`
    : `${api}/api/support-moments/${encodeURIComponent(legacyId)}/summary`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 12000)
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal })
    if (res.status === 404 || res.status === 400) return { notFound: true }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    return { data: json?.data || null }
  } finally {
    clearTimeout(timer)
  }
}

function schedulePoll() {
  if (pollIndex >= POLL_DELAYS.length) { state.value = 'pending-timeout'; return }
  pollTimer = setTimeout(async () => {
    pollIndex += 1
    try {
      const { data } = await fetchReceipt()
      if (data) receipt.value = data
    } catch { /* keep trying within the budget */ }
    if (receipt.value?.status === 'pending') schedulePoll()
  }, POLL_DELAYS[pollIndex])
}

async function load() {
  clearTimeout(pollTimer)
  if (!token && !legacyId) { state.value = 'notfound'; return }
  state.value = 'loading'
  try {
    const result = await fetchReceipt()
    if (result.notFound || !result.data) { state.value = 'notfound'; return }
    receipt.value = result.data
    state.value = 'loaded'
    if (receipt.value.status === 'pending') { pollIndex = 0; schedulePoll() }
  } catch {
    state.value = 'unverified'
  }
}

function restartPolling() {
  state.value = 'loaded'
  pollIndex = 0
  schedulePoll()
}

function printReceipt() {
  window.print()
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2200)
  } catch { /* clipboard blocked: nothing to do */ }
}

useHead({
  title: 'Payment receipt | Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

onMounted(load)
onBeforeUnmount(() => clearTimeout(pollTimer))
</script>

<style scoped>
.rcpt-page {
  --page: #121110;
  --paper: #f6f2ea;
  --ink: #17151a;
  --muted: #6c665e;
  --hair: rgba(23, 21, 26, 0.12);
  --ok: #1f8a5b;
  --warn: #b4541f;
  min-height: 100vh;
  padding: calc(var(--header-height, 64px) + 2.5rem) 1.25rem 4rem;
  background:
    radial-gradient(48rem 28rem at 50% 0%, rgba(139, 108, 255, 0.1), transparent 70%),
    var(--page);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
}

.rcpt-wrap { max-width: 30rem; margin: 0 auto; }

.rcpt {
  position: relative;
  padding: 2rem 1.75rem 1.75rem;
  border-radius: 1.25rem;
  background: var(--paper);
  color: var(--ink);
  box-shadow: 0 40px 90px -40px rgba(0, 0, 0, 0.85);
}

/* A perforated edge: the slip was torn off the roll */
.rcpt::after {
  content: '';
  position: absolute;
  left: 1.25rem;
  right: 1.25rem;
  bottom: -0.45rem;
  height: 0.9rem;
  background: radial-gradient(circle at 0.45rem 0.45rem, var(--page) 0.32rem, transparent 0.34rem) 0 0 / 1.2rem 0.9rem repeat-x;
}

.rcpt p, .rcpt h1, .rcpt dl, .rcpt dd { margin: 0; }
.rcpt svg { display: block; }

.rcpt__brand { display: flex; align-items: center; justify-content: space-between; }
.rcpt__brand img { width: 6.5rem; height: auto; filter: brightness(0.15); }
.rcpt__brand span { color: var(--muted); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; }

.rcpt__status { margin-top: 2rem; text-align: center; }

.rcpt__icon {
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  margin: 0 auto;
  border-radius: 999px;
  background: rgba(23, 21, 26, 0.06);
  color: var(--muted);
}

.rcpt__icon svg { width: 1.5rem; height: 1.5rem; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.rcpt.is-ok .rcpt__icon { background: var(--ok); color: #fff; }
.rcpt.is-warn .rcpt__icon { background: rgba(180, 84, 31, 0.12); color: var(--warn); }
.rcpt.is-refund .rcpt__icon { background: rgba(23, 21, 26, 0.08); color: var(--ink); }

.is-spin { animation: rcpt-spin 1s linear infinite; }
@keyframes rcpt-spin { to { transform: rotate(360deg); } }

.rcpt__title { margin-top: 1rem; font-size: 1.125rem; font-weight: 650; letter-spacing: -0.01em; }

.rcpt__amount {
  margin-top: 0.35rem;
  font-size: clamp(2.6rem, 11vw, 3.4rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.rcpt__amount.is-struck { color: var(--muted); text-decoration: line-through; text-decoration-thickness: 3px; }
.rcpt__line { max-width: 22rem; margin: 0.6rem auto 0; color: var(--muted); font-size: 0.9375rem; line-height: 1.5; }

.rcpt__details { margin-top: 1.75rem; border-top: 1px dashed var(--hair); }
.rcpt__details > div { display: flex; justify-content: space-between; gap: 1.5rem; padding: 0.8rem 0; border-bottom: 1px solid var(--hair); font-size: 0.9375rem; }
.rcpt__details dt { flex: none; color: var(--muted); }
.rcpt__details dd { font-weight: 550; text-align: right; overflow-wrap: anywhere; }
.rcpt__mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.875rem; letter-spacing: 0.04em; }

.rcpt__pill { display: inline-block; padding: 0.15rem 0.6rem; border-radius: 999px; background: rgba(23, 21, 26, 0.07); font-size: 0.8125rem; font-weight: 600; }
.rcpt.is-ok .rcpt__pill { background: rgba(31, 138, 91, 0.12); color: var(--ok); }
.rcpt.is-warn .rcpt__pill { background: rgba(180, 84, 31, 0.12); color: var(--warn); }

.rcpt__note { margin-top: 1.1rem; color: var(--muted); font-size: 0.875rem; line-height: 1.5; text-align: center; }

.rcpt__actions { display: grid; gap: 0.6rem; margin-top: 1.75rem; }
.rcpt__actions--single { margin-top: 1.25rem; }

.rcpt-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3rem;
  padding: 0 1.2rem;
  border: 1px solid var(--hair);
  border-radius: 0.8rem;
  background: transparent;
  color: var(--ink);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.rcpt-btn:hover { background: rgba(23, 21, 26, 0.05); }
.rcpt-btn:focus-visible { outline: 2px solid #8b6cff; outline-offset: 2px; }
.rcpt-btn--primary { border-color: var(--ink); background: var(--ink); color: var(--paper); }
.rcpt-btn--primary:hover { background: #2a2730; }
.rcpt-btn svg { width: 1.1rem; height: 1.1rem; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

.rcpt__foot { margin-top: 1.5rem; padding-top: 1.1rem; border-top: 1px dashed var(--hair); color: var(--muted); font-size: 0.75rem; line-height: 1.55; text-align: center; }

.rcpt__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

.rcpt__skeleton { display: grid; justify-items: center; gap: 0.9rem; padding: 1.5rem 0; }
.sk { display: block; border-radius: 0.5rem; background: linear-gradient(90deg, rgba(23,21,26,0.06), rgba(23,21,26,0.12), rgba(23,21,26,0.06)); background-size: 200% 100%; animation: rcpt-shimmer 1.4s ease infinite; }
.sk--icon { width: 3rem; height: 3rem; border-radius: 999px; }
.sk--title { width: 10rem; height: 1rem; }
.sk--amount { width: 8rem; height: 2.6rem; }
.sk--line { width: 100%; height: 0.9rem; }
@keyframes rcpt-shimmer { to { background-position: -200% 0; } }

@media (min-width: 640px) {
  .rcpt { padding: 2.5rem 2.5rem 2rem; }
  .rcpt__actions { grid-template-columns: 1fr 1fr; }
  .rcpt__actions > :last-child:nth-child(odd) { grid-column: 1 / -1; }
}

@media (prefers-reduced-motion: reduce) {
  .is-spin, .sk { animation: none; }
}
</style>

<style>
/* Print: just the receipt, black on white, no site chrome */
@media print {
  body * { visibility: hidden !important; }
  .rcpt, .rcpt * { visibility: visible !important; }
  .rcpt { position: absolute; inset: 0 0 auto 0; margin: 0 auto; max-width: 32rem; box-shadow: none !important; background: #fff !important; color: #000 !important; }
  .rcpt::after, .rcpt .no-print { display: none !important; }
  .rcpt .rcpt__brand img { filter: brightness(0) !important; }
  .rcpt-page { background: #fff !important; padding: 0 !important; }
}
</style>
