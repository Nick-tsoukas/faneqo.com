import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { requireStudio, studioNotFound } from '~/server/utils/adsStudioAuth'
import { workerConfig, workerFetch } from '~/server/utils/studioVideoWorker.js'

function jobId(value: unknown) {
  const id = String(value || '')
  return /^[a-f0-9]{32}$/.test(id) ? id : ''
}

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const id = jobId(getQuery(event).id)
  if (!id) {
    const { configured } = workerConfig()
    return { available: configured, mode: configured ? 'worker' : 'off' }
  }
  if (!workerConfig().configured) {
    throw createError({ statusCode: 503, statusMessage: 'Video export is not configured on this server.' })
  }
  try {
    return await workerFetch(`/jobs/${id}`)
  } catch (err: any) {
    if (err?.statusCode === 404 || err?.status === 404) throw studioNotFound()
    throw createError({
      statusCode: err?.statusCode || err?.status || 502,
      statusMessage: err?.data?.message || err?.statusMessage || 'Video export failed.',
    })
  }
})
