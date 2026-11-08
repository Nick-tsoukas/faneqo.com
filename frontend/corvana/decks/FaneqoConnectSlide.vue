<template>
  <article ref="root" class="fq-connect" aria-labelledby="fq-connect-title">
    <div class="fq-stage">
      <!-- The band portrait: the one dominant image -->
      <div class="fq-portrait" aria-hidden="true">
        <img :src="bandPortrait" alt="" width="1242" height="1233" fetchpriority="high">
      </div>

      <!-- Editorial message -->
      <header class="fq-brand">
        <img src="/faneqo-wordmark-editorial.png?v=2" alt="Faneqo" width="3398" height="901">
      </header>

      <div class="fq-story">
        <p class="fq-eyebrow">The artist world, connected</p>
        <h2 id="fq-connect-title" class="fq-title">
          <span>Connect the</span>
          <span>moments</span>
          <em>that matter.</em>
        </h2>
        <p class="fq-lede">
          From music and shows to galleries and fan connection, Faneqo brings the artist's world together in one place.
        </p>
      </div>

      <!-- The artist world: identity, music and gallery on one grid -->
      <div class="fq-world" aria-label="Five Finger Death Punch's artist page on Faneqo">
        <div class="fq-identity">
          <p class="fq-kicker">Artist page</p>
          <p class="fq-name"><span>Five Finger</span> <span>Death Punch</span></p>
        </div>

        <section class="fq-song" aria-label="Featured song">
          <img class="fq-song__art" :src="songArt" alt="Album artwork" width="640" height="640">
          <div class="fq-song__text">
            <p class="fq-song__title">Welcome to the Circus</p>
            <p class="fq-song__artist">Five Finger Death Punch</p>
          </div>
          <span class="fq-song__play" aria-hidden="true">
            <svg viewBox="0 0 20 20"><path d="M7 4.8v10.4a.6.6 0 0 0 .92.5l8.1-5.2a.6.6 0 0 0 0-1L7.92 4.3A.6.6 0 0 0 7 4.8Z" fill="currentColor" /></svg>
          </span>
        </section>

        <section class="fq-gallery" aria-labelledby="fq-gallery-label">
          <p id="fq-gallery-label" class="fq-kicker">Gallery</p>
          <div class="fq-gallery__frames">
            <img
              v-for="photo in gallery"
              :key="photo.src"
              :src="photo.src"
              :alt="photo.alt"
              :width="photo.width"
              :height="photo.height"
              :style="{ objectPosition: photo.focus }"
            >
          </div>
        </section>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'
// Supplied, unaltered Five Finger Death Punch photographs. Bound as strings so
// the dev server serves them straight from /public instead of rewriting them
// into asset imports (which broke one URL during hot reload).
const photos = '/images/deck-slide-02'

// The artwork Five Finger Death Punch's live Faneqo page stores for this track
// (Spotify oEmbed thumbnail, i.scdn.co/image/ab67616d0000b2732876e0647769b340d08d9b99),
// saved locally at 640px so the slide works offline.
const songArt = `${photos}/ffdp-afterlife-cover.jpg`
const bandPortrait = `${photos}/ffdp-band-original.jpg`

// Colour, live action, then a portrait: three different moments, one per member.
const gallery = [
  { src: `${photos}/ffdp-singer-stage-color.jpg`, alt: "Five Finger Death Punch's singer on stage", width: 1000, height: 667, focus: '44% 22%' },
  { src: `${photos}/ffdp-guitarist-stage-bw.jpg`, alt: "Five Finger Death Punch's guitarist playing live", width: 1000, height: 614, focus: '52% 30%' },
  { src: `${photos}/ffdp-bassist-portrait-bw.jpg`, alt: "Five Finger Death Punch's bassist on stage", width: 667, height: 1000, focus: '50% 11%' },
]

// Editorial display serif for the presentation headline only. Product UI stays Poppins.
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

// The page assembles: the band first, then the words, then music and gallery
// join it as one destination.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  settle(tl, q('.fq-portrait img'), 0, { duration: 2.2 })
  arrive(tl, q('.fq-brand, .fq-eyebrow'), 0.3, { y: 8, stagger: 0.1 })
  revealLines(tl, q('.fq-title span, .fq-title em'), 0.45)
  arrive(tl, q('.fq-identity'), 1.0, { y: 22 })
  arrive(tl, q('.fq-song'), 1.35, { y: 24 })
  arrive(tl, q('.fq-gallery .fq-kicker'), 1.7, { y: 8 })
  arrive(tl, q('.fq-gallery__frames img'), 1.75, { y: 28, stagger: 0.12, duration: 0.8 })
  arrive(tl, q('.fq-lede'), 1.5, { y: 12 })
})
</script>

<style scoped>
/*
  Desktop is composed on a 1920 × 1080 stage. --u is one design pixel, scaled
  to the largest 16:9 box that fits the slide, so the composition never reflows
  on a projector or laptop. Phones get their own vertical layout below.

  Grid: the editorial column starts at x 128; the artist world occupies
  x 740–1808, and the name, song and gallery all share that left edge and width.
*/
.fq-connect {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --ink: #f5f2ec;
  --muted: rgba(245, 242, 236, 0.62);
  --quiet: rgba(245, 242, 236, 0.46);
  --hair: rgba(245, 242, 236, 0.09);
  --ivory: #f4f1ea;
  --world-x: calc(740 * var(--u));
  --world-w: calc(1068 * var(--u));
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #050506;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}

.fq-connect *,
.fq-connect *::before,
.fq-connect *::after {
  box-sizing: border-box;
}

:where(.fq-connect) :where(p, h2) {
  margin: 0;
}

.fq-connect img {
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

/* ---------- Band portrait ---------- */
.fq-portrait {
  position: absolute;
  top: 0;
  right: 0;
  width: calc(1180 * var(--u));
  height: calc(720 * var(--u));
}

.fq-portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 15%;
  filter: brightness(0.86) contrast(1.04);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 7%, #000 15%),
    linear-gradient(180deg, #000 0%, #000 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 7%, #000 15%),
    linear-gradient(180deg, #000 0%, #000 60%, rgba(0, 0, 0, 0.5) 82%, transparent 100%);
  mask-composite: intersect;
}

/* ---------- Editorial message ---------- */
.fq-brand {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(108 * var(--u));
}

.fq-brand img {
  width: calc(172 * var(--u));
  height: auto;
}

.fq-story {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(298 * var(--u));
  width: calc(600 * var(--u));
}

.fq-eyebrow {
  display: inline-block;
  padding-bottom: calc(20 * var(--u));
  color: rgba(245, 242, 236, 0.74);
  font-size: calc(13 * var(--u));
  font-weight: 500;
  letter-spacing: 0.36em;
  line-height: 1;
  text-transform: uppercase;
  background: linear-gradient(90deg, rgba(244, 114, 182, 0.75), rgba(185, 166, 255, 0.6) 55%, rgba(103, 232, 249, 0.5)) left bottom / 100% 1px no-repeat;
}

.fq-title {
  margin-top: calc(48 * var(--u));
  font-family: var(--serif);
  font-size: calc(106 * var(--u));
  font-weight: 400;
  letter-spacing: -0.024em;
  line-height: 0.96;
  color: #fbf9f5;
}

.fq-title span,
.fq-title em {
  display: block;
}

.fq-title em {
  font-style: italic;
  letter-spacing: -0.014em;
}

.fq-lede {
  margin-top: calc(50 * var(--u));
  max-width: calc(480 * var(--u));
  color: var(--muted);
  font-size: calc(21 * var(--u));
  line-height: 1.62;
}

/* ---------- The artist world ---------- */
.fq-world {
  position: absolute;
  left: var(--world-x);
  top: calc(470 * var(--u));
  width: var(--world-w);
}

.fq-kicker {
  color: var(--quiet);
  font-size: calc(12 * var(--u));
  font-weight: 500;
  letter-spacing: 0.26em;
  line-height: 1;
  text-transform: uppercase;
}

.fq-name {
  margin-top: calc(14 * var(--u));
  font-size: calc(58 * var(--u));
  font-weight: 700;
  letter-spacing: -0.012em;
  line-height: 1;
  text-transform: uppercase;
  text-shadow: 0 calc(2 * var(--u)) calc(30 * var(--u)) rgba(0, 0, 0, 0.5);
}

/* Featured song: a listening bar */
.fq-song {
  display: flex;
  align-items: center;
  gap: calc(24 * var(--u));
  margin-top: calc(30 * var(--u));
  padding: calc(14 * var(--u)) calc(18 * var(--u)) calc(14 * var(--u)) calc(14 * var(--u));
  border-radius: calc(14 * var(--u));
  background: rgba(245, 242, 236, 0.045);
  box-shadow: inset 0 0 0 1px var(--hair);
  -webkit-backdrop-filter: blur(18px);
  backdrop-filter: blur(18px);
}

.fq-song__art {
  flex: none;
  width: calc(76 * var(--u));
  height: calc(76 * var(--u));
  border-radius: calc(8 * var(--u));
  object-fit: cover;
}

.fq-song__text {
  flex: 1;
  min-width: 0;
}

.fq-song__title {
  font-size: calc(22 * var(--u));
  font-weight: 600;
  letter-spacing: -0.018em;
  line-height: 1.2;
}

.fq-song__artist {
  margin-top: calc(5 * var(--u));
  color: var(--muted);
  font-size: calc(15 * var(--u));
}

.fq-song__play {
  flex: none;
  display: grid;
  place-items: center;
  width: calc(58 * var(--u));
  height: calc(58 * var(--u));
  border-radius: 999px;
  background: var(--ivory);
  color: #111216;
}

.fq-song__play svg {
  width: calc(21 * var(--u));
  height: calc(21 * var(--u));
  margin-left: calc(3 * var(--u));
}

/* Gallery: photographs on the same grid, no box */
.fq-gallery {
  margin-top: calc(28 * var(--u));
}

.fq-gallery__frames {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: calc(14 * var(--u));
  margin-top: calc(14 * var(--u));
}

.fq-gallery__frames img {
  width: 100%;
  aspect-ratio: 3 / 2;
  object-fit: cover;
  border-radius: calc(14 * var(--u));
  background: #111114;
  /* The same hairline as the song bar, drawn over the photo's edge */
  outline: 1px solid var(--hair);
  outline-offset: -1px;
}

/* ================================================================
   Phone and portrait: headline, band, song, gallery — composed, not shrunk.
   ================================================================ */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-connect {
    --u: 1px;
    overflow-x: hidden;
    overflow-y: auto;
  }

  .fq-stage {
    position: relative;
    left: auto;
    top: auto;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 34rem;
    height: auto;
    margin-inline: auto;
    padding: calc(1.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-brand,
  .fq-story,
  .fq-portrait,
  .fq-world {
    position: relative;
    left: auto;
    top: auto;
    right: auto;
    width: auto;
  }

  .fq-brand { order: 1; }
  .fq-story { order: 2; }
  .fq-portrait { order: 3; }
  .fq-world { order: 4; }

  .fq-brand img { width: 6.5rem; }

  .fq-story { margin-top: 3.25rem; }

  .fq-eyebrow {
    padding-bottom: 0.8rem;
    font-size: 0.6875rem;
    letter-spacing: 0.28em;
  }

  .fq-title {
    margin-top: 1.5rem;
    font-size: clamp(3rem, 15vw, 4.6rem);
    line-height: 0.95;
  }

  .fq-lede {
    margin-top: 1.4rem;
    max-width: 24rem;
    font-size: 1.0625rem;
  }

  /* The band runs edge to edge on a phone */
  .fq-portrait {
    height: auto;
    aspect-ratio: 1 / 1;
    margin: 2.75rem -1.25rem 0;
  }

  .fq-portrait img {
    object-position: 50% 10%;
    -webkit-mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
    mask-image: linear-gradient(180deg, #000 70%, transparent 100%);
  }

  .fq-world { margin-top: -2.5rem; }

  .fq-kicker { font-size: 0.6875rem; letter-spacing: 0.24em; }
  .fq-name { margin-top: 0.6rem; font-size: clamp(1.9rem, 9.4vw, 2.6rem); line-height: 1.02; }
  .fq-name span { display: block; }

  .fq-song {
    gap: 0.9rem;
    margin-top: 1.5rem;
    padding: 0.7rem 0.9rem 0.7rem 0.7rem;
    border-radius: 1rem;
  }

  .fq-song__art { width: 4rem; height: 4rem; border-radius: 0.5rem; }
  .fq-song__title { font-size: 1.0625rem; }
  .fq-song__artist { margin-top: 0.2rem; font-size: 0.8125rem; }
  .fq-song__play { width: 3rem; height: 3rem; }
  .fq-song__play svg { width: 1.1rem; height: 1.1rem; margin-left: 2px; }

  .fq-gallery { margin-top: 2rem; }

  /* One lead photograph, then a pair — never three postage stamps */
  .fq-gallery__frames {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-top: 0.85rem;
  }

  .fq-gallery__frames img { border-radius: 0.75rem; aspect-ratio: 4 / 5; }
  .fq-gallery__frames img:first-child { grid-column: 1 / -1; aspect-ratio: 3 / 2; }
}
</style>
