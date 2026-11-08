// composables/useMetaTracking.js
export const useMetaTracking = () => {
  const nuxtApp = useNuxtApp()

  const getFbq = () => {
    try {
      return nuxtApp.$fbq
    } catch {
      return null
    }
  }

  const makeEventId = (prefix = 'evt') => {
    if (!process.client) return `${prefix}-server`
    return (
      window.crypto?.randomUUID?.() ||
      `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    )
  }

  const setOnce = (key, value) => {
    if (!process.client) return
    if (!window.sessionStorage.getItem(key)) {
      window.sessionStorage.setItem(key, value)
    }
  }

  const get = (key) => {
    if (!process.client) return null
    return window.sessionStorage.getItem(key)
  }

  const clear = (key) => {
    if (!process.client) return
    window.sessionStorage.removeItem(key)
  }

  // Grab UTMs from URL once and store them (optional but huge later)
  const captureUtmOnce = () => {
    if (!process.client) return
    const url = new URL(window.location.href)
    const utm = {
      utm_source: url.searchParams.get('utm_source') || '',
      utm_medium: url.searchParams.get('utm_medium') || '',
      utm_campaign: url.searchParams.get('utm_campaign') || '',
      utm_content: url.searchParams.get('utm_content') || '',
      utm_term: url.searchParams.get('utm_term') || '',
    }
    // Store only if any is present
    const hasAny = Object.values(utm).some(Boolean)
    if (hasAny) {
      window.sessionStorage.setItem('mbq_utm', JSON.stringify(utm))
    }
  }

  const getUtm = () => {
    if (!process.client) return {}
    try {
      return JSON.parse(window.sessionStorage.getItem('mbq_utm') || '{}')
    } catch {
      return {}
    }
  }

  /**
   * Track a Meta event with a stable event_id and optional params.
   * - eventKey is your storage key suffix.
   * - standardName is a Meta standard event like 'Lead' or 'CompleteRegistration'.
   * - customName is your custom event name like 'SignupStarted'.
   */
  const trackWithStoredEventId = ({
    eventKey,
    standardName,
    customName,
    params = {},
    reuse = true, // reuse stored eventId if present
  }) => {
    const fbq = getFbq()
    if (!process.client || !fbq) return null

    const storageKey = `mbq_event_${eventKey}`
    let eventId = reuse ? get(storageKey) : null
    if (!eventId) {
      eventId = makeEventId(eventKey)
      setOnce(storageKey, eventId)
    }

    const customData = { ...params, ...getUtm() }
    // eventID is the dedupe key. It must be the 4th argument, not a custom param.
    const options = { eventID: eventId }

    if (standardName) fbq('track', standardName, customData, options)
    if (customName) fbq('trackCustom', customName, customData, options)

    return eventId
  }

  /**
   * Browser pixel plus Conversions API for one real outcome.
   * A session flag stops refresh and double-submit from sending it again.
   * Email goes only to the server route, which hashes it. It is not a pixel param.
   */
  const reportConversion = async ({ eventName, eventKey, email, customData = {} }) => {
    if (!process.client || !eventName || !eventKey) return null
    const firedKey = `mbq_fired_${eventKey}`
    if (get(firedKey)) return get(`mbq_event_${eventKey}`)

    const eventId = trackWithStoredEventId({
      eventKey,
      standardName: eventName,
      params: customData,
      reuse: true,
    })
    if (!eventId) return null
    setOnce(firedKey, '1')

    try {
      await fetch('/api/meta/capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: eventName,
          event_id: eventId,
          event_source_url: window.location.href,
          email: email || undefined,
          custom_data: { ...customData, ...getUtm() },
        }),
      })
    } catch {
      // Tracking must not block signup.
    }

    return eventId
  }

  return {
    captureUtmOnce,
    getUtm,
    trackWithStoredEventId,
    reportConversion,
    get,
    clear,
    makeEventId,
  }
}
