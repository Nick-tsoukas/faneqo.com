<template>
  <main class="fan-profile">
    <div class="fan-profile__inner" :class="{ 'is-editing': editing }">
      <!--
        Nothing editable renders until auth truth has resolved: an unauthenticated
        fan is routed to /fan/login rather than shown a shell they cannot save.
      -->
      <div v-if="phase === 'resolving'" class="fan-profile__resolving" role="status" aria-live="polite">
        <span class="fan-profile__spinner" aria-hidden="true" />
        <span class="sr-only">Loading your profile</span>
      </div>

      <template v-else>
        <template v-if="loadFailed">
          <section class="fan-profile__failed">
            <h1 class="fan-profile__name">Profile</h1>
            <p class="fan-profile__prompt">{{ error || "Couldn't load your profile." }}</p>
            <button type="button" class="fan-profile__action" @click="retry">Retry</button>
          </section>
        </template>

        <section v-else-if="!editing" class="fan-profile__identity">
          <FanAvatarControl
            :avatar-url="profile?.avatarUrl"
            :initials="initials"
            :size="88"
            :uploading="avatarUploading"
            :deleting="avatarDeleting"
            @upload="onAvatarUpload"
            @remove="onAvatarRemove"
            @reject="onAvatarReject"
          />
          <div class="fan-profile__who">
            <h1 class="fan-profile__name">{{ displayName || 'Complete your profile' }}</h1>
            <p v-if="displayName && profile?.email" class="fan-profile__context">{{ profile.email }}</p>
            <p v-if="!displayName" class="fan-profile__prompt">
              Add the name artists will see when you connect with them.
            </p>
          </div>
        </section>

        <div v-if="!loadFailed && !editing" class="fan-profile__actions">
          <button type="button" class="fan-profile__action" @click="startEdit">
            {{ displayName ? 'Edit profile' : 'Add profile' }}
          </button>
          <p v-if="justSaved" class="fan-profile__saved" role="status">{{ justSaved }}</p>
          <p v-if="!editing && error" class="fan-profile__error" role="alert">{{ error }}</p>
        </div>

        <form
          v-if="!loadFailed && editing"
          class="fan-profile__form"
          novalidate
          @submit.prevent="submit"
        >
          <div class="fan-profile__form-bar">
            <button class="fan-profile__cancel" type="button" :disabled="saving" @click="cancelEdit">
              Cancel
            </button>
            <h1 class="fan-profile__form-title">Edit profile</h1>
            <button
              class="fan-profile__save"
              type="submit"
              :disabled="saving"
              :aria-busy="saving ? 'true' : undefined"
            >
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>

          <div class="fan-profile__form-head">
            <FanAvatar :avatar-url="profile?.avatarUrl" :initials="initials" :size="52" />
          </div>

          <label class="fan-profile__label is-primary" for="fan-profile-display-name">Display name</label>
          <input
            id="fan-profile-display-name"
            ref="displayNameField"
            v-model="form.displayName"
            class="fan-profile__input"
            type="text"
            name="displayName"
            :maxlength="limits.displayName"
            autocomplete="nickname"
            autocapitalize="words"
            spellcheck="false"
            enterkeyhint="next"
            placeholder="The name artists see"
            :aria-invalid="fieldErrors.displayName ? 'true' : undefined"
            :aria-describedby="displayNameDescribedBy"
          />
          <p id="fan-profile-display-name-hint" class="fan-profile__hint">
            The name artists see on Faneqo.
          </p>
          <p
            v-if="fieldErrors.displayName"
            id="fan-profile-display-name-error"
            class="fan-profile__error"
            role="alert"
          >
            {{ fieldErrors.displayName }}
          </p>

          <label class="fan-profile__label" for="fan-profile-first-name">First name</label>
          <input
            id="fan-profile-first-name"
            v-model="form.firstName"
            class="fan-profile__input"
            type="text"
            name="firstName"
            :maxlength="limits.firstName"
            autocomplete="given-name"
            autocapitalize="words"
            enterkeyhint="next"
            :aria-invalid="fieldErrors.firstName ? 'true' : undefined"
            :aria-describedby="fieldErrors.firstName ? 'fan-profile-first-name-error' : undefined"
          />
          <p
            v-if="fieldErrors.firstName"
            id="fan-profile-first-name-error"
            class="fan-profile__error"
            role="alert"
          >
            {{ fieldErrors.firstName }}
          </p>

          <label class="fan-profile__label" for="fan-profile-last-name">Last name</label>
          <input
            id="fan-profile-last-name"
            v-model="form.lastName"
            class="fan-profile__input"
            type="text"
            name="lastName"
            :maxlength="limits.lastName"
            autocomplete="family-name"
            autocapitalize="words"
            enterkeyhint="done"
            :aria-invalid="fieldErrors.lastName ? 'true' : undefined"
            :aria-describedby="fieldErrors.lastName ? 'fan-profile-last-name-error' : undefined"
          />
          <p
            v-if="fieldErrors.lastName"
            id="fan-profile-last-name-error"
            class="fan-profile__error"
            role="alert"
          >
            {{ fieldErrors.lastName }}
          </p>

          <p v-if="error" class="fan-profile__error" role="alert">{{ error }}</p>
        </form>

        <section v-if="!editing" class="fan-profile__account">
          <h2 class="fan-profile__section">Account</h2>
          <p v-if="profile?.email" class="fan-profile__account-email">{{ profile.email }}</p>
          <p class="fan-profile__account-title">Passwordless sign-in</p>
          <p class="fan-profile__account-copy">
            We'll email you a secure sign-in link whenever you need to sign in on a new device.
          </p>
          <button type="button" class="fan-profile__signout" :disabled="signingOut" @click="signOut">
            {{ signingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </section>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import FanAvatar from '~/components/fan/FanAvatar.vue'
import FanAvatarControl from '~/components/fan/FanAvatarControl.vue'
import { useFanProfile } from '~/composables/useFanProfile'
import {
  FAN_PROFILE_LIMITS,
  fanProfileDisplayName,
  fanProfileFormValues,
  fanProfileInitials,
} from '~/utils/fan/fanProfileIdentity'

definePageMeta({
  layout: 'default',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Your profile · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const router = useRouter()
const token = useStrapiToken()
const { logout } = useStrapiAuth()
const {
  profile,
  saving,
  avatarUploading,
  avatarDeleting,
  error,
  fieldErrors,
  loadProfile,
  saveProfile,
  uploadAvatar,
  removeAvatar,
  clearError,
  reset,
  statusOf,
} = useFanProfile()

const LOGIN_PATH = '/fan/login?redirect=/fan/profile'

const phase = ref('resolving')
const loadFailed = ref(false)
const editing = ref(false)
const justSaved = ref('')
const signingOut = ref(false)
const displayNameField = ref(null)
const limits = FAN_PROFILE_LIMITS
const form = reactive({ displayName: '', firstName: '', lastName: '' })

let savedTimer = null

const displayName = computed(() => fanProfileDisplayName(profile.value))
const initials = computed(() => fanProfileInitials(profile.value))
const displayNameDescribedBy = computed(() => {
  const ids = ['fan-profile-display-name-hint']
  if (fieldErrors.value.displayName) ids.push('fan-profile-display-name-error')
  return ids.join(' ')
})

function toLogin() {
  phase.value = 'resolving'
  return router.replace(LOGIN_PATH)
}

async function resolve() {
  if (!token.value) return toLogin()
  try {
    await loadProfile({ force: true })
    loadFailed.value = false
  } catch (err) {
    if (statusOf(err) === 401) return toLogin()
    loadFailed.value = true
  }
  phase.value = 'ready'
}

function retry() {
  phase.value = 'resolving'
  clearError()
  return resolve()
}

async function startEdit() {
  clearError()
  Object.assign(form, fanProfileFormValues(profile.value))
  justSaved.value = ''
  editing.value = true
  await nextTick()
  displayNameField.value?.focus?.()
}

function cancelEdit() {
  clearError()
  editing.value = false
}

function flashSaved(message = 'Saved') {
  justSaved.value = message
  if (savedTimer) clearTimeout(savedTimer)
  savedTimer = setTimeout(() => {
    justSaved.value = ''
  }, 3200)
}

async function onAvatarUpload(file) {
  clearError()
  try {
    await uploadAvatar(file)
    flashSaved('Photo updated')
  } catch (err) {
    if (statusOf(err) === 401) toLogin()
  }
}

function onAvatarReject(check) {
  clearError()
  error.value = check?.message || 'Choose a JPEG, PNG, or WebP image.'
}

async function onAvatarRemove() {
  clearError()
  try {
    await removeAvatar()
    flashSaved('Photo removed')
  } catch (err) {
    if (statusOf(err) === 401) toLogin()
  }
}

async function submit() {
  try {
    await saveProfile(form)
    editing.value = false
    flashSaved()
  } catch (err) {
    if (statusOf(err) === 401) toLogin()
  }
}

/**
 * Signing out ends authentication only. Anonymous visitor identity, device
 * saves, attendance and server-side fan relationships are untouched.
 */
async function signOut() {
  signingOut.value = true
  try {
    await logout()
  } finally {
    reset()
    signingOut.value = false
    await router.replace('/fan/login')
  }
}

onMounted(resolve)

onBeforeUnmount(() => {
  if (savedTimer) clearTimeout(savedTimer)
})
</script>

<style scoped>
.fan-profile {
  min-height: 100dvh;
  background: var(--faneqo-obsidian, #050608);
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.fan-profile__inner {
  width: min(100%, 28rem);
  margin: 0 auto;
  padding:
    calc(var(--header-height, 70px) + 1.75rem)
    clamp(1.05rem, 5vw, 1.5rem)
    calc(7rem + env(safe-area-inset-bottom, 0px));
}

.fan-profile__inner.is-editing {
  padding-bottom: calc(10rem + env(safe-area-inset-bottom, 0px));
}

.fan-profile__resolving {
  display: flex;
  justify-content: center;
  padding: 4.5rem 0;
}

.fan-profile__spinner {
  width: 1.75rem;
  height: 1.75rem;
  border: 2px solid rgba(69, 227, 174, 0.22);
  border-top-color: #45e3ae;
  border-radius: 50%;
  animation: fan-profile-spin 0.9s linear infinite;
}

@keyframes fan-profile-spin {
  to { transform: rotate(360deg); }
}

/* ------------------------------------------------------------- identity -- */

.fan-profile__identity,
.fan-profile__failed {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.15rem;
}

.fan-profile__who {
  min-width: 0;
  width: 100%;
}

.fan-profile__name {
  margin: 0;
  font-size: clamp(1.55rem, 7vw, 1.95rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.fan-profile__context {
  margin: 0.4rem 0 0;
  color: rgba(247, 249, 252, 0.38);
  font-size: 0.82rem;
  overflow-wrap: anywhere;
}

.fan-profile__prompt {
  margin: 0.5rem 0 0;
  color: rgba(247, 249, 252, 0.52);
  font-size: 0.9rem;
  line-height: 1.5;
}

.fan-profile__actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.fan-profile__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.2rem;
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 999px;
  background: none;
  color: #f7f9fc;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 650;
  cursor: pointer;
  transition: border-color 0.21s ease, background 0.21s ease;
}

.fan-profile__action:hover {
  border-color: rgba(69, 227, 174, 0.45);
  background: rgba(69, 227, 174, 0.06);
}

.fan-profile__saved {
  margin: 0;
  color: #7bf1ca;
  font-size: 0.85rem;
  font-weight: 600;
}

/* ----------------------------------------------------------------- edit -- */

.fan-profile__form-bar {
  position: sticky;
  top: var(--header-height, 70px);
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 48px;
  margin: -0.35rem 0 1.1rem;
  padding: 0.4rem 0;
  background: var(--faneqo-obsidian, #050608);
}

.fan-profile__form-title {
  flex: 1 1 auto;
  margin: 0;
  min-width: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-align: center;
}

.fan-profile__form-head {
  display: flex;
  justify-content: center;
  margin: 0.15rem 0 0.35rem;
}

.fan-profile__label {
  display: block;
  margin: 1.25rem 0 0.4rem;
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.74rem;
  font-weight: 600;
}

.fan-profile__label.is-primary {
  margin-top: 1.5rem;
  color: rgba(247, 249, 252, 0.62);
  font-size: 0.8rem;
}

.fan-profile__input {
  width: 100%;
  min-height: 48px;
  padding: 0.75rem 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.11);
  border-radius: 0.8rem;
  background: var(--faneqo-raised, #0b0e14);
  color: #f7f9fc;
  /* 16px floor keeps iOS Safari from zooming the viewport on focus. */
  font: inherit;
  font-size: 1rem;
}

.fan-profile__input::placeholder {
  color: rgba(247, 249, 252, 0.26);
}

.fan-profile__input:focus-visible {
  border-color: rgba(69, 227, 174, 0.55);
  outline: 2px solid #39d5ff;
  outline-offset: 2px;
}

.fan-profile__input[aria-invalid='true'] {
  border-color: rgba(255, 157, 157, 0.6);
}

.fan-profile__hint {
  margin: 0.4rem 0 0;
  color: rgba(247, 249, 252, 0.36);
  font-size: 0.8rem;
}

.fan-profile__error {
  margin: 0.45rem 0 0;
  color: #ff9d9d;
  font-size: 0.84rem;
}

.fan-profile__save,
.fan-profile__cancel {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 4.25rem;
  padding: 0 0.15rem;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
}

.fan-profile__save {
  color: #45e3ae;
  font-size: 0.95rem;
  font-weight: 700;
}

.fan-profile__cancel {
  color: rgba(247, 249, 252, 0.55);
  font-size: 0.92rem;
  font-weight: 600;
}

.fan-profile__save:hover:not(:disabled) {
  color: #7bf1ca;
}

.fan-profile__save:disabled,
.fan-profile__cancel:disabled,
.fan-profile__signout:disabled {
  opacity: 0.55;
  cursor: default;
}

/* -------------------------------------------------------------- account -- */

.fan-profile__account {
  margin-top: clamp(2.75rem, 10vh, 3.75rem);
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.fan-profile__section {
  margin: 0;
  color: rgba(247, 249, 252, 0.4);
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.fan-profile__account-email {
  margin: 0.85rem 0 0;
  font-size: 0.95rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.fan-profile__account-title {
  margin: 1.2rem 0 0;
  font-size: 0.9rem;
  font-weight: 650;
}

.fan-profile__account-copy {
  margin: 0.35rem 0 0;
  color: rgba(247, 249, 252, 0.45);
  font-size: 0.85rem;
  line-height: 1.55;
}

.fan-profile__signout {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 1.45rem;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(252, 165, 165, 0.78);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
}

.fan-profile__signout:hover:not(:disabled) {
  color: #fca5a5;
}

.fan-profile__action:focus-visible,
.fan-profile__save:focus-visible,
.fan-profile__cancel:focus-visible,
.fan-profile__signout:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
  border-radius: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .fan-profile__spinner {
    animation-duration: 2.4s;
  }

  .fan-profile__action {
    transition: none;
  }
}
</style>
