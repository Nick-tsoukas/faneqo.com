<template>
  <div class="excerpt" :class="[`kind-${kind}`, { 'is-compact': compact, 'is-phone': frame === 'phone', 'is-shifting': moving }]" :style="shiftStyle" inert>
    <!-- Artist page: hero, bio, featured song, two link rows, fan list -->
    <template v-if="kind === 'page'">
      <div class="hero">
        <PhotoField class="hero__photo" :media="hero" fade="deep" />
        <p v-if="genre" class="hero__genre">{{ genre }}</p>
        <h3 class="hero__name" :style="frame === 'phone' ? { fontSize: `${phoneNamePx}px` } : { fontSize: `${nameSize}px` }">{{ name }}</h3>
      </div>
      <div class="sheet">
        <p v-if="bio" class="bio">{{ bio }}</p>
        <div v-if="song" class="song">
          <img v-if="songArtSrc" class="song__art" :src="songArtSrc" alt="" />
          <div v-else class="song__art song__art--empty" />
          <div class="song__copy">
            <strong>{{ song.title }}</strong>
            <span>{{ name }}</span>
          </div>
          <div class="song__play"><svg viewBox="0 0 24 24"><path d="M9 6.8v10.4L18.2 12 9 6.8z" /></svg></div>
        </div>
        <div v-if="linkRows.length" class="rows">
          <div v-for="row in linkRows" :key="row.key" class="row">
            <img v-if="row.icon" class="row__mark" :src="row.icon" alt="" />
            <svg v-else class="row__mark row__globe" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.8 3.8 5.8 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-5.8-3.8-9s1.3-6.2 3.8-9z" /></svg>
            <span>{{ row.label }}</span>
            <svg class="row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </div>
        <div v-if="fanList.enabled" class="list">
          <p class="list__title">{{ fanList.headline }}</p>
          <div class="list__row">
            <div class="list__field">Email</div>
            <div class="list__join">{{ fanList.buttonLabel }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Section excerpts sit inside a page sheet with the artist strip so they read as part of the real page -->
    <div v-else class="section">
      <div class="strip">
        <img v-if="heroSrc" class="strip__photo" :src="heroSrc" alt="" />
        <span v-else class="strip__photo strip__photo--empty" aria-hidden="true">{{ initials }}</span>
        <span class="strip__copy">
          <strong>{{ name }}</strong>
          <span>{{ pageUrlLabel }}</span>
        </span>
      </div>

    <!-- Featured song row only -->
    <template v-if="kind === 'song'">
      <div class="block">
        <p class="block__label">Featured song</p>
        <div v-if="song" class="song song--lg">
          <img v-if="songArtSrc" class="song__art" :src="songArtSrc" alt="" />
          <div v-else class="song__art song__art--empty" />
          <div class="song__copy">
            <strong>{{ song.title }}</strong>
            <span>{{ name }}</span>
          </div>
          <div class="song__play song__play--solid"><svg viewBox="0 0 24 24"><path d="M9 6.8v10.4L18.2 12 9 6.8z" /></svg></div>
        </div>
        <p v-else class="block__empty">This artist has not set a featured song.</p>
      </div>
    </template>

    <!-- Fan list card -->
    <template v-else-if="kind === 'fanlist'">
      <div class="list list--lg">
        <p class="block__label">Fan list</p>
        <p class="list__title">{{ fanList.headline }}</p>
        <p v-if="fanList.message" class="list__line">{{ fanList.message }}</p>
        <div class="list__row">
          <div class="list__field">Email</div>
          <div class="list__join">{{ fanList.buttonLabel }}</div>
        </div>
      </div>
    </template>

    <!-- Shows -->
    <template v-else-if="kind === 'shows'">
      <div class="block">
        <p class="block__label">Shows</p>
        <div v-if="shows.length" class="shows">
          <div v-for="show in shows" :key="show.id || show.date" class="show">
            <div class="show__date">
              <strong>{{ dayOf(show.date) }}</strong>
              <span>{{ monthOf(show.date) }}</span>
            </div>
            <div class="show__copy">
              <strong>{{ show.venue || show.title }}</strong>
              <span>{{ [show.city, show.state].filter(Boolean).join(', ') }}</span>
            </div>
            <div class="show__cta">{{ show.ticketLabel || 'Tickets' }}</div>
          </div>
        </div>
        <p v-else class="block__empty">No upcoming shows listed.</p>
      </div>
    </template>

    <!-- Gallery -->
    <template v-else-if="kind === 'gallery'">
      <div class="block">
        <p class="block__label">{{ galleryTitle }}</p>
        <div v-if="galleryPhotos.length" class="gallery" :data-count="galleryPhotos.length">
          <PhotoField v-for="(photo, i) in galleryPhotos" :key="photo.url + i" class="gallery__cell" :media="photo" fade="none" />
        </div>
        <p v-else class="block__empty">No public gallery yet.</p>
      </div>
    </template>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import PhotoField from './PhotoField.vue'
import { studioImageUrl } from '@/features/ads/studio/mediaUrl.js'
import { isPlaceholderText, showcaseLinkKeys, SHOWCASE_LINK_ORDER } from '@/features/ads/studio/artistSnapshot.js'
import spotifyIcon from '@/assets/spotify.svg'
import appleIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import instagramIcon from '@/assets/instagramfree.png'
import facebookIcon from '@/assets/facebookfree.png'
import tiktokIcon from '@/assets/tiktok.png'

/**
 * Inert, faithful excerpts of what a Faneqo artist page actually shows.
 * Static markup only: no audio, no anchors, no live components, no analytics.
 */
const props = defineProps({
  kind: { type: String, default: 'page' }, // page | song | fanlist | shows | gallery
  snapshot: { type: Object, default: null },
  photo: { type: Object, default: null },
  songArt: { type: Object, default: null },
  compact: { type: Boolean, default: false },
  maxLinks: { type: Number, default: 3 },
  /** Explicit keys from the editor. Null uses the priority order. */
  linkKeys: { type: Array, default: null },
  /** `phone` lays the artist page out for a narrow device screen. */
  frame: { type: String, default: '' },
  /** Story film only. Off leaves the excerpt's layout untouched. */
  moving: { type: Boolean, default: false },
  /** Pixels to lift the page inside the phone. */
  shift: { type: Number, default: 0 },
  /** Pixels of extra photograph drift. */
  drift: { type: Number, default: 0 },
})

const ICONS = {
  spotify: { icon: spotifyIcon, label: 'Spotify' },
  appleMusic: { icon: appleIcon, label: 'Apple Music' },
  youtube: { icon: youtubeIcon, label: 'YouTube' },
  instagram: { icon: instagramIcon, label: 'Instagram' },
  facebook: { icon: facebookIcon, label: 'Facebook' },
  tiktok: { icon: tiktokIcon, label: 'TikTok' },
}

const LABELS = Object.fromEntries(SHOWCASE_LINK_ORDER)
const snap = computed(() => props.snapshot || {})
const name = computed(() => snap.value.name || 'Your artist page')
const genre = computed(() => snap.value.genre || '')
const bio = computed(() => (isPlaceholderText(snap.value.bio, 'bio') ? '' : (snap.value.bio || '')))
const hero = computed(() => props.photo || snap.value.hero || null)
const heroSrc = computed(() => studioImageUrl(hero.value?.url))
const initials = computed(() => name.value.split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase())
const pageUrlLabel = computed(() => (snap.value.slug ? `faneqo.com/${snap.value.slug}` : 'faneqo.com/your-name'))
const song = computed(() => {
  const row = snap.value.song
  if (!row || isPlaceholderText(row.title, 'song')) return null
  return row
})
const songArtSrc = computed(() => studioImageUrl((props.songArt || song.value?.art)?.url))
const nameSize = computed(() => {
  const n = name.value.length
  return n <= 10 ? 52 : n <= 16 ? 44 : n <= 24 ? 36 : 28
})
/* Phone screens are narrow. Size the name so a long band still fits one line. */
const phoneNamePx = computed(() => {
  const n = Math.max(String(name.value || '').trim().length, 1)
  return Math.max(30, Math.min(62, Math.floor(430 / (n * 0.62))))
})
const shiftStyle = computed(() => (props.moving ? {
  '--shift': `${-Number(props.shift) || 0}px`,
  '--drift': `${-Number(props.drift) || 0}px`,
} : null))
const linkRows = computed(() => showcaseLinkKeys(snap.value, props.linkKeys, props.maxLinks).map((key) => ({
  key,
  icon: ICONS[key]?.icon || null,
  label: ICONS[key]?.label || LABELS[key] || key,
})))
const fanList = computed(() => ({
  enabled: snap.value.fanList?.enabled !== false,
  headline: snap.value.fanList?.headline || 'Join the fan list',
  message: snap.value.fanList?.message || '',
  buttonLabel: snap.value.fanList?.buttonLabel || 'Join',
}))
const shows = computed(() => {
  const upcoming = snap.value.upcomingShows || []
  const list = upcoming.length ? upcoming : (snap.value.shows || [])
  return list.slice(0, props.compact ? 2 : 3)
})
const galleryPhotos = computed(() => {
  // Prefer the first gallery; top up from the others, then from page photos, so the strip reads as a gallery.
  const fromGalleries = (snap.value.galleries || []).flatMap((g) => g.photos || [])
  const pool = fromGalleries.length ? fromGalleries : (snap.value.photos || []).slice(1)
  const seen = new Set()
  return pool.filter((p) => p?.url && !seen.has(p.url) && seen.add(p.url)).slice(0, 3)
})
const galleryTitle = computed(() => (snap.value.galleries || [])[0]?.title || 'Gallery')

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function dayOf(date) {
  const m = String(date || '').match(/^\d{4}-(\d{2})-(\d{2})/)
  return m ? String(Number(m[2])) : ''
}
function monthOf(date) {
  const m = String(date || '').match(/^\d{4}-(\d{2})-(\d{2})/)
  return m ? MONTHS[Number(m[1]) - 1] || '' : ''
}
</script>

<style scoped>
.excerpt {
  width: 100%;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.excerpt.is-shifting .sheet {
  position: relative;
  z-index: 2;
  background: #070708;
  transform: translate3d(0, var(--shift, 0px), 0);
}

.excerpt.is-shifting .hero__photo {
  transform: translate3d(0, var(--drift, 0px), 0) scale(1.03);
}

.kind-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-radius: 32px;
  background: #000;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

/* Phone frame: the device supplies the radius and shadow. The page is a tall mobile column. */
.is-phone.kind-page {
  height: auto;
  border-radius: 0;
  background: #070708;
  box-shadow: none;
}

.is-phone .hero {
  flex: none;
  height: var(--phone-hero, 440px);
  min-height: 0;
  margin: 0;
  border-radius: 0;
}

.is-phone .hero__genre { display: none; }

.is-phone .hero__name {
  right: 24px;
  bottom: 20px;
  left: 24px;
  line-height: 0.88;
}

.is-phone .sheet {
  gap: 16px;
  padding: 20px 20px 32px;
}

.is-phone .bio {
  font-size: 24px;
  line-height: 1.3;
  -webkit-line-clamp: 2;
}

.is-phone .song {
  gap: 16px;
  padding: 12px 14px;
  border-radius: 20px;
}

.is-phone .song__art { width: 80px; height: 80px; border-radius: 14px; }
.is-phone .song__copy strong {
  display: -webkit-box;
  overflow: hidden;
  font-size: 28px;
  white-space: normal;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.is-phone .list { display: none; }
.is-phone.is-shifting .list { display: block; margin-top: 64px; }
.is-phone .song__copy span { font-size: 18px; }
.is-phone .song__play { width: 48px; height: 48px; }
.is-phone .song__play svg { width: 20px; height: 20px; }

.is-phone .row {
  min-height: 64px;
  padding: 0 16px;
  border-radius: 18px;
  font-size: 28px;
}

.is-phone .row__mark { width: 32px; height: 32px; }
.is-phone .row__chevron { width: 20px; height: 20px; }

.is-phone .list { margin-top: 2px; padding: 16px; border-radius: 20px; }
.is-phone .list__title { font-size: 26px; }
.is-phone .list__field,
.is-phone .list__join { min-height: 52px; font-size: 18px; }

/* Section excerpts: one sheet from the page, with the artist strip on top */
.section {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px 28px 30px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 32px;
  background: #000;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.strip {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.strip__photo {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #15161b;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  font-weight: 700;
  object-fit: cover;
}

.strip__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.strip__copy strong {
  overflow: hidden;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.03em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.strip__copy span {
  color: rgba(255, 255, 255, 0.42);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.hero {
  position: relative;
  flex: 1 1 auto;
  min-height: 220px;
  margin: 14px 14px 0;
  overflow: hidden;
  border-radius: 24px;
}

.hero__photo {
  position: absolute;
  inset: 0;
}

.hero__genre {
  position: absolute;
  top: 16px;
  left: 16px;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.45);
  color: rgba(255, 255, 255, 0.82);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero__name {
  position: absolute;
  right: 22px;
  bottom: 14px;
  left: 22px;
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-transform: uppercase;
}

.sheet {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 12px;
  padding: 14px 28px 20px;
}

.is-compact .sheet { gap: 10px; padding: 12px 20px 16px; }

.bio {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.62);
  font-size: 19px;
  line-height: 1.35;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block__label {
  margin: 0 0 10px;
  color: rgba(255, 255, 255, 0.38);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.block__empty {
  margin: 0;
  padding: 24px;
  border: 1px dashed rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  color: rgba(255, 255, 255, 0.45);
  font-size: 20px;
}

.song {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.song--lg { gap: 20px; padding: 16px 20px; border-radius: 22px; }

.song__art {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
}

.song--lg .song__art { width: 96px; height: 96px; border-radius: 12px; }

.song__art--empty {
  background: linear-gradient(135deg, #1c1d22, #0b0b0e);
}

.song__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.song__copy strong {
  overflow: hidden;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.song--lg .song__copy strong { font-size: 30px; }

.song__copy span {
  color: rgba(255, 255, 255, 0.48);
  font-size: 15px;
  letter-spacing: 0.04em;
}

.song--lg .song__copy span { font-size: 17px; }

.song__play {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  color: #f7f9fc;
}

.song__play--solid {
  width: 64px;
  height: 64px;
  border: 0;
  background: #f4f6f8;
  color: #050506;
}

.song__play svg { width: 18px; height: 18px; margin-left: 2px; fill: currentColor; }
.song__play--solid svg { width: 26px; height: 26px; }

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.row {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 50px;
  padding: 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.035);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.row__mark { width: 26px; height: 26px; object-fit: contain; }
.row__globe { color: rgba(247, 249, 252, 0.82); }
.row span { flex: 1; min-width: 0; }
.row__chevron { width: 18px; height: 18px; color: rgba(255, 255, 255, 0.28); }

.list {
  padding: 14px 16px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
}

.list--lg { padding: 0; border: 0; background: transparent; }

.list__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.list--lg .list__title { margin-top: 4px; font-size: 34px; }

.list__line {
  margin: 8px 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 19px;
  line-height: 1.35;
}

.list__row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.list--lg .list__row { gap: 10px; margin-top: 20px; }

.list__field,
.list__join {
  display: flex;
  align-items: center;
  min-height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.list--lg .list__field,
.list--lg .list__join { min-height: 64px; border-radius: 16px; font-size: 20px; }

.list__field {
  flex: 1;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.32);
}

.list__join {
  justify-content: center;
  min-width: 96px;
  padding: 0 18px;
  background: #eceef2;
  color: #0c0d12;
  font-weight: 700;
  white-space: nowrap;
}

.shows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.show {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.035);
}

.show__date {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
  padding: 8px 0;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.06);
}

.show__date strong { font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.show__date span { margin-top: 4px; color: rgba(255, 255, 255, 0.5); font-size: 13px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }

.show__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.show__copy strong { overflow: hidden; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; text-overflow: ellipsis; white-space: nowrap; }
.show__copy span { color: rgba(255, 255, 255, 0.5); font-size: 16px; }

.show__cta {
  flex: 0 0 auto;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  font-size: 15px;
  font-weight: 700;
  text-transform: capitalize;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.gallery[data-count='1'] { grid-template-columns: 1fr; }
.gallery[data-count='2'] { grid-template-columns: repeat(2, minmax(0, 1fr)); }

.gallery__cell {
  aspect-ratio: 1 / 1;
  border-radius: 18px;
}

.gallery[data-count='1'] .gallery__cell { aspect-ratio: 16 / 9; }
.gallery[data-count='2'] .gallery__cell { aspect-ratio: 4 / 3; }
</style>
