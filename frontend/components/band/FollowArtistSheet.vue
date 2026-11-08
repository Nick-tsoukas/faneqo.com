<template>
  <Teleport to="body">
    <Transition name="afs">
      <div
        v-if="isOpen"
        ref="dialogRef"
        class="afs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="afs-title"
        tabindex="-1"
      >
        <button
          type="button"
          class="afs__backdrop"
          aria-label="Close"
          @click="closeSheet"
        />

        <div class="afs__sheet">
          <div class="afs__head">
            <p class="afs__kicker">{{ showingSuccess ? 'Following' : 'Follow' }}</p>
            <FaneqoIconButton
              name="close"
              size="lg"
              aria-label="Close"
              @click="closeSheet"
            />
          </div>

          <div class="afs__scroll">
            <div class="afs__identity">
              <span class="afs__avatar" aria-hidden="true">
                <img
                  v-if="showImage"
                  :src="profileImage"
                  alt=""
                  @error="handleImageError"
                >
                <span v-else class="afs__mark">{{ bandInitial }}</span>
              </span>
            </div>

            <div v-if="showingSuccess" class="afs__result" role="status" aria-live="polite">
              <h2 id="afs-title" class="afs__headline">
                You’re following {{ displayName }}
              </h2>
              <p class="afs__lede">You’re in.</p>
              <p class="afs__copy">
                This follow stays with you on this device. Their email list is a separate choice.
              </p>
              <button
                v-if="showPassportClaim && !user"
                type="button"
                class="afs__submit"
                @click="onPassport"
              >
                Save to Fan Passport
              </button>
              <button
                type="button"
                class="afs__quiet"
                @click="closeSheet"
              >
                Not now
              </button>
            </div>

            <form
              v-else
              class="afs__form"
              novalidate
              @submit.prevent="submitFollow"
            >
              <h2 id="afs-title" class="afs__headline">
                Follow {{ displayName }}
              </h2>
              <p class="afs__lede">Stay close to the band.</p>
              <p class="afs__copy">
                Following {{ displayName }} does not join their email list.
              </p>

              <label class="afs__label" :for="emailFieldId">Email address</label>
              <input
                :id="emailFieldId"
                ref="emailInputRef"
                v-model="email"
                type="email"
                name="email"
                autocomplete="email"
                inputmode="email"
                enterkeyhint="go"
                placeholder="you@email.com"
                :disabled="busy"
                :aria-invalid="error ? 'true' : 'false'"
                :aria-describedby="error ? errorId : undefined"
                class="afs__input"
              >

              <p v-if="error" :id="errorId" class="afs__error" role="alert">{{ error }}</p>

              <button
                type="submit"
                class="afs__submit"
                :disabled="busy"
                :aria-busy="busy ? 'true' : 'false'"
              >
                <span v-if="busy" class="afs__spinner" aria-hidden="true" />
                <span>{{ busy ? 'Following…' : followCta }}</span>
              </button>

              <p class="afs__or" aria-hidden="true">or</p>
              <button
                type="button"
                class="afs__signin"
                :disabled="busy"
                @click="onSignIn"
              >
                Already have a Fan Passport? Sign in
              </button>
            </form>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { useRuntimeConfig, useStrapiToken, useStrapiUser } from '#imports'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import { useFocusTrap } from '~/composables/useFocusTrap'
import { joinArtistFanList } from '~/utils/fan/joinArtistFanList'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const LOCK_ID = 'artist-follow'

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  bandId: { type: [Number, String], default: null },
  bandName: { type: String, default: '' },
  bandSlug: { type: String, default: '' },
  profileImage: { type: String, default: '' },
  followed: { type: Boolean, default: false },
  showPassportClaim: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'followed', 'claim-passport', 'sign-in'])

const config = useRuntimeConfig()
const user = useStrapiUser()
const strapiToken = useStrapiToken()
const { ensureSession, getVisitorToken } = useFanIdentity()

const dialogRef = ref(null)
const emailInputRef = ref(null)
const email = ref('')
const busy = ref(false)
const error = ref('')
const justFollowed = ref(false)
const imageError = ref(false)

const { activate: activateTrap, deactivate: deactivateTrap } = useFocusTrap(dialogRef, {
  onEscape: closeSheet,
})

const displayName = computed(() => String(props.bandName || '').trim() || 'this artist')
const bandInitial = computed(() => {
  const letter = displayName.value.match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'A'
})
const showImage = computed(() => Boolean(props.profileImage) && !imageError.value)
const followCta = computed(() => (
  displayName.value === 'this artist' ? 'Follow' : `Follow ${displayName.value}`
))
const showingSuccess = computed(() => justFollowed.value || props.followed)
const emailFieldId = computed(() => `artist-follow-email-${props.bandId || 'x'}`)
const errorId = computed(() => `${emailFieldId.value}-error`)

function closeSheet() {
  emit('close')
}

function onSignIn() {
  emit('sign-in', { email: String(email.value || '').trim() })
}

function onPassport() {
  emit('claim-passport', { email: String(email.value || '').trim(), followed: true })
}

function handleImageError() {
  imageError.value = true
}

function resetForm() {
  if (showingSuccess.value) return
  email.value = ''
  error.value = ''
  busy.value = false
}

function prefillSignedInEmail() {
  if (email.value || showingSuccess.value) return
  const next = String(user.value?.email || '').trim()
  if (next) email.value = next
}

async function submitFollow() {
  if (busy.value || showingSuccess.value) return

  const accountEmail = String(user.value?.email || '').trim().toLowerCase()
  const submitted = accountEmail || email.value

  busy.value = true
  error.value = ''

  try {
    await ensureSession().catch(() => {})

    const result = await joinArtistFanList({
      strapiUrl: config.public.strapiUrl,
      email: submitted,
      bandId: props.bandId,
      source: 'follow_modal',
      captureSurface: 'follow_modal',
      visitorToken: getVisitorToken() || undefined,
      authToken: (user.value && strapiToken.value) ? strapiToken.value : undefined,
      marketingConsent: false,
    })

    if (!result.ok) {
      error.value = result.message
      await nextTick()
      emailInputRef.value?.focus?.()
      return
    }

    justFollowed.value = true
    try {
      localStorage.setItem('mbq_fan_email', result.email)
    } catch {
      /* private mode */
    }
    emit('followed', {
      email: result.email,
      already: result.already,
      subscribed: result.subscribed === true,
    })
  } catch {
    error.value = 'Could not follow this artist. Try again.'
    await nextTick()
    emailInputRef.value?.focus?.()
  } finally {
    busy.value = false
  }
}

watch(() => props.profileImage, () => {
  imageError.value = false
})

watch(() => props.followed, (followed) => {
  if (!followed) justFollowed.value = false
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    lockOverlayScroll(LOCK_ID)
    if (!props.followed) {
      justFollowed.value = false
      error.value = ''
      prefillSignedInEmail()
    }
    await nextTick()
    activateTrap()
    if (!showingSuccess.value) {
      emailInputRef.value?.focus?.()
    }
    return
  }
  deactivateTrap()
  unlockOverlayScroll(LOCK_ID)
  if (!props.followed) justFollowed.value = false
  resetForm()
}, { immediate: true })

onUnmounted(() => {
  deactivateTrap({ restore: false })
  unlockOverlayScroll(LOCK_ID)
})
</script>

<style scoped>
.afs {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.afs:focus {
  outline: none;
}

.afs__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(5, 5, 6, 0.72);
  cursor: pointer;
}

.afs__sheet {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: min(92dvh, 38rem);
  overflow: hidden;
  background: #050506;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 0;
  border-radius: 1.1rem 1.1rem 0 0;
}

.afs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: 0.1rem 0.55rem 0.1rem 1.2rem;
}

.afs__kicker {
  margin: 0;
  color: rgba(245, 245, 246, 0.42);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.afs__scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  padding: 0.35rem 1.35rem calc(1.2rem + env(safe-area-inset-bottom, 0px));
}

.afs__identity {
  display: flex;
  justify-content: center;
}

.afs__avatar {
  display: block;
  width: 52px;
  height: 52px;
  overflow: hidden;
  border-radius: 50%;
  background: #111318;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1);
}

.afs__avatar img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.afs__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f5f5f6;
}

.afs__form,
.afs__result {
  margin-top: 0.95rem;
  text-align: left;
}

.afs__headline {
  margin: 0;
  color: #f7f7f8;
  font-size: 1.55rem;
  font-weight: 750;
  letter-spacing: -0.038em;
  line-height: 1.12;
}

.afs__lede {
  margin: 0.7rem 0 0;
  color: #f5f5f6;
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.afs__copy {
  margin: 0.35rem 0 0;
  color: rgba(245, 245, 246, 0.56);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.afs__label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.afs__input {
  width: 100%;
  min-height: 52px;
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  background: #08090a;
  color: #f5f5f6;
  font: inherit;
  font-size: 16px;
}

.afs__input::placeholder {
  color: rgba(245, 245, 246, 0.38);
}

.afs__input:focus {
  outline: none;
  border-color: rgba(139, 108, 255, 0.62);
  box-shadow: 0 0 0 2px rgba(139, 108, 255, 0.2);
}

.afs__input:disabled {
  opacity: 0.6;
}

.afs__error {
  margin: 0.55rem 0 0;
  color: #fca5a5;
  font-size: 0.8125rem;
}

.afs__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 52px;
  margin-top: 0.75rem;
  border: 0;
  border-radius: 14px;
  background: #f3f3f4;
  color: #08090a;
  font: inherit;
  font-size: 1rem;
  font-weight: 650;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.14s cubic-bezier(0.22, 1, 0.36, 1), filter 0.14s ease;
}

.afs__submit:hover:not(:disabled) {
  filter: brightness(0.97);
}

.afs__submit:active:not(:disabled),
.afs__quiet:active:not(:disabled),
.afs__signin:active:not(:disabled) {
  transform: scale(0.98);
}

.afs__submit:disabled {
  opacity: 0.55;
  cursor: default;
}

.afs__submit:focus-visible,
.afs__quiet:focus-visible,
.afs__signin:focus-visible,
.afs__input:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.afs__or {
  margin: 1.05rem 0 0;
  color: rgba(245, 245, 246, 0.34);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: lowercase;
}

.afs__signin,
.afs__quiet {
  display: block;
  width: 100%;
  min-height: 44px;
  margin-top: 0.15rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(245, 245, 246, 0.58);
  font: inherit;
  font-size: 0.875rem;
  font-weight: 550;
  cursor: pointer;
  text-align: center;
}

.afs__signin:hover,
.afs__quiet:hover {
  color: #f5f5f6;
}

.afs__quiet {
  margin-top: 0.35rem;
}

.afs__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(8, 9, 10, 0.22);
  border-top-color: #08090a;
  border-radius: 50%;
  animation: afs-spin 0.7s linear infinite;
}

@keyframes afs-spin {
  to { transform: rotate(360deg); }
}

.afs-enter-active,
.afs-leave-active {
  transition: opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.afs-enter-active .afs__sheet,
.afs-leave-active .afs__sheet {
  transition:
    transform 0.18s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.16s cubic-bezier(0.22, 1, 0.36, 1);
}

.afs-enter-from,
.afs-leave-to {
  opacity: 0;
}

.afs-enter-from .afs__sheet,
.afs-leave-to .afs__sheet {
  transform: translateY(18px);
  opacity: 0;
}

@media (min-width: 768px) {
  .afs {
    align-items: center;
    padding: 1.5rem;
    padding-top: max(1.5rem, env(safe-area-inset-top, 0px));
    padding-bottom: max(1.5rem, env(safe-area-inset-bottom, 0px));
  }

  .afs__sheet {
    width: min(26rem, 100%);
    max-height: min(88dvh, 36rem);
    border-radius: 1.1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .afs-enter-from .afs__sheet,
  .afs-leave-to .afs__sheet {
    transform: translateY(10px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .afs-enter-active,
  .afs-leave-active,
  .afs-enter-active .afs__sheet,
  .afs-leave-active .afs__sheet,
  .afs__submit,
  .afs__signin,
  .afs__quiet {
    transition: none;
  }

  .afs-enter-from .afs__sheet,
  .afs-leave-to .afs__sheet,
  .afs__submit:active:not(:disabled),
  .afs__signin:active:not(:disabled),
  .afs__quiet:active:not(:disabled) {
    transform: none;
  }

  .afs__spinner {
    animation: none;
  }
}
</style>
