<template>
  <nav class="studio-nav" aria-label="Studio">
    <NuxtLink to="/ads" :aria-current="current === 'library' ? 'page' : undefined">My creations</NuxtLink>
    <NuxtLink to="/ads/create" :aria-current="current === 'templates' ? 'page' : undefined">Templates</NuxtLink>
    <NuxtLink to="/ads?view=archive" :aria-current="current === 'archive' ? 'page' : undefined">
      Archive
      <span v-if="archiveCount">{{ archiveCount }}</span>
    </NuxtLink>
  </nav>
</template>

<script setup>
defineProps({
  current: { type: String, default: 'library' },
  archiveCount: { type: Number, default: 0 },
})
</script>

<style scoped>
.studio-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.studio-nav a {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  color: rgba(247, 249, 252, 0.46);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  text-decoration: none;
}

.studio-nav a[aria-current="page"] {
  color: #f7f9fc;
}

.studio-nav a:hover,
.studio-nav a:focus-visible {
  color: #f7f9fc;
}

.studio-nav a:focus-visible {
  outline: 1px solid rgba(192, 132, 252, 0.7);
  outline-offset: 4px;
}

.studio-nav span {
  color: rgba(247, 249, 252, 0.38);
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
