/**
 * Faneqo Connection — first artist-profile Rive primitive.
 * Application code speaks meaning. The .riv file maps these names.
 *
 * File: /public/rive/faneqo-connection.riv
 * Does not exist yet. Probe before mounting a canvas.
 * Until then, FaneqoConnectionMotion uses a static/CSS footprint fallback.
 */

export const FANEQO_CONNECTION_SRC = '/rive/faneqo-connection.riv'
export const FANEQO_CONNECTION_ARTBOARD = 'Connection'
export const FANEQO_CONNECTION_STATE_MACHINE = 'Connection'
export const FANEQO_CONNECTION_VIEW_MODEL = 'Connection'

/** View Model property names the Rive file must expose. */
export const FANEQO_CONNECTION_PROPS = {
  ready: 'ready',
  connecting: 'connecting',
  connected: 'connected',
  intensity: 'intensity',
  connect: 'connect',
}

/**
 * Visual states the designer may name internally.
 * App code should not depend on these strings — only on the props above
 * and the Vue `state` contract: idle | connecting | connected.
 */
export const FANEQO_CONNECTION_STATES = [
  'IDLE',
  'READY',
  'CONNECTING',
  'CONNECTED',
  'REDUCED_MOTION',
]

export const FANEQO_CONNECTION_APP_STATES = ['idle', 'connecting', 'connected']

let probe = null

export function probeFaneqoConnectionAsset() {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (probe) return probe
  probe = fetch(FANEQO_CONNECTION_SRC, { method: 'HEAD', cache: 'force-cache' })
    .then((res) => {
      if (res.ok) return true
      if (res.status === 405 || res.status === 501) {
        return fetch(FANEQO_CONNECTION_SRC, { method: 'GET', cache: 'force-cache' }).then((r) => r.ok)
      }
      return false
    })
    .catch(() => false)
  return probe
}
