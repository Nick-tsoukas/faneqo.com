/**
 * Guided one-page artist setup. Navigation metadata only.
 * Do not invent sections for fields that are not on the form.
 */

export const ARTIST_SETUP_SECTION_DEFS = [
  { id: 'setup-details', key: 'details', label: 'Artist details', short: 'Details', required: true },
  { id: 'setup-profile', key: 'profile', label: 'Profile', short: 'Profile', required: false },
  { id: 'setup-editorial', key: 'editorial', label: 'Editorial', short: 'Editorial', required: false, editOnly: true, gated: 'editorial' },
  { id: 'setup-music', key: 'music', label: 'Featured music', short: 'Music', required: false },
  { id: 'setup-video', key: 'video', label: 'Video', short: 'Video', required: false },
  { id: 'setup-links', key: 'links', label: 'Links', short: 'Links', required: false },
  { id: 'setup-streaming', key: 'streaming', label: 'Streaming', short: 'Streaming', required: false },
  { id: 'setup-social', key: 'social', label: 'Social', short: 'Social', required: false },
  { id: 'setup-support', key: 'support', label: 'Support', short: 'Support', required: false },
]

export function visibleArtistSetupSections({ isEdit = false, hasEditorial = false } = {}) {
  return ARTIST_SETUP_SECTION_DEFS.filter((section) => {
    if (section.editOnly && !isEdit) return false
    if (section.gated === 'editorial' && !hasEditorial) return false
    return true
  }).map((section, index) => ({
    ...section,
    number: String(index + 1).padStart(2, '0'),
  }))
}

export function sectionIndex(sections, id) {
  return sections.findIndex((section) => section.id === id)
}

/**
 * Honest completion only. Optional empty sections stay "available", never incomplete.
 */
export function artistSetupSectionStatus(key, state = {}) {
  switch (key) {
    case 'details': {
      const named = Boolean(state.name?.trim() && state.bio?.trim())
      if (!named) return 'available'
      if (state.genreRequired && !state.genre?.trim()) return 'available'
      return 'complete'
    }
    case 'profile':
      return state.hasImage ? 'complete' : 'available'
    case 'editorial':
      return state.hasEditorial ? 'complete' : 'available'
    case 'music':
      return state.hasFeaturedMusic ? 'complete' : 'available'
    case 'video':
      return state.hasVideo ? 'complete' : 'available'
    case 'links':
      return state.hasLinks ? 'complete' : 'available'
    case 'streaming':
      return state.hasStreaming ? 'complete' : 'available'
    case 'social':
      return state.hasSocial ? 'complete' : 'available'
    case 'support':
      return state.hasSupport ? 'complete' : 'available'
    default:
      return 'available'
  }
}

export function hasAnyFilled(values) {
  if (!values) return false
  if (Array.isArray(values)) {
    return values.some((item) => {
      if (!item || typeof item !== 'object') return Boolean(item)
      return Object.values(item).some((value) => String(value || '').trim())
    })
  }
  if (typeof values === 'object') {
    return Object.values(values).some((value) => String(value || '').trim())
  }
  return Boolean(String(values).trim())
}
