<template>
  <div class="support-module" :class="[compact ? 'mt-0' : 'mt-10', { 'support-module--editorial': isEditorial, 'support-module--hq': isHqDemo }]">
    <!-- Header (outside card on live pages; inside card on HQ demo) -->
    <div v-if="!isHqDemo" :class="compact ? 'mb-4' : 'mb-6'">
      <div class="flex items-center gap-3">
        <div class="h-7 w-0.5 rounded-full support-rail" />
        <h2 class="font-bold text-white tracking-tight" :class="compact ? 'text-lg' : 'text-xl'">
          Support {{ bandName }}
        </h2>
      </div>
      <p v-if="showIntroCopy" class="mt-2 pl-3.5 text-sm text-white/45">
        Tips, merch, and show payments go directly to the artist.
      </p>
      <p v-if="demo && demoNotice" class="mt-2 pl-3.5 text-xs" :class="isEditorial ? 'text-[#9AA6B5]' : 'text-emerald-300/80'">
        {{ demoNotice }}
      </p>
    </div>

    <!-- Payment Cards: each enabled button renders as its own premium card.
         HQ demo is inline page function — no framed card. -->
    <div v-if="hasPaymentButtons" :class="isHqDemo ? '' : 'space-y-4'">
      <div
        v-for="btn in orderedButtons"
        :key="btn.key"
        :class="isHqDemo
          ? 'support-inline'
          : [
            'support-card relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c10] shadow-[0_12px_40px_-20px_rgba(0,0,0,0.85)]',
            compact ? 'p-4' : 'p-5 sm:p-6',
          ]"
      >
        <!-- Restrained top accent — brand as a whisper, not a wash -->
        <div
          v-if="!isHqDemo"
          class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-400/40 to-transparent"
          aria-hidden="true"
        />

        <div class="relative">
          <div v-if="isHqDemo" class="mb-3">
            <h2 class="text-[1.05rem] font-bold tracking-tight text-white">
              Support {{ bandName }}
            </h2>
          </div>
          <!-- Card header -->
          <div v-if="showCardChrome" class="mb-5 flex items-start gap-3.5">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]"
              :class="`support-icon support-icon--${cardConfig(btn).type}`"
              aria-hidden="true"
            >
              <!-- Support -->
              <svg v-if="cardConfig(btn).type === 'support'" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
              <!-- Merch -->
              <svg v-else-if="cardConfig(btn).type === 'merch'" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <!-- Entry -->
              <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
              </svg>
            </div>
            <div class="min-w-0 pt-0.5">
              <h3 class="text-[15px] font-semibold text-white">{{ cardConfig(btn).title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-white/45">{{ cardConfig(btn).description }}</p>
            </div>
          </div>

          <!-- Support card: single Quick Support row (amounts + Custom), no duplicate selector -->
          <div v-if="cardConfig(btn).type === 'support'" :class="isHqDemo ? 'mb-3' : 'mb-5'">
            <div v-if="!isHqDemo" class="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Quick Support</div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="amount in quickTipAmounts"
                :key="amount"
                type="button"
                @click="selectQuickTip(btn.key, amount)"
                :disabled="isProcessing"
                class="amount-chip rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
                :class="[
                  isHqDemo ? 'py-3' : 'py-2.5',
                  isAmountSelected(btn.key, amount) ? 'amount-chip--selected' : 'amount-chip--idle',
                ]"
              >
                ${{ amount }}
              </button>
              <button
                type="button"
                @click="toggleCustomAmount(btn.key)"
                :disabled="isProcessing"
                class="amount-chip rounded-xl text-sm font-semibold transition-colors duration-150 disabled:opacity-50"
                :class="[
                  isHqDemo ? 'py-3' : 'py-2.5',
                  customAmountActive[btn.key] ? 'amount-chip--selected' : 'amount-chip--idle',
                ]"
              >
                Custom
              </button>
            </div>
            <!-- Custom amount input -->
            <div v-if="customAmountActive[btn.key]" class="mt-3 flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-black/50 transition-colors" :class="isEditorial ? 'support-field' : 'focus-within:border-purple-400/45'">
              <span class="flex items-center border-r border-white/10 bg-white/[0.03] px-3.5 text-lg font-medium text-white/50 select-none">$</span>
              <input
                v-model.number="paymentAmounts[btn.key]"
                type="number"
                step="1"
                min="1"
                placeholder="Enter amount"
                class="support-input min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>

          <!-- Merch / Entry Pricing Mode: Min Amount -->
          <div v-else-if="btn.pricingMode === 'min'" class="mb-5">
            <div class="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">
              {{ minAmountLabel(btn) }}
            </div>
            <div class="flex w-full items-stretch overflow-hidden rounded-xl border border-white/10 bg-black/50 transition-colors" :class="isEditorial ? 'support-field' : 'focus-within:border-purple-400/45'">
              <span class="flex items-center border-r border-white/10 bg-white/[0.03] px-3.5 text-lg font-medium text-white/50 select-none">$</span>
              <input
                v-model.number="paymentAmounts[btn.key]"
                type="number"
                step="1"
                min="0"
                inputmode="decimal"
                :placeholder="minPlaceholder(btn)"
                class="support-input min-w-0 flex-1 bg-transparent px-3 py-3 text-base text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
            <p v-if="cardConfig(btn).type === 'merch'" class="mt-2 text-xs text-white/35">
              Ask the band for your total, then enter it here.
            </p>
            <p v-else-if="btn.minAmount" class="mt-2 text-xs text-white/35">
              Minimum ${{ btn.minAmount }}
            </p>
          </div>

          <!-- Pricing Mode: Presets -->
          <div v-else-if="btn.pricingMode === 'presets'" class="mb-5">
            <div class="mb-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Select an amount</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="amt in (btn.presetAmounts || [])"
                :key="amt"
                type="button"
                @click="selectPresetAmount(btn.key, Number(amt))"
                class="amount-chip px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150"
                :class="(!customAmountActive[btn.key] && Number(paymentAmounts[btn.key]) === Number(amt))
                  ? 'amount-chip--selected'
                  : 'amount-chip--idle'"
              >
                ${{ amt }}
              </button>
              <button
                type="button"
                @click="toggleCustomAmount(btn.key)"
                class="amount-chip px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-150"
                :class="customAmountActive[btn.key] ? 'amount-chip--selected' : 'amount-chip--idle'"
              >
                + Custom
              </button>
            </div>
            <!-- Custom amount input -->
            <div v-if="customAmountActive[btn.key]" class="mt-3 flex items-stretch overflow-hidden rounded-xl border border-white/10 bg-black/50 transition-colors" :class="isEditorial ? 'support-field' : 'focus-within:border-purple-400/45'">
              <span class="flex items-center border-r border-white/10 bg-white/[0.03] px-3.5 text-lg font-medium text-white/50 select-none">$</span>
              <input
                v-model.number="paymentAmounts[btn.key]"
                type="number"
                step="1"
                min="1"
                :placeholder="cardConfig(btn).type === 'merch' ? 'Enter total' : 'Enter amount'"
                class="support-input min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-white placeholder:text-white/30 focus:outline-none"
              />
            </div>
          </div>

          <!-- Pricing Mode: Fixed -->
          <div v-else-if="btn.pricingMode === 'fixed'" class="mb-5">
            <div class="mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-white/35">Price</div>
            <div class="text-2xl font-bold text-white">${{ btn.fixedAmount }}</div>
          </div>

          <!-- Checkout Button -->
          <button
            type="button"
            @click="handleCheckout(btn)"
            :disabled="isProcessing"
            class="support-cta w-full rounded-xl px-4 text-sm font-semibold text-white transition disabled:opacity-50"
            :class="isHqDemo ? 'py-3' : 'py-3.5'"
          >
            <span v-if="processingKey === btn.key">Opening secure checkout…</span>
            <span v-else>{{ cardConfig(btn).buttonText }}</span>
          </button>
          <p v-if="checkoutError && checkoutErrorKey === btn.key" class="support-error" role="alert">{{ checkoutError }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  bandName: {
    type: String,
    default: 'the band'
  },
  paymentButtons: {
    type: Array,
    default: () => []
  },
  pageMode: {
    type: String,
    default: 'QUIET'
  },
  showQuickTips: {
    type: Boolean,
    default: true
  },
  quickTipAmounts: {
    type: Array,
    default: () => [5, 10, 20]
  },
  /** Tighter spacing for homepage / phone frames */
  compact: {
    type: Boolean,
    default: false
  },
  /**
   * Demo mode: never starts real Stripe checkout.
   * Safe for homepage marketing phone.
   */
  demo: {
    type: Boolean,
    default: false
  },
  /**
   * `editorial` — homepage HQ demo: dark CTAs, spectrum edge, no purple fill.
   * Production artist pages leave this unset.
   */
  tone: {
    type: String,
    default: 'product',
  },
  /**
   * Limit which payment card types render.
   * Homepage HQ lite passes `['support']`. Live pages omit this.
   */
  includeTypes: {
    type: Array,
    default: null,
  },
})

const isEditorial = computed(() => props.tone === 'editorial')
const isHqDemo = computed(() => isEditorial.value && !!props.compact)
const showIntroCopy = computed(() => !isHqDemo.value)
const showCardChrome = computed(() => !isHqDemo.value)

const emit = defineEmits(['quick-tip', 'checkout', 'demo-action'])

const isProcessing = ref(false)
const processingKey = ref(null)
const checkoutError = ref('')
const checkoutErrorKey = ref(null)

// The page reports a failed checkout start (bad amount, network, server) so the
// button unlocks and the reason shows here, next to the card the fan used.
function onCheckoutFailed(e) {
  const key = e?.detail?.key ?? null
  if (processingKey.value && key && key !== processingKey.value) return
  checkoutError.value = e?.detail?.message || 'Checkout could not start. Please try again.'
  checkoutErrorKey.value = key || processingKey.value
  isProcessing.value = false
  processingKey.value = null
}

// Coming back from Stripe with the browser's Back button restores this page
// from cache with the button still locked; unlock it.
function onPageShow(e) {
  if (e?.persisted) {
    isProcessing.value = false
    processingKey.value = null
  }
}

onMounted(() => {
  window.addEventListener('faneqo:checkout-failed', onCheckoutFailed)
  window.addEventListener('pageshow', onPageShow)
})

onBeforeUnmount(() => {
  window.removeEventListener('faneqo:checkout-failed', onCheckoutFailed)
  window.removeEventListener('pageshow', onPageShow)
})
const demoNotice = ref('')
const paymentAmounts = reactive({})
const customAmountActive = reactive({})

// Per-key presentation (fallback copy, button text, layout type)
function cardConfig(btn) {
  const key = btn?.key
  if (key === 'merch_table') {
    return {
      type: 'merch',
      title: 'Merch Table Payment',
      description: 'Buying merch at the show? Enter your total and pay securely.',
      buttonText: 'Pay merch total'
    }
  }
  if (key === 'pay_entry') {
    return {
      type: 'entry',
      title: 'Pay Entry',
      description: "Door entry for tonight's show.",
      buttonText: 'Pay entry'
    }
  }
  // support / tips / default
  return {
    type: 'support',
    title: btn.title || 'Support the Band',
    description: btn.description || 'Help fuel the music. Every bit counts.',
    buttonText: 'Support band'
  }
}

// Display ordering only (does not mutate the stored array): Support, Merch, Entry
const orderedButtons = computed(() => {
  const rank = { support: 0, merch: 1, entry: 2 }
  let list = [...props.paymentButtons]
  if (props.includeTypes?.length) {
    const allowed = new Set(props.includeTypes)
    list = list.filter((btn) => allowed.has(cardConfig(btn).type))
  }
  return list.sort((a, b) => {
    const ra = rank[cardConfig(a).type] ?? 99
    const rb = rank[cardConfig(b).type] ?? 99
    return ra - rb
  })
})

const hasPaymentButtons = computed(() => orderedButtons.value.length > 0)

function minAmountLabel(btn) {
  const type = cardConfig(btn).type
  if (type === 'merch') return 'Amount'
  return 'Enter an amount'
}

function minPlaceholder(btn) {
  return cardConfig(btn).type === 'merch' ? 'Enter total' : ''
}

function isAmountSelected(key, amount) {
  return !customAmountActive[key] && Number(paymentAmounts[key]) === Number(amount)
}

// Initialize payment amounts from button defaults
watch(() => props.paymentButtons, (buttons) => {
  buttons.forEach(btn => {
    if (btn.pricingMode === 'fixed') {
      paymentAmounts[btn.key] = btn.fixedAmount
    } else if (btn.pricingMode === 'presets' && btn.presetAmounts?.length) {
      paymentAmounts[btn.key] = btn.presetAmounts[0]
    } else if (btn.pricingMode === 'min') {
      paymentAmounts[btn.key] = btn.minAmount || 5
    }
  })
}, { immediate: true })

// Quick tip selects the amount for the support button (checkout via the card's button)
function selectQuickTip(key, amount) {
  customAmountActive[key] = false
  paymentAmounts[key] = amount
}

function handleCheckout(btn) {
  if (!btn) return

  const amount = paymentAmounts[btn.key]

  // Homepage / marketing: never create a real checkout session
  if (props.demo) {
    demoNotice.value = 'Demo only — checkout is disabled on the homepage.'
    emit('demo-action', { button: btn, amount })
    return
  }

  if (isProcessing.value) return
  checkoutError.value = ''
  isProcessing.value = true
  processingKey.value = btn.key || null

  emit('checkout', { button: btn, amount })
}

function selectPresetAmount(key, amount) {
  customAmountActive[key] = false
  paymentAmounts[key] = amount
}

function toggleCustomAmount(key) {
  customAmountActive[key] = !customAmountActive[key]
  if (customAmountActive[key]) {
    // Clear the amount so user can enter fresh
    paymentAmounts[key] = null
  }
}
</script>

<style scoped>
.support-module input[type="number"]::-webkit-inner-spin-button,
.support-module input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.support-card {
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.025) 0%, transparent 40%);
}

.amount-chip--idle {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.78);
}

.amount-chip--idle:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.07);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.amount-chip--selected {
  background: rgba(139, 108, 255, 0.16);
  border: 1px solid rgba(196, 181, 253, 0.48);
  color: var(--faneqo-text, #f7f9fc);
  box-shadow: none;
}

.support-cta {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--faneqo-surface, #111722);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
  color: var(--faneqo-text, #f7f9fc);
}

.support-cta::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: var(--faneqo-brand-edge, linear-gradient(90deg, #ff4fd8, #8b6cff));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.42;
  pointer-events: none;
}

.support-cta:hover:not(:disabled) {
  background: #161822;
}

.support-rail {
  background: linear-gradient(180deg, var(--faneqo-brand-pink, #ff4fd8), var(--faneqo-brand-violet, #8b6cff));
}

.support-icon--support {
  color: var(--faneqo-brand-pink, #ff4fd8);
}

.support-icon--merch {
  color: var(--faneqo-brand-violet, #8b6cff);
}

.support-icon--entry {
  color: var(--faneqo-muted, #9aa6b5);
}

.support-module--editorial .support-field:focus-within {
  border-color: rgba(196, 181, 253, 0.45);
}

.support-module--editorial .amount-chip--selected {
  background: rgba(139, 108, 255, 0.16);
  border: 1px solid rgba(196, 181, 253, 0.45);
  color: var(--faneqo-text, #f7f9fc);
  box-shadow: none;
}

.support-module--editorial .support-cta {
  background: var(--faneqo-surface, #111722);
}

.support-module--editorial .support-cta:hover:not(:disabled) {
  transform: translateY(-1px);
}

.support-module--editorial .support-cta:hover:not(:disabled)::before {
  opacity: 0.55;
}

.support-module--hq .support-inline {
  background: transparent;
  border: 0;
  box-shadow: none;
}

.support-module--hq .amount-chip--idle {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(247, 249, 252, 0.82);
}

.support-module--hq .amount-chip--selected {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: #f7f9fc;
}

.support-module--hq .support-cta {
  min-height: 2.85rem;
  background: var(--faneqo-surface, #111722);
  border: 1px solid rgba(255, 255, 255, 0.12);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-transform: none;
}

.support-module--hq .support-cta::before {
  display: none;
}

.support-module--editorial .support-cta:active:not(:disabled) {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  .support-module--editorial .support-cta:hover:not(:disabled) {
    transform: none;
  }
}

.support-error {
  margin-top: 0.6rem;
  color: #fca5a5;
  font-size: 0.8125rem;
  line-height: 1.45;
}
</style>
