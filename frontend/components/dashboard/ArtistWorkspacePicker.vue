<template>
  <div class="picker">
    <header class="picker__head">
      <h1 class="picker__title">Your artists</h1>
      <p class="picker__sub">
        Each artist keeps its own pages, events, fans, and team. Pick one to open its workspace.
      </p>
    </header>

    <ul class="picker__grid">
      <li v-for="band in bands" :key="band.id">
        <NuxtLink :to="dashboardPathForBand(band.id)" class="card">
          <div class="card__art">
            <NuxtImg
              v-if="band.imageUrl"
              provider="ipx"
              format="webp"
              :src="band.imageUrl"
              class="card__img"
              width="640"
              height="400"
              loading="lazy"
              decoding="async"
              :modifiers="{ fit: 'contain' }"
            />
            <span v-else class="card__fallback" aria-hidden="true">
              {{ initialFor(band) }}
            </span>
          </div>

          <div class="card__body">
            <h2 class="card__name">{{ band.name || band.title || 'Untitled artist' }}</h2>
            <span class="card__role" :class="roleClass(band)">{{ roleLabel(band) }}</span>
            <span class="card__open">
              Open workspace
              <svg class="card__arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { dashboardPathForBand } from '~/utils/ui/dashboardWorkspace'

defineProps({
  bands: {
    type: Array,
    required: true,
  },
})

function roleLabel(band) {
  if (band?.isOwner) return 'Owner'
  if (band?.accessRole === 'viewer') return 'Viewer'
  if (band?.accessRole === 'manager') return 'Manager'
  return 'Team access'
}

function roleClass(band) {
  if (band?.isOwner) return 'card__role--owner'
  if (band?.accessRole === 'viewer') return 'card__role--viewer'
  return 'card__role--manager'
}

function initialFor(band) {
  const name = String(band?.name || band?.title || '').trim()
  return name ? name.charAt(0).toUpperCase() : '?'
}
</script>

<style scoped>
.picker {
  padding-block: 0.5rem 1rem;
}

.picker__head {
  margin-bottom: 2rem;
}

.picker__title {
  color: var(--fq-text-primary, #f5f5f6);
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

@media (min-width: 768px) {
  .picker__title {
    font-size: 2.5rem;
  }
}

.picker__sub {
  margin-top: 0.6rem;
  max-width: 34rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.95rem;
  line-height: 1.55;
}

.picker__grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .picker__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1100px) {
  .picker__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* The whole card is the decision, so it is the target. */
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1px solid var(--fq-border, rgba(255, 255, 255, 0.07));
  border-radius: 1rem;
  background: var(--fq-surface, #0b0c10);
  text-decoration: none;
  transition: border-color 180ms ease, transform 180ms ease, background-color 180ms ease;
}

.card:hover,
.card:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(145, 0, 255, 0.42);
  background: var(--fq-surface-raised, #111217);
}

.card:focus-visible {
  outline: 2px solid rgba(145, 0, 255, 0.6);
  outline-offset: 2px;
}

.card__art {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--fq-surface-tinted, #0d0b10);
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.card__fallback {
  color: rgba(255, 255, 255, 0.22);
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1.1rem 1.25rem 1.25rem;
}

.card__name {
  color: var(--fq-text-primary, #f5f5f6);
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: -0.01em;
  overflow-wrap: anywhere;
}

.card__role {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.card__role--owner {
  color: #e9d5ff;
  border-color: rgba(167, 139, 250, 0.35);
  background: rgba(124, 58, 237, 0.18);
}

.card__role--manager {
  color: #f5d0fe;
  border-color: rgba(232, 121, 249, 0.3);
  background: rgba(192, 38, 211, 0.14);
}

.card__role--viewer {
  color: #d1d5db;
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
}

.card__open {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: auto;
  padding-top: 0.75rem;
  color: var(--fq-text-secondary, rgba(255, 255, 255, 0.58));
  font-size: 0.85rem;
  font-weight: 500;
  transition: color 180ms ease;
}

.card:hover .card__open,
.card:focus-visible .card__open {
  color: var(--fq-text-primary, #f5f5f6);
}

.card__arrow {
  width: 1rem;
  height: 1rem;
  transition: transform 180ms ease;
}

.card:hover .card__arrow,
.card:focus-visible .card__arrow {
  transform: translateX(3px);
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card__arrow,
  .card__open {
    transition: none;
  }

  .card:hover,
  .card:focus-visible {
    transform: none;
  }

  .card:hover .card__arrow,
  .card:focus-visible .card__arrow {
    transform: none;
  }
}
</style>
