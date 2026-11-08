<template>
  <div class="fq-first" role="status">
    <span class="fq-first__icon" aria-hidden="true">
      <component :is="icons.message" :size="26" :stroke-width="1.6" />
    </span>
    <p class="fq-first__kicker">Start the conversation</p>
    <h2 class="fq-first__name">{{ firstName }}</h2>
    <p v-if="context" class="fq-first__context">{{ context }}</p>
    <p class="fq-first__copy">{{ copy }}</p>
    <p class="fq-first__hint">Message {{ firstName }} below ↓</p>

    <div
      v-if="showStarters"
      class="fq-first__chips"
      role="group"
      aria-label="Optional message starters"
    >
      <button
        v-for="prompt in starters"
        :key="prompt"
        type="button"
        class="fq-first__chip"
        @click="$emit('insert', prompt)"
      >
        {{ prompt }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FIRST_THREAD_STARTERS, fanFirstName } from '~/utils/messages/chatUiAdapter'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

const props = defineProps({
  peerName: { type: String, default: '' },
  context: { type: String, default: '' },
  viewerRole: { type: String, default: 'artist' },
  showStarters: { type: Boolean, default: false },
})

defineEmits(['insert'])

const icons = faneqoIcons
const starters = FIRST_THREAD_STARTERS
const firstName = computed(() => {
  const name = fanFirstName(props.peerName)
  return name === 'them' ? (props.peerName || 'them') : name
})
const copy = computed(() =>
  props.viewerRole === 'fan'
    ? 'Send a note and keep the connection going.'
    : 'Send a personal note and start building the relationship beyond the show.'
)
</script>

<style scoped>
.fq-first {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 22rem;
  margin: 1.6rem auto 1.2rem;
  padding: 0 0.75rem;
  overflow: hidden;
}

.fq-first__icon {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 0.85rem;
  border-radius: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
  background: #14161B;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.fq-first__kicker {
  margin: 0;
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
}

.fq-first__name {
  margin: 0.35rem 0 0;
  font-size: 1.45rem;
  font-weight: 750;
  letter-spacing: -0.03em;
  color: var(--fq-text-primary, #fff);
}

.fq-first__context {
  margin: 0.35rem 0 0;
  font-size: 0.82rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.52));
}

.fq-first__copy {
  margin: 0.7rem 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.52));
}

.fq-first__hint {
  margin: 0.85rem 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--fq-text-muted, rgba(255, 255, 255, 0.38));
}

.fq-first__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 1.05rem;
}

.fq-first__chip {
  max-width: 100%;
  min-height: 36px;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--fq-border-subtle, rgba(255, 255, 255, 0.08));
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
}

.fq-first__chip:hover,
.fq-first__chip:focus-visible {
  border-color: rgba(57, 213, 255, 0.4);
  color: #fff;
  outline: none;
}

.fq-first__chip:focus-visible {
  box-shadow: 0 0 0 2px rgba(57, 213, 255, 0.35);
}
</style>
