<template>
  <section id="after-the-show" ref="root" class="live" aria-labelledby="live-title">
    <!-- The room: one full-width concert photograph -->
    <figure class="live__photo">
      <img
        :src="photo"
        :srcset="photoSet"
        sizes="100vw"
        alt="Moon Dough on stage under magenta light, singing with a guitar"
        width="2047"
        height="1151"
        loading="lazy"
        decoding="async"
      >
      <figcaption>Moon Dough, live · from the artist’s Faneqo page</figcaption>
    </figure>

    <div class="live__inner">
      <div class="live__copy">
        <p class="live__kicker">Show Mode</p>
        <h2 id="live-title" class="live__title">
          <span>The audience is already there.</span>
          <span class="live__accent">Give them a way to stay connected.</span>
        </h2>
        <p class="live__body">
          Put your Faneqo code on the screen, a poster or the merch table. While Show Mode is live, one scan opens check-in on your page.
        </p>
      </div>

      <!-- The interaction: Faneqo's own QR (ShareQrDrawer) opening the real check-in sheet (ShowCheckInModal) -->
      <div class="live__product" aria-label="A fan scans and checks in">
        <div class="live__scan">
          <div class="live-qr" role="img" aria-label="QR code for Moon Dough's Faneqo page">
            <QrcodeVue
              :value="qrUrl"
              :size="320"
              :level="ARTIST_SHARE_QR_LEVEL"
              :margin="ARTIST_SHARE_QR_MARGIN"
              render-as="svg"
              foreground="#000000"
              background="#F7F7F8"
            />
            <span class="live-qr__sweep" aria-hidden="true"></span>
            <span class="live-qr__logo" aria-hidden="true">
              <img :src="photo" alt="" loading="lazy">
            </span>
          </div>
          <div>
            <p class="live__step"><b>01</b> Scan</p>
            <p class="live__scan-note">On the screen, a poster or the merch table.</p>
          </div>
        </div>

        <div class="live-sheet">
          <p class="live__step live__step--sheet"><b>02</b> Check in</p>
          <div class="live-sheet__card">
            <p class="live-sheet__status"><span aria-hidden="true"></span>Live · Tonight</p>
            <p class="live-sheet__artist">Moon Dough</p>
            <p class="live-sheet__lede">You’re here.</p>
            <p class="live-sheet__sub">Check in to unlock tonight’s fan experience.</p>
            <ul class="live-sheet__perks">
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9h10M7 13h6m8-1a9 9 0 01-9 9 9.7 9.7 0 01-4-.9L3 21l.9-4A9 9 0 1121 12z" /></svg>
                Talk to the band
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 15l4-4 4 4 3-3 7 7M16.5 8.5h.01" /></svg>
                Get exclusive photos &amp; updates
              </li>
              <li>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12a2 2 0 012 2v16l-8-4-8 4V5a2 2 0 012-2z" /></svg>
                Save tonight to your Fan Passport
              </li>
            </ul>
            <span class="live-sheet__cta">Check in to tonight’s show</span>
            <p class="live-sheet__foot">No spam. Just updates from the artist.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { ARTIST_SHARE_QR_LEVEL, ARTIST_SHARE_QR_MARGIN } from '~/utils/share/artistShareQr.js'
import { useHomeStoryMotion, revealLines, arrive, settle } from '~/composables/home-v2/useHomeStoryMotion'

// Same gateway URL the in-app Share drawer encodes; redirects to faneqo.com/moondough.
const qrUrl = 'https://qr.faneqo.com/directqr?band=moondough'

// Bound as strings so the dev server never rewrites them into asset imports
// Moon Dough's own photo from her Faneqo page (2047 px), the only live image she has published
const photo = '/images/home/moondough-live.jpg'
const photoSet = '/images/home/moondough-live.jpg 2047w'

// The room, the invitation, the check-in it opens. No check-in ever completes.
const root = ref(null)
useHomeStoryMotion(root, (tl, { q, phone }) => {
  settle(tl, q('.live__photo img'), 0, { duration: 2.2, scale: 1.05 })
  arrive(tl, q('.live__kicker'), 0.25, { y: 8 })
  revealLines(tl, q('.live__title span'), 0.35, { stagger: 0.18 })
  arrive(tl, q('.live__body'), 0.95, { y: 12 })

  arrive(tl, q('.live-qr'), 1.25, { y: 30, scale: 0.94, duration: 0.85, ease: 'expo.out' })
  tl.fromTo(q('.live-qr__sweep'), { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 1.85)
    .to(q('.live-qr__sweep'), { yPercent: 430, duration: 0.9, ease: 'power1.inOut' }, 1.9)
    .to(q('.live-qr__sweep'), { autoAlpha: 0, duration: 0.25, ease: 'none' }, 2.55)
  arrive(tl, q('.live__scan .live__step, .live__scan-note'), 1.6, { y: 6, stagger: 0.08 })

  arrive(tl, q('.live-sheet__card'), 2.5, { x: phone ? 0 : 36, y: phone ? 20 : 0, duration: 0.9, ease: 'expo.out' })
  arrive(tl, q('.live__step--sheet'), 2.55, { y: 6 })
  arrive(tl, q('.live-sheet__status, .live-sheet__artist, .live-sheet__lede, .live-sheet__sub'), 2.75, { y: 10, stagger: 0.08, duration: 0.55 })
  arrive(tl, q('.live-sheet__perks li'), 3.15, { x: -10, y: 0, stagger: 0.09, duration: 0.5 })
  arrive(tl, q('.live-sheet__cta, .live-sheet__foot'), 3.45, { y: 8, stagger: 0.08, duration: 0.55 })
  tl.to(q('.live-sheet__cta'), { scale: 1.035, duration: 0.3, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform,translate,rotate,scale' }, 4.1)
})
</script>

<style scoped>
.live {
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  --ink: #f7f9fc;
  position: relative;
  z-index: 10;
  overflow: hidden;
  min-height: min(100svh, 980px);
  background: #070509;
  color: var(--ink);
}

.live *, .live *::before, .live *::after { box-sizing: border-box; }
:where(.live) :where(p, h2, ul, figure) { margin: 0; padding: 0; }
.live img, .live svg { display: block; }

/* The photograph fills the section; the singer sits left of centre */
.live__photo { position: absolute; inset: 0; }

.live__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 52% 12%;
}

.live__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 5, 9, 0.85) 0%, rgba(7, 5, 9, 0.25) 30%, rgba(7, 5, 9, 0.05) 50%, rgba(7, 5, 9, 0.7) 100%),
    linear-gradient(90deg, rgba(7, 5, 9, 0.7) 0%, rgba(7, 5, 9, 0.35) 28%, rgba(7, 5, 9, 0) 46%, rgba(7, 5, 9, 0.55) 68%, rgba(7, 5, 9, 0.92) 100%);
}

.live__photo figcaption {
  position: absolute;
  z-index: 2;
  left: clamp(1.25rem, 5vw, 4.5rem);
  bottom: 1.4rem;
  color: rgba(247, 249, 252, 0.6);
  font-size: 0.75rem;
}

.live__inner {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(2rem, 4vw, 4rem);
  max-width: 82rem;
  min-height: min(100svh, 980px);
  margin: 0 auto;
  padding: clamp(5rem, 9vw, 8rem) clamp(1.25rem, 5vw, 4.5rem);
}

.live__copy { align-self: start; max-width: 36rem; }

.live__kicker {
  color: #ff8ae6;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.live__title {
  margin-top: 1rem;
  font-size: clamp(2.4rem, 4.4vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.98;
  text-shadow: 0 2px 40px rgba(7, 5, 9, 0.5);
}

.live__title span { display: block; }

.live__accent {
  margin-top: 0.3em;
  background: linear-gradient(90deg, #ff6fd8, #9d7bff 50%, #4fd8ee);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: none;
}

.live__body {
  max-width: 30rem;
  margin-top: 1.5rem;
  color: rgba(247, 249, 252, 0.84);
  font-size: clamp(1.0625rem, 1.3vw, 1.25rem);
  line-height: 1.55;
  text-shadow: 0 1px 18px rgba(7, 5, 9, 0.7);
}

/* The product: code and sheet, side by side */
.live__product {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 1.1rem;
  width: 22rem;
}

.live__step {
  margin-top: 0.85rem;
  font-size: 0.9375rem;
  font-weight: 600;
}

.live__step b { margin-right: 0.5rem; color: rgba(247, 249, 252, 0.55); font-weight: 600; }

.live__scan {
  display: grid;
  grid-template-columns: 6.75rem 1fr;
  align-items: center;
  column-gap: 1rem;
}

.live__scan .live__step { margin: 0; }
.live__scan-note { margin-top: 0.3rem; color: rgba(247, 249, 252, 0.72); font-size: 0.875rem; line-height: 1.4; }

.live-qr {
  position: relative;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  border-radius: 1rem;
  background: #f7f7f8;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.live-qr :deep(svg) { width: 100%; height: auto; }

.live-qr__logo {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: #f7f7f8;
  box-shadow: 0 0 0 3px #f7f7f8;
  transform: translate(-50%, -50%);
}

.live-qr__logo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }

/* One soft band of light passes over the code during the entrance; invisible at rest */
.live-qr__sweep {
  position: absolute;
  left: 0.5rem;
  right: 0.5rem;
  top: 0.5rem;
  height: 18%;
  border-radius: 0.6rem;
  background: linear-gradient(180deg, rgba(139, 108, 255, 0), rgba(139, 108, 255, 0.22) 55%, rgba(57, 213, 255, 0.4) 100%);
  opacity: 0;
  pointer-events: none;
}

/* The real check-in sheet, idle state */
.live-sheet { width: 100%; }
.live__step--sheet { margin: 0 0 0.75rem; }

.live-sheet__card {
  display: flex;
  flex-direction: column;
  padding: 1.6rem 1.5rem 1.25rem;
  border-radius: 1.75rem;
  background: #050608;
  box-shadow: inset 0 0 0 1px rgba(247, 249, 252, 0.12), 0 40px 100px rgba(0, 0, 0, 0.6);
}

.live-sheet__status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(247, 249, 252, 0.6);
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.live-sheet__status span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 4px rgba(74, 222, 128, 0.14);
}

.live-sheet__artist { margin-top: 0.45rem; font-size: 1.85rem; font-weight: 800; letter-spacing: -0.025em; line-height: 1.04; }
.live-sheet__lede { margin-top: 1.25rem; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
.live-sheet__sub { margin-top: 0.4rem; color: rgba(247, 249, 252, 0.68); font-size: 0.9375rem; line-height: 1.45; }

.live-sheet__perks { display: grid; gap: 0.7rem; margin-top: 1.1rem; list-style: none; }

.live-sheet__perks li {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: rgba(247, 249, 252, 0.9);
  font-size: 0.9375rem;
}

.live-sheet__perks svg {
  flex: none;
  width: 1.2rem;
  height: 1.2rem;
  fill: none;
  stroke: rgba(247, 249, 252, 0.45);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.live-sheet__cta {
  display: grid;
  place-items: center;
  min-height: 3.4rem;
  margin-top: 1.3rem;
  border-radius: 1rem;
  background: #f3f3f4;
  color: #08090a;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.live-sheet__foot { margin-top: 1rem; color: rgba(247, 249, 252, 0.45); font-size: 0.75rem; text-align: center; }


/* Phone and tablet: photo, words, then the interaction */
@media (max-width: 860px) {
  .live { min-height: 0; }
  .live__photo { position: relative; height: 70vw; max-height: 34rem; }
  .live__photo img { object-position: 46% 60%; }
  .live__photo::after { background: linear-gradient(180deg, rgba(7, 5, 9, 0) 45%, #070509 100%); }
  .live__photo figcaption { bottom: 0.6rem; font-size: 0.6875rem; }

  .live__inner { display: block; min-height: 0; padding-top: 0.5rem; padding-bottom: 4.5rem; }
  .live__title { font-size: clamp(2.2rem, 10vw, 3rem); }

  .live__product { width: auto; max-width: 26rem; margin-top: 2.25rem; }
  .live-sheet__card { padding: 1.1rem 1rem 1rem; border-radius: 1.25rem; }
  .live-sheet__artist { font-size: 1.35rem; }
  .live-sheet__lede { margin-top: 0.85rem; font-size: 1.2rem; }
  .live-sheet__sub, .live-sheet__perks li { font-size: 0.8125rem; }
  .live-sheet__cta { min-height: 2.9rem; font-size: 0.875rem; }
}

</style>
