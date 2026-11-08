<template>
  <!--
    Public Faneqo Inbox UI entry point.
    Advanced Chat loads only on the client (lazy) via FaneqoChatEngine.
    Parents pass Faneqo models only — never vendor rooms/messages shapes.
  -->
  <div class="faneqo-chat-root fq-msg-accents">
  <ClientOnly>
    <FaneqoChatEngine v-bind="forwarded" @select-conversation="emit('select-conversation', $event)"
      @send-message="emit('send-message', $event)" @reply-message="emit('reply-message', $event)"
      @view-fan="emit('view-fan', $event)" @fetch-messages="emit('fetch-messages', $event)"
      @search="emit('search', $event)" @toggle-rooms-list="emit('toggle-rooms-list', $event)"
      @retry-message="emit('retry-message', $event)" @retry-load="emit('retry-load', $event)"
      @retry-messages="emit('retry-messages', $event)" @block="emit('block', $event)"
      @unblock="emit('unblock', $event)" @react="emit('react', $event)"
      @load-older="emit('load-older', $event)"
      @change-filter="emit('change-filter', $event)"
      @accept-request="emit('accept-request', $event)"
      @decline-request="emit('decline-request', $event)">
      <template v-if="$slots.empty" #empty>
        <slot name="empty" />
      </template>
      <template v-if="$slots['thread-empty']" #thread-empty>
        <slot name="thread-empty" />
      </template>
    </FaneqoChatEngine>
    <template #fallback>
      <div class="faneqo-chat-fallback" role="status">
        <div class="faneqo-chat-fallback__spinner" aria-hidden="true" />
        <span class="sr-only">Loading messages</span>
      </div>
    </template>
  </ClientOnly>
  </div>
</template>

<script setup>
/**
 * FaneqoChat — stable public API for Inbox presentation.
 * Implementation: FaneqoChatEngine.client.vue + utils/messages/chatUiAdapter.js
 *
 * Import the engine explicitly. Nested `components/messages/*` auto-import as
 * MessagesFaneqoChatEngine, so a bare <FaneqoChatEngine> tag never mounts.
 */
import { computed, useAttrs } from 'vue'
import FaneqoChatEngine from '~/components/messages/FaneqoChatEngine.client.vue'

defineOptions({ inheritAttrs: false })

const attrs = useAttrs()
const forwarded = computed(() => attrs)

const emit = defineEmits([
  'select-conversation',
  'send-message',
  'reply-message',
  'view-fan',
  'fetch-messages',
  'search',
  'toggle-rooms-list',
  'retry-message',
  'retry-load',
  'retry-messages',
  'block',
  'unblock',
  'react',
  'load-older',
  'change-filter',
  'accept-request',
  'decline-request',
])
</script>

<style>
@import '~/assets/css/faneqo-messaging-accents.css';
</style>

<style scoped>
.faneqo-chat-root {
  flex: 1;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.faneqo-chat-fallback {
  width: 100%;
  height: 100%;
  flex: 1;
  min-height: 0;
  display: grid;
  place-items: center;
  background: var(--fq-canvas, #07080A);
}

.faneqo-chat-fallback__spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  border: 2px solid rgba(255, 255, 255, 0.12);
  border-top-color: rgba(245, 245, 246, 0.72);
  animation: faneqo-chat-fb-spin 0.7s linear infinite;
}

@keyframes faneqo-chat-fb-spin {
  to {
    transform: rotate(360deg);
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
</style>
