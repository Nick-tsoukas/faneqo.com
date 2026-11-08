// Faneqo flagship presentation: ten full-bleed scenes, each a self-contained,
// animated composition (corvana/decks/motion/useSceneMotion.js). New design work
// happens in flagshipDeck_preview.js first. The previous nine-scene flagship is
// kept in flagshipDeck_industry.js for rollback.
const slide = (id, chapter, componentKey) => ({
  id,
  type: 'dashboard_view',
  chapter,
  content: { componentKey, fullBleed: true },
})

export const flagshipDeck_elite = {
  slug: 'mbq-flagship-elite',
  title: 'Faneqo Flagship',
  subtitle: 'Every artist has a world',
  slides: [
    slide(1, 'Opening', 'FaneqoCoverSlide'),
    slide(2, 'Connect', 'FaneqoConnectSlide'),
    slide(3, 'Identity', 'FaneqoHomeSlide'),
    slide(4, 'The room', 'FaneqoRoomSlide'),
    slide(5, 'The night', 'FaneqoNightSlide'),
    slide(6, 'Conversation', 'FaneqoConversationSlide'),
    slide(7, 'Support', 'FaneqoSupportSlide'),
    slide(8, 'Insight', 'FaneqoInsightSlide'),
    slide(9, 'Relationship', 'FaneqoJourneySlide'),
    slide(10, 'Close', 'FaneqoClosingSlide'),
  ],
  metadata: {
    slug: 'mbq-flagship-elite',
    title: 'Faneqo Flagship',
    subtitle: 'Every artist has a world',
    totalSlides: 10,
    createdAt: '2026-10-24',
    version: 'every-artist-2026',
  },
}
