<template>
  <MotionConfig :reduced-motion="'user'">
    <div
      class="fq-inbox fq-msg-accents"
      :class="{
        'is-mobile': isMobile,
        'is-thread': isMobile && !!selectedConversationId && !forceEmpty,
      }"
    >
      <!-- List pane -->
      <aside
        v-show="!isMobile || !selectedConversationId || forceEmpty"
        class="fq-inbox__list"
        aria-label="Conversations"
      >
        <div class="fq-inbox__search">
          <component :is="icons.search" class="fq-inbox__search-icon" :size="16" :stroke-width="1.75" aria-hidden="true" />
          <input
            v-model="search"
            type="search"
            class="fq-inbox__search-input"
            placeholder="Search conversations..."
            aria-label="Search conversations"
            @input="emit('search', search)"
          />
          <button
            v-if="search"
            type="button"
            class="fq-inbox__search-clear"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <component :is="icons.close" :size="14" :stroke-width="2" />
          </button>
        </div>

        <div
          v-if="showInboxFilter"
          class="fq-inbox__filters"
          role="tablist"
          aria-label="Direct filters"
        >
          <button
            type="button"
            role="tab"
            class="fq-inbox__filter"
            :class="{ 'is-active': inboxFilter === 'all' }"
            :aria-selected="inboxFilter === 'all'"
            @click="emit('change-filter', 'all')"
          >
            All
          </button>
          <button
            type="button"
            role="tab"
            class="fq-inbox__filter"
            :class="{ 'is-active': inboxFilter === 'requests' }"
            :aria-selected="inboxFilter === 'requests'"
            @click="emit('change-filter', 'requests')"
          >
            Requests
            <span v-if="requestCount > 0" class="fq-inbox__filter-count">{{ requestCount }}</span>
          </button>
        </div>

        <div v-if="loading" class="fq-skel-list" aria-hidden="true">
          <div v-for="n in 6" :key="n" class="fq-skel-row">
            <div class="fq-skel-avatar" />
            <div class="fq-skel-lines">
              <div class="fq-skel-line fq-skel-line--w" />
              <div class="fq-skel-line" />
            </div>
          </div>
        </div>

        <div v-else-if="loadError" class="fq-state">
          <p>Couldn't load conversations.</p>
          <button type="button" class="fq-state__btn" @click="emit('retry-load')">Try again</button>
        </div>

        <div v-else-if="showEmpty" class="fq-state">
          <p class="fq-state__title">{{ emptyTitle }}</p>
          <p>{{ emptyBody }}</p>
          <div v-if="$slots.empty" class="fq-state__actions">
            <slot name="empty" />
          </div>
        </div>

        <div v-else-if="!sortedConversations.length" class="fq-state">
          <p>No matches.</p>
        </div>

        <div v-else class="fq-inbox__scroll">
        <LayoutGroup>
          <ul class="fq-rows" role="list">
            <li v-for="row in sortedConversations" :key="row.id">
              <Motion
                layout="position"
                :transition="reduced ? motionTokens.micro : motionTokens.springSoft"
              >
              <button
                type="button"
                class="fq-row"
                :class="{
                  'is-active': row.id === selectedConversationId,
                  'is-unread': row.unreadCount > 0,
                  'is-request': row.kind === 'request',
                }"
                :aria-current="row.id === selectedConversationId ? 'true' : undefined"
                :aria-label="rowAriaLabel(row)"
                @click="selectRow(row.id)"
              >
                <img
                  v-if="peerAvatar(row)"
                  :src="peerAvatar(row)"
                  alt=""
                  class="fq-row__avatar"
                  @error="markAvatarBroken(peerAvatar(row))"
                />
                <span
                  v-else
                  class="fq-row__avatar"
                  :class="isFallbackPeer(row) ? 'fq-row__avatar--mark' : 'fq-row__avatar--init'"
                  aria-hidden="true"
                >{{ isFallbackPeer(row) ? '' : rowInitials(row) }}</span>
                <div class="fq-row__meta">
                  <div class="fq-row__top">
                    <span class="fq-row__name">{{ peerName(row) }}</span>
                    <span v-if="row.unreadCount > 0" class="fq-row__dot" aria-hidden="true" />
                    <span v-if="row.kind === 'request'" class="fq-row__request">Request</span>
                    <span v-else class="fq-row__time">{{ relative(row.lastMessageAt || row.updatedAt) }}</span>
                  </div>
                  <p v-if="showRowContext(row)" class="fq-row__context">
                    {{ rowContext(row) }}
                  </p>
                  <div class="fq-row__bottom">
                    <p v-if="draftPreview(row.id)" class="fq-row__preview is-draft">
                      Draft: {{ draftPreview(row.id) }}
                    </p>
                    <p v-else-if="isPhotoPreview(row.lastMessagePreview)" class="fq-row__preview is-media">
                      <component :is="icons.photo" :size="13" :stroke-width="1.85" aria-hidden="true" />
                      <span>{{ row.lastMessagePreview }}</span>
                    </p>
                    <p v-else-if="showRowPreview(row)" class="fq-row__preview">{{ row.lastMessagePreview }}</p>
                    <Motion
                      v-if="row.unreadCount > 0"
                      class="fq-row__badge"
                      :initial="reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }"
                      :animate="{ opacity: 1, scale: 1 }"
                      :transition="motionTokens.micro"
                    >
                      {{ row.unreadCount }}
                    </Motion>
                  </div>
                </div>
              </button>
              </Motion>
            </li>
          </ul>
        </LayoutGroup>
        </div>
      </aside>

      <!-- Thread pane -->
      <section
        v-show="!forceEmpty && (!isMobile || !!selectedConversationId)"
        class="fq-inbox__thread"
        :aria-label="threadLabel"
      >
        <header v-if="selectedConversationId" class="fq-thread__head">
          <FaneqoIconButton
            v-if="isMobile"
            name="back"
            aria-label="Back to conversations"
            @click="emit('select-conversation', null)"
          />
          <FaneqoFanIdentity
            class="min-w-0 flex-1"
            :name="peerName(activeConversation)"
            :context="threadContext(activeConversation)"
            :avatar-url="peerAvatar(activeConversation) || ''"
            :initials="rowInitials(activeConversation)"
            size="sm"
          />
          <button
            v-if="showViewFan && !isRequestSelected"
            type="button"
            class="fq-thread__view"
            @click="onViewFan"
          >
            View fan
            <component :is="icons.chevronRight" :size="16" :stroke-width="2" aria-hidden="true" />
          </button>
          <NuxtLink
            v-if="viewerRole === 'fan' && artistHref && !isRequestSelected"
            :to="artistHref"
            class="fq-thread__view"
          >
            View artist
            <component :is="icons.chevronRight" :size="16" :stroke-width="2" aria-hidden="true" />
          </NuxtLink>
          <FaneqoIconButton
            v-if="viewerRole === 'fan'"
            name="more"
            aria-label="Conversation actions"
            @click="convMenuOpen = !convMenuOpen"
          />
          <div v-if="convMenuOpen && viewerRole === 'fan'" class="fq-conv-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              class="fq-conv-menu__item"
              @click="emit(conversationBlocked ? 'unblock' : 'block')"
            >
              {{ conversationBlocked ? 'Unblock' : 'Block' }}
            </button>
          </div>
        </header>

        <div
          v-if="!selectedConversationId && !isMobile && !messagesError"
          class="fq-state fq-state--pane"
        >
          <slot name="thread-empty">
            <div>
              <span class="fq-state__icon" aria-hidden="true">
                <component :is="icons.message" :size="26" :stroke-width="1.6" />
              </span>
              <p class="fq-state__title">Your conversations</p>
              <p>Choose a fan from the Inbox, or start a private conversation.</p>
            </div>
          </slot>
        </div>

        <div
          v-else-if="isRequestSelected"
          class="fq-request"
        >
          <FaneqoFanIdentity
            :name="peerName(activeConversation)"
            :context="rowContext(activeConversation)"
            :avatar-url="peerAvatar(activeConversation) || ''"
            :initials="rowInitials(activeConversation)"
          />
          <template v-if="viewerRole === 'artist'">
            <p class="fq-request__kicker">Message request</p>
            <blockquote class="fq-request__body">“{{ activeConversation?.initialMessage || activeConversation?.lastMessagePreview }}”</blockquote>
            <div class="fq-request__actions">
              <button
                type="button"
                class="fq-request__accept"
                :disabled="requestBusy"
                @click="emit('accept-request', activeConversation?.requestId)"
              >
                {{ requestBusy ? 'Opening…' : 'Accept' }}
              </button>
              <button
                type="button"
                class="fq-request__decline"
                :disabled="requestBusy"
                @click="emit('decline-request', activeConversation?.requestId)"
              >
                Decline
              </button>
            </div>
          </template>
          <template v-else>
            <p class="fq-request__kicker">Request pending</p>
            <p class="fq-request__pending">Your message request is waiting for the artist.</p>
          </template>
        </div>

        <div v-else-if="conversationUnavailable" class="fq-state fq-state--inline">
          <p>This conversation isn't available.</p>
          <button type="button" class="fq-state__btn" @click="emit('select-conversation', null)">Back to Messages</button>
        </div>

        <div v-else-if="messagesError" class="fq-state fq-state--inline">
          <p>Couldn't load this conversation.</p>
          <button type="button" class="fq-state__btn" @click="emit('retry-messages')">Try again</button>
        </div>

        <div
          v-else
          ref="scrollerRef"
          class="fq-thread__scroller"
          @scroll="onScroll"
        >
          <div class="fq-thread__canvas">
          <div v-if="loadingOlder" class="fq-older" aria-hidden="true">
            <div class="fq-skel-line fq-skel-line--msg" />
            <div class="fq-skel-line fq-skel-line--msg is-me" />
          </div>

          <div v-if="showThreadSkeletons" class="fq-older" aria-hidden="true">
            <div class="fq-skel-line fq-skel-line--msg" />
            <div class="fq-skel-line fq-skel-line--msg is-me" />
            <div class="fq-skel-line fq-skel-line--msg" />
          </div>

          <AnimatePresence>
            <Motion
              v-if="showFirstThread"
              key="first-thread"
              v-bind="firstThreadMotion"
            >
              <FaneqoFirstThread
                :peer-name="peerName(activeConversation)"
                :context="viewerRole === 'artist' ? rowContext(activeConversation) : ''"
                :viewer-role="viewerRole"
                :show-starters="showStarterChips"
                @insert="insertStarter"
              />
            </Motion>
          </AnimatePresence>

          <template v-for="(msg, index) in messages" :key="msg.id">
            <div v-if="nightBreak(index)" class="fq-night" role="separator">
              <p v-if="nightBreak(index).kicker" class="fq-night__kicker">{{ nightBreak(index).kicker }}</p>
              <p v-if="nightBreak(index).title" class="fq-night__title">{{ nightBreak(index).title }}</p>
            </div>
            <Motion
              class="fq-msg"
              :class="{
                'is-mine': isMine(msg),
                'is-grouped': isGrouped(index),
                'is-media': messageAttachments(msg).length > 0,
                'is-gallery': Boolean(msg.galleryReference),
              }"
              v-bind="messageEnter(reduced)"
            >
              <img
                v-if="!isMine(msg) && isGroupStartAt(index) && msg.avatarUrl"
                :src="msg.avatarUrl"
                alt=""
                class="fq-msg__avatar"
              />
              <div v-else-if="!isMine(msg)" class="fq-msg__avatar-spacer" aria-hidden="true" />

              <div class="fq-msg__col">
                <p v-if="!isMine(msg) && isGroupStartAt(index)" class="fq-msg__name">
                  {{ msg.senderName }}
                  <span v-if="stamp(msg.createdAt)"> · {{ stamp(msg.createdAt) }}</span>
                </p>
                <span v-else-if="isGrouped(index)" class="sr-only">{{ msg.senderName }}</span>
                <div
                  class="fq-msg__bubble"
                  :class="{
                    'has-image': messageAttachments(msg).length > 0,
                    'has-gallery': Boolean(msg.galleryReference),
                  }"
                >
                  <div v-if="msg.replyTo" class="fq-msg__quote">
                    {{ msg.replyTo.body }}
                  </div>
                  <FaneqoGalleryMessageCard
                    v-if="msg.galleryReference"
                    :gallery="msg.galleryReference"
                    :caption="msg.body"
                    :viewer-role="viewerRole"
                    :hide-actions="!showGalleryActions(index)"
                    @open="({ items, index: photoIndex }) => openLightbox(items, photoIndex)"
                  />
                  <FaneqoMediaGrid
                    v-if="!msg.galleryReference && messageAttachments(msg).length"
                    variant="bubble"
                    :items="messageAttachments(msg)"
                    @open="({ index: photoIndex }) => openLightbox(messageAttachments(msg), photoIndex)"
                  />
                  <p v-if="msg.body && !msg.galleryReference" class="fq-msg__text">{{ msg.body }}</p>
                </div>
                <div v-if="reactionsFor(msg.id).length" class="fq-msg__reacts">
                  <span v-for="r in reactionsFor(msg.id)" :key="r" class="fq-msg__react">{{ r }}</span>
                </div>
                <div class="fq-msg__meta">
                  <span v-if="showStamp(msg, index)" class="fq-msg__time">{{ stamp(msg.createdAt) }}</span>
                  <FaneqoMessageStatus
                    v-if="showStatus(msg, index)"
                    :state="uiStatus(msg.status)"
                    @retry="emit('retry-message', msg)"
                  />
                </div>
              </div>
            </Motion>
          </template>

          <div class="fq-typing-slot">
            <FaneqoTypingIndicator
              v-if="isTyping"
              :name="typingName"
              :band-identity="viewerRole === 'fan'"
            />
          </div>
          <div ref="bottomRef" />
          </div>
        </div>

        <FaneqoNewMessagesPill
          v-if="pendingNew > 0"
          class="fq-inbox__pill"
          :count="pendingNew"
          @jump="jumpToNewest"
        />

        <div v-if="conversationBlocked" class="fq-banner">
          <p>{{ viewerRole === 'fan' ? 'You blocked this conversation.' : 'This fan blocked the conversation.' }}</p>
          <button v-if="viewerRole === 'fan'" type="button" class="fq-state__btn" @click="emit('unblock')">Unblock</button>
        </div>
        <div v-else-if="conversationRemoved" class="fq-banner">
          <p>Messaging is no longer available for this fan.</p>
        </div>

        <FaneqoMediaLightbox
          :open="!!lightbox"
          :items="lightbox?.items || []"
          :start-index="lightbox?.index || 0"
          :title="peerName(activeConversation)"
          @close="lightbox = null"
        />

        <FaneqoMessageComposer
          v-if="showComposer"
          ref="composerRef"
          v-model="draft"
          :placeholder="composerPlaceholder"
          :disabled="conversationBlocked || conversationRemoved"
          :reply-to="enableReply ? replyTo : null"
          :conversation-id="selectedConversationId"
          :band-id="bandId"
          :viewer-role="viewerRole"
          :allow-gallery="viewerRole === 'artist' && Boolean(bandId)"
          :style="composerInset"
          @send="onSend"
          @cancel-reply="replyTo = null"
        />
      </section>
    </div>
  </MotionConfig>
</template>

<script setup>
/**
 * Native Faneqo Inbox shell for the chat lab.
 * VAC remains a dependency/adapter for Phase 3; Shadow DOM cannot meet
 * composer, list-reorder, draft, or action-menu quality.
 */
import { computed, nextTick, ref, watch } from 'vue'
import { AnimatePresence, LayoutGroup, Motion, MotionConfig } from 'motion-v'
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import { useConversationDrafts } from '~/composables/useConversationDrafts'
import { useVisualViewportInset } from '~/composables/useVisualViewportInset'
import FaneqoFanIdentity from '~/components/messages/FaneqoFanIdentity.vue'
import FaneqoFirstThread from '~/components/messages/FaneqoFirstThread.vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'
import FaneqoMediaGrid from '~/components/media/FaneqoMediaGrid.vue'
import FaneqoMediaLightbox from '~/components/media/FaneqoMediaLightbox.vue'
import FaneqoIconButton from '~/components/ui/FaneqoIconButton.vue'
import FaneqoMessageComposer from '~/components/messages/FaneqoMessageComposer.vue'
import FaneqoMessageStatus from '~/components/messages/FaneqoMessageStatus.vue'
import FaneqoNewMessagesPill from '~/components/messages/FaneqoNewMessagesPill.vue'
import FaneqoTypingIndicator from '~/components/messages/FaneqoTypingIndicator.vue'
import { resolveFanAvatarUrl } from '~/utils/fan/fanProfileIdentity'
import { collectMessageAttachments, isMediaPreviewLabel } from '~/utils/media/faneqoMedia'
import {
  fanFirstName,
  formatChatTimestamp,
  formatFanContextLine,
  formatRelativeListTime,
} from '~/utils/messages/chatUiAdapter'
import { FANEQO_FAN_FALLBACK, isFallbackFanDisplay, isRequestRowId } from '~/utils/messages/fanIdentity'
import {
  formatNightSeparator,
  formatNightsTogetherLabel,
  isGroupEnd,
  isGroupStart,
  isGroupedWithPrevious,
  isLastGalleryInSenderRun,
  messageNightChapter,
  shouldShowNightSeparator,
} from '~/utils/messages/threadPresentation'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { inboxUiLog } from '~/utils/messages/inboxUiLog'
import { messageEnter, motionTokens } from '~/utils/ui/motionTokens'

const props = defineProps({
  currentUser: { type: Object, required: true },
  conversations: { type: Array, default: () => [] },
  selectedConversationId: { type: String, default: null },
  bandId: { type: [String, Number], default: null },
  messages: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  forceEmpty: { type: Boolean, default: false },
  searchActive: { type: Boolean, default: false },
  loadError: { type: Boolean, default: false },
  messagesError: { type: Boolean, default: false },
  loadingOlder: { type: Boolean, default: false },
  messagesLoading: { type: Boolean, default: false },
  messagesReady: { type: Boolean, default: true },
  viewerRole: { type: String, default: 'artist' },
  isTyping: { type: Boolean, default: false },
  typingName: { type: String, default: '' },
  conversationBlocked: { type: Boolean, default: false },
  conversationRemoved: { type: Boolean, default: false },
  conversationUnavailable: { type: Boolean, default: false },
  reactions: { type: Object, default: () => ({}) },
  holdAutoFollow: { type: Boolean, default: false },
  draftsKey: { type: String, default: 'faneqo.inbox.drafts' },
  enableReactions: { type: Boolean, default: false },
  enableReply: { type: Boolean, default: false },
  showViewFan: { type: Boolean, default: false },
  emptyHeading: { type: String, default: '' },
  emptyCopy: { type: String, default: '' },
  showInboxFilter: { type: Boolean, default: false },
  inboxFilter: { type: String, default: 'all' },
  requestCount: { type: Number, default: 0 },
  requestBusy: { type: Boolean, default: false },
})

const emit = defineEmits([
  'select-conversation',
  'send-message',
  'reply-message',
  'view-fan',
  'fetch-messages',
  'search',
  'retry-load',
  'retry-messages',
  'retry-message',
  'block',
  'unblock',
  'react',
  'load-older',
  'change-filter',
  'accept-request',
  'decline-request',
])

const icons = faneqoIcons
const isMobile = useMediaQuery('(max-width: 899px)')
const prefersReduced = usePreferredReducedMotion()
const reduced = computed(() => prefersReduced.value === 'reduce')
const { getDraft, setDraft, clearDraft, preview: draftPreview } = useConversationDrafts(props.draftsKey)
const { keyboardInset } = useVisualViewportInset()
const composerInset = computed(() =>
  keyboardInset.value > 0 ? { paddingBottom: `${keyboardInset.value}px` } : undefined
)

const search = ref('')
const replyTo = ref(null)
const convMenuOpen = ref(false)
const scrollerRef = ref(null)
const bottomRef = ref(null)
const composerRef = ref(null)
const lightbox = ref(null)
const pendingNew = ref(0)
const olderLock = ref(null)
const nearBottom = ref(true)
const initialFollowConversationId = ref(null)

const sortedConversations = computed(() =>
  [...(props.conversations || [])].sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
)

const activeConversation = computed(() => {
  const id = props.selectedConversationId
  const found = (props.conversations || []).find((c) => String(c.id) === String(id))
  if (found) return found
  if (!id) return null
  return {
    id: String(id),
    fan: {
      displayName: props.viewerRole === 'fan' ? 'Artist' : FANEQO_FAN_FALLBACK,
      context: '',
    },
    artist: { name: 'Artist' },
  }
})

const showEmpty = computed(() => {
  if (props.forceEmpty) return true
  if (props.searchActive || search.value.trim()) return false
  return !props.loading && !(props.conversations || []).length
})

const emptyTitle = computed(() => {
  if (props.emptyHeading) return props.emptyHeading
  return props.viewerRole === 'fan' ? 'No messages yet.' : 'No conversations yet.'
})
const emptyBody = computed(() => {
  if (props.emptyCopy) return props.emptyCopy
  return props.viewerRole === 'fan'
    ? 'Messages from artists you connect with will appear here.'
    : 'Choose a fan from the Inbox, or start a private conversation.'
})

const threadLabel = computed(
  () => peerName(activeConversation.value) || 'Conversation'
)

const composerPlaceholder = computed(() => {
  const first = fanFirstName(peerName(activeConversation.value))
  return first && first !== 'them' ? `Message ${first}...` : 'Write a message…'
})

const historyResolved = computed(() =>
  !!props.selectedConversationId &&
  !props.messagesLoading &&
  !props.loading &&
  props.messagesReady
)

const showThreadSkeletons = computed(() =>
  !!props.selectedConversationId &&
  !props.messagesError &&
  !props.messages.length &&
  !historyResolved.value
)

const showFirstThread = computed(() =>
  !!props.selectedConversationId &&
  !props.messagesError &&
  !props.messages.length &&
  historyResolved.value &&
  !props.conversationRemoved
)

const showStarterChips = computed(() =>
  props.viewerRole === 'artist' &&
  showFirstThread.value &&
  !String(draft.value || '').trim()
)

const firstThreadMotion = computed(() =>
  reduced.value
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: motionTokens.micro,
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
        transition: motionTokens.standard,
      }
)

const draft = computed({
  get: () => getDraft(props.selectedConversationId),
  set: (v) => setDraft(props.selectedConversationId, v),
})

function relative(value) {
  return formatRelativeListTime(value)
}
function stamp(value) {
  return formatChatTimestamp(value)
}
function fanLine(fan) {
  if (!fan) return ''
  if (fan.context) return String(fan.context)
  return formatFanContextLine(fan)
}
function rowContext(row) {
  return fanLine(row?.fan)
}
function showRowContext(row) {
  if (!rowContext(row)) return false
  return props.viewerRole === 'artist' || row?.kind === 'request'
}
function showRowPreview(row) {
  const preview = String(row?.lastMessagePreview || '').trim()
  if (!preview) return false
  return preview !== rowContext(row)
}
function threadContext(row) {
  if (props.viewerRole === 'artist') return rowContext(row)
  if (row?.kind === 'request') return rowContext(row)
  return formatNightsTogetherLabel(row?.showCount || row?.fan?.showCount)
}
function rowAriaLabel(row) {
  const name = peerName(row) || (props.viewerRole === 'fan' ? 'Artist' : FANEQO_FAN_FALLBACK)
  const unread = row?.unreadCount > 0 ? `, ${row.unreadCount} unread` : ''
  if (row?.kind === 'request') {
    return props.viewerRole === 'fan'
      ? `Request pending with ${name}`
      : `Message request from ${name}`
  }
  return `Conversation with ${name}${unread}`
}
function isPhotoPreview(text) {
  return isMediaPreviewLabel(text)
}
function isMine(msg) {
  if (typeof msg?.isMine === 'boolean') return msg.isMine
  if (props.viewerRole === 'fan') return msg.senderRole === 'fan'
  return msg.senderRole === 'artist'
}
function peerName(row) {
  if (!row) return ''
  if (props.viewerRole === 'fan') return row.artist?.name || row.fan?.displayName || 'Artist'
  return row.fan?.displayName || FANEQO_FAN_FALLBACK
}
const config = useRuntimeConfig()
const brokenAvatars = ref(new Set())
function markAvatarBroken(url) {
  const key = String(url || '').trim()
  if (!key || brokenAvatars.value.has(key)) return
  const next = new Set(brokenAvatars.value)
  next.add(key)
  brokenAvatars.value = next
}
function peerAvatar(row) {
  if (!row) return null
  const raw = props.viewerRole === 'fan'
    ? row.artist?.avatarUrl || row.fan?.avatarUrl || null
    : row.fan?.avatarUrl || null
  const url = resolveFanAvatarUrl(raw, config.public.strapiUrl)
  if (!url || brokenAvatars.value.has(url)) return null
  return url
}
function initials(name) {
  const parts = String(name || 'F').trim().split(/\s+/).filter(Boolean)
  const letters = (parts[0]?.[0] || 'F') + (parts[1]?.[0] || '')
  return letters.toUpperCase()
}
function rowInitials(row) {
  return row?.fan?.initials || initials(peerName(row))
}
function isFallbackPeer(row) {
  return props.viewerRole !== 'fan' && isFallbackFanDisplay(peerName(row))
}
const artistHref = computed(() => {
  const slug = String(activeConversation.value?.artist?.slug || '').trim()
  return slug ? `/${slug}` : ''
})
const isRequestSelected = computed(() =>
  isRequestRowId(props.selectedConversationId) || activeConversation.value?.kind === 'request'
)
const showComposer = computed(() =>
  !!props.selectedConversationId &&
  !props.conversationRemoved &&
  !isRequestSelected.value &&
  !props.messagesError &&
  !props.conversationUnavailable
)
function uiStatus(status) {
  if (status === 'delivered') return 'sent'
  return status || 'sent'
}
function showStatus(msg, index) {
  if (!isMine(msg)) return false
  const state = uiStatus(msg.status)
  if (state === 'failed' || state === 'sending') return true
  for (let i = props.messages.length - 1; i >= 0; i -= 1) {
    if (isMine(props.messages[i])) return i === index
  }
  return false
}
function isGrouped(index) {
  return isGroupedWithPrevious(props.messages, index)
}
function isGroupStartAt(index) {
  return isGroupStart(props.messages, index)
}
function showStamp(msg, index) {
  if (!isGroupEnd(props.messages, index)) return false
  if (!isMine(msg)) return false
  return true
}
function nightBreak(index) {
  if (!shouldShowNightSeparator(props.messages, index)) return null
  return formatNightSeparator(messageNightChapter(props.messages[index]))
}
function showGalleryActions(index) {
  return isLastGalleryInSenderRun(props.messages, index)
}
function reactionsFor(id) {
  return props.reactions?.[id] || []
}

function selectRow(id) {
  convMenuOpen.value = false
  emit('select-conversation', id)
  emit('fetch-messages', { conversationId: id })
}

function clearSearch() {
  search.value = ''
  emit('search', '')
}

function onViewFan() {
  convMenuOpen.value = false
  const conv = activeConversation.value
  emit('view-fan', {
    conversationId: conv?.id,
    fanId: conv?.fan?.fanId || null,
    displayName: conv?.fan?.displayName || null,
  })
}

function setReply(msg) {
  replyTo.value = {
    id: msg.id,
    body: msg.body,
    senderId: msg.senderId,
    senderName: msg.senderName,
  }
}

function messageAttachments(msg) {
  return collectMessageAttachments(msg)
}

function openLightbox(items, index = 0) {
  if (!items?.length) return
  lightbox.value = { items, index }
}

function insertStarter(text) {
  const next = String(text || '').trim()
  if (!next) return
  draft.value = next
  nextTick(() => composerRef.value?.focus?.())
}

function onSend(payloadOrBody) {
  const wasFirst = !props.messages.length
  const body = typeof payloadOrBody === 'string' ? payloadOrBody : payloadOrBody?.body
  const attachments = typeof payloadOrBody === 'object'
    ? (payloadOrBody?.attachments || (payloadOrBody?.attachment ? [payloadOrBody.attachment] : []))
    : []
  const galleryReference = typeof payloadOrBody === 'object'
    ? (payloadOrBody?.galleryReference || null)
    : null
  const payload = {
    conversationId: props.selectedConversationId,
    body: String(body || '').trim(),
    attachments,
    attachment: attachments[0] || null,
    galleryReference,
    replyTo: replyTo.value,
  }
  emit('send-message', payload)
  if (replyTo.value) emit('reply-message', payload)
  clearDraft(props.selectedConversationId)
  replyTo.value = null
  nearBottom.value = true
  pendingNew.value = 0
  if (wasFirst) {
    inboxUiLog('first-message:sent', {
      conversationId: props.selectedConversationId,
      role: props.viewerRole,
    })
  }
  nextTick(scrollToBottom)
}

function onScroll() {
  const el = scrollerRef.value
  if (!el || !props.selectedConversationId) return
  const gap = el.scrollHeight - el.scrollTop - el.clientHeight
  nearBottom.value = gap < 72
  if (nearBottom.value) pendingNew.value = 0
  if (el.scrollTop < 64 && !props.loadingOlder) emit('load-older')
}

function scrollToBottom(behavior = reduced.value ? 'auto' : 'smooth') {
  bottomRef.value?.scrollIntoView({ behavior, block: 'end' })
}

function jumpToNewest() {
  pendingNew.value = 0
  nearBottom.value = true
  scrollToBottom()
}

watch(
  () => [props.selectedConversationId, showFirstThread.value],
  ([id, show]) => {
    if (show && id) {
      inboxUiLog('first-thread:empty', { conversationId: id, role: props.viewerRole })
    }
  }
)

watch(
  () => props.selectedConversationId,
  (id) => {
    replyTo.value = null
    convMenuOpen.value = false
    pendingNew.value = 0
    lightbox.value = null
    initialFollowConversationId.value = id ? String(id) : null
  },
  { immediate: true }
)

watch(
  () => [String(props.selectedConversationId || ''), historyResolved.value, props.messages.length],
  async ([id, resolved]) => {
    if (!id || !resolved || initialFollowConversationId.value !== id) return
    await nextTick()
    nearBottom.value = true
    pendingNew.value = 0
    scrollToBottom('auto')
    initialFollowConversationId.value = null
  }
)

watch(
  () => props.holdAutoFollow,
  (held) => {
    if (held) nearBottom.value = false
  }
)

watch(
  () => props.loadingOlder,
  (loading, was) => {
    const el = scrollerRef.value
    if (!el) return
    if (loading && !was) olderLock.value = el.scrollHeight
    if (!loading && was && olderLock.value != null) {
      el.scrollTop += el.scrollHeight - olderLock.value
      olderLock.value = null
    }
  }
)

watch(
  () => `${props.selectedConversationId || ''}:${props.messages.map((m) => m.id).join(',')}`,
  (sig, prevSig) => {
    if (!prevSig) return
    const conv = String(props.selectedConversationId || '')
    const prevConv = String(prevSig).split(':')[0]
    if (!conv || prevConv !== conv) return
    const prevIds = String(prevSig).slice(prevConv.length + 1)
    const prev = new Set(prevIds.split(',').filter(Boolean))
    const prevNums = [...prev].map(Number).filter((n) => Number.isFinite(n) && n > 0)
    const minPrev = prevNums.length ? Math.min(...prevNums) : Infinity
    const added = props.messages.filter((m) => !prev.has(String(m.id)))
    const newer = added.filter((m) => {
      const n = Number(m.id)
      if (String(m.id).startsWith('opt-')) return true
      if (!Number.isFinite(n)) return true
      return n > minPrev
    })
    if (!newer.length) return
    if (nearBottom.value && !props.holdAutoFollow) nextTick(scrollToBottom)
    else pendingNew.value += newer.length
  }
)

</script>

<style>
@import '~/assets/css/faneqo-messaging-accents.css';
</style>

<style scoped>
.fq-inbox {
  --fq-msg-canvas: 48rem;
  --fq-gallery-max: 36rem;
  display: grid;
  grid-template-columns: minmax(17.5rem, 21.25rem) minmax(0, 1fr);
  flex: 1;
  height: 100%;
  min-height: 0;
  background: var(--fq-canvas, #07080A);
  color: var(--fq-text-primary, #fafafa);
  position: relative;
  overflow: hidden;
}

@media (min-width: 1280px) {
  .fq-inbox {
    --fq-msg-canvas: 58rem;
    --fq-gallery-max: 42rem;
  }
}

@media (min-width: 1440px) {
  .fq-inbox {
    --fq-msg-canvas: 64rem;
    --fq-gallery-max: 48rem;
  }
}

.fq-inbox.is-mobile {
  grid-template-columns: 1fr;
}

.fq-inbox.is-mobile.is-thread .fq-inbox__thread {
  animation: fq-thread-in 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fq-thread-in {
  from {
    transform: translateX(18px);
    opacity: 0.88;
  }
  to {
    transform: none;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fq-inbox.is-mobile.is-thread .fq-inbox__thread {
    animation: none;
  }
}

.fq-inbox__list,
.fq-inbox__thread {
  height: 100%;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.fq-inbox__thread {
  background: var(--fq-canvas, #07080A);
}

.fq-inbox__list {
  border-right: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface, #0B0C10);
}

.fq-inbox__search {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 0.4rem;
  margin: 0.6rem 0.75rem 0.35rem;
  padding: 0 0.6rem;
  min-height: 38px;
  border-radius: 0.7rem;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface-raised, #111217);
}

.fq-inbox__search:focus-within {
  border-color: rgba(57, 213, 255, 0.45);
  box-shadow: 0 0 0 1px rgba(57, 213, 255, 0.18);
}

.fq-inbox__search-icon {
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.fq-inbox__search-input {
  flex: 1;
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 0.86rem;
  min-height: 36px;
  outline: none;
}

.fq-inbox__search-clear {
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.45);
  cursor: pointer;
  min-width: 32px;
  min-height: 32px;
}

.fq-inbox__filters {
  display: flex;
  gap: 0.35rem;
  padding: 0 0.75rem 0.35rem;
}

.fq-inbox__filter {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-height: 32px;
  padding: 0 0.45rem 0.2rem;
  border: 0;
  border-bottom: 1.5px solid transparent;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.46);
  font-size: 0.78rem;
  font-weight: 650;
  cursor: pointer;
}

.fq-inbox__filter.is-active {
  background: transparent;
  color: #fff;
  border-bottom-color: rgba(245, 245, 246, 0.82);
}

.fq-inbox__filter:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 2px;
}

.fq-inbox__filter-count {
  min-width: 1.1rem;
  padding: 0 0.28rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #F5F5F6;
  font-size: 0.68rem;
  font-weight: 750;
  text-align: center;
}

.fq-row__request {
  margin-left: auto;
  color: rgba(57, 213, 255, 0.72);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.01em;
}

.fq-inbox__scroll {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.fq-rows {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0.4rem 0.8rem;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.fq-row {
  display: flex;
  width: 100%;
  gap: 0.7rem;
  text-align: left;
  padding: 0.52rem 0.65rem 0.52rem 0.8rem;
  border: 0;
  background: transparent;
  color: inherit;
  border-radius: 0.55rem;
  cursor: pointer;
  min-height: 60px;
  position: relative;
}

.fq-row:hover {
  background: var(--fq-surface-hover, #14161B);
}

.fq-row:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: -2px;
}

.fq-row.is-active {
  background: rgba(255, 255, 255, 0.045);
  box-shadow: inset 2px 0 0 rgba(245, 245, 246, 0.78);
}

.fq-row.is-active .fq-row__name {
  color: #fff;
  font-weight: 700;
}

.fq-row.is-unread .fq-row__name {
  color: #fff;
  font-weight: 700;
}

.fq-row__avatar,
.fq-thread__avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.fq-row__avatar--init,
.fq-row__avatar--mark {
  display: grid;
  place-items: center;
  background: #14161B;
  color: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.fq-row__avatar--mark {
  background:
    radial-gradient(circle at 50% 42%, rgba(255, 255, 255, 0.16), transparent 42%),
    #121318;
}

.fq-row__meta {
  min-width: 0;
  flex: 1;
}

.fq-row__top {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.fq-row__name,
.fq-thread__name {
  min-width: 0;
  flex: 1;
  font-weight: 650;
  font-size: 0.94rem;
  letter-spacing: -0.015em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-row__dot {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: #F5F5F6;
  flex-shrink: 0;
}

.fq-row__time {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.32);
  font-size: 0.68rem;
}

.fq-row__badge {
  margin-left: auto;
  min-width: 1.15rem;
  height: 1.15rem;
  padding: 0 0.32rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #F5F5F6;
  font-size: 0.65rem;
  font-weight: 700;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.fq-row__context {
  margin: 0.1rem 0 0;
  font-size: 0.75rem;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.42));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-row__bottom {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.fq-row__preview {
  margin: 0.1rem 0 0;
  font-size: 0.8rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.5));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.fq-row__preview.is-draft {
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
}

.fq-row__preview.is-media {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  color: rgba(255, 255, 255, 0.58);
}

.fq-row.is-unread .fq-row__preview {
  color: rgba(255, 255, 255, 0.72);
}

.fq-thread__head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;
  padding: 0.5rem 1.05rem;
  border-bottom: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  background: var(--fq-surface, #0B0C10);
  position: relative;
  min-height: 3.45rem;
}

.fq-thread__view {
  display: inline-flex;
  align-items: center;
  gap: 0.12rem;
  flex-shrink: 0;
  border: 0;
  background: transparent;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.55));
  font-size: 0.78rem;
  font-weight: 650;
  min-height: 44px;
  padding: 0 0.45rem;
  cursor: pointer;
  border-radius: 0.55rem;
  text-decoration: none;
}

.fq-thread__view:hover,
.fq-thread__view:focus-visible {
  color: rgba(255, 255, 255, 0.78);
  outline: none;
}

.fq-thread__info {
  margin: 0.08rem 0 0;
  font-size: 0.72rem;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.42));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fq-conv-menu {
  position: absolute;
  right: 0.5rem;
  top: 3.1rem;
  z-index: 20;
  min-width: 9rem;
  padding: 0.3rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #18181b;
}

.fq-conv-menu__item {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  background: transparent;
  color: #fff;
  padding: 0.55rem 0.7rem;
  min-height: 40px;
  border-radius: 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.fq-thread__scroller {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.fq-thread__canvas {
  width: min(100%, var(--fq-msg-canvas, 46rem));
  margin: 0 auto;
  padding: 1rem 1.15rem 0.55rem;
  box-sizing: border-box;
}

.fq-night {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  margin: 1.05rem 0 0.45rem;
  padding: 0 0.15rem 0 2.05rem;
}

.fq-night__kicker {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.fq-night__title {
  margin: 0.18rem 0 0;
  color: #F5F5F6;
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.02em;
}

.fq-msg {
  display: flex;
  gap: 0.45rem;
  margin-bottom: 0.42rem;
  position: relative;
}

.fq-msg.is-grouped {
  margin-bottom: 0.1rem;
}

.fq-msg.is-media,
.fq-msg.is-gallery {
  margin-bottom: 0.62rem;
}

.fq-msg.is-media.is-grouped,
.fq-msg.is-gallery.is-grouped {
  margin-bottom: 0.28rem;
}

.fq-msg.is-mine {
  flex-direction: row-reverse;
}

.fq-msg__avatar,
.fq-msg__avatar-spacer {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  object-fit: cover;
  flex-shrink: 0;
}

.fq-msg__col {
  max-width: min(100%, 52rem);
  min-width: 0;
}

.fq-msg:not(.is-media):not(.is-gallery) .fq-msg__col {
  max-width: min(92%, 38rem);
}

.fq-msg.is-gallery .fq-msg__col {
  flex: 1 1 auto;
  width: min(100%, var(--fq-gallery-max, 36rem));
  max-width: min(100%, var(--fq-gallery-max, 36rem));
}

.fq-msg.is-mine .fq-msg__col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.fq-msg__name {
  margin: 0 0 0.2rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.fq-msg__bubble {
  display: inline-block;
  padding: 0.52rem 0.78rem;
  border-radius: 1.05rem;
  background: #111217;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  color: #fafafa;
  font-size: 0.92rem;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.fq-msg__bubble.has-image {
  padding: 0;
  max-width: min(72vw, 18.75rem);
  overflow: hidden;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.fq-msg__bubble.has-gallery {
  display: block;
  width: 100%;
  max-width: none;
  padding: 0;
  overflow: visible;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.fq-msg.is-mine .fq-msg__bubble.has-gallery {
  border: 0;
  background: transparent;
}

.fq-msg__photo {
  position: relative;
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  background: rgba(255, 255, 255, 0.04);
  cursor: pointer;
  border-radius: 0.85rem;
  overflow: hidden;
  max-height: 16rem;
}

.fq-msg__photo img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 16rem;
  object-fit: contain;
}

.fq-msg__photo-ph {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.05);
}

.fq-msg__photo-fail {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0.75rem;
  background: rgba(9, 9, 11, 0.88);
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.78rem;
}

.fq-msg__text {
  margin: 0;
  white-space: pre-wrap;
}

.fq-msg__bubble.has-image .fq-msg__text {
  margin: 0.45rem 0.55rem 0.42rem;
}

.fq-msg.is-mine .fq-msg__bubble.has-image {
  background: transparent;
  border: 0;
}

.fq-msg__bubble.has-image:has(.fq-msg__text) {
  background: #111217;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  padding-bottom: 0.12rem;
}

.fq-msg.is-mine .fq-msg__bubble.has-image:has(.fq-msg__text) {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.fq-msg.is-mine .fq-msg__bubble {
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: none;
}

.fq-msg__quote {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  border-left: 2px solid rgba(57, 213, 255, 0.45);
  padding-left: 0.45rem;
  margin-bottom: 0.35rem;
}

.fq-msg__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.18rem;
}

.fq-msg__time {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.32);
}

.fq-msg__reacts {
  display: flex;
  gap: 0.2rem;
  margin-top: 0.2rem;
}

.fq-msg__react {
  font-size: 0.85rem;
}

.fq-typing-slot {
  min-height: 1.65rem;
}

.fq-inbox__pill {
  position: absolute;
  left: 50%;
  bottom: 5.6rem;
  transform: translateX(-50%);
  z-index: 8;
}

.fq-banner,
.fq-request {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  max-width: min(36rem, var(--fq-msg-canvas, 52rem));
  width: 100%;
  margin: 0 auto;
  padding: 1.35rem 1.25rem 2rem;
}

.fq-request__kicker {
  margin: 1.15rem 0 0.75rem;
  color: rgba(57, 213, 255, 0.72);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fq-request__body {
  margin: 0;
  padding: 0;
  border: 0;
  color: #fff;
  font-size: 1.15rem;
  font-weight: 550;
  line-height: 1.45;
}

.fq-request__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.4rem;
}

.fq-request__accept,
.fq-request__decline {
  min-height: 44px;
  padding: 0.55rem 1.15rem;
  border-radius: 0.85rem;
  font-size: 0.9rem;
  font-weight: 750;
  cursor: pointer;
}

.fq-request__accept {
  border: 0;
  color: #0A0B0E;
  background: #F5F5F6;
}

.fq-request__decline {
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: transparent;
  color: rgba(255, 255, 255, 0.62);
}

.fq-request__accept:disabled,
.fq-request__decline:disabled {
  opacity: 0.55;
  cursor: default;
}

.fq-request__pending {
  margin: 0;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.9rem;
  line-height: 1.45;
}

.fq-state__icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 0.75rem;
  border-radius: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  background: #14161B;
}

.fq-state {
  text-align: center;
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.88rem;
  line-height: 1.45;
  padding: 1.25rem 1rem;
}

.fq-state__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
}

.fq-state--inline {
  flex: 1;
  display: grid;
  place-items: center;
  min-height: 0;
}

.fq-state--pane {
  flex: 1;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 0;
  padding-top: 18vh;
  text-align: center;
}

.fq-state__title {
  margin: 0 0 0.35rem;
  color: #fafafa;
  font-weight: 600;
}

.fq-state__btn {
  margin-top: 0.55rem;
  border: 0;
  background: transparent;
  color: var(--fq-accent-mint, #45E3AE);
  font-weight: 600;
  cursor: pointer;
  min-height: 40px;
}

.fq-state__btn:hover {
  color: var(--fq-accent-mint-hover, #7BF1CA);
}

.fq-state__btn:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39D5FF);
  outline-offset: 3px;
}

.fq-banner {
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.fq-skel-list {
  padding: 0.75rem;
}

.fq-skel-row {
  display: flex;
  gap: 0.7rem;
  padding: 0.55rem 0;
}

.fq-skel-avatar,
.fq-skel-line {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.5rem;
}

.fq-skel-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
}

.fq-skel-lines {
  flex: 1;
}

.fq-skel-line {
  height: 0.55rem;
  margin-bottom: 0.4rem;
  width: 70%;
}

.fq-skel-line--w {
  width: 42%;
}

.fq-skel-line--msg {
  height: 2.2rem;
  width: 55%;
  margin: 0.45rem 0;
  border-radius: 1rem;
}

.fq-skel-line--msg.is-me {
  margin-left: auto;
  width: 42%;
}

.fq-older {
  padding: 0.4rem 0 0.8rem;
}

@media (max-width: 899px) {
  .fq-inbox__list {
    border-right: 0;
  }

  .fq-thread__canvas {
    padding: 0.75rem 0.85rem 0.4rem;
  }

  .fq-thread__head {
    min-height: 3.25rem;
    padding: calc(0.28rem + env(safe-area-inset-top, 0px)) 0.5rem 0.28rem 0.22rem;
  }

  .fq-row__context {
    max-width: 16.5rem;
  }

  .fq-thread__avatar {
    width: 34px;
    height: 34px;
  }

  .fq-thread__name {
    font-size: 0.88rem;
  }

  .fq-thread__view {
    min-height: 44px;
    font-size: 0.78rem;
  }

  .fq-msg:not(.is-media):not(.is-gallery) .fq-msg__col {
    max-width: min(88%, 22rem);
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (prefers-reduced-motion: reduce) {
  .fq-skel-avatar,
  .fq-skel-line {
    animation: none;
  }
}
</style>
