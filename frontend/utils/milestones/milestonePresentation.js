/**
 * Presentation-only milestone copy. Never persist these strings.
 * Type semantics live on the backend; this mapper can change without migrations.
 */

export const MILESTONE_PRESENTATION = Object.freeze({
  'fan_artist.first_show': {
    line: 'IT STARTED HERE.',
    tone: 'quiet',
  },
  'fan_artist.second_show': {
    line: 'YOU CAME BACK.',
    tone: 'hero',
  },
  'fan_artist.first_reply': {
    line: 'YOU WROTE BACK.',
    tone: 'quiet',
  },
})

export function presentationForMilestone(type) {
  return MILESTONE_PRESENTATION[String(type || '')] || null
}
