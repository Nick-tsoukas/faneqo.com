// server/middleware/geo.ts
import { defineEventHandler, getHeader, setCookie } from 'h3'

export default defineEventHandler(async (event) => {
  // Popular edge headers
  const cf = getHeader(event, 'cf-ipcountry')               // Cloudflare (e.g., "TH")
  const vercel = getHeader(event, 'x-vercel-ip-country')    // Vercel (e.g., "TH")
  const fly = getHeader(event, 'fly-client-ip-country')     // Fly.io
  const fastly = getHeader(event, 'fastly-country-code')    // Fastly

  let country = cf || vercel || fly || fastly || ''

  // Normalize to ISO-2 if you can; otherwise leave empty
  if (country && country.length === 2) {
    setCookie(event, 'country', country.toUpperCase(), { path: '/', sameSite: 'lax' })
    return
  }

  // (Optional) very lightweight IP lookup fallback ONLY if you want it.
  // Comment out if you don't want a server call.
  try {
    const res = await $fetch<{ country_code?: string }>('https://get.geojs.io/v1/ip/geo.json', { timeout: 800 })
    if (res?.country_code) {
      country = res.country_code.toUpperCase()
      setCookie(event, 'country', country, { path: '/', sameSite: 'lax' })
    }
  } catch { /* ignore */ }
})
