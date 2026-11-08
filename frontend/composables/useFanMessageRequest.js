/**
 * Artist-page Message action + request composer.
 * Does not invent a second account for band owners.
 */
import { inboxUiLog } from '~/utils/messages/inboxUiLog'
import { artistMessageReturnTo, hasMessageIntent, stripMessageIntentQuery } from '~/utils/fan/messageIntent'
import { trackFanPassport } from '~/utils/fan/passportAnalytics'

export function useFanMessageRequest() {
  const inbox = useInbox()
  const user = useStrapiUser()
  const token = useStrapiToken()
  const route = useRoute()
  const config = useRuntimeConfig()
  const { requestLink, prompt } = useFanAccountConversion()
  const messageIntentHandled = ref(false)

  const status = ref({
    state: 'unauthenticated',
    artist: null,
    conversationId: null,
    needsFirstName: false,
    firstName: '',
    lastName: '',
  })
  const activeArtist = ref({
    bandId: null,
    bandName: '',
    bandSlug: '',
    artistImage: '',
  })
  const loading = ref(false)
  const sending = ref(false)
  const sheetOpen = ref(false)
  const sheetStep = ref('auth') // auth | name | compose | sent | pending | success | unavailable
  const error = ref('')

  const label = computed(() => 'Message')

  const disabled = computed(() => status.value.state === 'unavailable')

  function rememberArtist({ bandId, bandName, bandSlug, artistImage } = {}) {
    if (bandId != null) activeArtist.value.bandId = bandId
    if (bandName) activeArtist.value.bandName = bandName
    if (bandSlug) activeArtist.value.bandSlug = bandSlug
    if (artistImage) activeArtist.value.artistImage = artistImage
  }

  async function loadStatus(bandId) {
    if (!bandId) return
    if (!token.value || !user.value) {
      status.value = { state: 'unauthenticated', artist: null, conversationId: null, needsFirstName: false }
      return
    }
    loading.value = true
    try {
      const data = await inbox.getFanMessageStatus({ bandId })
      status.value = {
        state: data?.state || 'can_request',
        artist: data?.artist || null,
        conversationId: data?.conversationId || null,
        needsFirstName: !!data?.needsFirstName,
        firstName: data?.firstName || '',
        lastName: data?.lastName || '',
      }
      inboxUiLog('message-status', { bandId, state: status.value.state })
    } catch (err) {
      if (err?.status === 401 || err?.statusCode === 401) {
        status.value = { state: 'unauthenticated', artist: null, conversationId: null, needsFirstName: false }
      } else {
        status.value = { ...status.value, state: 'unavailable' }
      }
    } finally {
      loading.value = false
    }
  }

  function openSheet(step) {
    error.value = ''
    sheetStep.value = step
    sheetOpen.value = true
  }

  function closeSheet() {
    sheetOpen.value = false
    error.value = ''
  }

  async function onMessageTap({ bandId, bandName, bandSlug, artistImage } = {}) {
    if (prompt.value.visible) prompt.value.visible = false
    rememberArtist({ bandId, bandName, bandSlug, artistImage })
    if (status.value.state === 'unavailable') {
      openSheet('unavailable')
      return
    }
    if (status.value.state === 'pending') {
      openSheet('pending')
      return
    }
    if (!token.value || !user.value || status.value.state === 'unauthenticated') {
      prompt.value.trigger = 'message_click'
      prompt.value.context = {
        bandName: bandName || activeArtist.value.bandName,
        bandId: bandId || activeArtist.value.bandId,
        bandSlug: bandSlug || activeArtist.value.bandSlug,
        source: 'message',
      }
      openSheet('auth')
      return
    }
    if (status.value.state === 'conversation' && status.value.conversationId) {
      navigateTo(`/fan/messages/${status.value.conversationId}`)
      return
    }
    if (status.value.state === 'needs_name') {
      openSheet('name')
      return
    }
    openSheet('compose')
  }

  async function beginArtistRequest({ bandId, bandName, bandSlug, artistImage } = {}) {
    rememberArtist({ bandId, bandName, bandSlug, artistImage })
    await loadStatus(bandId)
    await onMessageTap({ bandId, bandName, bandSlug, artistImage })
  }

  async function sendAuthLink({ email, bandName }) {
    prompt.value.trigger = 'message_click'
    prompt.value.context = { bandName }
    sending.value = true
    error.value = ''
    try {
      const slug = activeArtist.value.bandSlug || route.params.bandSlug
      const result = await requestLink({
        email,
        returnTo: artistMessageReturnTo(slug) || route.fullPath,
      })
      if (result?.ok) sheetStep.value = 'sent'
      else if (result?.needsEmail) error.value = 'Enter the email you use with artists on Faneqo.'
      else error.value = prompt.value.error || 'Could not send a sign-in link.'
    } finally {
      sending.value = false
    }
  }

  async function consumeMessageIntent({ bandId, bandName, bandSlug, artistImage } = {}) {
    if (messageIntentHandled.value) return false
    if (!hasMessageIntent(route.query)) return false
    if (!user.value || !token.value || !bandId) return false
    messageIntentHandled.value = true
    const nextQuery = stripMessageIntentQuery(route.query)
    await navigateTo({ path: route.path, query: nextQuery }, { replace: true })
    trackFanPassport('fan_passport_resumed', {
      strapiUrl: config.public.strapiUrl,
      bandId,
      bandSlug,
      source: 'message',
      trigger: 'message_click',
    })
    await loadStatus(bandId)
    await onMessageTap({ bandId, bandName, bandSlug, artistImage })
    return true
  }

  async function saveNameAndContinue({ bandId, firstName, lastName }) {
    const id = bandId || activeArtist.value.bandId
    sending.value = true
    error.value = ''
    try {
      await inbox.updateFanProfile({ bandId: id, firstName, lastName })
      status.value = { ...status.value, needsFirstName: false, firstName, lastName, state: 'can_request' }
      sheetStep.value = 'compose'
    } catch (err) {
      error.value = err?.inboxCopy?.body || 'Could not save your name.'
    } finally {
      sending.value = false
    }
  }

  async function sendRequest({ bandId, bodyText, firstName, lastName }) {
    const id = bandId || activeArtist.value.bandId
    sending.value = true
    error.value = ''
    try {
      const result = await inbox.createFanMessageRequest({
        bandId: id,
        bodyText,
        firstName,
        lastName,
      })
      if (result?.existingConversation && result.conversationId) {
        closeSheet()
        navigateTo(`/fan/messages/${result.conversationId}`)
        return
      }
      status.value = { ...status.value, state: 'pending' }
      sheetStep.value = 'success'
    } catch (err) {
      if (err?.data?.error?.name === 'needs_first_name') {
        sheetStep.value = 'name'
        return
      }
      error.value = err?.inboxCopy?.body || 'Could not send your request.'
    } finally {
      sending.value = false
    }
  }

  return {
    status,
    loading,
    sending,
    sheetOpen,
    sheetStep,
    error,
    label,
    disabled,
    activeArtist,
    loadStatus,
    onMessageTap,
    beginArtistRequest,
    closeSheet,
    sendAuthLink,
    consumeMessageIntent,
    saveNameAndContinue,
    sendRequest,
  }
}
