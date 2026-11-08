// server/api/meta/capi.post.js
import crypto from 'node:crypto'

// Browser pixel ID. Server events must use this same pixel, not a new one.
const META_PIXEL_ID = '2397193350740405'
const ALLOWED_EVENTS = new Set(['CompleteRegistration', 'StartTrial', 'ViewContent'])

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

export default defineEventHandler(async (event) => {
  const pixelId = process.env.META_PIXEL_ID || META_PIXEL_ID
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  const testCode = process.env.META_CAPI_TEST_CODE // optional

  if (pixelId !== META_PIXEL_ID) {
    throw createError({
      statusCode: 500,
      statusMessage: 'META_PIXEL_ID does not match the website pixel.',
    })
  }

  // No token in this environment. The browser pixel still runs. Do not fail signup.
  if (!accessToken) {
    return { ok: false, skipped: true }
  }

  const body = await readBody(event)

  const {
    event_name,
    event_id,
    event_source_url,
    email,
    custom_data = {},
  } = body || {}

  if (!event_name || !event_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required fields: event_name, event_id',
    })
  }

  if (!ALLOWED_EVENTS.has(event_name)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event is not accepted from the browser.',
    })
  }

  // IP + UA for match quality
  const headers = getRequestHeaders(event)
  const userAgent = headers['user-agent'] || ''
  const ip =
    (headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    event.node.req.socket?.remoteAddress ||
    ''

  const user_data = {
    client_ip_address: ip,
    client_user_agent: userAgent,
  }

  if (email) {
    const normalized = String(email).trim().toLowerCase()
    if (normalized.includes('@')) user_data.em = sha256(normalized)
  }

  const customData = { ...(custom_data || {}) }
  delete customData.event_id
  delete customData.email

  const payload = {
    data: [
      {
        event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id,
        event_source_url: event_source_url || '',
        action_source: 'website',
        user_data,
        custom_data: customData,
      },
    ],
    ...(testCode ? { test_event_code: testCode } : {}),
  }

  const url = `https://graph.facebook.com/v20.0/${pixelId}/events`

  await $fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: payload,
  })

  return { ok: true }
})
