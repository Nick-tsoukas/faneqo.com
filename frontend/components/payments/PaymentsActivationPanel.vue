<template>
  <div class="fq-act" data-testid="payments-activation">
    <p
      v-if="notice"
      class="fq-act__notice"
      :class="`fq-act__notice--${notice.tone}`"
      role="status"
      data-testid="payments-activation-notice"
    >
      <span class="fq-act__notice-dot" aria-hidden="true"></span>
      <span class="fq-act__notice-text">{{ notice.text }}</span>
      <button
        v-if="notice.action && notice.url"
        type="button"
        class="fq-act__notice-action"
        @click="emit('open-url', notice.url)"
      >
        {{ notice.action }}
      </button>
    </p>

    <Transition name="fq-act-swap" mode="out-in">
      <!-- Trial kept: one quiet line, nothing changes in billing -->
      <div v-if="view.kind === 'collapsed'" :key="'collapsed'" class="fq-act__collapsed" data-state="collapsed">
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
        <p class="fq-act__collapsed-text">
          {{ view.title }} <span class="fq-act__muted">· {{ view.body }}</span>
        </p>
        <button ref="primaryEl" type="button" class="fq-act__text-btn" :disabled="!!busy || chargeBlocked" @click="act(view.primaryAction)">
          {{ view.primary }}
        </button>
        <p v-if="shownDisclosure" class="fq-act__fine fq-act__fine--inline" data-testid="payments-activation-disclosure">{{ shownDisclosure }}</p>
        <BillingConsent v-if="showConsent" v-model="agreed" class="fq-act__consent" :terms="consentTerms" :notice="consentNotice" :disabled="!!busy" />
      </div>

      <!-- Payments live: today's controls stay below; this is the one status line -->
      <div v-else-if="view.kind === 'live'" :key="'live'" class="fq-act__live" data-state="live">
        <div class="fq-act__live-copy">
          <p class="fq-act__live-title"><span class="fq-act__live-dot" aria-hidden="true"></span>{{ view.title }}</p>
          <p class="fq-act__live-body">{{ view.body }}</p>
          <p v-if="view.liveNote" class="fq-act__live-body">{{ view.liveNote }}</p>
          <p v-if="shownDisclosure" class="fq-act__fine fq-act__fine--inline" data-testid="payments-activation-disclosure">{{ shownDisclosure }}</p>
          <BillingConsent v-if="showConsent" v-model="agreed" class="fq-act__consent" :terms="consentTerms" :notice="consentNotice" :disabled="!!busy" />
        </div>
        <div class="fq-act__live-actions">
          <button v-if="view.primary" ref="primaryEl" type="button" class="fq-act__text-btn" :disabled="!!busy || chargeBlocked" @click="act(view.primaryAction)">
            {{ view.primary }}
          </button>
          <button type="button" class="fq-act__link" @click="act('view_payments')">
            View payments
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>

      <!-- Restricted or on hold: no offer, no rule names -->
      <div v-else-if="view.kind === 'restricted'" :key="'restricted-' + view.title" class="fq-act__panel fq-act__restricted" data-state="restricted">
        <span class="fq-act__shield" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 9.5C8 19.3 5 15.5 5 11V6l7-3z" /><path d="M12 9v4M12 16h.01" /></svg>
        </span>
        <div class="fq-act__copy">
          <h3 class="fq-act__title fq-act__title--sm">{{ view.title }}</h3>
          <p class="fq-act__body">{{ view.body }}</p>
        </div>
        <button v-if="view.quiet" type="button" class="fq-act__quiet" @click="act(view.quietAction)">{{ view.quiet }}</button>
      </div>

      <!-- Start Pro → payouts → verification: one frame, one progress line -->
      <div v-else :key="'panel-' + view.title + view.step" class="fq-act__panel" :data-state="state">
        <div class="fq-act__top">
          <p class="fq-act__eyebrow">
            <svg v-if="view.eyebrowCheck" aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" class="fq-act__check"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {{ view.eyebrow }}
          </p>
          <ol v-if="view.step !== null" class="fq-act__steps" aria-label="Steps to accept payments">
            <li v-for="(label, i) in stepLabels" :key="label" class="fq-act__step" :class="stepClass(i)">
              <span class="fq-act__bar" aria-hidden="true"></span>
              <span class="fq-act__step-label">{{ label }}<span class="sr-only">{{ stepSr(i) }}</span></span>
            </li>
          </ol>
        </div>

        <div class="fq-act__grid">
          <div class="fq-act__copy">
            <h3 class="fq-act__title">{{ view.title }}</h3>
            <p class="fq-act__body">{{ view.body }}</p>
            <p v-if="view.status" class="fq-act__status" role="status">
              <span class="fq-act__status-dot" aria-hidden="true"></span>{{ view.status }}
            </p>
          </div>

          <div class="fq-act__preview" role="img" :aria-label="previewLabel">
            <div class="fq-act__preview-head">
              <span class="fq-act__muted">Your artist page</span>
              <span class="fq-act__badge" :class="{ 'fq-act__badge--progress': view.badgeTone === 'progress' }">{{ view.badge }}</span>
            </div>
            <div class="fq-act__artist">
              <img v-if="artistImage && !imageFailed" :src="artistImage" alt="" class="fq-act__avatar" @error="imageFailed = true" />
              <span v-else class="fq-act__avatar fq-act__avatar--initials">{{ initials }}</span>
              <div class="fq-act__artist-text">
                <p class="fq-act__artist-name">{{ displayName }}</p>
                <p class="fq-act__muted">Support the Band</p>
              </div>
            </div>
            <div class="fq-act__chips">
              <span>$5</span><span class="is-selected">$10</span><span>$20</span>
            </div>
            <span class="fq-act__pay">
              <svg v-if="view.previewLock" aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></svg>
              Pay $10
            </span>
          </div>

          <div class="fq-act__actions">
            <button
              v-if="view.primary"
              ref="primaryEl"
              type="button"
              class="fq-act__primary"
              :class="{ 'is-flash': flash }"
              :disabled="!!busy || chargeBlocked"
              :aria-busy="busy === view.primaryAction ? 'true' : 'false'"
              data-testid="payments-activation-primary"
              @click="act(view.primaryAction)"
            >
              <span v-if="busy === view.primaryAction" class="fq-act__spin" aria-hidden="true"></span>
              {{ busy === view.primaryAction ? busyLabel : view.primary }}
            </button>
            <button v-if="view.quiet" type="button" class="fq-act__quiet" :disabled="!!busy" @click="act(view.quietAction)">
              <span v-if="busy === view.quietAction" class="fq-act__spin fq-act__spin--light" aria-hidden="true"></span>
              {{ view.quiet }}
            </button>
            <button v-if="view.secondary" type="button" class="fq-act__secondary" :disabled="!!busy" @click="act(view.secondaryAction)">
              {{ view.secondary }}
            </button>
          </div>
        </div>

        <p v-if="error" class="fq-act__error" role="alert">{{ error }}</p>
        <p v-if="shownDisclosure" class="fq-act__fine" data-testid="payments-activation-disclosure">{{ shownDisclosure }}</p>
        <BillingConsent v-if="showConsent" v-model="agreed" class="fq-act__consent" :terms="consentTerms" :notice="consentNotice" :disabled="!!busy" />
        <p v-if="view.foot" class="fq-act__fine" :class="{ 'fq-act__fine--follow': shownDisclosure && !showConsent }">{{ view.foot }}</p>
      </div>
    </Transition>

    <p v-if="error && view.kind !== 'panel'" class="fq-act__error" role="alert">{{ error }}</p>
  </div>
</template>

<script setup>
/**
 * The Support section's Payments panel (approved design, November 2026).
 * Renders a view from utils/payments/paymentActivation.js and emits the
 * action names; the editor decides what each one does (save first, Stripe...).
 */
import { computed, nextTick, ref, watch } from 'vue'
import { artistInitials, FEE_AND_APPROVAL } from '~/utils/payments/paymentActivation'
import BillingConsent from '~/components/billing/BillingConsent.vue'
import { consentPayload, termsIdentity } from '~/composables/useBillingConsent'

const props = defineProps({
  view: { type: Object, required: true },
  state: { type: String, default: '' },
  artistName: { type: String, default: '' },
  artistImage: { type: String, default: '' },
  busy: { type: String, default: null },
  error: { type: String, default: '' },
  notice: { type: Object, default: null },
  // Billing A: the SERVER's terms for this charge (GET /stripe/start-pro/terms), or null while loading.
  consentTerms: { type: Object, default: null },
  consentNotice: { type: String, default: '' },
})
const emit = defineEmits(['action', 'open-url'])

// Billing A: a charging action needs the server's terms on screen and an unticked box ticked.
const CHARGING = new Set(['start_pro', 'update_payment'])
// Acceptance is bound to the exact terms shown (version, key, action): new terms read as unticked.
const agreedFor = ref(null)
const agreed = computed({
  get: () => agreedFor.value !== null && agreedFor.value === termsIdentity(props.consentTerms),
  set: (on) => { agreedFor.value = on === true ? termsIdentity(props.consentTerms) : null },
})
const isCharging = computed(() => CHARGING.has(props.view.primaryAction))
const showConsent = computed(() => isCharging.value && Boolean(props.consentTerms?.consentRequired))
const chargeBlocked = computed(() => isCharging.value && (!props.consentTerms || (props.consentTerms.consentRequired && !agreed.value)))
// With the server's terms on screen they replace the client-built price line (they're what's recorded);
// the fee/approval sentence still shows for Start Pro.
const shownDisclosure = computed(() => {
  if (!showConsent.value) return props.view.disclosure
  return props.view.disclosure && props.view.disclosure.includes(FEE_AND_APPROVAL) ? FEE_AND_APPROVAL : null
})
// New terms (e.g. the price changed) must be read and ticked again.
// Any change of the terms object also clears the stored agreement.
watch(() => termsIdentity(props.consentTerms), () => { agreedFor.value = null })

const primaryEl = ref(null)
const flash = ref(false)
const imageFailed = ref(false)
watch(() => props.artistImage, () => { imageFailed.value = false })

const stepLabels = computed(() => [props.view.firstLabel || 'Pro', 'Payouts', 'Live'])
const displayName = computed(() => props.artistName?.trim() || 'Your artist name')
const initials = computed(() => artistInitials(props.artistName))
const previewLabel = computed(() => `Preview of the payment card fans see on ${displayName.value}'s page: ${props.view.badge}`)
const busyLabel = computed(() => {
  const a = props.busy
  if (a === 'start_pro' || a === 'update_payment') return 'Opening secure checkout…'
  if (a === 'setup_payouts') return 'Opening Stripe…'
  return 'Working…'
})

function stepClass(i) {
  const s = props.view.step
  return { 'is-done': i < s, 'is-current': i === s }
}
function stepSr(i) {
  const s = props.view.step
  return i < s ? ' (done)' : i === s ? ' (current step)' : ''
}
function act(name) {
  if (!name || props.busy) return
  if (CHARGING.has(name)) {
    if (chargeBlocked.value) return
    emit('action', name, { consent: consentPayload(props.consentTerms, agreed.value) })
    return
  }
  emit('action', name)
}

/** Bring the artist to the one action that unlocks payments (a locked toggle was tapped). */
async function focusPrimary() {
  await nextTick()
  const el = primaryEl.value
  if (!el) return
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  el.focus({ preventScroll: true })
  flash.value = false
  await nextTick()
  flash.value = true
  setTimeout(() => { flash.value = false }, 1500)
}
defineExpose({ focusPrimary })
</script>

<style scoped>
.fq-act {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-family: Poppins, system-ui, sans-serif;
  color: #F5F5F6;
}
.fq-act__muted { color: rgba(245, 245, 246, 0.58); font-size: 13px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* Notices returning from Stripe */
.fq-act__notice { margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 8px 10px; padding: 12px 14px; border-radius: 12px; font-size: 14px; font-weight: 500; line-height: 1.45; }
.fq-act__notice-dot { flex: none; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.fq-act__notice-text { flex: 1 1 220px; }
.fq-act__notice--success { color: #45E3AE; background: rgba(69, 227, 174, 0.08); }
.fq-act__notice--info { color: #39D5FF; background: rgba(57, 213, 255, 0.08); }
.fq-act__notice--error { color: #fca5a5; background: rgba(252, 165, 165, 0.08); }
.fq-act__notice--neutral { color: rgba(245, 245, 246, 0.86); background: rgba(255, 255, 255, 0.04); }
.fq-act__notice-action { min-height: 40px; padding: 0 14px; border-radius: 10px; border: 0; background: #F5F5F6; color: #07080A; font: 600 14px/1 Poppins, system-ui, sans-serif; cursor: pointer; }

/* The panel frame shared by Start Pro, payouts and verification */
.fq-act__panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding: 32px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.11);
  background: linear-gradient(180deg, #16171D 0%, #111217 55%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.fq-act__top { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.fq-act__eyebrow { margin: 0; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(245, 245, 246, 0.72); }
.fq-act__check { color: #45E3AE; flex: none; }
.fq-act__steps { list-style: none; margin: 0; padding: 0; display: flex; gap: 10px; width: 260px; flex: none; }
.fq-act__step { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.fq-act__bar { display: block; height: 3px; border-radius: 3px; background: rgba(255, 255, 255, 0.12); transition: background-color 0.3s ease; }
.fq-act__step.is-done .fq-act__bar { background: #45E3AE; }
.fq-act__step.is-current .fq-act__bar { background: #F5F5F6; }
.fq-act__step-label { position: relative; font-size: 13px; font-weight: 500; color: rgba(245, 245, 246, 0.5); }
.fq-act__step.is-done .fq-act__step-label { color: rgba(245, 245, 246, 0.72); }
.fq-act__step.is-current .fq-act__step-label { color: #F5F5F6; font-weight: 600; }

.fq-act__grid { display: grid; grid-template-columns: minmax(0, 1fr) 236px; grid-template-areas: "copy preview" "actions preview"; column-gap: 40px; row-gap: 28px; align-items: start; }
.fq-act__copy { grid-area: copy; display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.fq-act__title { margin: 0; font-size: 38px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.08; color: #F5F5F6; text-wrap: balance; }
.fq-act__title--sm { font-size: 28px; line-height: 1.15; letter-spacing: -0.02em; }
.fq-act__body { margin: 0; font-size: 17px; line-height: 1.6; color: rgba(245, 245, 246, 0.72); max-width: 420px; }
.fq-act__status { margin: 4px 0 0; display: flex; align-items: center; gap: 10px; font-size: 15px; color: rgba(245, 245, 246, 0.86); }
.fq-act__status-dot { width: 8px; height: 8px; border-radius: 50%; background: #39D5FF; box-shadow: 0 0 0 4px rgba(57, 213, 255, 0.14); animation: fq-act-pulse 1.8s ease-in-out infinite; }

/* Fan preview: what the artist is unlocking */
.fq-act__preview { grid-area: preview; box-sizing: border-box; display: flex; flex-direction: column; gap: 14px; padding: 18px; border-radius: 14px; background: #0B0C10; border: 1px solid rgba(255, 255, 255, 0.08); }
.fq-act__preview-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.fq-act__preview-head .fq-act__muted { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fq-act__badge { flex: none; white-space: nowrap; font-size: 13px; font-weight: 600; padding: 4px 10px; border-radius: 999px; color: rgba(245, 245, 246, 0.72); background: rgba(255, 255, 255, 0.07); transition: color 0.3s ease, background-color 0.3s ease; }
.fq-act__badge--progress { color: #39D5FF; background: rgba(57, 213, 255, 0.1); }
.fq-act__artist { display: flex; align-items: center; gap: 12px; min-width: 0; }
.fq-act__avatar { width: 40px; height: 40px; flex: none; border-radius: 50%; object-fit: cover; background: #1C1D24; }
.fq-act__avatar--initials { display: inline-flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: rgba(245, 245, 246, 0.86); }
.fq-act__artist-text { min-width: 0; }
.fq-act__artist-name { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fq-act__artist-text .fq-act__muted { margin: 0; }
.fq-act__chips { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.fq-act__chips span { height: 40px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; font-size: 15px; font-weight: 500; color: rgba(245, 245, 246, 0.72); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12); }
.fq-act__chips span.is-selected { color: #F5F5F6; font-weight: 600; box-shadow: inset 0 0 0 1.5px rgba(245, 245, 246, 0.86); }
.fq-act__pay { height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 600; color: rgba(245, 245, 246, 0.72); background: rgba(255, 255, 255, 0.07); }

/* Actions: one near-white primary, quiet secondaries */
.fq-act__actions { grid-area: actions; display: flex; flex-wrap: wrap; align-items: center; gap: 12px 24px; }
.fq-act__primary, .fq-act__quiet { box-sizing: border-box; display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 52px; padding: 0 24px; border-radius: 12px; font: 600 16px/1 Poppins, system-ui, sans-serif; letter-spacing: -0.005em; cursor: pointer; transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease; }
.fq-act__primary { border: 0; background: #F5F5F6; color: #07080A; }
.fq-act__primary:hover:not(:disabled) { background: #FFFFFF; }
.fq-act__primary:active:not(:disabled) { transform: translateY(1px); }
.fq-act__primary.is-flash { animation: fq-act-flash 1.4s ease-out 1; }
.fq-act__quiet { background: #0B0C10; color: #F5F5F6; border: 1px solid rgba(255, 255, 255, 0.16); }
.fq-act__quiet:hover:not(:disabled) { background: #14161B; border-color: rgba(255, 255, 255, 0.24); }
.fq-act__secondary, .fq-act__text-btn { min-height: 48px; padding: 0 4px; border: 0; background: none; font: 500 16px/1.3 Poppins, system-ui, sans-serif; color: #F5F5F6; text-decoration: underline; text-underline-offset: 5px; text-decoration-color: rgba(245, 245, 246, 0.3); cursor: pointer; }
.fq-act__secondary:hover:not(:disabled), .fq-act__text-btn:hover:not(:disabled) { text-decoration-color: rgba(245, 245, 246, 0.8); }
.fq-act button:disabled { cursor: progress; opacity: 0.65; }
.fq-act button:focus-visible { outline: 2px solid #39D5FF; outline-offset: 3px; }
.fq-act__spin { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(7, 8, 10, 0.2); border-top-color: #07080A; box-sizing: border-box; animation: fq-act-spin 0.8s linear infinite; }
.fq-act__spin--light { border-color: rgba(245, 245, 246, 0.25); border-top-color: #F5F5F6; }

.fq-act__fine { margin: 0; padding-top: 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 14px; line-height: 1.6; color: rgba(245, 245, 246, 0.62); }
/* Billing terms inside a one-line row (collapsed, live): full width, no rule. */
.fq-act__fine--inline { flex-basis: 100%; padding-top: 6px; border-top: 0; font-size: 13px; line-height: 1.55; }
/* Billing A consent: full width in the collapsed row, separated from the price line in the panel. */
.fq-act__consent { flex-basis: 100%; }
/* A foot that follows the disclosure shares its rule. */
.fq-act__fine--follow { padding-top: 0; border-top: 0; margin-top: -18px; }
.fq-act__error { margin: 0; font-size: 14px; line-height: 1.5; color: #fca5a5; }

/* Restricted / review */
.fq-act__restricted { align-items: flex-start; gap: 20px; background: #111217; }
.fq-act__shield { width: 44px; height: 44px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.06); color: rgba(245, 245, 246, 0.86); }

/* Live */
.fq-act__live { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 20px 22px; border-radius: 14px; border: 1px solid rgba(69, 227, 174, 0.22); background: rgba(69, 227, 174, 0.05); }
.fq-act__live-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.fq-act__live-title { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 600; }
.fq-act__live-dot { width: 9px; height: 9px; border-radius: 50%; background: #45E3AE; box-shadow: 0 0 0 4px rgba(69, 227, 174, 0.14); }
.fq-act__live-body { margin: 0; font-size: 15px; line-height: 1.5; color: rgba(245, 245, 246, 0.72); }
.fq-act__live-actions { display: flex; align-items: center; gap: 8px 20px; flex-wrap: wrap; }
.fq-act__link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0; border: 0; background: none; font: 500 15px/1 Poppins, system-ui, sans-serif; color: #F5F5F6; white-space: nowrap; cursor: pointer; }

/* Kept trial */
.fq-act__collapsed { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 20px; border-radius: 14px; border: 1px solid rgba(255, 255, 255, 0.11); background: #111217; color: rgba(245, 245, 246, 0.72); }
.fq-act__collapsed-text { margin: 0; flex: 1; min-width: 0; font-size: 15px; line-height: 1.4; color: #F5F5F6; }

/* Phone width: the card itself decides, not the viewport */
@container (max-width: 560px) {
  .fq-act__panel { padding: 22px 20px; gap: 22px; }
  .fq-act__top { flex-direction: column; align-items: stretch; gap: 16px; }
  .fq-act__steps { width: 100%; }
  .fq-act__grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "copy" "preview" "actions"; row-gap: 22px; }
  .fq-act__title { font-size: 30px; }
  .fq-act__title--sm { font-size: 24px; }
  .fq-act__body { font-size: 16px; }
  .fq-act__actions { flex-direction: column; align-items: stretch; gap: 6px; }
  .fq-act__primary, .fq-act__quiet { width: 100%; }
  .fq-act__secondary { text-align: center; }
  .fq-act__live { flex-direction: column; align-items: flex-start; gap: 6px; padding: 18px 18px 8px; }
  .fq-act__collapsed { flex-wrap: wrap; padding: 12px 16px; }
}

/* Restrained motion between states */
.fq-act-swap-enter-active, .fq-act-swap-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.fq-act-swap-enter-from { opacity: 0; transform: translateY(8px); }
.fq-act-swap-leave-to { opacity: 0; }
@keyframes fq-act-spin { to { transform: rotate(360deg); } }
@keyframes fq-act-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes fq-act-flash { 0% { box-shadow: 0 0 0 0 rgba(57, 213, 255, 0); } 20% { box-shadow: 0 0 0 4px rgba(57, 213, 255, 0.45); } 100% { box-shadow: 0 0 0 12px rgba(57, 213, 255, 0); } }
@media (prefers-reduced-motion: reduce) {
  .fq-act-swap-enter-active, .fq-act-swap-leave-active { transition: none; }
  .fq-act__status-dot, .fq-act__spin { animation: none; }
  .fq-act__primary.is-flash { animation: none; box-shadow: 0 0 0 3px rgba(57, 213, 255, 0.6); }
  .fq-act__bar, .fq-act__badge, .fq-act__primary { transition: none; }
}
</style>
