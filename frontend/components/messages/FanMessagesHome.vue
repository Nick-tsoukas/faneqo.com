<template>
  <div class="fan-msg fq-msg-accents" :class="{ 'is-thread-mobile': isThreadMobile }">
    <header v-if="!isThreadMobile" class="fan-msg__bar">
      <h1>Messages</h1>
      <MessagesTabCta
        v-if="user"
        class="fan-msg__cta"
        tab="inbox"
        label="Message an artist"
        @click="openArtistSearch"
      />
    </header>
    <p v-if="inboxNotice && !isThreadMobile" class="fan-msg__notice" role="status">{{ inboxNotice }}</p>

    <div v-if="!user" class="fan-msg__gate">
      <p>Sign in to see messages from artists you follow.</p>
      <NuxtLink to="/fan/login">Sign in</NuxtLink>
    </div>

    <div v-else-if="sessionExpired" class="fan-msg__status" role="alert">
      <p>Your session expired. Sign in again to keep messaging.</p>
      <NuxtLink to="/fan/login">Sign in</NuxtLink>
    </div>

    <div
      v-else-if="listLoading && !conversations.length && !selectedId"
      class="fan-msg__status"
      role="status"
    >
      Loading messages…
    </div>

    <div v-else-if="listError && !conversations.length && !selectedId" class="fan-msg__status">
      <p>Couldn't load your messages.</p>
      <button type="button" class="fan-msg__retry" @click="loadList">Try again</button>
    </div>

    <div v-else-if="!conversations.length && !requests.length && !selectedId" class="fan-msg__empty">
      <span class="fan-msg__empty-icon" aria-hidden="true">
        <component :is="icons.message" :size="26" :stroke-width="1.6" />
      </span>
      <h2>Your conversations</h2>
      <p>Messages from artists you care about live here.</p>
      <button type="button" class="fan-msg__cta-btn" @click="openArtistSearch">
        Message an artist
      </button>
    </div>

    <div v-else class="fan-msg__inbox">
      <FaneqoChat
        :current-user="currentUser"
        :conversations="inboxRows"
        :selected-conversation-id="selectedId"
        :messages="isRequestSelected ? [] : threadMessages"
        :loading="listLoading && !conversations.length && !requests.length && !selectedId"
        :load-error="listError && !conversations.length && !requests.length"
        :messages-error="threadError"
        :conversation-unavailable="threadUnavailable"
        viewer-role="fan"
        :conversation-blocked="threadBlocked"
        :conversation-removed="threadRemoved"
        :loading-older="loadingOlder"
        :messages-loading="threadLoading"
        :messages-ready="threadHistoryReady"
        empty-heading="Your conversations"
        empty-copy="Messages from artists you care about live here."
        @select-conversation="onSelect"
        @send-message="onSend"
        @retry-message="onRetry"
        @fetch-messages="onSelect"
        @retry-load="loadList"
        @retry-messages="openThread(selectedId)"
        @load-older="onLoadOlder"
        @block="onBlock"
        @unblock="onUnblock"
      />
    </div>

    <client-only>
      <BandSearchModal
        :is-open="artistSearchOpen"
        :link-results="false"
        heading="Message an artist"
        lead="Find an artist and send a message request."
        search-placeholder="Search artists..."
        @close="artistSearchOpen = false"
        @select="onPickArtist"
      />
      <FanMessageRequestSheet
        :open="messageSheetOpen"
        :step="messageSheetStep"
        :band-name="requestArtist.bandName || 'this artist'"
        :artist-image="requestArtist.artistImage || ''"
        :sending="messageSending"
        :error="messageError"
        :initial-first-name="messageStatus.firstName"
        :initial-last-name="messageStatus.lastName"
        @close="onRequestSheetClose"
        @done="onRequestSheetDone"
        @continue-free="onMessageContinueFree"
        @save-name="onMessageSaveName"
        @send="onMessageSendRequest"
      />
    </client-only>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useDocumentVisibility, useIntervalFn, useMediaQuery } from '@vueuse/core'
import FaneqoChat from '~/components/messages/FaneqoChat.vue'
import FanMessageRequestSheet from '~/components/band/FanMessageRequestSheet.vue'
import BandSearchModal from '~/components/BandSearchModal.vue'
import MessagesTabCta from '~/components/messages/MessagesTabCta.vue'
import { useInbox } from '~/composables/useInbox'
import { useFanMessageRequest } from '~/composables/useFanMessageRequest'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { inboxUiLog, newClientMessageId } from '~/utils/messages/inboxUiLog'
import { isRequestRowId } from '~/utils/messages/fanIdentity'
import {
  applyFanInboxPollTransition,
  conversationLoadFailureKind,
  fanNumericRouteTarget,
  matchPendingRequest,
  matchPendingRequestForUnavailableRoute,
} from '~/utils/messages/fanInboxSelection'
import { mapFanConversation, mapFanRequest, mapInboxMessage, mapOptimisticMessage } from '~/utils/messages/mapInboxModels'
import { isInboxAuthError, mergeInboxThread } from '~/utils/messages/threadMerge'

const props = defineProps({
  conversationId: { type: [String, Number], default: null },
})

const user = useStrapiUser()
const token = useStrapiToken()
const inbox = useInbox()
const {
  status: messageStatus,
  sending: messageSending,
  sheetOpen: messageSheetOpen,
  sheetStep: messageSheetStep,
  error: messageError,
  activeArtist: requestArtist,
  beginArtistRequest,
  closeSheet: closeMessageSheet,
  sendAuthLink,
  saveNameAndContinue,
  sendRequest: sendFanMessageRequest,
} = useFanMessageRequest()
const artistSearchOpen = ref(false)
const icons = faneqoIcons
const conversations = ref([])
const requests = ref([])
const isRequestSelected = computed(() => isRequestRowId(selectedId.value))
const inboxRows = computed(() => [...requests.value, ...conversations.value])
const listLoading = ref(true)
const listError = ref(false)
const selectedId = ref(props.conversationId ? String(props.conversationId) : null)
const threadMessages = ref([])
const threadError = ref(false)
const threadUnavailable = ref(false)
const inboxNotice = ref('')
const threadBlocked = ref(false)
const threadRemoved = ref(false)
const loadingOlder = ref(false)
const olderExhausted = ref(false)
const pendingReadByConversation = ref({})
const threadGen = ref(0)
const threadLoading = ref(!!props.conversationId)
const threadHydratedId = ref(null)
const sessionExpired = ref(false)
const visible = useDocumentVisibility()
const isMobile = useMediaQuery('(max-width: 899px)')
const isThreadMobile = computed(() => !!isMobile.value && !!selectedId.value)
const threadHistoryReady = computed(() =>
  !!selectedId.value &&
  !threadLoading.value &&
  String(threadHydratedId.value || '') === String(selectedId.value)
)

const currentUser = computed(() => ({
  id: user.value?.id ? String(user.value.id) : 'fan',
  displayName: 'You',
}))

function openArtistSearch() {
  artistSearchOpen.value = true
}

async function onPickArtist(band) {
  artistSearchOpen.value = false
  if (!band?.id) return
  inboxUiLog('fan:new-message:artist', { bandId: band.id })
  await beginArtistRequest({
    bandId: band.id,
    bandName: band.name,
    bandSlug: band.slug,
    artistImage: band.imageUrl || '',
  })
}

function onMessageContinueFree(email) {
  sendAuthLink({ email, bandName: requestArtist.value.bandName })
}

function onMessageSaveName({ firstName, lastName }) {
  saveNameAndContinue({
    bandId: requestArtist.value.bandId,
    firstName,
    lastName,
  })
}

function onMessageSendRequest(bodyText) {
  sendFanMessageRequest({
    bandId: requestArtist.value.bandId,
    bodyText,
    firstName: messageStatus.value.firstName,
    lastName: messageStatus.value.lastName,
  })
}

function onRequestSheetClose() {
  closeMessageSheet()
}

async function onRequestSheetDone() {
  closeMessageSheet()
  await loadList()
}

function applyInboxTransition(previousRequests, previousSelectedId = selectedId.value) {
  const transition = applyFanInboxPollTransition({
    selectedId: previousSelectedId,
    previousRequests,
    nextRequests: requests.value,
    nextConversations: conversations.value,
  })
  if (transition.action === 'open-conversation') {
    inboxNotice.value = ''
    navigateTo(`/fan/messages/${transition.conversationId}`)
    return
  }
  if (transition.action === 'clear') {
    inboxNotice.value = 'This message request is no longer available.'
    selectedId.value = null
    threadMessages.value = []
    threadHydratedId.value = null
    threadError.value = false
    threadUnavailable.value = false
    threadLoading.value = false
    navigateTo('/fan/messages')
  }
}

function selectPendingRequest(row) {
  selectedId.value = row.id
  threadMessages.value = []
  threadLoading.value = false
  threadError.value = false
  threadUnavailable.value = false
  threadHydratedId.value = null
  inboxNotice.value = ''
  if (props.conversationId) {
    navigateTo('/fan/messages', { replace: true })
  }
}

function rememberThreadArtist(cid, artist, extras = {}) {
  if (!artist?.id && !artist?.name) return
  const idx = conversations.value.findIndex((c) => String(c.id) === String(cid))
  const existing = idx >= 0 ? conversations.value[idx] : null
  const mapped = mapFanConversation({
    id: cid,
    artist,
    lastMessage: existing
      ? { preview: existing.lastMessagePreview, createdAt: existing.lastMessageAt }
      : null,
    unreadCount: existing?.unreadCount || 0,
    blocked: existing?.blocked || false,
    messagingAvailable: existing ? existing.messagingAvailable !== false : true,
    showCount: extras.showCount ?? existing?.showCount,
  })
  if (idx >= 0) {
    conversations.value = conversations.value.map((row, i) => (i === idx ? { ...row, ...mapped, artist: mapped.artist } : row))
    return
  }
  conversations.value = [mapped, ...conversations.value]
}

function clearUnavailableThread(cid, status) {
  inboxUiLog('thread:unavailable', { conversationId: String(cid || ''), status, role: 'fan' })
  inboxNotice.value = "This conversation isn't available."
  selectedId.value = null
  threadMessages.value = []
  threadHydratedId.value = null
  threadError.value = false
  threadUnavailable.value = false
  threadLoading.value = false
  navigateTo('/fan/messages')
}

async function loadList() {
  listLoading.value = !conversations.value.length && !requests.value.length
  listError.value = false
  const previousRequests = requests.value
  const previousSelectedId = selectedId.value
  try {
    const [data, requestData] = await Promise.all([
      inbox.listFanConversations({ pageSize: 50 }),
      inbox.listFanMessageRequests().catch(() => ({ requests: [] })),
    ])
    conversations.value = (data?.conversations || []).map(mapFanConversation)
    requests.value = (requestData?.requests || []).map(mapFanRequest).filter(Boolean)
    applyInboxTransition(previousRequests, previousSelectedId)
  } catch (err) {
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    listError.value = true
  } finally {
    listLoading.value = false
  }
}

async function openThread(id, { fromPoll = false } = {}) {
  if (!id) {
    selectedId.value = null
    threadMessages.value = []
    threadHydratedId.value = null
    return
  }
  const routeTarget = fanNumericRouteTarget(id)
  if (routeTarget.action === 'request') {
    const pending = matchPendingRequest(id, requests.value)
    if (pending) selectPendingRequest(pending)
    else {
      selectedId.value = String(id)
      threadMessages.value = []
      threadLoading.value = false
      threadError.value = false
      threadUnavailable.value = false
    }
    return
  }
  const cid = String(routeTarget.conversationId || id)
  const switched = String(selectedId.value || '') !== cid
  const needsHistory = String(threadHydratedId.value || '') !== cid
  if (!fromPoll && (switched || needsHistory)) {
    threadGen.value += 1
    if (switched) threadMessages.value = []
    threadError.value = false
    threadUnavailable.value = false
    olderExhausted.value = false
    threadBlocked.value = false
    threadRemoved.value = false
    threadLoading.value = true
    if (switched) threadHydratedId.value = null
  }
  selectedId.value = cid
  const gen = threadGen.value
  if (!fromPoll) inboxUiLog('thread:open', { conversationId: cid, role: 'fan' })
  if (!fromPoll) olderExhausted.value = false
  try {
    const data = await inbox.getConversation(cid)
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    const conv = data?.conversation || data
    threadBlocked.value = !!conv?.blocked
    threadRemoved.value = conv?.messagingAvailable === false && !conv?.blocked
    const peer = conv?.artist?.name || 'Artist'
    const avatar = conv?.artist?.avatarUrl
    rememberThreadArtist(cid, conv?.artist, { showCount: conv?.showCount })
    mergeThread(
      (conv?.messages || []).map((row) =>
        mapInboxMessage(row, { conversationId: cid, peerName: peer, peerAvatar: avatar, selfName: 'You' })
      )
    )
    threadHydratedId.value = cid
    await markSeen()
  } catch (err) {
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    const status = Number(err?.status || err?.statusCode || err?.data?.error?.status || 0)
    if (conversationLoadFailureKind(status) === 'unavailable') {
      const requestData = await inbox.listFanMessageRequests().catch(() => ({ requests: [] }))
      requests.value = (requestData?.requests || []).map(mapFanRequest).filter(Boolean)
      const recovered = matchPendingRequestForUnavailableRoute(cid, requests.value)
      if (recovered) {
        selectPendingRequest(recovered)
        return
      }
      clearUnavailableThread(cid, status)
      return
    }
    threadError.value = true
    threadHydratedId.value = null
  } finally {
    if (gen === threadGen.value) threadLoading.value = false
  }
}

function mergeThread(incoming) {
  threadMessages.value = mergeInboxThread(threadMessages.value, incoming)
}

function onSessionExpired() {
  sessionExpired.value = true
  threadPoll.pause()
  listPoll.pause()
  inboxUiLog('session:expired', { role: 'fan' })
}

async function markSeen() {
  const cid = selectedId.value
  if (!cid) return
  const real = threadMessages.value.filter((m) => !String(m.id).startsWith('opt-'))
  if (!real.length) return
  const newest = real[real.length - 1]
  const through = Number(newest.id)
  const last = Number(pendingReadByConversation.value[cid]) || 0
  if (!through || through <= last) return
  pendingReadByConversation.value = { ...pendingReadByConversation.value, [cid]: through }
  try {
    await inbox.markRead(cid, through)
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

function bumpConversation(cid, preview) {
  const idx = conversations.value.findIndex((c) => String(c.id) === String(cid))
  if (idx < 0) return
  const next = {
    ...conversations.value[idx],
    lastMessagePreview: preview,
    lastMessageAt: new Date().toISOString(),
    updatedAt: Date.now(),
    unreadCount: 0,
  }
  conversations.value = [next, ...conversations.value.filter((_, i) => i !== idx)]
}

function onSelect(id) {
  const next = id ? String(id?.conversationId || id) : null
  if (!next) {
    selectedId.value = null
    threadUnavailable.value = false
    threadError.value = false
    navigateTo('/fan/messages')
    return
  }
  if (isRequestRowId(next)) {
    const pending = matchPendingRequest(next, requests.value)
    if (pending) selectPendingRequest(pending)
    else selectedId.value = next
    return
  }
  navigateTo(`/fan/messages/${next}`)
}

async function onSend({ body, conversationId, attachment, attachments }) {
  if (isRequestSelected.value || threadError.value || threadUnavailable.value) return
  const cid = String(conversationId || selectedId.value)
  const gen = threadGen.value
  const clientMessageId = newClientMessageId()
  const media = attachments || (attachment ? [attachment] : [])
  if (String(selectedId.value) === cid) {
    threadMessages.value = [
      ...threadMessages.value,
      mapOptimisticMessage({
        conversationId: cid,
        clientMessageId,
        body,
        senderRole: 'fan',
        senderName: 'You',
        attachments: media,
      }),
    ]
  }
  bumpConversation(cid, body || (media.length > 1 ? `${media.length} photos` : media.length ? 'Photo' : ''))
  inboxUiLog('optimistic:add', { conversationId: cid, role: 'fan' })
  const t0 = Date.now()
  try {
    const result = await inbox.sendMessage(cid, {
      bodyText: body,
      clientMessageId,
      attachmentMediaIds: media.map((item) => item.mediaId).filter(Boolean),
    })
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    const peer = conversations.value.find((c) => c.id === cid)?.fan?.displayName
    mergeThread([
      mapInboxMessage(result.message, { conversationId: cid, peerName: peer, selfName: 'You' }),
    ])
    inboxUiLog('optimistic:confirmed', {
      conversationId: cid,
      hasAttachments: !!(result?.message?.attachments?.length || result?.message?.attachment),
      attachmentCount: result?.message?.attachments?.length || (result?.message?.attachment ? 1 : 0),
      latencyMs: Date.now() - t0,
    })
  } catch (err) {
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    threadMessages.value = threadMessages.value.map((m) =>
      m.clientMessageId === clientMessageId ? { ...m, status: 'failed' } : m
    )
    inboxUiLog('send:failed', { conversationId: cid, role: 'fan' })
  }
}

async function onRetry(msg) {
  if (!msg?.clientMessageId) return
  const cid = String(selectedId.value || '')
  const gen = threadGen.value
  threadMessages.value = threadMessages.value.map((m) =>
    m.clientMessageId === msg.clientMessageId ? { ...m, status: 'sending' } : m
  )
  try {
    const result = await inbox.sendMessage(cid, {
      bodyText: msg.body,
      clientMessageId: msg.clientMessageId,
      attachmentMediaIds: (msg.attachments || (msg.attachment ? [msg.attachment] : []))
        .map((item) => item.mediaId)
        .filter(Boolean),
    })
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    mergeThread([
      mapInboxMessage(result.message, { conversationId: cid, selfName: 'You' }),
    ])
  } catch (err) {
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    threadMessages.value = threadMessages.value.map((m) =>
      m.clientMessageId === msg.clientMessageId ? { ...m, status: 'failed' } : m
    )
  }
}

async function onBlock() {
  if (!selectedId.value) return
  try {
    await inbox.blockConversation(selectedId.value)
    threadBlocked.value = true
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

async function onUnblock() {
  if (!selectedId.value) return
  try {
    await inbox.unblockConversation(selectedId.value)
    threadBlocked.value = false
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

async function onLoadOlder() {
  if (loadingOlder.value || olderExhausted.value || !selectedId.value) return
  const cid = String(selectedId.value)
  const gen = threadGen.value
  const realIds = threadMessages.value.map((m) => Number(m.id)).filter((n) => Number.isFinite(n) && n > 0)
  const beforeId = realIds.length ? Math.min(...realIds) : null
  if (!beforeId) return
  loadingOlder.value = true
  try {
    const data = await inbox.listMessages(cid, { beforeId, limit: 40 })
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    const incoming = data?.messages || []
    if (!incoming.length) {
      olderExhausted.value = true
      return
    }
    const peer = conversations.value.find((c) => c.id === cid)?.fan?.displayName
    mergeThread(
      incoming.map((row) =>
        mapInboxMessage(row, { conversationId: cid, peerName: peer, selfName: 'You' })
      )
    )
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  } finally {
    if (String(selectedId.value) === cid) loadingOlder.value = false
  }
}

async function pollThread() {
  if (sessionExpired.value || visible.value === 'hidden' || !selectedId.value || isRequestSelected.value) return
  const cid = String(selectedId.value)
  const gen = threadGen.value
  const realIds = threadMessages.value.map((m) => Number(m.id)).filter((n) => Number.isFinite(n) && n > 0)
  const afterId = realIds.length ? Math.max(...realIds) : null
  try {
    const data = afterId
      ? await inbox.listMessages(cid, { afterId })
      : null
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    if (data?.messages?.length) {
      inboxUiLog('poll:new-messages', { conversationId: cid, count: data.messages.length, role: 'fan' })
      const peer = conversations.value.find((c) => c.id === cid)?.fan?.displayName
      mergeThread(
        data.messages.map((row) =>
          mapInboxMessage(row, { conversationId: cid, peerName: peer, selfName: 'You' })
        )
      )
      markSeen()
    } else {
      const mine = threadMessages.value.filter((m) => m.isMine && m.status === 'sent')
      if (mine.length) await openThread(cid, { fromPoll: true })
    }
  } catch (err) {
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

async function pollList() {
  if (sessionExpired.value || visible.value === 'hidden' || !user.value) return
  const previousRequests = requests.value
  const previousSelectedId = selectedId.value
  try {
    const [data, requestData] = await Promise.all([
      inbox.listFanConversations({ pageSize: 50 }),
      inbox.listFanMessageRequests().catch(() => ({ requests: [] })),
    ])
    conversations.value = (data?.conversations || []).map(mapFanConversation)
    requests.value = (requestData?.requests || []).map(mapFanRequest).filter(Boolean)
    applyInboxTransition(previousRequests, previousSelectedId)
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

const threadPoll = useIntervalFn(pollThread, 3500, { immediate: false })
const listPoll = useIntervalFn(pollList, 12000, { immediate: false })
const fanInboxStarted = ref(false)

function syncPolls() {
  if (sessionExpired.value || visible.value === 'hidden' || !user.value) {
    threadPoll.pause()
    listPoll.pause()
    return
  }
  threadPoll.resume()
  listPoll.resume()
}

watch(
  () => props.conversationId,
  (id) => {
    if (!fanInboxStarted.value) return
    if (id) openThread(id)
  }
)

watch(visible, (state) => {
  syncPolls()
  if (state === 'visible' && user.value) {
    pollList()
    if (selectedId.value) pollThread()
  }
})

watch(
  [user, token],
  async ([nextUser, jwt]) => {
    if (!nextUser || !jwt) {
      if (!nextUser) {
        fanInboxStarted.value = false
        conversations.value = []
        threadPoll.pause()
        listPoll.pause()
      }
      return
    }
    if (fanInboxStarted.value) return
    fanInboxStarted.value = true
    await loadList()
    if (props.conversationId) await openThread(props.conversationId)
    syncPolls()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  threadPoll.pause()
  listPoll.pause()
})
</script>

<style>
@import '~/assets/css/faneqo-messaging-accents.css';
</style>

<style scoped>
.fan-msg {
  --msg-gutter: 1.25rem;
  --fq-messages-max: 96rem;
  display: flex;
  flex-direction: column;
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  padding-top: var(--header-height, 70px);
  background: var(--fq-app-bg, #050506);
  color: var(--fq-text-primary, #fff);
}

.fan-msg.is-thread-mobile {
  padding: 0;
}

@media (min-width: 1024px) {
  .fan-msg {
    --msg-gutter: 1.75rem;
  }
}

@media (max-width: 1023px) {
  .fan-msg:not(.is-thread-mobile) {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
}

.fan-msg__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
  width: min(100%, var(--fq-messages-max, 100rem));
  margin: 0 auto;
  padding: 0.4rem var(--msg-gutter) 0.35rem;
}

.fan-msg__bar h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 750;
  letter-spacing: -0.03em;
}

.fan-msg__notice {
  flex-shrink: 0;
  width: min(100%, var(--fq-messages-max, 100rem));
  margin: 0 auto;
  padding: 0  var(--msg-gutter) 0.55rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.62));
  font-size: 0.92rem;
}

.fan-msg__inbox {
  flex: 1;
  min-height: 0;
  width: min(100%, var(--fq-messages-max, 100rem));
  margin: 0 auto;
  padding: 0 var(--msg-gutter);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
}

.fan-msg.is-thread-mobile .fan-msg__inbox {
  width: 100%;
  padding: 0;
}

.fan-msg__status,
.fan-msg__empty,
.fan-msg__gate {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: none;
  margin: 0;
  text-align: center;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
}

.fan-msg__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
  padding: 1.5rem 1rem;
}

.fan-msg__empty-icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 0.85rem;
  border-radius: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  background: #14161B;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.fan-msg__empty h2 {
  margin: 0 0 0.4rem;
  color: #fff;
  font-size: 1.15rem;
}

.fan-msg__cta-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 1.1rem;
  padding: 0.65rem 1.1rem;
  border: 0;
  border-radius: 0.8rem;
  color: #0A0B0E;
  font-weight: 700;
  cursor: pointer;
  background: #F5F5F6;
}

.fan-msg__retry {
  margin-top: 1rem;
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #fff;
  font-weight: 650;
  cursor: pointer;
}

.fan-msg__gate {
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.fan-msg__gate a {
  display: inline-flex;
  margin-top: 0.8rem;
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: 0.8rem;
  background: #F5F5F6;
  color: #0A0B0E;
  font-weight: 700;
  text-decoration: none;
}
</style>
