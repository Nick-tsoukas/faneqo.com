<template>
  <header class="fq-who" :class="{ 'is-private': audienceType === 'private' }">
    <FaneqoFanIdentity
      v-if="audienceType === 'private'"
      :name="who.title"
      :context="who.detail"
      :avatar-url="avatarUrl"
    />
    <div v-else class="fq-who__broadcast">
      <p class="fq-who__kicker">{{ who.kicker }}</p>
      <h2 class="fq-who__title">{{ who.title }}</h2>
      <p v-if="who.detail" class="fq-who__detail">{{ who.detail }}</p>
    </div>
    <p v-if="reach" class="fq-who__reach" aria-live="polite" :aria-busy="loading">
      {{ reach }}
      <button
        v-if="retry"
        type="button"
        class="fq-who__retry"
        @click="$emit('retry')"
      >
        Try again
      </button>
    </p>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoFanIdentity from '~/components/messages/FaneqoFanIdentity.vue'
import {
  composerAudienceWho,
  composerReachCopy,
} from '~/utils/messages/composerPresentation'

const props = defineProps({
  audienceType: { type: String, default: 'all_fans' },
  recap: { type: Object, default: null },
  peerName: { type: String, default: '' },
  showCount: { type: Number, default: 0 },
  avatarUrl: { type: String, default: '' },
  eligible: { type: Number, default: 0 },
  unavailable: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  testMode: { type: Boolean, default: false },
  retry: { type: Boolean, default: false },
  reachOverride: { type: String, default: '' },
})

defineEmits(['retry'])

const who = computed(() => composerAudienceWho({
  audienceType: props.audienceType,
  recap: props.recap,
  peerName: props.peerName,
  showCount: props.showCount,
}))

const reach = computed(() => {
  if (props.audienceType === 'private') return ''
  if (props.reachOverride) return props.reachOverride
  return composerReachCopy({
    audienceType: props.audienceType,
    eligible: props.eligible,
    unavailable: props.unavailable,
    loading: props.loading,
    testMode: props.testMode,
  })
})
</script>

<style scoped>
.fq-who {
  margin: 0 0 1.15rem;
}

.fq-who__kicker {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.42);
}

.fq-who__title {
  margin: 0.28rem 0 0;
  font-size: 1.55rem;
  font-weight: 750;
  letter-spacing: -0.035em;
  line-height: 1.15;
  color: #f7f9fc;
}

.fq-who__detail,
.fq-who__reach {
  margin: 0.35rem 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.55);
}

.fq-who__reach {
  font-weight: 600;
}

.fq-who__retry {
  margin-left: 0.35rem;
  border: 0;
  background: none;
  color: #f5f5f6;
  font-weight: 650;
  cursor: pointer;
}

.fq-who__retry:focus-visible {
  outline: 2px solid var(--fq-accent-focus, #39d5ff);
  outline-offset: 2px;
}

.fq-who.is-private {
  padding-bottom: 0.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
</style>
