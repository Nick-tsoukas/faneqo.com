import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { defineEventHandler, getRouterParam, setHeader } from 'h3'

const WIDTH = 1200
const HEIGHT = 630

export default defineEventHandler(async (event) => {
  // Get the slug from the catch-all param (returns array) and remove .png extension
  const slugParam = getRouterParam(event, 'slug')
  // Handle both array (catch-all) and string formats
  const rawSlug = Array.isArray(slugParam) ? slugParam.join('/') : (slugParam || '')
  const momentId = rawSlug.replace(/\.png$/, '')
  
  if (!momentId) {
    throw createError({ statusCode: 400, message: 'Missing momentId' })
  }

  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'

  // Fetch moment data from Strapi
  let moment: any = null
  let band: any = null
  try {
    const res = await fetch(
      `${strapiUrl}/api/fan-moments/${momentId}?populate=band.bandImg`
    )
    const json = await res.json()
    moment = json.data
    band = moment?.band || moment?.attributes?.band?.data
  } catch (err) {
    console.error('[og/moment] Failed to fetch moment:', err)
  }

  // Extract rich share content (new format) or fallback to legacy
  const shareTitle = moment?.shareTitle || moment?.attributes?.shareTitle || 'Fan Moment'
  const shareSubtitle = moment?.shareSubtitle || moment?.attributes?.shareSubtitle || ''
  const shareText = moment?.shareText || moment?.attributes?.shareText || ''
  const shareEmoji = moment?.shareEmoji || moment?.attributes?.shareEmoji || ''
  const shareCallToAction = moment?.shareCallToAction || moment?.attributes?.shareCallToAction || 'Check them out'
  const momentType = moment?.momentType || moment?.attributes?.momentType || ''
  const triggerReason = moment?.triggerReason || moment?.attributes?.triggerReason || ''
  const fanPosition = moment?.fanPosition || moment?.attributes?.fanPosition || null
  const bandName = band?.name || band?.attributes?.name || 'Artist'
  const bandImageUrl = band?.bandImg?.url || band?.attributes?.bandImg?.data?.attributes?.url || null
  
  // Context data for additional info
  const context = moment?.context || moment?.attributes?.context || {}
  const velocity = context?.velocity || null
  const cityName = context?.cityName || null

  // Truncate shareText if too long
  const truncatedText = shareText.length > 100 ? shareText.substring(0, 97) + '...' : shareText

  // Use stored emoji or fallback based on moment type
  const getEmoji = (type: string, storedEmoji: string) => {
    if (storedEmoji) return storedEmoji
    switch (type) {
      case 'I_WAS_THERE': return '🎸'
      case 'FUELED_MOMENTUM': return '⚡'
      case 'PULSE_SURGE': return '🔥'
      case 'CITY_HEAT': return '🌆'
      case 'MOMENT_MATTERED': return '💫'
      case 'AFTER_SHOW_RECAP': return '🎤'
      default: return '✨'
    }
  }
  
  const emoji = getEmoji(momentType, shareEmoji)

  // Generate SVG using Satori
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #0f0f0f 50%, #0a1a1a 100%)',
          fontFamily: 'Inter',
          padding: '60px',
        },
        children: [
          // Decorative circle top right
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '40px',
                right: '80px',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.2)',
              },
            },
          },
          // Decorative circle bottom left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '60px',
                left: '100px',
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
              },
            },
          },
          // Band image (if available)
          bandImageUrl ? {
            type: 'img',
            props: {
              src: bandImageUrl.startsWith('http') ? bandImageUrl : `${strapiUrl}${bandImageUrl}`,
              style: {
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '24px',
              },
            },
          } : null,
          // Emoji
          {
            type: 'div',
            props: {
              style: {
                fontSize: '48px',
                marginBottom: '16px',
              },
              children: emoji,
            },
          },
          // Share title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '56px',
                fontWeight: 700,
                color: '#ffffff',
                textAlign: 'center',
                maxWidth: '1000px',
                lineHeight: 1.2,
              },
              children: shareTitle,
            },
          },
          // Share subtitle (if available)
          shareSubtitle ? {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                color: '#10b981',
                textAlign: 'center',
                marginTop: '8px',
              },
              children: shareSubtitle,
            },
          } : null,
          // Share text (truncated)
          truncatedText ? {
            type: 'div',
            props: {
              style: {
                fontSize: '26px',
                color: '#a1a1aa',
                textAlign: 'center',
                maxWidth: '900px',
                marginTop: '16px',
                lineHeight: 1.4,
              },
              children: truncatedText,
            },
          } : null,
          // Fan position badge (if available)
          fanPosition && fanPosition <= 100 ? {
            type: 'div',
            props: {
              style: {
                fontSize: '20px',
                color: '#fbbf24',
                textAlign: 'center',
                marginTop: '12px',
                padding: '6px 16px',
                background: 'rgba(251, 191, 36, 0.15)',
                borderRadius: '20px',
              },
              children: fanPosition <= 10 ? `Fan #${fanPosition}` : `Top ${fanPosition} fans`,
            },
          } : null,
          // Band name
          {
            type: 'div',
            props: {
              style: {
                fontSize: '32px',
                color: '#c4b5fd',
                marginTop: '24px',
              },
              children: bandName,
            },
          },
          // Watermark
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '30px',
                right: '40px',
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.4)',
              },
              children: 'via Faneqo',
            },
          },
        ].filter(Boolean),
      },
    },
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [
        {
          name: 'Inter',
          data: await loadDefaultFont(),
          weight: 400,
          style: 'normal',
        },
        {
          name: 'Inter',
          data: await loadDefaultFont(),
          weight: 700,
          style: 'normal',
        },
      ],
    }
  )

  // Convert SVG to PNG
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
  })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Set headers
  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800')

  return pngBuffer
})

// Load a default font for Satori
async function loadDefaultFont(): Promise<ArrayBuffer> {
  const fontUrl = 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff'
  
  try {
    const res = await fetch(fontUrl)
    return await res.arrayBuffer()
  } catch (err) {
    console.error('[og/moment] Failed to load font:', err)
    return new ArrayBuffer(0)
  }
}
