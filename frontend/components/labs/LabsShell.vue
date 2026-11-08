<template>
  <div class="labs">
    <header class="labs__top">
      <p class="labs__kicker">Faneqo Labs</p>
      <h1 class="labs__title">{{ title }}</h1>
      <p class="labs__sub">Internal product studio. Not a public surface.</p>
    </header>

    <nav class="labs__nav" aria-label="Labs">
      <NuxtLink to="/labs">Studio</NuxtLink>
      <NuxtLink to="/labs/gallery-experience">Experience</NuxtLink>
      <NuxtLink to="/labs/gallery">Gallery</NuxtLink>
      <NuxtLink to="/labs/night-story">Night Story</NuxtLink>
      <NuxtLink to="/labs/night-recordings">Recordings</NuxtLink>
      <NuxtLink to="/labs/share-photos-lab">Share Photos</NuxtLink>
      <NuxtLink to="/labs/dm-media">DM</NuxtLink>
      <NuxtLink to="/labs/relationship">Relationship</NuxtLink>
      <NuxtLink to="/labs/passport">FanPassport</NuxtLink>
    </nav>

    <main class="labs__main" :class="{ 'is-wide': wide }">
      <slot />
    </main>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Labs' },
  wide: { type: Boolean, default: false },
})
</script>

<style scoped>
.labs {
  min-height: 100vh;
  background: #050608;
  color: #f7f9fc;
  padding: 1.5rem 1.25rem 3rem;
  font-family: Poppins, ui-sans-serif, system-ui, sans-serif;
}
.labs__kicker {
  margin: 0;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(247, 249, 252, 0.42);
}
.labs__title {
  margin: 0.35rem 0 0;
  font-size: clamp(1.55rem, 4vw, 2.1rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
}
.labs__sub {
  margin: 0.4rem 0 0;
  color: rgba(247, 249, 252, 0.48);
  font-size: 0.9rem;
}
.labs__nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.15rem 0.15rem;
  margin: 1.35rem 0 1.6rem;
  padding: 0.55rem 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.labs__nav a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 0.7rem 0 0;
  color: rgba(247, 249, 252, 0.48);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
}
.labs__nav a.router-link-exact-active {
  color: #f7f9fc;
}
.labs__main {
  max-width: 52rem;
}
.labs__main.is-wide {
  max-width: min(100%, 92rem);
}
</style>
