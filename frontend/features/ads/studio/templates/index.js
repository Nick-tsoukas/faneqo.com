/**
 * Template family → Vue component. The family contract itself (formats,
 * variants, presets, defaults, media, scenes) is pure data in ../families.js.
 */
import ArtistSpotlight from './ArtistSpotlight.vue'
import SongSpotlight from './SongSpotlight.vue'
import ProductShowcase from './ProductShowcase.vue'
import TypeStatement from './TypeStatement.vue'
import EducationCarousel from './EducationCarousel.vue'
import ShowPromo from './ShowPromo.vue'
import MusicInsights from './MusicInsights.vue'
import { TEMPLATE_FAMILIES as FAMILIES, templateFamily } from '../families.js'

const COMPONENTS = {
  'artist-spotlight': ArtistSpotlight,
  'song-spotlight': SongSpotlight,
  'product-showcase': ProductShowcase,
  'type-statement': TypeStatement,
  'education': EducationCarousel,
  'show-promo': ShowPromo,
  insights: MusicInsights,
}

export const TEMPLATE_FAMILIES = FAMILIES.map((family) => ({ ...family, component: COMPONENTS[family.id] || null }))

export function templateComponentFor(id) {
  return COMPONENTS[id] || null
}

export { templateFamily }
