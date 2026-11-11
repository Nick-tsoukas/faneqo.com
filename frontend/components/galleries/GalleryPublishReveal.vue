<template>
  <section class="reveal" aria-labelledby="gallery-published-heading">
    <div class="reveal__glow" aria-hidden="true" />
    <div class="reveal__stage">
      <header class="reveal__head">
        <span class="reveal__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path d="M6.2 12.4 10 16.1 17.8 7.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <p class="reveal__eyebrow">Published</p>
        <h1 id="gallery-published-heading">Your gallery is published.</h1>
        <p v-if="featured" class="reveal__status">Your gallery is live and showing on your artist page.</p>
        <p v-else-if="canFeature && keptTitle" class="reveal__status">
          {{ keptTitle }} is still showing on your artist page. Showing this one will replace it.
        </p>
        <p v-else-if="canFeature" class="reveal__status">It is not on your artist page yet.</p>
        <p v-if="rocksnaps" class="reveal__aside">Showing on RockSnaps.</p>
        <p v-if="featureError" class="reveal__alert" role="alert">{{ featureError }}</p>
      </header>

      <figure class="reveal__poster">
        <div class="reveal__frame">
          <img
            v-if="coverSrc && !coverFailed"
            :src="coverSrc"
            :alt="coverAlt"
            @error="coverFailed = true"
          >
          <div v-else class="reveal__fallback">
            <p>Faneqo</p>
            <strong>{{ displayTitle }}</strong>
          </div>
          <div class="reveal__shade" aria-hidden="true" />
          <figcaption>
            <p class="reveal__count">{{ countLabel }}</p>
            <p class="reveal__title">{{ displayTitle }}</p>
            <p class="reveal__who">{{ audience || 'Everyone' }}</p>
          </figcaption>
        </div>
      </figure>

      <div class="reveal__actions">
        <button
          v-if="canFeature"
          type="button"
          class="reveal__primary"
          :disabled="featuring"
          @click="emit('feature')"
        >
          {{ featuring ? 'Saving…' : (featureError ? 'Try again' : 'Show on artist page') }}
          <span v-if="!featuring && !featureError" aria-hidden="true">→</span>
        </button>
        <NuxtLink v-else-if="featured && artistPagePath" :to="artistPagePath" class="reveal__primary">
          View artist page
          <span aria-hidden="true">→</span>
        </NuxtLink>
        <NuxtLink v-else-if="galleryPath" :to="galleryPath" class="reveal__primary">
          View gallery
          <span aria-hidden="true">→</span>
        </NuxtLink>

        <div class="reveal__quiet">
          <NuxtLink v-if="galleryPath && (canFeature || featured)" :to="galleryPath">View gallery</NuxtLink>
          <NuxtLink :to="sendPath">{{ sendLabel }}</NuxtLink>
          <NuxtLink v-if="returnPath" :to="returnPath">Use in original message</NuxtLink>
          <NuxtLink to="/galleries">All galleries</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  title: { type: String, default: '' },
  coverSrc: { type: String, default: '' },
  coverAlt: { type: String, default: '' },
  photoCount: { type: Number, default: 0 },
  audience: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  featuring: { type: Boolean, default: false },
  featureError: { type: String, default: '' },
  keptTitle: { type: String, default: '' },
  canFeature: { type: Boolean, default: false },
  artistPagePath: { type: String, default: '' },
  galleryPath: { type: String, default: '' },
  sendPath: { type: [String, Object], default: '/messages/compose' },
  sendLabel: { type: String, default: 'Message all fans' },
  returnPath: { type: String, default: '' },
  rocksnaps: { type: Boolean, default: false },
})

const emit = defineEmits(['feature'])

const coverFailed = ref(false)
watch(() => props.coverSrc, () => {
  coverFailed.value = false
})

const displayTitle = computed(() => String(props.title || '').trim() || 'Gallery')
const countLabel = computed(() => {
  const n = Number(props.photoCount) || 0
  return `${n} ${n === 1 ? 'photo' : 'photos'}`
})
</script>

<style scoped>
.reveal {
  position: relative;
  min-height: 100dvh;
  padding:
    calc(var(--header-height, 70px) + 2.4rem)
    max(1.15rem, env(safe-area-inset-right))
    calc(6.25rem + env(safe-area-inset-bottom, 0px))
    max(1.15rem, env(safe-area-inset-left));
  background:
    radial-gradient(980px 520px at 50% 8%, rgba(78, 48, 140, 0.34), transparent 62%),
    radial-gradient(720px 420px at 86% 58%, rgba(28, 92, 150, 0.16), transparent 58%),
    radial-gradient(640px 380px at 10% 72%, rgba(140, 36, 110, 0.12), transparent 56%),
    #07060c;
  color: #f5f4f2;
  overflow: hidden;
}
.reveal__glow {
  position: absolute;
  left: 50%;
  top: calc(var(--header-height, 70px) + 11rem);
  width: min(920px, 86vw);
  height: 38vh;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(90, 70, 180, 0.22), transparent 72%);
  pointer-events: none;
}
.reveal__stage {
  position: relative;
  width: min(100%, 980px);
  margin: 0 auto;
}
.reveal__head {
  display: grid;
  justify-items: center;
  text-align: center;
  animation: reveal-rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.reveal__mark {
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border-radius: 999px;
  border: 1px solid rgba(94, 224, 190, 0.45);
  background: rgba(94, 224, 190, 0.1);
  color: #7eebcf;
}
.reveal__eyebrow {
  margin: 0.7rem 0 0;
  color: rgba(245, 244, 242, 0.62);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.reveal h1 {
  margin: 0.55rem 0 0;
  max-width: 14ch;
  font-size: clamp(2.15rem, 5vw, 3.55rem);
  font-weight: 620;
  letter-spacing: -0.048em;
  line-height: 0.98;
}
.reveal__status,
.reveal__aside {
  margin: 0.7rem 0 0;
  max-width: 34rem;
  color: rgba(245, 244, 242, 0.74);
  font-size: 1rem;
  line-height: 1.45;
}
.reveal__status { margin-top: 0.4rem; }
.reveal__aside {
  margin-top: 0.35rem;
  font-size: 0.9rem;
  color: rgba(245, 244, 242, 0.62);
}
.reveal__alert {
  margin: 0.7rem 0 0;
  max-width: 32rem;
  color: #fecaca;
  font-size: 0.95rem;
  line-height: 1.45;
}
.reveal__poster {
  margin: 1.7rem auto 0;
  width: min(100%, 920px);
  animation: reveal-poster 0.75s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.reveal__frame {
  position: relative;
  aspect-ratio: 4 / 5;
  border-radius: 1.15rem;
  overflow: hidden;
  background: #100e16;
  box-shadow:
    0 0 0 1px rgba(160, 190, 255, 0.18),
    0 28px 70px rgba(0, 0, 0, 0.45);
}
.reveal__frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.reveal__frame img,
.reveal__fallback {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.reveal__frame img {
  object-fit: cover;
  object-position: center 42%;
}
.reveal__fallback {
  display: grid;
  align-content: end;
  padding: 1.4rem;
  background:
    radial-gradient(420px 240px at 20% 10%, rgba(80, 140, 220, 0.28), transparent 60%),
    radial-gradient(380px 220px at 90% 80%, rgba(170, 50, 140, 0.22), transparent 62%),
    #14121a;
}
.reveal__fallback p {
  margin: 0 0 0.35rem;
  color: rgba(245, 244, 242, 0.55);
  font-size: 0.72rem;
  font-weight: 650;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.reveal__fallback strong {
  font-size: 1.6rem;
  font-weight: 620;
  letter-spacing: -0.03em;
}
.reveal__shade {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(7, 6, 12, 0.08) 28%, rgba(7, 6, 12, 0.08) 48%, rgba(7, 6, 12, 0.82) 100%);
}
.reveal__frame figcaption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: grid;
  gap: 0.2rem;
  padding: 1.25rem 1.25rem 1.2rem;
}
.reveal__count,
.reveal__who {
  margin: 0;
  color: rgba(245, 244, 242, 0.82);
  font-size: 0.78rem;
  font-weight: 650;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.reveal__title {
  margin: 0;
  color: #f7f5f2;
  font-size: clamp(1.55rem, 3vw, 2.45rem);
  font-weight: 620;
  letter-spacing: -0.04em;
  line-height: 1.05;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.reveal__actions {
  display: grid;
  justify-items: center;
  gap: 0.85rem;
  margin-top: 1.45rem;
  animation: reveal-rise 0.6s 0.22s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.reveal__primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 52px;
  padding: 0.75rem 1.45rem;
  border: 0;
  border-radius: 999px;
  background: #f5f4f2;
  color: #0c0b10;
  font: inherit;
  font-size: 1rem;
  font-weight: 680;
  letter-spacing: -0.02em;
  text-decoration: none;
  cursor: pointer;
}
.reveal__primary:hover { background: #ffffff; }
.reveal__primary:disabled { opacity: 0.55; cursor: default; }
.reveal__primary:focus-visible,
.reveal__quiet a:focus-visible {
  outline: 2px solid #f5f4f2;
  outline-offset: 3px;
}
.reveal__quiet {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.15rem 1.15rem;
}
.reveal__quiet a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  color: rgba(245, 244, 242, 0.78);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  text-decoration: none;
}
.reveal__quiet a:hover { color: #f7f5f2; }

@keyframes reveal-rise {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: none; }
}
@keyframes reveal-poster {
  from { opacity: 0; transform: translateY(16px) scale(0.985); }
  to { opacity: 1; transform: none; }
}
@media (min-width: 800px) {
  .reveal { padding-top: calc(var(--header-height, 70px) + 2.8rem); }
  .reveal__frame { aspect-ratio: 16 / 10; }
}
@media (max-width: 700px) {
  .reveal {
    padding-top: calc(var(--header-height, 70px) + 1.05rem);
  }
  .reveal h1 { font-size: 2.05rem; }
  .reveal__poster { margin-top: 1rem; }
  .reveal__frame { aspect-ratio: 1 / 1; }
  .reveal__actions { margin-top: 1rem; }
  .reveal__primary { width: min(100%, 28rem); }
  .reveal__quiet {
    flex-wrap: wrap;
    gap: 0 0.85rem;
    width: min(100%, 28rem);
  }
  .reveal__quiet a { font-size: 0.88rem; }
}
@media (min-width: 1024px) {
  .reveal { padding-bottom: 4.5rem; }
}
@media (prefers-reduced-motion: reduce) {
  .reveal__head,
  .reveal__poster,
  .reveal__actions { animation: none; }
}
</style>
