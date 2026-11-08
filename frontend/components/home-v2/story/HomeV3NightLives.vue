<template>
  <section id="passport" ref="root" class="night" aria-labelledby="night-title">
    <div class="night__inner">
      <header class="night__head">
        <h2 id="night-title" class="night__title">
          <span>Give the night</span>
          <span class="night__accent">somewhere to live.</span>
        </h2>
        <p class="night__lede">
          The photos go up on the artist’s page as a gallery. Fans who checked in keep the night in their Fan Passport.
        </p>
      </header>

      <div class="night__wall">
        <!-- The print: one photograph from the artist's real gallery of that night -->
        <figure class="night__print">
          <div class="night__frame">
            <img
              :src="print"
              alt="Five Finger Death Punch's singer on stage under red light"
              width="2048"
              height="1365"
              loading="lazy"
              decoding="async"
            >
          </div>
          <figcaption class="night__label">
            <b>Five Finger Death Punch</b>
            <span>Gallery on the band’s Faneqo page · 15 photographs</span>
          </figcaption>
        </figure>

        <!-- The keepsake: the same night in one fan's Passport (FanPassportHome + NightMemory) -->
        <section class="pass" aria-label="An example fan's Fan Passport">
          <nav class="pass__nav" aria-hidden="true">
            <span>Artists</span><span>Messages</span><span class="is-on">Passport</span>
          </nav>
          <p class="pass__eyebrow">Passport</p>
          <p class="pass__hero">Your nights stay with you.</p>
          <p class="pass__meta">2 Nights · 2 Artists</p>

          <div class="pass__night">
            <p class="pass__name">Five Finger Death Punch</p>
            <p class="pass__ordinal">Your first Five Finger Death Punch night</p>
            <div class="pass__stack" aria-hidden="true">
              <img
                v-for="(photo, i) in stack"
                :key="photo.src"
                :src="photo.src"
                :style="{ '--i': i, objectPosition: photo.focus }"
                alt=""
                loading="lazy"
              >
            </div>
            <p class="pass__count">15 photos</p>
          </div>

          <div class="pass__night pass__night--earlier" aria-hidden="true">
            <p class="pass__name">Moon Dough</p>
            <p class="pass__ordinal">Your first Moon Dough night</p>
          </div>
        </section>
      </div>

      <p class="night__how">
        <span class="night__check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </span>
        <span>
          <b>Check in at the show, and the Night is kept.</b>
          It lands in the fan’s Passport with the artist’s photos from that night. Fans can also save any gallery.
        </span>
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useHomeStoryMotion, revealLines, arrive } from '~/composables/home-v2/useHomeStoryMotion'

// Five Finger Death Punch's real 15-photo Faneqo gallery, the same night the
// flagship presentation shows. Passport copy follows components/passport/* and
// utils/passport/passportPresentation.js; the fan and her two Nights are an example.
// Bound as strings so the dev server never rewrites them into asset imports.
const print = '/images/home/ffdp-live-print.jpg'
const stack = [
  { src: '/images/deck-flagship/ffdp-gallery/09.jpg', focus: '50% 45%' },
  { src: '/images/deck-flagship/ffdp-gallery/07.jpg', focus: '50% 30%' },
  { src: '/images/deck-flagship/ffdp-gallery/01.jpg', focus: '50% 22%' },
]

// An exhibition opening, then the keepsake: the print is lit from left to right,
// the label settles, the Passport opens and the night's photos are laid into it.
const root = ref(null)
useHomeStoryMotion(root, (tl, { q, phone }) => {
  revealLines(tl, q('.night__title span'), 0, { stagger: 0.16 })
  arrive(tl, q('.night__lede'), 0.5, { y: 10 })

  tl.fromTo(q('.night__frame'), { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', clearProps: 'clipPath' }, 0.45)
  tl.fromTo(q('.night__frame img'), { scale: 1.1 }, { scale: 1, duration: 2.4, ease: 'power2.out', clearProps: 'transform' }, 0.45)
  arrive(tl, q('.night__label'), 1.5, { y: 8 })

  arrive(tl, q('.pass'), phone ? 1.2 : 1.6, { y: 36, duration: 0.9, ease: 'expo.out' })
  arrive(tl, q('.pass__nav, .pass__eyebrow, .pass__hero, .pass__meta'), phone ? 1.4 : 1.85, { y: 10, stagger: 0.07, duration: 0.55 })
  arrive(tl, q('.pass__night:not(.pass__night--earlier) > p:not(.pass__count)'), phone ? 1.7 : 2.25, { y: 10, stagger: 0.08, duration: 0.55 })
  tl.from(q('.pass__stack img'), { autoAlpha: 0, y: 44, duration: 0.75, ease: 'expo.out', stagger: 0.16, clearProps: 'transform,opacity,visibility' }, phone ? 2.0 : 2.6)
  arrive(tl, q('.pass__count, .pass__night--earlier'), phone ? 2.4 : 3.1, { y: 8, stagger: 0.1, clearProps: 'transform,opacity,visibility' })
  arrive(tl, q('.night__how'), phone ? 2.6 : 3.35, { y: 10 })
}, { threshold: 0.18 })
</script>

<style scoped>
.night {
  --ink: #f6f1ea;
  --muted: rgba(246, 241, 234, 0.64);
  --hair: rgba(246, 241, 234, 0.12);
  position: relative;
  z-index: 10;
  overflow: hidden;
  background:
    radial-gradient(70rem 40rem at 20% 0%, rgba(214, 72, 32, 0.12), transparent 70%),
    #0a0706;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}

.night *, .night *::before, .night *::after { box-sizing: border-box; }
:where(.night) :where(p, h2, figure) { margin: 0; padding: 0; }
.night img, .night svg { display: block; }

.night__inner {
  max-width: 100rem;
  margin: 0 auto;
  padding: clamp(5.5rem, 10vw, 9rem) clamp(1.25rem, 5vw, 4.5rem);
}

.night__head {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(0, 1fr);
  align-items: end;
  gap: 1.5rem 4rem;
}

.night__title {
  font-size: clamp(2.6rem, 5.4vw, 5.6rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.96;
}

.night__title span { display: block; }

.night__accent {
  background: linear-gradient(90deg, #ffb35c, #ff6f61 45%, #ff4fd8);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.night__lede { max-width: 28rem; color: var(--muted); font-size: clamp(1.0625rem, 1.3vw, 1.2rem); line-height: 1.55; }

/* The wall: one print and the keepsake beside it */
.night__wall {
  display: grid;
  grid-template-columns: minmax(0, 2.15fr) minmax(21rem, 1fr);
  gap: clamp(1.5rem, 3vw, 3rem);
  align-items: start;
  margin-top: clamp(2.5rem, 5vw, 4rem);
}

.night__frame { overflow: hidden; border-radius: 0.35rem; box-shadow: 0 60px 120px -60px rgba(0, 0, 0, 0.9); }
.night__frame img { width: 100%; aspect-ratio: 2048 / 1365; object-fit: cover; }

.night__label {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  margin-top: 1rem;
  padding-left: 0.85rem;
  border-left: 2px solid rgba(255, 140, 90, 0.7);
  font-size: 0.875rem;
}

.night__label b { font-weight: 600; }
.night__label span { color: var(--muted); }

/* The real Passport (dark fan-side styling) */
.pass {
  padding: 2rem 1.9rem 1.7rem;
  border-radius: 1.5rem;
  background: #050608;
  box-shadow: inset 0 0 0 1px rgba(247, 249, 252, 0.12), 0 40px 90px -40px rgba(0, 0, 0, 0.9);
  color: #f7f9fc;
}

.pass__nav { display: flex; gap: 1.1rem; color: rgba(247, 249, 252, 0.46); font-size: 0.8125rem; font-weight: 600; }
.pass__nav .is-on { color: #f7f9fc; }
.pass__eyebrow { margin-top: 1.4rem; color: #7ee7ff; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; }
.pass__hero { margin-top: 0.35rem; font-size: 1.9rem; font-weight: 800; letter-spacing: -0.045em; line-height: 1.04; text-wrap: balance; }
.pass__meta { margin-top: 0.4rem; color: rgba(247, 249, 252, 0.58); font-size: 0.875rem; }

.pass__night { margin-top: 1.25rem; padding-top: 1.1rem; border-top: 1px solid rgba(247, 249, 252, 0.12); }
.pass__kicker { color: rgba(247, 249, 252, 0.48); font-size: 0.6875rem; font-weight: 650; letter-spacing: 0.14em; text-transform: uppercase; }
.pass__name { margin-top: 0.2rem; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.045em; line-height: 1.05; }
.pass__venue { margin-top: 0.15rem; color: rgba(247, 249, 252, 0.7); font-size: 0.875rem; }
.pass__ordinal { margin-top: 0.45rem; color: #7ee7ff; font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

/* The night's photos, laid into the Passport like prints */
.pass__stack { position: relative; height: 10.2rem; margin-top: 1.1rem; }

.pass__stack img {
  position: absolute;
  left: calc(var(--i) * 5.4rem);
  top: calc(var(--i) * 0.3rem);
  width: 7.6rem;
  height: 9.5rem;
  object-fit: cover;
  border-radius: 0.55rem;
  box-shadow: 0 0 0 3px #050608, 0 14px 26px rgba(0, 0, 0, 0.6);
  rotate: calc((var(--i) - 1) * 3deg);
}

.pass__count { margin-top: 0.6rem; color: rgba(247, 249, 252, 0.58); font-size: 0.8125rem; font-weight: 500; }

.pass__night--earlier { opacity: 0.6; }
.pass__night--earlier .pass__name { font-size: 1.15rem; }

.night__how {
  display: flex;
  gap: 0.85rem;
  max-width: 40rem;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.55;
}

.night__how b { display: block; color: var(--ink); font-weight: 600; }

.night__check {
  display: grid;
  flex: none;
  place-items: center;
  width: 1.6rem;
  height: 1.6rem;
  margin-top: 0.1rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #ff4fd8, #8b6cff 55%, #39d5ff);
  color: #fff;
}

.night__check svg { width: 58%; height: 58%; }

@media (max-width: 960px) {
  .night__head { grid-template-columns: 1fr; }
  .night__wall { grid-template-columns: 1fr; }
  .pass { max-width: 26rem; }
}
</style>
