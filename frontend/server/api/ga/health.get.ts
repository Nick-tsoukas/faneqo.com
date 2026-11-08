import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async () => {
  const b64 = (process.env.GA_SERVICE_ACCOUNT_JSON_B64 || '').trim()
  const raw = (process.env.GA_SERVICE_ACCOUNT_JSON || '').trim()
  const using = b64 ? 'b64' : (raw ? 'raw' : 'none')

  if (using === 'none') {
    throw createError({ statusCode: 500, message: 'No GA service-account env present' })
  }

  const text = using === 'b64'
    ? Buffer.from(b64, 'base64').toString('utf8').trim()
    : raw

  const startsWithBrace = text.startsWith('{')
  let parsedOk = false
  try {
    const j = JSON.parse(text)
    if (j && typeof j.private_key === 'string') j.private_key = j.private_key.replace(/\\n/g, '\n')
    parsedOk = !!(j && j.client_email && j.private_key)
  } catch {}

  return { using, startsWithBrace, parsedOk }
})
