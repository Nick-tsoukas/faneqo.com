<template>
  <AnimatePresence>
    <Motion
      v-if="visible"
      class="lg:hidden fixed bottom-0 left-0 right-0 z-40"
      :initial="reduced ? { opacity: 0 } : { y: 16, opacity: 0 }"
      :animate="reduced ? { opacity: 1 } : { y: 0, opacity: 1 }"
      :exit="reduced ? { opacity: 0 } : { y: 18, opacity: 0 }"
      :transition="motionTokens.navigation"
    >
  <nav
    class="fq-fan-nav"
    aria-label="Fan navigation"
  >
    <NuxtLink
      to="/fan"
      class="fq-fan-nav__item"
      :class="{ 'is-active': isArtists }"
      :aria-current="isArtists ? 'page' : undefined"
    >
      <component :is="icons.users" :size="20" :stroke-width="1.75" aria-hidden="true" />
      <span>Artists</span>
    </NuxtLink>
    <NuxtLink
      to="/fan/messages"
      class="fq-fan-nav__item"
      :class="{ 'is-active': isMessages }"
      :aria-current="isMessages ? 'page' : undefined"
    >
      <component :is="icons.message" :size="20" :stroke-width="1.75" aria-hidden="true" />
      <span>Messages</span>
    </NuxtLink>
    <NuxtLink
      to="/fan/passport"
      class="fq-fan-nav__item"
      :class="{ 'is-active': isPassport }"
      :aria-current="isPassport ? 'page' : undefined"
    >
      <component :is="icons.ticket" :size="20" :stroke-width="1.75" aria-hidden="true" />
      <span>Passport</span>
    </NuxtLink>
    <NuxtLink
      to="/fan/profile"
      class="fq-fan-nav__item"
      :class="{ 'is-active': isProfile }"
      :aria-current="isProfile ? 'page' : undefined"
    >
      <component :is="icons.user" :size="20" :stroke-width="1.75" aria-hidden="true" />
      <span>Profile</span>
    </NuxtLink>
  </nav>
    </Motion>
  </AnimatePresence>
</template>

<script setup>
import { computed } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { fanNavActiveTab, isFanNavVisible } from '~/utils/ui/fanNav'
import { motionTokens } from '~/utils/ui/motionTokens'

const route = useRoute()
const icons = faneqoIcons
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const visible = computed(() => isFanNavVisible(route.path))
const activeTab = computed(() => fanNavActiveTab(route.path))
const isArtists = computed(() => activeTab.value === 'artists')
const isPassport = computed(() => activeTab.value === 'passport')
const isMessages = computed(() => activeTab.value === 'messages')
const isProfile = computed(() => activeTab.value === 'profile')
</script>

<style scoped>
.fq-fan-nav {
  display: flex;
  padding: 0.4rem 0.35rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
  background: rgba(5, 5, 5, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Four tabs share the width evenly so the labels still fit at 320px. */
.fq-fan-nav__item {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  min-width: 0;
  min-height: 44px;
  color: rgba(255, 255, 255, 0.42);
  text-decoration: none;
  font-size: 0.68rem;
  font-weight: 650;
}

.fq-fan-nav__item.is-active {
  color: var(--fq-accent-cyan, #39D5FF);
}

.fq-fan-nav__item:focus-visible {
  outline: 2px solid rgba(57, 213, 255, 0.75);
  outline-offset: 2px;
  border-radius: 0.55rem;
}
</style>
