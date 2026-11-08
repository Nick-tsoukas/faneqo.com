import { defineEventHandler, createError } from 'h3'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const orderCode = event.context.params?.orderCode
  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl

  if (!strapiUrl) {
    throw createError({ statusCode: 500, statusMessage: 'Missing public.strapiUrl' })
  }

  if (!orderCode) {
    throw createError({ statusCode: 400, statusMessage: 'orderCode is required' })
  }

  try {
    const res = await $fetch(`${strapiUrl}/api/merch-concierge/order/${encodeURIComponent(orderCode)}`, {
      method: 'GET',
    })

    return res
  } catch (e) {
    const statusCode = e?.statusCode || 500
    const statusMessage = e?.data?.error?.message || e?.statusMessage || e?.message || 'Unable to load order'
    throw createError({ statusCode, statusMessage })
  }
})
