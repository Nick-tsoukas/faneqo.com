<template>
  <div class="v2-canvas" aria-hidden="true">
    <div class="v2-canvas__page">
      <div data-chapter="music" class="v2-canvas__chapter">
        <div class="v2-canvas__hero">
          <img
            v-if="artist.heroImage"
            :src="artist.heroImage"
            :alt="`${artist.name} hero`"
            class="v2-canvas__hero-img"
            width="1000"
            height="1500"
            decoding="async"
            loading="eager"
            fetchpriority="high"
          >
          <div class="v2-canvas__hero-shade"></div>
          <div v-if="artist.genre" class="v2-canvas__genre">{{ artist.genre }}</div>
          <div class="v2-canvas__identity">
            <p class="v2-canvas__name">{{ artist.name }}</p>
          </div>
        </div>

        <div v-if="artist.bio" class="v2-canvas__bio">
          {{ artist.bio }}
        </div>

        <div v-if="artist.featuredSong" data-camera="music" class="v2-canvas__block">
          <p class="v2-canvas__kicker">Featured Song</p>
          <div class="v2-canvas__track">
            <div class="v2-canvas__art">
              <img
                v-if="artist.featuredSong.thumbnailUrl"
                :src="artist.featuredSong.thumbnailUrl"
                :alt="artist.featuredSong.title"
                loading="lazy"
              >
            </div>
            <div class="v2-canvas__track-copy">
              <p class="v2-canvas__track-title">{{ artist.featuredSong.title }}</p>
              <p class="v2-canvas__track-artist">{{ artist.featuredSong.artistName || artist.name }}</p>
            </div>
            <div class="v2-canvas__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div v-if="artist.featuredVideo" data-chapter="video" class="v2-canvas__chapter">
        <div class="v2-canvas__block">
          <p class="v2-canvas__kicker">Featured Video</p>
          <div class="v2-canvas__video">
            <img
              :src="artist.featuredVideo.thumbnailUrl"
              :alt="artist.featuredVideo.title"
              loading="lazy"
            >
            <div class="v2-canvas__video-play">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div class="v2-canvas__video-meta">
              <p>{{ artist.featuredVideo.title }}</p>
              <span>{{ artist.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="streaming.length" class="v2-canvas__block">
        <p class="v2-canvas__kicker">Streaming</p>
        <div class="v2-canvas__links">
          <div v-for="link in streaming" :key="link.name" class="v2-canvas__link">
            <span>{{ link.label }}</span>
          </div>
        </div>
      </div>

      <div data-chapter="fanList" class="v2-canvas__chapter">
        <div class="v2-canvas__fan">
          <p class="v2-canvas__fan-count">{{ fanCount }} fans</p>
          <p class="v2-canvas__fan-title">{{ artist.fanList?.headline || 'Join the fan list' }}</p>
          <p class="v2-canvas__fan-copy">
            {{ artist.fanList?.message || 'Get first access to shows, merch, and updates.' }}
          </p>
          <div class="v2-canvas__fan-cta">
            {{ artist.fanList?.buttonLabel || 'Join Fan List' }}
          </div>
        </div>
      </div>

      <div data-chapter="support" class="v2-canvas__chapter">
        <div class="v2-canvas__support">
          <div class="v2-canvas__support-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div>
            <p class="v2-canvas__support-title">Support the Band</p>
            <p class="v2-canvas__support-copy">Tips &amp; payments on the page</p>
          </div>
          <div class="v2-canvas__support-amounts" aria-hidden="true">
            <span>$5</span>
            <span>$10</span>
            <span>$20</span>
          </div>
        </div>
      </div>

      <div data-chapter="showMode" class="v2-canvas__chapter">
        <div class="v2-canvas__show">
          <p class="v2-canvas__show-live">
            <span class="v2-canvas__show-dot"></span>
            Show Mode
          </p>
          <p class="v2-canvas__show-artist">{{ show.artist }}</p>
          <p class="v2-canvas__show-meta">{{ show.when }} · {{ show.city }}</p>
          <p class="v2-canvas__show-line">{{ show.venueLine }}</p>
          <div class="v2-canvas__checkin">I’m here</div>
        </div>
      </div>
      <div class="v2-product-camera-runway" aria-hidden="true"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { HOME_V2_STORY_DEMO } from '~/utils/home-v2/relationshipStoryDemo.js'

const props = defineProps({
  artist: { type: Object, required: true },
})

const streaming = computed(() => (props.artist.streaming || []).slice(0, 3))
const fanCount = HOME_V2_STORY_DEMO.fanCountBefore
const show = computed(() => ({
  artist: props.artist.name || HOME_V2_STORY_DEMO.artist.name,
  when: HOME_V2_STORY_DEMO.artist.when,
  city: HOME_V2_STORY_DEMO.artist.city,
  venueLine: HOME_V2_STORY_DEMO.artist.venueLine,
}))
</script>

<style scoped>
.v2-canvas {
  pointer-events: none;
  user-select: none;
}

.v2-product-camera-runway {
  height: 0;
  pointer-events: none;
  visibility: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .v2-product-camera-runway {
    display: none;
  }
}

.v2-canvas__page {
  background: #050506;
  color: #f5f5f6;
}

.v2-canvas__chapter {
  position: relative;
}

.v2-canvas__hero {
  position: relative;
  aspect-ratio: 2 / 3;
  width: 100%;
  min-height: 24rem;
  max-height: 40rem;
  overflow: hidden;
}

.v2-canvas__hero-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 16%;
}

.v2-canvas__hero-shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, #050506 0%, rgba(5, 5, 6, 0.28) 42%, transparent 70%);
}

.v2-canvas__genre {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.5);
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.85);
}

.v2-canvas__identity {
  position: absolute;
  right: 1.25rem;
  bottom: 1.15rem;
  left: 1.25rem;
}

.v2-canvas__name {
  margin: 0;
  font-size: clamp(1.7rem, 4vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
}

.v2-canvas__bio {
  margin: 0;
  padding: 1.15rem 1.35rem 0.35rem;
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.88rem;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.v2-canvas__block {
  padding: 1rem 1.35rem 0.35rem;
}

.v2-canvas__kicker {
  margin: 0 0 0.7rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.38);
}

.v2-canvas__track {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.75rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0c0c10;
}

.v2-canvas__art {
  width: 3.5rem;
  height: 3.5rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.v2-canvas__art img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.v2-canvas__track-copy {
  min-width: 0;
  flex: 1;
}

.v2-canvas__track-title {
  margin: 0;
  font-weight: 650;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v2-canvas__track-artist {
  margin: 0.15rem 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.48);
}

.v2-canvas__play {
  width: 2.5rem;
  height: 2.5rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  flex-shrink: 0;
}

.v2-canvas__play svg {
  width: 1.05rem;
  height: 1.05rem;
  margin-left: 0.08rem;
}

.v2-canvas__play.is-emphasis {
  border-color: rgba(69, 214, 167, 0.55);
  color: #45d6a7;
  background: rgba(69, 214, 167, 0.1);
}

.v2-canvas__video {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0c0c10;
}

.v2-canvas__video img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.72;
}

.v2-canvas__video-play {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}

.v2-canvas__video-play svg {
  width: 3.1rem;
  height: 3.1rem;
  padding: 0.85rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
}

.v2-canvas__video.is-emphasis {
  border-color: rgba(35, 199, 195, 0.45);
}

.v2-canvas__video.is-emphasis .v2-canvas__video-play svg {
  border-color: rgba(69, 214, 167, 0.5);
}

.v2-canvas__video-meta {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 0.75rem 0.85rem 0.7rem;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
}

.v2-canvas__video-meta p {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 650;
  color: #fff;
}

.v2-canvas__video-meta span {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
}

.v2-canvas__links {
  display: grid;
  gap: 0.45rem;
}

.v2-canvas__link {
  padding: 0.8rem 1rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: #0c0c10;
  font-size: 0.9rem;
  font-weight: 550;
}

.v2-canvas__fan {
  margin: 0.85rem 1.35rem 0.5rem;
  padding: 1.35rem 1.2rem 1.25rem;
  border-radius: 1.1rem;
  border: 1px solid rgba(168, 85, 247, 0.28);
  background: linear-gradient(180deg, rgba(88, 28, 135, 0.35), #0c0c10 55%);
  text-align: center;
}

.v2-canvas__fan-count {
  margin: 0 0 0.45rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.8);
}

.v2-canvas__fan-title {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 750;
  background: linear-gradient(90deg, #d8b4fe, #f9a8d4);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v2-canvas__fan-copy {
  margin: 0.55rem auto 0;
  max-width: 28ch;
  font-size: 0.84rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.52);
}

.v2-canvas__fan-cta {
  margin: 1rem auto 0;
  max-width: 16rem;
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: linear-gradient(90deg, #9333ea, #db2777);
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #fff;
}

.v2-canvas__fan-cta.is-emphasis {
  box-shadow: 0 0 0 1px rgba(69, 214, 167, 0.35);
}

.v2-canvas__support {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0.85rem 1.35rem 0.45rem;
  padding: 0.95rem 1rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(69, 214, 167, 0.2);
  background: rgba(69, 214, 167, 0.06);
}

.v2-canvas__support-icon {
  width: 2.35rem;
  height: 2.35rem;
  display: grid;
  place-items: center;
  border-radius: 0.65rem;
  border: 1px solid rgba(69, 214, 167, 0.28);
  background: rgba(69, 214, 167, 0.12);
  color: #45d6a7;
  flex-shrink: 0;
}

.v2-canvas__support-icon svg {
  width: 1rem;
  height: 1rem;
}

.v2-canvas__support-title {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
}

.v2-canvas__support-copy {
  margin: 0.15rem 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}

.v2-canvas__support-amounts {
  margin-left: auto;
  display: flex;
  gap: 0.3rem;
}

.v2-canvas__support-amounts span {
  padding: 0.28rem 0.45rem;
  border-radius: 0.45rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.7);
}

.v2-canvas__support.is-emphasis {
  border-color: rgba(35, 199, 195, 0.45);
}

.v2-canvas__show {
  margin: 0.85rem 1.35rem 1.75rem;
  padding: 1.35rem 1.2rem 1.3rem;
  border-radius: 1.15rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #0b0c10;
  text-align: center;
}

.v2-canvas__show-live {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0 0 0.85rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(69, 214, 167, 0.78);
}

.v2-canvas__show-dot {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 999px;
  background: #45d6a7;
}

.v2-canvas__show-artist {
  margin: 0;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.v2-canvas__show-meta {
  margin: 0.35rem 0 0;
  font-size: 0.7rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.46);
}

.v2-canvas__show-line {
  margin: 0.7rem 0 1.05rem;
  color: rgba(255, 255, 255, 0.5);
}

.v2-canvas__checkin {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #111217;
  font-weight: 650;
}

.v2-canvas__checkin.is-emphasis {
  border-color: rgba(69, 214, 167, 0.42);
  color: #f5f5f6;
}
</style>
