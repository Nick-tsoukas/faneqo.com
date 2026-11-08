import { defineEventHandler, getQuery, setResponseHeader, sendError, createError } from 'h3'
import { BetaAnalyticsDataClient } from '@google-analytics/data'
import { getGAClient } from '~/server/utils/gaClient.js'

function toDateStr(s?: string): string | null {
  if (!s) return null
  const t = String(s).toLowerCase()
  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  if (t === 'today') return iso(today)
  if (t === 'yesterday') { const d = new Date(today); d.setDate(d.getDate() - 1); return iso(d) }
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return null
}
const parseList = (v?: string) => (v ? v.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean) : [])

function buildFilter(hosts: string[], paths: string[]) {
  const expressions: any[] = []

  // Host filter (only if explicitly provided)
  if (hosts.length) {
    expressions.push({
      filter: { fieldName: 'hostName', inListFilter: { values: hosts } },
    })
  }

  // Path filter — use homepage regex by default if none provided
  if (paths.length) {
    expressions.push({
      filter: { fieldName: 'pagePath', inListFilter: { values: paths } },
    })
  } else {
    // Catch all homepage variants: "/", "/home", "/index", "/index.html"
    const homeRegex = '^(?:/|/home|/index(?:\\.html)?)$'
    expressions.push({
      filter: {
        fieldName: 'pagePath',
        stringFilter: {
          value: homeRegex,
          matchType: 'FULL_REGEXP',
          caseSensitive: false,
        },
      },
    })
  }

  if (!expressions.length) return undefined
  return expressions.length === 1
    ? expressions[0]
    : { andGroup: { expressions } }
}


async function runReport(client: BetaAnalyticsDataClient, propertyId: string, start: string, end: string, filter?: any) {
  const metricOptions = [
    [{ name: 'views' }, { name: 'totalUsers' }],
    [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
  ]
  let lastErr: any
  for (const metrics of metricOptions) {
    try {
      const [resp] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: start, endDate: end }],
        dimensions: [{ name: 'city' }],
        metrics,
        dimensionFilter: filter,
        orderBys: [{ metric: { metricName: metrics[0].name }, desc: true }],
        limit: 1000,
      })
      const getDimIdx = (n: string) => (resp.dimensionHeaders || []).findIndex(h => h.name === n)
      const getMetIdx = (n: string) => (resp.metricHeaders || []).findIndex(h => h.name === n)
      const cityIdx = getDimIdx('city')
      const pvIdx   = getMetIdx(metrics[0].name)
      const uIdx    = getMetIdx('totalUsers')

      const rows = (resp.rows || []).map(r => ({
        city: cityIdx >= 0 ? r.dimensionValues?.[cityIdx]?.value || '(unknown)' : '(unknown)',
        pageViews: pvIdx >= 0 ? Number(r.metricValues?.[pvIdx]?.value || 0) : 0,
        users:    uIdx  >= 0 ? Number(r.metricValues?.[uIdx]?.value  || 0) : 0,
      }))
      const totals = rows.reduce((a, r) => ({ pageViews: a.pageViews + r.pageViews, users: a.users + r.users }), { pageViews: 0, users: 0 })
      return { metricUsed: metrics[0].name, rows, totals }
    } catch (e) { lastErr = e }
  }
  throw lastErr || new Error('Unknown GA error')
}

export default defineEventHandler(async (event) => {
  try {
    const q = getQuery(event)
   // Default = no-cache, unless explicitly told to cache
if ((q.cache as string) === '1') {
  setResponseHeader(event, 'cache-control', 'public, max-age=300')
} else {
  setResponseHeader(event, 'cache-control', 'no-store, must-revalidate')
}

    const defaultStart = process.env.IEBA_START || '2025-10-01'
    const start = toDateStr((q.start as string) || defaultStart)
    const end   = toDateStr(q.end as string) || toDateStr('today')
    if (!start || !end) throw createError({ statusCode: 400, message: 'start/end must be YYYY-MM-DD, "today", or "yesterday".' })

    const hosts = ((q.host as string) || '').toLowerCase() === 'all' ? [] : parseList(q.host as string)
    const paths = parseList(q.paths as string)

    const propertyId = process.env.GA4_PROPERTY_ID
    if (!propertyId) throw createError({ statusCode: 500, message: 'Missing GA4_PROPERTY_ID env.' })

    // Dev mock so localhost doesn’t break if creds missing:
    if (process.dev && !(process.env.GA_SERVICE_ACCOUNT_JSON_B64 || process.env.GA_SERVICE_ACCOUNT_JSON)) {
      return { startDate: start, endDate: end, hosts, paths, totals: { pageViews: 0, users: 0 }, rows: [], mock: true }
    }

    // Debug mode (no GA call)
    if (q.debug === '1') {
      return {
        debug: true,
        startDate: start, endDate: end,
        hosts, paths,
        propertyIdSet: !!propertyId,
        serviceAccountSet: !!(process.env.GA_SERVICE_ACCOUNT_JSON_B64 || process.env.GA_SERVICE_ACCOUNT_JSON),
      }
    }

    const client = getGAClient()
    const filter = buildFilter(hosts, paths)
    const { metricUsed, rows, totals } = await runReport(client, propertyId, start, end, filter)

    return { startDate: start, endDate: end, hosts, paths, metricUsed, totals, rows }
  } catch (e: any) {
  // Log everything to server console for dev
  // @ts-ignore
  console.error('[GA endpoint error]', e, e?.errors || e?.details)

  // Safely serialize ANY error (including non-enumerables)
  const plain = JSON.parse(JSON.stringify(e, Object.getOwnPropertyNames(e)))

  const status = Number(e?.statusCode || e?.code || 500)
  // Try to extract Google API style details/reasons
  const details =
    (Array.isArray(e?.details) && e.details.map((d: any) => d?.reason || d?.message || d)) ||
    (Array.isArray(e?.errors)  && e.errors.map ((d: any) => d?.reason || d?.message || d)) ||
    undefined

  sendError(event, createError({
    statusCode: status,
    statusMessage: 'GA endpoint error',
    message: e?.message || plain?.message || 'Unknown error',
    data: {
      code: e?.code || plain?.code,
      name: e?.name || plain?.name,
      details,
      raw: plain, // ← temporarily include the whole serialized error for localhost
      hint: 'Check GA4_PROPERTY_ID, service-account env, GA property access, and Analytics Data API enablement.',
    },
  }))
}

})
