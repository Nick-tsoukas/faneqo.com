<template>
  <article class="industry-slide" :class="`industry-slide--${scene}`">
    <div class="industry-slide__atmosphere" aria-hidden="true">
      <span class="industry-slide__beam industry-slide__beam--hot"></span>
      <span class="industry-slide__beam industry-slide__beam--cool"></span>
    </div>

    <header class="industry-slide__brand">
      <img src="/faneqo-wordmark.svg" alt="Faneqo" width="190" height="42">
      <span>{{ chapterLabel }}</span>
    </header>

    <div v-if="scene === 'opening'" class="industry-opening">
      <p class="industry-kicker">For artists, managers, and labels</p>
      <h1>The fan relationship platform for music</h1>
      <p class="industry-opening__line">A permanent place for the artist, the show, and the people who came.</p>
      <div class="industry-opening__signal" aria-hidden="true">
        <span>ARTIST</span><i></i><span>FAN</span>
      </div>
    </div>

    <div v-else-if="scene === 'problem'" class="industry-problem">
      <div class="industry-copy industry-copy--wide">
        <p class="industry-kicker">The gap</p>
        <h1>
          <span>The audience is everywhere.</span>
          <span>The relationship is nowhere.</span>
        </h1>
      </div>
      <div class="industry-problem__channels" aria-label="Fragmented fan relationships">
        <div v-for="channel in channels" :key="channel.platform" class="industry-channel">
          <span>{{ channel.platform }}</span>
          <strong>{{ channel.identity }}</strong>
          <small>{{ channel.owner }}</small>
        </div>
      </div>
      <p class="industry-problem__answer">Faneqo keeps that person with the artist.</p>
    </div>

    <div v-else-if="scene === 'artist-world'" class="industry-layout industry-layout--product">
      <div class="industry-copy">
        <p class="industry-kicker">Artist World</p>
        <h1>The artist becomes the destination</h1>
        <p>Music, shows, the fan list, and support live together in one artist-owned experience.</p>
        <ul class="industry-word-list" aria-label="Artist world features">
          <li>Music and video</li>
          <li>Shows and tickets</li>
          <li>Fan list</li>
          <li>Support</li>
        </ul>
      </div>
      <div class="industry-product-shell industry-product-shell--music">
        <IndustryArtistProfile :artist="artist" />
      </div>
    </div>

    <div v-else-if="scene === 'show-mode'" class="industry-layout industry-layout--show">
      <div class="industry-copy">
        <p class="industry-kicker">During the show</p>
        <h1>The room becomes the fan list</h1>
        <p>A scan opens Show Mode. A check-in turns an anonymous concertgoer into a relationship the artist can continue.</p>
      </div>
      <div class="industry-show-pair">
        <div class="industry-product-shell industry-product-shell--show">
          <ProductShowModeScene :artist="artist" />
        </div>
        <div class="industry-checkin-wrap">
          <HomeV2ShowCheckIn :artist-name="artist.name" :fan="fan" />
        </div>
      </div>
    </div>

    <div v-else-if="scene === 'remember'" class="industry-memory">
      <div class="industry-copy industry-copy--memory">
        <p class="industry-kicker">After the encore</p>
        <h1>The night stays alive</h1>
        <p>Check-ins become real people, tied to the city and the show where the relationship began.</p>
      </div>
      <div class="industry-memory__component">
        <HomeV2RoomRemembered
          :copy="afterCopy.remember"
          :fan="fan"
          :neighbors="neighbors"
          :after-count="129"
        />
      </div>
    </div>

    <div v-else-if="scene === 'message'" class="industry-layout industry-layout--message">
      <div class="industry-copy">
        <p class="industry-kicker">The next morning</p>
        <h1>The artist can reach the room again</h1>
        <p>Send the photos. Thank the crowd. Announce the next show. Fans can reply as people, not analytics.</p>
      </div>
      <div class="industry-product-shell industry-product-shell--messenger">
        <HomeV2RoomMessenger :artist-name="artist.name" venue="Nashville" />
      </div>
    </div>

    <div v-else-if="scene === 'passport'" class="industry-layout industry-layout--passport">
      <div class="industry-copy">
        <p class="industry-kicker">Fan Passport</p>
        <h1>The artist can see who came back.</h1>
        <p>This fan was in Nashville, then Chicago, then Nashville again. That history lives in their Passport. BADFLOWER sees a returning person, not another stream.</p>
      </div>
      <div class="industry-passport-frame">
        <FanPassportHome embedded :fixture="passportFixture" />
      </div>
    </div>

    <div v-else-if="scene === 'roster'" class="industry-roster">
      <div class="industry-copy industry-copy--wide">
        <p class="industry-kicker">For managers and labels</p>
        <h1>One account can run an entire roster</h1>
        <p>Every artist keeps a distinct world, fan relationship, and team. Managers move between them without collapsing their identities.</p>
      </div>
      <ul class="industry-roster__grid" aria-label="Example roster">
        <li v-for="member in rosterArtists" :key="member.name" :class="`industry-roster__card industry-roster__card--${member.shape}`">
          <figure>
            <div class="industry-roster__photo">
              <img :src="member.image" :alt="member.name" :style="{ objectPosition: member.focus }">
            </div>
            <figcaption>
              <strong>{{ member.name }}</strong>
              <span>{{ member.role }}</span>
            </figcaption>
          </figure>
        </li>
      </ul>
    </div>

    <div v-else class="industry-close">
      <div class="industry-close__copy">
        <p class="industry-kicker">Faneqo</p>
        <h1>Build the relationship</h1>
        <p>Before the show. In the room. Long after the lights come up.</p>
        <strong>faneqo.com</strong>
      </div>
      <div class="industry-close__qr">
        <div class="industry-close__qr-code">
          <QrcodeVue value="https://faneqo.com" :size="200" level="H" render-as="svg" />
        </div>
        <p>Experience Faneqo</p>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import QrcodeVue from 'qrcode.vue'
import IndustryArtistProfile from './IndustryArtistProfile.vue'
import ProductShowModeScene from '@/components/home-v2/product-theater/scenes/ProductShowModeScene.vue'
import HomeV2ShowCheckIn from '@/components/home-v2/after-show/HomeV2ShowCheckIn.vue'
import HomeV2RoomRemembered from '@/components/home-v2/after-show/HomeV2RoomRemembered.vue'
import HomeV2RoomMessenger from '@/components/home-v2/after-show/HomeV2RoomMessenger.vue'
import FanPassportHome from '@/components/passport/FanPassportHome.vue'
import { FALLBACK_SNAPSHOT } from '~/composables/useHomepageDemoArtist.js'
import {
  AFTER_THE_SHOW_FAN,
  AFTER_THE_SHOW_NEIGHBORS,
  afterTheShowCopy,
} from '~/utils/home-v2/afterTheShow.js'

const props = defineProps({
  scene: { type: String, required: true },
})

const sceneLabels = {
  opening: 'Industry presentation',
  problem: 'The gap',
  'artist-world': 'Artist World',
  'show-mode': 'Show Mode',
  remember: 'The Night',
  message: 'Messaging',
  passport: 'Fan Passport',
  roster: 'Roster management',
  close: 'Faneqo',
}

const chapterLabel = computed(() => sceneLabels[props.scene] || 'Faneqo')
const artist = FALLBACK_SNAPSHOT
const fan = AFTER_THE_SHOW_FAN
const neighbors = AFTER_THE_SHOW_NEIGHBORS
const afterCopy = afterTheShowCopy(artist.name)

const channels = [
  { platform: 'STREAMING', identity: 'Listener', owner: 'You cannot write them' },
  { platform: 'SOCIAL', identity: 'Follower', owner: 'You cannot reach them again' },
  { platform: 'TICKETING', identity: 'Buyer', owner: 'You cannot find them tomorrow' },
]

const rosterArtists = [
  {
    name: 'Leslie Mendelson',
    role: 'Current artist',
    image: '/corvana/deck/leslie-mendelson.png',
    shape: 'portrait',
    focus: 'center 12%',
  },
  {
    name: 'Developing artist',
    role: 'New signing',
    image: '/corvana/deck/developing-artist.png',
    shape: 'portrait',
    focus: 'center 18%',
  },
  {
    name: 'Catalog band',
    role: 'Legacy and touring',
    image: '/corvana/deck/roster-band.png',
    shape: 'landscape',
    focus: 'center 38%',
  },
]

function passportMemory(id, { venue, city, region, date, ordinal, image }) {
  const photo = image || artist.heroImage
  return {
    id,
    attendanceId: id,
    youWereThere: true,
    path: `/fan/passport/nights/${id}`,
    artist: {
      id: 1,
      name: artist.name,
      slug: artist.slug,
      imageUrl: artist.heroImage,
    },
    show: {
      title: venue,
      venue: '',
      city,
      region,
      date,
      nightSlug: null,
    },
    night: {
      publicStory: null,
      lineup: [],
      heroUrl: photo,
      posterUrl: null,
      eventImageUrl: null,
      publicPath: null,
    },
    nightMedia: { hero: photo, poster: null, event: null },
    artwork: { url: photo, source: 'night_hero' },
    galleries: [],
    galleryCount: 0,
    photoCount: 0,
    showOrdinal: ordinal,
    relationship: {
      nightCount: 3,
      cities: ['Nashville', 'Chicago'],
      firstNightDate: '2024-09-01',
      latestNightDate: '2026-10-18',
      showOrdinal: ordinal,
    },
    checkedInAt: `${date}T02:00:00.000Z`,
  }
}

const passportFixture = {
  artistCount: 1,
  memories: [
    passportMemory(103, {
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'TN',
      date: '2026-10-18',
      ordinal: 3,
      image: artist.heroImage,
    }),
    passportMemory(102, {
      venue: 'Metro',
      city: 'Chicago',
      region: 'IL',
      date: '2025-04-18',
      ordinal: 2,
      image: artist.heroImageMobile || artist.heroImage,
    }),
    passportMemory(101, {
      venue: 'The Basement East',
      city: 'Nashville',
      region: 'TN',
      date: '2024-09-01',
      ordinal: 1,
      image: artist.heroImage,
    }),
  ],
}
</script>

<style scoped>
.industry-slide {
  --ink: #f7f9fc;
  --muted: #b4bcc8;
  --surface: #0b0c10;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: clamp(4.6rem, 7vh, 5.8rem) clamp(1.4rem, 4.5vw, 5.5rem) clamp(6.2rem, 11vh, 7.4rem);
  background: #050506;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  word-spacing: normal;
  font-kerning: normal;
  text-rendering: optimizeLegibility;
}

.industry-slide,
.industry-slide :deep(*) {
  word-spacing: normal;
}

.industry-slide *,
.industry-slide *::before,
.industry-slide *::after {
  box-sizing: border-box;
}

.industry-slide__atmosphere,
.industry-slide__beam {
  position: absolute;
  pointer-events: none;
}

.industry-slide__atmosphere { inset: 0; overflow: hidden; }
.industry-slide__beam { border-radius: 999px; filter: blur(110px); opacity: 0.16; }
.industry-slide__beam--hot { width: 34rem; height: 34rem; left: -15rem; top: -14rem; background: #ff4fd8; }
.industry-slide__beam--cool { width: 32rem; height: 32rem; right: -16rem; bottom: -15rem; background: #39d5ff; opacity: 0.1; }

.industry-slide__brand {
  position: absolute;
  z-index: 5;
  top: clamp(1.1rem, 2.4vh, 1.8rem);
  left: clamp(1.4rem, 4vw, 4rem);
  right: clamp(1.4rem, 4vw, 4rem);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.industry-slide__brand img {
  width: clamp(7.2rem, 11vw, 9.5rem);
  height: auto;
}

.industry-slide__brand span {
  color: rgba(247, 249, 252, 0.42);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.industry-kicker {
  margin: 0 0 0.55rem;
  color: #7ee7ff;
  font-size: clamp(0.64rem, 0.85vw, 0.76rem);
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.industry-copy {
  position: relative;
  z-index: 2;
  max-width: 34rem;
}

.industry-copy--wide {
  max-width: 58rem;
}

.industry-copy h1,
.industry-opening h1,
.industry-close h1 {
  margin: 0;
  color: var(--ink);
  font-size: clamp(2rem, 4vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.08;
}

.industry-problem h1 {
  display: grid;
  gap: 0.18em;
  max-width: 22em;
  font-size: clamp(2.15rem, 4.4vw, 3.65rem);
}

.industry-problem h1 span {
  display: block;
}

.industry-copy p:not(.industry-kicker),
.industry-close__copy > p:not(.industry-kicker),
.industry-opening__line,
.industry-problem__answer {
  max-width: 42rem;
  margin: 0.85rem 0 0;
  color: var(--muted);
  font-size: clamp(0.98rem, 1.35vw, 1.2rem);
  line-height: 1.5;
  letter-spacing: 0;
}

.industry-opening,
.industry-problem,
.industry-layout,
.industry-memory,
.industry-roster,
.industry-close {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
}

.industry-opening {
  display: grid;
  align-content: center;
  max-width: 68rem;
}

.industry-opening h1 {
  max-width: 58rem;
  font-size: clamp(2.4rem, 5.4vw, 5rem);
}

.industry-opening__line {
  max-width: 40rem;
  font-size: clamp(1.05rem, 1.7vw, 1.4rem);
}

.industry-opening__signal {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: clamp(1.4rem, 4vh, 2.8rem);
  color: rgba(247, 249, 252, 0.54);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}

.industry-opening__signal i {
  width: clamp(6rem, 16vw, 14rem);
  height: 1px;
  background: linear-gradient(90deg, #ff4fd8, #8b6cff, #39d5ff);
  box-shadow: 0 0 18px rgba(139, 108, 255, 0.45);
}

.industry-problem {
  display: grid;
  align-content: center;
  gap: clamp(1.1rem, 2.8vh, 2rem);
}

.industry-problem__channels {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.industry-channel {
  display: grid;
  gap: 0.4rem;
  padding: clamp(0.85rem, 1.8vw, 1.5rem);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.industry-channel:last-child { border-right: 0; }
.industry-channel span { color: rgba(247, 249, 252, 0.38); font-size: 0.66rem; font-weight: 700; letter-spacing: 0.1em; }
.industry-channel strong { font-size: clamp(1.25rem, 2.1vw, 2rem); letter-spacing: -0.02em; }
.industry-channel small { color: var(--muted); font-size: 0.85rem; }

.industry-problem__answer {
  margin: 0;
  max-width: 50rem;
  color: #f7f9fc;
  font-size: clamp(1.05rem, 1.7vw, 1.35rem);
}

.industry-layout,
.industry-memory {
  display: grid;
  grid-template-columns: minmax(16rem, 0.78fr) minmax(22rem, 1.22fr);
  align-items: center;
  gap: clamp(1.4rem, 3.5vw, 3.5rem);
}

.industry-product-shell {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.2rem;
  background: var(--surface);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
}

/* The phone fills the slide's real remaining height, never a vh guess, so the
   device is always whole between the brand line and the pager. */
.industry-product-shell--music {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  background: transparent;
  box-shadow: none;
}

.industry-layout--product {
  grid-template-columns: minmax(16rem, 1fr) minmax(18rem, 1fr);
  align-items: stretch;
}

.industry-layout--product .industry-copy {
  align-self: center;
}

.industry-product-shell--show {
  height: min(28vh, 18rem);
  padding: 0.8rem;
}

.industry-product-shell--messenger {
  height: min(56vh, 34rem);
  padding: clamp(0.7rem, 1.4vw, 1.1rem);
}

.industry-word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin: 1.2rem 0 0;
  padding: 0;
  list-style: none;
}

.industry-word-list li {
  padding: 0.45rem 0.7rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: rgba(247, 249, 252, 0.72);
  font-size: 0.76rem;
  font-weight: 650;
}

.industry-show-pair {
  display: grid;
  grid-template-columns: 0.82fr 1.18fr;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  min-height: 0;
}

.industry-checkin-wrap {
  min-width: 0;
  transform: scale(0.78);
  transform-origin: center;
}

.industry-checkin-wrap :deep(.ats-check) { width: 100%; }

.industry-memory__component {
  min-width: 0;
  min-height: 0;
  max-height: min(58vh, 34rem);
  overflow: hidden;
}

.industry-memory__component :deep(.ats-rem) { display: block; padding: 0; }
.industry-memory__component :deep(.ats-rem__copy) { display: none; }
.industry-memory__component :deep(.ats-rem__object) { width: 100%; max-width: none; order: initial; }

.industry-passport-frame {
  min-width: 0;
  min-height: 0;
  height: min(66vh, 40rem);
  overflow: hidden;
  padding: 1rem 1.1rem 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: 1.2rem;
  background: #08090c;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.52);
}

.industry-passport-frame :deep(.passport-home__eyebrow) { display: none; }
.industry-passport-frame :deep(.passport-home__hero) { margin-bottom: 0.85rem; max-width: none; }
.industry-passport-frame :deep(.passport-home__hero h1) {
  font-size: clamp(1.25rem, 2vw, 1.7rem);
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.industry-passport-frame :deep(.passport-home__meta) { }
.industry-passport-frame :deep(.chapter) { padding-top: 0.85rem; }
.industry-passport-frame :deep(.chapter__head) { margin-bottom: 0.75rem; align-items: center; }
.industry-passport-frame :deep(.chapter__artist) { display: none; }
.industry-passport-frame :deep(.chapter__nights) { gap: 0.7rem; }
.industry-passport-frame :deep(.night-mem__year) { display: none; }
.industry-passport-frame :deep(.night-mem__body) {
  grid-template-columns: 6.6rem minmax(0, 1fr);
  align-items: center;
  gap: 0.8rem;
}
.industry-passport-frame :deep(.night-mem__title) {
  font-size: 1.12rem;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.industry-passport-frame :deep(.night-mem__kicker),
.industry-passport-frame :deep(.night-mem__ordinal) { }
.industry-passport-frame :deep(.night-mem__visual.is-hero img),
.industry-passport-frame :deep(.night-mem__visual.is-event img) {
  width: 6.6rem;
  height: 6.6rem;
  max-height: none;
  object-fit: cover;
  object-position: center 16%;
  border-radius: 0.7rem;
}
.industry-passport-frame :deep(.awi__circle) {
  width: 3.35rem;
  height: 3.35rem;
}
.industry-passport-frame :deep(.awi__circle img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 12%;
}

.industry-roster {
  display: grid;
  align-content: center;
  gap: clamp(0.9rem, 2vh, 1.4rem);
}

.industry-roster__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.35fr);
  align-items: end;
  gap: 0.9rem;
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 0;
}

.industry-roster__card {
  min-width: 0;
  min-height: 0;
}

.industry-roster__card figure {
  display: grid;
  grid-template-rows: auto auto;
  margin: 0;
}

.industry-roster__photo {
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.1rem;
  background: #14161c;
}

.industry-roster__card--portrait .industry-roster__photo {
  aspect-ratio: 4 / 5;
  max-height: min(42vh, 26rem);
}

.industry-roster__card--landscape .industry-roster__photo {
  aspect-ratio: 4 / 3;
  max-height: min(42vh, 26rem);
}

.industry-roster__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.industry-roster__card figcaption {
  display: grid;
  gap: 0.15rem;
  padding: 0.65rem 0.15rem 0;
}

.industry-roster__card strong {
  color: #f7f9fc;
  font-size: clamp(0.95rem, 1.3vw, 1.15rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.industry-roster__card span {
  color: rgba(247, 249, 252, 0.5);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.industry-close {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: clamp(2rem, 6vw, 6rem);
}

.industry-close__copy { max-width: 50rem; }
.industry-close__copy h1 { font-size: clamp(2.8rem, 6.2vw, 5.6rem); }
.industry-close__copy strong {
  display: block;
  margin-top: 1.4rem;
  font-size: clamp(1.15rem, 1.8vw, 1.5rem);
  letter-spacing: -0.02em;
}

.industry-close__qr {
  display: grid;
  justify-items: center;
  gap: 0.75rem;
}

.industry-close__qr-code {
  padding: 0.85rem;
  border-radius: 1.1rem;
  background: white;
  box-shadow: 0 24px 80px rgba(57, 213, 255, 0.12);
}

.industry-close__qr p {
  margin: 0;
  color: rgba(247, 249, 252, 0.54);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 1100px) {
  .industry-roster__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .industry-slide { overflow-y: auto; }
  .industry-layout,
  .industry-memory,
  .industry-close { grid-template-columns: 1fr; align-content: start; gap: 1.2rem; }
  .industry-copy { max-width: 44rem; }
  .industry-product-shell--music,
  .industry-product-shell--messenger,
  .industry-passport-frame,
  .industry-memory__component { height: 22rem; max-height: 22rem; }
  .industry-show-pair { grid-template-columns: 1fr 1fr; }
  .industry-roster__grid { grid-template-columns: 1fr; }
  .industry-roster__card--portrait .industry-roster__photo,
  .industry-roster__card--landscape .industry-roster__photo { max-height: 22rem; }
  .industry-close__qr { justify-self: start; }
}

@media (max-width: 640px) {
  .industry-slide { padding-inline: 1.1rem; padding-bottom: 7.2rem; }
  .industry-slide__brand span { display: none; }
  .industry-problem__channels { grid-template-columns: 1fr; }
  .industry-channel { border-right: 0; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
  .industry-channel:last-child { border-bottom: 0; }
  .industry-show-pair { grid-template-columns: 1fr; }
  .industry-checkin-wrap { transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .industry-slide *,
  .industry-slide *::before,
  .industry-slide *::after { animation: none !important; transition: none !important; }
}
</style>
