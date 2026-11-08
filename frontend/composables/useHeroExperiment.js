/**
 * LOCAL-ONLY artist hero experiment gate + state.
 *
 * Enabled only when BOTH are true:
 *   1. import.meta.dev  (never in a production build)
 *   2. ?heroExperiment=1 on the route
 *
 * The query parameter alone can never enable this. When disabled every getter
 * returns the inert original values so the public rendering path is untouched.
 *
 * This composable never calls the Band update API or any upload endpoint.
 */

import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  HERO_EXPERIMENT_QUERY_KEY,
  clearHeroExperimentState,
  createHeroExperimentState,
  getHeroExperimentRatio,
  normalizeHeroExperimentFit,
  normalizeHeroExperimentMode,
  readHeroExperimentState,
  resolveAdaptivePresentation,
  seedDesktopFraming,
  writeHeroExperimentState,
} from '~/utils/media/heroExperiment'
import { clampArtistFocalPercent, clampArtistZoom } from '~/utils/media/artistImage'

export function useHeroExperiment(bandRef) {
  const route = useRoute()
  const band = computed(() => (typeof bandRef === 'function' ? bandRef() : bandRef?.value) || null)

  // import.meta.dev is inlined at build time, so production tree-shakes this off.
  const isDev = Boolean(import.meta.dev)
  const flagged = computed(() => {
    const raw = route?.query?.[HERO_EXPERIMENT_QUERY_KEY]
    const value = Array.isArray(raw) ? raw[0] : raw
    return String(value ?? '') === '1'
  })
  const enabled = computed(() => isDev && flagged.value)

  // Start from the inert default on both server and client so the first client
  // render matches SSR. Stored settings are applied after mount only.
  const state = ref(createHeroExperimentState(band.value))
  const hydrated = ref(false)

  function loadFromStorage() {
    if (!enabled.value) return
    state.value = readHeroExperimentState(band.value)
    hydrated.value = true
  }

  function persist() {
    if (!enabled.value || !hydrated.value) return
    writeHeroExperimentState(band.value, state.value)
  }

  // Re-seed only when the artist or their photo actually changes identity.
  watch(
    () => [band.value?.slug, band.value?.id, band.value?.bandImg?.url],
    () => {
      hydrated.value = false
      state.value = createHeroExperimentState(band.value)
      loadFromStorage()
    },
  )

  const mode = computed(() => (enabled.value ? state.value.mode : 'original'))
  const desktop = computed(() => state.value.desktop)
  const sourceRatio = computed(() => getHeroExperimentRatio(band.value?.bandImg))

  // Source ratio does not change with viewport, so presentation is stable
  // across resize by construction. Hysteresis guards dimension late-arrival.
  const presentation = ref(null)
  const adaptivePresentation = computed(() => {
    const next = resolveAdaptivePresentation(sourceRatio.value, presentation.value)
    presentation.value = next
    return next
  })

  function setMode(next) {
    state.value = { ...state.value, mode: normalizeHeroExperimentMode(next) }
    persist()
  }

  function setDesktop(patch) {
    const current = state.value.desktop
    const fit = patch.fit != null ? normalizeHeroExperimentFit(patch.fit) : current.fit
    state.value = {
      ...state.value,
      desktop: {
        positionX: clampArtistFocalPercent(patch.positionX ?? current.positionX),
        positionY: clampArtistFocalPercent(patch.positionY ?? current.positionY),
        // Full photo is the whole frame: zoom is pinned to 1 and controls lock.
        zoom: fit === 'full' ? 1 : clampArtistZoom(patch.zoom ?? current.zoom),
        fit,
      },
    }
    persist()
  }

  /** Reset returns the experiment to Original and re-seeds desktop from mobile. */
  function reset() {
    clearHeroExperimentState(band.value)
    state.value = createHeroExperimentState(band.value)
    return seedDesktopFraming(band.value)
  }

  return {
    enabled,
    isDev,
    mode,
    desktop,
    sourceRatio,
    adaptivePresentation,
    setMode,
    setDesktop,
    reset,
    loadFromStorage,
  }
}
