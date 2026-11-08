<template>
  <div class="fan-msgs" aria-label="Fan messages prototype">
    <!-- List -->
    <div v-if="!openThread" class="fan-msgs__list">
      <header class="fan-msgs__head">
        <h2 class="fan-msgs__title">Messages</h2>
        <p class="fan-msgs__sub">Artists you follow</p>
      </header>

      <ul class="fan-msgs__rows" role="list">
        <li v-for="row in rows" :key="row.id">
          <button
            type="button"
            class="fan-msgs__row"
            :class="{ 'fan-msgs__row--unread': row.unreadCount > 0 }"
            @click="open(row)"
          >
            <div class="fan-msgs__avatar-wrap">
              <img :src="row.avatarUrl" :alt="''" class="fan-msgs__avatar" />
              <span v-if="row.verified" class="fan-msgs__verified" title="Faneqo artist" aria-label="Verified artist">✓</span>
            </div>
            <div class="fan-msgs__meta">
              <div class="fan-msgs__topline">
                <span class="fan-msgs__name">{{ row.artistName }}</span>
                <span v-if="row.unreadCount" class="fan-msgs__badge">{{ row.unreadCount }}</span>
                <span v-else class="fan-msgs__time">{{ relative(row.updatedAt) }}</span>
              </div>
              <p class="fan-msgs__preview">{{ row.preview }}</p>
            </div>
          </button>
        </li>
      </ul>
    </div>

    <!-- Simple thread (BurningThunder) — no Fan Intelligence chrome -->
    <div v-else class="fan-msgs__thread">
      <header class="fan-msgs__thread-head">
        <button type="button" class="fan-msgs__back" aria-label="Back to messages" @click="openThread = null">
          ←
        </button>
        <img :src="openThread.avatarUrl" alt="" class="fan-msgs__avatar fan-msgs__avatar--sm" />
        <div class="min-w-0">
          <p class="fan-msgs__name flex items-center gap-1.5">
            {{ openThread.artistName }}
            <span v-if="openThread.verified" class="fan-msgs__verified-inline">Artist</span>
          </p>
        </div>
      </header>

      <div class="fan-msgs__bubbles" role="log" aria-live="polite">
        <div
          v-for="m in threadMessages"
          :key="m.id"
          class="fan-msgs__bubble-row"
          :class="m.from === 'fan' ? 'is-me' : 'is-them'"
        >
          <div class="fan-msgs__bubble">
            {{ m.body }}
          </div>
        </div>
      </div>

      <div class="fan-msgs__composer">
        <label class="sr-only" for="fan-msg-input">Message {{ openThread.artistName }}</label>
        <input
          id="fan-msg-input"
          v-model="draft"
          type="text"
          class="fan-msgs__input"
          :placeholder="`Message ${openThread.artistName}...`"
          autocomplete="off"
          @keydown.enter.prevent="sendLocal"
        />
        <button
          type="button"
          class="fan-msgs__send"
          :disabled="!draft.trim()"
          aria-label="Send"
          @click="sendLocal"
        >
          ➤
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  LAB_FAN_INBOX,
  LAB_FAN_THREAD_BURNINGTHUNDER,
} from '~/utils/messages/chatLabFakeData'
import { formatRelativeListTime } from '~/utils/messages/chatUiAdapter'

const rows = LAB_FAN_INBOX
const openThread = ref(null)
const draft = ref('')
const localExtra = ref([])

const threadMessages = computed(() => {
  if (!openThread.value || openThread.value.id !== 'fan-inbox-bt') {
    return [
      {
        id: 'stub',
        from: 'artist',
        body: openThread.value?.preview || '…',
        at: openThread.value?.updatedAt,
      },
    ]
  }
  return [...LAB_FAN_THREAD_BURNINGTHUNDER, ...localExtra.value]
})

function relative(ts) {
  return formatRelativeListTime(ts)
}

function open(row) {
  openThread.value = row
  draft.value = ''
  localExtra.value = []
}

function sendLocal() {
  const body = draft.value.trim()
  if (!body || !openThread.value) return
  localExtra.value = [
    ...localExtra.value,
    {
      id: `local-${Date.now()}`,
      from: 'fan',
      name: 'You',
      body,
      at: new Date().toISOString(),
    },
  ]
  draft.value = ''
}
</script>

<style scoped>
.fan-msgs {
  height: 100%;
  min-height: 420px;
  background: #000;
  color: #fafafa;
  display: flex;
  flex-direction: column;
  border-radius: inherit;
  overflow: hidden;
}

.fan-msgs__list,
.fan-msgs__thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.fan-msgs__head {
  padding: 1.1rem 1.1rem 0.65rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.fan-msgs__title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}

.fan-msgs__sub {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.4);
}

.fan-msgs__rows {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0;
  overflow-y: auto;
  flex: 1;
}

.fan-msgs__row {
  width: 100%;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem 1.1rem;
  text-align: left;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  transition: background 0.15s ease;
  min-height: 72px;
}

.fan-msgs__row:hover,
.fan-msgs__row:focus-visible {
  background: rgba(255, 255, 255, 0.04);
  outline: none;
}

.fan-msgs__row--unread .fan-msgs__name,
.fan-msgs__row--unread .fan-msgs__preview {
  color: #fff;
  font-weight: 600;
}

.fan-msgs__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.fan-msgs__avatar {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  object-fit: cover;
  background: #27272a;
}

.fan-msgs__avatar--sm {
  width: 36px;
  height: 36px;
}

.fan-msgs__verified {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 16px;
  height: 16px;
  border-radius: 9999px;
  background: #9333ea;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  display: grid;
  place-items: center;
  border: 2px solid #000;
}

.fan-msgs__verified-inline {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #e9d5ff;
  background: rgba(147, 51, 234, 0.25);
  border-radius: 9999px;
  padding: 0.1rem 0.4rem;
}

.fan-msgs__meta {
  min-width: 0;
  flex: 1;
}

.fan-msgs__topline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.fan-msgs__name {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fan-msgs__badge {
  margin-left: auto;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  background: #d946ef;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.fan-msgs__time {
  margin-left: auto;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}

.fan-msgs__preview {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.48);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fan-msgs__thread-head {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 0.85rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: #09090b;
}

.fan-msgs__back {
  width: 2.5rem;
  height: 2.5rem;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: #fafafa;
  font-size: 1.25rem;
  cursor: pointer;
}

.fan-msgs__back:hover,
.fan-msgs__back:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.fan-msgs__bubbles {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0.9rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  background: #000;
}

.fan-msgs__bubble-row {
  display: flex;
}

.fan-msgs__bubble-row.is-me {
  justify-content: flex-end;
}

.fan-msgs__bubble {
  max-width: 78%;
  padding: 0.65rem 0.9rem;
  border-radius: 1.15rem;
  font-size: 0.92rem;
  line-height: 1.4;
  background: #27272a;
  color: #fafafa;
}

.fan-msgs__bubble-row.is-me .fan-msgs__bubble {
  background: rgba(147, 51, 234, 0.4);
  border-bottom-right-radius: 0.35rem;
}

.fan-msgs__bubble-row.is-them .fan-msgs__bubble {
  border-bottom-left-radius: 0.35rem;
}

.fan-msgs__composer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 0.75rem calc(0.65rem + env(safe-area-inset-bottom));
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background: #09090b;
}

.fan-msgs__input {
  flex: 1;
  min-height: 44px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #18181b;
  color: #fafafa;
  padding: 0.65rem 1rem;
  font-size: 0.95rem;
}

.fan-msgs__input:focus {
  outline: none;
  border-color: rgba(232, 121, 249, 0.55);
}

.fan-msgs__send {
  width: 44px;
  height: 44px;
  border-radius: 9999px;
  border: 0;
  background: #9333ea;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
  flex-shrink: 0;
}

.fan-msgs__send:disabled {
  opacity: 0.35;
  cursor: not-allowed;
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
