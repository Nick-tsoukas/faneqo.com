<template>
  <div class="dev">
    <p class="dev__kicker">Design lab · local only · artist mobile dock</p>
    <h1>{{ heading }}</h1>
    <p class="dev__lede">
      Long content so the dock can be judged against a real page — not a floating widget.
    </p>
    <section v-for="n in 8" :key="n" class="dev__block">
      <h2>Section {{ n }}</h2>
      <p>
        Venue-dark body copy for clearance and contrast. The dock should stay calm,
        readable, and out of the way of this content.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { artistNavPreviewTab } from '~/utils/ui/artistNav'

definePageMeta({
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

const route = useRoute()
const tab = computed(() => artistNavPreviewTab(route.query.tab) || 'dashboard')
const heading = computed(() => {
  if (route.query.tab === 'share') return 'Share'
  return {
    dashboard: 'Dashboard',
    messages: 'Messages',
    artist: 'Artist',
    analytics: 'Analytics',
  }[tab.value] || 'Dashboard'
})

useHead(() => ({
  title: `Dock · ${heading.value}`,
  meta: [{ name: 'robots', content: 'noindex' }],
}))
</script>

<style scoped>
.dev {
  min-height: 100dvh;
  padding: 5.5rem 1.25rem 2rem;
  background: #050506;
  color: #f5f5f6;
}

.dev__kicker {
  margin: 0 0 0.85rem;
  color: rgba(245, 245, 246, 0.4);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dev h1 {
  margin: 0 0 0.55rem;
  font-size: 1.85rem;
  font-weight: 700;
  letter-spacing: -0.03em;
}

.dev__lede,
.dev__block p {
  margin: 0;
  color: rgba(245, 245, 246, 0.58);
  font-size: 0.95rem;
  line-height: 1.55;
}

.dev__block {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.dev__block h2 {
  margin: 0 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 600;
}
</style>
