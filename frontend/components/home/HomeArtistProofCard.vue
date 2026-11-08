<template>
  <article class="proof-phone">
    <NuxtLink
      :to="`/${artist.slug}`"
      class="proof-phone__link"
      :aria-label="`${artist.name} on Faneqo`"
    >
      <div class="proof-phone__hero">
        <img
          v-if="hero"
          :src="hero"
          :alt="artist.name"
          :style="heroPosition"
          width="800"
          height="1000"
          loading="lazy"
          decoding="async"
        />
        <div v-else class="proof-phone__fallback" />
        <div class="proof-phone__veil" aria-hidden="true" />
        <div class="proof-phone__identity">
          <h3 class="proof-phone__name">{{ artist.name }}</h3>
          <p v-if="genre" class="proof-phone__genre">{{ genre }}</p>
        </div>
      </div>

      <div class="proof-phone__world">
        <div v-if="bio" class="proof-phone__about">
          <p class="proof-phone__eyebrow">About</p>
          <p class="proof-phone__bio">{{ bio }}</p>
        </div>

        <div v-if="song" class="proof-phone__module" aria-hidden="true">
          <p class="proof-phone__eyebrow">Featured music</p>
          <div class="proof-phone__track">
            <div class="proof-phone__art">
              <img
                v-if="song.thumbnailUrl"
                :src="song.thumbnailUrl"
                alt=""
                width="80"
                height="80"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="min-w-0 flex-1">
              <p class="proof-phone__song">{{ song.title }}</p>
              <p class="proof-phone__listen">{{ song.artistName || artist.name }}</p>
            </div>
            <span class="proof-phone__play">
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
        </div>

        <div v-if="platforms.length" class="proof-phone__module" aria-hidden="true">
          <p class="proof-phone__eyebrow">Listen &amp; follow</p>
          <div class="proof-phone__links">
            <div
              v-for="link in platforms"
              :key="link.name"
              class="proof-phone__dest"
            >
              <span class="proof-phone__dest-icon">
                <PlatformIcon
                  :existing-icon="platformAsset(link.name)"
                  :iconify="platformIconify(link.name)"
                  :color="platformColor(link.name)"
                  :alt="link.label"
                  class-name="w-4 h-4"
                />
              </span>
              <span class="proof-phone__dest-label">{{ link.label }}</span>
              <svg class="proof-phone__dest-chevron" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>

        <div v-if="showFanList" class="proof-phone__fan" aria-hidden="true">
          <span class="proof-phone__fan-btn">{{ fanLabel }}</span>
        </div>
      </div>
    </NuxtLink>
  </article>
</template>

<script setup>
/**
 * Compact crop of a live Faneqo artist page.
 * Same module order as the real profile: photo, bio, music, links, Fan List.
 * The homepage proof intentionally omits video so each phone stays focused and compact.
 */
import { computed } from 'vue'
import PlatformIcon from '@/components/ui/PlatformIcon.vue'
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'

const PREFERRED_PLATFORMS = ['spotify', 'appleMusic', 'youtube']

const ASSET_MAP = {
  spotify: spotifyIcon,
  appleMusic: appleMusicIcon,
  youtube: youtubeIcon,
}

const ICONIFY_MAP = {
  spotify: 'simple-icons:spotify',
  appleMusic: 'simple-icons:applemusic',
  youtube: 'simple-icons:youtube',
}

const COLOR_MAP = {
  spotify: '#1DB954',
  appleMusic: '#FC3C44',
  youtube: '#FF0000',
}

const props = defineProps({
  artist: {
    type: Object,
    required: true,
  },
})

const hero = computed(
  () => props.artist?.heroImage || props.artist?.heroImageMobile || ''
)

const heroPosition = computed(() => {
  const pos = String(props.artist?.heroObjectPosition || '').trim()
  return pos ? { objectPosition: pos } : undefined
})

const bio = computed(() => {
  const text = String(props.artist?.bio || '').replace(/\s+/g, ' ').trim()
  return text || ''
})

const genre = computed(() => {
  const text = String(props.artist?.genre || '').trim()
  return text.split(/[,|]/)[0]?.trim() || ''
})

const song = computed(() => {
  const featured = props.artist?.featuredSong
  if (!featured?.title) return null
  return {
    title: featured.title,
    artistName: featured.artistName || '',
    thumbnailUrl: featured.thumbnailUrl || '',
  }
})

const platforms = computed(() => {
  const streaming = Array.isArray(props.artist?.streaming) ? props.artist.streaming : []
  const picked = []
  for (const name of PREFERRED_PLATFORMS) {
    const link = streaming.find((item) => item?.name === name && item.label)
    if (!link) continue
    picked.push(link)
    if (picked.length >= 2) break
  }
  return picked
})

function platformAsset(name) {
  return ASSET_MAP[name] || null
}

function platformIconify(name) {
  if (ASSET_MAP[name]) return null
  return ICONIFY_MAP[name] || 'lucide:link'
}

function platformColor(name) {
  return COLOR_MAP[name] || '#FFFFFF'
}

const showFanList = computed(() => props.artist?.fanList?.enabled !== false)

const fanLabel = computed(
  () => String(props.artist?.fanList?.buttonLabel || 'Join Fan List').trim() || 'Join Fan List'
)
</script>

<style scoped>
.proof-phone {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 1.45rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(180deg, #090a0f 0%, #050608 100%);
  box-shadow:
    0 30px 70px -22px rgba(0, 0, 0, 0.96),
    0 0 0 1px rgba(255, 255, 255, 0.04);
}

.proof-phone::before {
  content: '';
  position: absolute;
  inset: 0.12rem 16% auto;
  z-index: 4;
  height: 1px;
  background: linear-gradient(90deg, transparent, #f04fcf 38%, #8b6cff 68%, transparent);
  opacity: 0.72;
  pointer-events: none;
}

.proof-phone__link {
  display: flex;
  height: 100%;
  flex-direction: column;
  color: inherit;
  text-decoration: none;
}

.proof-phone__link:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 4px;
  border-radius: 1.45rem;
}

.proof-phone__hero {
  position: relative;
  height: 17.5rem;
  flex-shrink: 0;
  overflow: hidden;
  background: #111217;
}

.proof-phone__hero img,
.proof-phone__fallback {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 18%;
}

.proof-phone__fallback {
  background: linear-gradient(160deg, #1a1224, #0b0e14);
}

.proof-phone__veil {
  position: absolute;
  inset: auto 0 0;
  height: 52%;
  background: linear-gradient(180deg, transparent 0%, rgba(5, 6, 8, 0.9) 100%);
  pointer-events: none;
}

.proof-phone__identity {
  position: absolute;
  inset: auto 0 0;
  z-index: 1;
  padding: 1rem 0.95rem 0.95rem;
}

.proof-phone__name {
  margin: 0;
  font-size: clamp(1.45rem, 5.8vw, 1.85rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: #f7f9fc;
}

.proof-phone__genre {
  margin: 0.42rem 0 0;
  font-size: 0.67rem;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: 0.045em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.66);
}

.proof-phone__about {
  padding: 0.15rem 0.2rem 0.2rem;
}

.proof-phone__eyebrow {
  margin: 0 0 0.42rem;
  font-size: 0.58rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(196, 181, 253, 0.76);
}

.proof-phone__bio {
  margin: 0;
  max-width: 22rem;
  font-size: 0.76rem;
  line-height: 1.48;
  color: rgba(247, 249, 252, 0.74);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.proof-phone__world {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.78rem;
  padding: 0.85rem 0.75rem 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  background:
    radial-gradient(circle at 8% 0%, rgba(139, 108, 255, 0.08), transparent 34%),
    #050608;
}

.proof-phone__module {
  display: grid;
  gap: 0.38rem;
}

.proof-phone__track {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3.55rem;
  padding: 0.48rem 0.58rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(135deg, rgba(24, 23, 34, 0.98), rgba(11, 12, 17, 0.98));
}

.proof-phone__art,
.proof-phone__art img {
  width: 2.85rem;
  height: 2.85rem;
  flex-shrink: 0;
  border-radius: 0.45rem;
  object-fit: cover;
  background: #15161c;
}

.proof-phone__song {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proof-phone__listen {
  margin: 0.1rem 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.proof-phone__play {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.92);
}

.proof-phone__play {
  width: 2.15rem;
  height: 2.15rem;
  margin-left: auto;
}

.proof-phone__play svg {
  width: 0.82rem;
  height: 0.82rem;
  margin-left: 0.08rem;
}

.proof-phone__links {
  display: grid;
  gap: 0.38rem;
}

.proof-phone__dest {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 2.7rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(135deg, #1a1b24 0%, #14151d 100%);
}

.proof-phone__dest-icon {
  display: grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
}

.proof-phone__dest-label {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.84rem;
  font-weight: 600;
  color: #f7f9fc;
}

.proof-phone__dest-chevron {
  width: 0.95rem;
  height: 0.95rem;
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.28);
}

.proof-phone__fan {
  margin-top: auto;
  padding-top: 0.05rem;
}

.proof-phone__fan-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2.85rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(240, 79, 207, 0.3);
  background: linear-gradient(100deg, rgba(139, 108, 255, 0.2), rgba(240, 79, 207, 0.16));
  color: #f7f9fc;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

@media (min-width: 1024px) {
  .proof-phone__hero {
    height: 17.75rem;
  }

  .proof-phone__name {
    font-size: 1.95rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .proof-phone {
    transition: none;
  }
}
</style>
