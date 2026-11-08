import { defineEventHandler, readBody, getHeader, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

/**
 * Same-origin proxy for public fan subscribe.
 * The artist page must not depend on the browser talking to :1337 directly.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiUrl = String(config.public?.strapiUrl || '').replace(/\/$/, '')
  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Missing public.strapiUrl' })
  }

  const body = await readBody(event)
  const headers = { 'Content-Type': 'application/json' }
  const auth = getHeader(event, 'authorization')
  if (auth) headers.Authorization = auth

  try {
    return await $fetch(`${strapiUrl}/api/fans/subscribe`, {
      method: 'POST',
      body,
      headers,
    })
  } catch (error) {
    const statusCode = Number(error?.statusCode || error?.response?.status || 502)
    const payload = error?.data || null
    const statusMessage =
      payload?.error?.message
      || error?.statusMessage
      || error?.message
      || 'Failed to subscribe'
    throw createError({
      statusCode: statusCode >= 400 ? statusCode : 502,
      statusMessage,
      data: payload || { error: { message: statusMessage } },
    })
  }
})
