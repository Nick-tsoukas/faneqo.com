<template>
  <div
    ref="rootEl"
    class="ats-check"
    role="img"
    :aria-label="`${fan.name} checks in to ${artistName} in ${fan.city}`"
  >
    <span class="ats-check__mode" aria-hidden="true">Show Mode</span>
    <div class="ats-check__live">
      <span class="ats-check__dot" aria-hidden="true"></span>
      Live
    </div>

    <div class="ats-check__who">
      <HomeV2StorySarahIdentity :fan="fan" variant="show" />
      <div class="ats-check__echo">
        <FaneqoEcho ref="echoRef" moment="check-in" size="sm" />
      </div>
    </div>

    <p class="ats-check__when">{{ artistName }} · {{ fan.city }}</p>

    <div class="ats-check__btn" aria-hidden="true">
      <span class="ats-check__fill"></span>
      <span class="ats-check__idle">I’m here</span>
      <span class="ats-check__done">
        <span class="ats-check__mark">✓</span>
        You’re checked in.
      </span>
    </div>

    <div class="ats-check__chips">
      <span class="ats-check__chip">I Was There</span>
      <span class="ats-check__chip ats-check__chip--on">On the list</span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { gsap } from 'gsap'
import HomeV2StorySarahIdentity from '@/components/home-v2/HomeV2StorySarahIdentity.vue'
import FaneqoEcho from '@/components/rive/FaneqoEcho.vue'

defineProps({
  artistName: { type: String, default: 'BADFLOWER' },
  fan: { type: Object, required: true },
})

const rootEl = ref(null)
const echoRef = ref(null)
let ctx
let observer
let timeline

function play(scope) {
  const btn = scope.querySelector('.ats-check__btn')
  const fill = scope.querySelector('.ats-check__fill')
  const idle = scope.querySelector('.ats-check__idle')
  const done = scope.querySelector('.ats-check__done')
  const chips = scope.querySelectorAll('.ats-check__chip')
  if (!btn) return

  gsap.set(fill, { scaleX: 0, transformOrigin: 'left center' })
  gsap.set(done, { autoAlpha: 0 })
  gsap.set(idle, { autoAlpha: 1 })
  gsap.set(chips, { autoAlpha: 0, y: 8 })

  timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
  timeline.add(() => echoRef.value?.signalOut?.(0.78), 0.32)
  timeline.to(btn, { scale: 0.98, duration: 0.08 }, 0.52)
  timeline.to(fill, { scaleX: 1, duration: 0.32 }, '<0.04')
  timeline.to(btn, { scale: 1, duration: 0.18 }, '<')
  timeline.to(idle, { autoAlpha: 0, duration: 0.12 }, '<0.08')
  timeline.to(done, { autoAlpha: 1, duration: 0.22 }, '<')
  timeline.add(() => {
    echoRef.value?.connect?.()
    scope.classList.add('is-connected')
  }, '<')
  timeline.to(chips, { autoAlpha: 1, y: 0, duration: 0.36, stagger: 0.07 }, '+=0.08')
  timeline.add(() => echoRef.value?.settle?.(), '+=0.18')
}

onMounted(() => {
  if (!rootEl.value || typeof window === 'undefined') return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ctx = gsap.context(() => {
    if (reduced) {
      gsap.set('.ats-check__idle', { autoAlpha: 0 })
      gsap.set('.ats-check__done', { autoAlpha: 1 })
      gsap.set('.ats-check__fill', { scaleX: 1 })
      gsap.set('.ats-check__chip', { autoAlpha: 1, y: 0 })
      rootEl.value?.classList.add('is-connected')
      echoRef.value?.settleConnected?.()
      return
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && rootEl.value) {
          play(rootEl.value)
          observer?.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(rootEl.value)
  }, rootEl.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
  timeline?.kill()
  timeline = null
  ctx?.revert()
})
</script>

<style scoped>
.ats-check__who {
  position: relative;
}

.ats-check__echo {
  position: absolute;
  left: 2.85rem;
  top: -0.45rem;
  z-index: 2;
  pointer-events: none;
}

.ats-check.is-connected :deep(.v2-sarah__avatar) {
  border-color: rgba(57, 213, 255, 0.72);
  box-shadow: 0 0 0 6px rgba(57, 213, 255, 0.16);
}

.ats-check {
  position: relative;
  width: 100%;
  overflow: visible;
  padding: 1.35rem 1.25rem 1.35rem;
  border-radius: 1.35rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(180deg, rgba(139, 108, 255, 0.12) 0%, transparent 42%),
    #0b0e14;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3),
    0 16px 32px rgba(0, 0, 0, 0.34),
    0 40px 72px -18px rgba(0, 0, 0, 0.7);
}

.ats-check__mode {
  position: absolute;
  top: -0.7rem;
  right: 1rem;
  z-index: 3;
  padding: 0.32rem 0.7rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 79, 216, 0.32);
  background: rgba(12, 10, 18, 0.88);
  color: #ff8ae8;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.32),
    0 14px 28px -12px rgba(255, 79, 216, 0.45);
  transform: rotate(7deg);
  animation: ats-mode-float 4.6s ease-in-out infinite;
}

@keyframes ats-mode-float {
  0%, 100% { transform: rotate(7deg) translateY(0); }
  50% { transform: rotate(7deg) translateY(-7px); }
}

@media (min-width: 1024px) {
  .ats-check {
    width: min(100%, 26.5rem);
  }
}

.ats-check__live {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 1.1rem;
  padding: 0.28rem 0.62rem;
  border-radius: 999px;
  border: 1px solid rgba(98, 242, 157, 0.28);
  background: rgba(98, 242, 157, 0.08);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #62f29d;
  box-shadow: 0 10px 22px -12px rgba(98, 242, 157, 0.45);
}

.ats-check__dot {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #39d58a;
  box-shadow: 0 0 0 4px rgba(57, 213, 138, 0.16);
  animation: ats-live-pulse 1.8s ease-in-out infinite;
}

@keyframes ats-live-pulse {
  0%, 100% { box-shadow: 0 0 0 4px rgba(57, 213, 138, 0.16); }
  50% { box-shadow: 0 0 0 8px rgba(57, 213, 138, 0.08); }
}

.ats-check__when {
  margin: 0.85rem 0 1.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.34);
}

.ats-check__btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 3.5rem;
  overflow: hidden;
  border-radius: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: #15161c;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.28),
    0 12px 24px -14px rgba(0, 0, 0, 0.8);
}

.ats-check__fill {
  position: absolute;
  inset: 0;
  background: rgba(69, 214, 167, 0.16);
  pointer-events: none;
  will-change: transform;
}

.ats-check__idle,
.ats-check__done {
  position: relative;
  z-index: 1;
}

.ats-check__done {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
}

.ats-check__mark {
  color: #62f29d;
  font-weight: 800;
}

.ats-check__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.85rem;
}

.ats-check__chip {
  padding: 0.28rem 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(247, 249, 252, 0.78);
  font-size: 0.68rem;
  font-weight: 700;
}

.ats-check__chip--on {
  border-color: rgba(69, 214, 167, 0.35);
  background: rgba(69, 214, 167, 0.1);
  color: #62f29d;
}

@media (prefers-reduced-motion: reduce) {
  .ats-check__mode,
  .ats-check__dot {
    animation: none;
  }
}
</style>
