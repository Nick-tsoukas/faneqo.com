<template>
  <AuthShell>
    <div v-if="state === 'loading'" class="auth-verify">
      <p class="auth-quiet" style="text-align: left">Verifying your account…</p>
    </div>

    <div v-else-if="state === 'success'" class="auth-verify">
      <h1 class="auth-title">You're in</h1>
      <p class="auth-quiet" style="text-align: left; margin-top: 0.85rem">
        <template v-if="artistCount > 0">
          Linked {{ artistCount }} artist{{ artistCount === 1 ? '' : 's' }} to your account.
        </template>
        <template v-else>
          You can keep artists, saves and messages together going forward.
        </template>
      </p>
    </div>

    <div v-else class="auth-verify">
      <h1 class="auth-title">{{ errorTitle }}</h1>
      <p class="auth-error">{{ errorMessage }}</p>
      <NuxtLink to="/fan/login" class="auth-cta" style="margin-top: 1.25rem; text-decoration: none">
        Send a new link
      </NuxtLink>
      <p class="auth-switch">
        <NuxtLink to="/">Back to Faneqo</NuxtLink>
      </p>
    </div>
  </AuthShell>
</template>

<script setup>
import { FAN_VERIFY_FALLBACK, resolveFanLoginReturnTo } from '~/utils/fan/safeFanReturnTo'
import { hasFollowIntent } from '~/utils/fan/artistFollow'
import { hasMessageIntent } from '~/utils/fan/messageIntent'
import { trackFanPassport } from '~/utils/fan/passportAnalytics'
import AuthShell from '~/components/auth/AuthShell.vue'

definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { setToken, fetchUser } = useStrapiAuth()

const state = ref('loading')
const artistCount = ref(0)
const errorTitle = ref('Link unavailable')
const errorMessage = ref('This sign-in link is invalid or expired.')

onMounted(async () => {
  const token = typeof route.query.token === 'string' ? route.query.token : ''
  if (!token) {
    state.value = 'error'
    errorTitle.value = 'Missing link'
    errorMessage.value = 'This sign-in link is incomplete. Request a new one from Faneqo.'
    return
  }

  try {
    const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/verify`, {
      method: 'POST',
      body: { token },
    })

    const jwt = res?.data?.jwt
    if (!jwt) throw new Error('no_jwt')

    setToken(jwt)
    await fetchUser()

    artistCount.value = res?.data?.claim?.artistCount || 0
    state.value = 'success'

    const destination = resolveFanLoginReturnTo(res?.data?.redirectTo, { fallback: FAN_VERIFY_FALLBACK })
    const destQuery = Object.fromEntries(new URLSearchParams(String(destination).split('?')[1] || ''))
    const source = hasMessageIntent(destQuery)
      ? 'message'
      : hasFollowIntent(destQuery)
        ? 'follow'
        : 'account'
    const slug = String(destination || '').split('?')[0].split('/').filter(Boolean)[0] || ''
    trackFanPassport('fan_passport_verified', {
      strapiUrl: config.public.strapiUrl,
      bandSlug: slug && slug !== 'fan' ? slug : '',
      source,
    })

    setTimeout(() => {
      router.replace(destination)
    }, 700)
  } catch (err) {
    const name = err?.data?.error?.name || ''
    state.value = 'error'
    if (name === 'token_expired') {
      errorTitle.value = 'Link expired'
      errorMessage.value = 'This sign-in link has expired. Request a new one from Faneqo.'
    } else if (name === 'token_used') {
      errorTitle.value = 'Link already used'
      errorMessage.value = 'This sign-in link was already used. Sign in again if you need another link.'
    } else {
      errorTitle.value = 'Could not verify'
      errorMessage.value =
        err?.data?.error?.message || 'This sign-in link is invalid. Request a new one from Faneqo.'
    }
    if (route.query.token) {
      router.replace({ path: '/fan/verify', query: {} })
    }
  }
})
</script>
