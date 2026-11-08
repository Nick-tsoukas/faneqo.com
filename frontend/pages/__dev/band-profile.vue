<template>
  <div class="bg-black w-screen mx-auto pt-[var(--header-height)] fade-in">
    <div class="lab-rail" aria-hidden="false">
      <p class="lab-rail__kicker">Design lab · local only</p>
      <label class="lab-rail__ctrl">
        Follow
        <select v-model="followedLab">
          <option :value="false">Off</option>
          <option :value="true">On</option>
        </select>
      </label>
      <span class="lab-rail__note">Fan List is the original production module. Buttons are lab-only.</span>
    </div>

    <BandPageCybered
      :band="band"
      :upcoming-events="[]"
      :hidden-links="[]"
      :enabled-payment-buttons="[]"
      visual-variant="polish-test"
      :test-mode="true"
      :followed="followedLab"
      message-label="Message"
      :message-pending="false"
      :message-disabled="false"
      @play-song="onLabAction('play-song')"
      @play-video="onLabAction('play-video')"
      @link-click="onLabLink"
      @follow="followedLab = !followedLab"
      @message="onLabAction('message')"
      @share="onLabAction('share')"
    >
      <template #fan-capture>
        <FanCaptureSection
          :band-id="band.id"
          :band-slug="band.slug"
          :artist-name="band.name"
          :headline="neonStaticFanCaptureCopy.headline"
          :message="neonStaticFanCaptureCopy.message"
          :button-label="neonStaticFanCaptureCopy.buttonLabel"
          :success-message="neonStaticFanCaptureCopy.successMessage"
          capture-surface="band_page"
          variant="artist"
          :test-mode="true"
        />
      </template>
    </BandPageCybered>

    <footer class="lab-page-footer h-40 flex justify-center items-center bg-black">
      <img src="/faneqo-logo.png" alt="Faneqo — Your Band's Headquarters." class="h-10 w-auto" />
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import BandPageCybered from '@/components/band/BandPageCybered.vue'
import FanCaptureSection from '@/components/band/FanCaptureSection.vue'
import {
  neonStaticBandFixture,
  neonStaticFanCaptureCopy,
} from '@/config/bandProfileLab'

definePageMeta({
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Band profile lab · Faneqo',
  htmlAttrs: {
    class: 'band-profile-lab',
  },
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})

const band = neonStaticBandFixture
const followedLab = ref(false)

function onLabAction(name) {
  if (import.meta.dev) console.info(`[band-profile-lab] ${name}`)
}

function onLabLink(link) {
  if (import.meta.dev) console.info('[band-profile-lab] link', link?.name)
}
</script>

<style scoped>
.lab-rail {
  max-width: 48rem;
  margin: 0 auto;
  padding: 0.65rem 1rem 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 1rem;
  color: #9aa6b5;
  font-size: 0.72rem;
}
.lab-rail__kicker {
  margin: 0;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #6b7787;
  font-weight: 700;
}
.lab-rail__ctrl {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.lab-rail__ctrl select {
  background: #111217;
  color: #e8eaed;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.35rem;
  padding: 0.15rem 0.35rem;
}
.lab-rail__note {
  opacity: 0.75;
}
.lab-page-footer {
  margin-top: clamp(2rem, 1.25rem + 3vw, 3.5rem);
}
</style>

<style>
/* Lab visual review only: Nuxt DevTools draws a white circle over the profile. */
html.band-profile-lab #nuxt-devtools-container,
html.band-profile-lab #nuxt-devtools-anchor,
html.band-profile-lab .nuxt-devtools-frame {
  display: none !important;
}
</style>
