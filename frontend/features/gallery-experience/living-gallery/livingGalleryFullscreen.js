/**
 * Fullscreen API wrapper.
 * Installed PWA (standalone display-mode) reports canFullscreen = false.
 * Do not call requestFullscreen there — it fights the installed shell.
 */

import { isStandaloneDisplay } from './livingGalleryCapabilities.js'

export function createLivingGalleryFullscreen({
  doc = typeof document !== 'undefined' ? document : null,
  win = typeof window !== 'undefined' ? window : null,
  onChange,
} = {}) {
  function isFullscreen() {
    return Boolean(doc?.fullscreenElement)
  }

  function canFullscreen() {
    if (!doc?.fullscreenEnabled) return false
    if (isStandaloneDisplay(win)) return false
    return typeof doc.documentElement?.requestFullscreen === 'function'
  }

  async function enter(element) {
    if (!canFullscreen() || isFullscreen()) return isFullscreen()
    const target = element || doc.documentElement
    if (typeof target?.requestFullscreen !== 'function') return false
    await target.requestFullscreen()
    onChange?.(true)
    return true
  }

  async function exit() {
    if (!isFullscreen()) return false
    if (typeof doc.exitFullscreen !== 'function') return false
    await doc.exitFullscreen()
    onChange?.(false)
    return true
  }

  async function toggle(element) {
    if (isFullscreen()) return exit()
    return enter(element)
  }

  function onFullscreenChange() {
    onChange?.(isFullscreen())
  }

  function attach() {
    doc?.addEventListener?.('fullscreenchange', onFullscreenChange)
  }

  function detach() {
    doc?.removeEventListener?.('fullscreenchange', onFullscreenChange)
  }

  return {
    canFullscreen,
    isFullscreen,
    enter,
    exit,
    toggle,
    attach,
    detach,
  }
}
