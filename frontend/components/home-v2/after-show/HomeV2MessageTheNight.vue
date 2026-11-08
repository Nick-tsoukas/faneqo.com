<template>
  <article class="ats-talk" data-after-chapter="message">
    <div class="ats-talk__copy">
      <HomeTypeReveal>
        <p class="home-kicker ats-kicker">{{ copy.kicker }}</p>
        <h2 class="ats-title">
          <span class="ats-title__lead">{{ copy.title }}</span>
          <span class="ats-title__accent">{{ copy.accent }}</span>
        </h2>
        <p class="ats-body">{{ copy.body }}</p>
      </HomeTypeReveal>
      <NuxtLink v-if="!hideCta" to="/signup" class="ats-cta ats-cta--desk group">
        {{ copy.cta }}
        <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
        </svg>
      </NuxtLink>
    </div>

    <div class="ats-talk__object" data-after-object>
      <HomeV2RoomMessenger :artist-name="artistName" :venue="venue" :once="once" :gallery="gallery" />
    </div>

    <NuxtLink v-if="!hideCta" to="/signup" class="ats-cta ats-cta--mobile group">
      {{ copy.cta }}
      <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
      </svg>
    </NuxtLink>
  </article>
</template>

<script setup>
import HomeV2RoomMessenger from '@/components/home-v2/after-show/HomeV2RoomMessenger.vue'

defineProps({
  copy: { type: Object, required: true },
  artistName: { type: String, required: true },
  venue: { type: String, default: 'Nashville' },
  once: { type: Boolean, default: false },
  gallery: { type: Array, default: null },
  hideCta: { type: Boolean, default: false },
})
</script>

<style scoped>
.ats-talk {
  display: grid;
  gap: 1.85rem;
  padding: 3.5rem 0 4.2rem;
}

.ats-kicker {
  margin-bottom: 0.95rem;
  color: #39d5ff;
}

.ats-title {
  margin: 0;
  font-weight: 800;
  line-height: 0.84;
  letter-spacing: -0.056em;
  color: #f7f9fc;
}

.ats-title__lead {
  display: block;
  font-size: clamp(1.9rem, 8vw, 2.75rem);
}

.ats-title__accent {
  display: block;
  margin-top: 0.14em;
  font-size: clamp(2.15rem, 9vw, 3.2rem);
  background: linear-gradient(90deg, #4ca6ff 0%, #39d5ff 58%, #45e3ae 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ats-body {
  margin: 1.1rem 0 0;
  max-width: 32rem;
  font-size: 1.02rem;
  line-height: 1.5;
  color: #9aa6b5;
}

.ats-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 3.2rem;
  padding: 0.875rem 1.5rem;
  border-radius: 0.85rem;
  background: linear-gradient(90deg, #ff4fd8, #8b6cff);
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  box-shadow:
    0 2px 4px rgba(255, 79, 216, 0.25),
    0 14px 32px -10px rgba(255, 79, 216, 0.5);
}

.ats-cta--desk {
  display: none;
  margin-top: 1.5rem;
}

.ats-cta--mobile {
  width: 100%;
}

.ats-cta:hover {
  transform: translateY(-2px);
}

.ats-talk__object {
  width: 100%;
}

@media (min-width: 1024px) {
  .ats-talk {
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
    align-items: center;
    gap: 3.4rem;
    padding: 5.75rem 0 6.75rem;
  }

  .ats-talk__object {
    max-width: none;
  }

  .ats-cta--desk {
    display: inline-flex;
  }

  .ats-cta--mobile {
    display: none;
  }

  .ats-title__lead {
    font-size: clamp(2.25rem, 3.1vw, 3.25rem);
  }

  .ats-title__accent {
    font-size: clamp(2.45rem, 3.4vw, 3.7rem);
  }

  .ats-body {
    margin-top: 1.35rem;
    font-size: 1.08rem;
    line-height: 1.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ats-cta:hover {
    transform: none;
  }
}
</style>
