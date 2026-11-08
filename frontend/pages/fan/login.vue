<template>
  <AuthShell>
    <form v-if="step === 'form'" method="post" novalidate @submit.prevent="submit">
      <h1 class="auth-title">Sign in</h1>
      <p class="auth-quiet" style="text-align: left; margin: 0.85rem 0 1.5rem">
        Enter your email and we'll send you a secure sign-in link.
      </p>

      <AuthField
        id="fan-login-email"
        v-model="email"
        type="email"
        name="email"
        label="Email"
        autocomplete="email"
        inputmode="email"
        enterkeyhint="go"
        placeholder="you@email.com"
        :invalid="!!error"
        :error="error"
      />

      <button class="auth-cta" type="submit" :disabled="sending" :aria-busy="sending">
        <AuthSubmitMark :busy="sending" />
        <span>{{ sending ? 'Sending…' : 'Continue' }}</span>
      </button>

      <p class="auth-quiet">No password needed.</p>
    </form>

    <div v-else role="status" aria-live="polite">
      <h1 class="auth-title">Check your email</h1>
      <p class="auth-quiet" style="text-align: left; margin: 0.85rem 0 0">
        We sent a secure Faneqo sign-in link to
        <span style="color: #f5f5f6; font-weight: 600">{{ emailMasked || 'your email' }}</span>.
        Tap the link to continue.
      </p>
      <p v-if="resent" class="auth-success">Link sent again.</p>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; margin-top: 1.5rem">
        <button class="auth-ghost" type="button" :disabled="sending" @click="resend">
          {{ sending ? 'Sending…' : 'Resend link' }}
        </button>
        <button class="auth-ghost" type="button" :disabled="sending" @click="editEmail">
          Use a different email
        </button>
      </div>
    </div>
  </AuthShell>
</template>

<script setup>
import { computed, nextTick, onMounted, watch } from 'vue'
import { useFanLogin } from '~/composables/useFanLogin'
import { resolveFanLoginReturnTo } from '~/utils/fan/safeFanReturnTo'
import AuthShell from '~/components/auth/AuthShell.vue'
import AuthField from '~/components/auth/AuthField.vue'
import AuthSubmitMark from '~/components/auth/AuthSubmitMark.vue'

definePageMeta({
  layout: 'auth',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Sign in · Faneqo',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const route = useRoute()
const router = useRouter()
const user = useStrapiUser()
const intendedReturnTo = computed(() => resolveFanLoginReturnTo(route.query.redirect, { fallback: null }))
const { email, step, sending, error, emailMasked, resent, send, editEmail } = useFanLogin({
  returnTo: intendedReturnTo,
})

const signedInDestination = () => resolveFanLoginReturnTo(route.query.redirect)

function submit() {
  send({ returnTo: intendedReturnTo.value })
}

function resend() {
  send({ resend: true, returnTo: intendedReturnTo.value })
}

function focusEmail() {
  if (typeof document === 'undefined') return
  document.getElementById('fan-login-email')?.focus?.()
}

onMounted(() => {
  if (user.value) {
    router.replace(signedInDestination())
    return
  }
  if (!email.value) {
    try {
      const stored = localStorage.getItem('mbq_fan_email')
      if (stored) email.value = stored
    } catch {
      // Prefill is a convenience only.
    }
  }
  focusEmail()
})

watch(user, (next) => {
  if (next) router.replace(signedInDestination())
})

watch(step, async (next) => {
  if (next !== 'form') return
  await nextTick()
  focusEmail()
})
</script>
