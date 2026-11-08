// server/middleware/qr-gateway.ts
// Redirects all non-directqr routes from any QR gateway host to the canonical frontend.
import { defineEventHandler, sendRedirect } from 'h3'

// Explicit allowlist of QR gateway hostnames (both legacy and new).
// A broad startsWith('qr.') check is intentionally avoided.
const QR_GATEWAY_HOSTS = new Set([
  'qr.musicbizqr.com',
  'qr.faneqo.com',
])

const CANONICAL_FRONTEND = 'https://faneqo.com'

export default defineEventHandler((event) => {
  // Normalize: lowercase and strip optional port
  const rawHost = event.node.req.headers.host || ''
  const host = rawHost.toLowerCase().replace(/:\d+$/, '')
  const url = event.node.req.url || '/'

  if (QR_GATEWAY_HOSTS.has(host)) {
    // Allow /directqr requests to pass through to the resolver
    if (url.startsWith('/directqr')) {
      return
    }

    // Redirect all other routes to the canonical frontend
    return sendRedirect(event, `${CANONICAL_FRONTEND}${url}`, 302)
  }
})
