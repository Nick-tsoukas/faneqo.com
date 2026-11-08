import { defineEventHandler, getQuery } from 'h3'
import { createRequire } from 'module'

// use Node's require inside ESM
const require = createRequire(import.meta.url)

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const ip = (q.ip as string) || '8.8.8.8'

  try {
    const geoip = require('geoip-lite')   // <-- robust in Nitro
    const hit = geoip.lookup(ip)
    return { ok: true, ip, hit }
  } catch (e: any) {
    return { ok: false, ip, error: e?.message || String(e) }
  }
})
