<template>
  <div class="fcc-mail">
    <p class="fcc-mail__kicker">
      <component :is="icons.mail" :size="14" :stroke-width="1.8" aria-hidden="true" />
      Preview
    </p>
    <article class="fcc-mail__paper">
      <p class="fcc-mail__from">{{ bandName }}</p>
      <p class="fcc-mail__to">To · {{ audienceLabel }}</p>
      <h3 class="fcc-mail__subject">{{ subject || 'Subject' }}</h3>
      <p class="fcc-mail__body" :class="{ 'is-placeholder': isPlaceholder }">
        {{ bodyText }}
      </p>
      <p class="fcc-mail__foot">Unsubscribe · Sent with Faneqo</p>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

const props = defineProps({
  bandName: { type: String, default: 'Your band' },
  subject: { type: String, default: '' },
  body: { type: String, default: '' },
  audienceLabel: { type: String, default: 'All Fans' },
  placeholder: { type: Boolean, default: false },
})

const icons = faneqoIcons
const trimmed = computed(() => String(props.body || '').trim())
const isPlaceholder = computed(() => props.placeholder || !trimmed.value)
const bodyText = computed(() =>
  isPlaceholder.value ? 'Your note will appear here as you write.' : trimmed.value
)
</script>

<style scoped>
.fcc-mail__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.65rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.fcc-mail__paper {
  border-radius: 1.1rem;
  background: #f6f1ea;
  color: #18181b;
  padding: 1.15rem 1.15rem 1rem;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
}

.fcc-mail__from {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 750;
}

.fcc-mail__to {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: #57534e;
}

.fcc-mail__subject {
  margin: 0.85rem 0 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
}

.fcc-mail__body {
  margin: 0.7rem 0 0;
  font-size: 0.9rem;
  line-height: 1.55;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #292524;
}

.fcc-mail__body.is-placeholder {
  color: #a8a29e;
  white-space: normal;
}

.fcc-mail__foot {
  margin: 1.1rem 0 0;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 0.68rem;
  color: #78716c;
}
</style>
