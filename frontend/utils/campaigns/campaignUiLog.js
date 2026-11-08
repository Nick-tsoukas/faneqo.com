/**
 * Dev-only campaign composer logs.
 * Never log subject, body, emails, JWTs, or tokens.
 */
export function campaignUiLog(event, fields = {}) {
  if (!import.meta.dev) return
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`)
  const line = `[Faneqo Campaigns UI] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`
  console.info(line)
}

export function newComposerRequestId() {
  const bytes = new Uint8Array(4)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    bytes[0] = Math.floor(Math.random() * 256)
    bytes[1] = Math.floor(Math.random() * 256)
    bytes[2] = Math.floor(Math.random() * 256)
    bytes[3] = Math.floor(Math.random() * 256)
  }
  return `req_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

const TEST_PREFIX_RE = /^\[test\]\s*/i

export function stripTestSubjectPrefix(subject) {
  return String(subject || '').replace(TEST_PREFIX_RE, '')
}

export function formatPreviewSubject(subject, productionTestMode) {
  const raw = stripTestSubjectPrefix(subject).trim()
  if (!raw) return productionTestMode ? '[TEST]' : ''
  return productionTestMode ? `[TEST] ${raw}` : raw
}
