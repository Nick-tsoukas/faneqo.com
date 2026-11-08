<template>
  <div class="dev-rel">
    <p class="dev-rel__rail">Design lab · local only · relationship story</p>
    <header class="dev-rel__bar">
      <p class="dev-rel__case">{{ current.title }}</p>
      <p class="dev-rel__note">{{ current.note }}</p>
    </header>
    <div class="dev-rel__stage">
      <LabsRelationshipStory v-bind="current.story" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import LabsRelationshipStory from '@/components/labs/LabsRelationshipStory.vue'
import { relationshipLabCases } from '@/config/relationshipLab'

definePageMeta({
  layout: false,
  robots: 'noindex, nofollow',
  sitemap: false,
})

if (!import.meta.dev) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useHead({
  title: 'Relationship lab · Faneqo',
  meta: [
    { name: 'robots', content: 'noindex, nofollow, noarchive' },
    { name: 'googlebot', content: 'noindex, nofollow, noarchive' },
  ],
})

const route = useRoute()
const current = computed(() => {
  const key = String(route.query.case || 'thesis')
  return relationshipLabCases[key] || relationshipLabCases.thesis
})
</script>

<style scoped>
.dev-rel {
  min-height: 100vh;
  background: #050608;
  color: #f7f9fc;
  padding: 1.25rem 1.1rem 3rem;
}
.dev-rel__rail {
  margin: 0 0 1.25rem;
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #9aa6b5;
}
.dev-rel__bar {
  margin: 0 0 1.4rem;
  max-width: 56rem;
}
.dev-rel__case {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(247, 249, 252, 0.55);
}
.dev-rel__note {
  margin: 0.25rem 0 0;
  color: #9aa6b5;
  font-size: 0.88rem;
}
.dev-rel__stage {
  max-width: 56rem;
}
</style>
