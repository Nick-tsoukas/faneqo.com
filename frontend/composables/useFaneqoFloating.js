/**
 * Shared Floating UI positioning for Faneqo-owned popovers.
 * Flip + shift so callers do not compute top/left themselves.
 */
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue'
import { onClickOutside, onKeyStroke } from '@vueuse/core'
import { computed, ref, unref, watch } from 'vue'

export function useFaneqoFloating(options = {}) {
  const open = ref(false)
  const referenceRef = ref(null)
  const floatingRef = ref(null)
  const lastFocus = ref(null)

  const { floatingStyles, placement, isPositioned } = useFloating(referenceRef, floatingRef, {
    placement: options.placement || 'top-end',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(options.offset ?? 8),
      flip({ padding: 12 }),
      shift({ padding: 12 }),
    ],
  })

  const positionedStyles = computed(() => ({
    ...floatingStyles.value,
    visibility: isPositioned.value ? 'visible' : 'hidden',
  }))

  function setOpen(next) {
    const value = typeof next === 'function' ? next(open.value) : !!next
    if (value && typeof document !== 'undefined') {
      lastFocus.value = document.activeElement
    }
    open.value = value
    if (!value && lastFocus.value && typeof lastFocus.value.focus === 'function') {
      const restore = unref(options.restoreFocus) !== false
      if (restore) lastFocus.value.focus()
    }
  }

  onClickOutside(floatingRef, (evt) => {
    if (!open.value) return
    const refEl = referenceRef.value
    if (refEl && (refEl === evt.target || refEl.contains?.(evt.target))) return
    setOpen(false)
  })

  onKeyStroke('Escape', (evt) => {
    if (!open.value) return
    evt.preventDefault()
    setOpen(false)
  })

  watch(open, (isOpen) => {
    options.onOpenChange?.(isOpen)
  })

  return {
    open,
    referenceRef,
    floatingRef,
    floatingStyles: positionedStyles,
    placement,
    isPositioned,
    setOpen,
  }
}
