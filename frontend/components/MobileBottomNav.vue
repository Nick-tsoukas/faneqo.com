<template>
  <AnimatePresence>
    <Motion
      v-if="visible"
      class="lg:hidden fixed bottom-0 left-0 right-0 z-40 overflow-visible"
      :initial="reduced ? { opacity: 0 } : { y: 16, opacity: 0 }"
      :animate="reduced ? { opacity: 1 } : { y: 0, opacity: 1 }"
      :exit="reduced ? { opacity: 0 } : { y: 18, opacity: 0 }"
      :transition="navRevealMotion"
    >
      <nav
        class="fq-artist-nav"
        aria-label="Artist workspace"
      >
        <div class="fq-artist-nav__row">
          <NuxtLink
            v-for="item in navItems"
            :key="item.id"
            :to="item.path"
            class="fq-artist-nav__item"
            :class="{ 'is-active': item.id === activeTab }"
            :aria-current="item.id === activeTab ? 'page' : undefined"
            :aria-label="item.ariaLabel"
          >
            <span class="fq-artist-nav__indicator" aria-hidden="true" />
            <span class="fq-artist-nav__icon">
              <component
                :is="item.icon"
                :size="21"
                :stroke-width="item.id === activeTab ? 2 : 1.75"
                aria-hidden="true"
              />
            </span>
            <span class="fq-artist-nav__label">{{ item.label }}</span>
          </NuxtLink>

          <button
            type="button"
            class="fq-artist-nav__item fq-artist-nav__share"
            :class="{ 'is-open': showShareDrawer }"
            aria-label="Share artist page"
            :aria-expanded="showShareDrawer"
            :disabled="!shareTarget.available"
            @click="openDockShare"
          >
            <span class="fq-artist-nav__share-face">
              <component
                :is="icons.share"
                :size="20"
                :stroke-width="1.75"
                class="fq-artist-nav__share-icon"
                aria-hidden="true"
              />
            </span>
            <span class="fq-artist-nav__label">Share</span>
          </button>
        </div>

        <ShareQrDrawer
          :is-open="showShareDrawer"
          :band-name="shareTarget.name"
          :band-slug="shareTarget.slug"
          :profile-image="shareTarget.profileImage"
          @close="showShareDrawer = false"
        />
      </nav>
    </Motion>
  </AnimatePresence>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AnimatePresence, Motion } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import { useStrapiUser } from '#imports'
import { useRuntimeConfig, useAsyncData } from '#app'
import { ChartColumn, LayoutDashboard } from '@lucide/vue'
import { faneqoIcons } from '~/utils/messages/faneqoIcons'
import { isImmersiveMessagesPath } from '~/utils/messages/messageChrome'
import { artistNavActiveTab, artistNavPreviewTab } from '~/utils/ui/artistNav'
import { isFanSectionPath } from '~/utils/ui/fanNav'
import { MOTION_STANDARD_S, motionEase, motionTokens } from '~/utils/ui/motionTokens'
import { useCyberedProfileChrome } from '~/composables/useCyberedProfileChrome'
import { usePublicArtistShare } from '~/composables/usePublicArtistShare'
import { useWorkspaceBand } from '~/composables/useWorkspaceBand'
import {
  resolveDockShareTarget,
  resolveWorkspaceShareBand,
  shareTargetChanged,
} from '~/utils/share/dockShareTarget'

const PREVIEW_BAND = {
  id: 'preview',
  slug: 'the-rockers',
  name: 'The Rockers',
  profileImage: null,
}

const route = useRoute()
const user = useStrapiUser()
const config = useRuntimeConfig()
const icons = faneqoIcons

const showShareDrawer = ref(false)
const reducedMotion = usePreferredReducedMotion()
const reduced = computed(() => reducedMotion.value === 'reduce')
const navRevealMotion = computed(() =>
  reduced.value
    ? motionTokens.micro
    : { duration: MOTION_STANDARD_S, ease: motionEase }
)
const { opening: cyberedHeroOpening } = useCyberedProfileChrome()

const devDockPreview = computed(() => {
  if (!import.meta.dev) return false
  if (route.path === '/__dev/artist-nav') return true
  return route.query.dock === '1' || route.query.dock === 'true'
})

const hideBottomNav = computed(() => {
  if (devDockPreview.value) return false
  if (isFanSectionPath(route.path)) return true
  if (isImmersiveMessagesPath(route.path)) return true
  return cyberedHeroOpening.value
})

const { data: bandData } = await useAsyncData(
  'user-band-nav',
  () => user.value?.id
    ? $fetch(`${config.public.strapiUrl}/api/bands`, {
        params: {
          'filters[users_permissions_user][id][$eq]': user.value.id,
          'fields[0]': 'slug',
          'fields[1]': 'name',
          'populate[bandImg][fields][0]': 'url',
        },
      })
    : Promise.resolve(null),
  {
    server: true,
    watch: () => user.value?.id,
  }
)

const userBand = computed(() => {
  const list = bandData.value?.data || []
  if (!list.length) return null
  const item = list[0]
  const attrs = item.attributes || item
  const bandImg = attrs.bandImg?.data?.attributes?.url || attrs.bandImg?.url
  let fullImageUrl = null
  if (bandImg) {
    fullImageUrl = bandImg.startsWith('http') ? bandImg : `${config.public.strapiUrl}${bandImg}`
  }
  return {
    id: item.id,
    slug: attrs.slug,
    name: attrs.name,
    profileImage: fullImageUrl,
  }
})

const displayBand = computed(() => userBand.value || (devDockPreview.value ? PREVIEW_BAND : null))

const visible = computed(() => {
  if (hideBottomNav.value) return false
  if (user.value && userBand.value) return true
  return devDockPreview.value && !!displayBand.value
})

const navItems = computed(() => {
  if (!displayBand.value) return []
  return [
    { id: 'dashboard', path: '/dashboard', label: 'Dashboard', ariaLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'messages', path: '/messages', label: 'Messages', ariaLabel: 'Messages', icon: icons.message },
    { id: 'artist', path: `/${displayBand.value.slug}`, label: 'Artist', ariaLabel: 'Artist page', icon: icons.user },
    { id: 'analytics', path: `/analytics/${displayBand.value.id}`, label: 'Analytics', ariaLabel: 'Analytics', icon: ChartColumn },
  ]
})

const activeTab = computed(() => {
  const preview = import.meta.dev ? artistNavPreviewTab(route.query.tab) : null
  if (preview) return preview
  return artistNavActiveTab(route.path, {
    slug: displayBand.value?.slug,
    bandId: displayBand.value?.id,
  })
})

const { band: activeWorkspaceBand, mode: workspaceMode } = useWorkspaceBand()
const { artist: publishedArtist } = usePublicArtistShare()

const workspaceShareBand = computed(() => resolveWorkspaceShareBand({
  active: activeWorkspaceBand.value
    ? { slug: activeWorkspaceBand.value.slug, name: activeWorkspaceBand.value.name }
    : null,
  mode: workspaceMode.value,
  legacyBand: displayBand.value,
}))

const shareTarget = computed(() => resolveDockShareTarget({
  routeSlug: route.params.bandSlug,
  publicArtist: publishedArtist.value,
  workspace: workspaceShareBand.value,
}))

function openDockShare() {
  if (!shareTarget.value.available) return
  showShareDrawer.value = true
}

watch(() => shareTarget.value.slug, (next, prev) => {
  if (prev && shareTargetChanged(prev, next)) showShareDrawer.value = false
})

onMounted(() => {
  if (!import.meta.dev) return
  if (route.query.share === '1' || route.query.tab === 'share') {
    showShareDrawer.value = true
  }
})
</script>

<style scoped>
.fq-artist-nav {
  position: relative;
  background: #050506;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.25rem 0.15rem calc(0.28rem + env(safe-area-inset-bottom, 0px));
}

.fq-artist-nav__row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  min-height: 3.85rem;
}

.fq-artist-nav__item {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.18rem;
  min-width: 0;
  min-height: 44px;
  padding: 0.1rem 0.08rem 0.05rem;
  border: 0;
  background: none;
  color: rgba(245, 245, 246, 0.52);
  text-decoration: none;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 0.1s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.14s ease;
}

.fq-artist-nav__item.is-active {
  color: #f5f5f6;
}

.fq-artist-nav__item:active {
  transform: scale(0.97);
}

.fq-artist-nav__item:focus-visible {
  outline: 2px solid rgba(255, 0, 255, 0.7);
  outline-offset: 2px;
  border-radius: 0.7rem;
}

.fq-artist-nav__indicator {
  width: 14px;
  height: 2px;
  border-radius: 99px;
  background: #ff00ff;
  opacity: 0;
  transform: scaleX(0.35);
  transition:
    opacity 0.14s ease,
    transform 0.14s cubic-bezier(0.22, 1, 0.36, 1);
}

.fq-artist-nav__item.is-active .fq-artist-nav__indicator {
  opacity: 1;
  transform: scaleX(1);
}

.fq-artist-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.55rem;
}

.fq-artist-nav__item.is-active .fq-artist-nav__icon {
  background: rgba(255, 255, 255, 0.06);
}

.fq-artist-nav__label {
  max-width: 100%;
  overflow: hidden;
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.015em;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
}

@media (min-width: 360px) {
  .fq-artist-nav__label {
    font-size: 0.6875rem;
  }
}

.fq-artist-nav__share {
  color: rgba(245, 245, 246, 0.62);
}

.fq-artist-nav__share.is-open {
  color: #f5f5f6;
}

.fq-artist-nav__share-face {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.125rem;
  height: 3.125rem;
  margin-top: -0.55rem;
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 1rem;
  background: #111217;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06),
    0 6px 16px rgba(0, 0, 0, 0.42);
  transition:
    transform 0.1s cubic-bezier(0.22, 1, 0.36, 1),
    border-color 0.14s ease,
    background-color 0.14s ease;
}

.fq-artist-nav__share-icon {
  display: block;
  transition: transform 0.1s cubic-bezier(0.22, 1, 0.36, 1);
}

.fq-artist-nav__share:active .fq-artist-nav__share-face {
  transform: scale(0.96);
  border-color: rgba(255, 0, 255, 0.55);
  background: #161018;
}

.fq-artist-nav__share:active .fq-artist-nav__share-icon {
  transform: translateY(-1px);
}

.fq-artist-nav__share.is-open .fq-artist-nav__share-face {
  border-color: rgba(255, 0, 255, 0.5);
  background: #161018;
}

.fq-artist-nav__share:disabled {
  opacity: 0.4;
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .fq-artist-nav__item,
  .fq-artist-nav__indicator,
  .fq-artist-nav__share-face,
  .fq-artist-nav__share-icon {
    transition: none;
  }

  .fq-artist-nav__item:active,
  .fq-artist-nav__share:active .fq-artist-nav__share-face,
  .fq-artist-nav__share:active .fq-artist-nav__share-icon {
    transform: none;
  }
}
</style>
