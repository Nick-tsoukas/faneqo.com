import { FANEQO_GALLERY_MEMORY_PROPS } from '~/utils/rive/faneqoGalleryMemory'

function api(riveRef) {
  return riveRef?.value || riveRef || null
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFaneqoGalleryMemory(riveRef) {
  function bind({ artistName = '', photoCount = 0, saving = false, saved = false } = {}) {
    const rive = api(riveRef)
    rive?.setString?.(FANEQO_GALLERY_MEMORY_PROPS.artistName, String(artistName || ''))
    rive?.setNumber?.(FANEQO_GALLERY_MEMORY_PROPS.photoCount, Math.max(0, Number(photoCount) || 0))
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saving, !!saving)
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saved, !!saved)
  }

  function celebrate() {
    const rive = api(riveRef)
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saving, false)
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saved, true)
    if (prefersReducedMotion()) return
    rive?.fireTrigger?.(FANEQO_GALLERY_MEMORY_PROPS.save)
    rive?.play?.()
  }

  function remove() {
    const rive = api(riveRef)
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saving, false)
    rive?.setBoolean?.(FANEQO_GALLERY_MEMORY_PROPS.saved, false)
    if (prefersReducedMotion()) return
    rive?.fireTrigger?.(FANEQO_GALLERY_MEMORY_PROPS.remove)
    rive?.play?.()
  }

  return { bind, celebrate, remove }
}
