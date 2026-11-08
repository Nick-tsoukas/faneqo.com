/**
 * Soft bootstrap: establish anonymous fan identity once per browser session.
 * Optionally evaluate account-conversion prompts (behind feature flag).
 * Never blocks app boot; failures are ignored.
 */
export default defineNuxtPlugin(() => {
  if (process.server) return

  const { ensureSession } = useFanIdentity()
  const { maybeShowPrompt, onMessageClick } = useFanAccountConversion()

  const run = async () => {
    try {
      await ensureSession()
    } catch {
      return
    }

    // Safe campaign click attribution (no identity credentials in URL)
    try {
      const params = new URLSearchParams(window.location.search || '')
      const src = (params.get('feq_src') || params.get('mbq_src') || '').toLowerCase()
      if (src === 'msg' || src === 'message' || src === 'campaign') {
        await onMessageClick({})
        params.delete('feq_src')
        params.delete('mbq_src')
        const next = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash || ''}`
        window.history.replaceState({}, '', next)
        return
      }
    } catch {
      /* ignore */
    }

    // Soft prompt on meaningful sessions (server decides eligibility + cooldown)
    setTimeout(() => {
      maybeShowPrompt({}).catch(() => {})
    }, 1800)
  }

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(() => {
      run().catch(() => {})
    }, { timeout: 2500 })
  } else {
    setTimeout(() => {
      run().catch(() => {})
    }, 800)
  }
})
