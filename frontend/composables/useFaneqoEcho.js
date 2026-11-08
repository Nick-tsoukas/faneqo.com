/**
 * Drive the Faneqo Echo Rive graphic by meaning, not animation internals.
 * Safe no-op when the .riv file is missing or reduced-motion is on.
 */
import { FANEQO_ECHO_PROPS } from '~/utils/rive/faneqoEcho'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function api(riveRef) {
  return riveRef?.value || riveRef || null
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useFaneqoEcho(riveRef) {
  let played = false

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

  function signalOut(intensity = 0.72) {
    if (prefersReducedMotion()) return
    setBoolean(FANEQO_ECHO_PROPS.active, true)
    setNumber(FANEQO_ECHO_PROPS.intensity, intensity)
    fire(FANEQO_ECHO_PROPS.success)
    play()
  }

  function connect() {
    setBoolean(FANEQO_ECHO_PROPS.connected, true)
    if (!prefersReducedMotion()) {
      setNumber(FANEQO_ECHO_PROPS.intensity, 0.45)
      play()
    }
  }

  function echoBack(intensity = 0.62) {
    if (prefersReducedMotion()) {
      setBoolean(FANEQO_ECHO_PROPS.connected, true)
      return
    }
    setBoolean(FANEQO_ECHO_PROPS.active, true)
    setBoolean(FANEQO_ECHO_PROPS.connected, true)
    setNumber(FANEQO_ECHO_PROPS.intensity, intensity)
    fire(FANEQO_ECHO_PROPS.reply)
    play()
  }

  function settle() {
    setBoolean(FANEQO_ECHO_PROPS.active, false)
    setNumber(FANEQO_ECHO_PROPS.intensity, 0.18)
  }

  function settleConnected() {
    setBoolean(FANEQO_ECHO_PROPS.connected, true)
    settle()
  }

  async function playCheckIn() {
    if (played) return
    played = true
    if (prefersReducedMotion() || !api(riveRef)) {
      settleConnected()
      return
    }
    signalOut(0.78)
    await wait(280)
    connect()
    await wait(360)
    settle()
  }

  async function playEchoBack() {
    if (played) return
    played = true
    if (prefersReducedMotion() || !api(riveRef)) {
      settleConnected()
      return
    }
    signalOut(0.55)
    await wait(260)
    echoBack(0.7)
    await wait(420)
    settle()
  }

  async function playCta() {
    if (played) return
    played = true
    if (prefersReducedMotion() || !api(riveRef)) {
      settleConnected()
      return
    }
    signalOut(0.5)
    await wait(240)
    echoBack(0.48)
    await wait(380)
    settle()
  }

  function reset() {
    played = false
    setBoolean(FANEQO_ECHO_PROPS.active, false)
    setBoolean(FANEQO_ECHO_PROPS.connected, false)
    setNumber(FANEQO_ECHO_PROPS.intensity, 0)
  }

  return {
    signalOut,
    connect,
    echoBack,
    settle,
    settleConnected,
    playCheckIn,
    playEchoBack,
    playCta,
    reset,
  }
}
