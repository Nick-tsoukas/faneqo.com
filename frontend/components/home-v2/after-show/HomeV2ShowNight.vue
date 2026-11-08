<template>
  <article class="ats-night" data-after-chapter="night">
    <div class="ats-night__copy">
      <HomeTypeReveal>
        <p class="home-kicker ats-kicker">{{ copy.kicker }}</p>
        <h2 class="ats-title">
          <span class="ats-title__lead">{{ copy.title }}</span>
          <span class="ats-title__accent">{{ copy.accent }}</span>
        </h2>
        <p class="ats-body">{{ copy.body }}</p>
      </HomeTypeReveal>
    </div>

    <div class="ats-night__stage" data-after-object>
      <div class="ats-night__proof">
        <HomeV2ShowCheckIn :artist-name="artistName" :fan="fan" />
        <figure class="ats-night__badge">
          <img
            src="/marketing/show-checkin-badge.png"
            alt="Faneqo Show Mode check-in badge — I Was There"
            width="1080"
            height="1080"
            loading="lazy"
            decoding="async"
          />
        </figure>
      </div>
    </div>
  </article>
</template>

<script setup>
import HomeV2ShowCheckIn from '@/components/home-v2/after-show/HomeV2ShowCheckIn.vue'

defineProps({
  copy: { type: Object, required: true },
  artistName: { type: String, required: true },
  fan: { type: Object, required: true },
})
</script>

<style scoped>
.ats-night {
  display: grid;
  gap: 2rem;
  padding: 3.75rem 0 3.4rem;
}

.ats-kicker {
  margin-bottom: 0.85rem;
  color: #f9a8d4;
}

.ats-title {
  margin: 0;
  font-weight: 800;
  line-height: 0.84;
  letter-spacing: -0.058em;
  color: #f7f9fc;
}

.ats-title__lead {
  display: block;
  font-size: clamp(2.05rem, 9vw, 3rem);
}

.ats-title__accent {
  display: block;
  margin-top: 0.14em;
  font-size: clamp(2.4rem, 10.4vw, 3.7rem);
  background: linear-gradient(90deg, #8b6cff 0%, #ff4fd8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.ats-body {
  margin: 1.15rem 0 0;
  max-width: 34rem;
  font-size: 1.02rem;
  line-height: 1.5;
  color: #9aa6b5;
}

.ats-night__stage {
  display: grid;
  gap: 1.15rem;
}

.ats-night__proof {
  position: relative;
  padding-bottom: 2.2rem;
}

.ats-night__badge {
  position: absolute;
  right: 0.15rem;
  bottom: 0;
  z-index: 2;
  width: 7.1rem;
  margin: 0;
  overflow: hidden;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #0a0a0f;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.32),
    0 18px 36px -10px rgba(0, 0, 0, 0.78),
    0 32px 56px -20px rgba(139, 108, 255, 0.28);
  transform: rotate(6deg);
  animation: ats-badge-float 4.8s ease-in-out infinite;
}

@keyframes ats-badge-float {
  0%, 100% { transform: rotate(6deg) translateY(0); }
  50% { transform: rotate(6deg) translateY(-10px); }
}

.ats-night__badge img {
  display: block;
  width: 100%;
  height: auto;
}

@media (min-width: 1024px) {
  .ats-night {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    align-items: center;
    gap: 3.4rem;
    padding: 6.5rem 0 5.5rem;
  }

  .ats-title__lead {
    font-size: clamp(2.4rem, 3.4vw, 3.55rem);
  }

  .ats-title__accent {
    font-size: clamp(2.8rem, 3.9vw, 4.25rem);
  }

  .ats-body {
    margin-top: 1.35rem;
    font-size: 1.08rem;
    line-height: 1.55;
  }

  .ats-night__proof {
    padding-bottom: 0;
  }

  .ats-night__badge {
    right: -0.65rem;
    bottom: -1.1rem;
    width: 9.1rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ats-night__badge {
    animation: none;
  }
}
</style>
