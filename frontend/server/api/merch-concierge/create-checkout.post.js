import { defineEventHandler, readBody, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl

  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Missing public.strapiUrl' })
  }

  try {
    const res = await $fetch(`${strapiUrl}/api/merch-concierge/create-checkout`, {
      method: 'POST',
      body,
    })

    return res
  } catch (e) {
    const statusCode = e?.statusCode || 500
    const statusMessage = e?.data?.error?.message || e?.statusMessage || e?.message || 'Unable to create checkout'
    throw createError({ statusCode, statusMessage })
  }
})
