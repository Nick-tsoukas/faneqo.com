<template>
  <article ref="root" class="fq-support" aria-labelledby="fq-support-title">
    <div class="fq-stage">
      <h2 id="fq-support-title" class="fq-support__title">
        <span>Make support</span>
        <em>effortless.</em>
      </h2>

      <p class="fq-support__lede">Tips, merch and show payments go directly to the artist, through their own Stripe account.</p>

      <!-- The three payment cards an artist can switch on (SupportModule.vue) -->
      <ul class="fq-support__ways" aria-label="Payment cards an artist can turn on">
        <li v-for="way in ways" :key="way.title" :class="{ 'is-shown': way.shown }">
          <p class="fq-support__way">{{ way.title }}</p>
          <p class="fq-support__desc">{{ way.desc }}</p>
          <p class="fq-support__how">{{ way.how }}</p>
        </li>
      </ul>

      <!-- The support card, as a fan sees it on the artist's page after the show -->
      <section class="fq-pay" aria-label="After-Show Support on Badflower's page">
        <div class="fq-pay__photo">
          <img :src="'/images/deck-slide-03/badflower-band.png'" alt="Badflower" width="1122" height="1175">
          <p class="fq-pay__artist">Support Badflower</p>
        </div>

        <div class="fq-pay__body">
          <p class="fq-pay__title">After-Show Support</p>
          <p class="fq-pay__note">Thanks for coming out tonight ❤️</p>

          <p class="fq-pay__label">Quick Support</p>
          <div class="fq-pay__amounts">
            <span>$5</span>
            <span class="is-selected">$10</span>
            <span>$20</span>
            <span>Custom</span>
          </div>

          <span class="fq-pay__cta">Support band</span>
          <p class="fq-pay__secure">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v7h-9z" /></svg>
            Secure checkout with Stripe
          </p>
        </div>
      </section>
    </div>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'
// Card titles, descriptions and inputs follow components/smartlink/SupportModule.vue.
// "After-Show Support" is one of the artist-editable support titles (band.paymentButtons).
const ways = [
  { title: 'Support the Band', desc: 'Tips, under a title the artist chooses.', how: '$5 · $10 · $20 · Custom', shown: true },
  { title: 'Merch Table Payment', desc: 'Buying merch at the show? Enter your total and pay securely.', how: 'Fan enters the total' },
  { title: 'Pay Entry', desc: 'Door entry for tonight’s show.', how: 'Set by the artist' },
]

// The support card comes together the way a fan meets it: the artist, the
// moment, one amount chosen, then the action. No payment ever completes.
const root = ref(null)
useSceneMotion(root, (tl, { q, phone }) => {
  revealLines(tl, q('.fq-support__title span, .fq-support__title em'), 0)
  arrive(tl, q('.fq-support__lede'), 0.65, { y: 12 })
  arrive(tl, q('.fq-support__ways li'), 1.0, { x: phone ? 0 : -18, y: phone ? 12 : 0, stagger: 0.12 })

  arrive(tl, q('.fq-pay'), 0.3, { y: 36, duration: 1.0, ease: 'expo.out' })
  settle(tl, q('.fq-pay__photo img'), 0.3, { duration: 2.0, scale: 1.08 })
  arrive(tl, q('.fq-pay__artist'), 0.95, { y: 14 })
  arrive(tl, q('.fq-pay__title, .fq-pay__note'), 1.25, { y: 10, stagger: 0.1, duration: 0.6 })
  arrive(tl, q('.fq-pay__label'), 1.55, { y: 6, duration: 0.5 })
  // No transform clear here: it would land mid-pulse on the selected chip (below) and snap it
  arrive(tl, q('.fq-pay__amounts span'), 1.6, { y: 12, stagger: 0.07, duration: 0.55, clearProps: 'visibility' })
  // One amount is chosen: the ivory selection blooms from the chip's centre
  tl.from(q('.fq-pay__amounts .is-selected'), { backgroundColor: 'rgba(242, 236, 226, 0)', color: '#f2ece2', duration: 0.45, ease: 'power2.out', clearProps: 'backgroundColor,color' }, 2.2)
    .to(q('.fq-pay__amounts .is-selected'), { scale: 1.06, duration: 0.22, ease: 'power2.out', yoyo: true, repeat: 1, clearProps: 'transform,opacity,visibility' }, 2.2)
  arrive(tl, q('.fq-pay__cta'), 2.55, { y: 14, duration: 0.7 })
  arrive(tl, q('.fq-pay__secure'), 2.85, { y: 0, duration: 0.6 })
})
</script>

<style scoped>
.fq-support {
  --u: calc(min(100cqw, 177.78cqh) / 1920);
  --ground: #161412;
  --card: #1f1c19;
  --ivory: #f2ece2;
  --muted: rgba(242, 236, 226, 0.62);
  --hair: rgba(242, 236, 226, 0.13);
  --serif: 'DM Serif Display', 'Iowan Old Style', Georgia, serif;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--ground);
  color: var(--ivory);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.fq-support *, .fq-support *::before, .fq-support *::after { box-sizing: border-box; }
:where(.fq-support) :where(p, h2, ul) { margin: 0; padding: 0; }
.fq-support img, .fq-support svg { display: block; }

.fq-stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: calc(1920 * var(--u));
  height: calc(1080 * var(--u));
  transform: translate(-50%, -50%);
}

.fq-support__title {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(112 * var(--u));
  font-family: var(--serif);
  font-size: calc(136 * var(--u));
  font-weight: 400;
  letter-spacing: -0.028em;
  line-height: 0.94;
}

.fq-support__title span,
.fq-support__title em { display: block; }
.fq-support__title em { font-style: italic; }

.fq-support__lede {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(408 * var(--u));
  width: calc(600 * var(--u));
  color: var(--muted);
  font-size: calc(26 * var(--u));
  line-height: 1.45;
}

/* The menu of payment cards: set like a price list, not a feature grid */
.fq-support__ways {
  position: absolute;
  left: calc(128 * var(--u));
  top: calc(600 * var(--u));
  width: calc(720 * var(--u));
  list-style: none;
  border-bottom: 1px solid var(--hair);
}

.fq-support__ways li {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: calc(32 * var(--u));
  padding: calc(22 * var(--u)) 0;
  border-top: 1px solid var(--hair);
  color: var(--muted);
}

.fq-support__ways li.is-shown { color: var(--ivory); }

.fq-support__way {
  font-size: calc(28 * var(--u));
  font-weight: 600;
  letter-spacing: -0.01em;
}

.fq-support__how {
  grid-row: 1;
  grid-column: 2;
  align-self: center;
  font-size: calc(18 * var(--u));
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.fq-support__desc {
  grid-column: 1 / -1;
  margin-top: calc(4 * var(--u));
  color: var(--muted);
  font-size: calc(18 * var(--u));
  line-height: 1.45;
}

.fq-support__ways li:not(.is-shown) .fq-support__desc { color: rgba(242, 236, 226, 0.46); }

/* The card: large enough to read from the back of the room */
.fq-pay {
  position: absolute;
  left: calc(1008 * var(--u));
  top: calc(112 * var(--u));
  width: calc(784 * var(--u));
  overflow: hidden;
  border-radius: calc(28 * var(--u));
  background: var(--card);
  box-shadow:
    inset 0 0 0 1px var(--hair),
    0 calc(40 * var(--u)) calc(90 * var(--u)) calc(-40 * var(--u)) rgba(0, 0, 0, 0.7);
}

.fq-pay__photo {
  position: relative;
  height: calc(370 * var(--u));
}

.fq-pay__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 30%;
  filter: saturate(0.85);
}

.fq-pay__photo::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(31, 28, 25, 0) 45%, rgba(31, 28, 25, 0.6) 75%, var(--card) 100%);
}

.fq-pay__artist {
  position: absolute;
  z-index: 1;
  left: calc(52 * var(--u));
  bottom: calc(18 * var(--u));
  font-size: calc(40 * var(--u));
  font-weight: 700;
  letter-spacing: -0.02em;
}

.fq-pay__body { padding: calc(28 * var(--u)) calc(52 * var(--u)) calc(44 * var(--u)); }

.fq-pay__title {
  font-size: calc(30 * var(--u));
  font-weight: 600;
}

.fq-pay__note {
  margin-top: calc(6 * var(--u));
  color: var(--muted);
  font-size: calc(22 * var(--u));
}

.fq-pay__label {
  margin-top: calc(36 * var(--u));
  color: var(--muted);
  font-size: calc(17 * var(--u));
  font-weight: 500;
}

.fq-pay__amounts {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: calc(14 * var(--u));
  margin-top: calc(14 * var(--u));
}

.fq-pay__amounts span {
  display: grid;
  place-items: center;
  height: calc(80 * var(--u));
  border-radius: calc(16 * var(--u));
  box-shadow: inset 0 0 0 1px rgba(242, 236, 226, 0.2);
  font-size: calc(28 * var(--u));
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.fq-pay__amounts span:last-child { font-size: calc(22 * var(--u)); }

.fq-pay__amounts .is-selected {
  background: var(--ivory);
  box-shadow: none;
  color: var(--ground);
}

/* The one place brand colour appears: a hairline under the action */
.fq-pay__cta {
  position: relative;
  display: grid;
  place-items: center;
  height: calc(84 * var(--u));
  margin-top: calc(28 * var(--u));
  border-radius: calc(16 * var(--u));
  background: var(--ivory);
  color: var(--ground);
  font-size: calc(26 * var(--u));
  font-weight: 700;
  overflow: hidden;
}

.fq-pay__cta::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: calc(4 * var(--u));
  background: linear-gradient(90deg, #ff4fd8, #8b6cff, #39d5ff);
}

.fq-pay__secure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(10 * var(--u));
  margin-top: calc(20 * var(--u));
  color: var(--muted);
  font-size: calc(17 * var(--u));
}

.fq-pay__secure svg {
  width: calc(16 * var(--u));
  height: calc(16 * var(--u));
  fill: none;
  stroke: currentColor;
  stroke-width: 1.4;
}

/* ---------- Phone ---------- */
@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-support { --u: 1px; overflow-x: hidden; overflow-y: auto; }

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
    padding: calc(2.5rem + env(safe-area-inset-top, 0px)) 1.25rem calc(6.5rem + env(safe-area-inset-bottom, 0px));
    transform: none;
  }

  .fq-support__title,
  .fq-support__lede,
  .fq-support__ways,
  .fq-pay { position: relative; left: auto; top: auto; width: auto; }

  .fq-support__title { font-size: clamp(2.6rem, 12vw, 3.6rem); }
  .fq-support__lede { margin-top: 1rem; font-size: 1.0625rem; }

  .fq-pay { order: 1; margin-top: 1.75rem; border-radius: 1.25rem; }
  .fq-pay__photo { height: 11rem; }
  .fq-pay__artist { left: 1.25rem; bottom: 0.75rem; font-size: 1.5rem; }
  .fq-pay__body { padding: 1rem 1.25rem 1.5rem; }
  .fq-pay__title { font-size: 1.25rem; }
  .fq-pay__note { font-size: 1rem; }
  .fq-pay__label { margin-top: 1.25rem; font-size: 0.875rem; }
  .fq-pay__amounts { gap: 0.5rem; margin-top: 0.5rem; }
  .fq-pay__amounts span { height: 3.25rem; border-radius: 0.75rem; font-size: 1.125rem; }
  .fq-pay__amounts span:last-child { font-size: 0.9375rem; }
  .fq-pay__cta { height: 3.5rem; margin-top: 1rem; border-radius: 0.75rem; font-size: 1.0625rem; }
  .fq-pay__cta::after { height: 3px; }
  .fq-pay__secure { margin-top: 0.75rem; font-size: 0.8125rem; }
  .fq-pay__secure svg { width: 0.875rem; height: 0.875rem; }

  .fq-support__ways { order: 2; margin-top: 2rem; }
  .fq-support__ways li { padding: 0.9rem 0; column-gap: 1rem; }
  .fq-support__way { font-size: 1.0625rem; }
  .fq-support__how { font-size: 0.8125rem; }
  .fq-support__desc { font-size: 0.875rem; }
}
</style>
