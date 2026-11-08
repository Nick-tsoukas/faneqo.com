import { nextTick, unref } from 'vue'

/**
 * Minimal focus trap for our own dialogs. No dependency, no global registry —
 * each dialog owns one instance and only one dialog is ever open at a time.
 *
 * Usage: give the dialog element `tabindex="-1"` and a template ref, then call
 * `activate()` when it opens and `deactivate()` when it closes.
 */
const FOCUSABLE_SELECTOR = [
  'button',
  '[href]',
  'input',
  'select',
  'textarea',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function useFocusTrap(containerRef, { onEscape } = {}) {
  let previouslyFocused = null
  let active = false

  function getFocusable() {
    const root = unref(containerRef)
    if (!root) return []

    return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter((el) => {
      if (el.hasAttribute('disabled') || el.getAttribute('aria-hidden') === 'true') return false
      // getClientRects beats offsetParent here: it also reports correctly for
      // fixed-position elements, which offsetParent does not.
      return el.getClientRects().length > 0
    })
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      onEscape?.()
      return
    }

    if (event.key !== 'Tab') return

    const root = unref(containerRef)
    if (!root) return

    const items = getFocusable()

    if (!items.length) {
      event.preventDefault()
      root.focus()
      return
    }

    const first = items[0]
    const last = items[items.length - 1]
    const current = document.activeElement
    const outside = !root.contains(current)

    if (event.shiftKey) {
      if (outside || current === first || current === root) {
        event.preventDefault()
        last.focus()
      }
    } else if (outside || current === last) {
      event.preventDefault()
      first.focus()
    }
  }

  async function activate() {
    if (typeof document === 'undefined' || active) return

    previouslyFocused = document.activeElement
    active = true
    // Capture phase so Tab is handled before anything on the page behind.
    window.addEventListener('keydown', onKeydown, true)

    await nextTick()
    // Focusing the dialog itself (rather than its first button) lets assistive
    // tech announce the dialog before the fan starts tabbing through it.
    unref(containerRef)?.focus()
  }

  /**
   * `restore: false` is for handing off to another dialog — returning focus to
   * the page in between would be a visible flicker for keyboard users.
   */
  function deactivate({ restore = true } = {}) {
    if (!active) return

    active = false
    window.removeEventListener('keydown', onKeydown, true)

    const target = previouslyFocused
    previouslyFocused = null

    // A trigger inside a closing dialog is already detached by now; focusing it
    // would silently drop focus to <body> anyway.
    if (restore && target?.isConnected && typeof target.focus === 'function') {
      target.focus()
    }
  }

  return { activate, deactivate }
}
