<template>
  <article ref="root" class="fq-cover">
    <div class="fq-cover__photo" aria-hidden="true">
      <img
        src="/images/homepage/artists/badflower-hero.webp"
        alt=""
        width="1000"
        height="1500"
        fetchpriority="high"
      >
    </div>

    <div class="fq-cover__type">
      <h1 class="fq-cover__solid">
        <span>Every artist</span>
        <span>has a world.</span>
      </h1>
      <p class="fq-cover__echo" aria-hidden="true">
        <span>Every artist</span>
        <span>has a world.</span>
      </p>
    </div>

    <header class="fq-cover__brand">
      <img :src="'/faneqo-wordmark-editorial.png?v=2'" alt="Faneqo" width="3398" height="901">
    </header>

    <footer class="fq-cover__footer">
      <span class="fq-cover__rule" aria-hidden="true"></span>
      <p>Music. Shows. Connection.</p>
    </footer>
  </article>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneMotion, revealLines, arrive, settle } from './motion/useSceneMotion.js'

// Arrival: the photograph settles, the line lands in two beats, then the brand.
const root = ref(null)
useSceneMotion(root, (tl, { q }) => {
  settle(tl, q('.fq-cover__photo img'), 0, { duration: 2.6, scale: 1.08 })
  revealLines(tl, q('.fq-cover__solid span'), 0.45, { stagger: 0.24, duration: 1.2 })
  arrive(tl, q('.fq-cover__echo'), 1.2, { y: 0, duration: 1.4 })
  arrive(tl, q('.fq-cover__brand'), 1.5, { y: -8 })
  tl.from(q('.fq-cover__rule'), { scaleX: 0, transformOrigin: '0 50%', duration: 0.8, clearProps: 'transform' }, 1.8)
  arrive(tl, q('.fq-cover__footer p'), 1.95, { y: 8 })
})
</script>

<style scoped>
.fq-cover {
  --pad-x: clamp(1.4rem, 4cqw, 4rem);
  --ink: #f7f9fc;
  box-sizing: border-box;
  container-type: size;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #050506;
  color: var(--ink);
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  text-rendering: optimizeLegibility;
}

.fq-cover *,
.fq-cover *::before,
.fq-cover *::after {
  box-sizing: border-box;
}

/* --- The portrait: one image, masked into the canvas on all four edges --- */
.fq-cover__photo {
  position: absolute;
  z-index: 2;
  inset: 0 0 0 30%;
}

.fq-cover__photo img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 9%;
  filter: brightness(0.86);
  -webkit-mask-image:
    linear-gradient(90deg, transparent 0%, black 22%, black 90%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 6%, black 76%, transparent 98%);
  -webkit-mask-composite: source-in;
  mask-image:
    linear-gradient(90deg, transparent 0%, black 22%, black 90%, transparent 100%),
    linear-gradient(180deg, transparent 0%, black 6%, black 76%, transparent 98%);
  mask-composite: intersect;
}

/* --- Typography: solid above the portrait, quiet echo beneath --- */
.fq-cover__type {
  position: absolute;
  left: var(--pad-x);
  top: clamp(4.5rem, 24cqh, 18rem);
  pointer-events: none;
}

.fq-cover__solid,
.fq-cover__echo {
  margin: 0;
  font-weight: 800;
  letter-spacing: -0.034em;
  line-height: 0.98;
}

.fq-cover__solid span,
.fq-cover__echo span {
  display: block;
}

.fq-cover__solid {
  position: relative;
  z-index: 4;
  color: var(--ink);
  font-size: min(15.5cqh, 8.6cqw);
  text-shadow: 0 2px 30px rgba(5, 5, 6, 0.35);
}

.fq-cover__echo {
  position: relative;
  z-index: 1;
  margin-top: -0.16em;
  margin-left: 0.4rem;
  font-size: min(15.5cqh, 8.6cqw);
  color: transparent;
  -webkit-text-stroke: 1.25px rgba(226, 233, 245, 0.085);
  mask-image: linear-gradient(180deg, black 42%, rgba(0, 0, 0, 0.45) 74%, transparent 100%);
  -webkit-mask-image: linear-gradient(180deg, black 42%, rgba(0, 0, 0, 0.45) 74%, transparent 100%);
}

/* --- Brand --- */
.fq-cover__brand {
  position: absolute;
  z-index: 5;
  top: clamp(1.1rem, 2.4cqh, 1.8rem);
  left: var(--pad-x);
}

.fq-cover__brand img {
  display: block;
  width: clamp(7.2rem, 11cqw, 9.5rem);
  height: auto;
}

/* --- Footer --- */
.fq-cover__footer {
  position: absolute;
  z-index: 5;
  left: var(--pad-x);
  bottom: clamp(4.4rem, 8.5cqh, 6.2rem);
}

.fq-cover__rule {
  display: block;
  width: clamp(3rem, 5cqw, 4.6rem);
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, #ff4fd8, #8b6cff, #39d5ff);
}

.fq-cover__footer p {
  margin: 0.8rem 0 0;
  color: rgba(247, 249, 252, 0.92);
  font-size: clamp(0.85rem, 1.9cqh, 1.08rem);
  font-weight: 500;
  letter-spacing: 0.045em;
}

/* --- Responsive --- */
@media (max-width: 1100px) {
  .fq-cover__photo {
    left: 24%;
  }
}

@media (max-width: 900px) {
  .fq-cover__photo {
    left: 12%;
    right: -10%;
  }
}

@media (max-width: 640px) {
  .fq-cover__type {
    top: 26%;
  }

  .fq-cover__solid,
  .fq-cover__echo {
    font-size: min(9cqh, 11.5cqw);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fq-cover *,
  .fq-cover *::before,
  .fq-cover *::after {
    animation: none !important;
    transition: none !important;
  }
}
</style>
