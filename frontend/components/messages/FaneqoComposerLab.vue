<template>
  <div class="fq-clab" :class="{ 'is-private': model.audienceType === 'private' }">
    <header class="fq-clab__top">
      <p class="fq-clab__intent">{{ intent }}</p>
      <p class="fq-clab__band">{{ model.bandName }}</p>
    </header>

    <div v-if="model.step === 'picker'" class="fq-clab__picker">
      <h2>Choose a Night</h2>
      <p>Pick the show this message is for.</p>
      <ul>
        <li>
          <strong>Sep 7 · The Rock</strong>
          <span>The Moon Show · 83 fans</span>
        </li>
        <li class="is-wait">
          <strong>Sep 2 · Exit/In</strong>
          <span>No eligible attendees yet</span>
        </li>
      </ul>
    </div>

    <div v-else-if="model.step === 'sending'" class="fq-clab__status" role="status">Sending…</div>

    <div v-else-if="model.step === 'success'" class="fq-clab__status" role="status">
      <h2>{{ success.title }}</h2>
      <p>{{ success.body }}</p>
      <p class="fq-clab__link">View sent message →</p>
    </div>

    <div v-else class="fq-clab__body">
      <FaneqoComposerAudience
        :audience-type="model.audienceType"
        :recap="model.recap"
        :peer-name="model.peerName"
        :show-count="model.showCount"
        :avatar-url="model.avatarUrl"
        :eligible="model.eligible"
        :unavailable="model.unavailable"
      />

      <template v-if="model.step === 'review'">
        <p class="fq-clab__label">Message</p>
        <p class="fq-clab__note">{{ model.note }}</p>
        <FaneqoGalleryMessageCard
          v-if="model.gallery"
          :gallery="model.gallery"
          preview
        />
        <p class="fq-clab__label">Delivery</p>
        <p>Faneqo Inbox</p>
        <p v-if="model.error" class="fq-clab__error" role="alert">{{ model.error }}</p>
      </template>

      <template v-else-if="model.audienceType === 'private'">
        <FaneqoMessageComposer
          v-model="draft"
          :placeholder="placeholder"
          conversation-id="lab-private"
        />
      </template>

      <template v-else>
        <label class="fq-clab__label" for="fq-clab-note">Message</label>
        <textarea
          id="fq-clab-note"
          v-model="draft"
          class="fq-clab__textarea"
          rows="6"
          :placeholder="placeholder"
        />
        <p class="fq-clab__label">Delivery</p>
        <p class="fq-clab__delivery">Faneqo Inbox · Email keeps a 24-hour cooldown</p>
        <FaneqoGalleryMessageCard
          v-if="model.gallery"
          :gallery="model.gallery"
          preview
          removable
        />
        <p v-else class="fq-clab__attach">Attach Gallery</p>
      </template>
    </div>

    <footer v-if="model.step === 'compose' && model.audienceType !== 'private'" class="fq-clab__foot">
      <button type="button" class="fq-clab__ghost">Cancel</button>
      <button
        type="button"
        class="fq-clab__send"
        :disabled="model.eligible <= 0"
      >
        Review message
      </button>
    </footer>
    <footer v-else-if="model.step === 'review'" class="fq-clab__foot">
      <button type="button" class="fq-clab__ghost">Back to edit</button>
      <button type="button" class="fq-clab__send">{{ sendLabel }}</button>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import FaneqoComposerAudience from '~/components/messages/FaneqoComposerAudience.vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'
import FaneqoMessageComposer from '~/components/messages/FaneqoMessageComposer.vue'
import {
  composerPlaceholder,
  composerSendLabel,
  composerSuccessCopy,
} from '~/utils/messages/composerPresentation'

const props = defineProps({
  model: { type: Object, required: true },
})

const draft = ref(props.model.note || '')
watch(() => props.model.note, (next) => { draft.value = next || '' })

const intent = computed(() => {
  if (props.model.audienceType === 'private') return 'Private message'
  if (props.model.audienceType === 'show_attendees') return 'Message a show'
  return 'Message all fans'
})
const placeholder = computed(() => composerPlaceholder({
  audienceType: props.model.audienceType,
  peerName: props.model.peerName,
}))
const sendLabel = computed(() => composerSendLabel({
  eligible: props.model.eligible,
  audienceType: props.model.audienceType,
}))
const success = computed(() => composerSuccessCopy({
  eligible: props.model.eligible,
  isInbox: true,
}))
</script>

<style scoped>
.fq-clab {
  display: flex;
  flex-direction: column;
  min-height: min(78dvh, 52rem);
  background: #050506;
  color: #f7f9fc;
}

.fq-clab__top,
.fq-clab__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.7rem 1rem;
}

.fq-clab__top {
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.fq-clab__intent {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
}

.fq-clab__band,
.fq-clab__delivery {
  margin: 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.82rem;
}

.fq-clab__body,
.fq-clab__picker,
.fq-clab__status {
  flex: 1;
  padding: 1.1rem 1.15rem 1.4rem;
}

.fq-clab__picker h2,
.fq-clab__status h2 {
  margin: 0;
  font-size: 1.45rem;
  letter-spacing: -0.03em;
}

.fq-clab__picker ul {
  list-style: none;
  margin: 1.1rem 0 0;
  padding: 0;
}

.fq-clab__picker li {
  display: grid;
  gap: 0.15rem;
  min-height: 44px;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.fq-clab__picker li.is-wait {
  color: rgba(255, 255, 255, 0.38);
}

.fq-clab__label {
  display: block;
  margin: 1.1rem 0 0.35rem;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.fq-clab__textarea {
  width: 100%;
  min-height: 10rem;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.035);
  color: #fff;
  font-size: 1rem;
  line-height: 1.6;
}

.fq-clab__note {
  margin: 0;
  white-space: pre-wrap;
  font-size: 1rem;
  line-height: 1.55;
}

.fq-clab__attach,
.fq-clab__link {
  margin: 1rem 0 0;
  color: #f5f5f6;
  font-weight: 650;
}

.fq-clab__error {
  margin: 0.75rem 0 0;
  color: #fda4af;
}

.fq-clab__foot {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.fq-clab__send,
.fq-clab__ghost {
  min-height: 44px;
  padding: 0.65rem 1rem;
  border-radius: 0.85rem;
  font-weight: 650;
}

.fq-clab__send {
  border: 0;
  background: #f5f5f6;
  color: #0a0b0e;
}

.fq-clab__send:disabled {
  opacity: 0.42;
}

.fq-clab__ghost {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
}
</style>
