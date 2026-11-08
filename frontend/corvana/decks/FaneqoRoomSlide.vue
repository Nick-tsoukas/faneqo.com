<template>
  <article ref="root" class="fq-room" aria-labelledby="fq-room-title">
    <!-- 01 The room: the whole frame is the show -->
    <figure class="fq-room__photo">
      <img
        :src="'/images/home/moondough-live.jpg'"
        alt="Moon Dough on stage under magenta light, singing with a guitar"
        width="2047"
        height="1151"
        fetchpriority="high"
      >
    </figure>

    <div class="fq-stage">
      <h2 id="fq-room-title" class="fq-room__title">
        <span>Turn the room</span>
        <span>into a connection.</span>
      </h2>
      <p class="fq-room__lede">The room is already here. Give fans a way to stay connected.</p>

      <p class="fq-room__step fq-room__step--show"><b>01</b> Live show</p>
      <p class="fq-room__credit">Moon Dough, live · from the artist’s Faneqo page</p>

      <!-- 02 The scan: Faneqo's own artist QR (ShareQrDrawer + utils/share/artistShareQr.js) -->
      <div class="fq-room__scan">
        <p class="fq-room__step"><b>02</b> Scan</p>
        <div class="fq-qr" role="img" aria-label="QR code for Moon Dough's Faneqo page">
          <QrcodeVue
            :value="qrUrl"
            :size="400"
            :level="ARTIST_SHARE_QR_LEVEL"
            :margin="ARTIST_SHARE_QR_MARGIN"
            render-as="svg"
            foreground="#000000"
            background="#F7F7F8"
          />
          <span class="fq-qr__sweep" aria-hidden="true"></span>
          <span class="fq-qr__logo" aria-hidden="true">
            <img :src="'/images/home/moondough-live.jpg'" alt="">
          </span>
        </div>
        <p class="fq-room__scan-note">Opens Moon Dough’s Faneqo page. While Show Mode is live, it offers check-in.</p>
      </div>
      <span class="fq-room__link" aria-hidden="true"></span>

      <!-- 03 The check-in: the real Show Mode sheet (components/band/ShowCheckInModal.vue, idle state) -->
      <p class="fq-room__step fq-room__step--checkin"><b>03</b> Check in</p>
      <section class="fq-sheet" aria-label="Show Mode check-in, as a fan sees it">
        <p class="fq-sheet__status"><span aria-hidden="true"></span>Live · Tonight</p>
        <p class="fq-sheet__artist">Moon Dough</p>
        <figure class="fq-sheet__hero">
          <img :src="'/images/home/moondough-live.jpg'" alt="">
        </figure>
        <p class="fq-sheet__lede">You’re here.</p>
        <p class="fq-sheet__sub">Check in to unlock tonight’s fan experience.</p>
        <ul class="fq-sheet__perks">
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
        <span class="fq-sheet__cta">Check in to tonight’s show</span>
        <p class="fq-sheet__foot">No spam. Just updates from the artist.</p>
      </section>

      <!-- 04 What continues after the room empties -->
      <p class="fq-room__step fq-room__step--stay"><b>04</b> Stay connected</p>
    </div>
  </article>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'
import { ARTIST_SHARE_QR_LEVEL, ARTIST_SHARE_QR_MARGIN } from '~/utils/share/artistShareQr.js'
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'

// The same gateway URL the in-app Share drawer encodes; it redirects to faneqo.com/moondough
// and counts as a QR scan. Kept literal so the slide never depends on runtime config.
const qrUrl = 'https://qr.faneqo.com/directqr?band=moondough'

// A product moment during a show: the room, the invitation to scan, the
// check-in it opens, and what the fan keeps. No check-in is ever completed.
const root = ref(null)
useSceneMotion(root, (tl, { q, phone }) => {
  settle(tl, q('.fq-room__photo'), 0, { duration: 2.4, scale: 1.05 })
  revealLines(tl, q('.fq-room__title span'), 0.35, { stagger: 0.16 })
  arrive(tl, q('.fq-room__lede'), 0.95, { y: 14 })
  arrive(tl, q('.fq-room__step--show, .fq-room__credit'), 1.1, { y: 8, stagger: 0.08 })

  // 02 · the invitation
  arrive(tl, q('.fq-room__scan .fq-room__step'), 1.55, { y: 8 })
  arrive(tl, q('.fq-qr'), 1.6, { y: 36, scale: 0.94, duration: 0.9, ease: 'expo.out' })
  tl.fromTo(q('.fq-qr__sweep'), { autoAlpha: 0, yPercent: 0 }, { autoAlpha: 1, duration: 0.2, ease: 'none' }, 2.25)
    .to(q('.fq-qr__sweep'), { yPercent: 430, duration: 0.95, ease: 'power1.inOut' }, 2.3)
    .to(q('.fq-qr__sweep'), { autoAlpha: 0, duration: 0.25, ease: 'none' }, 3.0)
  arrive(tl, q('.fq-room__scan-note'), 2.4, { y: 8 })

  // 03 · the check-in it opens
  if (!phone) tl.from(q('.fq-room__link'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.5, ease: 'power2.inOut', clearProps: 'transform' }, 3.0)
  arrive(tl, q('.fq-room__step--checkin'), 3.2, { y: 8 })
  arrive(tl, q('.fq-sheet'), 3.25, { x: phone ? 0 : 40, y: phone ? 24 : 0, duration: 0.9, ease: 'expo.out' })
  arrive(tl, q('.fq-sheet__status, .fq-sheet__artist, .fq-sheet__hero, .fq-sheet__lede, .fq-sheet__sub'), 3.5, { y: 12, stagger: 0.09, duration: 0.6 })
  arrive(tl, q('.fq-sheet__perks li'), 4.0, { x: -10, y: 0, stagger: 0.1, duration: 0.5 })
  arrive(tl, q('.fq-sheet__cta, .fq-sheet__foot'), 4.3, { y: 10, stagger: 0.1, duration: 0.6 })
  tl.to(q('.fq-sheet__cta'), { scale: 1.035, duration: 0.32, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform,translate,rotate,scale,opacity,visibility' }, 5.0)

  // 04 · what stays
  if (!phone) arrive(tl, q('.fq-room__step--stay'), 5.2, { x: -14, y: 0 })
})
</script>

<style scoped>
.fq-room {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --ink: #f7f9fc;
  --muted: rgba(247, 249, 252, 0.7);
  --sheet: #050608;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #070509;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fq-room *, .fq-room *::before, .fq-room *::after { box-sizing: border-box; }
:where(.fq-room) :where(p, h2, ul, figure) { margin: 0; padding: 0; }
.fq-room img, .fq-room svg { display: block; }

/* The photograph fills the frame; the singer sits left of centre so the product can live on the right */
.fq-room__photo {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.fq-room__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 30%;
  transform: scale(1.06);
  transform-origin: 50% 100%;
}

.fq-room__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(7, 5, 9, 0.9) 0%, rgba(7, 5, 9, 0.45) 30%, rgba(7, 5, 9, 0.12) 44%, rgba(7, 5, 9, 0) 55%, rgba(7, 5, 9, 0.55) 100%),
    linear-gradient(90deg, rgba(7, 5, 9, 0) 52%, rgba(7, 5, 9, 0.72) 72%, rgba(7, 5, 9, 0.9) 100%);
}

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-room__title {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(96 * var(--u));
  font-size: calc(96 * var(--u));
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.96;
  text-shadow: 0 2px 40px rgba(7, 5, 9, 0.5);
}

.fq-room__title span { display: block; }

.fq-room__lede {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(312 * var(--u));
  width: calc(620 * var(--u));
  color: rgba(247, 249, 252, 0.86);
  font-size: calc(28 * var(--u));
  line-height: 1.4;
  text-shadow: 0 1px 20px rgba(7, 5, 9, 0.6);
}

/* Step markers: one sequence across one frame */
.fq-room__step {
  font-size: calc(17 * var(--u));
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.fq-room__step b {
  margin-right: calc(10 * var(--u));
  color: rgba(247, 249, 252, 0.55);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.fq-room__step--show {
  position: absolute;
  left: calc(128 * var(--u));
  bottom: calc(96 * var(--u));
}

.fq-room__credit {
  position: absolute;
  left: calc(128 * var(--u));
  bottom: calc(64 * var(--u));
  color: rgba(247, 249, 252, 0.6);
  font-size: calc(14 * var(--u));
}

/* 02: the QR, on its pearl tile with the artist's photo at the centre, exactly as Faneqo draws it */
.fq-room__scan {
  position: absolute;
  left: calc(1032 * var(--u));
  top: calc(250 * var(--u));
  width: calc(256 * var(--u));
}

.fq-qr {
  position: relative;
  display: grid;
  place-items: center;
  margin-top: calc(14 * var(--u));
  padding: calc(16 * var(--u));
  border-radius: calc(26 * var(--u));
  background: #f7f7f8;
  box-shadow: 0 calc(24 * var(--u)) calc(60 * var(--u)) rgba(0, 0, 0, 0.5);
}

.fq-qr :deep(svg) { width: 100%; height: auto; }

.fq-qr__logo {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 16%;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 50%;
  background: #f7f7f8;
  box-shadow: 0 0 0 calc(3 * var(--u)) #f7f7f8;
  transform: translate(-50%, -50%);
}

.fq-qr__logo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }

/* A soft band of light the entrance passes once over the code; invisible at rest */
.fq-qr__sweep {
  position: absolute;
  left: calc(10 * var(--u));
  right: calc(10 * var(--u));
  top: calc(10 * var(--u));
  height: 18%;
  border-radius: calc(12 * var(--u));
  background: linear-gradient(180deg, rgba(139, 108, 255, 0), rgba(139, 108, 255, 0.22) 55%, rgba(57, 213, 255, 0.4) 100%);
  opacity: 0;
  pointer-events: none;
}

.fq-room__scan-note {
  margin-top: calc(16 * var(--u));
  color: var(--muted);
  font-size: calc(16 * var(--u));
  line-height: 1.45;
}

/* A hairline from the code to the sheet it opens */
.fq-room__link {
  position: absolute;
  left: calc(1300 * var(--u));
  top: calc(420 * var(--u));
  width: calc(76 * var(--u));
  height: 1px;
  background: linear-gradient(90deg, rgba(247, 249, 252, 0.15), rgba(247, 249, 252, 0.7));
}

.fq-room__step--checkin {
  position: absolute;
  left: calc(1392 * var(--u));
  top: calc(84 * var(--u));
}

/* 03: the real check-in sheet at presentation size */
.fq-sheet {
  position: absolute;
  left: calc(1392 * var(--u));
  top: calc(124 * var(--u));
  width: calc(400 * var(--u));
  height: calc(844 * var(--u));
  display: flex;
  flex-direction: column;
  padding: calc(28 * var(--u)) calc(26 * var(--u)) calc(24 * var(--u));
  border-radius: calc(36 * var(--u));
  background: var(--sheet);
  box-shadow:
    inset 0 0 0 1px rgba(247, 249, 252, 0.12),
    0 calc(40 * var(--u)) calc(100 * var(--u)) rgba(0, 0, 0, 0.6);
}

.fq-sheet__status {
  display: flex;
  align-items: center;
  gap: calc(9 * var(--u));
  color: rgba(247, 249, 252, 0.6);
  font-size: calc(13 * var(--u));
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.fq-sheet__status span {
  width: calc(7 * var(--u));
  height: calc(7 * var(--u));
  border-radius: 50%;
  background: #4ade80;
  box-shadow: 0 0 0 calc(4 * var(--u)) rgba(74, 222, 128, 0.14);
}

.fq-sheet__artist {
  margin-top: calc(8 * var(--u));
  font-size: calc(38 * var(--u));
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.04;
}

.fq-sheet__hero {
  position: relative;
  height: calc(300 * var(--u));
  margin-top: calc(16 * var(--u));
  overflow: hidden;
  border-radius: calc(20 * var(--u));
}

.fq-sheet__hero img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 28%; }

.fq-sheet__hero::after {
  content: '';
  position: absolute;
  inset: auto 0 -1px;
  height: 58%;
  background: linear-gradient(180deg, rgba(5, 6, 8, 0) 0%, rgba(5, 6, 8, 0.6) 62%, #050608 100%);
}

.fq-sheet__lede {
  margin-top: calc(20 * var(--u));
  font-size: calc(32 * var(--u));
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.fq-sheet__sub {
  margin-top: calc(8 * var(--u));
  color: rgba(247, 249, 252, 0.68);
  font-size: calc(18 * var(--u));
  line-height: 1.45;
}

.fq-sheet__perks {
  display: grid;
  gap: calc(13 * var(--u));
  margin-top: calc(20 * var(--u));
  list-style: none;
}

.fq-sheet__perks li {
  display: flex;
  align-items: center;
  gap: calc(13 * var(--u));
  color: rgba(247, 249, 252, 0.9);
  font-size: calc(17 * var(--u));
}

.fq-sheet__perks svg {
  flex: none;
  width: calc(22 * var(--u));
  height: calc(22 * var(--u));
  fill: none;
  stroke: rgba(247, 249, 252, 0.45);
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.fq-sheet__cta {
  display: grid;
  place-items: center;
  min-height: calc(60 * var(--u));
  margin-top: calc(24 * var(--u));
  border-radius: calc(16 * var(--u));
  background: #f3f3f4;
  color: #08090a;
  font-size: calc(19 * var(--u));
  font-weight: 700;
  letter-spacing: -0.01em;
}

.fq-sheet__foot {
  margin-top: auto;
  color: rgba(247, 249, 252, 0.45);
  font-size: calc(14 * var(--u));
  text-align: center;
}

/* 04: points at what the fan keeps */
.fq-room__step--stay {
  position: absolute;
  right: calc(560 * var(--u));
  top: calc(706 * var(--u));
  display: flex;
  align-items: center;
}

.fq-room__step--stay::after {
  content: '';
  width: calc(48 * var(--u));
  height: 1px;
  margin-left: calc(14 * var(--u));
  background: rgba(247, 249, 252, 0.7);
}

/* ---------- Phone: the photo on top, then the scan, then the sheet ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-room { --u: 1px; overflow-x: hidden; overflow-y: auto; }

  .fq-room__photo { position: relative; inset: auto; height: 62vw; }
  .fq-room__photo img { transform: none; object-position: 48% 60%; }
  .fq-room__photo::after { background: linear-gradient(180deg, rgba(7, 5, 9, 0) 50%, #070509 100%); }

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
    padding: 0 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-room__title,
  .fq-room__lede,
  .fq-room__step,
  .fq-room__credit,
  .fq-room__scan,
  .fq-sheet { position: relative; left: auto; right: auto; top: auto; bottom: auto; width: auto; }

  .fq-room__step--show, .fq-room__credit { order: -1; }
  .fq-room__step--show { margin-top: -0.5rem; font-size: 0.875rem; }
  .fq-room__credit { margin-top: 0.25rem; font-size: 0.6875rem; }

  .fq-room__title { margin-top: 1.25rem; font-size: clamp(2.4rem, 11vw, 3.2rem); }
  .fq-room__lede { margin-top: 0.75rem; font-size: 1.0625rem; }

  .fq-room__scan { display: grid; grid-template-columns: 7.5rem 1fr; column-gap: 1rem; align-items: center; margin-top: 1.75rem; }
  .fq-room__scan .fq-room__step { grid-column: 1 / -1; margin-bottom: 0.5rem; }
  .fq-qr { margin-top: 0; padding: 0.5rem; border-radius: 0.9rem; }
  .fq-room__scan-note { margin-top: 0; font-size: 0.875rem; }
  .fq-room__link, .fq-room__step--stay { display: none; }

  .fq-room__step { font-size: 0.875rem; }
  .fq-room__step--checkin { margin-top: 1.75rem; }

  .fq-sheet { height: auto; margin-top: 0.6rem; padding: 1.25rem 1rem 1rem; border-radius: 1.5rem; }
  .fq-sheet__status { font-size: 0.6875rem; }
  .fq-sheet__artist { font-size: 1.75rem; }
  .fq-sheet__hero { height: 11rem; }
  .fq-sheet__lede { font-size: 1.5rem; }
  .fq-sheet__sub, .fq-sheet__perks li { font-size: 0.9375rem; }
  .fq-sheet__perks svg { width: 1.25rem; height: 1.25rem; }
  .fq-sheet__cta { min-height: 3.5rem; font-size: 1.0625rem; }
  .fq-sheet__foot { margin-top: 1.25rem; font-size: 0.75rem; }
}
</style>
