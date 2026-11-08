// Nuxt 3 server route that returns a sanitized object for promo QR id=46
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const base = config.public.strapiUrl
  const token = config.strapiApiToken

  const headers = { Authorization: `Bearer ${token}` }

  // 1) Fetch the QR entity (no heavy populate; just the fields we need + q_image)
  const qrRes: any = await $fetch(`${base}/api/qrs/46?fields[0]=name&fields[1]=url&fields[2]=link&fields[3]=q_type&fields[4]=slugId&populate[q_image]=*`, {
    headers
  })

  const qr = qrRes?.data
  const a = qr?.attributes || {}

  // Extract image (pick the original or a format)
  const imgData = a.q_image?.data
  const rawImgUrl = imgData?.attributes?.url || null
  const abs = (u?: string | null) => !u ? null : (u.startsWith('http') ? u : `${base}${u}`)
  const imageUrl = abs(rawImgUrl)

  // 2) Get scans count without pulling all scans
  // Use scans collection with a filter by relation, request tiny pageSize (1) and read meta.pagination.total
  const scansRes: any = await $fetch(
    `${base}/api/scans?filters[qr][id][$eq]=46&pagination[page]=1&pagination[pageSize]=1`,
    { headers }
  )
  const scansCount = scansRes?.meta?.pagination?.total ?? 0

  // (Optional) derive analytics path if you have a route pattern
  // Change this to whatever your app uses for analytics deep-links
  const analyticsUrl = a.slugId ? `/analytics/qr/${a.slugId}` : `/analytics/qr/46`

  return {
    id: 46,
    name: a.name ?? null,
    url: a.url ?? null,          // destination/redirect target if you store it
    link: a.link ?? null,        // any external link field you use
    q_type: a.q_type ?? null,
    slugId: a.slugId ?? null,
    imageUrl,                    // absolute URL to the QR image (or null)
    scansCount,                  // total scans
    analyticsUrl                 // app analytics page path to use in your UI
  }
})
