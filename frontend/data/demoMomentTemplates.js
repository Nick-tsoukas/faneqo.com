/**
 * Moment templates for the demo experience
 */

export const momentTypes = [
  {
    id: 'i-was-there',
    label: 'I Was There',
    icon: '🎤',
    headline: 'I was there.',
    subline: 'And it was everything.',
  },
  {
    id: 'support-the-band',
    label: 'Support the Band',
    icon: '💜',
    headline: 'I support this artist.',
    subline: 'Real fans show up.',
  },
  {
    id: 'new-fan',
    label: 'New Fan',
    icon: '✨',
    headline: 'Just discovered them.',
    subline: 'This is the start of something.',
  },
  {
    id: 'favorite-song',
    label: 'Favorite Song',
    icon: '🎵',
    headline: 'This song hits different.',
    subline: 'On repeat forever.',
  },
]

export const vibeOptions = [
  { id: 'loud', label: 'Loud', emoji: '🔊' },
  { id: 'chills', label: 'Chills', emoji: '❄️' },
  { id: 'front-row', label: 'Front Row', emoji: '🎸' },
  { id: 'after-show', label: 'After Show', emoji: '🌙' },
  { id: 'first-time', label: 'First Time', emoji: '🌟' },
  { id: 'sing-along', label: 'Sing Along', emoji: '🎤' },
  { id: 'dancing', label: 'Dancing', emoji: '💃' },
  { id: 'emotional', label: 'Emotional', emoji: '😭' },
]

export const seededMoments = [
  {
    id: 'seed-1',
    momentType: 'i-was-there',
    city: 'Los Angeles',
    vibe: 'front-row',
    bandName: 'Neon Avenue',
    date: '2026-01-10',
    shared: true,
    caption: 'Best show of the year so far.',
  },
  {
    id: 'seed-2',
    momentType: 'new-fan',
    city: 'Austin',
    vibe: 'chills',
    bandName: 'Neon Avenue',
    date: '2026-01-08',
    shared: false,
    caption: 'Found them on a playlist. Obsessed.',
  },
]

export function generateMomentId() {
  return `moment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getMomentType(id) {
  return momentTypes.find(m => m.id === id)
}

export function getVibe(id) {
  return vibeOptions.find(v => v.id === id)
}
