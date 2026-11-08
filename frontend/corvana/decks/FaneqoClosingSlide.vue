<template>
  <article ref="root" class="fq-close" aria-labelledby="fq-close-title">
    <div class="fq-close__photo" aria-hidden="true">
      <img :src="'/images/deck-flagship/ffdp-closing.jpg'" alt="" width="2048" height="1345">
    </div>

    <!-- The opening set its line solid over a faint echo. The close inverts it:
         the show fades to an outline; the relationship stays solid. -->
    <h2 id="fq-close-title" class="fq-close__type">
      <span class="fq-close__fading">The show ends.</span>
      <span class="fq-close__solid">The relationship</span>
      <span class="fq-close__solid">doesn’t.</span>
    </h2>

    <footer class="fq-close__brand">
      <img :src="'/faneqo-wordmark-editorial.png?v=2'" alt="Faneqo" width="3398" height="901">
      <span class="fq-close__rule" aria-hidden="true"></span>
      <p>faneqo.com</p>
    </footer>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'

// The last beat: the show ends, a pause, and the relationship holds.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  settle(tl, q('.fq-close__photo img'), 0, { duration: 3.0, scale: 1.07 })
  revealLines(tl, q('.fq-close__fading'), 0.6, { duration: 1.2 })
  revealLines(tl, q('.fq-close__solid'), 2.0, { stagger: 0.32, duration: 1.2 })
  arrive(tl, q('.fq-close__brand img'), 3.1, { y: 8 })
  tl.from(q('.fq-close__rule'), { scaleX: 0, transformOrigin: '0% 50%', duration: 0.7, ease: 'power2.inOut', clearProps: 'transform' }, 3.3)
  arrive(tl, q('.fq-close__brand p'), 3.5, { y: 0, duration: 0.6 })
})
</script>

<style scoped>
/* Built with the opening slide's own measures (cqh/cqw, --pad-x) so the two bookend each other. */
.fq-close {
  --pad-x: clamp(1.4rem, 4cqw, 4rem);
  --ink: #f7f9fc;
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
}

.fq-close *, .fq-close *::before, .fq-close *::after { box-sizing: border-box; }

/* The singer, arms open to the room, set to the right and masked into black */
.fq-close__photo {
  position: absolute;
  inset: 0 0 0 40%;
}

.fq-close__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 18%;
  filter: brightness(0.78) contrast(1.06);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, black 34%, black 94%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 8%, black 70%, transparent 100%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, black 34%, black 94%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 8%, black 70%, transparent 100%);
  mask-composite: intersect;
}

.fq-close__type {
  position: absolute;
  z-index: 2;
  left: var(--pad-x);
  bottom: clamp(9rem, 22cqh, 17rem);
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.034em;
  line-height: 0.98;
  font-size: min(12.5cqh, 7cqw);
}

.fq-close__type span { display: block; }

.fq-close__fading {
  color: transparent;
  -webkit-text-stroke: 2px rgba(226, 233, 245, 0.62);
}

.fq-close__solid {
  color: var(--ink);
  text-shadow: 0 2px 30px rgba(5, 5, 6, 0.45);
}

.fq-close__brand {
  position: absolute;
  z-index: 2;
  left: var(--pad-x);
  bottom: clamp(4.4rem, 9cqh, 6.4rem);
  display: flex;
  align-items: center;
  gap: clamp(0.8rem, 1.4cqw, 1.3rem);
}

.fq-close__brand img {
  display: block;
  width: clamp(7rem, 9.5cqw, 8.6rem);
  height: auto;
}

.fq-close__rule {
  width: clamp(2.2rem, 3.4cqw, 3.2rem);
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, #ff4fd8, #8b6cff, #39d5ff);
}

.fq-close__brand p {
  margin: 0;
  color: rgba(247, 249, 252, 0.82);
  font-size: clamp(0.85rem, 1.7cqh, 1.05rem);
  font-weight: 500;
  letter-spacing: 0.04em;
}

@media (max-width: 900px), (max-aspect-ratio: 5/4) {
  .fq-close__photo { inset: 0 -20% 34% 0; }
  .fq-close__photo img {
    object-position: 50% 20%;
    -webkit-mask-image: linear-gradient(180deg, black 60%, transparent 100%);
    mask-image: linear-gradient(180deg, black 60%, transparent 100%);
  }
  .fq-close__type { bottom: 11rem; right: var(--pad-x); font-size: clamp(2.3rem, 10.5vw, 3.3rem); }
  .fq-close__brand { bottom: 6.75rem; }
}
</style>
