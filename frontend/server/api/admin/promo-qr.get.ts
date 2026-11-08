// server/api/admin/promo-qr.get.ts
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = config.public.strapiUrl
  const token = config.strapiApiToken
  if (!token) throw createError({ statusCode: 500, statusMessage: 'Missing STRAPI_API_TOKEN' })

  const headers = { Authorization: `Bearer ${token}` }

  // QR id=46 (request only needed fields + image)
  const qrRes: any = await $fetch(
    `${base}/api/qrs/46?fields[0]=name&fields[1]=url&fields[2]=link&fields[3]=q_type&fields[4]=slugId&populate[q_image]=*`,
    { headers }
  )
  const qr = qrRes?.data
  const a = qr?.attributes || {}

  const abs = (u?: string | null) => !u ? null : (u.startsWith?.('http') ? u : `${base}${u}`)
  const rawImgUrl = a.q_image?.data?.attributes?.url || null
  const imageUrl = abs(rawImgUrl)

  // fast scans count via pagination meta
  const scansRes: any = await $fetch(
    `${base}/api/scans?filters[qr][id][$eq]=46&pagination[page]=1&pagination[pageSize]=1`,
    { headers }
  )
  const scansCount = scansRes?.meta?.pagination?.total ?? 0

  const analyticsUrl = a.slugId ? `/analytics/qr/${a.slugId}` : `/analytics/qr/46`

  return {
    id: 46,
    name: a.name ?? null,
    url: a.url ?? null,
    link: a.link ?? null,
    q_type: a.q_type ?? null,
    slugId: a.slugId ?? null,
    imageUrl,
    scansCount,
    analyticsUrl,
  }
})
