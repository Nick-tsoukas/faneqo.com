const RELOAD_GUARD_KEY = 'faneqo:sw-update-reload'
const RELOAD_GUARD_MS = 60_000

const SENSITIVE_UPDATE_PATH = /^\/(?:checkout|account|stripe)(?:\/|$)|\/support\/receipt(?:\/|$)/

export function isSensitiveUpdatePath(path) {
  return SENSITIVE_UPDATE_PATH.test(String(path || ''))
}

/**
 * A waiting update becomes a full page load only when the person leaves the
 * current screen. Checkout, account, and receipt stay on the open page.
 */
export function shouldFullLoadUpdatedApp({ fromPath, toPath }) {
  if (!toPath || toPath === fromPath) return false
  if (isSensitiveUpdatePath(fromPath)) return false
  return true
}

export function isStaleAssetError(reason) {
  const message = extractMessage(reason)
  if (!message) return false
  return /dynamically imported module|Importing a module script failed|Unable to preload CSS|Failed to load module script/i.test(message)
}

export function claimServiceWorkerReload(storage, now = Date.now()) {
  if (!storage) return true
  try {
    const prev = Number(storage.getItem(RELOAD_GUARD_KEY) || 0)
    if (Number.isFinite(prev) && prev > 0 && now - prev < RELOAD_GUARD_MS) return false
    storage.setItem(RELOAD_GUARD_KEY, String(now))
    return true
  } catch {
    return true
  }
}

function extractMessage(reason) {
  if (!reason) return ''
  if (typeof reason === 'string') return reason
  if (typeof reason.message === 'string') return reason.message
  return ''
}
