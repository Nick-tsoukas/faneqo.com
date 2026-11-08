// Previous Faneqo flagship (the nine-scene industry deck, Sept 2026). Kept for
// rollback: reachable by URL at /corvana/decks/mbq-flagship-industry, not listed.
// To restore it as the public flagship, map FLAGSHIP_DECK_SLUG to this deck in
// deckIndex.js. It composes FaneqoIndustryDeckSlide product scenes.
const productSlide = (id, chapter, scene) => ({
  id,
  type: 'dashboard_view',
  chapter,
  content: {
    componentKey: 'FaneqoIndustryDeckSlide',
    demoDataKey: scene,
    fullBleed: true,
  },
})

export const flagshipDeck_industry = {
  slug: 'mbq-flagship-industry',
  title: 'Faneqo Industry Deck (previous flagship)',
  subtitle: 'The fan relationship platform for music',
  slides: [
    {
      id: 1,
      type: 'dashboard_view',
      chapter: 'Opening',
      content: {
        componentKey: 'FaneqoCoverSlide',
        fullBleed: true,
      },
    },
    productSlide(2, 'The gap', 'problem'),
    productSlide(3, 'Artist World', 'artist-world'),
    productSlide(4, 'Show Mode', 'show-mode'),
    productSlide(5, 'The Night', 'remember'),
    productSlide(6, 'Messaging', 'message'),
    productSlide(7, 'Fan Passport', 'passport'),
    productSlide(8, 'Roster management', 'roster'),
    productSlide(9, 'Close', 'close'),
  ],
  metadata: {
    slug: 'mbq-flagship-industry',
    title: 'Faneqo Industry Deck (previous flagship)',
    subtitle: 'The fan relationship platform for music',
    totalSlides: 9,
    createdAt: '2026-09-18',
    version: 'lost-lands-2026',
  },
}
