<template>
  <Teleport to="body">
    <Transition name="checkin-fade" appear>
      <div v-if="isOpen" class="checkin-viewport">
        <div
          ref="dialogRef"
          class="checkin-frame"
          :class="{ 'checkin-frame--compact': isCheckedIn }"
          role="dialog"
          aria-modal="true"
          :aria-label="dialogLabel"
          tabindex="-1"
        >
          <!-- Overlay chrome. Must not own a document row. -->
          <button type="button" class="checkin-close" aria-label="Close check-in" @click="handleClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Cinematic identity sells the show. It collapses the moment attendance
               exists — after that the fan needs a confirmation, not a hero. -->
          <template v-if="!isCheckedIn">
            <div class="show-identity">
              <p class="show-status">
                <span class="show-status-dot" aria-hidden="true"></span>
                Live · Tonight
              </p>
              <h1 class="show-artist">{{ bandName || showTitle || 'Tonight’s show' }}</h1>
              <p v-if="placeLine" class="show-place">{{ placeLine }}</p>
              <p v-if="showDateLabel" class="show-date">{{ showDateLabel }}</p>
            </div>

            <figure v-if="heroPhoto.src" class="show-hero">
              <img
                :src="heroPhoto.src"
                :srcset="heroPhoto.srcset || undefined"
                :sizes="heroPhoto.sizes || undefined"
                :width="heroPhoto.width || undefined"
                :height="heroPhoto.height || undefined"
                alt=""
                class="show-hero-photo"
                :style="heroFocalStyle"
                decoding="async"
              />
              <span class="show-hero-fade" aria-hidden="true"></span>
            </figure>
          </template>

          <div class="checkin-body">
            <!-- ARRIVAL -->
            <div v-if="state === 'idle'" class="state">
              <h2 class="lede">You’re here.</h2>
              <p class="lede-sub">Check in to unlock tonight’s fan experience.</p>

              <ul class="benefit-list" aria-label="What check-in unlocks">
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7 9h10M7 13h6m8-1a9 9 0 01-9 9 9.7 9.7 0 01-4-.9L3 21l.9-4A9 9 0 1121 12z" />
                  </svg>
                  <span>Talk to the band</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 15l4-4 4 4 3-3 7 7M16.5 8.5h.01" />
                  </svg>
                  <span>Get exclusive photos &amp; updates</span>
                </li>
                <li>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 3h12a2 2 0 012 2v16l-8-4-8 4V5a2 2 0 012-2z" />
                  </svg>
                  <span>Save tonight to your Fan Passport</span>
                </li>
              </ul>

              <div class="actions">
                <button type="button" class="btn-primary" @click="handlePrimaryCTA">
                  Check in to tonight’s show
                </button>
                <p v-if="email" class="identity-line">
                  Checking in as {{ email }} ·
                  <button type="button" class="btn-inline" @click="useDifferentEmail">Use a different email</button>
                </p>
              </div>

              <p class="footnote">No spam. Just updates from the artist.</p>
            </div>

            <!-- EMAIL CAPTURE -->
            <div v-else-if="state === 'identity_needed'" class="state">
              <h2 class="lede">You’re here.</h2>
              <p class="lede-sub">Add your email to check in to tonight’s show.</p>

              <form class="checkin-form" @submit.prevent="handleSubmitEmail">
                <input
                  v-model="email"
                  type="email"
                  inputmode="email"
                  placeholder="your@email.com"
                  class="field"
                  :disabled="loading"
                  autocomplete="email"
                  @input="emailTouched = true"
                />
                <input
                  v-model="firstName"
                  type="text"
                  placeholder="First name (optional)"
                  class="field"
                  :disabled="loading"
                  autocomplete="given-name"
                />
                <button type="submit" class="btn-primary" :disabled="loading || !email">
                  <span v-if="loading" class="btn-loading">
                    <svg class="spinner-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle class="spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="spin-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Checking in…
                  </span>
                  <span v-else>Check in to tonight’s show</span>
                </button>
              </form>

              <p class="footnote">No spam. Just updates from the artist.</p>
            </div>

            <!-- SUBMITTING -->
            <div v-else-if="state === 'submitting'" class="state">
              <h2 class="lede">Checking you in…</h2>
              <p class="lede-sub">
                <svg class="spinner-sm spinner-inline" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle class="spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="spin-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Recording your attendance.
              </p>
            </div>

            <!-- CHECKED IN (fresh or already) — success flows from the top. -->
            <div v-else-if="isCheckedIn" class="state state-compact">
              <h2 class="checked-flag">
                <span class="check-dot" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                </span>
                {{ checkedInHeadline }}
              </h2>

              <div class="identity-row">
                <img
                  v-if="heroPhoto.src"
                  :src="heroPhoto.src"
                  alt=""
                  class="identity-thumb"
                  :style="heroFocalStyle"
                />
                <div class="identity-text">
                  <p class="identity-name">{{ bandName || showTitle || 'Tonight’s show' }}</p>
                  <p v-if="compactShowLine" class="identity-meta">{{ compactShowLine }}</p>
                </div>
              </div>

              <p class="passport-line">Tonight is now part of your Fan Passport.</p>

              <p v-if="queuedOffline" class="note">
                Signal is spotty in here — your check-in is saved on your phone and finishes syncing automatically.
              </p>

              <div class="actions">
                <button type="button" class="btn-primary" :disabled="!!leavingTo" @click="handleOpenTonight">
                  <span v-if="leavingTo === 'tonight'" class="btn-loading">
                    <svg class="spinner-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle class="spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="spin-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening tonight…
                  </span>
                  <span v-else>Open tonight</span>
                </button>
                <div class="next-rows">
                  <button type="button" class="btn-row" :disabled="!!leavingTo" @click="handleOpenMessages">
                    <span v-if="leavingTo === 'messages'" class="btn-loading">
                      <svg class="spinner-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle class="spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="spin-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Opening messages…
                    </span>
                    <span v-else>Talk to the band</span>
                  </button>
                  <button type="button" class="btn-row" :disabled="!!leavingTo" @click="handleOpenPassport">
                    <span v-if="leavingTo === 'passport'" class="btn-loading">
                      <svg class="spinner-sm" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle class="spin-track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="spin-head" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Opening Fan Passport…
                    </span>
                    <span v-else>View Fan Passport</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- ERROR -->
            <div v-else-if="state === 'error'" class="state">
              <h2 class="lede">That didn’t go through.</h2>
              <p class="lede-sub">{{ errorMessage || 'Unable to check in. Please try again.' }}</p>

              <div class="actions">
                <button type="button" class="btn-primary" @click="handleRetry">Try again</button>
                <button type="button" class="btn-quiet" @click="handleClose">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRuntimeConfig, useRoute, navigateTo } from '#app'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { getArtistFocalStyle, getBestArtistImageSource } from '@/utils/media/artistImage'
import { fanLoginPathFor } from '~/utils/fan/safeFanReturnTo'
import { parseCalendarDate } from '~/utils/dates/calendarDate'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  bandId: {
    type: [Number, String],
    default: null
  },
  bandName: {
    type: String,
    default: ''
  },
  showTitle: {
    type: String,
    default: ''
  },
  venue: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  showDate: {
    type: String,
    default: ''
  },
  eventId: {
    type: [Number, String],
    default: null
  },
  campaignId: {
    type: String,
    default: ''
  },
  fanEmail: {
    type: String,
    default: ''
  },
  bandSlug: {
    type: String,
    default: ''
  },
  bandImageUrl: {
    type: String,
    default: null
  },
  bandImage: {
    type: [Object, String],
    default: null
  },
  imageFocalX: {
    type: [Number, String],
    default: 50
  },
  imageFocalY: {
    type: [Number, String],
    default: 50
  },
  preview: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'success', 'already-checked-in', 'error', 'open-badge'])

const config = useRuntimeConfig()
const route = useRoute()
const { enqueue } = useShowCheckInQueue()

const CHECK_IN_TIMEOUT_MS = 12000
const RETRY_DELAYS_MS = [0, 1500, 4000]

// State management
const state = ref('idle')
const loading = ref(false)
const email = ref('')
const emailTouched = ref(false)
const firstName = ref('')
const errorMessage = ref('')
const checkInResponse = ref(null)
const queuedOffline = ref(false)
const leavingTo = ref(null)

const isCheckedIn = computed(() => state.value === 'success' || state.value === 'already_checked_in')
const checkedInHeadline = computed(() =>
  state.value === 'already_checked_in' ? 'You’re already in.' : 'You’re in.'
)

const heroPhoto = computed(() => {
  if (props.bandImage) return getBestArtistImageSource(props.bandImage, 'compact')
  if (props.bandImageUrl) {
    return { src: props.bandImageUrl, srcset: '', sizes: '', width: null, height: null }
  }
  return { src: null, srcset: '', sizes: '', width: null, height: null }
})

const heroFocalStyle = computed(() =>
  getArtistFocalStyle({ positionX: props.imageFocalX, positionY: props.imageFocalY })
)

// Computed attendance data combining props + response
const attendanceData = computed(() => {
  const resp = checkInResponse.value || {}
  return {
    attendanceId: resp.attendanceId || null,
    fanId: resp.fanId || null,
    bandId: props.bandId,
    bandName: props.bandName,
    bandImageUrl: props.bandImageUrl || null,
    bandSlug: props.bandSlug || route.params?.bandSlug || '',
    // Carried so badge-share tracking is attributed to the same event as the check-in.
    eventId: props.eventId ? parseInt(props.eventId) : null,
    showTitle: props.showTitle,
    venue: props.venue,
    city: props.city,
    checkedInAt: resp.checkedInAt || new Date().toISOString(),
    confidenceScore: resp.confidenceScore || 50,
    verificationLevel: resp.verificationLevel || null,
    timelineLabel: resp.timelineLabel || '',
    alreadyCheckedIn: resp.alreadyCheckedIn || false,
    isNewFan: resp.isNewFan || false,
    fanFirstName: firstName.value || null,
    campaignId: props.campaignId,
  }
})

// One show identity, rendered once above the hero.
const placeLine = computed(
  () => [props.venue, props.city].filter(Boolean).join(' · ') || props.showTitle || ''
)

const showDateLabel = computed(() => {
  if (!props.showDate) return ''
  const date = parseCalendarDate(props.showDate)
  if (!date) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
})

// One dense line once the hero has collapsed: venue · city · date.
const compactShowLine = computed(() =>
  [props.venue, props.city, showDateLabel.value].filter(Boolean).join(' · ')
)

const dialogLabel = computed(() =>
  props.bandName ? `Check in to ${props.bandName} tonight` : "Check in to tonight's show"
)

const dialogRef = ref(null)
const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(dialogRef, {
  onEscape: handleClose,
})

// Set while handing off to the badge modal, so focus goes there instead of
// bouncing back to the page button that opened this one.
let handingOffToBadge = false

// Reset state when modal opens
watch(() => props.isOpen, (isOpen) => {
  lockBodyScroll(isOpen)

  if (isOpen) {
    resetState()
    applyPreview()
    activateTrap()
  } else {
    deactivateTrap({ restore: !handingOffToBadge })
    handingOffToBadge = false
  }
})

// Keep the prefill in sync until the fan types an address of their own
watch(() => props.fanEmail, (value) => {
  if (value && !emailTouched.value) {
    email.value = value
  }
})

/**
 * Without this the page behind keeps scrolling under the fan's finger while the
 * check-in surface is open, which reads as the surface itself drifting.
 */
let previousBodyOverflow = ''

function lockBodyScroll(locked) {
  if (typeof document === 'undefined') return

  if (locked) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = previousBodyOverflow
  }
}

onBeforeUnmount(() => {
  lockBodyScroll(false)
  deactivateTrap({ restore: false })
})

function resetState() {
  state.value = 'idle'
  loading.value = false
  errorMessage.value = ''
  checkInResponse.value = null
  queuedOffline.value = false
  emailTouched.value = false
  email.value = props.fanEmail || ''
  firstName.value = ''
  leavingTo.value = null
}

function applyPreview() {
  const preview = props.preview
  if (!preview) return
  if (preview.email != null) {
    email.value = preview.email
    emailTouched.value = true
  }
  if (preview.state) state.value = preview.state
  if (preview.errorMessage) errorMessage.value = preview.errorMessage
  if (preview.queuedOffline) queuedOffline.value = true
  if (preview.response) checkInResponse.value = preview.response
}

if (props.isOpen && props.preview) {
  applyPreview()
}

function useDifferentEmail() {
  emailTouched.value = true
  email.value = ''
  state.value = 'identity_needed'
}

function rememberFanEmail(value) {
  if (!value) return
  try {
    localStorage.setItem('mbq_fan_email', value)
  } catch (err) {
    // Private mode / storage disabled — prefill is a convenience, not a requirement
  }
}

function handleClose() {
  emit('close')
}

/**
 * The badge lives on its own surface so confirmation never waits on canvas
 * work. The page swaps modals, keeping exactly one open at a time.
 */
function handleOpenBadge() {
  handingOffToBadge = true
  emit('open-badge', attendanceData.value)
}

function artistHomePath() {
  const slug = String(props.bandSlug || route.params?.bandSlug || '').trim()
  return slug ? `/${slug}` : ''
}

function handleOpenTonight() {
  const path = artistHomePath()
  if (!path) {
    emit('close')
    return
  }

  const here = String(route.path || '').replace(/\/$/, '')
  const dest = path.replace(/\/$/, '')
  if (here === dest) {
    emit('close')
    return
  }

  leaveToPath(path, 'tonight')
}

async function leaveToPath(path, key) {
  if (leavingTo.value) return
  leavingTo.value = key
  try {
    await navigateTo(path)
  } catch {
    leavingTo.value = null
  }
}

function fanAppPath(path) {
  const user = useStrapiUser()
  return user.value ? path : fanLoginPathFor(path)
}

async function leaveToFanApp(path, key) {
  await leaveToPath(fanAppPath(path), key)
}

function handleOpenPassport() {
  leaveToFanApp('/fan/passport', 'passport')
}

function handlePrimaryCTA() {
  if (email.value) {
    // Known fan - submit directly
    submitCheckIn()
  } else {
    // Unknown fan - collect email
    state.value = 'identity_needed'
  }
}

async function handleSubmitEmail() {
  if (!email.value) return

  submitCheckIn()
}

function handleOpenMessages() {
  leaveToFanApp('/fan/messages', 'messages')
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Venue wifi and packed-room LTE drop requests constantly, so a single failed
 * attempt means nothing. Retry on network and server errors; give up
 * immediately on a 4xx, which will fail identically no matter how often we ask.
 */
async function postCheckIn(payload) {
  let lastError = null

  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await sleep(delay)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), CHECK_IN_TIMEOUT_MS)

    try {
      return await $fetch(`${config.public.strapiUrl}/api/fan-interactions/check-in`, {
        method: 'POST',
        body: payload,
        retry: 0,
        signal: controller.signal,
      })
    } catch (error) {
      lastError = error
      if (isPermanentFailure(error)) throw error
    } finally {
      clearTimeout(timer)
    }
  }

  throw lastError
}

function isPermanentFailure(error) {
  const status = error?.statusCode || error?.response?.status
  return Boolean(status) && status >= 400 && status < 500
}

async function submitCheckIn() {
  state.value = 'submitting'
  loading.value = true
  queuedOffline.value = false

  const { ensureSession, getVisitorToken } = useFanIdentity()
  await ensureSession().catch(() => {})

  const payload = {
    bandId: parseInt(props.bandId),
    fanEmail: email.value.trim().toLowerCase(),
    eventId: props.eventId ? parseInt(props.eventId) : null,
    campaignId: props.campaignId,
    surface: 'band_page',
    interactionContext: 'show_mode',
    visitorToken: getVisitorToken() || undefined,
    metadata: {
      showTitle: props.showTitle,
      venue: props.venue,
      city: props.city,
      checkInMethod: 'premium_modal',
      firstName: firstName.value.trim() || null
    }
  }

  try {
    const response = await postCheckIn(payload)

    if (!response?.success) {
      throw new Error(response?.error || 'Check-in failed')
    }

    checkInResponse.value = response
    rememberFanEmail(payload.fanEmail)

    if (response.alreadyCheckedIn) {
      state.value = 'already_checked_in'
      emit('already-checked-in', response)
    } else {
      state.value = 'success'
      emit('success', response)
    }
  } catch (error) {
    if (isPermanentFailure(error)) {
      console.error('Check-in error:', error)
      errorMessage.value = error.message || 'Unable to check in. Please try again.'
      state.value = 'error'
      emit('error', error)
      return
    }

    // The fan really is standing in the room — don't punish them for the venue's
    // signal. Keep the check-in on the device and finish the flow; the queue
    // replays it on the next visit or as soon as the connection returns.
    console.warn('Check-in queued for retry:', error?.message || error)
    enqueue(payload)
    rememberFanEmail(payload.fanEmail)
    checkInResponse.value = null
    queuedOffline.value = true
    state.value = 'success'
    emit('success', { queued: true, campaignId: props.campaignId })
  } finally {
    loading.value = false
  }
}

function handleRetry() {
  if (email.value) {
    submitCheckIn()
  } else {
    state.value = 'idle'
  }
}
</script>

<style scoped>
/* ---------------------------------------------------------------------------
   Shell
   Check-in owns the whole viewport: an edge-to-edge near-black canvas above the
   global header, with the composition itself inset from the device edges.
--------------------------------------------------------------------------- */
.checkin-viewport {
  position: fixed;
  inset: 0;
  z-index: 100000000;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #050608;
  color: #f7f9fc;
}

.checkin-frame {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  max-width: 520px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  padding:
    calc(env(safe-area-inset-top, 0px) + 12px)
    calc(env(safe-area-inset-right, 0px) + 16px)
    calc(env(safe-area-inset-bottom, 0px) + 20px)
    calc(env(safe-area-inset-left, 0px) + 16px);
  outline: none;
}

.checkin-close {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(5, 6, 8, 0.42);
  color: rgba(247, 249, 252, 0.72);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.checkin-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f7f9fc;
}

.checkin-close:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
}

.checkin-close svg {
  width: 18px;
  height: 18px;
}

/* ---------------------------------------------------------------------------
   Show identity — stated once, above the hero
--------------------------------------------------------------------------- */
.show-identity {
  margin-top: 0;
  padding-right: 56px;
}

.show-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.6);
}

.show-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.14);
}

.show-artist {
  margin: 0.5rem 0 0;
  font-size: clamp(1.75rem, 7.5vw, 2.25rem);
  line-height: 1.04;
  letter-spacing: -0.025em;
  font-weight: 800;
}

.show-place {
  margin: 0.4rem 0 0;
  font-size: 0.9375rem;
  color: rgba(247, 249, 252, 0.7);
}

.show-date {
  margin: 0.15rem 0 0;
  font-size: 0.8125rem;
  color: rgba(247, 249, 252, 0.45);
}

/* ---------------------------------------------------------------------------
   Hero — inset, editorial, fading into the canvas with no seam
--------------------------------------------------------------------------- */
.show-hero {
  position: relative;
  margin: 16px 0 0;
  height: clamp(220px, 38dvh, 420px);
  max-height: min(42dvh, calc(100dvh - 26rem));
  border-radius: 20px;
  overflow: hidden;
  background: #0b0e14;
}

.show-hero-photo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.show-hero-fade {
  position: absolute;
  inset: auto 0 -1px 0;
  height: 58%;
  background: linear-gradient(180deg, rgba(5, 6, 8, 0) 0%, rgba(5, 6, 8, 0.6) 62%, #050608 100%);
}

/* ---------------------------------------------------------------------------
   Body
--------------------------------------------------------------------------- */
.checkin-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  margin-top: 20px;
}

.state {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
}

.lede {
  margin: 0;
  font-size: clamp(1.5rem, 6vw, 1.875rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.lede-sub {
  margin: 0.5rem 0 0;
  font-size: 1rem;
  line-height: 1.45;
  color: rgba(247, 249, 252, 0.66);
}

/* ---------------------------------------------------------------------------
   Checked in — the hero collapses to a thumbnail and the screen turns
   action-first, so the account decision lands above the fold.
--------------------------------------------------------------------------- */
.state-compact {
  animation: checkin-rise 0.28s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.checked-flag {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin: 0;
  padding-right: 56px;
  font-size: clamp(1.5rem, 6vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.02em;
}

.check-dot {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: #22c55e;
  color: #03130a;
}

.check-dot svg {
  width: 15px;
  height: 15px;
}

.identity-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
}

.identity-thumb {
  flex: none;
  width: 72px;
  height: 72px;
  border-radius: 18px;
  object-fit: cover;
  background: #0b0e14;
}

.identity-name {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.identity-meta {
  margin: 0.2rem 0 0;
  font-size: 0.8125rem;
  color: rgba(247, 249, 252, 0.55);
}

@keyframes checkin-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
}

.note {
  margin: 0.875rem 0 0;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: rgba(247, 249, 252, 0.5);
}

/* Rows, not cards. The text carries the value; the icon only orients. */
.benefit-list {
  list-style: none;
  margin: 18px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.benefit-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9375rem;
  color: rgba(247, 249, 252, 0.88);
}

.benefit-list svg {
  flex: none;
  width: 20px;
  height: 20px;
  color: rgba(247, 249, 252, 0.42);
}

.passport-line {
  margin: 18px 0 0;
  font-size: 1rem;
  line-height: 1.45;
  color: rgba(247, 249, 252, 0.72);
}

.state-compact .btn-primary {
  min-height: 52px;
  font-size: 1rem;
}

/* ---------------------------------------------------------------------------
   Actions
--------------------------------------------------------------------------- */
.actions {
  margin-top: 22px;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 56px;
  padding: 0 1.25rem;
  border: 0;
  border-radius: 16px;
  background: #f3f3f4;
  color: #08090a;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition: filter 0.16s ease, transform 0.16s ease;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.97);
}

.btn-primary:active:not(:disabled) {
  filter: brightness(0.93);
  transform: translateY(1px);
}

.btn-primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
}

.next-rows {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.btn-row {
  width: 100%;
  min-height: 44px;
  padding: 0;
  background: none;
  border: 0;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.9375rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.btn-row:disabled {
  cursor: default;
  opacity: 0.7;
}

.btn-row:hover {
  color: rgba(247, 249, 252, 0.92);
}

.btn-row:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 8px;
}

.btn-quiet {
  width: 100%;
  min-height: 48px;
  margin-top: 10px;
  background: none;
  border: 0;
  color: rgba(247, 249, 252, 0.55);
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-quiet:hover {
  color: rgba(247, 249, 252, 0.85);
}

.btn-quiet:focus-visible {
  outline: 2px solid #c084fc;
  outline-offset: 3px;
  border-radius: 8px;
}

.btn-inline {
  padding: 0;
  border: 0;
  background: none;
  color: rgba(247, 249, 252, 0.75);
  font: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

.identity-line {
  margin: 12px 0 0;
  text-align: center;
  font-size: 0.8125rem;
  color: rgba(247, 249, 252, 0.45);
}

.btn-loading {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.form-error {
  margin: 12px 0 0;
  font-size: 0.8125rem;
  color: #fda4af;
}

.checkin-form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  width: 100%;
  min-height: 52px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: #f7f9fc;
  font-size: 1rem;
}

.field::placeholder {
  color: rgba(247, 249, 252, 0.34);
}

.field:focus {
  outline: none;
  border-color: rgba(192, 132, 252, 0.7);
  box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.2);
}

.field:disabled {
  opacity: 0.6;
}

/* The one line of chrome that always sits last, with room above it. */
.footnote {
  margin: auto 0 0;
  padding-top: 24px;
  text-align: center;
  font-size: 0.75rem;
  color: rgba(247, 249, 252, 0.38);
}

.spinner-sm {
  width: 18px;
  height: 18px;
  animation: checkin-spin 0.9s linear infinite;
}

.spinner-inline {
  vertical-align: -3px;
  margin-right: 0.375rem;
}

.spin-track {
  opacity: 0.25;
}

.spin-head {
  opacity: 0.9;
}

@keyframes checkin-spin {
  to {
    transform: rotate(360deg);
  }
}

/* ---------------------------------------------------------------------------
   Small phones — keep the hero from eating the CTA
--------------------------------------------------------------------------- */
@media (max-width: 360px) {
  .show-hero {
    height: clamp(180px, 32dvh, 260px);
    max-height: calc(100dvh - 24rem);
  }

  .benefit-list {
    gap: 10px;
  }
}

/* Height-aware: tighten photo and gaps before type. */
@media (max-height: 780px) {
  .show-hero {
    height: clamp(180px, 30dvh, 280px);
    max-height: calc(100dvh - 24rem);
    margin-top: 12px;
  }

  .checkin-body {
    margin-top: 14px;
  }

  .benefit-list {
    margin-top: 14px;
    gap: 10px;
  }

  .actions {
    margin-top: 16px;
  }

  .footnote {
    padding-top: 16px;
  }
}

@media (max-height: 720px) {
  .show-hero {
    height: clamp(160px, 26dvh, 220px);
    max-height: calc(100dvh - 22rem);
    margin-top: 10px;
  }

  .checkin-body {
    margin-top: 12px;
  }

  .lede-sub {
    margin-top: 0.35rem;
  }

  .benefit-list {
    margin-top: 12px;
    gap: 8px;
  }

  .identity-row {
    margin-top: 14px;
  }

  .passport-line {
    margin-top: 14px;
  }
}

/* ---------------------------------------------------------------------------
   Desktop — contained cinematic composition, same language
--------------------------------------------------------------------------- */
@media (min-width: 900px) {
  .checkin-frame {
    max-width: 1040px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-areas:
      'identity body'
      'hero body';
    grid-template-rows: auto 1fr;
    align-content: center;
    column-gap: 56px;
    padding: 32px 40px calc(env(safe-area-inset-bottom, 0px) + 32px);
  }

  .checkin-close {
    top: 32px;
    right: 40px;
  }

  /* No hero to pair with once attendance exists — one contained column. */
  .checkin-frame--compact {
    display: flex;
    max-width: 460px;
    justify-content: center;
  }

  .checkin-frame--compact .checkin-close {
    top: 0;
    right: 0;
  }

  .checkin-frame--compact .checkin-body {
    flex: 0 1 auto;
  }

  .show-identity {
    grid-area: identity;
    margin-top: 0;
    padding-right: 0;
  }

  .show-artist {
    font-size: clamp(2.25rem, 3vw, 3rem);
  }

  .show-hero {
    grid-area: hero;
    align-self: start;
    height: min(52dvh, 480px);
    max-height: calc(100dvh - 12rem);
    margin-top: 18px;
  }

  .checkin-body {
    grid-area: body;
    margin-top: 0;
    justify-content: center;
    padding-right: 56px;
  }

  .state {
    flex: 0 1 auto;
  }

  .footnote {
    margin-top: 20px;
    text-align: left;
  }
}

/* ---------------------------------------------------------------------------
   Transition
--------------------------------------------------------------------------- */
.checkin-fade-enter-active,
.checkin-fade-leave-active {
  transition: opacity 0.22s ease;
}

.checkin-fade-enter-from,
.checkin-fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .checkin-fade-enter-active,
  .checkin-fade-leave-active,
  .btn-primary {
    transition: none;
  }

  /* The state swap is immediate; only the styling changes. */
  .state-compact {
    animation: none;
  }

  .spinner-sm {
    animation-duration: 2s;
  }
}
</style>
