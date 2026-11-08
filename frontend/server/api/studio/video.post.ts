import { createError, defineEventHandler, readBody, setResponseHeader } from 'h3'
import { requireStudio, strapiBase, studioNotFound } from '~/server/utils/adsStudioAuth'
import { workerConfig, workerFetch } from '~/server/utils/studioVideoWorker.js'
import { gateVideoRequest, productionJobRequest, videoJobBody } from '~/features/ads/studio/videoExportContract.js'

async function loadOwnedCreative(jwt: string, id: string) {
  const base = strapiBase()
  if (!base || !jwt) {
    throw createError({ statusCode: 503, statusMessage: 'Video export is not configured on this server.' })
  }
  try {
    const res: any = await $fetch(`${base}/api/creatives/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      timeout: 15_000,
    })
    const data = res?.data
    if (!data?.templateId || !data?.content) throw studioNotFound()
    return { ...data, id: String(data.id ?? id) }
  } catch (err: any) {
    const status = err?.statusCode || err?.status
    if (status === 404 || status === 401 || status === 403) throw studioNotFound()
    throw createError({ statusCode: 503, statusMessage: 'The creative could not be loaded.' })
  }
}

export default defineEventHandler(async (event) => {
  const verdict = await requireStudio(event)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  const body = await readBody(event)
  const request = productionJobRequest(body)
  if (!request.ok) {
    throw createError({ statusCode: request.statusCode, statusMessage: request.message })
  }
  const configured = workerConfig().configured
  if (!configured) {
    throw createError({ statusCode: 503, statusMessage: 'Video export is not configured on this server.' })
  }
  const creative = await loadOwnedCreative(verdict.jwt || '', request.id)
  const decision = gateVideoRequest({ allowed: true, workerConfigured: true, creative })
  if (!decision.ok) {
    throw createError({ statusCode: decision.statusCode, statusMessage: decision.message })
  }
  try {
    return await workerFetch('/jobs', { method: 'POST', body: videoJobBody(creative) })
  } catch (err: any) {
    throw createError({
      statusCode: err?.statusCode || err?.status || 502,
      statusMessage: err?.data?.message || err?.statusMessage || 'Video export failed.',
    })
  }
})
