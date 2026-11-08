import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { defineEventHandler, getRouterParam, setHeader } from 'h3'

const WIDTH = 1200
const HEIGHT = 630

export default defineEventHandler(async (event) => {
  console.log('[og/band] Request received')
  
  // Get the slug from the catch-all param (returns array) and remove .png extension
  const slugParam = getRouterParam(event, 'slug')
  // Handle both array (catch-all) and string formats
  const rawSlug = Array.isArray(slugParam) ? slugParam.join('/') : (slugParam || '')
  const bandSlug = rawSlug.replace(/\.png$/, '')
  
  console.log('[og/band] Processing slug:', bandSlug)
  
  if (!bandSlug) {
    throw createError({ statusCode: 400, message: 'Missing bandSlug' })
  }

  const config = useRuntimeConfig()
  const strapiUrl = config.public.strapiUrl || 'http://localhost:1337'

  // Fetch band data from Strapi
  let band: any = null
  try {
    console.log('[og/band] Fetching band from Strapi:', bandSlug)
    const res = await fetch(
      `${strapiUrl}/api/bands?filters[slug][$eq]=${bandSlug}&populate=bandImg`
    )
    const json = await res.json()
    band = json.data?.[0]
    console.log('[og/band] Band found:', band ? 'yes' : 'no')
  } catch (err) {
    console.error('[og/band] Failed to fetch band:', err)
  }

  const attrs = band?.attributes || band || {}
  const bandName = band?.name || attrs?.name || bandSlug
  const bandImageUrl = band?.bandImg?.url || attrs?.bandImg?.data?.attributes?.url || attrs?.bandImg?.url || null
  const focalX = Number(band?.cyberedImagePositionX ?? attrs?.cyberedImagePositionX ?? 50)
  const focalY = Number(band?.cyberedImagePositionY ?? attrs?.cyberedImagePositionY ?? 50)
  const objectPosition = `${Number.isFinite(focalX) ? focalX : 50}% ${Number.isFinite(focalY) ? focalY : 50}%`

  // Clean + truncate the bio for a tasteful one/two-line snippet
  const rawBio: string = (band?.description || attrs?.description || band?.bio || attrs?.bio || '') as string
  const bioText = rawBio
    .replace(/<[^>]*>/g, ' ')
    .replace(/[#*_>`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
  const bioSnippet = bioText.length === 140 ? bioText.replace(/\s+\S*$/, '') + '…' : bioText

  const genre: string = ((band?.genre || attrs?.genre || band?.genres || attrs?.genres || '') as string).toString().trim()
  const location: string = ((band?.location || attrs?.location || band?.hometown || attrs?.hometown || band?.city || attrs?.city || '') as string).toString().trim()
  const metaLine = [genre, location].filter(Boolean).join('  •  ')

  console.log('[og/band] Band name:', bandName, 'Image URL:', bandImageUrl ? 'present' : 'none')

  // Generate SVG using Satori - vibrant share card style
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
          background: 'linear-gradient(135deg, #0f0a1a 0%, #1a0a2e 30%, #0a0a14 70%, #0a1a1a 100%)',
          fontFamily: 'Inter',
          position: 'relative',
          overflow: 'hidden',
        },
        children: [
          // Vibrant purple orb top-left
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '-80px',
                left: '-60px',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.1) 40%, transparent 70%)',
              },
            },
          },
          // Blue orb bottom-right
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '-100px',
                right: '-80px',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(59, 130, 246, 0.1) 40%, transparent 70%)',
              },
            },
          },
          // Emerald accent orb
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '50%',
                right: '10%',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 60%)',
              },
            },
          },
          // Band image with vibrant glow
          bandImageUrl ? {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '32px',
                position: 'relative',
              },
              children: [
                // Multi-color glow behind image
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      width: '240px',
                      height: '240px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(59, 130, 246, 0.4) 50%, rgba(16, 185, 129, 0.3) 100%)',
                      filter: 'blur(40px)',
                    },
                  },
                },
                // Ring accent
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      width: '220px',
                      height: '220px',
                      borderRadius: '50%',
                      border: '2px solid rgba(139, 92, 246, 0.3)',
                    },
                  },
                },
                {
                  type: 'img',
                  props: {
                    src: bandImageUrl.startsWith('http') ? bandImageUrl : `${strapiUrl}${bandImageUrl}`,
                    style: {
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      objectPosition,
                      border: '4px solid rgba(255, 255, 255, 0.2)',
                    },
                  },
                },
              ],
            },
          } : null,
          // Band name - bold and prominent
          {
            type: 'div',
            props: {
              style: {
                fontSize: '56px',
                fontWeight: 800,
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: '-1px',
                marginBottom: metaLine ? '14px' : '20px',
                textShadow: '0 4px 30px rgba(139, 92, 246, 0.3)',
              },
              children: bandName,
            },
          },
          // Genre • Location meta line
          metaLine ? {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                fontWeight: 600,
                color: '#c4b5fd',
                textAlign: 'center',
                letterSpacing: '1px',
                marginBottom: bioSnippet ? '18px' : '28px',
              },
              children: metaLine,
            },
          } : null,
          // Bio snippet
          bioSnippet ? {
            type: 'div',
            props: {
              style: {
                fontSize: '26px',
                fontWeight: 400,
                color: 'rgba(255, 255, 255, 0.78)',
                textAlign: 'center',
                lineHeight: 1.4,
                maxWidth: '820px',
                marginBottom: '34px',
              },
              children: bioSnippet,
            },
          } : null,
          // Colorful tagline with gradient effect (simulated with colored words)
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '40px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#8B5CF6',
                      letterSpacing: '2px',
                    },
                    children: 'SCAN',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      color: 'rgba(255, 255, 255, 0.4)',
                    },
                    children: '•',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#3B82F6',
                      letterSpacing: '2px',
                    },
                    children: 'LISTEN',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      color: 'rgba(255, 255, 255, 0.4)',
                    },
                    children: '•',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '28px',
                      fontWeight: 700,
                      color: '#10B981',
                      letterSpacing: '2px',
                    },
                    children: 'FOLLOW',
                  },
                },
              ],
            },
          },
          // Faneqo branding pill
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '100px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                    },
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.6)',
                      letterSpacing: '1px',
                    },
                    children: 'Discover on Faneqo',
                  },
                },
              ],
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

// Font cache to avoid repeated fetches
let fontCache: ArrayBuffer | null = null

// Load a default font for Satori
async function loadDefaultFont(): Promise<ArrayBuffer> {
  // Return cached font if available
  if (fontCache && fontCache.byteLength > 0) {
    return fontCache
  }
  
  // Try multiple font sources for reliability
  const fontUrls = [
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff',
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff',
  ]
  
  for (const fontUrl of fontUrls) {
    try {
      const res = await fetch(fontUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)' }
      })
      if (res.ok) {
        const buffer = await res.arrayBuffer()
        if (buffer.byteLength > 0) {
          fontCache = buffer
          console.log('[og/band] Font loaded successfully from:', fontUrl)
          return buffer
        }
      }
    } catch (err) {
      console.error('[og/band] Failed to load font from:', fontUrl, err)
    }
  }
  
  console.error('[og/band] All font sources failed!')
  return new ArrayBuffer(0)
}
