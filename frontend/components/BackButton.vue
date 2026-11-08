<template>
  <button
    @click="goBack"
    aria-label="Go back"
    class="absolute top-20 left-4 flex items-center justify-center
           w-10 h-10 text-gray-200 hover:text-white
           focus:outline-none focus:ring-2 focus:ring-gray-500
           rounded transition"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="w-6 h-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { nextTick } from 'vue'
import { useStrapiUser } from '#imports'   // auto-imported by @nuxtjs/strapi

const router = useRouter()
const route  = useRoute()
const user   = useStrapiUser()

function scrollToUpcoming() {
  nextTick(() => {
    const el = document.getElementById('upcoming-events')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  })
}

function goBack() {
  // 1) If we’re on an event page with a slug → back to /{slug}#upcoming-events
  if (route.path.startsWith('/event/') && route.query.slug) {
    const raw  = route.query.slug
    const slug = Array.isArray(raw) ? raw[0] : (raw as string)
    return router.push({ path: `/${slug}`, hash: '#upcoming-events' })
                 .then(scrollToUpcoming)
  }

  // 2) If logged in (Strapi user exists) → dashboard
  if (user.value) {
    return router.push('/dashboard')
  }

  // 3) Not logged in → pop history or send to home
  if (window.history.length > 1) {
    return router.back()
  }
  return router.push('/')
}
</script>
