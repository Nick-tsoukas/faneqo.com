<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm"
        @click="$emit('close')"
      />
    </Transition>

    <Transition name="slide-up">
      <div
        v-if="open"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fan-message-title"
        class="fq-req-sheet fq-msg-accents"
      >
        <div class="flex justify-center pt-3 pb-1 sm:hidden">
          <div class="h-1 w-10 rounded-full bg-white/20" />
        </div>

        <div class="px-5 pt-3 pb-5 space-y-4">
          <template v-if="step === 'auth'">
            <div class="fq-req-sheet__identity">
              <span class="fq-req-sheet__avatar" aria-hidden="true">
                <img v-if="artistImage" :src="artistImage" alt="">
                <span v-else>{{ bandInitial }}</span>
              </span>
              <p class="fq-req-sheet__kicker">Fan Passport</p>
            </div>
            <div>
              <h2 id="fan-message-title" class="fq-req-sheet__title">
                Start a conversation with {{ displayName }}.
              </h2>
              <p class="fq-req-sheet__copy">
                Your message deserves a home. Continue with your email to create your free Fan Passport.
              </p>
            </div>
            <div class="space-y-2">
              <label class="fq-req-sheet__label" for="fan-message-draft">Message — optional</label>
              <textarea
                id="fan-message-draft"
                v-model="body"
                rows="3"
                maxlength="2000"
                class="fq-req-sheet__input fq-req-sheet__textarea fq-req-sheet__draft"
                placeholder="Write it now. You’ll send it after you’re in."
              />
            </div>
            <div class="space-y-2">
              <label class="fq-req-sheet__label" for="fan-message-email">Email</label>
              <input
                id="fan-message-email"
                v-model="email"
                type="email"
                autocomplete="email"
                inputmode="email"
                enterkeyhint="go"
                class="fq-req-sheet__input"
                placeholder="you@email.com"
              />
            </div>
            <p v-if="error" class="fq-req-sheet__error">{{ error }}</p>
            <button
              type="button"
              class="fq-req-sheet__primary"
              :disabled="sending"
              @click="$emit('continue-free', email)"
            >
              {{ sending ? 'Sending…' : 'Continue with email' }}
            </button>
            <p class="fq-req-sheet__signin">
              Already have an account?
              <button
                type="button"
                class="fq-req-sheet__text-btn"
                :disabled="sending"
                @click="$emit('continue-free', email)"
              >
                Sign in
              </button>
            </p>
          </template>

          <template v-else-if="step === 'sent'">
            <h2 id="fan-message-title" class="fq-req-sheet__title">Check your email</h2>
            <p class="fq-req-sheet__copy">
              We sent a sign-in link. Tap it to finish — it expires soon.
            </p>
            <button type="button" class="fq-req-sheet__ghost" @click="$emit('close')">
              Got it
            </button>
          </template>

          <template v-else-if="step === 'name'">
            <div>
              <h2 id="fan-message-title" class="fq-req-sheet__title">
                What should {{ displayName }} call you?
              </h2>
            </div>
            <div class="space-y-2">
              <label class="fq-req-sheet__label" for="fan-message-first">First name</label>
              <input
                id="fan-message-first"
                v-model="firstName"
                type="text"
                autocomplete="given-name"
                class="fq-req-sheet__input"
              />
            </div>
            <div class="space-y-2">
              <label class="fq-req-sheet__label" for="fan-message-last">
                Last name — optional
              </label>
              <input
                id="fan-message-last"
                v-model="lastName"
                type="text"
                autocomplete="family-name"
                class="fq-req-sheet__input"
              />
            </div>
            <p v-if="error" class="fq-req-sheet__error">{{ error }}</p>
            <button
              type="button"
              class="fq-req-sheet__primary"
              :disabled="sending || !firstName.trim()"
              @click="$emit('save-name', { firstName: firstName.trim(), lastName: lastName.trim() })"
            >
              {{ sending ? 'Saving…' : 'Continue' }}
            </button>
          </template>

          <template v-else-if="step === 'success'">
            <div class="fq-req-sheet__success">
              <p class="fq-req-sheet__check" aria-hidden="true">✓</p>
              <h2 id="fan-message-title" class="fq-req-sheet__title">Request sent</h2>
              <p class="fq-req-sheet__copy">
                {{ displayName }} will see your message request.
                If they accept, the conversation will appear in Messages.
              </p>
            </div>
            <button type="button" class="fq-req-sheet__primary" @click="$emit('done')">
              Done
            </button>
          </template>

          <template v-else-if="step === 'pending'">
            <div class="fq-req-sheet__success">
              <h2 id="fan-message-title" class="fq-req-sheet__title">Request pending</h2>
              <p class="fq-req-sheet__copy">
                Your message request is waiting for {{ displayName }}.
                If they accept, the conversation will appear in Messages.
              </p>
            </div>
            <button type="button" class="fq-req-sheet__ghost" @click="$emit('done')">
              Done
            </button>
          </template>

          <template v-else-if="step === 'unavailable'">
            <div>
              <h2 id="fan-message-title" class="fq-req-sheet__title">
                Messaging isn’t available
              </h2>
              <p class="fq-req-sheet__copy">
                You can’t send a message request to {{ displayName }} right now.
              </p>
            </div>
            <button type="button" class="fq-req-sheet__ghost" @click="$emit('done')">
              Done
            </button>
          </template>

          <template v-else>
            <div class="fq-req-sheet__artist">
              <img
                v-if="artistImage"
                :src="artistImage"
                :alt="bandName"
                class="fq-req-sheet__photo"
              />
              <span v-else class="fq-req-sheet__photo is-fallback" aria-hidden="true">
                {{ bandInitial }}
              </span>
              <div>
                <h2 id="fan-message-title" class="fq-req-sheet__title">
                  Message {{ displayName }}
                </h2>
                <p class="fq-req-sheet__copy">
                  Send a message request to the band.
                  If they accept, your conversation will appear in Messages.
                </p>
              </div>
            </div>
            <textarea
              v-model="body"
              rows="5"
              maxlength="2000"
              class="fq-req-sheet__input fq-req-sheet__textarea"
              placeholder="Write your message..."
            />
            <p v-if="error" class="fq-req-sheet__error">{{ error }}</p>
            <div class="fq-req-sheet__send-row">
              <button
                type="button"
                class="fq-req-sheet__primary fq-req-sheet__send"
                :disabled="sending || !body.trim()"
                @click="$emit('send', body.trim())"
              >
                {{ sending ? 'Sending…' : 'Send request' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { readMessageDraft, writeMessageDraft } from '~/utils/fan/messageIntent'
import { lockOverlayScroll, unlockOverlayScroll } from '~/utils/ui/overlayScrollLock'

const props = defineProps({
  open: { type: Boolean, default: false },
  step: { type: String, default: 'auth' },
  bandName: { type: String, default: 'this artist' },
  artistImage: { type: String, default: '' },
  sending: { type: Boolean, default: false },
  error: { type: String, default: '' },
  initialFirstName: { type: String, default: '' },
  initialLastName: { type: String, default: '' },
  bandId: { type: [Number, String], default: null },
})

const emit = defineEmits(['close', 'continue-free', 'save-name', 'send', 'done'])

const email = ref('')
const firstName = ref('')
const lastName = ref('')
const body = ref('')
const displayName = computed(() => String(props.bandName || 'this artist').trim() || 'this artist')
const bandInitial = computed(() => {
  const letter = displayName.value.match(/[A-Za-z0-9]/)
  return letter ? letter[0].toUpperCase() : 'A'
})

watch(
  () => [props.open, props.step, props.bandId, props.initialFirstName, props.initialLastName],
  () => {
    if (!props.open) return
    const draft = readMessageDraft(props.bandId)
    if (!firstName.value) firstName.value = props.initialFirstName || draft?.firstName || ''
    if (!lastName.value) lastName.value = props.initialLastName || draft?.lastName || ''
    if (!body.value && draft?.bodyText) body.value = draft.bodyText
  },
)

watch([body, firstName, lastName], () => {
  if (!props.open || props.bandId == null || props.bandId === '') return
  writeMessageDraft(props.bandId, {
    bodyText: body.value,
    firstName: firstName.value,
    lastName: lastName.value,
  })
})

let onMessageKey = null
watch(
  () => props.open,
  (open) => {
    if (typeof window === 'undefined') return
    if (onMessageKey) window.removeEventListener('keydown', onMessageKey)
    onMessageKey = null
    if (open) {
      lockOverlayScroll('fan-message')
      onMessageKey = (event) => {
        if (event.key === 'Escape') emit('close')
      }
      window.addEventListener('keydown', onMessageKey)
    } else {
      unlockOverlayScroll('fan-message')
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (onMessageKey && typeof window !== 'undefined') {
    window.removeEventListener('keydown', onMessageKey)
  }
  unlockOverlayScroll('fan-message')
})
</script>

<style>
@import '~/assets/css/faneqo-messaging-accents.css';
</style>

<style scoped>
.fq-req-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 121;
  max-height: 88vh;
  overflow-y: auto;
  border-radius: 1.35rem 1.35rem 0 0;
  border-top: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: #0B0C10;
  padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
}

@media (min-width: 640px) {
  .fq-req-sheet {
    bottom: auto;
    left: 50%;
    top: 50%;
    width: 100%;
    max-width: 26rem;
    transform: translate(-50%, -50%);
    border-radius: 1.15rem;
    border: 1px solid var(--fq-border-strong, rgba(255, 255, 255, 0.11));
  }
}

.fq-req-sheet__title {
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.fq-req-sheet__copy {
  margin: 0.45rem 0 0;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.88rem;
  line-height: 1.5;
}

.fq-req-sheet__label {
  display: block;
  color: rgba(255, 255, 255, 0.45);
  font-size: 0.72rem;
}

.fq-req-sheet__input {
  width: 100%;
  min-height: 48px;
  border-radius: 0.85rem;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: #111217;
  padding: 0.75rem 0.85rem;
  color: #fff;
  font-size: 16px;
}

.fq-req-sheet__input:focus {
  outline: none;
  border-color: rgba(57, 213, 255, 0.45);
  box-shadow: 0 0 0 1px var(--fq-accent-focus, #39D5FF);
}

.fq-req-sheet__textarea {
  min-height: 8.5rem;
  resize: none;
  line-height: 1.45;
}

.fq-req-sheet__error {
  color: #fca5a5;
  font-size: 0.84rem;
}

.fq-req-sheet__primary,
.fq-req-sheet__ghost {
  width: 100%;
  min-height: 48px;
  border-radius: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.fq-req-sheet__primary {
  border: 0;
  color: #141414;
  background: #f5f4f2;
}

.fq-req-sheet__identity {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.fq-req-sheet__avatar {
  width: 2.6rem;
  height: 2.6rem;
  border-radius: 999px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: #1a1b20;
  color: #f6f3ee;
}

.fq-req-sheet__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fq-req-sheet__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(246, 243, 238, 0.52);
}

.fq-req-sheet__draft {
  min-height: 5.5rem;
}

.fq-req-sheet__primary:disabled {
  opacity: 0.45;
  cursor: default;
}

.fq-req-sheet__ghost {
  border: 1px solid var(--fq-border-strong, rgba(255, 255, 255, 0.11));
  background: transparent;
  color: #fff;
}

.fq-req-sheet__signin {
  margin: 0;
  text-align: center;
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.84rem;
}

.fq-req-sheet__text-btn {
  border: 0;
  background: none;
  color: #fff;
  font-weight: 650;
  cursor: pointer;
}

.fq-req-sheet__artist {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.fq-req-sheet__photo {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.fq-req-sheet__photo.is-fallback {
  display: grid;
  place-items: center;
  background: #14161B;
  color: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  font-size: 0.85rem;
  font-weight: 700;
}

.fq-req-sheet__success {
  text-align: center;
  padding: 0.35rem 0 0.2rem;
}

.fq-req-sheet__check {
  margin: 0 0 0.45rem;
  color: var(--fq-accent-mint, #45E3AE);
  font-size: 1.35rem;
  font-weight: 700;
}

.fq-req-sheet__send-row {
  display: flex;
  justify-content: flex-end;
}

.fq-req-sheet__send {
  width: auto;
  min-width: 8.5rem;
  padding: 0 1.05rem;
}

.fade-enter-active,
.fade-leave-active,
.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.18s ease, transform 0.22s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
