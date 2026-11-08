import { createError, defineEventHandler, readBody } from 'h3'
import { studioMp4Start } from '~/server/utils/studioMp4Jobs.js'

export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  const body = await readBody(event)
  try {
    return await studioMp4Start(body)
  } catch (err) {
    throw createError({ statusCode: err.statusCode || 400, statusMessage: err.message || 'Video export failed.' })
  }
})
