<template>
  <div class="fip">
    <div class="fip__topline">
      <span>What fans receive</span>
      <span v-if="recipientCount > 0">
        {{ recipientCount }} {{ recipientCount === 1 ? 'conversation' : 'conversations' }}
      </span>
    </div>

    <div class="fip__shell">
      <div class="fip__thread">
        <div class="fip__message">
          <p :class="{ 'is-placeholder': placeholder && !gallery }">
            {{ messageCopy }}
          </p>
          <FaneqoGalleryMessageCard
            v-if="gallery"
            class="fip__gallery"
            :gallery="gallery"
            preview
          />
          <small>Now</small>
        </div>
      </div>
    </div>

    <p class="fip__note">
      {{ audienceLabel }} receive this in a private conversation. No fan can see another recipient.
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import FaneqoGalleryMessageCard from '~/components/messages/FaneqoGalleryMessageCard.vue'

const props = defineProps({
  bandName: { type: String, default: '' },
  body: { type: String, default: '' },
  audienceLabel: { type: String, default: 'Eligible fans' },
  recipientCount: { type: Number, default: 0 },
  placeholder: { type: Boolean, default: false },
  gallery: { type: Object, default: null },
})

const messageCopy = computed(() => props.body.trim() || (props.gallery ? '' : 'Your message will appear here.'))
</script>

<style scoped>
.fip {
  color: #fff;
}

.fip__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.55rem;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.68rem;
  font-weight: 650;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fip__shell {
  overflow: hidden;
  border-radius: 1rem;
  background: #07080a;
}

.fip__thread {
  min-height: 10rem;
  padding: 1.1rem 0.85rem 1.2rem;
}

.fip__message {
  display: grid;
  justify-items: start;
  max-width: min(92%, 26rem);
  gap: 0.45rem;
}

.fip__message p {
  margin: 0;
  padding: 0.7rem 0.85rem;
  border-radius: 0.35rem 0.95rem 0.95rem 0.95rem;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.92);
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.fip__message p:empty {
  display: none;
}

.fip__message p.is-placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.fip__gallery {
  width: min(100%, 18rem);
}

.fip__message small {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.66rem;
}

.fip__note {
  margin: 0.65rem 0 0;
  color: rgba(255, 255, 255, 0.42);
  font-size: 0.7rem;
  line-height: 1.45;
}
</style>
