<template>
  <div class="min-h-screen bg-black text-white pt-[var(--header-height)]">
    <div class="max-w-lg mx-auto px-4 py-10 space-y-8">
      <NuxtLink
        v-if="user"
        to="/fan/profile"
        class="-mx-2 flex min-h-[56px] items-center gap-3 rounded-2xl px-2 transition-colors hover:bg-white/5"
        aria-label="Open your profile"
      >
        <FanAvatar :avatar-url="fanProfile?.avatarUrl" :initials="fanInitials" :size="40" />
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-semibold text-white">
            {{ fanName || 'Your profile' }}
          </span>
          <span class="block text-xs text-white/40">
            {{ fanName ? 'Profile' : 'Add profile' }}
          </span>
        </span>
        <component :is="chevronRight" :size="18" :stroke-width="1.75" class="text-white/30" aria-hidden="true" />
      </NuxtLink>

      <header class="space-y-2">
        <p class="text-xs uppercase tracking-[0.18em] text-violet-400/80">Faneqo</p>
        <h1 class="text-2xl font-semibold">Your Artists</h1>
        <p v-if="welcome" class="text-sm text-emerald-300/90">
          You're in. Your artists are saved to this account.
        </p>
        <p class="text-sm text-white/50">
          Artists linked to your Faneqo account.
          <NuxtLink to="/fan/messages" class="text-emerald-300/90 hover:text-emerald-200">Messages</NuxtLink>
          and
          <NuxtLink to="/fan/passport" class="text-emerald-300/90 hover:text-emerald-200">Passport</NuxtLink>
          live here too.
        </p>
      </header>

      <div v-if="loading" class="flex justify-center py-12">
        <div class="w-9 h-9 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>

      <div v-else-if="!user" class="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <p class="text-white/70 text-sm">Sign in to see artists linked to your account.</p>
        <NuxtLink
          to="/fan/login"
          class="inline-block rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2.5"
        >
          Sign in
        </NuxtLink>
      </div>

      <section v-else class="space-y-3">
        <div
          v-if="!artists.length"
          class="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/55"
        >
          No linked artists yet. Join a Fan List from an artist page — we'll attach it to this account when the email matches.
        </div>

        <NuxtLink
          v-for="artist in artists"
          :key="artist.bandId"
          :to="artist.slug ? `/${artist.slug}` : '/'"
          class="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0f0f12] px-4 py-3 hover:border-white/20 transition-colors"
        >
          <div class="w-12 h-12 rounded-xl overflow-hidden bg-white/10 shrink-0">
            <img
              v-if="artist.logoUrl"
              :src="artist.logoUrl"
              :alt="artist.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0">
            <p class="font-medium text-white truncate">{{ artist.name }}</p>
            <p class="text-xs text-white/40">Artist</p>
          </div>
        </NuxtLink>
      </section>
    </div>
  </div>
</template>

<script setup>
import FanAvatar from '~/components/fan/FanAvatar.vue'
import { useFanProfile } from '~/composables/useFanProfile'
import { fanProfileDisplayName, fanProfileInitials } from '~/utils/fan/fanProfileIdentity'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const config = useRuntimeConfig()
const user = useStrapiUser()
const { profile: fanProfile, loadProfile } = useFanProfile()

const chevronRight = faneqoIcons.chevronRight
const welcome = computed(() => route.query.welcome === '1')
const loading = ref(true)
const artists = ref([])

const fanName = computed(() => fanProfileDisplayName(fanProfile.value))
const fanInitials = computed(() => fanProfileInitials(fanProfile.value))

onMounted(async () => {
  if (!user.value) {
    loading.value = false
    return
  }
  // Identity is secondary here: a failed profile load must not affect artists.
  loadProfile().catch(() => {})
  try {
    const strapiToken = useStrapiToken()
    const res = await $fetch(`${config.public.strapiUrl}/api/fan-account/artists`, {
      headers: strapiToken.value
        ? { Authorization: `Bearer ${strapiToken.value}` }
        : {},
    })
    artists.value = res?.data?.artists || []
  } catch (err) {
    console.warn('[FanHome] artists failed', err)
    artists.value = []
  } finally {
    loading.value = false
  }
})

useHead({
  title: 'Your Artists',
})
</script>
