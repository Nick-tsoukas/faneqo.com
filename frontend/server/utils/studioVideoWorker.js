/**
 * Talks to the private video worker. This module does not encode video.
 * If the worker URL and token are unset, every call fails closed.
 * Job state lives on the worker, not in this process.
 */

export function workerConfig() {
  const cfg = useRuntimeConfig()
  const url = String(cfg.studioVideoWorkerUrl || '').replace(/\/+$/, '')
  const token = String(cfg.studioVideoWorkerToken || '')
  let origin = ''
  try {
    origin = url ? new URL(url).origin : ''
  } catch {
    origin = ''
  }
  return {
    url,
    token,
    origin,
    configured: Boolean(origin && token),
  }
}

export function workerTarget(path) {
  const { url, origin, configured } = workerConfig()
  if (!configured) {
    const error = new Error('Video export is not configured on this server.')
    error.statusCode = 503
    throw error
  }
  const target = new URL(path, `${url}/`)
  if (target.origin !== origin) {
    const error = new Error('Video export is not configured on this server.')
    error.statusCode = 503
    throw error
  }
  return target
}

export async function workerFetch(path, options = {}) {
  const { token } = workerConfig()
  const target = workerTarget(path)
  return $fetch(target.toString(), {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  })
}
