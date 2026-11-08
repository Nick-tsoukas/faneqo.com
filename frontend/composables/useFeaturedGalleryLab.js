/**
 * LOCAL-ONLY featured gallery experiment gate.
 *
 * Enabled only when BOTH are true:
 *   1. import.meta.dev
 *   2. ?featuredGalleryLab=1
 *
 * The query alone cannot turn this on. Nothing here reads or writes Strapi.
 */

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { FEATURED_GALLERY_LAB_QUERY } from '~/utils/media/featuredGalleryFixture'

export function useFeaturedGalleryLab() {
  const route = useRoute()
  const isDev = Boolean(import.meta.dev)
  const enabled = computed(() => {
    if (!isDev) return false
    const raw = route?.query?.[FEATURED_GALLERY_LAB_QUERY]
    const value = Array.isArray(raw) ? raw[0] : raw
    return String(value ?? '') === '1'
  })
  return { enabled, isDev }
}
