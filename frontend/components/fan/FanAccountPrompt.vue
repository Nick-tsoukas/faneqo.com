<template>
  <Teleport to="body">
    <Transition name="fp-fade">
      <div
        v-if="visible"
        class="fp-backdrop"
        @click="onDismiss"
      />
    </Transition>

    <Transition name="fp-rise">
      <div
        v-if="visible"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="fp-sheet"
      >
        <div class="fp-grab" aria-hidden="true" />

        <div v-if="photos.length" class="fp-photos">
          <img
            v-for="(photo, index) in photos"
            :key="`${photo.src}-${index}`"
            :src="photo.src"
            alt=""
            class="fp-photo"
          >
        </div>

        <div class="fp-body">
          <template v-if="step === 'prompt'">
            <div class="fp-identity">
              <span class="fp-avatar" aria-hidden="true">
                <img v-if="artistImage" :src="artistImage" alt="">
                <span v-else>{{ initial }}</span>
              </span>
              <p class="fp-kicker">Fan Passport</p>
            </div>

            <h2 :id="titleId" class="fp-title">{{ copy?.title }}</h2>
            <p v-if="copy?.body" class="fp-copy">{{ copy.body }}</p>
            <p v-if="copy?.detail" class="fp-detail">{{ copy.detail }}</p>

            <div v-if="needsEmail" class="fp-field">
              <label class="fp-label" for="fan-account-email">Email</label>
              <input
                id="fan-account-email"
                v-model="emailInputLocal"
                type="email"
                autocomplete="email"
                inputmode="email"
                enterkeyhint="go"
                class="fp-input"
                placeholder="you@email.com"
                @keydown.enter.prevent="onCreate"
              >
            </div>

            <p v-if="error" class="fp-error" role="alert">{{ error }}</p>

            <button
              type="button"
              class="fp-cta"
              :disabled="sending"
              @click="onCreate"
            >
              {{ sending ? 'Sending…' : (copy?.cta || 'Create free account') }}
            </button>
            <button
              type="button"
              class="fp-dismiss"
              :disabled="sending"
              @click="onDismiss"
            >
              {{ copy?.dismiss || 'Not now' }}
            </button>
          </template>

          <template v-else-if="step === 'check_email'">
            <p class="fp-kicker">Fan Passport</p>
            <h2 :id="titleId" class="fp-title">Check your email</h2>
            <p class="fp-copy">
              We sent a sign-in link
              <template v-if="emailMasked"> to {{ emailMasked }}</template>.
              Tap it on this phone. It expires soon.
            </p>
            <button type="button" class="fp-cta" @click="onDismiss">
              Got it
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'
import { useFanAccountConversion } from '~/composables/useFanAccountConversion'
import { trackFanPassport } from '~/utils/fan/passportAnalytics'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const LOCK_ID = 'fan-passport'
const route = useRoute()
const config = useRuntimeConfig()
const { prompt, dismiss, requestLink } = useFanAccountConversion()

const titleId = 'fan-account-prompt-title'

const visible = computed(() => prompt.value.visible)
const step = computed(() => prompt.value.step)
const copy = computed(() => prompt.value.copy)
const sending = computed(() => prompt.value.sending)
const error = computed(() => prompt.value.error)
const needsEmail = computed(() => prompt.value.needsEmail)
const emailMasked = computed(() => prompt.value.emailMasked)
const artistImage = computed(() => prompt.value.context?.artistImage || '')
const photos = computed(() => {
  const list = prompt.value.context?.photos
  return Array.isArray(list) ? list.slice(0, 3) : []
})
const initial = computed(() => {
  const name = String(prompt.value.context?.bandName || 'F')
  const letter = name.match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'F'
})

const emailInputLocal = computed({
  get: () => prompt.value.emailInput,
  set: (v) => {
    prompt.value.emailInput = v
  },
})

function track(eventName) {
  trackFanPassport(eventName, {
    strapiUrl: config.public.strapiUrl,
    bandId: prompt.value.context?.bandId,
    bandSlug: prompt.value.context?.bandSlug,
    source: prompt.value.context?.source,
    trigger: prompt.value.trigger,
  })
}

async function onCreate() {
  track('fan_passport_cta')
  const dest = prompt.value.context?.returnTo || route.fullPath
  await requestLink({ returnTo: dest })
}

async function onDismiss() {
  if (step.value === 'check_email') {
    prompt.value.visible = false
    return
  }
  await dismiss()
}

watch(visible, (open) => {
  if (typeof window === 'undefined') return
  const onKey = (event) => {
    if (event.key === 'Escape') onDismiss()
  }
  if (open) {
    lockOverlayScroll(LOCK_ID)
    window.addEventListener('keydown', onKey)
  } else {
    unlockOverlayScroll(LOCK_ID)
    window.removeEventListener('keydown', onKey)
  }
})

onBeforeUnmount(() => unlockOverlayScroll(LOCK_ID))
</script>

<style scoped>
.fp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.72);
}

.fp-sheet {
  position: fixed;
  z-index: 121;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: min(92vh, 44rem);
  overflow: auto;
  border-radius: 1.35rem 1.35rem 0 0;
  background: #0c0d10;
  color: #f6f3ee;
  padding-bottom: max(1.1rem, env(safe-area-inset-bottom));
}

.fp-grab {
  width: 2.4rem;
  height: 0.22rem;
  margin: 0.7rem auto 0.35rem;
  border-radius: 999px;
  background: rgba(246, 243, 238, 0.22);
}

.fp-photos {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.35rem;
  padding: 0.35rem 0.85rem 0;
}

.fp-photo {
  width: 100%;
  height: 6.4rem;
  object-fit: cover;
  border-radius: 0.55rem;
  background: #16171c;
}

.fp-body {
  padding: 1rem 1.15rem 0.35rem;
}

.fp-identity {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.fp-avatar {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #1a1b20;
  color: #f6f3ee;
  font-size: 0.95rem;
  flex: 0 0 auto;
}

.fp-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fp-kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(246, 243, 238, 0.52);
}

.fp-title {
  margin: 0.85rem 0 0;
  font-size: clamp(1.55rem, 1.2rem + 1.4vw, 2rem);
  line-height: 1.05;
  letter-spacing: -0.038em;
  font-weight: 560;
  text-wrap: balance;
}

.fp-copy,
.fp-detail {
  margin: 0.7rem 0 0;
  font-size: 0.98rem;
  line-height: 1.45;
  color: rgba(246, 243, 238, 0.72);
}

.fp-detail {
  margin-top: 0.35rem;
  color: rgba(246, 243, 238, 0.5);
  font-size: 0.9rem;
}

.fp-field {
  margin-top: 1rem;
}

.fp-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.75rem;
  color: rgba(246, 243, 238, 0.5);
}

.fp-input {
  width: 100%;
  min-height: 48px;
  border-radius: 0.8rem;
  border: 1px solid rgba(246, 243, 238, 0.16);
  background: rgba(246, 243, 238, 0.04);
  color: #f6f3ee;
  font-size: 16px;
  padding: 0.75rem 0.9rem;
}

.fp-input:focus {
  outline: none;
  border-color: rgba(196, 181, 253, 0.85);
  box-shadow: 0 0 0 1px rgba(196, 181, 253, 0.85);
}

.fp-error {
  margin: 0.7rem 0 0;
  color: #f0b4b4;
  font-size: 0.88rem;
}

.fp-cta,
.fp-dismiss {
  width: 100%;
  border: 0;
  cursor: pointer;
}

.fp-cta {
  margin-top: 1.05rem;
  min-height: 48px;
  border-radius: 0.85rem;
  background: #f5f4f2;
  color: #141414;
  font-size: 0.98rem;
  font-weight: 600;
}

.fp-cta:disabled {
  opacity: 0.55;
}

.fp-dismiss {
  margin-top: 0.35rem;
  min-height: 44px;
  background: transparent;
  color: rgba(246, 243, 238, 0.55);
  font-size: 0.92rem;
}

@media (min-width: 640px) {
  .fp-sheet {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    width: min(28rem, calc(100vw - 2rem));
    transform: translate(-50%, -50%);
    border-radius: 1.25rem;
    border: 1px solid rgba(246, 243, 238, 0.1);
    padding-bottom: 1.15rem;
  }

  .fp-grab {
    display: none;
  }

  .fp-photos {
    padding: 0.85rem 0.85rem 0;
  }
}

.fp-fade-enter-active,
.fp-fade-leave-active,
.fp-rise-enter-active,
.fp-rise-leave-active {
  transition: opacity 0.22s ease, transform 0.28s ease;
}

.fp-fade-enter-from,
.fp-fade-leave-to {
  opacity: 0;
}

.fp-rise-enter-from,
.fp-rise-leave-to {
  opacity: 0;
  transform: translateY(1.25rem);
}

@media (min-width: 640px) {
  .fp-rise-enter-from,
  .fp-rise-leave-to {
    transform: translate(-50%, -46%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fp-fade-enter-active,
  .fp-fade-leave-active,
  .fp-rise-enter-active,
  .fp-rise-leave-active {
    transition: none;
  }
}
</style>
