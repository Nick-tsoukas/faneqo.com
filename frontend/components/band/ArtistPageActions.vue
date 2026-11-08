<template>
  <div
    class="artist-actions"
    :class="[`is-${variant}`, { 'has-four': showFollow, 'has-save': showSave, 'is-trio': showFollow && !showSave }]"
  >
    <button
      v-if="showFollow"
      type="button"
      class="artist-actions__btn is-follow"
      :class="{ 'is-followed': followed, 'is-busy': followBusy }"
      :disabled="followBusy"
      :aria-busy="followBusy ? 'true' : 'false'"
      :aria-label="followAriaLabel"
      :title="followError || followAriaLabel"
      @click="onFollowClick"
    >
      <svg class="artist-actions__icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
      </svg>
      <span>{{ followedLabel }}</span>
    </button>

    <button
      type="button"
      class="artist-actions__btn is-message"
      :class="{
        'is-pending': messagePending,
        'is-disabled': messageDisabled,
        'is-accent': !messageDisabled && !messagePending,
      }"
      :disabled="messageDisabled"
      :aria-disabled="messageDisabled"
      :aria-label="messageAriaLabel"
      @click="$emit('message')"
    >
      <span class="artist-actions__icon-wrap">
        <svg class="artist-actions__icon" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10.5h8M8 14h5m7-2.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" />
        </svg>
        <svg
          v-if="messagePending"
          class="artist-actions__pending"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6l3.5 2" />
          <circle cx="12" cy="12" r="8.25" />
        </svg>
      </span>
      <span class="artist-actions__msg-copy">
        <span>{{ messagePrimaryLabel }}</span>
        <span v-if="isCybered && messagePending" class="artist-actions__msg-state">Requested</span>
      </span>
      <svg
        v-if="isCybered && !messageDisabled"
        class="artist-actions__chevron"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>

    <button
      v-if="showSave"
      type="button"
      class="artist-actions__btn is-save"
      :class="{ 'is-saved': saved }"
      @click="$emit('save')"
    >
      <svg v-if="saved" class="artist-actions__icon" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path fill-rule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clip-rule="evenodd" />
      </svg>
      <svg v-else class="artist-actions__icon" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      <span>{{ saved ? 'Saved' : 'Save' }}</span>
    </button>

    <button
      type="button"
      class="artist-actions__btn is-share"
      @click="$emit('share')"
    >
      <svg class="artist-actions__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      <span>Share</span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'default' },
  showFollow: { type: Boolean, default: true },
  showSave: { type: Boolean, default: true },
  saved: { type: Boolean, default: false },
  followed: { type: Boolean, default: false },
  followBusy: { type: Boolean, default: false },
  followError: { type: String, default: '' },
  visualVariant: { type: String, default: 'default' },
  messageLabel: { type: String, default: 'Message' },
  messagePending: { type: Boolean, default: false },
  messageDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['follow', 'message', 'save', 'share'])

function onFollowClick() {
  if (props.followBusy) return
  emit('follow')
}

const isCybered = computed(() => props.variant === 'cybered')
const followedLabel = computed(() => (props.followed ? 'Following' : 'Follow'))
const followAriaLabel = computed(() => {
  if (props.followError) return props.followError
  return props.followed ? 'Following' : 'Follow'
})
const messagePrimaryLabel = computed(() => {
  if (props.visualVariant === 'polish-test') return props.messageLabel || 'Message'
  return isCybered.value ? 'Message artist' : (props.messageLabel || 'Message')
})
const messageAriaLabel = computed(() => {
  if (props.messagePending) return 'Message request pending'
  if (props.messageDisabled) return 'Messaging unavailable'
  if (props.visualVariant === 'polish-test') return props.messageLabel || 'Message'
  return isCybered.value ? 'Message artist' : 'Message'
})
</script>

<style scoped>
.artist-actions {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
  width: 100%;
}

.artist-actions.has-four:not(.has-save),
.artist-actions:not(.has-four).has-save {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.artist-actions:not(.has-four):not(.has-save) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.artist-actions.is-compact {
  display: flex;
  gap: 0.55rem;
}

.artist-actions__btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  min-height: 4.5rem;
  padding: 0.7rem 0.35rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: var(--faneqo-surface, #111722);
  color: var(--faneqo-text, #f7f9fc);
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.01em;
  cursor: pointer;
}

.artist-actions.is-compact .artist-actions__btn {
  flex: 1;
  min-height: 2.85rem;
  flex-direction: row;
  gap: 0.35rem;
  padding: 0.65rem 0.45rem;
  border-radius: 0.85rem;
  font-size: 0.78rem;
}

.artist-actions__icon-wrap {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  isolation: isolate;
}

.artist-actions__icon {
  width: 1.35rem;
  height: 1.35rem;
  flex-shrink: 0;
}

.artist-actions.is-compact .artist-actions__icon-wrap,
.artist-actions.is-compact .artist-actions__icon {
  width: 1.1rem;
  height: 1.1rem;
}

.artist-actions__pending {
  position: absolute;
  right: -0.28rem;
  bottom: -0.28rem;
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  background: #0b0c10;
  color: var(--faneqo-connection-cyan, #39d5ff);
}

.artist-actions__btn.is-follow:not(.is-followed) {
  border-color: transparent;
  background: #ECEEF2;
  color: #0c0d12;
}

.artist-actions__btn.is-follow:not(.is-followed):hover {
  background: #ffffff;
}

.artist-actions__btn.is-follow:not(.is-followed):active {
  background: #dfe2e8;
}

.artist-actions__btn.is-follow:focus-visible {
  outline: 2px solid rgba(139, 108, 255, 0.7);
  outline-offset: 2px;
}

.artist-actions__btn.is-message:focus-visible,
.artist-actions__btn.is-share:focus-visible {
  outline: 2px solid rgba(139, 108, 255, 0.55);
  outline-offset: 2px;
}

.artist-actions__btn.is-share {
  border-color: rgba(255, 255, 255, 0.1);
  color: rgba(247, 249, 252, 0.86);
}

.artist-actions__btn.is-message.is-pending {
  color: var(--faneqo-text, #f7f9fc);
  border-color: rgba(57, 213, 255, 0.28);
  background: rgba(76, 166, 255, 0.06);
}

.artist-actions__msg-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
}

.artist-actions__msg-state {
  font-size: 0.62rem;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.artist-actions__chevron {
  display: none;
}

.artist-actions__btn.is-disabled,
.artist-actions__btn.is-busy {
  opacity: 0.45;
  cursor: not-allowed;
}

.artist-actions__btn.is-saved {
  border-color: rgba(255, 255, 255, 0.22);
  color: var(--faneqo-text, #f7f9fc);
  background: #161822;
}

@media (max-width: 430px) {
  .artist-actions:not(.is-cybered) .artist-actions__btn {
    font-size: 0.72rem;
    min-height: 4.15rem;
    padding: 0.55rem 0.2rem;
  }
}

.artist-actions.is-cybered.has-four.has-save {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.55rem;
  row-gap: 0.5625rem;
  grid-template-areas:
    'message message message'
    'follow save share';
}

.artist-actions.is-cybered.is-trio,
.artist-actions.is-cybered.has-four:not(.has-save) {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: 0.55rem;
  row-gap: 0.5625rem;
  grid-template-areas: 'message follow share';
}

.artist-actions.is-cybered.is-trio .is-message,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message {
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  min-height: 4.4rem;
  padding: 0.62rem 0.3rem;
  font-size: 0.78rem;
  letter-spacing: -0.01em;
}

.artist-actions.is-cybered.is-trio .is-message .artist-actions__msg-copy,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message .artist-actions__msg-copy {
  align-items: center;
}

.artist-actions.is-cybered.is-trio .is-message .artist-actions__icon-wrap,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message .artist-actions__icon-wrap {
  width: 1.35rem;
  height: 1.35rem;
  border: 0;
  border-radius: 0;
  background: transparent;
}

.artist-actions.is-cybered.is-trio .is-message .artist-actions__icon,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message .artist-actions__icon {
  width: 1.35rem;
  height: 1.35rem;
}

.artist-actions.is-cybered.is-trio .artist-actions__chevron,
.artist-actions.is-cybered.has-four:not(.has-save) .artist-actions__chevron {
  display: none;
}

.artist-actions.is-cybered:not(.has-four).has-save {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 0.55rem;
  row-gap: 0.5625rem;
  grid-template-areas:
    'message message'
    'save share';
}

.artist-actions.is-cybered:not(.has-four):not(.has-save) {
  grid-template-columns: 1fr;
  row-gap: 0.5625rem;
  grid-template-areas:
    'message'
    'share';
}

.artist-actions.is-cybered .is-message {
  grid-area: message;
}

.artist-actions.is-cybered .is-follow {
  grid-area: follow;
}

.artist-actions.is-cybered .is-save {
  grid-area: save;
}

.artist-actions.is-cybered .is-share {
  grid-area: share;
}

.artist-actions.is-cybered .artist-actions__btn:not(.is-message) {
  min-height: 4.4rem;
  padding: 0.62rem 0.3rem;
}

.artist-actions.is-cybered .is-message {
  flex-direction: row;
  justify-content: center;
  gap: 0.6rem;
  min-height: 3.6rem;
  padding: 0.7rem 1rem;
  border-color: rgba(255, 255, 255, 0.12);
  background: var(--faneqo-surface, #111722);
  color: var(--faneqo-text, #f7f9fc);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: -0.015em;
}

.artist-actions.is-cybered .is-message .artist-actions__msg-copy {
  align-items: flex-start;
}

.artist-actions.is-cybered .is-message .artist-actions__icon-wrap {
  width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #07080a;
}

.artist-actions.is-cybered .is-message .artist-actions__icon {
  width: 0.95rem;
  height: 0.95rem;
}

.artist-actions.is-cybered .is-message.is-accent .artist-actions__icon-wrap {
  border-color: rgba(57, 213, 255, 0.38);
  color: var(--faneqo-connection-cyan, #39d5ff);
}

.artist-actions.is-cybered .is-message.is-accent:hover,
.artist-actions.is-cybered .is-message.is-accent:focus-visible {
  border-color: rgba(69, 227, 174, 0.32);
  background: #161822;
  outline: none;
}

.artist-actions.is-cybered .is-message.is-accent:hover .artist-actions__icon-wrap,
.artist-actions.is-cybered .is-message.is-accent:focus-visible .artist-actions__icon-wrap {
  border-color: rgba(69, 227, 174, 0.55);
  color: var(--faneqo-connection-green, #45e3ae);
}

.artist-actions.is-cybered .is-message.is-pending {
  color: #f5f5f6;
  border-color: rgba(255, 255, 255, 0.12);
  background: #111217;
}

.artist-actions.is-cybered .is-message.is-pending .artist-actions__icon-wrap {
  color: rgba(255, 255, 255, 0.55);
  border-color: rgba(255, 255, 255, 0.12);
}

.artist-actions.is-cybered .is-message.is-pending .artist-actions__pending {
  color: rgba(255, 255, 255, 0.55);
}

.artist-actions.is-cybered .is-message.is-disabled .artist-actions__icon-wrap {
  color: rgba(255, 255, 255, 0.28);
  border-color: rgba(255, 255, 255, 0.08);
  background: #0b0c10;
}

.artist-actions.is-cybered .artist-actions__chevron {
  display: block;
  width: 0.95rem;
  height: 0.95rem;
  margin-left: auto;
  flex-shrink: 0;
  opacity: 0.32;
}

.artist-actions.is-cybered .is-message.is-disabled .artist-actions__chevron {
  display: none;
}

.artist-actions.is-cybered.is-trio .is-message.is-accent .artist-actions__icon-wrap,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message.is-accent .artist-actions__icon-wrap,
.artist-actions.is-cybered.is-trio .is-message.is-accent:hover .artist-actions__icon-wrap,
.artist-actions.is-cybered.is-trio .is-message.is-accent:focus-visible .artist-actions__icon-wrap,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message.is-accent:hover .artist-actions__icon-wrap,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message.is-accent:focus-visible .artist-actions__icon-wrap {
  width: 1.35rem;
  height: 1.35rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--faneqo-connection-cyan, #39d5ff);
}

.artist-actions.is-cybered.is-trio .is-message.is-accent:hover,
.artist-actions.is-cybered.is-trio .is-message.is-accent:focus-visible,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message.is-accent:hover,
.artist-actions.is-cybered.has-four:not(.has-save) .is-message.is-accent:focus-visible {
  border-color: rgba(255, 255, 255, 0.18);
  background: var(--faneqo-surface, #111722);
}

@media (max-width: 639px) {
  .artist-actions.is-cybered {
    column-gap: 0.4rem;
    row-gap: 0.5rem;
  }

  .artist-actions.is-cybered .artist-actions__btn:not(.is-message) {
    gap: 0.22rem;
    min-height: 3.35rem;
    padding: 0.4rem 0.1rem;
    border-radius: 0.8rem;
    font-size: 0.6875rem;
    letter-spacing: 0;
  }

  .artist-actions.is-cybered .artist-actions__btn:not(.is-message) .artist-actions__icon-wrap,
  .artist-actions.is-cybered .artist-actions__btn:not(.is-message) .artist-actions__icon {
    width: 1.25rem;
    height: 1.25rem;
  }

  .artist-actions.is-cybered .is-message {
    min-height: 3.45rem;
    padding: 0.62rem 0.85rem;
    font-size: 0.875rem;
  }

  .artist-actions.is-cybered.is-trio .is-message,
  .artist-actions.is-cybered.has-four:not(.has-save) .is-message {
    min-height: 3.35rem;
    padding: 0.4rem 0.1rem;
    font-size: 0.6875rem;
    letter-spacing: 0;
  }

  .artist-actions.is-cybered .artist-actions__pending {
    width: 0.68rem;
    height: 0.68rem;
    right: -0.18rem;
    bottom: -0.18rem;
  }
}

.artist-actions.is-close {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  width: auto;
}

.artist-actions.is-close .artist-actions__btn {
  flex: 0 0 auto;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.38rem;
  min-width: 0;
  min-height: 44px;
  padding: 0.5rem 0.65rem;
  border-radius: 999px;
  border: 1px solid rgba(246, 243, 238, 0.14);
  background: transparent;
  color: rgba(246, 243, 238, 0.82);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.012em;
  line-height: 1;
  box-shadow: none;
}

.artist-actions.is-close .artist-actions__icon,
.artist-actions.is-close .artist-actions__icon-wrap {
  width: 1rem;
  height: 1rem;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: inherit;
}

.artist-actions.is-close .artist-actions__msg-copy {
  flex-direction: row;
  align-items: center;
}

.artist-actions.is-close .artist-actions__chevron {
  display: none;
}

.artist-actions.is-close .is-follow:not(.is-followed) {
  flex: 0 0 auto;
  background: #f4f1ea;
  border-color: transparent;
  color: #14151c;
  font-weight: 700;
}

.artist-actions.is-close .is-follow.is-followed {
  background: rgba(246, 243, 238, 0.08);
  border-color: rgba(246, 243, 238, 0.2);
  color: #f7f4ef;
}

.artist-actions.is-close .is-message,
.artist-actions.is-close .is-message.is-accent,
.artist-actions.is-close .is-message.is-pending,
.artist-actions.is-close .is-share {
  background: transparent;
  border-color: rgba(246, 243, 238, 0.14);
  color: rgba(246, 243, 238, 0.8);
}

.artist-actions.is-close .is-message .artist-actions__icon,
.artist-actions.is-close .is-message .artist-actions__icon-wrap,
.artist-actions.is-close .is-message.is-accent .artist-actions__icon-wrap,
.artist-actions.is-close .is-share .artist-actions__icon {
  color: inherit;
  background: transparent;
  border: 0;
}

.artist-actions.is-close .artist-actions__btn:focus-visible {
  outline: 2px solid rgba(198, 184, 255, 0.9);
  outline-offset: 2px;
}

.artist-actions.is-close .is-follow:not(.is-followed):hover {
  background: #fffcf7;
  color: #14151c;
}

.artist-actions.is-close .is-message:hover,
.artist-actions.is-close .is-share:hover,
.artist-actions.is-close .is-follow.is-followed:hover {
  background: rgba(246, 243, 238, 0.06);
  border-color: rgba(246, 243, 238, 0.24);
  color: #f7f4ef;
}

@container artist-close (min-width: 40rem) {
  .artist-actions.is-close {
    width: auto;
    gap: 0.5rem;
  }

  .artist-actions.is-close .artist-actions__btn {
    flex: 0 0 auto;
    min-width: 6.75rem;
    padding-inline: 0.95rem;
  }

  .artist-actions.is-close .is-follow:not(.is-followed),
  .artist-actions.is-close .is-follow.is-followed {
    min-width: 7.75rem;
  }
}

@container artist-close (max-width: 39.99rem) {
  .artist-actions.is-close {
    display: flex;
    flex-wrap: nowrap;
    align-items: stretch;
    width: 100%;
    gap: 0.5rem;
  }

  .artist-actions.is-close .artist-actions__btn {
    flex: 1 1 0;
    min-width: 0;
    min-height: 50px;
    padding: 0.55rem 0.4rem;
    border-radius: 0.8rem;
    border-color: rgba(246, 243, 238, 0.14);
    background: rgba(246, 243, 238, 0.04);
    color: rgba(246, 243, 238, 0.9);
    font-size: 0.8125rem;
    font-weight: 600;
  }

  .artist-actions.is-close .artist-actions__icon,
  .artist-actions.is-close .artist-actions__icon-wrap {
    width: 1.125rem;
    height: 1.125rem;
    flex: 0 0 auto;
  }

  .artist-actions.is-close .is-follow:not(.is-followed) {
    flex: 1 1 0;
    background: rgba(246, 243, 238, 0.09);
    border-color: rgba(246, 243, 238, 0.24);
    color: #f7f4ef;
    font-weight: 600;
  }

  .artist-actions.is-close .is-follow:not(.is-followed):hover,
  .artist-actions.is-close .is-follow:not(.is-followed):active {
    background: rgba(246, 243, 238, 0.14);
    color: #f7f4ef;
  }
}

@container artist-close (max-width: 21.25rem) {
  .artist-actions.is-close {
    flex-direction: column;
  }

  .artist-actions.is-close .artist-actions__btn {
    flex: 1 1 auto;
    width: 100%;
  }
}
</style>
