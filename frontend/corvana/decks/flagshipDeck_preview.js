// Design-review deck for the flagship presentation. It reuses
// the real Corvana player and controls, but is not listed and does not change
// the flagship sequence. Approved changes move into flagshipDeck_elite.js.
const slide = (id, chapter, componentKey) => ({
  id,
  type: 'dashboard_view',
  chapter,
  content: { componentKey, fullBleed: true },
})

export const flagshipDeck_preview = {
  slug: 'mbq-flagship-preview',
  title: 'Faneqo Flagship · Preview',
  subtitle: 'Slides awaiting visual approval',
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
    slug: 'mbq-flagship-preview',
    title: 'Faneqo Flagship · Preview',
    totalSlides: 10,
    createdAt: '2026-10-22',
  },
}
