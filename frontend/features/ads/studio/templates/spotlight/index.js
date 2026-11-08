/**
 * Artist Spotlight design style → Vue component. The style contract (ids,
 * labels, default, fallback to legacy) is pure data in ../../families.js.
 */
import { spotlightStyle } from '../../families.js'
import SpotlightEditorial from './SpotlightEditorial.vue'
import SpotlightCinematic from './SpotlightCinematic.vue'
import SpotlightCulture from './SpotlightCulture.vue'
import SpotlightLegacy from './SpotlightLegacy.vue'

export const SPOTLIGHT_STYLE_COMPONENTS = {
  editorial: SpotlightEditorial,
  cinematic: SpotlightCinematic,
  culture: SpotlightCulture,
  legacy: SpotlightLegacy,
}

/** Component for a content object (or a style id). Unknown or missing → legacy. */
export function spotlightStyleComponent(contentOrId) {
  const id = typeof contentOrId === 'string' ? spotlightStyle({ style: contentOrId }) : spotlightStyle(contentOrId)
  return SPOTLIGHT_STYLE_COMPONENTS[id]
}
