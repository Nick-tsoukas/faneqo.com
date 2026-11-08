import { computed } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import {
  isReducedMotion,
  profileFirstContentMotion,
  profileHeroIdentityMotion,
  profileHeroImageMotion,
  profileHeroMetaMotion,
  profileHeroOverlayMotion,
} from '@/utils/ui/profileMotion'

export function useProfileMotion() {
  const preference = usePreferredReducedMotion()
  const reduced = computed(() => isReducedMotion(preference.value))

  return {
    reduced,
    heroImage: computed(() => profileHeroImageMotion(reduced.value)),
    heroOverlay: computed(() => profileHeroOverlayMotion(reduced.value)),
    heroIdentity: computed(() => profileHeroIdentityMotion(reduced.value)),
    heroMeta: computed(() => profileHeroMetaMotion(reduced.value)),
    firstContent: computed(() => profileFirstContentMotion(reduced.value)),
  }
}
