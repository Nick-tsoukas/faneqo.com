/**
 * RFC 8058 one-click unsubscribe.
 *
 * Gmail (and others) POST to the HTTPS URL in List-Unsubscribe with body
 * `List-Unsubscribe=One-Click`. That URL is `https://faneqo.com/unsubscribe?token=…`,
 * so this Nitro route must succeed without rendering the Vue page or requiring
 * a confirmation click.
 *
 * GET /unsubscribe still serves pages/unsubscribe.vue for humans who click the
 * footer link in the email body.
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = typeof query.token === 'string' ? query.token.trim() : ''

  // Always 200 for missing/invalid tokens: one-click clients treat non-2xx as
  // retryable, and we must not reveal whether a token exists.
  if (!token || token.length < 24) {
    setResponseStatus(event, 200)
    return { success: false }
  }

  const config = useRuntimeConfig()
  const strapiUrl = (config.public.strapiUrl || '').replace(/\/$/, '')

  if (!strapiUrl) {
    setResponseStatus(event, 200)
    return { success: false }
  }

  try {
    await $fetch(`${strapiUrl}/api/fans/unsubscribe`, {
      method: 'POST',
      // Token in both places: Strapi accepts either; query matches the mailed URL.
      query: { token },
      body: { token },
    })
  } catch (err) {
    // Soft-fail: already-unsubscribed and invalid tokens should not 5xx to Gmail.
    console.warn('[unsubscribe.post] one-click proxy failed:', (err as any)?.message || err)
  }

  setResponseStatus(event, 200)
  return { success: true }
})
