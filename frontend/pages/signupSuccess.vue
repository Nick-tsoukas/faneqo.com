<template>
  <AuthShell>
    <h1 class="auth-title">You're in</h1>
    <p class="auth-quiet" style="text-align: left; margin: 0.15rem 0 1.5rem">
      Your 30-day trial is active. Sign in to open your artist workspace.
    </p>
    <NuxtLink to="/login" class="auth-cta" style="text-decoration: none">
      Sign in
    </NuxtLink>
  </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '~/components/auth/AuthShell.vue'

definePageMeta({
  layout: 'auth',
  robots: 'noindex, nofollow',
  sitemap: false,
})

useHead({
  title: 'Account created',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

// Conversions are recorded only after the register API succeeds.
// This page is also the honeypot dead-end, so it must not emit events.
</script>
