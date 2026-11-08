<template>
  <div class="msg-home fq-msg-accents" :class="{ 'is-thread-mobile': isThreadMobile }">
    <div v-if="!isThreadMobile" class="msg-home__chrome">
      <header class="msg-home__bar">
        <h1>Messages</h1>
      </header>

      <div v-if="showChromeAudienceActions" class="msg-home__reach">
        <MessagesAudienceActions
          class="msg-home__audience"
          @all-fans="goComposeAllFans"
          @show="openShowPicker"
        />
        <MessagesTabCta
          v-if="tab === 'inbox'"
          class="msg-home__cta"
          tab="inbox"
          @click="openSelector"
        />
      </div>

      <LayoutGroup>
      <div
        class="msg-home__tabs"
        role="tablist"
        aria-label="Messages modes"
      >
        <button
          id="messages-tab-inbox"
          type="button"
          role="tab"
          class="msg-home__tab"
          :class="{ 'is-active': tab === 'inbox' }"
          :aria-selected="tab === 'inbox'"
          aria-controls="messages-panel-inbox"
          @click="setTab('inbox')"
          @keydown="onTabKey"
        >
          <span class="msg-home__tab-text" data-label="Inbox">Inbox</span>
          <span v-if="unreadTotal > 0" class="msg-home__unread">{{ unreadTotal }}</span>
          <Motion
            v-if="tab === 'inbox'"
            layout-id="messages-tab-ink"
            class="msg-home__ink"
            :transition="reduced ? motionTokens.micro : motionTokens.standard"
          />
        </button>
        <button
          id="messages-tab-campaigns"
          type="button"
          role="tab"
          class="msg-home__tab"
          :class="{ 'is-active': tab === 'campaigns' }"
          :aria-selected="tab === 'campaigns'"
          aria-controls="messages-panel-campaigns"
          @click="setTab('sent')"
          @keydown="onTabKey"
        >
          <span class="msg-home__tab-text" data-label="Sent">Sent</span>
          <Motion
            v-if="tab === 'campaigns'"
            layout-id="messages-tab-ink"
            class="msg-home__ink"
            :transition="reduced ? motionTokens.micro : motionTokens.standard"
          />
        </button>
      </div>
      </LayoutGroup>
    </div>

    <div class="msg-home__workspace">
    <div v-if="loadingAccess" class="msg-home__boot" role="status">Opening Messages…</div>

    <div v-else-if="sessionExpired" class="msg-home__status" role="alert">
      <h2>Sign in required</h2>
      <p>Your session expired. Sign in again to keep messaging.</p>
      <NuxtLink to="/login" class="msg-home__retry">Sign in</NuxtLink>
    </div>

    <div v-else-if="!canMessage" class="msg-home__denied">
      <h2>Messaging is owner-only</h2>
      <p>Inbox and audience messages are available to the band owner.</p>
      <NuxtLink to="/dashboard">Go to Dashboard</NuxtLink>
    </div>

    <div
      v-else-if="tab === 'campaigns'"
      id="messages-panel-campaigns"
      class="msg-home__panel"
      role="tabpanel"
      aria-labelledby="messages-tab-campaigns"
    >
      <MessagesCampaignsPanel
        :campaigns="campaigns"
        :loading="campaignsLoading || campaignsPhase === 'idle' || campaignsPhase === 'loading'"
        :loading-more="campaignsLoadingMore"
        :error="campaignsError"
        :has-more="campaignsHasMore"
        :format-status-label="formatStatusLabel"
        :format-campaign-when="formatCampaignWhen"
        @retry="() => loadCampaigns({ reason: 'manual_retry', force: true })"
        @more="loadMoreCampaigns"
        @compose-all="goComposeAllFans"
        @compose-show="openShowPicker"
      />
    </div>

    <div
      v-else-if="inboxPhase === 'loading'"
      id="messages-panel-inbox"
      class="msg-home__status"
      role="tabpanel"
      aria-labelledby="messages-tab-inbox"
    >
      <div class="msg-home__skel" aria-hidden="true">
        <div v-for="n in 4" :key="n" class="msg-home__skel-row">
          <span class="msg-home__skel-avatar" />
          <span class="msg-home__skel-lines">
            <span class="msg-home__skel-line msg-home__skel-line--w" />
            <span class="msg-home__skel-line" />
          </span>
        </div>
      </div>
      <p role="status">Loading conversations…</p>
    </div>

    <div
      v-else-if="inboxPhase === 'error'"
      id="messages-panel-inbox"
      class="msg-home__status"
      role="tabpanel"
      aria-labelledby="messages-tab-inbox"
    >
      <h2>Couldn't load your conversations.</h2>
      <p>Check your connection and try again.</p>
      <button type="button" class="msg-home__retry" @click="loadList">Try again</button>
    </div>

    <div
      v-else-if="inboxPhase === 'empty'"
      id="messages-panel-inbox"
      class="msg-home__inbox"
      role="tabpanel"
      aria-labelledby="messages-tab-inbox"
    >
      <MessagesInboxEmpty @private="openSelector" />
    </div>

    <div
      v-else
      id="messages-panel-inbox"
      class="msg-home__inbox"
      role="tabpanel"
      aria-labelledby="messages-tab-inbox"
    >
      <FaneqoChat
        :current-user="currentUser"
        :band-id="bandId"
        :conversations="filteredRows"
        :search-active="!!searchQuery.trim()"
        :selected-conversation-id="selectedId"
        :messages="isRequestSelected ? [] : threadMessages"
        :loading="listLoading && !conversations.length && !requests.length"
        :load-error="listError && !conversations.length && !requests.length"
        :messages-error="!isRequestSelected && threadError"
        :conversation-unavailable="!isRequestSelected && threadUnavailable"
        :loading-older="loadingOlder"
        :messages-loading="threadLoading"
        :messages-ready="threadHistoryReady"
        :conversation-blocked="threadBlocked"
        :conversation-removed="threadRemoved"
        :empty-heading="inboxFilter === 'requests' ? 'No requests right now.' : ''"
        :empty-copy="inboxFilter === 'requests' ? 'New message requests will appear here.' : ''"
        viewer-role="artist"
        :show-view-fan="Boolean(selectedFanId)"
        show-inbox-filter
        :inbox-filter="inboxFilter"
        :request-count="requests.length"
        :request-busy="requestBusy"
        @select-conversation="onSelect"
        @send-message="onSend"
        @retry-message="onRetry"
        @fetch-messages="onSelect"
        @search="onSearch"
        @retry-messages="openThread(selectedId)"
        @load-older="onLoadOlder"
        @view-fan="onViewFan"
        @change-filter="inboxFilter = $event"
        @accept-request="onAcceptRequest"
        @decline-request="onDeclineRequest"
      >
        <template #thread-empty>
          <MessagesReachPanel @private="openSelector" />
        </template>
      </FaneqoChat>
    </div>

    </div>

    <InboxFanSelector
      v-if="selectorOpen && bandId"
      :band-id="bandId"
      @close="closeSelector"
      @started="onStarted"
      @request-artist="onRequestArtist"
    />

    <MessagesShowPicker
      v-if="showPickerOpen"
      @close="closeShowPicker"
      @select="onShowPicked"
    />

    <client-only>
      <FanMessageRequestSheet
        :open="messageSheetOpen"
        :step="messageSheetStep"
        :band-name="requestArtist.bandName || 'this artist'"
        :artist-image="requestArtist.artistImage || ''"
        :sending="messageSending"
        :error="messageError"
        :initial-first-name="messageStatus.firstName"
        :initial-last-name="messageStatus.lastName"
        @close="closeMessageSheet"
        @done="closeMessageSheet"
        @continue-free="onMessageContinueFree"
        @save-name="onMessageSaveName"
        @send="onMessageSendRequest"
      />
    </client-only>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { LayoutGroup, Motion } from 'motion-v'
import { useDocumentVisibility, useIntervalFn, useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import FaneqoChat from '~/components/messages/FaneqoChat.vue'
import InboxFanSelector from '~/components/messages/InboxFanSelector.vue'
import FanMessageRequestSheet from '~/components/band/FanMessageRequestSheet.vue'
import MessagesAudienceActions from '~/components/messages/MessagesAudienceActions.vue'
import MessagesCampaignsPanel from '~/components/messages/MessagesCampaignsPanel.vue'
import MessagesInboxEmpty from '~/components/messages/MessagesInboxEmpty.vue'
import MessagesReachPanel from '~/components/messages/MessagesReachPanel.vue'
import MessagesShowPicker from '~/components/messages/MessagesShowPicker.vue'
import MessagesTabCta from '~/components/messages/MessagesTabCta.vue'
import { useBandTeam } from '~/composables/useBandTeam'
import { useInbox } from '~/composables/useInbox'
import { useFanMessageRequest } from '~/composables/useFanMessageRequest'
import { useMessageCampaigns } from '~/composables/useMessageCampaigns'
import { campaignUiLog } from '~/utils/campaigns/campaignUiLog'
import { allFansComposeTo, isSentTab, showComposeTo } from '~/utils/campaigns/messagesHomeRoutes'
import { resolveComposerBand } from '~/utils/campaigns/resolveComposerBand'
import { inboxUiLog, newClientMessageId } from '~/utils/messages/inboxUiLog'
import { applyArtistInboxPollTransition, conversationLoadFailureKind } from '~/utils/messages/fanInboxSelection'
import { isRequestRowId, requestIdFromRow } from '~/utils/messages/fanIdentity'
import { gallerySharePreview } from '~/utils/messages/threadPresentation'
import { mapArtistConversation, mapArtistRequest, mapInboxMessage, mapOptimisticMessage } from '~/utils/messages/mapInboxModels'
import { isInboxAuthError, mergeInboxThread } from '~/utils/messages/threadMerge'
import { motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  initialTab: { type: String, default: 'inbox' },
  conversationId: { type: [String, Number], default: null },
})

const route = useRoute()
const user = useStrapiUser()
const token = useStrapiToken()
const { getMyBandAccess } = useBandTeam()
// Route query, then the last workspace opened — both only hints.
const { hint: activeBandHint, needsPicker } = useWorkspaceBand({
  permission: 'sendFanMessages',
})
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
const {
  getCampaignHistory,
  formatStatusLabel,
  formatCampaignWhen,
} = useMessageCampaigns()

const loadingAccess = ref(true)
const canMessage = ref(false)
const bandId = ref(null)
const selectorOpen = ref(false)
const showPickerOpen = ref(false)

const tab = computed(() => {
  if (props.conversationId) return 'inbox'
  if (isSentTab(route.query.tab, props.initialTab)) return 'campaigns'
  return 'inbox'
})

const inboxFilter = ref('all')
const requests = ref([])
const requestBusy = ref(false)

const inboxPhase = computed(() => {
  if (sessionExpired.value && !conversations.value.length && !requests.value.length) return 'error'
  if (props.conversationId || selectedId.value) return 'ready'
  if (listLoading.value && !conversations.value.length && !requests.value.length) return 'loading'
  if (listError.value && !conversations.value.length && !requests.value.length) return 'error'
  if (!conversations.value.length && !requests.value.length) return 'empty'
  return 'ready'
})

const isRequestSelected = computed(() => isRequestRowId(selectedId.value))

const selectedFanId = computed(() => {
  const conversation = conversations.value.find(
    (row) => String(row.id) === String(selectedId.value)
  )
  const fanId = Number(conversation?.fan?.fanId)
  return Number.isInteger(fanId) && fanId > 0 ? fanId : null
})

const conversations = ref([])
const listLoading = ref(true)
const listError = ref(false)
const searchQuery = ref('')
const selectedId = ref(
  props.conversationId
    ? String(props.conversationId)
    : route.query.request
      ? `request:${route.query.request}`
      : null
)
const threadMessages = ref([])
const threadError = ref(false)
const threadUnavailable = ref(false)
const loadingOlder = ref(false)
const olderExhausted = ref(false)
const threadBlocked = ref(false)
const threadRemoved = ref(false)
const unreadTotal = ref(0)
const pendingReadByConversation = ref({})
const threadGen = ref(0)
const threadLoading = ref(!!props.conversationId)
const threadHydratedId = ref(null)
const sessionExpired = ref(false)

const campaigns = ref([])
const campaignsLoading = ref(false)
const campaignsLoadingMore = ref(false)
const campaignsError = ref(false)
const campaignsPhase = ref('idle')
const campaignsLoadedForBand = ref(null)
const campaignsInFlightFor = ref(null)
const campaignsGen = ref(0)
const campaignPage = ref(1)
const campaignPageCount = ref(1)
const campaignsHasMore = computed(() => campaignPage.value < campaignPageCount.value)

const currentUser = computed(() => ({
  id: user.value?.id ? String(user.value.id) : 'artist',
  displayName: 'You',
}))

const visible = useDocumentVisibility()
const isMobile = useMediaQuery('(max-width: 899px)')
const reduced = computed(() => usePreferredReducedMotion().value === 'reduce')
const isThreadMobile = computed(() => !!isMobile.value && !!selectedId.value)
const showChromeAudienceActions = computed(() => canMessage.value)
const threadHistoryReady = computed(() =>
  !!selectedId.value &&
  !threadLoading.value &&
  String(threadHydratedId.value || '') === String(selectedId.value)
)

function setTab(next) {
  closeSelector()
  closeShowPicker()
  if (next === 'campaigns' || next === 'sent') navigateTo({ path: '/messages', query: { tab: 'sent' } })
  else navigateTo({ path: '/messages' })
}

function onTabKey(evt) {
  if (evt.key !== 'ArrowRight' && evt.key !== 'ArrowLeft' && evt.key !== 'Home' && evt.key !== 'End') return
  evt.preventDefault()
  const next = evt.key === 'ArrowLeft' || evt.key === 'Home' ? 'inbox' : 'sent'
  setTab(next)
}

function goComposeAllFans() {
  navigateTo(allFansComposeTo(bandId.value))
}

function openShowPicker() {
  showPickerOpen.value = true
}

function closeShowPicker() {
  showPickerOpen.value = false
}

function onShowPicked(recap) {
  closeShowPicker()
  if (!recap?.id) return
  navigateTo(showComposeTo(recap.id, bandId.value))
}

function openSelector() {
  inboxUiLog('new-message:open', { bandId: bandId.value })
  selectorOpen.value = true
}

function closeSelector() {
  selectorOpen.value = false
}

const filteredRows = computed(() => {
  const requestRows = requests.value
  const conversationRows = conversations.value
  const source = inboxFilter.value === 'requests'
    ? requestRows
    : [...requestRows, ...conversationRows]
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return source
  return source.filter((row) =>
    String(row.fan?.displayName || '').toLowerCase().includes(q) ||
    String(row.fan?.context || '').toLowerCase().includes(q) ||
    String(row.lastMessagePreview || '').toLowerCase().includes(q)
  )
})

function onSearch(q) {
  searchQuery.value = String(q || '')
}

async function loadList() {
  if (!bandId.value) return
  listLoading.value = !conversations.value.length
  listError.value = false
  inboxUiLog('inbox:load:start', { bandId: bandId.value })
  try {
    const [data, requestData] = await Promise.all([
      inbox.listConversations({ bandId: bandId.value, pageSize: 50 }),
      inbox.listMessageRequests({ bandId: bandId.value }).catch(() => ({ requests: [] })),
    ])
    conversations.value = (data?.conversations || []).map(mapArtistConversation).filter(Boolean)
    requests.value = (requestData?.requests || []).map(mapArtistRequest).filter(Boolean)
    const count = await inbox.unreadCount({ bandId: bandId.value })
    unreadTotal.value = count?.unreadCount || 0
    inboxUiLog('inbox:load:success', {
      conversationCount: conversations.value.length,
      requestCount: requests.value.length,
    })
  } catch (err) {
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    listError.value = true
    inboxUiLog('inbox:load:error', { status: err?.status || err?.statusCode || 'unknown' })
  } finally {
    listLoading.value = false
  }
}

async function openThread(id, { fromPoll = false } = {}) {
  if (!id || isRequestRowId(id)) {
    if (!id) {
      selectedId.value = null
      threadMessages.value = []
      threadHydratedId.value = null
    }
    return
  }
  const cid = String(id)
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
  if (!fromPoll) inboxUiLog('thread:open', { conversationId: cid })
  if (!fromPoll) olderExhausted.value = false
  try {
    const data = await inbox.getConversation(cid)
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    const conv = data?.conversation || data
    threadBlocked.value = !!conv?.blocked
    threadRemoved.value = conv?.messagingAvailable === false && !conv?.blocked
    const peer = conv?.fan?.displayName || 'Faneqo fan'
    const mapped = (conv?.messages || []).map((row) =>
      mapInboxMessage(row, {
        conversationId: cid,
        peerName: peer,
        peerAvatar: conv?.fan?.avatarUrl || null,
        selfName: 'You',
      })
    )
    mergeThread(mapped)
    threadHydratedId.value = cid
    markSeen(mapped)
    patchConversationFromDetail(conv)
  } catch (err) {
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    if (isInboxAuthError(err)) {
      onSessionExpired()
      return
    }
    const status = Number(err?.status || err?.statusCode || err?.data?.error?.status || 0)
    if (conversationLoadFailureKind(status) === 'unavailable') {
      threadUnavailable.value = true
      threadError.value = false
      threadHydratedId.value = null
      selectedId.value = null
      navigateTo('/messages')
      return
    }
    threadError.value = true
    threadHydratedId.value = null
  } finally {
    if (gen === threadGen.value) threadLoading.value = false
  }
}

function patchConversationFromDetail(conv) {
  if (!conv?.id) return
  const mapped = mapArtistConversation(conv)
  if (!mapped) return
  const idx = conversations.value.findIndex((c) => String(c.id) === String(conv.id))
  if (idx >= 0) {
    conversations.value[idx] = { ...conversations.value[idx], ...mapped, unreadCount: 0 }
    return
  }
  conversations.value = [{ ...mapped, unreadCount: 0 }, ...conversations.value]
}

function mergeThread(incoming) {
  threadMessages.value = mergeInboxThread(threadMessages.value, incoming)
}

function onSessionExpired() {
  sessionExpired.value = true
  threadPoll.pause()
  listPoll.pause()
  inboxUiLog('session:expired', { bandId: bandId.value })
}

function syncUnreadTotal() {
  unreadTotal.value = conversations.value.reduce((n, row) => n + (Number(row.unreadCount) || 0), 0)
}

async function markSeen(messages) {
  const cid = selectedId.value
  if (!cid) return
  const real = (messages || threadMessages.value).filter((m) => !String(m.id).startsWith('opt-'))
  if (!real.length) return
  const newest = real[real.length - 1]
  const through = Number(newest.id)
  const last = Number(pendingReadByConversation.value[cid]) || 0
  if (!through || through <= last) return
  pendingReadByConversation.value = { ...pendingReadByConversation.value, [cid]: through }
  try {
    await inbox.markRead(cid, through)
    if (String(selectedId.value) !== cid) return
    const idx = conversations.value.findIndex((c) => String(c.id) === cid)
    if (idx >= 0) {
      conversations.value[idx] = { ...conversations.value[idx], unreadCount: 0 }
    }
    syncUnreadTotal()
    inboxUiLog('read:confirmed', { conversationId: cid })
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

async function pollThread() {
  if (sessionExpired.value || visible.value === 'hidden' || tab.value !== 'inbox' || !selectedId.value || isRequestRowId(selectedId.value)) return
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
      inboxUiLog('poll:new-messages', { conversationId: cid, count: data.messages.length })
      const peerRow = conversations.value.find((c) => c.id === cid)
      const peer = peerRow?.fan?.displayName
      mergeThread(
        data.messages.map((row) =>
          mapInboxMessage(row, {
            conversationId: cid,
            peerName: peer,
            peerAvatar: peerRow?.fan?.avatarUrl || null,
            selfName: 'You',
          })
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
  if (sessionExpired.value || visible.value === 'hidden' || tab.value !== 'inbox' || !bandId.value) return
  const previousRequests = requests.value
  const previousSelectedId = selectedId.value
  const previousConversationIds = conversations.value.map((row) => row.id)
  try {
    const [data, requestData] = await Promise.all([
      inbox.listConversations({ bandId: bandId.value, pageSize: 50 }),
      inbox.listMessageRequests({ bandId: bandId.value }).catch(() => ({ requests: [] })),
    ])
    conversations.value = (data?.conversations || []).map(mapArtistConversation).filter(Boolean)
    requests.value = (requestData?.requests || []).map(mapArtistRequest).filter(Boolean)
    const count = await inbox.unreadCount({ bandId: bandId.value })
    unreadTotal.value = count?.unreadCount || 0
    const transition = applyArtistInboxPollTransition({
      selectedId: previousSelectedId,
      previousRequests,
      nextRequests: requests.value,
      nextConversations: conversations.value,
      previousConversationIds,
    })
    if (transition.action === 'open-conversation') {
      navigateTo(`/messages/inbox/${transition.conversationId}`)
    } else if (transition.action === 'clear') {
      selectedId.value = null
      if (route.query.request) navigateTo('/messages')
    }
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  }
}

const threadPoll = useIntervalFn(pollThread, 3500, { immediate: false })
const listPoll = useIntervalFn(pollList, 12000, { immediate: false })

function onSelect(id) {
  const next = id ? String(id?.conversationId || id) : null
  if (!next) {
    selectedId.value = null
    navigateTo('/messages')
    return
  }
  if (isRequestRowId(next)) {
    const rid = requestIdFromRow(next)
    selectedId.value = next
    threadMessages.value = []
    navigateTo({ path: '/messages', query: { request: String(rid) } })
    return
  }
  if (String(selectedId.value) === next && route.path.startsWith('/messages/inbox/')) {
    return
  }
  navigateTo(`/messages/inbox/${next}`)
}

async function onAcceptRequest(requestId) {
  const rid = Number(requestId)
  if (!rid || requestBusy.value) return
  requestBusy.value = true
  inboxUiLog('request:accept', { requestId: rid, bandId: bandId.value })
  try {
    const result = await inbox.acceptMessageRequest(rid)
    const conversationId = result?.conversationId || result?.conversation?.id
    requests.value = requests.value.filter((row) => Number(row.requestId) !== rid)
    if (conversationId) {
      navigateTo(`/messages/inbox/${conversationId}`)
    }
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  } finally {
    requestBusy.value = false
  }
}

async function onDeclineRequest(requestId) {
  const rid = Number(requestId)
  if (!rid || requestBusy.value) return
  requestBusy.value = true
  inboxUiLog('request:decline', { requestId: rid, bandId: bandId.value })
  try {
    await inbox.declineMessageRequest(rid)
    requests.value = requests.value.filter((row) => Number(row.requestId) !== rid)
    selectedId.value = null
    navigateTo('/messages')
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  } finally {
    requestBusy.value = false
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

function onViewFan() {
  const fanId = selectedFanId.value
  if (!fanId || !bandId.value) return
  inboxUiLog('view-fan:open', {
    conversationId: selectedId.value,
    fanId,
    bandId: bandId.value,
  })
  navigateTo({
    path: `/dashboard/fans/${fanId}`,
    query: {
      bandId: String(bandId.value),
      from: 'messages',
    },
  })
}

async function onSend({ body, conversationId, attachment, attachments, galleryReference }) {
  const cid = String(conversationId || selectedId.value)
  const gen = threadGen.value
  const clientMessageId = newClientMessageId()
  const media = attachments || (attachment ? [attachment] : [])
  const optimistic = mapOptimisticMessage({
    conversationId: cid,
    clientMessageId,
    body,
    senderRole: 'artist',
    senderName: 'You',
    attachments: media,
    galleryReference,
  })
  if (String(selectedId.value) === cid) {
    threadMessages.value = [...threadMessages.value, optimistic]
  }
  bumpConversation(
    cid,
    galleryReference
      ? gallerySharePreview(galleryReference)
      : body || (media.length > 1 ? `${media.length} photos` : media.length ? 'Photo' : '')
  )
  inboxUiLog('optimistic:add', { conversationId: cid, clientMessageId })
  const started = Date.now()
  try {
    const result = await inbox.sendMessage(cid, {
      bodyText: body,
      clientMessageId,
      attachmentMediaIds: media.map((item) => item.mediaId).filter(Boolean),
      artistUpdateId: galleryReference?.id || null,
    })
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    const mapped = mapInboxMessage(result.message, {
      conversationId: cid,
      peerName: 'Faneqo fan',
      selfName: 'You',
    })
    mergeThread([mapped])
    inboxUiLog('optimistic:confirmed', {
      conversationId: cid,
      messageId: mapped?.id,
      hasAttachments: !!(mapped?.attachments?.length || mapped?.attachment),
      attachmentCount: mapped?.attachments?.length || (mapped?.attachment ? 1 : 0),
      latencyMs: Date.now() - started,
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
    inboxUiLog('send:failed', { conversationId: cid, status: err?.status })
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
      artistUpdateId: msg.galleryReference?.locked ? null : msg.galleryReference?.id || null,
    })
    if (gen !== threadGen.value || String(selectedId.value) !== cid) return
    mergeThread([
      mapInboxMessage(result.message, {
        conversationId: cid,
        selfName: 'You',
      }),
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

function onStarted({ conversationId, created }) {
  if (!conversationId) return
  selectorOpen.value = false
  inboxUiLog('conversation:resolved', { conversationId, created })
  navigateTo(`/messages/inbox/${conversationId}`)
}

async function onRequestArtist(band) {
  selectorOpen.value = false
  if (!band?.id) return
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

async function loadCampaigns({ reason = 'tab_enter', force = false } = {}) {
  if (!bandId.value || !token.value) return
  const bid = String(bandId.value)
  const alreadyReady =
    campaignsLoadedForBand.value === bid &&
    (campaignsPhase.value === 'ready' || campaignsPhase.value === 'empty')
  if (!force && alreadyReady) return
  if (!force && campaignsPhase.value === 'loading' && campaignsInFlightFor.value === bid) return

  if (campaignsLoadedForBand.value && campaignsLoadedForBand.value !== bid) {
    campaigns.value = []
    campaignsLoadedForBand.value = null
  }

  const gen = campaignsGen.value + 1
  campaignsGen.value = gen
  campaignsInFlightFor.value = bid
  campaignsPhase.value = 'loading'
  campaignsLoading.value = true
  campaignsError.value = false
  campaignUiLog('history:refresh', { reason, bandId: bid })
  campaignUiLog('history:load:start', { bandId: bid })
  const started = Date.now()
  try {
    const result = await getCampaignHistory({ bandId: bid, page: 1, pageSize: 20 })
    if (gen !== campaignsGen.value) return
    campaigns.value = result.data || []
    campaignPage.value = result.meta?.pagination?.page || 1
    campaignPageCount.value = result.meta?.pagination?.pageCount || 1
    campaignsLoadedForBand.value = bid
    campaignsPhase.value = campaigns.value.length ? 'ready' : 'empty'
    campaignUiLog('history:load:success', {
      campaignCount: campaigns.value.length,
      latencyMs: Date.now() - started,
    })
  } catch (err) {
    if (gen !== campaignsGen.value) return
    campaignsError.value = true
    campaignsPhase.value = 'error'
    campaignUiLog('history:load:error', {
      status: err?.status || err?.statusCode || 'unknown',
      requestId: err?.data?.error?.requestId || err?.response?._data?.error?.requestId,
    })
  } finally {
    if (gen === campaignsGen.value) {
      campaignsLoading.value = false
      if (campaignsInFlightFor.value === bid) campaignsInFlightFor.value = null
    }
  }
}

function ensureCampaigns(reason = 'tab_enter') {
  if (tab.value !== 'campaigns') return
  if (!canMessage.value || !bandId.value || !token.value) return
  const force = reason === 'return_from_compose' || reason === 'manual_retry'
  loadCampaigns({ reason, force })
}

function stripCampaignRefreshQuery() {
  if (!route.query.refresh) return
  navigateTo({ path: '/messages', query: { tab: 'sent' } }, { replace: true })
}

async function loadMoreCampaigns() {
  if (!campaignsHasMore.value) return
  campaignsLoadingMore.value = true
  try {
    const result = await getCampaignHistory({
      bandId: bandId.value,
      page: campaignPage.value + 1,
      pageSize: 20,
    })
    campaigns.value = [...campaigns.value, ...(result.data || [])]
    campaignPage.value = result.meta?.pagination?.page || campaignPage.value + 1
    campaignPageCount.value = result.meta?.pagination?.pageCount || campaignPageCount.value
  } finally {
    campaignsLoadingMore.value = false
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
    const peerRow = conversations.value.find((c) => c.id === cid)
    const peer = peerRow?.fan?.displayName
    mergeThread(
      incoming.map((row) =>
        mapInboxMessage(row, {
          conversationId: cid,
          peerName: peer,
          peerAvatar: peerRow?.fan?.avatarUrl || null,
          selfName: 'You',
        })
      )
    )
  } catch (err) {
    if (isInboxAuthError(err)) onSessionExpired()
  } finally {
    if (String(selectedId.value) === cid) loadingOlder.value = false
  }
}

function syncPolls() {
  if (sessionExpired.value || visible.value === 'hidden' || tab.value !== 'inbox' || !canMessage.value) {
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
    if (id) openThread(id)
  }
)

watch(
  () => route.query.request,
  (id) => {
    if (id) selectedId.value = `request:${id}`
  }
)

watch(tab, (next) => {
  if (next !== 'inbox') closeSelector()
  syncPolls()
})

watch(
  [tab, bandId, token, canMessage],
  () => {
    if (tab.value !== 'campaigns') return
    const fromCompose = !!route.query.refresh
    ensureCampaigns(fromCompose ? 'return_from_compose' : 'tab_enter')
    if (fromCompose && bandId.value && token.value) stripCampaignRefreshQuery()
  },
  { immediate: true }
)

watch(
  () => route.query.refresh,
  (refresh) => {
    if (!refresh || tab.value !== 'campaigns') return
    ensureCampaigns('return_from_compose')
    if (bandId.value && token.value) stripCampaignRefreshQuery()
  }
)

watch(visible, (state) => {
  syncPolls()
  if (state === 'visible' && tab.value === 'inbox') {
    pollList()
    if (selectedId.value) pollThread()
  }
})

const inboxBootstrapped = ref(false)

async function bootstrapInbox() {
  if (!token.value || inboxBootstrapped.value) return
  inboxBootstrapped.value = true
  try {
    const access = await getMyBandAccess()
    const band = resolveComposerBand(access, activeBandHint.value)
    if (band?.bandId) {
      bandId.value = band.bandId
      canMessage.value = true
    } else {
      canMessage.value = false
      // Several artists and no usable hint: choose one rather than opening
      // whichever inbox happens to sort first.
      if (needsPicker.value) {
        await navigateTo('/dashboard')
        return
      }
    }
  } catch (err) {
    inboxBootstrapped.value = false
    if (isInboxAuthError(err)) {
      onSessionExpired()
    } else {
      canMessage.value = false
    }
  } finally {
    loadingAccess.value = false
  }
  if (!canMessage.value) return
  await loadList()
  if (props.conversationId) await openThread(props.conversationId)
  else if (route.query.request) selectedId.value = `request:${route.query.request}`
  syncPolls()
}

watch(
  token,
  (jwt) => {
    if (jwt) bootstrapInbox()
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
.msg-home {
  --msg-gutter: 1.25rem;
  /* Centered working column instead of a full-bleed sheet stuck to the left. */
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

.msg-home.is-thread-mobile {
  padding: 0;
}

@media (min-width: 1024px) {
  .msg-home {
    --msg-gutter: 1.75rem;
  }
}

@media (min-width: 1440px) {
  .msg-home {
    --fq-messages-max: 108rem;
  }
}

@media (max-width: 1023px) {
  .msg-home:not(.is-thread-mobile) {
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px));
  }
}

.msg-home__chrome {
  flex-shrink: 0;
  width: min(100%, var(--fq-messages-max, 100rem));
  margin: 0 auto;
  padding: 0.4rem var(--msg-gutter) 0;
}

.msg-home__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.msg-home__bar h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--fq-text-primary, #F5F5F6);
}

@media (min-width: 900px) {
  .msg-home__bar h1 {
    font-size: 1.5rem;
  }
}

.msg-home__cta {
  flex-shrink: 0;
}

.msg-home__reach {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.65rem 0 0.15rem;
}

.msg-home__audience {
  flex: 1 1 auto;
  min-width: 0;
}

@media (min-width: 900px) {
  .msg-home__reach {
    margin-top: 0.85rem;
    margin-bottom: 0.25rem;
    gap: 0.65rem;
  }

  .msg-home__audience {
    flex: 0 1 auto;
  }
}

.msg-home__tabs {
  display: flex;
  align-items: flex-end;
  gap: 0.15rem;
  margin: 0.1rem 0 0;
  border-bottom: 1px solid var(--fq-border-subtle, rgba(255, 255, 255, 0.08));
}

.msg-home__tab {
  position: relative;
  min-height: 44px;
  padding: 0.35rem 0.85rem 0.5rem;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.16s ease;
}

.msg-home__tab:hover {
  color: rgba(255, 255, 255, 0.76);
}

/* State reads in weight and ink, not in a bigger accent. */
.msg-home__tab.is-active {
  color: var(--fq-text-primary, #F5F5F6);
  font-weight: 700;
}

/* Holds the active width so switching tabs moves ink, not geometry. */
.msg-home__tab-text {
  display: inline-grid;
  grid-template-rows: auto 0;
  justify-items: center;
}

.msg-home__tab-text::after {
  content: attr(data-label);
  overflow: hidden;
  visibility: hidden;
  font-weight: 700;
  pointer-events: none;
}

.msg-home__ink {
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: -1px;
  height: 2px;
  border-radius: 99px;
  background: var(--fq-accent-cyan, #39D5FF);
}

.msg-home__tab:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: -2px;
  border-radius: 0.4rem;
}

.msg-home__unread {
  margin-left: 0.35rem;
  display: inline-flex;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.3rem;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.1);
  color: #F5F5F6;
  font-size: 0.65rem;
  font-weight: 800;
  align-items: center;
  justify-content: center;
}

.msg-home__workspace {
  flex: 1;
  min-height: 0;
  width: min(100%, var(--fq-messages-max, 100rem));
  margin: 0 auto;
  padding: 0 var(--msg-gutter);
  display: flex;
  flex-direction: column;
}

.msg-home.is-thread-mobile .msg-home__workspace {
  padding: 0;
  width: 100%;
}

.msg-home__inbox,
.msg-home__panel {
  flex: 1;
  min-height: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--fq-canvas, #07080A);
}

.msg-home__panel {
  overflow: auto;
}

.msg-home__boot,
.msg-home__denied,
.msg-home__status {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 1.5rem 1rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
}

.msg-home__denied h2,
.msg-home__status h2 {
  margin: 0 0 0.4rem;
  color: var(--fq-text-primary, #F5F5F6);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.msg-home__denied p,
.msg-home__status p {
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.875rem;
  line-height: 1.5;
}

.msg-home__denied a,
.msg-home__retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  margin-top: 1rem;
  padding: 0.65rem 1rem;
  border-radius: 0.8rem;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.msg-home__denied a {
  background: #F5F5F6;
  color: #0A0B0E;
}

.msg-home__retry {
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: transparent;
  color: #fff;
}

.msg-home__retry:focus-visible,
.msg-home__denied a:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}

.msg-home__skel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(22rem, 100%);
  margin: 0 auto 1.25rem;
}

.msg-home__skel-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}

.msg-home__skel-avatar {
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
}

.msg-home__skel-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.msg-home__skel-line {
  display: block;
  height: 0.55rem;
  border-radius: 99px;
  background: rgba(255, 255, 255, 0.06);
}

.msg-home__skel-line--w {
  width: 58%;
}

@media (max-width: 639px) {
  .msg-home__chrome {
    padding-top: 0.28rem;
  }

  .msg-home__bar h1 {
    font-size: 1.2rem;
  }

  .msg-home__tab {
    padding: 0.28rem 0.7rem 0.42rem;
    font-size: 0.86rem;
  }

  .msg-home__cta :deep(.msg-cta) {
    padding: 0.32rem 0.7rem;
    font-size: 0.78rem;
  }
}
</style>
