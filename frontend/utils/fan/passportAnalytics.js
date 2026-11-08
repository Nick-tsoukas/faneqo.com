/**
 * Fan Passport funnel events. Source only — never message text or email.
 * Uses the existing public band UI event endpoint.
 */

export function passportSource(trigger) {
  if (trigger === 'fan_list_join') return 'fanlist'
  if (trigger === 'follow_saved' || trigger === 'follow_intent') return 'follow'
  if (trigger === 'message_click') return 'message'
  if (trigger === 'gallery') return 'gallery'
  return 'account'
}

export function trackFanPassport(eventName, { strapiUrl, bandId, bandSlug, source, trigger } = {}) {
  if (typeof window === 'undefined' || !eventName) return
  const base = String(strapiUrl || '').replace(/\/$/, '')
  if (!base) return
  const body = {
    bandId: bandId || undefined,
    bandSlug: bandSlug || undefined,
    eventName,
    payload: {
      source: source || passportSource(trigger),
      trigger: trigger || null,
    },
  }
  const url = `${base}/api/band-ui-events/track`
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(body)], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
      return
    }
  } catch {
    /* fetch below */
  }
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {})
}
