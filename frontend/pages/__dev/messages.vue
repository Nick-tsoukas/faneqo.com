<template>
  <div class="dev-msg" :class="{ 'is-mobile': viewport === '390', 'is-bare': bare }">
    <p v-if="!bare" class="dev-msg__rail">Design lab · local only · Messaging</p>
    <header v-if="!bare" class="dev-msg__bar">
      <div>
        <p class="dev-msg__case">{{ current.title }}</p>
        <p class="dev-msg__note">{{ surfaceNote }}</p>
      </div>
      <div class="dev-msg__tools" role="toolbar" aria-label="Lab cases">
        <button
          v-for="item in cases"
          :key="item.id"
          type="button"
          class="dev-msg__btn"
          :class="{ on: caseId === item.id }"
          @click="caseId = item.id"
        >
          {{ item.title }}
        </button>
      </div>
    </header>

    <div v-if="current.surface === 'composer'" class="dev-msg__stage">
      <FaneqoComposerLab :model="composerModel" />
    </div>

    <div v-else-if="current.surface === 'sent'" class="dev-msg__stage is-sent">
      <template v-if="sentModel.mode === 'list'">
        <div class="dev-msg__chrome">
          <div class="dev-msg__title-row">
            <h1>Messages</h1>
          </div>
          <div class="dev-msg__tabs" aria-hidden="true">
            <span class="dev-msg__tab">Inbox</span>
            <span class="dev-msg__tab is-active">Sent</span>
          </div>
        </div>
      </template>
      <FaneqoSentLab :model="sentModel" />
    </div>

    <template v-else>
    <div v-if="current.role === 'artist'" class="dev-msg__chrome">
      <div class="dev-msg__title-row">
        <h1>Messages</h1>
      </div>
      <div class="dev-msg__reach">
        <MessagesAudienceActions />
        <MessagesTabCta />
      </div>
      <div class="dev-msg__tabs" aria-hidden="true">
        <span class="dev-msg__tab is-active">Inbox</span>
        <span class="dev-msg__tab">Sent</span>
      </div>
    </div>
    <div v-else class="dev-msg__chrome is-fan">
      <h1>Messages</h1>
    </div>

    <div class="dev-msg__stage">
      <FaneqoChat
        :current-user="current.role === 'fan' ? fanUser : artistUser"
        :conversations="conversations"
        :selected-conversation-id="selectedId"
        :messages="flipMessages(messages)"
        :loading="!!current.loading"
        :load-error="false"
        :messages-error="!!current.error"
        :messages-loading="!!current.loading"
        :messages-ready="!current.loading"
        :viewer-role="current.role"
        :show-view-fan="current.role === 'artist' && !!selectedId && !String(selectedId).startsWith('request:')"
        :show-inbox-filter="current.role === 'artist'"
        :inbox-filter="inboxFilter"
        :request-count="requestCount"
        :empty-heading="current.role === 'fan' ? 'Your conversations' : ''"
        :empty-copy="current.role === 'fan' ? 'Messages from artists you care about live here.' : ''"
        @select-conversation="onSelect"
        @change-filter="inboxFilter = $event"
        @send-message="onSend"
      >
        <template #thread-empty>
          <MessagesReachPanel />
        </template>
      </FaneqoChat>
    </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FaneqoChat from '~/components/messages/FaneqoChat.vue'
import FaneqoComposerLab from '~/components/messages/FaneqoComposerLab.vue'
import FaneqoSentLab from '~/components/messages/FaneqoSentLab.vue'
import MessagesAudienceActions from '~/components/messages/MessagesAudienceActions.vue'
import MessagesReachPanel from '~/components/messages/MessagesReachPanel.vue'
import MessagesTabCta from '~/components/messages/MessagesTabCta.vue'
import {
  MESSAGING_LAB_ARTIST,
  MESSAGING_LAB_CASES,
  MESSAGING_LAB_FAN_USER,
  messagingLabComposer,
  messagingLabSent,
  messagingLabConversations,
  messagingLabFanConversations,
  messagingLabMessages,
  resolveMessagingLabCase,
} from '~/config/messagingLab'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Messaging lab · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})

const route = useRoute()
const caseId = ref(String(route.query.case || 'artist-inbox'))
const inboxFilter = ref('all')
const artistUser = MESSAGING_LAB_ARTIST
const fanUser = MESSAGING_LAB_FAN_USER
const viewport = computed(() => String(route.query.vw || ''))
const bare = computed(() => String(route.query.bare || '') === '1')
const cases = Object.entries(MESSAGING_LAB_CASES).map(([id, value]) => ({ id, title: value.title }))
const current = computed(() => resolveMessagingLabCase(caseId.value))
const selectedId = ref(current.value.selected)

watch(current, (next) => {
  selectedId.value = next.selected
  inboxFilter.value = next.conversations === 'request' ? 'all' : 'all'
})

const conversations = computed(() => {
  if (current.value.role === 'fan') {
    return current.value.conversations === 'empty' ? [] : messagingLabFanConversations()
  }
  return messagingLabConversations(current.value.conversations)
})
const requestCount = computed(() => conversations.value.filter((row) => row.kind === 'request').length)
const messages = computed(() => messagingLabMessages(current.value.messages))
const composerModel = computed(() => messagingLabComposer(current.value.composer))
const sentModel = computed(() => messagingLabSent(current.value.sent))
const surfaceNote = computed(() => {
  if (current.value.surface === 'composer') return 'Composer'
  if (current.value.surface === 'sent') return 'Sent'
  return current.value.role === 'fan' ? 'Fan view' : 'Artist view'
})

function flipMessages(list) {
  if (current.value.role !== 'fan') return list
  return list.map((row) => ({
    ...row,
    isMine: row.senderRole === 'fan',
    senderName: row.senderRole === 'artist' ? 'The Rockers' : 'You',
    avatarUrl: row.senderRole === 'artist'
      ? 'https://qrcode101.s3.us-east-1.amazonaws.com/medium_gary_bendig_6_G_Mq7_A_Gx_Nb_E_unsplash_33c44247ac.jpg'
      : null,
  }))
}

function onSelect(id) {
  selectedId.value = id ? String(id?.conversationId || id) : null
}

function onSend() {
  /* lab preview only */
}
</script>

<style scoped>
.dev-msg {
  --fq-messages-max: 96rem;
  min-height: 100dvh;
  background: #050506;
  color: #f7f9fc;
  display: flex;
  flex-direction: column;
}
.dev-msg.is-bare {
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
}
.dev-msg__rail {
  margin: 0;
  padding: 0.7rem 1.1rem 0;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.dev-msg__bar {
  padding: 0.55rem 1.1rem 0.7rem;
}
.dev-msg__case {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: rgba(247, 249, 252, 0.55);
}
.dev-msg__note {
  margin: 0.15rem 0 0;
  color: #9aa6b5;
  font-size: 0.82rem;
}
.dev-msg__tools {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.7rem;
}
.dev-msg__btn {
  min-height: 32px;
  padding: 0.2rem 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.72rem;
  cursor: pointer;
}
.dev-msg__btn.on {
  color: #0A0B0E;
  background: #F5F5F6;
  border-color: #F5F5F6;
}
.dev-msg__chrome {
  width: min(100%, var(--fq-messages-max));
  margin: 0 auto;
  padding: 0 1.25rem;
}
.dev-msg__title-row h1,
.dev-msg__chrome h1 {
  margin: 0;
  font-size: 1.45rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}
.dev-msg__reach {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin: 0.75rem 0 0.25rem;
}
.dev-msg__tabs {
  display: flex;
  gap: 0.15rem;
  margin-top: 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.dev-msg__tab {
  min-height: 40px;
  padding: 0.35rem 0.85rem 0.5rem;
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.9rem;
}
.dev-msg__tab.is-active {
  color: #F5F5F6;
  font-weight: 700;
}
.dev-msg__stage {
  flex: 1;
  min-height: 0;
  width: min(100%, var(--fq-messages-max));
  margin: 0 auto;
  padding: 0 1.25rem 1rem;
  display: flex;
  flex-direction: column;
}
.dev-msg.is-mobile .dev-msg__stage,
.dev-msg.is-mobile .dev-msg__chrome,
.dev-msg.is-bare .dev-msg__stage,
.dev-msg.is-bare .dev-msg__chrome {
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
.dev-msg.is-bare .dev-msg__chrome,
.dev-msg.is-bare .dev-msg__stage .dev-msg__chrome {
  display: none;
}
.dev-msg.is-bare .dev-msg__stage {
  padding: 0;
  width: 100%;
}
.dev-msg:not(.is-bare) .dev-msg__stage :deep(.faneqo-chat-root),
.dev-msg:not(.is-bare) .dev-msg__stage :deep(.fq-inbox) {
  min-height: min(78dvh, 52rem);
}
.dev-msg.is-bare .dev-msg__stage {
  flex: 1;
  min-height: 0;
  height: 100%;
}
.dev-msg.is-bare .dev-msg__stage :deep(.faneqo-chat-root),
.dev-msg.is-bare .dev-msg__stage :deep(.fq-inbox) {
  min-height: 0;
  height: 100%;
}
</style>
