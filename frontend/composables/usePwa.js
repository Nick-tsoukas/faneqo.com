import { ref } from 'vue'
import {
  claimServiceWorkerReload,
  isStaleAssetError,
  shouldFullLoadUpdatedApp,
} from '~/utils/pwa/applyUpdate'

const isOnline = ref(true)
const installPromptEvent = ref(null)
const canInstall = ref(false)

let started = false
let updatePending = false

export function usePwa() {
  const promptInstall = async () => {
    if (!installPromptEvent.value) return false

    installPromptEvent.value.prompt()
    const { outcome } = await installPromptEvent.value.userChoice

    if (outcome === 'accepted') {
      canInstall.value = false
      installPromptEvent.value = null
    }

    return outcome === 'accepted'
  }

  const initPwa = () => {
    if (typeof window === 'undefined' || started) return
    started = true

    isOnline.value = navigator.onLine
    window.addEventListener('online', () => {
      isOnline.value = true
    })
    window.addEventListener('offline', () => {
      isOnline.value = false
    })

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault()
      installPromptEvent.value = event
      canInstall.value = true
    })

    if (!('serviceWorker' in navigator)) return

    // First install claims the page once. That is not an update.
    const hadController = Boolean(navigator.serviceWorker.controller)
    if (hadController) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        updatePending = true
      })
    }

    const reloadOnce = () => {
      if (!navigator.onLine) return
      if (!claimServiceWorkerReload(window.sessionStorage)) return
      window.location.reload()
    }

    window.addEventListener('vite:preloadError', (event) => {
      if (!navigator.onLine) return
      if (!claimServiceWorkerReload(window.sessionStorage)) return
      event.preventDefault?.()
      window.location.reload()
    })

    window.addEventListener('unhandledrejection', (event) => {
      if (!isStaleAssetError(event.reason)) return
      event.preventDefault?.()
      reloadOnce()
    })

    const router = useRouter()
    router.beforeEach((to, from) => {
      if (!updatePending) return true
      if (!shouldFullLoadUpdatedApp({ fromPath: from?.path, toPath: to?.path })) return true
      if (!claimServiceWorkerReload(window.sessionStorage)) return true
      const next = to?.fullPath || to?.path
      if (!next || next === from?.fullPath) return true
      window.location.assign(next)
      return false
    })
  }

  return {
    isOnline,
    canInstall,
    promptInstall,
    initPwa,
  }
}
