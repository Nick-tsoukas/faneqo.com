<template>
  <div class="lab-page">
    <div class="lab-page__inner">
      <header class="lab-header">
        <div>
          <p class="lab-kicker">Prototype · not live Inbox</p>
          <h1 class="lab-title">Messages</h1>
        </div>

        <div class="lab-tools" role="toolbar" aria-label="Lab controls">
          <button type="button" class="lab-btn" :class="{ on: surface === 'artist' }" @click="surface = 'artist'">
            Artist Inbox
          </button>
          <button type="button" class="lab-btn" :class="{ on: surface === 'fan' }" @click="surface = 'fan'">
            Fan view
          </button>
        </div>
      </header>

      <div
        v-if="surface === 'artist'"
        class="lab-exp"
        role="toolbar"
        aria-label="Interaction experiments"
      >
        <button
          v-for="item in experiments"
          :key="item.id"
          type="button"
          class="lab-btn"
          :class="{ on: experiment === item.id }"
          @click="runExperiment(item.id)"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Future product chrome — Campaigns stays real /messages -->
      <nav class="lab-tabs" aria-label="Messages sections">
        <span class="lab-tab lab-tab--active" aria-current="page">Inbox</span>
        <NuxtLink to="/messages?tab=campaigns" class="lab-tab">Campaigns</NuxtLink>
      </nav>

      <div
        v-if="viewFanNote"
        class="lab-toast"
        role="status"
      >
        <div>
          <p class="lab-toast__title">View Fan</p>
          <p class="lab-toast__body">
            {{ viewFanNote.displayName }} — future Fan Intelligence entry. Not wired.
          </p>
        </div>
        <button type="button" class="lab-toast__x" aria-label="Dismiss" @click="viewFanNote = null">✕</button>
      </div>

      <div
        v-if="fiNote"
        class="lab-toast lab-toast--soft"
        role="status"
      >
        <p class="lab-toast__body">
          Simulated Fan Intelligence → Message: opened conversation with
          <strong class="text-white">{{ fiNote }}</strong>.
        </p>
        <button type="button" class="lab-toast__x" aria-label="Dismiss" @click="fiNote = null">✕</button>
      </div>

      <div class="chat-shell" :class="{ 'chat-shell--mobile-tight': surface === 'artist' }">
        <FaneqoChat
          v-if="surface === 'artist'"
          :current-user="artist"
          :conversations="visibleConversations"
          :selected-conversation-id="selectedId"
          :messages="activeMessages"
          :loading="booting"
          :force-empty="showEmpty"
          :search-active="!!searchQuery.trim()"
          :load-error="loadError"
          :messages-error="messagesError"
          :loading-older="loadingOlder"
          :is-typing="demoTyping"
          :typing-name="typingName"
          :conversation-blocked="conversationBlocked"
          :conversation-removed="conversationRemoved"
          :reactions="reactions"
          :hold-auto-follow="holdAutoFollow"
          drafts-key="faneqo.chat-lab.drafts"
          enable-reactions
          enable-reply
          show-view-fan
          @select-conversation="onSelect"
          @send-message="onSend"
          @retry-message="onRetry"
          @view-fan="onViewFan"
          @fetch-messages="onFetch"
          @search="onSearch"
          @retry-load="retryLoad"
          @retry-messages="messagesError = false"
          @block="conversationBlocked = true"
          @unblock="conversationBlocked = false"
          @react="onReact"
        />
        <FaneqoFanMessagesPreview v-else />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef } from 'vue'
import FaneqoChat from '~/components/messages/FaneqoChat.vue'
import FaneqoFanMessagesPreview from '~/components/messages/FaneqoFanMessagesPreview.vue'
import { isChatLabEnabled } from '~/config/chatLabFeatureFlags'
import { useConversationDrafts } from '~/composables/useConversationDrafts'
import {
  cloneLabState,
  filterConversations,
  LAB_ARTIST_USER,
} from '~/utils/messages/chatLabFakeData'

definePageMeta({
  middleware: [
    'auth',
    function chatLabGate() {
      if (!isChatLabEnabled()) {
        return navigateTo('/messages')
      }
    },
  ],
})

useHead({
  title: 'Inbox Lab · Messages',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const artist = LAB_ARTIST_USER
const surface = ref('artist')
const state = shallowRef(cloneLabState())
const selectedId = ref(state.value.conversations[0]?.id || null)
const searchQuery = ref('')
const demoTyping = ref(false)
const viewFanNote = ref(null)
const fiNote = ref(null)
const showEmpty = ref(false)
const booting = ref(true)
const loadError = ref(false)
const messagesError = ref(false)
const loadingOlder = ref(false)
const conversationBlocked = ref(false)
const conversationRemoved = ref(false)
const holdAutoFollow = ref(false)
const nextSendFails = ref(false)
const experiment = ref('normal')
const reactions = ref({})
const { setDraft } = useConversationDrafts()
let typingTimer = null
let sendTimers = new Map()

const experiments = [
  { id: 'normal', label: 'Normal' },
  { id: 'typing', label: 'Typing' },
  { id: 'sending', label: 'Sending' },
  { id: 'seen', label: 'Seen' },
  { id: 'fail', label: 'Send Failure' },
  { id: 'reply', label: 'Reply' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'reaction', label: 'Reaction' },
  { id: 'unread', label: 'Unread' },
  { id: 'incoming', label: 'New Message' },
  { id: 'scrolled', label: 'Scrolled Up' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'removed', label: 'Removed' },
  { id: 'draft', label: 'Long Draft' },
  { id: 'thread', label: 'Long Thread' },
  { id: 'empty', label: 'Empty' },
  { id: 'error', label: 'Error' },
]

onMounted(() => {
  setTimeout(() => {
    booting.value = false
  }, 450)
})

const visibleConversations = computed(() =>
  filterConversations(state.value.conversations, searchQuery.value)
)

const activeMessages = computed(() => {
  if (!selectedId.value) return []
  return state.value.messagesById[selectedId.value] || []
})

const typingName = computed(() => {
  if (surface.value === 'fan') return artist.displayName
  return visibleConversations.value.find((c) => c.id === selectedId.value)?.fan?.displayName || 'Fan'
})

function onSearch(q) {
  searchQuery.value = q
}

function onSelect(conversationId) {
  selectedId.value = conversationId
  conversationBlocked.value = experiment.value === 'blocked'
  conversationRemoved.value = experiment.value === 'removed' && conversationId === selectedId.value
  if (!conversationId) return
  const list = state.value.conversations
  const idx = list.findIndex((c) => c.id === conversationId)
  if (idx >= 0 && list[idx].unreadCount > 0) {
    const next = [...list]
    next[idx] = { ...next[idx], unreadCount: 0 }
    state.value = { ...state.value, conversations: next }
  }
}

function onFetch({ conversationId }) {
  if (conversationId) onSelect(conversationId)
}

function bumpConversation(conversationId, preview, extra = {}) {
  const conversationsNext = [...state.value.conversations]
    .map((c) => {
      if (c.id !== conversationId) return c
      return {
        ...c,
        lastMessagePreview: preview,
        lastMessageAt: new Date().toISOString(),
        updatedAt: Date.now(),
        unreadCount: extra.unreadCount != null ? extra.unreadCount : c.unreadCount,
      }
    })
    .sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))
  state.value = { ...state.value, conversations: conversationsNext }
}

function patchMessage(conversationId, messageId, patch) {
  const msgs = state.value.messagesById[conversationId] || []
  const i = msgs.findIndex((m) => m.id === messageId)
  if (i < 0) return
  const updated = [...msgs]
  updated[i] = { ...updated[i], ...patch }
  state.value = {
    ...state.value,
    messagesById: { ...state.value.messagesById, [conversationId]: updated },
  }
}

function appendMessage(msg) {
  const prev = state.value.messagesById[msg.conversationId] || []
  state.value = {
    ...state.value,
    messagesById: {
      ...state.value.messagesById,
      [msg.conversationId]: [...prev, msg],
    },
  }
}

function onSend(draft) {
  if (!draft?.conversationId || !draft.body) return
  const fail = nextSendFails.value
  nextSendFails.value = false
  const clientMessageId = `cmsg-${Date.now()}`
  const id = `local-${Date.now()}`
  const msg = {
    id,
    conversationId: draft.conversationId,
    senderRole: 'artist',
    senderId: artist.id,
    senderName: artist.displayName,
    body: draft.body,
    createdAt: new Date().toISOString(),
    status: 'sending',
    replyTo: draft.replyTo || null,
    avatarUrl: artist.avatarUrl,
    clientMessageId,
  }
  appendMessage(msg)
  bumpConversation(draft.conversationId, draft.body, { unreadCount: 0 })

  if (fail) {
    setTimeout(() => patchMessage(draft.conversationId, id, { status: 'failed' }), 700)
    return
  }

  const t1 = setTimeout(() => {
    patchMessage(draft.conversationId, id, { status: 'sent' })
    const t2 = setTimeout(() => patchMessage(draft.conversationId, id, { status: 'seen' }), 900)
    sendTimers.set(id, t2)
  }, 550)
  sendTimers.set(id, t1)
}

function onRetry(msg) {
  if (!msg?.id || !msg.conversationId) return
  patchMessage(msg.conversationId, msg.id, { status: 'sending' })
  setTimeout(() => {
    patchMessage(msg.conversationId, msg.id, { status: 'sent' })
    setTimeout(() => patchMessage(msg.conversationId, msg.id, { status: 'seen' }), 800)
  }, 500)
}

function onViewFan(payload) {
  viewFanNote.value = payload
}

function onReact({ messageId, emoji }) {
  const current = reactions.value[messageId] || []
  const next = current.includes(emoji) ? current : [...current, emoji]
  reactions.value = { ...reactions.value, [messageId]: next }
}

function incomingFromFan(body) {
  if (!selectedId.value) return
  const conv = state.value.conversations.find((c) => c.id === selectedId.value)
  const msg = {
    id: `fan-${Date.now()}`,
    conversationId: selectedId.value,
    senderRole: 'fan',
    senderId: conv?.fan?.fanId,
    senderName: conv?.fan?.displayName,
    body,
    createdAt: new Date().toISOString(),
    status: 'sent',
    avatarUrl: conv?.fan?.avatarUrl,
  }
  appendMessage(msg)
  bumpConversation(selectedId.value, body, {
    unreadCount: selectedId.value ? 0 : 1,
  })
}

function resetScene() {
  showEmpty.value = false
  loadError.value = false
  messagesError.value = false
  conversationBlocked.value = false
  conversationRemoved.value = false
  holdAutoFollow.value = false
  nextSendFails.value = false
  demoTyping.value = false
  loadingOlder.value = false
}

function runExperiment(id) {
  experiment.value = id
  resetScene()
  if (id === 'empty') showEmpty.value = true
  if (id === 'error') loadError.value = true
  if (id === 'typing') demoFanTyping()
  if (id === 'fail') nextSendFails.value = true
  if (id === 'blocked') conversationBlocked.value = true
  if (id === 'removed') conversationRemoved.value = true
  if (id === 'unread') {
    const next = state.value.conversations.map((c, i) =>
      i === 2 ? { ...c, unreadCount: (c.unreadCount || 0) + 1, updatedAt: Date.now() } : c
    )
    state.value = { ...state.value, conversations: next }
  }
  if (id === 'incoming') incomingFromFan('Just landed in Chicago 🔥')
  if (id === 'scrolled') {
    holdAutoFollow.value = true
    incomingFromFan('Are you coming back?')
    incomingFromFan('The whole row is talking about the encore.')
  }
  if (id === 'draft' && selectedId.value) {
    setDraft(selectedId.value, "We're hoping to announce Chicago next wee")
  }
  if (id === 'thread' && selectedId.value) {
    loadingOlder.value = true
    const extras = Array.from({ length: 18 }, (_, i) => ({
      id: `long-${Date.now()}-${i}`,
      conversationId: selectedId.value,
      senderRole: i % 2 ? 'artist' : 'fan',
      senderId: i % 2 ? artist.id : 'fan-sarah',
      senderName: i % 2 ? artist.displayName : 'Sarah Miller',
      body: i % 2 ? 'Grateful you were there.' : `Memory ${i + 1} from the room.`,
      createdAt: new Date(Date.now() - (18 - i) * 60000).toISOString(),
      status: 'seen',
    }))
    const prev = state.value.messagesById[selectedId.value] || []
    state.value = {
      ...state.value,
      messagesById: {
        ...state.value.messagesById,
        [selectedId.value]: [...extras, ...prev],
      },
    }
    setTimeout(() => {
      loadingOlder.value = false
    }, 600)
  }
  if (id === 'reaction') {
    const last = activeMessages.value[activeMessages.value.length - 1]
    if (last) onReact({ messageId: last.id, emoji: '🔥' })
  }
  if (id === 'emoji' && selectedId.value) {
    setDraft(selectedId.value, 'That show was absolutely  amazing')
  }
  if (id === 'sending' || id === 'seen' || id === 'reply') {
    // Use the composer: sending/seen happen on send; reply is hover on a bubble.
  }
  if (id === 'normal') simulateFromFanIntelligence()
}

function demoFanTyping() {
  if (!selectedId.value || demoTyping.value || showEmpty.value) return
  demoTyping.value = true
  const id = selectedId.value
  state.value = {
    ...state.value,
    conversations: state.value.conversations.map((c) =>
      c.id === id ? { ...c, fanTyping: true } : c
    ),
  }
  clearTimeout(typingTimer)
  typingTimer = setTimeout(() => {
    state.value = {
      ...state.value,
      conversations: state.value.conversations.map((c) =>
        c.id === id ? { ...c, fanTyping: false } : c
      ),
    }
    demoTyping.value = false
  }, 2800)
}

function retryLoad() {
  loadError.value = false
  booting.value = true
  setTimeout(() => {
    booting.value = false
  }, 400)
}

function simulateFromFanIntelligence() {
  showEmpty.value = false
  const target = state.value.conversations.find((c) => c.id === 'conv-sarah')
  if (!target) return
  selectedId.value = target.id
  fiNote.value = target.fan.displayName
  onSelect(target.id)
}
</script>

<style scoped>
.lab-page {
  min-height: 100vh;
  background: #000;
  padding-top: var(--header-height);
  padding-bottom: 5.5rem;
}

@media (min-width: 1024px) {
  .lab-page {
    padding-bottom: 2rem;
  }
}

.lab-page__inner {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0.85rem 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .lab-page__inner {
    padding: 1.25rem 1.5rem;
    gap: 0.9rem;
  }
}

.lab-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .lab-header {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

.lab-kicker {
  margin: 0;
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(232, 121, 249, 0.75);
}

.lab-title {
  margin: 0.15rem 0 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.03em;
}

@media (min-width: 640px) {
  .lab-title {
    font-size: 2rem;
  }
}

.lab-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.lab-exp {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}

.lab-btn {
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.45rem 0.7rem;
  min-height: 36px;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.lab-btn:hover:not(:disabled),
.lab-btn.on {
  background: rgba(147, 51, 234, 0.22);
  border-color: rgba(232, 121, 249, 0.35);
  color: #fff;
}

.lab-btn:disabled {
  opacity: 0.4;
}

.lab-tabs {
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0a0a0c;
  width: 100%;
  max-width: 20rem;
}

.lab-tab {
  flex: 1;
  text-align: center;
  border-radius: 0.65rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  transition: background 0.15s ease, color 0.15s ease;
}

.lab-tab--active {
  background: rgba(147, 51, 234, 0.9);
  color: #fff;
}

.lab-tab:not(.lab-tab--active):hover {
  color: rgba(255, 255, 255, 0.85);
  background: rgba(255, 255, 255, 0.04);
}

.lab-toast {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(232, 121, 249, 0.35);
  background: rgba(147, 51, 234, 0.12);
  padding: 0.75rem 0.9rem;
}

.lab-toast--soft {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
}

.lab-toast__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  color: #f5d0fe;
}

.lab-toast__body {
  margin: 0.15rem 0 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.lab-toast__x {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  padding: 0.15rem;
}

.chat-shell {
  height: min(74vh, 740px);
  min-height: 480px;
  border-radius: 1rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: #000;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02);
}

.chat-shell__fallback {
  height: 100%;
  display: grid;
  place-items: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
}

@media (max-width: 640px) {
  .lab-page__inner {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  .chat-shell,
  .chat-shell--mobile-tight {
    height: calc(100dvh - var(--header-height, 64px) - 10.5rem);
    min-height: 420px;
    border-radius: 0.85rem;
  }

  .lab-kicker {
    display: none;
  }
}
</style>
