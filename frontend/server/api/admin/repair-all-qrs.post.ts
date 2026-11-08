/**
 * Bulk repair ALL QRs that are missing options.data
 * POST /api/admin/repair-all-qrs
 * 
 * This will:
 * 1. Fetch all QR records
 * 2. Check if options.data is missing or invalid
 * 3. Update options.data with the correct directqr URL
 */
import { defineEventHandler, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const strapiBase = config.strapiUrl || 'https://api.musicbizqr.com'
  const token = config.strapiApiToken

  if (!token) {
    throw createError({ statusCode: 500, message: 'Missing STRAPI_API_TOKEN' })
  }

  // IMPORTANT: repair-all-qrs must never use the frontend BASE_URL to build QR
  // payload URLs. QR gateway URLs are distinct from the frontend origin.
  // This constant fills options.data ONLY for records where it is entirely
  // missing or corrupt — records that already have a valid options.data are
  // always skipped (see needsRepair check below).
  const QR_REPAIR_GATEWAY = 'https://qr.faneqo.com'
  
  try {
    // Fetch all QRs
    const res: any = await $fetch(`${strapiBase}/api/qrs`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      query: {
        'pagination[pageSize]': 1000,
        'fields[0]': 'id',
        'fields[1]': 'url',
        'fields[2]': 'slugId',
        'fields[3]': 'options',
        'fields[4]': 'name',
      }
    })

    const qrs = res?.data || []
    const results = {
      total: qrs.length,
      repaired: 0,
      skipped: 0,
      errors: [] as string[],
      details: [] as any[]
    }

    // A valid encoded QR URL is an HTTPS /directqr?id= URL.
    const isValidDirectQrUrl = (u: any): boolean =>
      typeof u === 'string' &&
      u.startsWith('https://') &&
      u.includes('directqr?id=')

    for (const qr of qrs) {
      const id = qr.id
      const attrs = qr.attributes || {}
      const options = attrs.options || {}

      // Determine the repair payload, preserving the existing hostname for any
      // recoverable legacy record:
      //   1. attrs.url            (if a valid /directqr?id= URL)
      //   2. attrs.options.data   (if a valid /directqr?id= URL)
      //   3. only then generate a new qr.faneqo.com URL
      const slugId = attrs.slugId || id
      let correctUrl: string
      if (isValidDirectQrUrl(attrs.url)) {
        correctUrl = attrs.url
      } else if (isValidDirectQrUrl(options.data)) {
        correctUrl = options.data
      } else {
        correctUrl = `${QR_REPAIR_GATEWAY}/directqr?id=${slugId}`
      }

      // Check if options.data is missing or invalid
      const currentData = options.data || ''
      const needsRepair = !currentData || 
                          !currentData.startsWith('https://') ||
                          !currentData.includes('directqr?id=')
      
      if (!needsRepair) {
        results.skipped++
        results.details.push({
          id,
          name: attrs.name,
          status: 'skipped',
          reason: 'Already has valid options.data',
          currentData
        })
        continue
      }

      // Repair: Update options.data
      try {
        const updatedOptions = {
          ...options,
          data: correctUrl
        }

        await $fetch(`${strapiBase}/api/qrs/${id}`, {
          method: 'PUT',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: {
            data: {
              options: updatedOptions,
              url: correctUrl, // Also update the url field
              slugId: String(slugId) // Ensure slugId is set
            }
          }
        })

        results.repaired++
        results.details.push({
          id,
          name: attrs.name,
          status: 'repaired',
          oldData: currentData || '(empty)',
          newData: correctUrl
        })
      } catch (err: any) {
        results.errors.push(`QR ${id}: ${err.message || err}`)
        results.details.push({
          id,
          name: attrs.name,
          status: 'error',
          error: err.message || String(err)
        })
      }
    }

    return {
      success: true,
      message: `Repaired ${results.repaired} of ${results.total} QRs`,
      ...results
    }
  } catch (err: any) {
    console.error('[repair-all-qrs] Error:', err)
    throw createError({ 
      statusCode: 500, 
      message: `Failed to repair QRs: ${err.message || err}` 
    })
  }
})
