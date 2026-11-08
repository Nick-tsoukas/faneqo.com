import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { requireStudio } from '~/server/utils/adsStudioAuth'
import { workerConfig, workerTarget } from '~/server/utils/studioVideoWorker.js'

export default defineEventHandler(async (event) => {
  await requireStudio(event)
  const id = String(getQuery(event).id || '')
  if (!/^[a-f0-9]{32}$/.test(id)) {
    throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  }
  const { token, configured } = workerConfig()
  if (!configured) {
    throw createError({ statusCode: 503, statusMessage: 'Video export is not configured on this server.' })
  }
  const target = workerTarget(`/jobs/${id}/file`)
  const res = await fetch(target, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 404) throw createError({ statusCode: 404, statusMessage: 'Page not found' })
  if (!res.ok) {
    throw createError({ statusCode: res.status, statusMessage: 'Video export failed.' })
  }
  const name = String(res.headers.get('x-filename') || 'faneqo-story.mp4').replace(/[^a-z0-9._-]/gi, '')
  setResponseHeader(event, 'Content-Type', 'video/mp4')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${name || 'faneqo-story.mp4'}"`)
  setResponseHeader(event, 'Cache-Control', 'private, no-store')
  return Buffer.from(await res.arrayBuffer())
})
