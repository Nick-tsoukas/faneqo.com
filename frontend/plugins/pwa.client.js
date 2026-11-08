import { usePwa } from '~/composables/usePwa'

export default defineNuxtPlugin(() => {
  const { initPwa } = usePwa()
  
  if (typeof window !== 'undefined') {
    initPwa()
  }
})
