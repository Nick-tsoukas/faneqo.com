/**
 * Returning fan sign-in — passwordless magic link.
 *
 * Reuses the existing POST /api/fan-account/request-link endpoint. State is
 * page-local on purpose: useFanAccountConversion owns a shared prompt state
 * machine driven by the global FanAccountPrompt modal, and a login screen must
 * not leave that modal parked mid-flow.
 */

import { ref, unref } from 'vue'
import { useFanIdentity } from '~/composables/useFanIdentity'
import { sanitizeFanReturnTo } from '~/utils/fan/safeFanReturnTo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useFanLogin(options = {}) {
  const config = useRuntimeConfig()
  const { getVisitorToken } = useFanIdentity()

  const email = ref('')
  const step = ref('form') // form | sent
  const sending = ref(false)
  const error = ref('')
  const emailMasked = ref('')
  const resent = ref(false)

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase()
  }

  async function send({ resend = false, returnTo } = {}) {
    if (sending.value) return { ok: false }

    const normalized = normalizeEmail(email.value)
    if (!EMAIL_RE.test(normalized)) {
      error.value = 'Enter a valid email address.'
      return { ok: false }
    }

    sending.value = true
    error.value = ''

    try {
      const body = { email: normalized, trigger: 'fan_login' }
      const visitorToken = getVisitorToken()
      if (visitorToken) body.visitorToken = visitorToken
      const dest = sanitizeFanReturnTo(returnTo ?? unref(options.returnTo), { fallback: null })
      if (dest) body.returnTo = dest

      const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/request-link`, {
        method: 'POST',
        body,
      })

      // Response is deliberately generic — it never confirms the account exists.
      emailMasked.value = res?.data?.emailMasked || ''
      step.value = 'sent'
      resent.value = resend
      return { ok: true }
    } catch (err) {
      const name = err?.data?.error?.name || ''
      error.value =
        name === 'email_required'
          ? 'Enter the email you use with artists on Faneqo.'
          : 'Could not send your sign-in link. Try again shortly.'
      return { ok: false }
    } finally {
      sending.value = false
    }
  }

  function editEmail() {
    step.value = 'form'
    resent.value = false
    error.value = ''
  }

  return {
    email,
    step,
    sending,
    error,
    emailMasked,
    resent,
    send,
    editEmail,
  }
}
