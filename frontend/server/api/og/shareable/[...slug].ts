import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { defineEventHandler, getRouterParam, getQuery, setHeader } from 'h3'

const WIDTH = 1200
const HEIGHT = 630

// Accent colors matching the frontend
const ACCENT_COLORS: Record<string, { primary: string; glow: string }> = {
  violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
  blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.3)' },
  emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
  amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' },
}

export default defineEventHandler(async (event) => {
  // Get params from URL: /api/og/shareable/[bandId].png?type=...&hero=...&headline=...
  const slugParam = getRouterParam(event, 'slug')
  const rawSlug = Array.isArray(slugParam) ? slugParam.join('/') : (slugParam || '')
  const bandId = rawSlug.replace(/\.png$/, '')
  
  const query = getQuery(event)
  const cardType = (query.type as string) || 'MILESTONE_DROP'
  const hero = decodeURIComponent((query.hero as string) || '50')
  const headline = decodeURIComponent((query.headline as string) || 'MILESTONE UNLOCKED')
  const proof = decodeURIComponent((query.proof as string) || '')
  const accent = (query.accent as string) || 'violet'
  
  if (!bandId) {
    throw createError({ statusCode: 400, message: 'Missing bandId' })
  }

  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'

  // Fetch band data from Strapi
  let band: any = null
  try {
    const res = await fetch(
      `${strapiUrl}/api/bands/${bandId}?populate=bandImg`
    )
    const json = await res.json()
    band = json.data
  } catch (err) {
    console.error('[og/shareable] Failed to fetch band:', err)
  }

  const bandName = band?.name || band?.attributes?.name || 'Artist'
  const bandImageUrl = band?.bandImg?.url || band?.attributes?.bandImg?.data?.attributes?.url || null
  
  // Get accent colors
  const accentConfig = ACCENT_COLORS[accent] || ACCENT_COLORS.violet

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
          padding: '40px',
        },
        children: [
          // Accent glow top-right
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: accentConfig.glow,
              },
            },
          },
          // Accent glow bottom-left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '200px',
                height: '200px',
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
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid rgba(255, 255, 255, 0.2)',
                marginBottom: '20px',
              },
            },
          } : null,
          // Headline (with emoji)
          {
            type: 'div',
            props: {
              style: {
                fontSize: '28px',
                fontWeight: 700,
                color: '#ffffff',
                textAlign: 'center',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
              },
              children: headline,
            },
          },
          // Hero stat (big gradient text)
          {
            type: 'div',
            props: {
              style: {
                fontSize: '96px',
                fontWeight: 900,
                textAlign: 'center',
                lineHeight: 1,
                background: `linear-gradient(135deg, #F472B6, ${accentConfig.primary}, #60A5FA, #34D399)`,
                backgroundClip: 'text',
                color: 'transparent',
              },
              children: hero,
            },
          },
          // Proof line
          proof ? {
            type: 'div',
            props: {
              style: {
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.6)',
                textAlign: 'center',
                marginTop: '16px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              },
              children: proof,
            },
          } : null,
          // Band name
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
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
                bottom: '24px',
                right: '32px',
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.35)',
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
    console.error('[og/shareable] Failed to load font:', err)
    return new ArrayBuffer(0)
  }
}
