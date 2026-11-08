<template>
  <article ref="rootEl" class="ats-rem" data-after-chapter="remember">
    <div class="ats-rem__copy">
      <HomeTypeReveal>
        <p class="home-kicker ats-kicker">{{ copy.kicker }}</p>
        <h2 class="ats-title">
          <span class="ats-title__lead">{{ copy.title }}</span>
          <span class="ats-title__accent">{{ copy.accent }}</span>
        </h2>
        <p class="ats-body">{{ copy.body }}</p>
      </HomeTypeReveal>
    </div>

    <div class="ats-rem__object" data-after-object>
      <div class="ats-rem__stats">
        <div>
          <strong>42</strong>
          <span>In the room</span>
        </div>
        <div>
          <strong>19</strong>
          <span>New fans</span>
        </div>
        <div>
          <strong>{{ afterCount }}</strong>
          <span>On the list</span>
        </div>
      </div>

      <div class="ats-rem__list" role="img" :aria-label="`${fan.name} joined the fan list tonight.`">
        <div
          v-for="row in rows"
          :key="row.initials"
          class="ats-rem__row"
          :class="{ 'is-new': row.new }"
          :data-sarah-row="row.new ? 'true' : null"
        >
          <span class="ats-rem__av">
            {{ row.initials }}
            <span v-if="row.new" class="ats-rem__echo">
            <FaneqoEcho
              moment="settled"
              size="xs"
              desktop-only
            />
            </span>
          </span>
          <div class="min-w-0">
            <p class="ats-rem__name">{{ row.name }}</p>
            <p class="ats-rem__meta">
              {{ row.city }} · {{ row.showsLabel }}
              <em v-if="row.joinedLabel">{{ row.joinedLabel }}</em>
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import FaneqoEcho from '@/components/rive/FaneqoEcho.vue'

const props = defineProps({
  copy: { type: Object, required: true },
  fan: { type: Object, required: true },
  neighbors: { type: Array, required: true },
  afterCount: { type: Number, default: 129 },
})

const rows = computed(() => [
  props.neighbors[0],
  { ...props.fan, new: true },
  ...props.neighbors.slice(1, 3),
])

const rootEl = ref(null)
let ctx
let observer

onMounted(() => {
  if (!rootEl.value || typeof window === 'undefined') return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ctx = gsap.context(() => {
    const row = rootEl.value.querySelector('[data-sarah-row]')
    if (!row) return
    if (reduced) {
      row.classList.add('is-held')
      return
    }
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        row.classList.add('is-held')
        gsap.fromTo(
          row,
          { boxShadow: '0 0 0 0 rgba(57, 213, 255, 0)' },
          {
            boxShadow: '0 0 0 8px rgba(57, 213, 255, 0.14)',
            duration: 0.42,
            ease: 'power2.out',
            yoyo: true,
            repeat: 1,
          }
        )
        observer?.disconnect()
      },
      { threshold: 0.45 }
    )
    observer.observe(row)
  }, rootEl.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  ctx?.revert()
})
</script>

<style scoped>
.ats-rem {
  display: grid;
  gap: 1.85rem;
  padding: 3.5rem 0;
}

.ats-kicker {
  margin-bottom: 0.95rem;
  color: #39d5ff;
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
  font-size: clamp(1.7rem, 7.2vw, 2.4rem);
  color: #9aa6b5;
}

.ats-title__accent {
  display: block;
  margin-top: 0.12em;
  font-size: clamp(2.55rem, 11vw, 3.95rem);
  background: linear-gradient(90deg, #4ca6ff 0%, #39d5ff 48%, #45e3ae 100%);
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

.ats-rem__object {
  width: 100%;
}

.ats-rem__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.55rem;
  margin-bottom: 0.9rem;
}

.ats-rem__stats div {
  padding: 0.85rem 0.65rem;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #111217;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.28),
    0 12px 24px -14px rgba(0, 0, 0, 0.75);
}

.ats-rem__row:nth-child(n + 4) {
  display: none;
}

.ats-rem__stats strong {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  color: #f7f9fc;
}

.ats-rem__stats span {
  display: block;
  margin-top: 0.28rem;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.4);
}

.ats-rem__list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem;
  border-radius: 1.2rem;
  border: 1px solid rgba(76, 166, 255, 0.18);
  background: #0c0f16;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.28),
    0 18px 36px rgba(0, 0, 0, 0.32),
    0 40px 72px -20px rgba(0, 0, 0, 0.7);
}

.ats-rem__row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  min-height: 3.2rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.7rem;
}

.ats-rem__row.is-new {
  min-height: 3.7rem;
  background: rgba(57, 213, 255, 0.08);
  border: 1px solid rgba(57, 213, 255, 0.2);
}

.ats-rem__row:not(.is-new) {
  opacity: 0.42;
}

.ats-rem__av {
  position: relative;
  display: flex;
  width: 2.2rem;
  height: 2.2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #15161c;
  font-size: 0.62rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
}

.ats-rem__row.is-new .ats-rem__av {
  background: rgba(57, 213, 255, 0.12);
  color: #39d5ff;
}

.ats-rem__echo {
  position: absolute;
  right: -0.45rem;
  top: -0.4rem;
}

.ats-rem__name {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 700;
  color: #f7f9fc;
}

.ats-rem__meta {
  margin: 0.12rem 0 0;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.42);
}

.ats-rem__meta em {
  display: block;
  margin-top: 0.08rem;
  font-style: normal;
  color: #39d5ff;
}

@media (min-width: 1024px) {
  .ats-rem {
    grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
    align-items: center;
    gap: 3.4rem;
    padding: 5.75rem 0;
  }

  .ats-rem__object {
    order: -1;
    width: min(100%, 34rem);
  }

  .ats-rem__row:nth-child(n + 4) {
    display: flex;
  }

  .ats-title__lead {
    font-size: clamp(2rem, 2.6vw, 2.8rem);
  }

  .ats-title__accent {
    font-size: clamp(3rem, 4.4vw, 4.6rem);
  }

  .ats-body {
    margin-top: 1.35rem;
    font-size: 1.08rem;
    line-height: 1.55;
  }
}
</style>
