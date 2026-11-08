// composables/useGeo.ts
import { computed } from 'vue'

export function useGeo() {
  // Cookie is set by server middleware on first request
  const country = useCookie<string | null>('country', { default: () => null })
  const isTH = computed(() => (country.value?.toUpperCase?.() === 'TH'))

  return { country, isTH }
}
