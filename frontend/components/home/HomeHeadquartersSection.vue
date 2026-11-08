<template>
  <!-- Homepage headquarters: mobile opening product, editorial desktop scale. -->
  <section
    id="features"
    ref="hqRoot"
    class="home-hq relative z-10 px-4 sm:px-6 lg:px-8 pt-2 pb-10 sm:pt-5 sm:pb-12 lg:pt-12 lg:pb-20"
    :class="{ 'is-lit': stageLive }"
  >
    <div class="home-hq-stage" aria-hidden="true">
      <div class="home-hq-beam home-hq-beam--hot"></div>
      <div class="home-hq-beam home-hq-beam--cool"></div>
      <div class="home-hq-beam home-hq-beam--sea"></div>
    </div>

    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="home-hq-lead mb-3 sm:mb-5 lg:mb-8">
        <p class="home-hq-kicker">
          <span>Artist Page</span>
          <HomeEchoPulse ref="echoRef" class="home-hq-echo" />
        </p>
        <h2 class="home-hq-title">
          <span class="home-hq-phrase">Your band’s</span>
          <span class="home-hq-word">headquarters.</span>
        </h2>
        <p class="home-hq-support">
          <span class="home-hq-support__lead">Your music. Your shows. Your fans.</span>
          <span class="home-hq-support__quiet">One place they can come back to.</span>
        </p>
      </div>

      <div class="home-hq-frame">
        <p class="home-hq-note home-hq-note--music" aria-hidden="true">Your music.</p>
        <p class="home-hq-note home-hq-note--fans" aria-hidden="true">Your fans.</p>
        <div class="home-hq-mockup relative w-full">
          <!--
            Mobile: this phone is the opening product / LCP.
            Desktop: hero phone already owns LCP → keep this lazy.
          -->
          <DemoArtistProfileShowcase
            :artist="artist"
            :compact="false"
            :animated="true"
            :priority="hqPriority"
            product-reveal
            lite
            real-fan-list
          />
        </div>
        <p class="home-hq-note home-hq-note--page" aria-hidden="true">Your page.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import HomeEchoPulse from '@/components/home/HomeEchoPulse.vue'
import {
  homePrefersReducedMotion,
  observeHomeScrollReveals,
  playHomeHeadquartersReveal,
} from '@/utils/ui/homeProductReveal'

const props = defineProps({
  artist: { type: Object, required: true },
  showHeroShowcase: { type: Boolean, default: true },
})

const hqRoot = ref(null)
const echoRef = ref(null)
const stageLive = ref(false)
const hqPriority = ref(true)
let observer = null
let ctx
let played = false
let stopScrollReveals = null

function isDesktop() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
}

function playEntrance(scope) {
  if (played) return
  played = true
  ctx = gsap.context(() => {
    playHomeHeadquartersReveal(gsap, scope, echoRef.value)
    stopScrollReveals = observeHomeScrollReveals(gsap, scope)
  }, scope)
}

onMounted(async () => {
  await nextTick()
  if (typeof window !== 'undefined') {
    hqPriority.value = !(props.showHeroShowcase && isDesktop())
  }
  if (!hqRoot.value) return
  if (homePrefersReducedMotion()) {
    played = true
    return
  }
  if (!isDesktop()) {
    playEntrance(hqRoot.value)
    return
  }
  if (typeof IntersectionObserver === 'undefined') {
    playEntrance(hqRoot.value)
    return
  }
  observer = new IntersectionObserver(
    ([entry]) => {
      const live = !!(entry?.isIntersecting)
      stageLive.value = live
      if (entry?.isIntersecting && hqRoot.value) {
        playEntrance(hqRoot.value)
        observer?.disconnect()
      }
    },
    { root: null, threshold: 0.18, rootMargin: '40px' }
  )
  observer.observe(hqRoot.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
  stageLive.value = false
  stopScrollReveals?.()
  stopScrollReveals = null
  ctx?.revert()
})
</script>

<style scoped>
.home-hq {
  background: #050608;
}

.home-hq-stage {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
}

.home-hq-beam {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.home-hq-beam--hot {
  width: min(42rem, 120%);
  height: min(42rem, 120%);
  left: -22%;
  top: -18%;
  background: radial-gradient(
    circle,
    rgba(255, 79, 216, 0.16) 0%,
    rgba(139, 108, 255, 0.1) 38%,
    transparent 72%
  );
    opacity: 0.48;
}

.home-hq-beam--cool {
  width: min(34rem, 88%);
  height: min(34rem, 88%);
  right: -14%;
  top: 0;
  background: radial-gradient(
    circle,
    rgba(76, 166, 255, 0.14) 0%,
    rgba(57, 213, 255, 0.07) 40%,
    transparent 72%
  );
  opacity: 0.42;
}

.home-hq-beam--sea {
  width: min(16rem, 48%);
  height: min(16rem, 48%);
  left: 58%;
  bottom: 18%;
  background: radial-gradient(circle, rgba(69, 227, 174, 0.08) 0%, transparent 70%);
  opacity: 0.2;
}

@media (min-width: 1024px) {
  .home-hq.is-lit .home-hq-beam--hot {
    animation: hqBeamHot 14s ease-in-out infinite alternate;
  }

  .home-hq.is-lit .home-hq-beam--cool {
    animation: hqBeamCool 16s ease-in-out infinite alternate;
  }

  .home-hq.is-lit .home-hq-beam--sea {
    animation: hqBeamSea 18s ease-in-out infinite alternate;
  }
}

@keyframes hqBeamHot {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: 0.42; }
  to { transform: translate3d(4%, 3%, 0) scale(1.06); opacity: 0.56; }
}

@keyframes hqBeamCool {
  from { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
  to { transform: translate3d(-4%, 3%, 0) scale(1.04); opacity: 0.55; }
}

@keyframes hqBeamSea {
  from { transform: translate3d(0, 0, 0); opacity: 0.22; }
  to { transform: translate3d(2%, -2%, 0); opacity: 0.32; }
}

@media (max-width: 1023px) {
  .home-hq-beam--hot,
  .home-hq-beam--cool,
  .home-hq-beam--sea {
    animation: none;
    opacity: 0.42;
  }

  .home-hq-beam--sea {
    opacity: 0.22;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home-hq-beam--hot,
  .home-hq-beam--cool,
  .home-hq-beam--sea {
    animation: none !important;
  }

  .home-hq-kicker,
  .home-hq-phrase,
  .home-hq-word,
  .home-hq-support,
  .home-hq-note,
  .home-hq-mockup,
  .home-hq [data-reveal],
  .home-hq [data-reveal-later] {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}

.home-hq-kicker {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0 0 0.16rem;
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: #c4b5fd;
}

.home-hq-echo {
  letter-spacing: 0;
  margin-left: 0.05rem;
}

.home-hq-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 0;
  overflow: visible;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  font-weight: 800;
  color: #f7f9fc;
}

.home-hq-phrase,
.home-hq-word {
  display: block;
  margin: 0;
  padding: 0;
  max-width: 100%;
  overflow: visible;
}

.home-hq-phrase {
  font-size: clamp(2.58rem, 12vw, 3.05rem);
  font-weight: 800;
  line-height: 0.96;
  letter-spacing: -0.032em;
  color: #f7f9fc;
}

.home-hq-word {
  padding: 0.04em 0 0.2em;
  overflow: visible;
  font-size: clamp(2.58rem, 12vw, 3.05rem);
  font-weight: 800;
  line-height: 1.12;
  letter-spacing: -0.058em;
  background-image: linear-gradient(90deg, #8b6cff 0%, #f04fcf 62%, #ff6ad5 100%);
  background-size: 160% 100%;
  background-position: var(--hq-word-pos, 0%) 50%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}

.home-hq-support {
  display: flex;
  flex-direction: column;
  gap: 0.14rem;
  margin: 0.58rem 0 0;
  max-width: 21rem;
}

.home-hq-support__lead {
  font-size: clamp(0.9375rem, 4.1vw, 1.025rem);
  font-weight: 500;
  line-height: 1.26;
  letter-spacing: -0.018em;
  color: rgba(247, 249, 252, 0.84);
}

.home-hq-support__quiet {
  font-size: 0.9rem;
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.012em;
  color: rgba(247, 249, 252, 0.58);
}

@media (min-width: 1024px) {
  .home-hq-lead {
    margin: 0 auto 2rem;
    max-width: 54rem;
    text-align: center;
  }

  .home-hq-kicker {
    justify-content: center;
    margin-bottom: 0.85rem;
    font-size: 0.6875rem;
    letter-spacing: 0.22em;
    color: #c4b5fd;
  }

  .home-hq-title {
    display: block;
    width: 100%;
    font-size: clamp(2.55rem, 3.35vw, 3.55rem);
    line-height: 1.14;
    letter-spacing: -0.05em;
    text-align: center;
  }

  .home-hq-support__lead {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .home-hq-phrase {
    display: inline-block;
    margin: 0 0.28em 0 0;
    padding: 0;
    font-size: inherit;
    font-weight: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    color: inherit;
    vertical-align: baseline;
  }

  .home-hq-word {
    display: inline-block;
    width: auto;
    max-width: none;
    margin: 0;
    padding: 0.02em 0 0.1em;
    font-size: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    vertical-align: baseline;
  }

  .home-hq-support {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    margin: 0.85rem auto 0;
    max-width: 28rem;
    text-align: center;
  }

  .home-hq-support__quiet {
    font-size: 0.95rem;
    color: rgba(247, 249, 252, 0.55);
  }
}

.home-hq-note {
  display: none;
}

.home-hq-frame {
  position: relative;
  display: flex;
  justify-content: center;
}

.home-hq-mockup {
  width: 100%;
}

@media (max-width: 1023px) {
  .home-hq {
    padding-top: 0.5rem;
  }

  .home-hq-lead {
    margin-bottom: 0.64rem;
  }
}

@media (min-width: 1024px) {
  .home-hq-frame {
    position: relative;
    display: block;
    width: min(100%, 46rem);
    margin-inline: auto;
    padding-inline: 8.25rem;
  }

  .home-hq-note {
    position: absolute;
    z-index: 5;
    display: block;
    margin: 0;
    pointer-events: none;
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(247, 249, 252, 0.78);
    text-shadow: 0 1px 14px rgba(5, 6, 8, 0.92);
    opacity: 1;
  }

  .home-hq-note--music {
    top: 18%;
    left: 0;
  }

  .home-hq-note--fans {
    bottom: 24%;
    left: 0;
    color: #39d5ff;
  }

  .home-hq-note--page {
    top: 46%;
    right: 0;
    color: #f04fcf;
  }

  .home-hq-mockup {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 32rem;
    margin-inline: auto;
  }
}

@media (min-width: 1280px) {
  .home-hq-frame {
    width: min(100%, 50rem);
    padding-inline: 8.75rem;
  }

  .home-hq-note {
    font-size: 0.8rem;
    letter-spacing: 0.18em;
  }

  .home-hq-mockup {
    max-width: 34rem;
  }
}

.home-hq-mockup,
.home-hq-mockup :deep(.demo-artist-showcase),
.home-hq-mockup :deep(.demo-wake-clip) {
  height: auto !important;
  max-height: none !important;
  overflow: visible !important;
  overscroll-behavior: auto;
}

.home-hq-mockup :deep(.demo-artist-showcase > .relative) {
  box-shadow:
    0 28px 64px -18px rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    0 0 32px -16px rgba(139, 108, 255, 0.18);
}
</style>
