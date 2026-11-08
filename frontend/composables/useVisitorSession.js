/**
 * Composable for managing privacy-safe visitor and session IDs
 * Used for analytics tracking without storing personal information.
 *
 * `_vid` is also the first-party anonymous fan recognition token
 * (see useFanIdentity). Opaque only — never email/PII.
 */

export function useVisitorSession() {
  /**
   * Get or create a persistent visitor ID (stored in localStorage)
   * Persists across sessions for the same browser
   */
  function getOrCreateVisitorId() {
    if (typeof window === 'undefined') return null
    
    let vid = localStorage.getItem('_vid')
    if (!vid) {
      try {
        const bytes = new Uint8Array(32)
        crypto.getRandomValues(bytes)
        vid = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      } catch {
        vid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      }
      localStorage.setItem('_vid', vid)
    }
    return vid
  }

  /**
   * Get or create a session ID (stored in sessionStorage)
   * Unique per browser tab/session
   */
  function getOrCreateSessionId() {
    if (typeof window === 'undefined') return null
    
    let sid = sessionStorage.getItem('_sid')
    if (!sid) {
      sid = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
      sessionStorage.setItem('_sid', sid)
    }
    return sid
  }

  return {
    getOrCreateVisitorId,
    getOrCreateSessionId,
  }
}
