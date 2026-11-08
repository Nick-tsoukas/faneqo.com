import { createError, defineEventHandler, getQuery, setResponseHeader } from 'h3'
import { studioMp4File } from '~/server/utils/studioMp4Jobs.js'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const id = String(getQuery(event).id || '')
  if (!/^[a-f0-9]{32}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Unknown export.' })
  const file = await studioMp4File(id)
  if (!file) throw createError({ statusCode: 404, statusMessage: 'The video is not ready.' })
  setResponseHeader(event, 'Content-Type', 'video/mp4')
  setResponseHeader(event, 'Content-Disposition', `attachment; filename="${file.name}"`)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  return file.bytes
})
