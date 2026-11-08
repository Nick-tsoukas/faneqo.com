<template>
  <!-- Production homepage hero. -->
  <section ref="heroRoot" class="home-hero relative z-10 px-4 sm:px-6 lg:px-8 pt-5 pb-3 sm:pt-7 sm:pb-4 lg:pt-10 lg:pb-12">
    <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute left-[-8%] top-[-20%] h-[28rem] w-[28rem] rounded-full bg-[#8B6CFF]/14 blur-[120px]"></div>
      <div class="absolute right-[6%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-[#4CA6FF]/10 blur-[110px]"></div>
    </div>

    <div class="relative mx-auto max-w-7xl">
      <div
        class="grid items-start gap-6"
        :class="showHeroShowcase
          ? 'lg:grid-cols-[minmax(0,1.22fr)_minmax(22rem,28rem)] lg:items-center lg:gap-7 xl:grid-cols-[minmax(0,1.12fr)_minmax(24rem,32rem)] xl:gap-10'
          : ''"
      >
        <div class="home-hero-copy order-1 text-left">
          <h1 class="home-hero-h1">
            <HomePhraseReveal>
              <span class="home-hero-thought">
                Bands don't need<br>
                <span class="home-hero-accent-reject">more links.</span>
              </span>
            </HomePhraseReveal>
            <HomePhraseReveal :delay="HOME_TYPE_DELAY.thought2">
              <span class="home-hero-thought">
                They need fans<br>
                <span class="home-hero-accent-payoff">they can reach again.</span>
              </span>
            </HomePhraseReveal>
          </h1>

          <p class="home-hero-lede">
            Your page for music, shows, and the fans you can reach again.
          </p>

          <div class="home-hero-actions">
            <NuxtLink to="/signup" class="cta-primary group">
              Start free
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
            </NuxtLink>
            <p class="home-hero-note">
              Free account. Pro included for 30 days.
            </p>
          </div>
        </div>

        <div
          v-if="showHeroShowcase"
          class="home-hero-mockup relative hidden justify-center order-2 lg:flex"
        >
          <div class="hero-profile-container relative z-10 w-full max-w-[430px] xl:max-w-[480px]">
            <DemoArtistProfileShowcase
              :artist="artist"
              :compact="true"
              :animated="false"
              product-reveal
              priority
            />
          </div>

          <aside class="hero-signal hero-signal--fan" aria-hidden="true">
            <span class="hero-signal__dot"></span>
            <span class="hero-signal__label">New fan joined</span>
            <span class="hero-signal__value">Sarah M. · show QR</span>
          </aside>

          <aside class="hero-signal hero-signal--back" aria-hidden="true">
            <span class="hero-signal__dot"></span>
            <span class="hero-signal__label">Came back</span>
            <span class="hero-signal__value">Nashville · 2nd show</span>
          </aside>

          <aside class="hero-signal hero-signal--live" aria-hidden="true">
            <span class="hero-signal__dot"></span>
            <span class="hero-signal__label">Tonight</span>
            <span class="hero-signal__value">The Basement East</span>
          </aside>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { gsap } from 'gsap'
import DemoArtistProfileShowcase from '@/components/marketing/DemoArtistProfileShowcase.vue'
import { HOME_TYPE_DELAY } from '@/utils/ui/homeTypeMotion'
import {
  homePrefersReducedMotion,
  playHomeHeroReveal,
} from '@/utils/ui/homeProductReveal'

defineProps({
  artist: { type: Object, required: true },
  showHeroShowcase: { type: Boolean, default: true },
})

const heroRoot = ref(null)
let ctx

onMounted(async () => {
  await nextTick()
  if (!heroRoot.value || typeof window === 'undefined') return
  if (!window.matchMedia('(min-width: 1024px)').matches) return
  if (homePrefersReducedMotion()) return
  ctx = gsap.context(() => {
    playHomeHeroReveal(gsap, heroRoot.value)
  }, heroRoot.value)
})

onBeforeUnmount(() => {
  ctx?.revert()
})
</script>

<style scoped>
.home-hero {
  background: #050608;
  color: #f7f9fc;
  overflow: visible;
}

.home-hero-copy {
  max-width: 40rem;
}

.home-hero-h1 {
  max-width: none;
  font-size: clamp(2.7rem, 12vw, 3.35rem);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: -0.052em;
  text-align: left;
  color: #f7f9fc;
}

.home-hero-thought {
  display: block;
}

.home-hero-h1 :deep(.home-phrase-mask + .home-phrase-mask) {
  margin-top: 0.32em;
}

.home-hero-accent-reject {
  background: linear-gradient(90deg, #8b6cff 0%, #f04fcf 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.home-hero-accent-payoff {
  background: linear-gradient(90deg, #4ca6ff 0%, #39d5ff 48%, #45e3ae 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.home-hero-lede {
  margin: 1.15rem 0 0;
  max-width: 22rem;
  font-size: 0.98rem;
  line-height: 1.45;
  letter-spacing: -0.01em;
  color: #9aa6b5;
}

@media (max-width: 1023px) {
  .home-hero {
    padding-top: 2.75rem;
    padding-bottom: 3.25rem;
  }

  .home-hero-h1 {
    font-size: clamp(2.15rem, 9.4vw, 2.65rem);
    line-height: 0.92;
  }

  .home-hero-lede {
    display: none;
  }
}

.home-hero-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.7rem;
  margin-top: 1.4rem;
}

@media (min-width: 1024px) {
  .home-hero-copy {
    padding-top: 0.35rem;
  }

  .home-hero-h1 {
    font-size: clamp(2.95rem, 3.7vw, 4.35rem);
    line-height: 0.9;
    letter-spacing: -0.052em;
  }

  .home-hero-accent-reject {
    white-space: nowrap;
  }

  .home-hero-lede {
    margin-top: 1.45rem;
    max-width: 24rem;
    font-size: 1.0625rem;
    line-height: 1.5;
  }

  .home-hero-actions {
    margin-top: 1.75rem;
    gap: 0.75rem;
  }
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 3.15rem;
  padding: 0.95rem 1.7rem;
  background: linear-gradient(to right, #ec4899, #a855f7);
  border-radius: 0.75rem;
  font-weight: 700;
  font-size: 0.98rem;
  color: #fff;
  transition: all 0.2s;
  box-shadow: 0 10px 30px -10px rgba(236, 72, 153, 0.5);
}
.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 40px -10px rgba(236, 72, 153, 0.6);
}

.cta-primary:focus-visible {
  outline: 2px solid #39d5ff;
  outline-offset: 3px;
}

.cta-primary:active {
  transform: translateY(0) scale(0.985);
}

.home-hero-note {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: #9aa6b5;
}

.home-hero-mockup {
  overflow: visible;
  padding: 0.5rem 2.55rem 0.75rem;
}

.hero-profile-container {
  transform: none;
}

.hero-profile-container:hover {
  transform: none;
}

.home-hero-mockup :deep(.demo-artist-showcase),
.home-hero-mockup :deep(.demo-wake-clip) {
  overflow-x: hidden;
  overflow-y: hidden;
  overscroll-behavior: none;
}

.hero-signal {
  --sx: 0;
  position: absolute;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.38rem;
  pointer-events: none;
  max-width: 13.5rem;
  padding: 0.28rem 0.55rem 0.28rem 0.42rem;
  border-radius: 0.42rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(11, 14, 20, 0.88);
  box-shadow: 0 10px 22px -16px rgba(0, 0, 0, 0.85);
  opacity: 1;
  transform: translateX(var(--sx));
}

.hero-signal__dot {
  flex-shrink: 0;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 999px;
  background: currentColor;
}

.hero-signal__label {
  flex-shrink: 0;
  font-size: 0.5625rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: currentColor;
}

.hero-signal__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #f7f9fc;
}

.hero-signal--fan {
  --sx: -24%;
  top: 14%;
  left: 1.55rem;
  color: #39d5ff;
}

.hero-signal--back {
  --sx: 24%;
  top: 46%;
  right: 1.4rem;
  color: #4ca6ff;
}

.hero-signal--live {
  --sx: -24%;
  bottom: 14%;
  left: 1.45rem;
  color: #8b6cff;
}

@media (min-width: 1024px) and (max-width: 1279px) {
  .home-hero-mockup {
    padding: 0.5rem 1.6rem 0.75rem;
  }

  .hero-signal {
    max-width: 11.25rem;
  }

  .hero-signal--fan,
  .hero-signal--live {
    --sx: -18%;
  }

  .hero-signal--back {
    --sx: 18%;
  }
}

@media (min-width: 1280px) {
  .home-hero-h1 {
    font-size: clamp(3.35rem, 4.1vw, 4.45rem);
    line-height: 0.88;
    letter-spacing: -0.055em;
  }

  .home-hero-accent-payoff {
    white-space: nowrap;
  }

  .home-hero-mockup {
    padding: 0.35rem 4.1rem 0.6rem;
  }

  .hero-signal--fan,
  .hero-signal--live {
    --sx: -26%;
  }

  .hero-signal--back {
    --sx: 26%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-profile-container {
    transform: none !important;
    opacity: 1 !important;
  }

  .hero-signal {
    animation: none;
    opacity: 1;
    transform: translateX(var(--sx));
  }

  .cta-primary:hover,
  .cta-primary:active {
    transform: none;
  }
}
</style>
