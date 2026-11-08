<template>
  <div class="hub">
    <p class="hub__lede">
      Internal product studio. Open every visual experience proven through
      Phase 07. This is not a public product.
    </p>

    <section
      v-for="section in sections"
      :key="section.id"
      class="hub__section"
    >
      <h2 class="hub__kicker">{{ section.kicker }}</h2>
      <ul class="hub__list">
        <li
          v-for="item in section.items"
          :key="item.name"
          class="hub__row"
        >
          <div class="hub__copy">
            <p class="hub__status" :data-status="item.status">{{ item.statusLabel }}</p>
            <h3 class="hub__name">{{ item.name }}</h3>
            <p class="hub__blurb">{{ item.blurb }}</p>
            <p v-if="item.note" class="hub__note">{{ item.note }}</p>
          </div>
          <div class="hub__actions">
            <NuxtLink
              v-for="action in visibleActions(item)"
              :key="action.to"
              :to="action.to"
              class="hub__action"
              :class="{ 'is-quiet': action.local || item.status === 'not-built' }"
            >
              {{ action.label }}
            </NuxtLink>
          </div>
        </li>
      </ul>
    </section>

    <section v-if="isDev" class="hub__section">
      <h2 class="hub__kicker">Local visual fixtures</h2>
      <p class="hub__hint">
        Development only. Same boards as Labs, without the Labs shell. Not a
        production-style experience.
      </p>
      <ul class="hub__list is-compact">
        <li v-for="row in localFixtures" :key="row.to" class="hub__row is-compact">
          <div class="hub__copy">
            <p class="hub__status" data-status="local">Local only</p>
            <h3 class="hub__name">{{ row.name }}</h3>
          </div>
          <div class="hub__actions">
            <NuxtLink :to="row.to" class="hub__action is-quiet">Open</NuxtLink>
          </div>
        </li>
      </ul>
    </section>

    <section class="hub__section">
      <h2 class="hub__kicker">Engineering</h2>
      <ul class="hub__list is-compact">
        <li v-for="row in engineering" :key="row.to" class="hub__row is-compact">
          <div class="hub__copy">
            <h3 class="hub__name">{{ row.name }}</h3>
            <p class="hub__blurb">{{ row.blurb }}</p>
          </div>
          <div class="hub__actions">
            <NuxtLink :to="row.to" class="hub__action is-quiet">Open</NuxtLink>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup>
import { labsHubEngineering, labsHubSections } from '@/config/labsExperienceHub'

const isDev = import.meta.dev
const sections = labsHubSections
const engineering = labsHubEngineering

const localFixtures = [
  { name: 'Living Gallery', to: '/__dev/gallery-experience' },
  { name: 'Gallery', to: '/__dev/gallery' },
  { name: 'Night Story', to: '/__dev/night-story' },
  { name: 'Share Photos', to: '/__dev/share-photos' },
  { name: 'DM Media', to: '/__dev/dm-media' },
  { name: 'Relationship', to: '/__dev/relationship' },
]

function visibleActions(item) {
  return (item.actions || []).filter((action) => !action.local || isDev)
}
</script>

<style scoped>
.hub {
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
  color: #f7f9fc;
}
.hub__lede {
  margin: 0 0 2.4rem;
  max-width: 32rem;
  color: rgba(247, 249, 252, 0.55);
  font-size: 1rem;
  line-height: 1.55;
}
.hub__section {
  margin: 0 0 2.75rem;
}
.hub__kicker {
  margin: 0 0 0.85rem;
  font-size: 0.68rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.hub__hint {
  margin: -0.35rem 0 0.85rem;
  max-width: 32rem;
  color: rgba(247, 249, 252, 0.45);
  font-size: 0.88rem;
  line-height: 1.5;
}
.hub__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.hub__row {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem 0 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.hub__row.is-compact {
  padding: 0.85rem 0;
  gap: 0.55rem;
}
.hub__status {
  margin: 0 0 0.35rem;
  font-size: 0.62rem;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.38);
}
.hub__status[data-status='ready'] {
  color: #45e3ae;
}
.hub__status[data-status='not-built'] {
  color: rgba(247, 249, 252, 0.32);
}
.hub__status[data-status='local'] {
  color: rgba(247, 249, 252, 0.4);
}
.hub__name {
  margin: 0;
  font-size: 1.28rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.15;
}
.hub__row.is-compact .hub__name {
  font-size: 1.02rem;
  font-weight: 600;
}
.hub__blurb {
  margin: 0.35rem 0 0;
  max-width: 28rem;
  color: rgba(247, 249, 252, 0.58);
  font-size: 0.92rem;
  line-height: 1.45;
}
.hub__note {
  margin: 0.45rem 0 0;
  max-width: 30rem;
  color: rgba(247, 249, 252, 0.4);
  font-size: 0.82rem;
  line-height: 1.45;
}
.hub__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.7rem;
}
.hub__action {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.15rem;
  color: #f7f9fc;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  border-bottom: 1px solid rgba(247, 249, 252, 0.35);
}
.hub__action.is-quiet {
  color: rgba(247, 249, 252, 0.55);
  font-weight: 500;
  border-bottom-color: rgba(247, 249, 252, 0.16);
}
@media (min-width: 640px) {
  .hub__row {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
    gap: 1.5rem;
  }
  .hub__actions {
    flex-shrink: 0;
    justify-content: flex-end;
    padding-bottom: 0.15rem;
  }
}
</style>
