import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { requireStudio } from '~/server/utils/adsStudioAuth'
import { workerConfig, workerFetch } from '~/server/utils/studioVideoWorker.js'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const id = String(getQuery(event).id || '')
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  if (!workerConfig().configured) {
    throw createError({ statusCode: 503, statusMessage: 'Video export is not configured on this server.' })
  }
  try {
    return await workerFetch(`/jobs/${id}`, { method: 'DELETE' })
  } catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || err?.status || 502,
      statusMessage: err?.data?.message || err?.statusMessage || 'Video export failed.',
    })
  }
})
