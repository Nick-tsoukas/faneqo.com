<template>
  <article class="nri" :class="[`is-${recording.kind || 'audio'}`, { 'is-locked': locked }]">
    <div v-if="locked" class="nri__lock">
      <p class="nri__title">{{ title }}</p>
      <p class="nri__meta">{{ lockLine }}</p>
    </div>

    <template v-else-if="isVideo">
      <div class="nri__frame">
        <button
          v-if="!playing"
          type="button"
          class="nri__poster"
          :aria-label="`Watch ${title}`"
          @click="playing = true"
        >
          <img
            v-if="videoThumb"
            :src="videoThumb"
            :alt="title"
            loading="lazy"
            @error="onThumbError"
          >
          <span class="nri__glass" aria-hidden="true">
            <Play :size="22" :stroke-width="2" fill="currentColor" />
          </span>
          <span class="nri__onframe">
            <span class="nri__onframe-title">{{ title }}</span>
            <span v-if="artistName" class="nri__onframe-sub">{{ artistName }}</span>
          </span>
        </button>
        <iframe
          v-else-if="youtubeId"
          class="nri__embed"
          :src="youtubeSrc"
          :title="title"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        />
        <video
          v-else
          class="nri__video"
          :poster="posterUrl || undefined"
          :src="mediaUrl"
          controls
          playsinline
          preload="metadata"
          :aria-label="title"
        />
      </div>
      <p v-if="caption" class="nri__caption">{{ caption }}</p>
    </template>

    <template v-else-if="isSpotify">
      <div v-if="!playing" class="nri__track">
        <div class="nri__art" aria-hidden="true">
          <img v-if="artUrl" :src="artUrl" alt="" loading="lazy">
          <span v-else class="nri__mark">{{ artLetter }}</span>
        </div>
        <div class="nri__copy">
          <p class="nri__title">{{ title }}</p>
          <p class="nri__meta">{{ spotifyMeta }}</p>
        </div>
        <button
          type="button"
          class="nri__play"
          :aria-label="`Play ${title}`"
          @click="playing = true"
        >
          <Play :size="16" :stroke-width="2" fill="currentColor" aria-hidden="true" />
          Play
        </button>
      </div>
      <iframe
        v-else
        class="nri__spotify"
        :src="spotifySrc"
        :title="title"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
    </template>

    <template v-else-if="isUploadAudio">
      <div class="nri__track">
        <div class="nri__art" aria-hidden="true">
          <img v-if="artUrl" :src="artUrl" alt="" loading="lazy">
          <span v-else class="nri__mark">{{ artLetter }}</span>
        </div>
        <div class="nri__copy">
          <p class="nri__title">{{ title }}</p>
          <p class="nri__meta">{{ audioMeta }}</p>
        </div>
        <button
          type="button"
          class="nri__play"
          :aria-pressed="playing"
          :aria-label="playing ? `Pause ${title}` : `Play ${title}`"
          @click="toggleAudio"
        >
          <Pause v-if="playing" :size="16" :stroke-width="2" aria-hidden="true" />
          <Play v-else :size="16" :stroke-width="2" fill="currentColor" aria-hidden="true" />
          {{ playing ? 'Pause' : 'Play' }}
        </button>
        <audio
          ref="audioEl"
          :src="mediaUrl"
          preload="metadata"
          @ended="playing = false"
          @pause="syncAudio"
          @play="playing = true"
          @loadedmetadata="onAudioMeta"
        />
      </div>
    </template>

    <div v-else class="nri__lock">
      <p class="nri__title">{{ title }}</p>
      <p v-if="caption || contextLine" class="nri__meta">{{ caption || contextLine }}</p>
    </div>
  </article>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Pause, Play } from '@lucide/vue'
import { youtubeThumbUrl } from '~/utils/media/youtubeThumb'
import {
  formatRecordingDuration,
  recordingContextLine,
  recordingDisplayTitle,
  recordingLockLine,
  recordingProvider,
  spotifyEmbedUrl,
  youtubeEmbedUrl,
  youtubeIdFromRecording,
} from '~/utils/nights/nightRecordings'

const props = defineProps({
  recording: { type: Object, required: true },
  artistName: { type: String, default: '' },
})

const playing = ref(false)
const audioEl = ref(null)
const thumbFallback = ref(false)
const heardSeconds = ref(null)
const oembedThumb = ref('')
const oembedTitle = ref('')

const locked = computed(() => !!props.recording?.locked)
const title = computed(() => recordingDisplayTitle(props.recording) || oembedTitle.value || 'From the stage')
const caption = computed(() => String(props.recording?.caption || '').trim())
const contextLine = computed(() => recordingContextLine(props.recording))
const lockLine = computed(() => recordingLockLine({
  lockReason: props.recording?.lockReason,
  artistName: props.artistName,
}))
const youtubeId = computed(() => youtubeIdFromRecording(props.recording))
const youtubeSrc = computed(() => youtubeEmbedUrl(youtubeId.value, { autoplay: true }))
const provider = computed(() => recordingProvider(props.recording))
const spotifySrc = computed(() => spotifyEmbedUrl(provider.value.resourceType, provider.value.resourceId))
const mediaUrl = computed(() => String(props.recording?.media?.url || '').trim())
const posterUrl = computed(() => String(props.recording?.poster?.url || '').trim())
const isVideo = computed(() => props.recording?.kind === 'video' && (youtubeId.value || mediaUrl.value))
const isSpotify = computed(() => props.recording?.source === 'spotify' && !!spotifySrc.value)
const isUploadAudio = computed(() => props.recording?.kind === 'audio' && props.recording?.source === 'upload' && !!mediaUrl.value)
const videoThumb = computed(() => {
  if (posterUrl.value) return posterUrl.value
  if (youtubeId.value) return youtubeThumbUrl(youtubeId.value, thumbFallback.value ? 'hqdefault' : 'maxresdefault')
  return ''
})
const artUrl = computed(() => posterUrl.value || oembedThumb.value)
const artLetter = computed(() => {
  const letter = String(title.value || 'N').trim().charAt(0)
  return letter ? letter.toUpperCase() : 'N'
})
const storedDuration = computed(() => (
  formatRecordingDuration(props.recording?.duration ?? props.recording?.durationSeconds)
  || formatRecordingDuration(heardSeconds.value)
))
const spotifyMeta = computed(() => {
  const type = provider.value.resourceType
  const kind = type === 'album' ? 'Album' : type === 'playlist' ? 'Playlist' : 'Track'
  if (props.artistName) return `${kind} on Spotify · ${props.artistName}`
  return `${kind} on Spotify`
})
const audioMeta = computed(() => {
  if (caption.value) return caption.value
  return storedDuration.value ? `Recording · ${storedDuration.value}` : (props.artistName || 'Recording')
})

function onThumbError() {
  thumbFallback.value = true
}

function syncAudio() {
  playing.value = !audioEl.value?.paused
}

function onAudioMeta() {
  const seconds = Math.round(Number(audioEl.value?.duration))
  if (Number.isInteger(seconds) && seconds > 0) heardSeconds.value = seconds
}

function toggleAudio() {
  const node = audioEl.value
  if (!node) return
  if (node.paused) node.play().catch(() => { playing.value = false })
  else node.pause()
}

async function loadSpotifyArt() {
  if (props.recording?.source !== 'spotify') return
  const url = provider.value.url
  if (!url || !url.startsWith('https://open.spotify.com/')) return
  try {
    const data = await $fetch('/api/spotify/oembed', { query: { url } })
    oembedThumb.value = String(data?.thumbnailUrl || '').trim()
    oembedTitle.value = String(data?.title || '').trim()
  } catch {
    oembedThumb.value = ''
  }
}

onMounted(loadSpotifyArt)
watch(() => provider.value.url, loadSpotifyArt)

onUnmounted(() => {
  audioEl.value?.pause()
})
</script>

<style scoped>
.nri { min-width: 0; }
.nri__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  line-height: 1.3;
  color: #f5f5f6;
  overflow-wrap: anywhere;
}
.nri__meta,
.nri__caption {
  margin: 0.22rem 0 0;
  font-size: 0.875rem;
  line-height: 1.4;
  color: rgba(245, 245, 246, 0.56);
  overflow-wrap: anywhere;
}
.nri__caption { margin-top: 0.7rem; }
.nri__copy { min-width: 0; flex: 1; }
.nri__lock { padding: 0.15rem 0; }
.nri__frame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #0c0d10;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
}
.nri__poster,
.nri__embed,
.nri__video {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
.nri__poster {
  position: relative;
  padding: 0;
  background: #0c0d10;
  cursor: pointer;
}
.nri__poster img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.62;
}
.nri__glass {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f5f5f6;
}
.nri__glass :deep(svg) {
  width: 1.35rem;
  height: 1.35rem;
  margin-left: 0.12rem;
}
.nri__glass::before {
  content: '';
  position: absolute;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}
.nri__glass :deep(svg) { position: relative; z-index: 1; }
.nri__onframe {
  position: absolute;
  left: 0.85rem;
  right: 0.85rem;
  bottom: 0.8rem;
  display: grid;
  gap: 0.12rem;
  text-align: left;
}
.nri__onframe-title {
  font-size: 0.9375rem;
  font-weight: 650;
  color: #fff;
  overflow-wrap: anywhere;
}
.nri__onframe-sub {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.62);
}
.nri__track {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  min-height: 5.25rem;
  padding: 0.75rem 0.8rem 0.75rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.03);
}
.nri__art {
  flex: 0 0 4rem;
  width: 4rem;
  height: 4rem;
  overflow: hidden;
  border-radius: 0.55rem;
  background: #16171c;
}
.nri__art img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.nri__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: rgba(245, 245, 246, 0.72);
  font-size: 1.25rem;
  font-weight: 700;
}
.nri__play {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  flex: 0 0 auto;
  min-width: 44px;
  min-height: 44px;
  padding: 0 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f6;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 650;
  cursor: pointer;
}
.nri__track audio { display: none; }
.nri__spotify {
  display: block;
  width: 100%;
  height: 152px;
  border: 0;
  border-radius: 0.75rem;
}
.nri__poster:focus-visible,
.nri__play:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}
@media (min-width: 768px) {
  .nri__onframe-title { font-size: 1.05rem; }
}
@media (prefers-reduced-motion: reduce) {
  .nri * { transition: none !important; }
}
</style>
