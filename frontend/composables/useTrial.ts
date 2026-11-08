// ~/composables/useTrial.ts
// ----------------------------------------------------------------------------
// Calculates how many days remain in the user’s free trial.
//
// • Assumes the logged‑in user record has a date field called `trialEndsAt`.
//   👉  If you use a different field name, change the line marked “CHANGE HERE”.
// • Uses date‑fns (already bundled with Nuxt). If you don’t have it, install:
//     pnpm add date-fns   # or npm / yarn
// ----------------------------------------------------------------------------
import { differenceInCalendarDays, isAfter } from 'date-fns'
import { computed } from 'vue'
import { useStrapiUser } from '#imports'

export const useTrial = () => {
  const user = useStrapiUser()

  // ⬇️ CHANGE HERE   (e.g. user.value?.trial_end or user.value?.trialEnds)
  const trialEndsAt = computed<Date | null>(() => {
    const dateStr = user.value?.trialEndsAt
    return dateStr ? new Date(dateStr) : null
  })

  const daysLeft = computed<number | null>(() => {
    if (!trialEndsAt.value) return null
    const today = new Date()
    return isAfter(today, trialEndsAt.value)
      ? 0
      : differenceInCalendarDays(trialEndsAt.value, today)
  })

  return { daysLeft, trialEndsAt }
}
