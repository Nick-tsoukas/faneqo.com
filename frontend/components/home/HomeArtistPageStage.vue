<template>
  <article class="spread" :data-artist="artist.slug">
    <div class="cover">
      <p class="rail">
        <span class="rail__rule" aria-hidden="true" />
        <span class="rail__text">Artist pages</span>
      </p>

      <div class="print" :style="{ aspectRatio: print.ratio }">
        <img
          v-if="hero"
          :src="hero"
          alt=""
          :class="{ 'is-rect': print.fit === 'rect' }"
          :style="printStyle"
          width="1000"
          height="800"
          decoding="async"
        />
      </div>

      <div class="identity">
        <h3 ref="nameEl" class="name" :style="nameStyle">
          <span v-for="(line, i) in nameLines" :key="i" class="name__solid">{{ line }}</span>
          <span class="name__echo" aria-hidden="true">{{ nameLines[nameLines.length - 1] }}</span>
        </h3>
      </div>
    </div>

    <div class="product">
      <section v-if="spotifyEmbed" class="module" aria-label="Featured song">
        <p class="eyebrow">Featured song</p>
        <EliteSpotifyEmbedWidget
          :spotify-url="spotifyEmbed.url"
          :title="song.title"
          :thumbnail-url="song.thumbnailUrl || ''"
          :type="spotifyEmbed.type"
          :iframe-html="spotifyEmbed.html"
          :artist-name="song.artistName || artist.name"
        />
      </section>

      <section v-if="streaming.length" class="module" aria-label="Streaming">
        <p class="eyebrow">Streaming</p>
        <div class="destinations">
          <a
            v-for="link in streaming"
            :key="link.name"
            :href="link.url"
            class="dest"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="dest__mark">
              <PlatformIcon
                :existing-icon="assetFor(link.name)"
                :iconify="iconFor(link.name)"
                :color="colorFor(link.name)"
                :alt="link.label"
                :class-name="glyphClass(link.name)"
              />
            </span>
            <span>{{ link.label }}</span>
          </a>
        </div>
      </section>

      <section v-if="social.length || extras.length" class="module" aria-label="Links">
        <p class="eyebrow">{{ social.length ? 'Social' : 'Links' }}</p>
        <div v-if="social.length" class="icons">
          <a
            v-for="link in social"
            :key="link.name"
            :href="link.url"
            class="icon-link"
            target="_blank"
            rel="noopener noreferrer"
            :aria-label="link.label"
          >
            <PlatformIcon
              :existing-icon="assetFor(link.name)"
              :iconify="iconFor(link.name)"
              :color="colorFor(link.name)"
              :alt="''"
              :class-name="glyphClass(link.name)"
            />
          </a>
        </div>
        <div v-if="extras.length" class="destinations">
          <a
            v-for="link in extras"
            :key="link.name"
            :href="link.url"
            class="dest"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="dest__mark">
              <PlatformIcon
                :existing-icon="assetFor(link.name)"
                :iconify="iconFor(link.name)"
                :color="colorFor(link.name)"
                :alt="link.label"
                :class-name="glyphClass(link.name)"
              />
            </span>
            <span>{{ link.label }}</span>
          </a>
        </div>
      </section>

      <section v-if="gallery" class="module" aria-label="Gallery">
        <p class="eyebrow">Gallery</p>
        <div class="thumbs">
          <NuxtLink
            v-for="photo in gallery.photos"
            :key="photo.id || photo.src"
            :to="gallery.path || `/${artist.slug}`"
            class="thumbs__link"
          >
            <img :src="photo.src" alt="" width="240" height="240" />
          </NuxtLink>
        </div>
      </section>

      <FanCaptureSection
        v-if="showFanList"
        class="fan"
        :band-id="canJoin ? artist.id : 0"
        :band-slug="artist.slug"
        variant="artist"
        composition="close"
        capture-surface="band_page"
        :artist-name="artist.name"
        :artist-image="fanImage"
        :image-focal-x="focal.x"
        :image-focal-y="focal.y"
        :headline="artist.fanList?.headline || ''"
        :message="artist.fanList?.message || ''"
        :button-label="artist.fanList?.buttonLabel || 'Join Fan List'"
        :featured-gallery="artist.featuredGallery || null"
        :continue-to="canJoin ? '' : `/${artist.slug}`"
      />

      <NuxtLink v-if="artist.slug" :to="`/${artist.slug}`" class="explore">
        <span>{{ exploreLabel }}</span>
        <i class="explore__bar" aria-hidden="true" />
      </NuxtLink>
    </div>
  </article>
</template>

<script setup>
import { computed, ref } from 'vue'
import EliteSpotifyEmbedWidget from '@/components/smartlink/EliteSpotifyEmbedWidget.vue'
import FanCaptureSection from '@/components/band/FanCaptureSection.vue'
import PlatformIcon from '@/components/ui/PlatformIcon.vue'
import { splitNameLines, useFitLine } from '@/features/ads/studio/templates/spotlight/useFitLine.js'
import { cropImageStyle, exploreArtistLabel, showcasePrint } from '@/utils/home/showcaseFeature.js'
import { resolvePublicFeaturedGallery } from '@/utils/galleries/publicFeaturedGallery'
import spotifyIcon from '@/assets/spotify.svg'
import appleMusicIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import tidalIcon from '@/assets/tidal.svg'
import soundcloudIcon from '@/assets/whitesoundcloud.svg'
import bandcampIcon from '@/assets/bandcamp.svg'
import facebookIcon from '@/assets/facebook-icon.svg'
import instagramIcon from '@/assets/whiteinstagram.svg'
import threadsIcon from '@/assets/threads.svg'
import websiteIcon from '@/assets/website.svg'

const ASSET_MAP = {
  spotify: spotifyIcon,
  appleMusic: appleMusicIcon,
  youtube: youtubeIcon,
  tidal: tidalIcon,
  soundcloud: soundcloudIcon,
  bandcamp: bandcampIcon,
  facebook: facebookIcon,
  instagram: instagramIcon,
  threads: threadsIcon,
  website: websiteIcon,
  merch: websiteIcon,
}

// These files use currentColor. As an <img> that resolves to black, so the
// showcase lightens them without rewriting the shared asset.
const MONO_ASSETS = new Set(['tidal', 'threads'])

const ICONIFY_MAP = {
  tiktok: 'simple-icons:tiktok',
  twitter: 'simple-icons:x',
}

const COLOR_MAP = {
  spotify: '#1DB954',
  appleMusic: '#FC3C44',
  youtube: '#FF0033',
  tidal: '#ffffff',
  bandcamp: '#629aa9',
  facebook: '#1877F2',
  instagram: '#E6E6E6',
  threads: '#E6E6E6',
  tiktok: '#E6E6E6',
  soundcloud: '#FF5500',
  website: '#E6E6E6',
  merch: '#E6E6E6',
}

const props = defineProps({
  artist: { type: Object, required: true },
})

const print = computed(() => showcasePrint(props.artist?.slug))
const hero = computed(() => String(props.artist?.heroImage || props.artist?.heroImageMobile || '').trim())
const exploreLabel = computed(() => exploreArtistLabel(props.artist?.name))
const artistName = computed(() => props.artist?.name || 'Artist')
const nameLines = computed(() => splitNameLines(artistName.value))
const nameEl = ref(null)
const nameStyle = useFitLine(nameEl, {
  cssVar: 'name',
  max: () => (nameLines.value.length > 1 ? 0.72 : 1),
}, [artistName])

const printStyle = computed(() => {
  if (print.value.fit === 'rect') return cropImageStyle(print.value.crop)
  return {
    '--cover-position': print.value.position,
    '--cover-position-mobile': print.value.mobilePosition || print.value.position,
  }
})

const fanImage = computed(() => (print.value.fit === 'rect' ? '' : hero.value))

const focal = computed(() => {
  const crop = print.value.avatarCrop
  if (crop?.w && crop?.h) {
    return {
      x: (crop.x + crop.w / 2) * 100,
      y: (crop.y + crop.h / 2) * 100,
    }
  }
  const position = print.value.avatarPosition || print.value.position || ''
  const amounts = String(position).match(/([\d.]+)%/g) || []
  const x = amounts[0] ? Number.parseFloat(amounts[0]) : 50
  const y = amounts.length > 1 ? Number.parseFloat(amounts[amounts.length - 1]) : x
  return {
    x: Number.isFinite(x) ? x : 50,
    y: Number.isFinite(y) ? y : 50,
  }
})

const song = computed(() => props.artist?.featuredSong || null)
const canJoin = computed(() => props.artist?.source === 'live' && Number(props.artist?.id) > 0)
const showFanList = computed(() => props.artist?.fanList?.enabled !== false)

const gallery = computed(() => {
  const resolved = resolvePublicFeaturedGallery(props.artist?.featuredGallery)
  if (!resolved) return null
  const photos = resolved.photos.slice(0, 3).map((photo) => ({
    id: photo.id,
    src: photo.thumbnailUrl || photo.thumbUrl || photo.url || photo.src,
    alt: photo.alt || '',
  })).filter((photo) => photo.src)
  if (!photos.length) return null
  return {
    path: resolved.canonicalPath || '',
    photos,
  }
})

function usableUrl(name, url) {
  const value = String(url || '').trim()
  if (!/^https?:\/\//i.test(value)) return false
  if (name === 'appleMusic') return /\/artist\/[^/]+\/\d+/.test(value)
  if (name === 'youtube' || name === 'youtubeMusic') {
    return /youtube\.com\/(channel\/UC[\w-]{16,}|@[\w.-]{2,}|watch\?|user\/|playlist\?)/i.test(value)
      || /youtu\.be\/[\w-]{6,}/i.test(value)
      || /music\.youtube\.com\/channel\/UC[\w-]{16,}/i.test(value)
  }
  return true
}

function cleanLinks(list) {
  return (Array.isArray(list) ? list : []).filter((link) => usableUrl(link?.name, link?.url))
}

const streaming = computed(() => cleanLinks(props.artist?.streaming))
const social = computed(() => cleanLinks(props.artist?.social))
const extras = computed(() => {
  const rows = []
  const site = props.artist?.website
  if (site?.url && usableUrl('website', site.url)) {
    rows.push({ name: 'website', label: site.label || 'Website', url: site.url })
  }
  if (usableUrl('merch', props.artist?.merchUrl)) {
    rows.push({ name: 'merch', label: 'Merch', url: props.artist.merchUrl })
  }
  return rows
})

function assetFor(name) {
  return ASSET_MAP[name] || ''
}
function iconFor(name) {
  if (ASSET_MAP[name]) return ''
  return ICONIFY_MAP[name] || ''
}
function glyphClass(name) {
  return MONO_ASSETS.has(name) ? 'dest__glyph dest__glyph--mono' : 'dest__glyph'
}
function colorFor(name) {
  return COLOR_MAP[name] || '#E6E6E6'
}

function buildSpotifyEmbed(songValue) {
  const raw = String(songValue?.spotifyUrl || '').trim()
  if (!raw) return null
  let kind = 'track'
  let id = ''
  try {
    const url = new URL(raw)
    const parts = url.pathname.split('/').filter(Boolean)
    const found = parts.findIndex((part) => ['track', 'album', 'playlist', 'artist'].includes(part))
    if (found >= 0 && parts[found + 1]) {
      kind = parts[found]
      id = parts[found + 1]
    }
  } catch {
    return null
  }
  if (!/^[\w]+$/.test(id)) return null
  const src = `https://open.spotify.com/embed/${kind}/${id}`
  const height = kind === 'track' ? 152 : 352
  return {
    url: raw,
    type: kind,
    html: `<iframe src="${src}" width="100%" height="${height}" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe>`,
  }
}

const spotifyEmbed = computed(() => buildSpotifyEmbed(song.value))
</script>

<style scoped>
.spread {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.cover {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  min-width: 0;
}

.rail {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
}

.rail__rule {
  display: block;
  width: 2.75rem;
  height: 3px;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
}

.rail__text {
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  line-height: 1;
  text-transform: uppercase;
}

.print {
  position: relative;
  width: 100%;
  max-height: 18.5rem;
  overflow: hidden;
  background: #050608;
}

.print::after {
  content: '';
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 22%;
  background: linear-gradient(to top, rgba(5, 6, 8, 0.5), transparent);
  pointer-events: none;
}

.print img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--cover-position-mobile, center 22%);
}

.print img.is-rect {
  position: absolute;
  max-width: none;
  object-fit: fill;
}

.identity {
  position: relative;
  z-index: 1;
  margin-top: -1.35rem;
  padding-right: 0.25rem;
}

.name {
  --name: clamp(3.15rem, 12vw, 4.4rem);
  display: flex;
  flex-direction: column;
  width: 100%;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.86;
  text-transform: uppercase;
}

.name__solid {
  display: block;
  color: #f7f9fc;
  text-shadow: 0 8px 28px rgba(0, 0, 0, 0.55);
  white-space: nowrap;
}

.name__echo {
  display: block;
  color: transparent;
  white-space: nowrap;
  -webkit-text-stroke: 1.5px rgba(247, 249, 252, 0.42);
}

.product {
  display: flex;
  flex-direction: column;
  gap: 1.35rem;
  min-width: 0;
}

.eyebrow {
  margin: 0 0 0.65rem;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  line-height: 1;
  text-transform: uppercase;
}

.destinations {
  display: flex;
  flex-direction: column;
}

.dest {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-height: 2.85rem;
  padding-inline: 0.35rem;
  margin-inline: -0.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  color: inherit;
  font-size: 0.98rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.dest:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.04);
}

.dest__mark {
  display: grid;
  place-items: center;
  width: 1.35rem;
  height: 1.35rem;
  flex: 0 0 auto;
}

.icons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.icon-link {
  display: grid;
  place-items: center;
  width: 2.75rem;
  height: 2.75rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #f7f9fc;
  text-decoration: none;
}

.icon-link:hover {
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.04);
}

:deep(.dest__glyph) {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
  object-fit: contain;
}

:deep(.dest__glyph--mono) {
  filter: brightness(0) invert(1);
}

.thumbs {
  display: flex;
  gap: 0.45rem;
}

.thumbs__link {
  display: block;
  width: 5.5rem;
  aspect-ratio: 1;
  overflow: hidden;
  background: #111;
}

.thumbs__link img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fan {
  margin-top: 0.35rem;
  padding-top: 1.15rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.explore {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  align-self: flex-start;
  min-height: 2.75rem;
  color: #f7f9fc;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.explore__bar {
  display: block;
  width: 3.25rem;
  height: 3px;
  background: linear-gradient(90deg, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
}

.dest:focus-visible,
.icon-link:focus-visible,
.explore:focus-visible,
.thumbs__link:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 3px;
}

@media (min-width: 1024px) {
  .spread {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 0.86fr);
    column-gap: clamp(2rem, 4vw, 4.25rem);
    align-items: start;
  }

  .cover {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 1rem;
    align-items: start;
  }

  .rail {
    grid-row: 1 / span 2;
    align-self: stretch;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.85rem;
    height: auto;
    padding-top: 0.35rem;
  }

  .rail__rule {
    width: 3px;
    height: 100%;
    background: linear-gradient(to bottom, #ff4ad8 0%, #c084fc 55%, #67e8f9 100%);
  }

  .rail__text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
  }

  .print {
    max-height: 36rem;
  }

  .print img {
    object-position: var(--cover-position, center 28%);
  }

  .identity {
    grid-column: 2;
    margin-top: -2.1rem;
  }

  .name {
    --name: clamp(4.4rem, 5.6vw, 6.4rem);
  }

  .product {
    padding-top: 0.35rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dest,
  .icon-link,
  .explore {
    transition: none;
  }
}
</style>
