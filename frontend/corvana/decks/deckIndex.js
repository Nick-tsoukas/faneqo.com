// Corvana Deck Index - Central registry for all presentation decks
import { flagshipDeck_elite } from './flagshipDeck_elite.js'
import { flagshipDeck_preview } from './flagshipDeck_preview.js'
import { flagshipDeck_industry } from './flagshipDeck_industry.js'

export const FLAGSHIP_DECK_SLUG = 'mbq-flagship-elite'
export const FLAGSHIP_DECK_PATH = '/presentation'

// Deck metadata for listing page
export const deckIndex = [
  {
    slug: FLAGSHIP_DECK_SLUG,
    title: 'Faneqo Flagship',
    subtitle: 'Every artist has a world',
    version: 'every-artist-2026',
    slideCount: 10,
    tags: ['Flagship', 'Industry', 'Primary'],
    lastUpdated: 'Oct 2026',
    isPrimary: true
  },
]

// Map slugs to deck definitions. Only the flagship is listed; the preview (design
// work) and the previous flagship (rollback) are reachable by URL only.
const deckDefinitions = {
  [FLAGSHIP_DECK_SLUG]: flagshipDeck_elite,
  [flagshipDeck_preview.slug]: flagshipDeck_preview,
  [flagshipDeck_industry.slug]: flagshipDeck_industry,
}

// Get deck definition by slug
export function getDeckBySlug(slug) {
  const deck = deckDefinitions[slug]
  if (!deck) {
    throw new Error(`Deck "${slug}" not found`)
  }
  return deck
}

// Get all deck metadata
export function getAllDecks() {
  return deckIndex
}
