<template>
  <article ref="root" class="fq-journey" aria-labelledby="fq-journey-title">
    <div class="fq-stage">
      <h2 id="fq-journey-title" class="fq-journey__title">
        <span>From a moment</span>
        <em>to a relationship.</em>
      </h2>

      <p class="fq-journey__premise">
        One week with one hypothetical fan, Sarah. Every step is one she chooses to take; none of it happens automatically.
      </p>

      <!-- One line of time through the week. It runs off the page: the relationship keeps going. -->
      <div class="fq-journey__line is-fan" aria-hidden="true"></div>
      <div class="fq-journey__line is-team" aria-hidden="true"></div>
      <p class="fq-journey__team">The artist’s team</p>

      <ol class="fq-journey__steps">
        <li
          v-for="(step, i) in steps"
          :key="step.word"
          class="fq-step"
          :class="[i % 2 ? 'is-below' : 'is-above', { 'is-team': step.team }]"
          :style="{ '--i': i }"
        >
          <span class="fq-step__node" aria-hidden="true"></span>
          <div class="fq-step__text">
            <p class="fq-step__when">{{ step.when }}</p>
            <p class="fq-step__word">{{ step.word }}</p>
            <p class="fq-step__line">{{ step.line }}</p>
            <p class="fq-step__product">{{ step.product }}</p>
          </div>

          <!-- The evidence: a small piece of the real product at each step -->
          <div class="fq-step__proof" aria-hidden="true">
            <div v-if="step.proof === 'song'" class="fq-proof fq-proof--song">
              <img :src="'/images/deck-slide-02/ffdp-afterlife-cover.jpg'" alt="" width="640" height="640">
              <div>
                <b>Afterlife</b>
                <span>Five Finger Death Punch</span>
              </div>
              <i class="fq-proof__play"></i>
            </div>

            <div v-else-if="step.proof === 'checkin'" class="fq-proof fq-proof--checkin">
              <div class="fq-proof__qr"><QrcodeVue value="https://faneqo.com/fivefingerdeathpunch" :size="120" level="M" render-as="svg" /></div>
              <b>You’re here.</b>
              <span class="fq-proof__button">Check in to tonight’s show</span>
            </div>

            <div v-else-if="step.proof === 'fan'" class="fq-proof fq-proof--fan">
              <span class="fq-proof__avatar">SM</span>
              <div>
                <b>Sarah M.</b>
                <span>1 show</span>
              </div>
            </div>

            <div v-else-if="step.proof === 'gallery'" class="fq-proof fq-proof--gallery">
              <div class="fq-proof__stack">
                <img
                  v-for="(n, k) in ['09', '07', '01']"
                  :key="n"
                  :src="`/images/deck-flagship/ffdp-gallery/${n}.jpg`"
                  :style="{ '--k': k }"
                  alt=""
                  width="667"
                  height="1000"
                >
              </div>
              <span class="fq-proof__ordinal">Your first Five Finger Death Punch night</span>
            </div>

            <div v-else-if="step.proof === 'message'" class="fq-proof fq-proof--message">
              <p class="fq-proof__bubble">Thank you for last night. You were louder than the PA.</p>
              <p class="fq-proof__bubble is-fan">Best night of my year.</p>
            </div>

            <div v-else-if="step.proof === 'chart'" class="fq-proof fq-proof--chart">
              <svg viewBox="0 0 300 70" preserveAspectRatio="none">
                <path :d="spark" />
              </svg>
              <span><b>Show night</b> stands out in the sample report</span>
            </div>
          </div>
        </li>
      </ol>
    </div>
  </article>
</template>

<script setup>
import QrcodeVue from 'qrcode.vue'
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive } from './motion/useSceneMotion.js'

// Each proof uses real product copy: the song row (artist page), the check-in
// sheet (ShowCheckInModal.vue), a fan row (composerPresentation.js), the
// Passport ordinal, the message thread from Slide 6 and the Slide 8 sample chart.
const steps = [
  { when: 'Tuesday', word: 'Discover', product: 'Artist page · Smart link', line: 'Hears a song and opens the artist’s page.', proof: 'song' },
  { when: 'Saturday, 9:40 pm', word: 'Show up', product: 'Show Mode', line: 'Scans at the show and checks in.', proof: 'checkin' },
  { when: 'Saturday, 9:41 pm', word: 'Stay close', product: 'Fan list', line: 'The artist now knows she was there.', proof: 'fan' },
  { when: 'Sunday', word: 'Relive', product: 'Gallery · Fan Passport', line: 'Finds the photos. The night stays hers.', proof: 'gallery' },
  { when: 'Monday', word: 'Hear back', product: 'Messages', line: 'Reads a note from the artist, and replies.', proof: 'message' },
  { when: 'Next week', word: 'Understand', product: 'Analytics', line: 'The team sees which moment brought fans in.', proof: 'chart', team: true },
]

const series = [3, 3, 4, 3, 4, 5, 4, 6, 7, 9, 30, 14, 9, 7, 6, 6, 5]
const sx = 300 / (series.length - 1)
const spark = series.map((v, i) => `${i ? 'L' : 'M'}${(i * sx).toFixed(1)},${(68 - (v / 30) * 64).toFixed(1)}`).join(' ')

// The week unfolds as a line of time. Each of Sarah's steps lights up as the
// line reaches it; then a beat, and the view changes to the artist's team.
const root = ref(null)
useSceneMotion(root, (tl, { q, phone }) => {
  revealLines(tl, q('.fq-journey__title span, .fq-journey__title em'), 0)
  arrive(tl, q('.fq-journey__premise'), 0.55, { x: 12, y: 0 })

  const fanStart = 0.9
  const fanRun = 4.6
  if (!phone) tl.from(q('.fq-journey__line.is-fan'), { scaleX: 0, transformOrigin: '0% 50%', duration: fanRun, ease: 'none', clearProps: 'transform' }, fanStart)

  q('.fq-step').forEach((step, i) => {
    const team = step.classList.contains('is-team')
    // Fan steps sit at 0, 0.2 … 0.8 of the fan line; the team step follows a beat later
    const at = team ? fanStart + fanRun + 0.95 : fanStart + fanRun * 0.2 * i
    const dir = step.classList.contains('is-below') ? -1 : 1
    tl.from(step.querySelector('.fq-step__node'), { scale: 0, duration: 0.45, ease: 'back.out(2.2)', clearProps: 'transform' }, at)
    arrive(tl, step.querySelector('.fq-step__text'), at + 0.05, { y: 14 * dir, duration: 0.6 })
    arrive(tl, step.querySelector('.fq-step__proof'), at + 0.25, { y: 22 * dir, duration: 0.7, ease: 'expo.out' })
  })

  if (!phone) {
    tl.from(q('.fq-journey__line.is-team'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.8, ease: 'power2.out', clearProps: 'transform' }, fanStart + fanRun + 0.35)
    arrive(tl, q('.fq-journey__team'), fanStart + fanRun + 0.55, { x: -10, y: 0 })
  }
})
</script>

<style scoped>
.fq-journey {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --ground: #0b0a10;
  --ink: #f3f1f7;
  --muted: rgba(243, 241, 247, 0.6);
  --hair: rgba(243, 241, 247, 0.14);
  --panel: #16151c;
  --line-y: 600;
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--ground);
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fq-journey *, .fq-journey *::before, .fq-journey *::after { box-sizing: border-box; }
:where(.fq-journey) :where(p, h2, ol) { margin: 0; padding: 0; }
.fq-journey img, .fq-journey svg { display: block; }

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-journey__title {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(72 * var(--u));
  font-family: var(--serif);
  font-size: calc(84 * var(--u));
  font-weight: 400;
  letter-spacing: -0.024em;
  line-height: 0.98;
}

.fq-journey__title span,
.fq-journey__title em { display: block; }
.fq-journey__title em { font-style: italic; }

.fq-journey__premise {
  position: absolute;
  right: calc(128 * var(--u));
  top: calc(104 * var(--u));
  width: calc(440 * var(--u));
  padding-left: calc(20 * var(--u));
  border-left: 2px solid var(--hair);
  color: var(--muted);
  font-size: calc(18 * var(--u));
  line-height: 1.5;
}

/* The week: Sarah's part is one warm line; the artist team's view picks up in cyan and runs off the page */
.fq-journey__line {
  position: absolute;
  top: calc(var(--line-y) * var(--u) - 1px);
  height: 2px;
}

.fq-journey__line.is-fan {
  left: calc(128 * var(--u));
  width: calc(1480 * var(--u));
  background: linear-gradient(90deg, #ff6fc4, #9d7bff);
}

.fq-journey__line.is-team {
  left: calc(1608 * var(--u));
  right: 0;
  background: repeating-linear-gradient(90deg, #7ee7ff 0 calc(10 * var(--u)), transparent calc(10 * var(--u)) calc(18 * var(--u)));
}

.fq-journey__team {
  position: absolute;
  left: calc(1628 * var(--u));
  top: calc((var(--line-y) - 46) * var(--u));
  color: #7ee7ff;
  font-size: calc(16 * var(--u));
  font-weight: 600;
}

.fq-journey__steps { list-style: none; }

.fq-step {
  position: absolute;
  left: calc((128 + var(--i) * 296) * var(--u));
  top: calc(var(--line-y) * var(--u));
  width: calc(272 * var(--u));
}

.fq-step__node {
  position: absolute;
  left: calc(-8 * var(--u));
  top: calc(-8 * var(--u));
  width: calc(16 * var(--u));
  height: calc(16 * var(--u));
  border-radius: 999px;
  background: var(--ink);
  box-shadow: 0 0 0 calc(6 * var(--u)) var(--ground);
}

.fq-step__when {
  margin-bottom: calc(6 * var(--u));
  color: #b9a8ff;
  font-size: calc(16 * var(--u));
  font-weight: 600;
  white-space: nowrap;
}

.is-team .fq-step__when { color: #7ee7ff; }
.is-team .fq-step__node { background: var(--ground); box-shadow: 0 0 0 calc(6 * var(--u)) var(--ground), inset 0 0 0 calc(3 * var(--u)) #7ee7ff; }

/* Words hug the line; the evidence sits outward from it */
.fq-step__text,
.fq-step__proof { position: absolute; left: 0; width: 100%; }

.is-above .fq-step__text { bottom: calc(30 * var(--u)); }
.is-above .fq-step__proof { bottom: calc(212 * var(--u)); }
.is-below .fq-step__text { top: calc(30 * var(--u)); }
.is-below .fq-step__proof { top: calc(224 * var(--u)); }

.fq-step__word {
  font-size: calc(40 * var(--u));
  font-weight: 700;
  letter-spacing: -0.032em;
  line-height: 1.05;
}

.fq-step__line {
  margin-top: calc(8 * var(--u));
  color: rgba(243, 241, 247, 0.8);
  font-size: calc(18 * var(--u));
  line-height: 1.4;
}

.fq-step__product {
  margin-top: calc(10 * var(--u));
  color: var(--muted);
  font-size: calc(15 * var(--u));
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* Proofs: each a different object, as the product draws it */
.fq-proof {
  display: flex;
  align-items: center;
  gap: calc(16 * var(--u));
  font-size: calc(16 * var(--u));
}

.fq-proof b { display: block; font-weight: 600; }
.fq-proof span { color: var(--muted); }

.fq-proof--song,
.fq-proof--fan,
.fq-proof--checkin {
  padding: calc(14 * var(--u));
  border-radius: calc(16 * var(--u));
  background: var(--panel);
  box-shadow: inset 0 0 0 1px var(--hair);
}

.fq-proof--song img { width: calc(64 * var(--u)); height: calc(64 * var(--u)); border-radius: calc(8 * var(--u)); }
.fq-proof--song > div { flex: 1; min-width: 0; }

.fq-proof__play {
  flex: none;
  width: calc(40 * var(--u));
  height: calc(40 * var(--u));
  border-radius: 999px;
  background: var(--ink) no-repeat center / 40% url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 12'%3E%3Cpath d='M1 1l8 5-8 5z' fill='%230b0a10'/%3E%3C/svg%3E");
}

.fq-proof--checkin { flex-wrap: wrap; row-gap: calc(12 * var(--u)); }
.fq-proof--checkin b { font-size: calc(20 * var(--u)); }
.fq-proof__qr { flex: none; width: calc(76 * var(--u)); padding: calc(6 * var(--u)); border-radius: calc(8 * var(--u)); background: #fff; }
.fq-proof__qr :deep(svg) { width: 100%; height: auto; }

.fq-proof__button {
  display: block;
  width: 100%;
  text-align: center;
  padding: calc(7 * var(--u)) calc(12 * var(--u));
  border-radius: 999px;
  background: var(--ink);
  color: var(--ground) !important;
  font-size: calc(13 * var(--u));
  font-weight: 600;
  white-space: nowrap;
}

.fq-proof__avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: calc(52 * var(--u));
  height: calc(52 * var(--u));
  border-radius: 999px;
  background: linear-gradient(135deg, #ff6fc4, #9d7bff);
  color: #fff !important;
  font-weight: 700;
}

.fq-proof--gallery { flex-direction: column; align-items: flex-start; gap: calc(14 * var(--u)); }
.fq-proof__stack { position: relative; width: 100%; height: calc(118 * var(--u)); }

.fq-proof__stack img {
  position: absolute;
  left: calc(var(--k) * 62 * var(--u));
  width: calc(92 * var(--u));
  height: calc(114 * var(--u));
  object-fit: cover;
  border-radius: calc(8 * var(--u));
  box-shadow: 0 0 0 calc(3 * var(--u)) var(--ground);
  rotate: calc((var(--k) - 1) * 3deg);
}

.fq-proof__ordinal {
  color: #7ee7ff !important;
  font-size: calc(13 * var(--u));
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.fq-proof--message { flex-direction: column; align-items: flex-start; gap: calc(8 * var(--u)); }

.fq-proof__bubble {
  max-width: 100%;
  padding: calc(12 * var(--u)) calc(16 * var(--u));
  border-radius: calc(16 * var(--u)) calc(16 * var(--u)) calc(16 * var(--u)) calc(4 * var(--u));
  background: var(--ink);
  color: var(--ground);
  font-size: calc(16 * var(--u));
  line-height: 1.4;
}

.fq-proof__bubble.is-fan {
  align-self: flex-end;
  border-radius: calc(16 * var(--u)) calc(16 * var(--u)) calc(4 * var(--u)) calc(16 * var(--u));
  background: var(--panel);
  box-shadow: inset 0 0 0 1px var(--hair);
  color: var(--ink);
}

.fq-proof--chart { flex-direction: column; align-items: stretch; gap: calc(10 * var(--u)); }
.fq-proof--chart svg { width: 100%; height: calc(70 * var(--u)); overflow: visible; }
.fq-proof--chart path { fill: none; stroke: var(--ink); stroke-width: 2; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.fq-proof--chart span b { display: inline; color: var(--ink); }

/* ---------- Phone: the week runs down the page ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-journey { --u: 1px; overflow-x: hidden; overflow-y: auto; }

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

  .fq-journey__title,
  .fq-journey__premise { position: relative; left: auto; right: auto; top: auto; width: auto; }

  .fq-journey__title { font-size: clamp(2.6rem, 12vw, 3.6rem); }
  .fq-journey__premise { margin-top: 1rem; padding-left: 0.75rem; font-size: 0.9375rem; }
  .fq-journey__line, .fq-journey__team { display: none; }

  .fq-journey__steps {
    position: relative;
    margin-top: 2rem;
    padding-left: 1.75rem;
    background: linear-gradient(180deg, #ff6fc4, #9d7bff 55%, #4fd8ee) 0.45rem 0 / 2px 100% no-repeat;
  }

  .fq-step { position: relative; left: auto; top: auto; width: auto; padding-bottom: 2rem; }
  .fq-step__node { left: calc(-1.75rem + 0.5rem - 7px); top: 0.2rem; width: 14px; height: 14px; box-shadow: 0 0 0 4px var(--ground); }

  .fq-step__text,
  .fq-step__proof { position: relative; left: auto; top: auto !important; bottom: auto !important; width: auto; }

  .fq-step__when { font-size: 0.8125rem; }
  .fq-step__text { margin-top: 0.35rem; }
  .fq-step__word { font-size: 1.75rem; }
  .fq-step__line { font-size: 1rem; }
  .fq-step__product { font-size: 0.6875rem; }
  .fq-step__proof { margin-top: 0.85rem; max-width: 20rem; }

  .fq-proof { font-size: 0.875rem; }
}
</style>
