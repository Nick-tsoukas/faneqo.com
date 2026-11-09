<template>
  <div :class="isAppSurface ? 'fq-app' : 'bg-black'">
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    </Head>
    <Header />
    <div class="fq-route-pad" :class="hideMobilePad ? '' : 'pb-20 lg:pb-0'">
      <slot />
    </div>
    
    <!-- Mobile Bottom Nav for logged-in users -->
    <ClientOnly>
      <MobileBottomNav />
      <FanMobileBottomNav />
    </ClientOnly>
    
    <ClientOnly>
      <NetworkStatus />
      <FanAccountPrompt />
    </ClientOnly>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useHead } from '#imports'
import FanAccountPrompt from '~/components/fan/FanAccountPrompt.vue'
import FanMobileBottomNav from '~/components/messages/FanMobileBottomNav.vue'
import { isImmersiveMessagesPath, isMessagesWorkspacePath } from '~/utils/messages/messageChrome'
import { isFanAuthPath, isFaneqoAppPath } from '~/utils/ui/appSurface'

const route = useRoute()
// Fan auth surfaces own their viewport and show no bottom nav to inset for.
const hideMobilePad = computed(() =>
  isImmersiveMessagesPath(route.path) ||
  isMessagesWorkspacePath(route.path) ||
  isFanAuthPath(route.path)
)
const isAppSurface = computed(() => isFaneqoAppPath(route.path))

useHead({
  titleTemplate: (titleChunk) => {
    const title = String(titleChunk || '').trim()
    if (!title) return 'Faneqo'
    return /faneqo/i.test(title) ? title : `${title} | Faneqo`
  },
  meta: [
    {
      hid: 'description',
      name: 'description',
      content:
        'Faneqo gives artists one headquarters for music, shows, fan capture, messaging, support, QR codes, and actionable fan intelligence.'
    }
  ],
  script: [
    {
      src: 'https://www.googletagmanager.com/gtag/js?id=G-LRB82HECE7',
      async: true
    },
    {
      children: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-LRB82HECE7', { page_path: window.location.pathname });
      `
    }
  ]
})
</script>
