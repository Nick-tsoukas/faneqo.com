<template>
  <article
    class="board"
    :class="{ 'is-feed': format === 'feed' }"
    aria-label="Your entire music world. Faneqo."
  >
    <header class="mast">
      <p class="kicker">One page. One world.</p>
      <h1>
        <span>Your entire</span>
        <span>music world.</span>
      </h1>
      <p class="support">Music, video, links, shows, and fans — all in one artist page.</p>
      <p class="brand">Faneqo</p>
      <p class="site">faneqo.com</p>
    </header>

    <div class="page" inert>
      <div class="hero">
        <img class="hero__photo" :src="heroSrc" alt="" />
        <div class="hero__fade" aria-hidden="true" />
        <p class="hero__genre">{{ genre }}</p>
        <h2 class="hero__name">{{ artistName }}</h2>
      </div>

      <div class="sheet">
        <p class="bio">{{ bio }}</p>

        <section class="block">
          <h3>Featured song</h3>
          <div class="song">
            <img class="song__art" :src="heroSrc" alt="" />
            <div class="song__copy">
              <strong>{{ songTitle }}</strong>
              <span>{{ artistName }}</span>
            </div>
            <div class="song__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v13.72a1 1 0 001.5.86l11-6.86a1 1 0 000-1.72l-11-6.86a1 1 0 00-1.5.86z" />
              </svg>
            </div>
          </div>
        </section>

        <section class="block">
          <h3>Streaming</h3>
          <div class="rows">
            <div v-for="link in streaming" :key="link.name" class="row">
              <img class="row__mark" :src="link.icon" alt="" />
              <span>{{ link.label }}</span>
              <svg class="row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </section>

        <section v-if="social.length" class="block">
          <h3>Social</h3>
          <div class="rows">
            <div v-for="link in social" :key="link.name" class="row">
              <img class="row__mark" :src="link.icon" alt="" />
              <span>{{ link.label }}</span>
              <svg class="row__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </section>

        <section class="list">
          <h3>Fan list</h3>
          <p class="list__title">Stay close to {{ artistName }}</p>
          <p class="list__line">Show updates, new music, and messages from the band.</p>
          <div class="list__row">
            <div class="list__field">Email</div>
            <div class="list__join">Join</div>
          </div>
        </section>

        <div class="actions">
          <div class="act">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 10.5h8M8 14h5m7-2.5a8.5 8.5 0 11-17 0 8.5 8.5 0 0117 0z" />
            </svg>
            <span>Message</span>
          </div>
          <div class="act act--follow">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            <span>Follow</span>
          </div>
          <div class="act">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist.js'
import spotifyIcon from '@/assets/spotify.svg'
import appleIcon from '@/assets/apple.svg'
import youtubeIcon from '@/assets/youtube-icon.svg'
import instagramIcon from '@/assets/instagramfree.png'
import facebookIcon from '@/assets/facebookfree.png'
import tiktokIcon from '@/assets/tiktok.png'

const props = defineProps({
  format: { type: String, default: 'feed' },
})

const ICONS = {
  spotify: spotifyIcon,
  appleMusic: appleIcon,
  youtube: youtubeIcon,
  instagram: instagramIcon,
  facebook: facebookIcon,
  tiktok: tiktokIcon,
}

function withIcons(items) {
  return (items || [])
    .filter((item) => ICONS[item.name])
    .map((item) => ({ name: item.name, label: item.label, icon: ICONS[item.name] }))
}

const artistName = FALLBACK_SNAPSHOT.name
const songTitle = FALLBACK_SNAPSHOT.featuredSong?.title || 'Ghost'
const heroSrc = FALLBACK_SNAPSHOT.heroImage
const genre = String(FALLBACK_SNAPSHOT.genre || '').split(',')[0].trim()
const bio = FALLBACK_SNAPSHOT.bio
const streaming = withIcons(FALLBACK_SNAPSHOT.streaming)
const social = props.format === 'feed' ? [] : withIcons(FALLBACK_SNAPSHOT.social)
</script>

<style scoped>
.board {
  position: relative;
  width: 1080px;
  height: 1920px;
  overflow: hidden;
  background: #050506;
  color: #f7f9fc;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.board.is-feed {
  height: 1350px;
}

.mast {
  position: absolute;
  top: 220px;
  right: 56px;
  left: 56px;
}

.is-feed .mast {
  top: 136px;
  right: 44px;
  left: 44px;
}

.kicker {
  margin: 0 0 10px;
  color: #7ee7ff;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.is-feed .kicker {
  margin-bottom: 8px;
  font-size: 16px;
}

h1 {
  margin: 0;
  font-size: 68px;
  font-weight: 800;
  letter-spacing: -0.055em;
  line-height: 0.88;
  text-transform: uppercase;
}

.is-feed h1 {
  font-size: 58px;
}

h1 span {
  display: block;
}

.support {
  max-width: 860px;
  margin: 12px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.02em;
  line-height: 1.25;
}

.is-feed .support {
  margin-top: 8px;
  font-size: 20px;
}

.brand,
.site {
  margin: 12px 0 0;
  color: rgba(247, 249, 252, 0.72);
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
}

.site {
  margin-top: 4px;
  color: rgba(247, 249, 252, 0.42);
  letter-spacing: 0.16em;
}

.is-feed .brand {
  margin-top: 8px;
}

.page {
  position: absolute;
  top: 500px;
  right: 40px;
  bottom: 300px;
  left: 40px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 32px;
  background: #000;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.is-feed .page {
  top: 380px;
  right: 32px;
  bottom: 36px;
  left: 32px;
  border-radius: 28px;
}

.hero {
  position: relative;
  flex: 1 1 auto;
  min-height: 160px;
  margin: 14px 14px 0;
  overflow: hidden;
  border-radius: 24px;
}

.is-feed .hero {
  margin: 12px 12px 0;
  border-radius: 20px;
}

.hero__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 12%;
}

.hero__fade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.18) 0%, rgba(0, 0, 0, 0) 28%, rgba(0, 0, 0, 0.2) 62%, #000 100%);
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

.is-feed .hero__genre {
  top: 12px;
  left: 12px;
  padding: 6px 10px;
  font-size: 12px;
}

.hero__name {
  position: absolute;
  right: 22px;
  bottom: 14px;
  left: 22px;
  margin: 0;
  font-size: 56px;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.9;
  text-transform: uppercase;
}

.is-feed .hero__name {
  right: 16px;
  bottom: 10px;
  left: 16px;
  font-size: 40px;
}

.sheet {
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  min-height: 0;
  padding: 14px 28px 18px;
}

.is-feed .sheet {
  padding: 12px 18px 16px;
}

.bio {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.62);
  font-size: 20px;
  font-weight: 400;
  letter-spacing: -0.01em;
  line-height: 1.35;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.is-feed .bio {
  font-size: 16px;
  -webkit-line-clamp: 2;
}

.block {
  margin-top: 12px;
}

.is-feed .block {
  margin-top: 12px;
}

.block h3,
.list h3 {
  margin: 0;
  color: rgba(255, 255, 255, 0.38);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.song {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
}

.song__art {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
}

.is-feed .song__art {
  width: 52px;
  height: 52px;
}

.song__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.song__copy strong {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.is-feed .song__copy strong {
  font-size: 20px;
}

.song__copy span {
  color: rgba(255, 255, 255, 0.48);
  font-size: 15px;
  letter-spacing: 0.04em;
}

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

.song__play svg {
  width: 16px;
  height: 16px;
  margin-left: 2px;
}

.rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
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

.is-feed .row {
  min-height: 46px;
  padding: 0 12px;
  border-radius: 14px;
  font-size: 17px;
}

.row__mark {
  width: 26px;
  height: 26px;
  object-fit: contain;
}

.is-feed .row__mark {
  width: 22px;
  height: 22px;
}

.row span {
  flex: 1;
  min-width: 0;
}

.row__chevron {
  width: 18px;
  height: 18px;
  color: rgba(255, 255, 255, 0.28);
}

.list {
  margin-top: 12px;
  padding: 14px 16px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.03);
}

.is-feed .list {
  margin-top: 12px;
  padding: 10px 12px 12px;
}

.list__title {
  margin: 6px 0 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.is-feed .list__title {
  font-size: 18px;
}

.list__line {
  margin: 4px 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 15px;
  line-height: 1.3;
}

.is-feed .list__line {
  font-size: 13px;
}

.list__row {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.list__field,
.list__join {
  display: flex;
  align-items: center;
  min-height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
}

.is-feed .list__field,
.is-feed .list__join {
  min-height: 40px;
  font-size: 14px;
}

.list__field {
  flex: 1;
  padding: 0 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.32);
}

.list__join {
  justify-content: center;
  min-width: 96px;
  background: #eceef2;
  color: #0c0d12;
  font-weight: 700;
}

.actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.is-feed .actions {
  gap: 8px;
  margin-top: 12px;
}

.act {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 78px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  background: #111318;
  color: #f7f9fc;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.is-feed .act {
  min-height: 64px;
  border-radius: 14px;
  font-size: 14px;
}

.act svg {
  width: 22px;
  height: 22px;
}

.act--follow {
  border-color: transparent;
  background: #eceef2;
  color: #0c0d12;
}
</style>
