import { createError, defineEventHandler, getQuery } from 'h3'
import { studioMp4Cancel } from '~/server/utils/studioMp4Jobs.js'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const id = String(getQuery(event).id || '')
  if (!/^[a-f0-9]{32}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'Unknown export.' })
  await studioMp4Cancel(id)
  return { ok: true }
})
