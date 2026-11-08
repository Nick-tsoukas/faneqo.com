/**
 * Artist Page native Follow. Same canonical Fan row. No social modal.
 */

import { useStrapiToken, useStrapiUser } from '#imports'
import { useFanAccountConversion } from '~/composables/useFanAccountConversion'
import {
  artistFollowReturnTo,
  hasFollowIntent,
  isContactableFan,
  isFollowingFan,
  readArtistRelSession,
  stripFollowIntentQuery,
  writeArtistRelSession,
} from '~/utils/fan/artistFollow'
import { trackFanPassport } from '~/utils/fan/passportAnalytics'

export function useArtistPageFollow({
  bandId,
  bandSlug,
  bandName,
  onAnonymousFollow,
  onConfirmUnfollow,
} = {}) {
  const config = useRuntimeConfig()
  const user = useStrapiUser()
  const strapiToken = useStrapiToken()
  const route = useRoute()
  const router = useRouter()
  const { ensureSession, getVisitorToken } = useFanIdentity()
  const { showAfterFollowIntent } = useFanAccountConversion()

  const isFollowing = ref(false)
  const isSubscribed = ref(false)
  const sessionFollowed = ref(false)
  const sessionSubscribed = ref(false)
  const followBusy = ref(false)
  const followError = ref('')
  const intentConsumed = ref(false)

  const followed = computed(() => isFollowing.value || (!user.value && sessionFollowed.value))
  const contactable = computed(() => isSubscribed.value || (!user.value && sessionSubscribed.value))

  function persistSessionRel() {
    writeArtistRelSession(bandId?.value, {
      followed: followed.value,
      subscribed: contactable.value,
    })
  }

  function restoreSessionRel() {
    if (user.value) return
    const saved = readArtistRelSession(bandId?.value)
    if (!saved) return
    if (saved.followed) sessionFollowed.value = true
    if (saved.subscribed) sessionSubscribed.value = true
  }

  function headers() {
    if (!strapiToken.value) return {}
    return { Authorization: `Bearer ${strapiToken.value}` }
  }

  async function refreshFollowState() {
    if (!user.value || !strapiToken.value || !bandId?.value) {
      restoreSessionRel()
      if (!sessionFollowed.value) isFollowing.value = false
      if (!sessionSubscribed.value) isSubscribed.value = false
      return false
    }
    try {
      const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/artists`, {
        headers: headers(),
      })
      const artists = res?.data?.artists || []
      const match = artists.find((row) => String(row.bandId) === String(bandId.value))
      isFollowing.value = isFollowingFan(match)
      isSubscribed.value = isContactableFan(match)
      if (isFollowing.value) sessionFollowed.value = false
      if (isSubscribed.value) sessionSubscribed.value = false
      persistSessionRel()
      return true
    } catch {
      return false
    }
  }

  async function clearFollowIntentFromUrl() {
    if (!hasFollowIntent(route.query)) return
    const query = stripFollowIntentQuery(route.query)
    await router.replace({ path: route.path, query })
  }

  async function follow() {
    if (followBusy.value) return { ok: false, reason: 'busy' }
    if (!user.value || !strapiToken.value || !bandId?.value) {
      return { ok: false, reason: 'unauthorized' }
    }
    followBusy.value = true
    followError.value = ''
    try {
      const res = await $fetch(
        `${config.public.strapiUrl}/api/fan-account/artists/${bandId.value}/follow`,
        { method: 'POST', headers: headers() }
      )
      isFollowing.value = !!res?.data?.isFollowing
      if (!isFollowing.value) {
        followError.value = 'Could not follow this artist. Try again.'
        return { ok: false, reason: 'not_following' }
      }
      sessionFollowed.value = false
      return { ok: true }
    } catch {
      followError.value = 'Could not follow this artist. Try again.'
      return { ok: false, reason: 'error' }
    } finally {
      followBusy.value = false
    }
  }

  function clearLocalRelationship() {
    isFollowing.value = false
    isSubscribed.value = false
    sessionFollowed.value = false
    sessionSubscribed.value = false
    writeArtistRelSession(bandId?.value, { followed: false, subscribed: false })
  }

  async function endRelationship() {
    if (followBusy.value) return { ok: false, reason: 'busy' }
    if (!bandId?.value) return { ok: false, reason: 'missing_band' }

    followBusy.value = true
    followError.value = ''
    try {
      const body = {}
      const requestHeaders = headers()
      if (!user.value || !strapiToken.value) {
        await ensureSession().catch(() => {})
        const visitorToken = getVisitorToken()
        if (!visitorToken) {
          followError.value = 'Could not unfollow. Try again.'
          return { ok: false, reason: 'no_identity' }
        }
        body.visitorToken = visitorToken
      }

      const res = await $fetch(
        `${config.public.strapiUrl}/api/fan-account/artists/${bandId.value}/unfollow`,
        { method: 'POST', headers: requestHeaders, body }
      )
      if (res?.data?.isFollowing) {
        followError.value = 'Could not unfollow. Try again.'
        return { ok: false, reason: 'still_following' }
      }
      clearLocalRelationship()
      return { ok: true }
    } catch {
      followError.value = 'Could not unfollow. Try again.'
      return { ok: false, reason: 'error' }
    } finally {
      followBusy.value = false
    }
  }

  async function onFollowAction() {
    if (followBusy.value) return
    followError.value = ''

    if (followed.value) {
      if (typeof onConfirmUnfollow === 'function') {
        onConfirmUnfollow()
      }
      return
    }

    if (!user.value) {
      if (typeof onAnonymousFollow === 'function') {
        onAnonymousFollow()
        return
      }
      const slug = bandSlug?.value || ''
      showAfterFollowIntent({
        bandName: bandName?.value,
        returnTo: artistFollowReturnTo(slug) || route.fullPath,
      })
      return
    }

    const result = await follow()
    if (!result.ok && typeof onAnonymousFollow === 'function') {
      followError.value = ''
      onAnonymousFollow()
    }
  }

  function markSessionFollowed({ subscribed = false } = {}) {
    sessionFollowed.value = true
    if (subscribed) sessionSubscribed.value = true
    writeArtistRelSession(bandId?.value, {
      followed: true,
      subscribed: subscribed || sessionSubscribed.value || isSubscribed.value,
    })
  }

  async function consumeFollowIntent() {
    if (intentConsumed.value) return
    if (!hasFollowIntent(route.query)) return
    if (!user.value || !strapiToken.value || !bandId?.value) return
    intentConsumed.value = true
    await clearFollowIntentFromUrl()
    if (!isFollowing.value) {
      const result = await follow()
      if (!result?.ok) return
    }
    trackFanPassport('fan_passport_resumed', {
      strapiUrl: config.public.strapiUrl,
      bandId: bandId?.value,
      bandSlug: bandSlug?.value,
      source: 'follow',
      trigger: 'follow_intent',
    })
  }

  watch(
    [() => user.value?.id, () => bandId?.value, () => strapiToken.value],
    () => {
      refreshFollowState()
    },
    { immediate: true }
  )

  watch(
    [() => user.value?.id, () => bandId?.value, () => route.query.feq_intent, () => strapiToken.value],
    () => {
      consumeFollowIntent()
    },
    { immediate: true }
  )

  function offerFollowPassport(email) {
    const slug = bandSlug?.value || ''
    return showAfterFollowIntent({
      bandName: bandName?.value,
      returnTo: artistFollowReturnTo(slug) || route.fullPath,
      email,
    })
  }

  return {
    followed,
    contactable,
    isFollowing,
    isSubscribed,
    followBusy,
    followError,
    refreshFollowState,
    onFollowAction,
    endRelationship,
    markSessionFollowed,
    consumeFollowIntent,
    offerFollowPassport,
  }
}
