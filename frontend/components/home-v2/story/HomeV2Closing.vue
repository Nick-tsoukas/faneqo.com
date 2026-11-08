<template>
  <section ref="root" class="close" aria-labelledby="close-title">
    <div class="close__photo" aria-hidden="true">
      <img :src="photo" alt="" width="2048" height="1345" loading="lazy" decoding="async">
    </div>

    <div class="close__inner">
      <p class="close__kicker">One more show.</p>
      <h2 id="close-title" class="close__title">
        <span class="close__line">Your next fan</span>
        <span class="close__line close__line--fading">shouldn’t disappear</span>
        <span class="close__line close__line--payoff">after tonight.</span>
      </h2>

      <div class="close__action">
        <NuxtLink to="/signup" class="close__cta" data-cta="home-close-signup">
          Start free
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
        </NuxtLink>
        <p class="close__trust">Free account. Pro included for 30 days. No card required.</p>
      </div>

      <NuxtLink to="/presentation" class="close__secondary" data-cta="home-close-presentation">Watch the presentation</NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useHomeStoryMotion, revealLines, arrive, settle } from '~/composables/home-v2/useHomeStoryMotion'

// The flagship presentation's closing photograph, so the page ends where the deck does.
const photo = '/images/deck-flagship/ffdp-closing.jpg'

// The last beat: the line lands, a pause, then the payoff and the one action.
const root = ref(null)
useHomeStoryMotion(root, (tl, { q }) => {
  settle(tl, q('.close__photo img'), 0, { duration: 2.4, scale: 1.06 })
  arrive(tl, q('.close__kicker'), 0.2, { y: 8 })
  revealLines(tl, q('.close__line:not(.close__line--payoff)'), 0.35, { stagger: 0.3, duration: 1.1 })
  revealLines(tl, q('.close__line--payoff'), 1.45, { duration: 1.1 })
  arrive(tl, q('.close__cta'), 2.1, { y: 14, duration: 0.7 })
  arrive(tl, q('.close__trust, .close__secondary'), 2.35, { y: 6, stagger: 0.1 })
}, { threshold: 0.35 })
</script>

<style scoped>
.close {
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  --ink: #f7f9fc;
  position: relative;
  z-index: 10;
  overflow: hidden;
  background: #050506;
  color: var(--ink);
}

.close *, .close *::before, .close *::after { box-sizing: border-box; }
:where(.close) :where(p, h2) { margin: 0; }
.close img, .close svg { display: block; }

/* The singer, arms open, set right and masked into black — the deck's last frame */
.close__photo { position: absolute; inset: 0 0 0 42%; }

.close__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 18%;
  filter: brightness(0.72) contrast(1.06);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, black 38%, black 94%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 10%, black 72%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, black 38%, black 94%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 10%, black 72%, transparent 100%);
  mask-composite: intersect;
}

.close__inner {
  position: relative;
  z-index: 1;
  max-width: 82rem;
  margin: 0 auto;
  padding: clamp(6rem, 12vw, 10rem) clamp(1.25rem, 5vw, 4.5rem);
}

.close__kicker { color: rgba(247, 249, 252, 0.6); font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; }

.close__title {
  margin-top: 1.25rem;
  font-size: clamp(2.8rem, 7vw, 6.4rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.96;
}

.close__line { display: block; }

.close__line--fading {
  color: transparent;
  -webkit-text-stroke: 2px rgba(226, 233, 245, 0.62);
}

.close__line--payoff {
  background: linear-gradient(90deg, #ff4fd8, #8b6cff 50%, #39d5ff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.close__action { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem 1.5rem; margin-top: 2.75rem; }

.close__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 3.9rem;
  padding: 0 2.2rem;
  border-radius: 0.9rem;
  background: linear-gradient(90deg, #ff4fd8, #8b6cff);
  box-shadow: 0 16px 40px -12px rgba(255, 79, 216, 0.55), 0 0 0 1px rgba(76, 166, 255, 0.22);
  color: #fff;
  font-size: 1.1875rem;
  font-weight: 750;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.close__cta:hover { transform: translateY(-2px); box-shadow: 0 20px 48px -12px rgba(255, 79, 216, 0.62), 0 0 0 1px rgba(76, 166, 255, 0.32); }
.close__cta:focus-visible, .close__secondary:focus-visible { outline: 2px solid #39d5ff; outline-offset: 4px; }
.close__cta svg { width: 1.25rem; height: 1.25rem; fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.2s ease; }
.close__cta:hover svg { transform: translateX(3px); }

.close__trust { color: rgba(247, 249, 252, 0.62); font-size: 0.9375rem; }

.close__secondary {
  display: inline-block;
  margin-top: 1.75rem;
  border-bottom: 1px solid rgba(247, 249, 252, 0.35);
  color: rgba(247, 249, 252, 0.78);
  font-size: 0.9375rem;
  font-weight: 500;
  text-decoration: none;
}

.close__secondary:hover { color: #fff; border-color: #fff; }

@media (max-width: 860px) {
  .close__photo { inset: 0 -30% 40% 0; opacity: 0.7; }
  .close__photo img {
    object-position: 60% 15%;
    -webkit-mask-image: linear-gradient(180deg, black 40%, transparent 100%);
    mask-image: linear-gradient(180deg, black 40%, transparent 100%);
  }
  .close__inner { padding-top: 14rem; }
  .close__line--fading { -webkit-text-stroke-width: 1.5px; }
  .close__cta { width: 100%; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .close__cta, .close__cta svg { transition: none; }
}
</style>
