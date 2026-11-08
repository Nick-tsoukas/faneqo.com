/**
 * Drive the Faneqo Connection Rive graphic by meaning, not animation internals.
 * Safe no-op when the .riv file is missing or reduced-motion is on.
 */
import { FANEQO_CONNECTION_PROPS } from '~/utils/rive/faneqoConnection'

function api(riveRef) {
  return riveRef?.value || riveRef || null
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFaneqoConnection(riveRef) {
  function setBoolean(name, value) {
    api(riveRef)?.setBoolean?.(name, value)
  }

  function setNumber(name, value) {
    api(riveRef)?.setNumber?.(name, value)
  }

  function fire(name) {
    api(riveRef)?.fireTrigger?.(name)
  }

  function play() {
    if (prefersReducedMotion()) return
    api(riveRef)?.play?.()
  }

  function applyIdle() {
    setBoolean(FANEQO_CONNECTION_PROPS.ready, false)
    setBoolean(FANEQO_CONNECTION_PROPS.connecting, false)
    setBoolean(FANEQO_CONNECTION_PROPS.connected, false)
    setNumber(FANEQO_CONNECTION_PROPS.intensity, 0.16)
  }

  function applyReady() {
    setBoolean(FANEQO_CONNECTION_PROPS.ready, true)
    setBoolean(FANEQO_CONNECTION_PROPS.connecting, false)
    setBoolean(FANEQO_CONNECTION_PROPS.connected, false)
    setNumber(FANEQO_CONNECTION_PROPS.intensity, 0.28)
    play()
  }

  function applyConnecting(intensity = 0.7) {
    setBoolean(FANEQO_CONNECTION_PROPS.ready, true)
    setBoolean(FANEQO_CONNECTION_PROPS.connecting, true)
    setBoolean(FANEQO_CONNECTION_PROPS.connected, false)
    setNumber(FANEQO_CONNECTION_PROPS.intensity, intensity)
    fire(FANEQO_CONNECTION_PROPS.connect)
    play()
  }

  function applyConnected() {
    setBoolean(FANEQO_CONNECTION_PROPS.ready, false)
    setBoolean(FANEQO_CONNECTION_PROPS.connecting, false)
    setBoolean(FANEQO_CONNECTION_PROPS.connected, true)
    setNumber(FANEQO_CONNECTION_PROPS.intensity, prefersReducedMotion() ? 0 : 0.22)
    if (!prefersReducedMotion()) play()
  }

  function applyAppState(state) {
    if (state === 'connecting') return applyConnecting()
    if (state === 'connected') return applyConnected()
    if (state === 'ready' || state === 'focus') return applyReady()
    return applyIdle()
  }

  return {
    applyIdle,
    applyReady,
    applyConnecting,
    applyConnected,
    applyAppState,
  }
}
