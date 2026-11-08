<template>
  <section
    id="features"
    ref="rootEl"
    class="v2-hq"
    aria-label="Your band’s headquarters"
  >
    <div class="v2-hq__board">
      <header class="v2-hq__copy">
        <p class="v2-hq__eyebrow">Artist Page</p>
        <h2 class="v2-hq__title">
          Your band’s
          <span>headquarters.</span>
        </h2>
      </header>

      <div class="v2-hq__product" aria-hidden="true">
        <DemoArtistProfileShowcase
          mode="viewport"
          :artist="artist"
          :animated="false"
          wake-up
          wake-variant="headquarters"
          priority
        />
      </div>
    </div>

    <div class="v2-hq__night">
      <p class="v2-hq__whisper">{{ hq.show.kicker }}</p>
      <p class="v2-hq__city">{{ hq.show.city }}</p>
      <p class="v2-hq__venue">{{ hq.show.venue }}</p>
      <div class="v2-hq__bill-row">
        <p class="v2-hq__when">{{ hq.show.date }} · {{ hq.show.time }}</p>
        <span class="v2-hq__text-cta">{{ hq.show.cta }} →</span>
      </div>
    </div>

    <div class="v2-hq__cut" aria-hidden="true"></div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import { HOME_V2_HQ_DEMO } from '~/utils/home-v2/headquartersDemo.js'

defineProps({
  artist: { type: Object, required: true },
})

const hq = HOME_V2_HQ_DEMO
const rootEl = ref(null)
let ctx = null

onMounted(async () => {
  await nextTick()
  if (!rootEl.value || typeof window === 'undefined') return
  gsap.registerPlugin(ScrollTrigger)
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  ctx = gsap.context(() => {
    gsap.from('.v2-hq__night', {
      autoAlpha: 0,
      y: 16,
      duration: 0.55,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.v2-hq__night',
        start: 'top 88%',
        once: true,
      },
    })
  }, rootEl.value)
})

onUnmounted(() => {
  ctx?.revert()
  ctx = null
})
</script>

<style scoped>
.v2-hq {
  position: relative;
  z-index: 10;
  padding: 0.15rem 0 0;
  color: #f5f5f6;
  background: #050506;
}

.v2-hq__copy {
  width: min(100%, 1280px);
  margin: 0 auto 0.7rem;
  padding-inline: 1.25rem;
}

.v2-hq__eyebrow {
  margin: 0 0 0.38rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #f472b6;
}

.v2-hq__title {
  margin: 0;
  font-size: clamp(2.35rem, 8.5vw, 3.7rem);
  font-weight: 800;
  line-height: 0.94;
  letter-spacing: -0.05em;
}

.v2-hq__title span {
  background: linear-gradient(90deg, #f472b6, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v2-hq__product {
  width: 100%;
  overflow: hidden;
  background: #000;
  pointer-events: none;
}

.v2-hq__night {
  width: min(100%, 1280px);
  margin: 0 auto;
  padding: 3.1rem 1.25rem 0.4rem;
}

.v2-hq__whisper {
  margin: 0 0 0.4rem;
  font-size: 0.58rem;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.34);
}

.v2-hq__city {
  margin: 0 0 0 -0.06em;
  font-size: clamp(4.4rem, 21vw, 6.4rem);
  font-weight: 800;
  letter-spacing: -0.07em;
  line-height: 0.82;
  text-transform: uppercase;
}

.v2-hq__venue {
  margin: 0.7rem 0 0;
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.v2-hq__bill-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.35rem;
}

.v2-hq__when {
  margin: 0;
  font-size: 0.76rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.44);
}

.v2-hq__text-cta {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #45d6a7;
  white-space: nowrap;
}

.v2-hq__cut {
  height: clamp(3.4rem, 11vh, 7.5rem);
  background: #050506;
}

@media (min-width: 1024px) {
  .v2-hq {
    padding: 0.4rem 1.75rem 0;
  }

  .v2-hq__board {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(30rem, 32.5rem);
    align-items: center;
    column-gap: 3.25rem;
    width: min(100%, 1280px);
    margin-inline: auto;
  }

  .v2-hq__copy {
    width: auto;
    margin: 0;
    padding-inline: 0;
    align-self: center;
  }

  .v2-hq__title {
    font-size: clamp(3.15rem, 4.6vw, 4.15rem);
  }

  .v2-hq__product {
    width: 100%;
    border-radius: 2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: #0e0f13;
    box-shadow: 0 28px 64px rgba(0, 0, 0, 0.42);
  }

  .v2-hq__night {
    padding: 3.6rem 0 0.2rem;
  }

  .v2-hq__city {
    font-size: clamp(5.6rem, 9vw, 8.4rem);
  }
}

@media (prefers-reduced-motion: reduce) {
  .v2-hq__night {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }
}
</style>
