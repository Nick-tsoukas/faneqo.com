/**
 * Faneqo Echo — designer + runtime contract.
 * Application code speaks meaning. The .riv file maps these names.
 *
 * File: /public/rive/faneqo-echo.riv
 * Does not exist yet. Probe before mounting a canvas.
 */

export const FANEQO_ECHO_SRC = '/rive/faneqo-echo.riv'
export const FANEQO_ECHO_ARTBOARD = 'Echo'
export const FANEQO_ECHO_STATE_MACHINE = 'Echo'
export const FANEQO_ECHO_VIEW_MODEL = 'Echo'

/** View Model property names the Rive file must expose. */
export const FANEQO_ECHO_PROPS = {
  active: 'active',
  connected: 'connected',
  intensity: 'intensity',
  success: 'success',
  reply: 'reply',
}

/**
 * Visual states the designer may name internally.
 * App code should not depend on these strings — only on the props above.
 */
export const FANEQO_ECHO_STATES = [
  'IDLE',
  'SIGNAL_OUT',
  'CONNECT',
  'SETTLED',
  'ECHO_BACK',
  'SUCCESS',
]

let probe = null

export function probeFaneqoEchoAsset() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (probe) return probe
  probe = fetch(FANEQO_ECHO_SRC, { method: 'HEAD', cache: 'force-cache' })
    .then((res) => {
      if (res.ok) return true
      if (res.status === 405 || res.status === 501) {
        return fetch(FANEQO_ECHO_SRC, { method: 'GET', cache: 'force-cache' }).then((r) => r.ok)
      }
      return false
    })
    .catch(() => false)
  return probe
}
