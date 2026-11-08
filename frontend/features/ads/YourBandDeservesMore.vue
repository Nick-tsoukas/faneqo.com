<template>
  <article class="ad" :class="{ 'is-still': still }" :data-format="format" :aria-label="sceneLabel">
    <Transition :name="still ? '' : 'ad-scene'">
      <div :key="scene" class="ad__scene">
        <section v-if="scene === 0" class="poster">
          <img class="poster__photo" :src="heroSrc" alt="" />
          <div class="poster__veil" aria-hidden="true" />
          <img class="poster__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
          <h1 class="poster__title">
            <span>Your band</span>
            <span>deserves more</span>
            <span>than a link</span>
            <span>in bio.</span>
          </h1>
        </section>

        <section v-else-if="scene === 1" class="product">
          <img class="product__mark" src="/faneqo-wordmark.svg" alt="Faneqo" />
          <div class="phone" inert>
            <div class="phone__screen">
              <div class="phone__hero">
                <img :src="heroSrc" alt="" />
                <div class="phone__shade" aria-hidden="true" />
                <p class="phone__genre">{{ genre }}</p>
                <h2 class="phone__name">{{ artistName }}</h2>
              </div>
              <div class="phone__sheet">
                <div class="follow">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                  </svg>
                  <span>Follow</span>
                </div>
                <p class="quiet">Message · Share</p>
                <div class="song">
                  <img class="song__art" :src="heroSrc" alt="" />
                  <div class="song__copy">
                    <strong>{{ songTitle }}</strong>
                    <span>{{ artistName }}</span>
                  </div>
                </div>
                <p class="quiet streams">
                  <img :src="spotifyIcon" alt="" />
                  <span>Spotify</span>
                  <img :src="appleIcon" alt="" />
                  <span>Apple Music</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        <section v-else class="close">
          <img class="close__photo" :src="heroSrc" alt="" />
          <div class="close__veil" aria-hidden="true" />
          <div class="close__copy">
            <h2>
              <span>Your music.</span>
              <span>Your fans.</span>
              <span>Your world.</span>
            </h2>
            <img src="/faneqo-wordmark.svg" alt="Faneqo" />
          </div>
        </section>
      </div>
    </Transition>

    <div class="ad__ticks" aria-hidden="true">
      <i v-for="index in 3" :key="index" :class="{ 'is-on': index - 1 === scene }" />
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist.js'
import spotifyIcon from '@/assets/spotify.svg'
import appleIcon from '@/assets/apple.svg'

/**
 * Scene 2 is an inert presentation of the artist page.
 * The live profile component is not mounted: its setup writes shared
 * hero-opening state, starts an IntersectionObserver, and can mount audio.
 * This frame uses the local BADFLOWER snapshot only. The phone is inert,
 * so Follow, Message, and Share cannot focus or emit.
 */

const props = defineProps({
  scene: { type: Number, default: 0 },
  still: { type: Boolean, default: false },
  format: { type: String, default: 'story' },
})

const artistName = FALLBACK_SNAPSHOT.name
const songTitle = FALLBACK_SNAPSHOT.featuredSong?.title || 'Ghost'
const heroSrc = FALLBACK_SNAPSHOT.heroImage
const genre = String(FALLBACK_SNAPSHOT.genre || '').split(',')[0].trim()

const sceneLabel = computed(() => {
  if (props.scene === 0) return 'Your band deserves more than a link in bio.'
  if (props.scene === 1) return `${artistName} on Faneqo`
  return 'Your music. Your fans. Your world. Faneqo.'
})
</script>

<style scoped>
.ad {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.ad__scene {
  position: absolute;
  inset: 0;
}

.poster,
.product,
.close {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.poster__photo,
.close__photo {
  position: absolute;
  left: -8%;
  top: -8%;
  width: 116%;
  height: 116%;
  object-fit: cover;
  object-position: center 18%;
}

.poster__photo {
  object-position: center 8%;
  animation: ad-drift 14s ease-out forwards;
}

.close__photo {
  object-position: center 42%;
  opacity: 0.42;
  filter: saturate(0.8);
  animation: ad-drift 16s ease-out forwards;
}

.poster__veil,
.close__veil {
  position: absolute;
  inset: 0;
}

.poster__veil {
  background:
    linear-gradient(180deg, rgba(5, 5, 6, 0.22) 0%, rgba(5, 5, 6, 0) 24%, rgba(5, 5, 6, 0.08) 46%, rgba(5, 5, 6, 0.82) 64%, #050506 82%),
    linear-gradient(90deg, rgba(5, 5, 6, 0.28) 0%, transparent 28%);
}

.close__veil {
  background:
    radial-gradient(ellipse at center, rgba(5, 5, 6, 0.62) 0%, rgba(5, 5, 6, 0.84) 42%, #050506 100%),
    linear-gradient(180deg, rgba(5, 5, 6, 0.45), rgba(5, 5, 6, 0.7));
}

.poster__mark {
  position: absolute;
  top: 64px;
  left: 64px;
  width: 168px;
  height: auto;
}

.poster__title {
  position: absolute;
  left: 64px;
  right: 64px;
  bottom: 188px;
  margin: 0;
  font-size: 104px;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.88;
  text-transform: uppercase;
  animation: ad-rise 720ms cubic-bezier(0.2, 0.7, 0.2, 1) 160ms both;
}

.poster__title span {
  display: block;
}

.product {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 0 96px;
}

.product__mark {
  width: 150px;
  height: auto;
  margin-bottom: 28px;
  opacity: 0.92;
}

.phone {
  width: 924px;
  flex: 1 1 auto;
  min-height: 0;
  padding: 14px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 54px;
  background: #050506;
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.04),
    0 36px 90px rgba(0, 0, 0, 0.55);
}

.phone__screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 40px;
  background: #050506;
}

.phone__hero {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.phone__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 16%;
}

.phone__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 5, 6, 0.18) 0%, rgba(5, 5, 6, 0.05) 40%, rgba(5, 5, 6, 0.88) 100%);
}

.phone__genre {
  position: absolute;
  top: 28px;
  left: 28px;
  margin: 0;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  background: rgba(5, 5, 6, 0.45);
  color: rgba(247, 249, 252, 0.86);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.phone__name {
  position: absolute;
  left: 32px;
  right: 32px;
  bottom: 28px;
  margin: 0;
  font-size: 64px;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.92;
}

.phone__sheet {
  flex: 0 0 auto;
  margin-top: -28px;
  padding: 8px 28px 36px;
  position: relative;
  z-index: 1;
}

.follow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 84px;
  border-radius: 22px;
  background: #eceef2;
  color: #0c0d12;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.follow svg {
  width: 26px;
  height: 26px;
}

.quiet {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 18px 4px 0;
  color: rgba(247, 249, 252, 0.46);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

.quiet img {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.streams {
  margin-top: 16px;
}

.song {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 22px;
  padding: 0 4px;
}

.song__art {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
  object-position: center 20%;
}

.song__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.song__copy strong {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.song__copy span {
  color: rgba(247, 249, 252, 0.46);
  font-size: 18px;
}

.close__copy {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 56px;
  padding: 0 72px 40px;
  text-align: center;
  animation: ad-rise 720ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.close__copy h2 {
  margin: 0;
  font-size: 92px;
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.94;
  text-transform: uppercase;
}

.close__copy h2 span {
  display: block;
}

.close__copy img {
  width: 340px;
  height: auto;
}

.ad__ticks {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  bottom: 56px;
  display: flex;
  justify-content: center;
  gap: 10px;
  pointer-events: none;
}

.ad__ticks i {
  display: block;
  width: 36px;
  height: 2px;
  border-radius: 999px;
  background: rgba(247, 249, 252, 0.22);
}

.ad__ticks i.is-on {
  background: rgba(247, 249, 252, 0.72);
}

.ad-scene-enter-active,
.ad-scene-leave-active {
  transition: opacity 450ms ease, transform 450ms ease;
}

.ad-scene-enter-from {
  opacity: 0;
  transform: translateY(22px);
}

.ad-scene-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

@keyframes ad-drift {
  from { transform: scale(1.08) translate3d(0, 1.2%, 0); }
  to { transform: scale(1.02) translate3d(0, 0, 0); }
}

@keyframes ad-rise {
  from { opacity: 0; transform: translateY(28px); }
  to { opacity: 1; transform: none; }
}

.is-still .poster__photo,
.is-still .close__photo,
.is-still .poster__title,
.is-still .close__copy {
  animation: none;
}

.is-still .poster__photo {
  transform: scale(1.04);
}

@media (prefers-reduced-motion: reduce) {
  .poster__photo,
  .close__photo,
  .poster__title,
  .close__copy,
  .ad-scene-enter-active,
  .ad-scene-leave-active {
    animation: none;
    transition: none;
  }

  .ad-scene-enter-from,
  .ad-scene-leave-to {
    opacity: 1;
    transform: none;
  }
}
</style>
