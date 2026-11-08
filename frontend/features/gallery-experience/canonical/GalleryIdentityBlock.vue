<template>
  <!-- overview: a wall label at the door, not a page billboard. -->
  <header v-if="variant === 'overview'" class="gid">
    <div class="gid__who">
      <component
        :is="identity.artistPath ? NuxtLink : 'span'"
        :to="identity.artistPath || undefined"
        class="gid__artist"
      >
        <span class="gid__ring">
          <img
            v-if="identity.artistImage"
            class="gid__img"
            :src="identity.artistImage.src"
            :srcset="identity.artistImage.srcset || undefined"
            :sizes="identity.artistImage.sizes || undefined"
            :style="focalStyle"
            alt=""
            decoding="async"
            fetchpriority="high"
          >
          <span v-else class="gid__initial" aria-hidden="true">{{ identity.artistInitial }}</span>
        </span>
        <span class="gid__name">{{ identity.artistName }}</span>
      </component>
      <p class="gid__meta">
        <span v-if="countLine" class="gid__count">{{ countLine }}</span>
        <NuxtLink v-if="identity.archivePath" :to="identity.archivePath" class="gid__archive">
          All galleries<span class="gid__arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </p>
    </div>

    <h1 class="gid__title">{{ identity.title }}</h1>

    <p v-if="contextLine" class="gid__line">{{ contextLine }}</p>
    <p v-if="identity.caption" class="gid__caption">{{ identity.caption }}</p>

    <div class="gid__plate" aria-hidden="true" />
  </header>

  <!-- viewer: orientation only. Small, subordinate, opposite the close. -->
  <p v-else class="gidv">
    <span class="gidv__ring">
      <img
        v-if="identity.artistImage"
        class="gidv__img"
        :src="identity.artistImage.src"
        :srcset="identity.artistImage.srcset || undefined"
        :sizes="identity.artistImage.sizes || undefined"
        :style="focalStyle"
        alt=""
        decoding="async"
      >
      <span v-else class="gidv__initial" aria-hidden="true">{{ identity.artistInitial }}</span>
    </span>
    <span class="gidv__text">{{ viewerLine }}</span>
  </p>
</template>

<script setup>
/**
 * Artist identity for the gallery — the wall text at the door.
 *
 * `variant="overview"` is a museum label, not a marketing header: the artist,
 * a bounded title, Night context when a Night exists, the artist's own words,
 * and a quiet way into the archive. The photographs begin on the hairline
 * beneath. Caption sits under the title on every width so a short title and
 * a short sentence cannot split into two disconnected columns.
 *
 * `variant="viewer"` is the quiet version for the disappearing chrome:
 * `[circle] Artist · Night title`, placed opposite the close control.
 *
 * FALLBACK
 * --------
 * No band image means a flat raised disc with a hairline and the artist's
 * initial. No gradient.
 */
import { computed } from 'vue'
import { NuxtLink } from '#components'

const props = defineProps({
  identity: { type: Object, required: true },
  variant: { type: String, default: 'overview' },
})

const focalStyle = computed(() => ({
  objectPosition: `${props.identity.focalX ?? 50}% ${props.identity.focalY ?? 50}%`,
}))

/** Venue · City · Date. The count lives with the artist, not here. */
const contextLine = computed(() => {
  const identity = props.identity
  return [identity.placeLine, identity.dateLine].filter(Boolean).join(' · ')
})

const countLine = computed(() => {
  const count = Number(props.identity.photoCount) || 0
  if (!count) return ''
  return count === 1 ? 'One photograph' : `${count} photographs`
})

const viewerLine = computed(() => {
  const identity = props.identity
  // Same name the wall label used. A Night title that never appears on the
  // overview would make the open photograph feel like a different show.
  return [identity.artistName, identity.title].filter(Boolean).join(' · ')
})
</script>

<style scoped>
/* ---------------- overview ---------------- */

.gid {
  --gid-x: max(20px, env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  max-width: calc(1600px + 2 * var(--gid-x));
  margin: 0 auto;
  padding: 4px var(--gid-x) 0;
}

@media (min-width: 640px) {
  .gid { --gid-x: max(32px, env(safe-area-inset-left, 0px)); padding-top: 8px; }
}

@media (min-width: 1024px) {
  .gid {
    --gid-x: max(56px, env(safe-area-inset-left, 0px));
    padding-top: 12px;
    max-width: calc(1280px + 2 * var(--gid-x));
  }
}

@media (min-width: 1440px) {
  .gid { --gid-x: max(72px, env(safe-area-inset-left, 0px)); }
}

.gid__who {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0;
}

.gid__artist {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 44px;
  color: rgba(247, 249, 252, 0.66);
  text-decoration: none;
  transition: color 160ms linear;
}

a.gid__artist:hover {
  color: rgba(247, 249, 252, 0.94);
}

.gid__artist:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 4px;
  border-radius: 2px;
}

.gid__ring {
  display: grid;
  place-items: center;
  flex: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  overflow: hidden;
  background: #0b0e14;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
}

@media (min-width: 1024px) {
  .gid__ring { width: 28px; height: 28px; }
}

.gid__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gid__initial {
  font-size: 11px;
  font-weight: 500;
  color: rgba(247, 249, 252, 0.7);
}

.gid__name {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 1024px) {
  .gid__name { font-size: 12.5px; }
}

.gid__meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;
  margin: 0;
  min-width: 0;
}

.gid__count {
  margin: 0;
  flex: none;
  font-size: 12.5px;
  letter-spacing: 0.02em;
  color: rgba(247, 249, 252, 0.46);
  font-variant-numeric: tabular-nums;
}

.gid__title {
  margin: 10px 0 0;
  max-width: 22ch;
  font-size: clamp(1.5rem, 6.4vw, 1.75rem);
  font-weight: 600;
  letter-spacing: -0.032em;
  line-height: 1.08;
  text-wrap: balance;
  overflow-wrap: anywhere;
  color: #f7f9fc;
}

@media (min-width: 640px) {
  .gid__title {
    margin-top: 14px;
    font-size: clamp(1.7rem, 3.2vw, 2.05rem);
  }
}

@media (min-width: 1024px) {
  .gid__title {
    margin-top: 16px;
    font-size: clamp(1.85rem, 2.1vw, 2.25rem);
    letter-spacing: -0.036em;
    line-height: 1.05;
  }
}

.gid__line {
  margin: 8px 0 0;
  font-size: 14.5px;
  line-height: 1.4;
  letter-spacing: -0.005em;
  color: rgba(247, 249, 252, 0.58);
  overflow-wrap: anywhere;
}

@media (min-width: 1024px) {
  .gid__line { margin-top: 10px; font-size: 15.5px; }
}

.gid__caption {
  margin: 14px 0 0;
  max-width: 42ch;
  font-size: 16px;
  line-height: 1.55;
  letter-spacing: -0.008em;
  color: rgba(247, 249, 252, 0.84);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

@media (min-width: 1024px) {
  .gid__caption {
    margin-top: 16px;
    font-size: 17px;
    line-height: 1.5;
  }
}

.gid__plate {
  margin: 18px 0 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 1024px) {
  .gid__plate { margin-top: 22px; }
}

.gid__archive {
  display: none;
  align-items: center;
  min-height: 44px;
  margin: -12px 0;
  color: rgba(247, 249, 252, 0.5);
  font-size: 12.5px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-decoration: none;
  white-space: nowrap;
  transition: color 160ms linear;
}

@media (min-width: 640px) {
  .gid__archive { display: inline-flex; }
}

.gid__archive:hover {
  color: rgba(247, 249, 252, 0.96);
}

.gid__arrow {
  display: inline-block;
  margin-left: 0.4em;
  transition: transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

@media (hover: hover) {
  .gid__archive:hover .gid__arrow { transform: translateX(3px); }
}

.gid__archive:focus-visible {
  outline: 2px solid rgba(247, 249, 252, 0.92);
  outline-offset: 3px;
  border-radius: 2px;
}

/* ---------------- viewer chrome ---------------- */

.gidv {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  min-width: 0;
  font-size: 12.5px;
  letter-spacing: 0.01em;
  color: rgba(247, 249, 252, 0.82);
  filter: drop-shadow(0 1px 10px rgba(0, 0, 0, 0.95));
}

.gidv__ring {
  display: grid;
  place-items: center;
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(11, 14, 20, 0.6);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.18);
}

.gidv__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.gidv__initial {
  font-size: 10px;
  font-weight: 500;
  color: rgba(247, 249, 252, 0.7);
}

.gidv__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .gid__artist,
  .gid__archive,
  .gid__arrow {
    transition: none;
  }
}
</style>
