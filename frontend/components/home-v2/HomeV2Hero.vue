<template>
  <section ref="rootEl" class="v2-hero">
    <div class="v2-hero__frame">
      <div class="v2-hero__composition">
        <h1 class="v2-hero__title">
          <span class="v2-hero__thought">
            Bands don't need<br class="v2-hero__break">
            <span class="v2-hero__accent-a">more links.</span>
          </span>
          <span class="v2-hero__thought">
            They need fans<br class="v2-hero__break">
            <span class="v2-hero__accent-b">they can reach again.</span>
          </span>
        </h1>

        <div class="v2-hero__world">
          <div class="v2-hero-stage">
            <HomeV2HeroPortrait :artist="artist" desktop-only />
          </div>
        </div>

        <div class="v2-hero__actions">
          <NuxtLink to="/signup" class="v2-hero__cta">
            Start free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
          <p class="v2-hero__note">Free account. Pro included for 30 days.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import HomeV2HeroPortrait from '@/components/home-v2/HomeV2HeroPortrait.vue'
import { useHomeV2HeroMotion } from '~/composables/home-v2/useHomeV2HeroMotion.js'

defineProps({
  artist: { type: Object, required: true },
})

const rootEl = ref(null)
let revertHero = null

onMounted(async () => {
  await nextTick()
  if (!rootEl.value) return
  revertHero = useHomeV2HeroMotion(rootEl)
})

onUnmounted(() => {
  revertHero?.()
  revertHero = null
})
</script>

<style scoped>
.v2-hero {
  position: relative;
  z-index: 10;
  padding: 0.85rem 1.25rem 0.15rem;
  background: #000;
  color: #f5f5f6;
}

.v2-hero__frame {
  width: min(100%, 1480px);
  margin-inline: auto;
}

.v2-hero.is-settled .v2-hero__thought,
.v2-hero.is-settled .v2-hero__cta,
.v2-hero.is-settled .v2-hero__note,
.v2-hero.is-settled .v2-hero-stage {
  opacity: 1;
  visibility: visible;
}

.v2-hero__composition {
  display: flex;
  flex-direction: column;
}

.v2-hero__title {
  margin: 0;
  font-size: clamp(2.7rem, 12vw, 3.4rem);
  font-weight: 800;
  line-height: 0.92;
  letter-spacing: -0.052em;
}

.v2-hero__thought {
  display: block;
}

.v2-hero__thought + .v2-hero__thought {
  margin-top: 0.16em;
}

.v2-hero__break {
  display: block;
}

.v2-hero__accent-a {
  background: linear-gradient(90deg, #f472b6, #c084fc);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v2-hero__accent-b {
  background: linear-gradient(90deg, #c084fc, #f472b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.v2-hero__world {
  display: none;
}

.v2-hero-stage {
  overflow: hidden;
}

.v2-hero__actions {
  padding: 1rem 0 0.7rem;
}

.v2-hero__cta {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 3rem;
  padding: 0.7rem 1.25rem;
  border-radius: 0.7rem;
  font-size: 0.95rem;
  font-weight: 700;
  background: #45d6a7;
  color: #06251f;
}

.v2-hero__cta svg {
  width: 0.9rem;
  height: 0.9rem;
}

.v2-hero__note {
  margin: 0.55rem 0 0;
  font-size: 0.72rem;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.36);
}

@media (min-width: 1024px) {
  .v2-hero {
    display: flex;
    align-items: center;
    min-height: calc(100svh - var(--header-height, 70px));
    padding: 1.5rem 1.75rem 1.75rem;
  }

  .v2-hero__composition {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(26rem, 34rem);
    grid-template-areas:
      'title world'
      'actions world';
    align-items: center;
    column-gap: 2.75rem;
    row-gap: 0;
  }

  .v2-hero__title {
    grid-area: title;
    max-width: 13.5ch;
    font-size: clamp(3.9rem, 5.8vw, 5.8rem);
    align-self: end;
  }

  .v2-hero__break {
    display: none;
  }

  .v2-hero__thought + .v2-hero__thought {
    margin-top: 0.1em;
  }

  .v2-hero__world {
    display: block;
    grid-area: world;
    width: 100%;
    margin: 0;
    align-self: stretch;
  }

  .v2-hero-stage {
    border-radius: 0.15rem;
  }

  .v2-hero__actions {
    grid-area: actions;
    padding: 1.35rem 0 0;
    align-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .v2-hero__thought,
  .v2-hero__cta,
  .v2-hero__note,
  .v2-hero-stage {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
  }
}
</style>
