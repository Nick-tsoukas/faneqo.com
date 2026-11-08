<template>
  <article ref="root" class="fq-night" aria-labelledby="fq-night-title">
    <div class="fq-stage">
      <h2 id="fq-night-title" class="fq-night__title">
        <span>Give the night</span>
        <em>somewhere to live.</em>
      </h2>

      <!-- The print on the wall: one photograph from the band's real gallery -->
      <figure class="fq-night__print">
        <img
          :src="`${dir}/13.jpg`"
          alt="Two Five Finger Death Punch guitarists playing side by side, in black and white"
          width="1000"
          height="572"
        >
        <figcaption>
          <b>Five Finger Death Punch</b>
          <span>Gallery · 15 photographs on the artist’s Faneqo page</span>
        </figcaption>
      </figure>

      <!-- The keepsake: the same night, kept in one fan's Passport (FanPassportHome + NightMemory) -->
      <section class="fq-pass" aria-label="An example fan's Passport">
        <nav class="fq-pass__nav" aria-hidden="true">
          <span>Artists</span><span>Messages</span><span class="is-on">Passport</span>
        </nav>

        <p class="fq-pass__eyebrow">Passport</p>
        <p class="fq-pass__hero">Your nights stay with you.</p>
        <p class="fq-pass__meta">2 Nights · 2 Artists</p>

        <div class="fq-pass__night">
          <p class="fq-pass__name">Five Finger Death Punch</p>
          <p class="fq-pass__ordinal">Your first Five Finger Death Punch night</p>

          <div class="fq-pass__stack" aria-hidden="true">
            <img
              v-for="(photo, i) in stack"
              :key="photo.src"
              :src="photo.src"
              :style="{ '--i': i, objectPosition: photo.focus }"
              alt=""
              width="667"
              height="1000"
            >
          </div>
          <p class="fq-pass__count">15 photos</p>
        </div>

        <div class="fq-pass__night fq-pass__night--earlier" aria-hidden="true">
          <p class="fq-pass__name">Badflower</p>
          <p class="fq-pass__ordinal">Your first Badflower night</p>
        </div>
      </section>

      <p class="fq-night__how">
        <span class="fq-night__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span>
          <b>Check in at the show, and the Night is kept.</b>
          It lands in the fan’s Passport with the artist’s photos from that night. Fans can also save any gallery.
        </span>
      </p>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'
// All photographs from the band's own Faneqo gallery (faneqo.com/fivefingerdeathpunch/gallery).
// Passport copy follows components/passport/* and utils/passport/passportPresentation.js;
// the fan and their two Nights are an example.
const dir = '/images/deck-flagship/ffdp-gallery'
const stack = [
  { src: `${dir}/09.jpg`, focus: '50% 45%' },
  { src: `${dir}/07.jpg`, focus: '50% 30%' },
  { src: `${dir}/01.jpg`, focus: '50% 22%' },
]

// The night becomes a keepsake: the print establishes the moment, then the
// Passport opens and the same night's photos are laid into it, one by one.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  settle(tl, q('.fq-night__print img'), 0, { duration: 2.2 })
  revealLines(tl, q('.fq-night__title span, .fq-night__title em'), 0.25)
  arrive(tl, q('.fq-night__print figcaption'), 1.0, { y: 8 })

  arrive(tl, q('.fq-pass'), 1.2, { y: 30, duration: 0.9, ease: 'expo.out' })
  arrive(tl, q('.fq-pass__nav, .fq-pass__eyebrow, .fq-pass__hero, .fq-pass__meta'), 1.45, { y: 10, stagger: 0.08, duration: 0.6 })
  arrive(tl, q('.fq-pass__night:not(.fq-pass__night--earlier) .fq-pass__name, .fq-pass__night:not(.fq-pass__night--earlier) .fq-pass__ordinal'), 2.0, { y: 10, stagger: 0.1 })
  tl.from(q('.fq-pass__stack img'), { autoAlpha: 0, y: 46, duration: 0.75, ease: 'expo.out', stagger: 0.18, clearProps: 'transform' }, 2.35)
  arrive(tl, q('.fq-pass__count'), 3.0, { y: 6 })
  arrive(tl, q('.fq-pass__night--earlier'), 3.2, { y: 10, clearProps: 'transform,opacity,visibility' })
  arrive(tl, q('.fq-night__how'), 3.45, { y: 10 })
})
</script>

<style scoped>
/* 1920 × 1080 stage, 96px margins. Left: title over one large print. Right: the Passport. */
.fq-night {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --ink: #f2eee8;
  --muted: rgba(242, 238, 232, 0.58);
  --pass: #f7f9fc;
  --cyan: #7ee7ff;
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0e0d0c;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fq-night *, .fq-night *::before, .fq-night *::after { box-sizing: border-box; }
:where(.fq-night) :where(p, h2, figure) { margin: 0; }
.fq-night img, .fq-night svg { display: block; }

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-night__title {
  position: absolute;
  left: calc(96 * var(--u));
  top: calc(96 * var(--u));
  font-family: var(--serif);
  font-size: calc(96 * var(--u));
  font-weight: 400;
  letter-spacing: -0.022em;
  line-height: 0.98;
}

.fq-night__title span,
.fq-night__title em { display: block; }
.fq-night__title em { font-style: italic; color: rgba(242, 238, 232, 0.82); }

/* The print */
.fq-night__print {
  position: absolute;
  left: calc(96 * var(--u));
  top: calc(320 * var(--u));
  width: calc(1000 * var(--u));
}

.fq-night__print img {
  width: 100%;
  height: calc(572 * var(--u));
  object-fit: cover;
  object-position: 50% 40%;
}

.fq-night__print figcaption {
  display: flex;
  align-items: baseline;
  gap: calc(16 * var(--u));
  margin-top: calc(18 * var(--u));
  font-size: calc(17 * var(--u));
}

.fq-night__print figcaption b { font-weight: 600; }
.fq-night__print figcaption span { color: var(--muted); }

/* The Passport: real fan-side styling, at presentation size */
.fq-pass {
  position: absolute;
  left: calc(1176 * var(--u));
  top: calc(96 * var(--u));
  width: calc(648 * var(--u));
  height: calc(800 * var(--u));
  padding: calc(40 * var(--u)) calc(52 * var(--u));
  overflow: hidden;
  border-radius: calc(28 * var(--u));
  background: #050608;
  box-shadow: inset 0 0 0 1px rgba(247, 249, 252, 0.12);
  color: var(--pass);
}

.fq-pass__nav {
  display: flex;
  gap: calc(28 * var(--u));
  color: rgba(247, 249, 252, 0.46);
  font-size: calc(16 * var(--u));
  font-weight: 600;
}

.fq-pass__nav .is-on { color: var(--pass); }

.fq-pass__eyebrow {
  margin-top: calc(36 * var(--u));
  color: var(--cyan);
  font-size: calc(15 * var(--u));
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.fq-pass__hero {
  margin-top: calc(10 * var(--u));
  font-size: calc(44 * var(--u));
  text-wrap: balance;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.02;
}

.fq-pass__meta {
  margin-top: calc(12 * var(--u));
  color: rgba(247, 249, 252, 0.58);
  font-size: calc(18 * var(--u));
}

.fq-pass__night {
  margin-top: calc(36 * var(--u));
  padding-top: calc(28 * var(--u));
  border-top: 1px solid rgba(247, 249, 252, 0.12);
}

.fq-pass__name {
  font-size: calc(36 * var(--u));
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1.05;
}

.fq-pass__ordinal {
  margin-top: calc(8 * var(--u));
  color: var(--cyan);
  font-size: calc(15 * var(--u));
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* The gallery stack: three prints from the same night, fanned */
.fq-pass__stack {
  position: relative;
  height: calc(214 * var(--u));
  margin-top: calc(26 * var(--u));
}

.fq-pass__stack img {
  position: absolute;
  left: calc((var(--i) * 120) * var(--u));
  top: calc(var(--i) * 8 * var(--u));
  width: calc(172 * var(--u));
  height: calc(206 * var(--u));
  object-fit: cover;
  border-radius: calc(10 * var(--u));
  box-shadow: 0 0 0 calc(4 * var(--u)) #050608, 0 calc(18 * var(--u)) calc(30 * var(--u)) rgba(0, 0, 0, 0.6);
  rotate: calc((var(--i) - 1) * 3deg);
}

.fq-pass__count {
  margin-top: calc(16 * var(--u));
  color: rgba(247, 249, 252, 0.58);
  font-size: calc(16 * var(--u));
  font-weight: 500;
}

.fq-pass__night--earlier { margin-top: calc(28 * var(--u)); padding-top: calc(22 * var(--u)); opacity: 0.62; }
.fq-pass__night--earlier .fq-pass__name { font-size: calc(26 * var(--u)); }
.fq-pass__night--earlier .fq-pass__ordinal { font-size: calc(13 * var(--u)); }

/* How it gets there: the one sentence that explains Passport */
.fq-night__how {
  position: absolute;
  left: calc(1176 * var(--u));
  top: calc(924 * var(--u));
  width: calc(648 * var(--u));
  display: flex;
  gap: calc(16 * var(--u));
  color: var(--muted);
  font-size: calc(18 * var(--u));
  line-height: 1.5;
}

.fq-night__how b { display: block; color: var(--ink); font-weight: 600; }

.fq-night__check {
  display: grid;
  flex: none;
  place-items: center;
  width: calc(28 * var(--u));
  height: calc(28 * var(--u));
  margin-top: calc(2 * var(--u));
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4fd8, #8b6cff 55%, #39d5ff);
  color: #fff;
}

.fq-night__check svg { width: 58%; height: 58%; }

/* ---------- Phone ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-night { --u: 1px; overflow-x: hidden; overflow-y: auto; }

  .fq-stage {
    position: relative;
    left: auto;
    top: auto;
    width: 100%;
    max-width: 34rem;
    height: auto;
    margin-inline: auto;
    padding: calc(2.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-night__title,
  .fq-night__print,
  .fq-pass,
  .fq-night__how { position: relative; left: auto; top: auto; width: auto; }

  .fq-night__title { font-size: clamp(2.6rem, 12vw, 3.6rem); }

  .fq-night__print { margin-top: 1.75rem; }
  .fq-night__print img { height: auto; aspect-ratio: 1000 / 572; }
  .fq-night__print figcaption { flex-direction: column; gap: 0.15rem; margin-top: 0.6rem; font-size: 0.8125rem; }

  .fq-pass { height: 30rem; margin-top: 1.75rem; padding: 1.5rem 1.25rem; border-radius: 1.25rem; }
  .fq-pass__nav { gap: 1.25rem; font-size: 0.8125rem; }
  .fq-pass__eyebrow { margin-top: 1.5rem; font-size: 0.6875rem; }
  .fq-pass__hero { font-size: 1.75rem; }
  .fq-pass__meta { font-size: 0.875rem; }
  .fq-pass__night { margin-top: 1.25rem; padding-top: 1rem; }
  .fq-pass__name { font-size: 1.375rem; }
  .fq-pass__ordinal { font-size: 0.6875rem; }
  .fq-pass__stack { height: 9rem; margin-top: 1rem; }
  .fq-pass__stack img { left: calc(var(--i) * 4.6rem); width: 6.75rem; height: 8.25rem; border-radius: 0.5rem; }
  .fq-pass__count { margin-top: 0.75rem; font-size: 0.8125rem; }

  .fq-night__how { margin-top: 1.25rem; gap: 0.75rem; font-size: 0.9375rem; }
  .fq-night__check { width: 1.5rem; height: 1.5rem; }
}
</style>
