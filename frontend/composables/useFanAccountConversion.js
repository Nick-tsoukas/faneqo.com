/**
 * Fan account conversion — prompt orchestration + magic-link request.
 * Presentation is separate (FanAccountPrompt.vue). Trigger selection is server-led.
 */

import { useStrapiToken, useStrapiUser } from '#imports'
import { isFanAccountPromptsEnabled, isFanPassportInvitesEnabled } from '~/config/fanAccountFeatureFlags'
import { useFanIdentity } from '~/composables/useFanIdentity'
import { sanitizeFanReturnTo } from '~/utils/fan/safeFanReturnTo'
import { passportSource, trackFanPassport } from '~/utils/fan/passportAnalytics'

const PROMPT_STATE_KEY = 'faneqo-fan-account-prompt'
const FAN_LIST_JOIN_DISMISS_KEY = 'faneqo-fan-list-join-dismissed'
const FOLLOW_INTENT_DISMISS_KEY = 'faneqo-follow-intent-dismissed'

function inviteSkipKey(trigger, bandId) {
  return `faneqo-passport-skip:${trigger}:${bandId || 'any'}`
}

function inviteSkipped(trigger, bandId) {
  if (typeof sessionStorage === 'undefined') return false
  try {
    return sessionStorage.getItem(inviteSkipKey(trigger, bandId)) === '1'
  } catch {
    return false
  }
}

function rememberInviteSkip(trigger, bandId) {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(inviteSkipKey(trigger, bandId), '1')
  } catch {
    /* private mode */
  }
}

function passportPhotos(photos) {
  if (!Array.isArray(photos)) return []
  return photos
    .map((photo) => ({
      src: photo?.src || photo?.thumbnailUrl || photo?.url || '',
      alt: photo?.alt || '',
    }))
    .filter((photo) => photo.src)
    .slice(0, 3)
}

function copyForTrigger(trigger, context = {}) {
  const count = context.joinedArtistCount || 0
  const names = Array.isArray(context.artistNames) ? context.artistNames.filter(Boolean) : []
  const bandName = context.bandName || names[0] || 'this artist'
  const namePair =
    names.length >= 2
      ? `${names[0]} and ${names[1]}`
      : names[0] || 'your artists'

  switch (trigger) {
    case 'second_artist':
      return {
        title: `You're following ${count || 2} artists on Faneqo`,
        body: names.length >= 2
          ? `Keep ${namePair} together.`
          : 'Keep the artists you follow together.',
        detail: 'Get artist messages, saved artists and your shows in one place.',
        cta: 'Create free account',
      }
    case 'repeat_show':
      return {
        title: `You've seen ${bandName} more than once`,
        body: 'Keep your shows, artists and messages together on Faneqo.',
        detail: 'A free account works across your devices.',
        cta: 'Keep my artists',
      }
    case 'message_click':
      return {
        title: 'Get artist messages inside Faneqo',
        body: 'Keep updates from the artists you follow in one place.',
        detail: 'Free — no password form to start.',
        cta: 'Create free account',
      }
    case 'return_visit':
      return {
        title: 'Welcome back',
        body: 'Keep the artists you follow and their messages together with a free Faneqo account.',
        detail: 'Continue with a one-tap email link.',
        cta: 'Create free account',
      }
    case 'save_attempt':
      return {
        title: 'Save this artist everywhere',
        body: 'Create a free Faneqo account to keep your artists across devices.',
        detail: 'Your save still works on this device either way.',
        cta: 'Keep my artists',
      }
    case 'fan_list_join':
      return {
        title: 'You’re on the list.',
        body: 'Now keep the artists you love in one place.',
        detail: '',
        cta: 'Create your free Fan Passport',
        dismiss: 'Maybe later',
      }
    case 'follow_saved':
      return {
        title: `You’re following ${bandName}.`,
        body: 'Take your connection with you.',
        detail: 'A free Fan Passport keeps the artists you follow together.',
        cta: 'Create your free Fan Passport',
        dismiss: 'Not now',
      }
    case 'gallery':
      return {
        title: `Keep ${bandName} with you.`,
        body: 'Future galleries and messages can live with the artists you follow.',
        detail: '',
        cta: 'Create your free Fan Passport',
        dismiss: 'Not now',
      }
    case 'follow_intent':
      return {
        title: `Sign in to follow ${bandName}`,
        body: 'Use the email on your Fan Passport. We’ll send a one-tap link.',
        detail: 'Then you’ll be following this artist.',
        cta: 'Send sign-in link',
        dismiss: 'Not now',
      }
    default:
      return {
        title: 'Keep your artists together',
        body: 'Create a free Faneqo account for messages, saves and shows in one place.',
        detail: '',
        cta: 'Create free account',
      }
  }
}

export function useFanAccountConversion() {
  const config = useRuntimeConfig()
  const { getVisitorToken, ensureSession, state: identityState } = useFanIdentity()
  const user = useStrapiUser()

  const prompt = useState(PROMPT_STATE_KEY, () => ({
    visible: false,
    loading: false,
    sending: false,
    step: 'prompt', // prompt | check_email | done
    trigger: null,
    priority: 0,
    presentation: 'modal',
    context: {},
    copy: null,
    emailMasked: null,
    emailInput: '',
    needsEmail: false,
    error: null,
    accountState: 'anonymous',
  }))
  const fanListJoinDismissed = useState(FAN_LIST_JOIN_DISMISS_KEY, () => false)
  const followIntentDismissed = useState(FOLLOW_INTENT_DISMISS_KEY, () => false)

  const accountState = computed(() => {
    if (user.value && prompt.value.accountState === 'authenticated_fan') {
      return 'authenticated_fan'
    }
    if (user.value) return prompt.value.accountState || 'authenticated_user'
    return prompt.value.accountState || (identityState.value.joinedArtistCount > 0 ? 'known_fan' : 'anonymous')
  })

  async function refreshAccountState() {
    try {
      const token = getVisitorToken()
      const strapiToken = useStrapiToken()
      const headers = {}
      if (strapiToken.value) {
        headers.Authorization = `Bearer ${strapiToken.value}`
      }
      const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/me`, {
        params: token ? { visitorToken: token } : {},
        headers,
      })
      prompt.value.accountState = res?.data?.accountState || 'anonymous'
      return prompt.value.accountState
    } catch {
      return accountState.value
    }
  }

  async function evaluateEligibility(context = {}) {
    if (user.value) {
      await refreshAccountState()
      if (['authenticated_fan', 'authenticated_user'].includes(prompt.value.accountState)) {
        return { eligible: false, reason: 'already_authenticated' }
      }
    }

    await ensureSession()
    const visitorToken = getVisitorToken()

    try {
      const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/eligibility`, {
        method: 'POST',
        body: { visitorToken, context },
      })
      const data = res?.data || {}
      prompt.value.accountState = data.accountState || prompt.value.accountState
      return data
    } catch (err) {
      console.warn('[FanAccount] eligibility failed', err)
      return { eligible: false, reason: 'error' }
    }
  }

  async function maybeShowPrompt(context = {}) {
    if (!isFanAccountPromptsEnabled()) return false
    if (prompt.value.visible) return false
    if (user.value) return false

    const data = await evaluateEligibility(context)
    if (!data?.eligible || !data.trigger) return false

    prompt.value = {
      ...prompt.value,
      visible: true,
      loading: false,
      sending: false,
      step: 'prompt',
      trigger: data.trigger,
      priority: data.priority || 0,
      presentation: data.presentation || 'modal',
      context: data.context || {},
      copy: copyForTrigger(data.trigger, data.context || {}),
      emailMasked: null,
      emailInput: '',
      needsEmail: false,
      error: null,
    }

    // Start hard frequency window (not a dismiss)
    try {
      await $fetch(`${config.public.strapiUrl}/api/fan-account/prompt-shown`, {
        method: 'POST',
        body: { visitorToken: getVisitorToken(), trigger: data.trigger },
      })
    } catch {
      /* non-blocking */
    }

    return true
  }

  /** Save trigger — never blocks anonymous save. */
  async function onSaveAttempt(context = {}) {
    return maybeShowPrompt({ ...context, trigger: 'save_attempt', saveAttempt: true })
  }

  /** Message-click attribution hook (no credentials in URLs). */
  async function onMessageClick(context = {}) {
    return maybeShowPrompt({ ...context, trigger: 'message_click', messageClick: true })
  }

  /**
   * Post-join continuation only. Does not flip the global prompt flag
   * and does not use eligibility (first join is intentionally ineligible).
   */
  function presentInvite({
    trigger,
    email,
    bandName,
    returnTo,
    artistImage,
    photos,
    bandId,
    bandSlug,
    needsEmail,
  } = {}) {
    if (user.value) return false
    if (!isFanPassportInvitesEnabled()) return false
    if (prompt.value.visible) return false
    if (inviteSkipped(trigger, bandId)) return false

    const name = String(bandName || '').trim()
    const normalized = String(email || '').trim().toLowerCase()
    const context = {
      bandName: name || 'this artist',
      artistNames: name ? [name] : [],
      returnTo: sanitizeFanReturnTo(returnTo, { fallback: null }),
      artistImage: artistImage || '',
      photos: passportPhotos(photos),
      bandId: bandId || null,
      bandSlug: bandSlug || '',
      source: passportSource(trigger),
    }

    prompt.value = {
      ...prompt.value,
      visible: true,
      loading: false,
      sending: false,
      step: 'prompt',
      trigger,
      priority: 0,
      presentation: 'modal',
      context,
      copy: copyForTrigger(trigger, context),
      emailMasked: null,
      emailInput: normalized,
      needsEmail: needsEmail != null ? needsEmail : !normalized,
      error: null,
    }
    trackFanPassport('fan_passport_shown', {
      strapiUrl: config.public.strapiUrl,
      bandId: context.bandId,
      bandSlug: context.bandSlug,
      source: context.source,
      trigger,
    })
    return true
  }

  function showAfterFanJoin({ email, bandName, returnTo, artistImage, photos, bandId, bandSlug } = {}) {
    if (user.value) return false
    if (prompt.value.visible) return false
    if (fanListJoinDismissed.value) return false
    return presentInvite({
      trigger: 'fan_list_join',
      email,
      bandName,
      returnTo,
      artistImage,
      photos,
      bandId,
      bandSlug,
      needsEmail: !String(email || '').trim(),
    })
  }

  /**
   * Anonymous Follow continuation. Does not flip the global prompt flag
   * and does not subscribe email or create a Fan until auth completes Follow.
   */
  function showAfterFollowIntent({ bandName, returnTo, email } = {}) {
    if (user.value) return false
    if (prompt.value.visible) return false
    if (followIntentDismissed.value) return false

    const name = String(bandName || '').trim()
    const context = {
      bandName: name || 'this artist',
      artistNames: name ? [name] : [],
      returnTo: sanitizeFanReturnTo(returnTo, { fallback: null }),
    }
    const normalized = String(email || '').trim().toLowerCase()

    prompt.value = {
      ...prompt.value,
      visible: true,
      loading: false,
      sending: false,
      step: 'prompt',
      trigger: 'follow_intent',
      priority: 0,
      presentation: 'modal',
      context,
      copy: copyForTrigger('follow_intent', context),
      emailMasked: null,
      emailInput: normalized,
      needsEmail: true,
      error: null,
    }

    return true
  }

  function showAfterFollowSaved({ email, bandName, returnTo, artistImage, photos, bandId, bandSlug } = {}) {
    return presentInvite({
      trigger: 'follow_saved',
      email,
      bandName,
      returnTo,
      artistImage,
      photos,
      bandId,
      bandSlug,
      needsEmail: !String(email || '').trim(),
    })
  }

  function showAfterGallery({ email, bandName, returnTo, artistImage, photos, bandId, bandSlug } = {}) {
    return presentInvite({
      trigger: 'gallery',
      email,
      bandName,
      returnTo,
      artistImage,
      photos,
      bandId,
      bandSlug,
      needsEmail: !String(email || '').trim(),
    })
  }

  async function dismiss() {
    const visitorToken = getVisitorToken()
    const trigger = prompt.value.trigger
    if (trigger === 'fan_list_join') fanListJoinDismissed.value = true
    if (trigger === 'follow_intent') followIntentDismissed.value = true
    if (trigger === 'fan_list_join' || trigger === 'follow_saved' || trigger === 'gallery') {
      rememberInviteSkip(trigger, prompt.value.context?.bandId)
    }
    trackFanPassport('fan_passport_dismissed', {
      strapiUrl: config.public.strapiUrl,
      bandId: prompt.value.context?.bandId,
      bandSlug: prompt.value.context?.bandSlug,
      source: prompt.value.context?.source,
      trigger,
    })
    prompt.value.visible = false
    prompt.value.step = 'prompt'
    try {
      await $fetch(`${config.public.strapiUrl}/api/fan-account/dismiss`, {
        method: 'POST',
        body: { visitorToken, trigger },
      })
    } catch {
      /* still hide locally */
    }
  }

  async function requestLink({ email, returnTo } = {}) {
    prompt.value.sending = true
    prompt.value.error = null

    try {
      const body = {
        visitorToken: getVisitorToken(),
        trigger: prompt.value.trigger,
      }
      if (email || prompt.value.emailInput) {
        body.email = email || prompt.value.emailInput
      }
      const dest = sanitizeFanReturnTo(returnTo, { fallback: null })
      if (dest) body.returnTo = dest

      const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/request-link`, {
        method: 'POST',
        body,
      })

      prompt.value.step = 'check_email'
      prompt.value.emailMasked = res?.data?.emailMasked || null
      prompt.value.needsEmail = false
      trackFanPassport('fan_passport_link_requested', {
        strapiUrl: config.public.strapiUrl,
        bandId: prompt.value.context?.bandId,
        bandSlug: prompt.value.context?.bandSlug,
        source: passportSource(prompt.value.trigger),
        trigger: prompt.value.trigger,
      })
      return { ok: true, emailMasked: prompt.value.emailMasked }
    } catch (err) {
      const name = err?.data?.error?.name || err?.data?.error || ''
      if (name === 'email_required') {
        prompt.value.needsEmail = true
        prompt.value.error = 'Enter the email you use with artists on Faneqo.'
        return { ok: false, needsEmail: true }
      }
      prompt.value.error =
        err?.data?.error?.message || 'Could not send sign-in link. Try again shortly.'
      return { ok: false }
    } finally {
      prompt.value.sending = false
    }
  }

  function hide() {
    prompt.value.visible = false
  }

  return {
    prompt,
    accountState,
    copyForTrigger,
    refreshAccountState,
    evaluateEligibility,
    maybeShowPrompt,
    onSaveAttempt,
    onMessageClick,
    showAfterFanJoin,
    showAfterFollowIntent,
    showAfterFollowSaved,
    showAfterGallery,
    dismiss,
    requestLink,
    hide,
  }
}
