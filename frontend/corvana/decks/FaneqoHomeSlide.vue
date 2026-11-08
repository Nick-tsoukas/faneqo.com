<template>
  <article ref="root" class="fq-home" aria-labelledby="fq-home-title">
    <div class="fq-stage">
      <!-- Editorial message -->
      <header class="fq-brand">
        <img :src="'/images/deck-slide-03/faneqo-wordmark-on-light.svg'" alt="Faneqo" width="917" height="268">
      </header>

      <div class="fq-story">
        <p class="fq-eyebrow">The artist world, distinct</p>
        <h2 id="fq-home-title" class="fq-title">
          <span>A home</span>
          <span>that <em>feels</em></span>
          <span>like the</span>
          <span>artist.</span>
        </h2>
        <p class="fq-lede">
          Different artists, different worlds. Each page is built from the artist's own photography, music and video.
        </p>
      </div>

      <!-- Three live Faneqo artist pages: same platform, three identities -->
      <div class="fq-pages">
        <section
          v-for="artist in artists"
          :key="artist.slug"
          class="fq-page"
          :class="{ 'fq-page--lead': artist.lead }"
          :aria-label="`${artist.name} on Faneqo`"
        >
          <div class="fq-page__hero">
            <img :src="artist.photo" alt="" :style="{ objectPosition: artist.focus }">
            <span class="fq-page__genre"><span class="fq-genre-full">{{ artist.genre }}</span><span class="fq-genre-short">{{ artist.genre.split(',')[0] }}</span></span>
            <p class="fq-page__name">{{ artist.name }}</p>
          </div>

          <div class="fq-page__body">
            <div class="fq-page__song">
              <img :src="artist.song.art" :alt="`${artist.song.title} artwork`" width="640" height="640">
              <div class="fq-page__song-text">
                <p class="fq-page__song-title">{{ artist.song.title }}</p>
                <p class="fq-page__song-artist">{{ artist.name }}</p>
              </div>
              <span class="fq-page__play" aria-hidden="true">
                <svg viewBox="0 0 20 20"><path d="M7 4.8v10.4a.6.6 0 0 0 .92.5l8.1-5.2a.6.6 0 0 0 0-1L7.92 4.3A.6.6 0 0 0 7 4.8Z" fill="currentColor" /></svg>
              </span>
            </div>

            <p class="fq-page__label">Featured video</p>
            <div class="fq-page__video">
              <div class="fq-page__frame">
                <img :src="artist.video.thumb" :alt="`${artist.video.title} video still`" width="1280" height="720" :style="{ objectPosition: artist.video.focus }">
                <span class="fq-page__video-play" aria-hidden="true">
                  <svg viewBox="0 0 20 20"><path d="M7 4.8v10.4a.6.6 0 0 0 .92.5l8.1-5.2a.6.6 0 0 0 0-1L7.92 4.3A.6.6 0 0 0 7 4.8Z" fill="currentColor" /></svg>
                </span>
              </div>
              <p class="fq-page__video-title">{{ artist.video.title }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive } from './motion/useSceneMotion.js'
// Everything below mirrors each artist's live Faneqo page (faneqo.com/<slug>):
// profile photo, genre, featured song and featured video, with artwork and
// video stills saved locally from those records. Nothing here is invented.
const dir = '/images/deck-slide-03'

const artists = [
  {
    slug: 'badflower',
    name: 'BADFLOWER',
    genre: 'Alternative Rock, Hard Rock',
    photo: `${dir}/badflower-band.png`,
    focus: '42% 16%',
    song: { title: 'Ghost', art: `${dir}/badflower-ghost-cover.jpg` },
    video: { title: 'Ghost', thumb: `${dir}/badflower-ghost-video.jpg`, focus: '50% 0%' },
  },
  {
    slug: 'andydarling',
    name: 'AnDy Darling',
    genre: 'Pop Punk, Alternative Pop, Punk',
    photo: `${dir}/andy-darling.webp`,
    focus: '50% 22%',
    lead: true,
    song: { title: 'KGB Daughter', art: `${dir}/andy-darling-kgb-daughter-cover.jpg` },
    video: { title: 'Cold War Star', thumb: `${dir}/andy-darling-cold-war-star-video.jpg`, focus: '50% 35%' },
  },
  {
    slug: 'fivefingerdeathpunch',
    name: 'Five Finger Death Punch',
    genre: 'Metal',
    photo: '/images/deck-slide-02/ffdp-band-original.jpg',
    focus: '50% 14%',
    song: { title: 'Welcome To The Circus', art: '/images/deck-slide-02/ffdp-afterlife-cover.jpg' },
    video: { title: 'Legacy', thumb: `${dir}/ffdp-legacy-video.jpg`, focus: '50% 100%' },
  },
]

// Same editorial display serif as Slide 2 (presentation headline only).
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap',
    },
  ],
})

// Three identities, introduced one at a time: the lead page rises first, the
// two others arrive from either side on their own timing, then each page's
// music and video settle in.
const root = ref(null)
useSceneMotion(root, (tl, { q, phone }) => {
  const [left, right] = q('.fq-page:not(.fq-page--lead)')
  arrive(tl, q('.fq-brand, .fq-eyebrow'), 0, { y: 8, stagger: 0.1 })
  revealLines(tl, q('.fq-title > span'), 0.15, { stagger: 0.1 })
  arrive(tl, q('.fq-page--lead'), 0.35, { y: 70, duration: 1.1, ease: 'expo.out' })
  arrive(tl, left, 0.7, { x: phone ? 0 : -60, y: 30, duration: 1.0 })
  arrive(tl, right, 0.95, { x: phone ? 0 : 60, y: 30, duration: 1.0, ease: 'expo.out' })
  arrive(tl, q('.fq-page--lead .fq-page__song, .fq-page--lead .fq-page__video'), 1.2, { y: 14, stagger: 0.12 })
  arrive(tl, q('.fq-page:not(.fq-page--lead) .fq-page__song, .fq-page:not(.fq-page--lead) .fq-page__video'), 1.5, { y: 14, stagger: 0.08 })
  arrive(tl, q('.fq-lede'), 1.1, { y: 12 })
})
</script>

<style scoped>
/*
  Desktop is composed on a 1920 × 1080 stage (--u = one design pixel).
  Each artist page is one component drawn at a scale (--k): the lead page at
  full size, the two either side at 0.84, so all three are visibly the same
  product. --p is one pixel of an artist page.
*/
.fq-home {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --paper: #efede8;
  --ink: #16141a;
  --ink-muted: #5f5b63;
  --page: #0c0c0f;
  --page-ink: #f5f3ef;
  --page-muted: rgba(245, 243, 239, 0.6);
  --page-hair: rgba(245, 243, 239, 0.1);
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--paper);
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.fq-home *,
.fq-home *::before,
.fq-home *::after {
  box-sizing: border-box;
}

:where(.fq-home) :where(p, h2) {
  margin: 0;
}

.fq-home img {
  display: block;
}

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

/* ---------- Editorial message ---------- */
.fq-brand {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(108 * var(--u));
}

.fq-brand img {
  width: calc(176 * var(--u));
  height: auto;
}

.fq-story {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(292 * var(--u));
  width: calc(520 * var(--u));
}

.fq-eyebrow {
  display: inline-block;
  padding-bottom: calc(20 * var(--u));
  color: var(--ink-muted);
  font-size: calc(13 * var(--u));
  font-weight: 500;
  letter-spacing: 0.36em;
  line-height: 1;
  text-transform: uppercase;
  background: linear-gradient(90deg, #ec7cc4, #b77cf7 55%, #4fd3e6) left bottom / 100% 1px no-repeat;
}

.fq-title {
  margin-top: calc(46 * var(--u));
  font-family: var(--serif);
  font-size: calc(104 * var(--u));
  font-weight: 400;
  letter-spacing: -0.024em;
  line-height: 0.98;
  color: var(--ink);
}

.fq-title span {
  display: block;
}

.fq-title em {
  font-style: italic;
  letter-spacing: -0.012em;
}

.fq-lede {
  margin-top: calc(46 * var(--u));
  max-width: calc(440 * var(--u));
  color: var(--ink-muted);
  font-size: calc(21 * var(--u));
  line-height: 1.6;
}

/* ---------- The three artist pages ---------- */
.fq-pages {
  position: absolute;
  left: calc(672 * var(--u));
  top: 0;
  width: calc(1140 * var(--u));
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(32 * var(--u));
}

.fq-page {
  --k: 0.84;
  --p: calc(var(--u) * var(--k));
  flex: none;
  width: calc(400 * var(--p));
  overflow: hidden;
  border-radius: calc(24 * var(--p));
  background: var(--page);
  color: var(--page-ink);
  box-shadow: 0 calc(40 * var(--p)) calc(70 * var(--p)) calc(-30 * var(--p)) rgba(22, 20, 26, 0.45);
}

.fq-page--lead {
  --k: 1;
  transform: translateY(calc(-14 * var(--u)));
}

.fq-page__hero {
  position: relative;
  height: calc(440 * var(--p));
}

.fq-page__hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fq-page__hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(12, 12, 15, 0) 46%, rgba(12, 12, 15, 0.55) 74%, var(--page) 100%);
}

.fq-page__genre {
  position: absolute;
  z-index: 1;
  left: calc(20 * var(--p));
  top: calc(20 * var(--p));
  padding: calc(7 * var(--p)) calc(13 * var(--p));
  border-radius: 999px;
  background: rgba(12, 12, 15, 0.42);
  box-shadow: inset 0 0 0 1px rgba(245, 243, 239, 0.18);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  font-size: calc(13 * var(--p));
  font-weight: 600;
  line-height: 1.2;
}

.fq-genre-short { display: none; }

.fq-page__name {
  position: absolute;
  z-index: 1;
  left: calc(24 * var(--p));
  right: calc(24 * var(--p));
  bottom: calc(14 * var(--p));
  font-size: calc(40 * var(--p));
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.02;
  text-wrap: balance;
  text-shadow: 0 calc(2 * var(--p)) calc(20 * var(--p)) rgba(0, 0, 0, 0.45);
}

.fq-page__body {
  padding: calc(16 * var(--p)) calc(20 * var(--p)) calc(22 * var(--p));
}

/* Featured song, as on the live page */
.fq-page__song {
  display: flex;
  align-items: center;
  gap: calc(14 * var(--p));
  padding: calc(12 * var(--p));
  border-radius: calc(16 * var(--p));
  box-shadow: inset 0 0 0 1px var(--page-hair);
}

.fq-page__song > img {
  flex: none;
  width: calc(60 * var(--p));
  height: calc(60 * var(--p));
  border-radius: calc(8 * var(--p));
  object-fit: cover;
}

.fq-page__song-text {
  flex: 1;
  min-width: 0;
}

.fq-page__song-title,
.fq-page__song-artist {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fq-page__song-title {
  font-size: calc(17 * var(--p));
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.25;
}

.fq-page__song-artist {
  margin-top: calc(3 * var(--p));
  color: var(--page-muted);
  font-size: calc(13 * var(--p));
}

.fq-page__play {
  flex: none;
  display: grid;
  place-items: center;
  width: calc(42 * var(--p));
  height: calc(42 * var(--p));
  border-radius: 999px;
  background: var(--page-ink);
  color: var(--page);
}

.fq-page__play svg {
  width: calc(16 * var(--p));
  height: calc(16 * var(--p));
  margin-left: calc(2 * var(--p));
}

/* Featured video */
.fq-page__label {
  margin-top: calc(22 * var(--p));
  color: var(--page-muted);
  font-size: calc(11 * var(--p));
  font-weight: 600;
  letter-spacing: 0.22em;
  line-height: 1;
  text-transform: uppercase;
}

.fq-page__video {
  margin-top: calc(12 * var(--p));
}

.fq-page__frame {
  position: relative;
  overflow: hidden;
  border-radius: calc(14 * var(--p));
  aspect-ratio: 2.2 / 1;
}

.fq-page__frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.fq-page__video-play {
  position: absolute;
  left: 50%;
  top: 50%;
  display: grid;
  place-items: center;
  width: calc(48 * var(--p));
  height: calc(48 * var(--p));
  border-radius: 999px;
  background: rgba(12, 12, 15, 0.45);
  box-shadow: inset 0 0 0 1px rgba(245, 243, 239, 0.35);
  color: var(--page-ink);
  transform: translate(-50%, -50%);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

.fq-page__video-play svg {
  width: calc(18 * var(--p));
  height: calc(18 * var(--p));
  margin-left: calc(2 * var(--p));
}

.fq-page__video-title {
  margin-top: calc(10 * var(--p));
  font-size: calc(15 * var(--p));
  font-weight: 600;
  line-height: 1.2;
}

/* ================================================================
   Phone and portrait: the message, one full artist page, then the
   other two artists as a pair. Vertical scroll only — horizontal
   swipes belong to the deck.
   ================================================================ */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-home {
    --u: 1px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .fq-stage {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 34rem;
    height: auto;
    margin-inline: auto;
    padding: calc(1.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-brand,
  .fq-story,
  .fq-pages {
    position: relative;
    left: auto;
    top: auto;
    width: auto;
    height: auto;
  }

  .fq-brand img { width: 6.75rem; }

  .fq-story { margin-top: 3.25rem; }

  .fq-eyebrow {
    padding-bottom: 0.8rem;
    font-size: 0.6875rem;
    letter-spacing: 0.28em;
  }

  .fq-title {
    margin-top: 1.5rem;
    font-size: clamp(3rem, 15vw, 4.6rem);
    line-height: 0.96;
  }

  .fq-lede {
    margin-top: 1.4rem;
    max-width: 24rem;
    font-size: 1.0625rem;
  }

  .fq-pages {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 2.75rem;
  }

  .fq-page {
    width: auto;
    min-width: 0;
    border-radius: 1.1rem;
    box-shadow: 0 1.25rem 2.5rem -1.5rem rgba(22, 20, 26, 0.5);
  }

  .fq-page--lead {
    --k: 0.88;
    order: -1;
    grid-column: 1 / -1;
    transform: none;
  }

  /* The pair: identity at a glance — photo, genre, name */
  .fq-page:not(.fq-page--lead) .fq-page__hero {
    height: auto;
    aspect-ratio: 3 / 4;
  }

  .fq-page:not(.fq-page--lead) .fq-page__body { display: none; }
  .fq-page:not(.fq-page--lead) .fq-genre-full { display: none; }
  .fq-page:not(.fq-page--lead) .fq-genre-short { display: inline; }

  .fq-page:not(.fq-page--lead) .fq-page__genre {
    left: 0.6rem;
    top: 0.6rem;
    max-width: calc(100% - 1.2rem);
    padding: 0.3rem 0.6rem;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 0.6875rem;
  }

  .fq-page:not(.fq-page--lead) .fq-page__name {
    left: 0.8rem;
    right: 0.8rem;
    bottom: 0.75rem;
    font-size: 1.15rem;
  }
}
</style>
