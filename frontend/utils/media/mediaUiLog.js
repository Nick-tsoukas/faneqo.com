/**
 * Dev-only media logs. Never log URLs, captions, JWT, email, or paths.
 */
export function mediaUiLog(event, fields = {}) {
  if (!import.meta.dev) return
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
  console.info(`[Faneqo Media] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`)
}

export function artistUpdateUiLog(event, fields = {}) {
  if (!import.meta.dev) return
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
  console.info(`[Faneqo Artist Updates] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`)
}
