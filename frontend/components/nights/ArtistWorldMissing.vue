<template>
  <div class="aw">
    <ArtistWorldChrome
      :artist-name="artistName"
      :artist-path="artistPath"
      :show-back="true"
      :back-to="resolvedBackTo"
      :back-label="resolvedBackLabel"
    />
    <div class="aw__copy">
      <h1>{{ heading }}</h1>
      <p v-if="body" class="aw__body">{{ body }}</p>
      <NuxtLink :to="resolvedBackTo" class="aw__back">{{ backText }}</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ArtistWorldChrome from '~/components/nights/ArtistWorldChrome.vue'

const props = defineProps({
  artistName: { type: String, default: 'Faneqo' },
  artistPath: { type: String, default: '/' },
  heading: { type: String, default: 'This is not available.' },
  body: { type: String, default: '' },
  backText: { type: String, default: 'Back to Faneqo' },
  backTo: { type: String, default: '' },
  backLabel: { type: String, default: '' },
})

const resolvedBackTo = computed(() => props.backTo || props.artistPath)
const resolvedBackLabel = computed(() => props.backLabel || `Back to ${props.artistName}`)
</script>

<style scoped>
.aw {
  min-height: 100dvh;
  background: #050506;
  color: #f5f5f6;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.aw__copy {
  max-width: 40rem;
  margin: 0 auto;
  padding: 3rem 1.25rem calc(2.5rem + env(safe-area-inset-bottom, 0px));
}
.aw__copy h1 {
  margin: 0;
  font-size: clamp(1.8rem, 7vw, 2.6rem);
  font-weight: 750;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.aw__body {
  margin: 0.85rem 0 0;
  max-width: 34rem;
  color: rgba(245, 245, 246, 0.6);
  font-size: 1rem;
  line-height: 1.55;
}
.aw__back {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  margin-top: 1.25rem;
  color: rgba(245, 245, 246, 0.62);
  text-decoration: none;
}
.aw__back:focus-visible { outline: 2px solid #39d5ff; outline-offset: 3px; }
</style>
