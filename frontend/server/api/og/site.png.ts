import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { defineEventHandler, setHeader } from 'h3'

/**
 * Default Faneqo social card — the image that represents the whole site when a
 * link is shared without a more specific OG image. Rendered with Satori (JSX
 * object tree to SVG) and rasterised by Resvg, so only Satori's CSS subset is
 * available: flexbox, gradients, borders and border-radius. No blur filters.
 */

const WIDTH = 1200
const HEIGHT = 630

const FONT_WEIGHTS = [400, 700, 800] as const

export default defineEventHandler(async (event) => {
  const loaded = await Promise.all(FONT_WEIGHTS.map((weight) => loadFont(weight)))

  const fonts = FONT_WEIGHTS.flatMap((weight, index) => {
    const data = loaded[index]
    return data ? [{ name: 'Inter', data, weight, style: 'normal' as const }] : []
  })

  if (!fonts.length) {
    throw new Error('[og/site] Could not load any font for the social card')
  }

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: 'linear-gradient(135deg, #07060c 0%, #150a28 48%, #07060c 100%)',
          fontFamily: 'Inter',
        },
        children: [
          // --- Stage lighting -------------------------------------------------
          glow({ left: -200, top: -240, size: 640, color: 'rgba(168, 85, 247, 0.30)' }),
          glow({ left: 720, top: 260, size: 600, color: 'rgba(236, 72, 153, 0.20)' }),
          glow({ left: 240, top: 430, size: 360, color: 'rgba(52, 211, 153, 0.14)' }),
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                left: '0px',
                top: '0px',
                width: `${WIDTH}px`,
                height: '5px',
                background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #34d399 100%)',
              },
            },
          },

          // --- Content --------------------------------------------------------
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                width: '100%',
                height: '100%',
                padding: '56px',
              },
              children: [
                // Left: wordmark and message
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      // Wide enough that the second headline line stays on one
                      // line at 38px instead of orphaning its last word.
                      width: '750px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignSelf: 'flex-start',
                            padding: '7px 16px',
                            marginBottom: '26px',
                            borderRadius: '999px',
                            border: '1px solid rgba(52, 211, 153, 0.45)',
                            background: 'rgba(52, 211, 153, 0.10)',
                            color: '#6ee7b7',
                            fontSize: '15px',
                            fontWeight: 700,
                            letterSpacing: '1.6px',
                          },
                          children: 'BUILT FOR ARTISTS',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '24px',
                          },
                          children: [
                            {
                              type: 'div',
                              props: {
                                style: {
                                  width: '16px',
                                  height: '16px',
                                  marginRight: '16px',
                                  borderRadius: '999px',
                                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
                                  boxShadow: '0 0 22px rgba(236, 72, 153, 0.85)',
                                },
                              },
                            },
                            {
                              type: 'div',
                              props: {
                                style: {
                                  fontSize: '54px',
                                  fontWeight: 800,
                                  color: '#ffffff',
                                  letterSpacing: '-1.5px',
                                },
                                children: 'Faneqo',
                              },
                            },
                          ],
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '38px',
                            fontWeight: 800,
                            color: '#ffffff',
                            letterSpacing: '-0.8px',
                            lineHeight: 1.22,
                          },
                          children: 'Bands don\u2019t need more links.',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '38px',
                            fontWeight: 800,
                            letterSpacing: '-0.8px',
                            lineHeight: 1.22,
                            marginBottom: '28px',
                            background: 'linear-gradient(100deg, #f472b6 0%, #a855f7 45%, #34d399 100%)',
                            backgroundClip: 'text',
                            color: 'transparent',
                          },
                          children: 'They need fans they can reach again.',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '21px',
                            fontWeight: 400,
                            color: 'rgba(255, 255, 255, 0.58)',
                            marginBottom: '32px',
                          },
                          children: 'Artist pages \u00b7 show check-ins \u00b7 fan messaging \u00b7 analytics',
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: '20px',
                            fontWeight: 700,
                            color: '#6ee7b7',
                            letterSpacing: '0.5px',
                          },
                          children: 'faneqo.com',
                        },
                      },
                    ],
                  },
                },

                // Right: artist page at the centre of its own echo
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexGrow: 1,
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            position: 'relative',
                            width: '330px',
                            height: '330px',
                          },
                          children: [
                            // Kept narrower than the card so it reads as an echo
                            // behind the artist page, never tangent to its edges.
                            ring({ offset: 15, size: 300, color: 'rgba(168, 85, 247, 0.16)' }),
                            ring({ offset: 45, size: 240, color: 'rgba(168, 85, 247, 0.28)' }),
                            ring({ offset: 75, size: 180, color: 'rgba(236, 72, 153, 0.34)' }),
                            {
                              type: 'div',
                              props: {
                                style: {
                                  display: 'flex',
                                  flexDirection: 'column',
                                  position: 'absolute',
                                  left: '0px',
                                  top: '95px',
                                  width: '330px',
                                  padding: '22px',
                                  borderRadius: '26px',
                                  border: '1px solid rgba(168, 85, 247, 0.38)',
                                  background: 'rgba(10, 8, 18, 0.92)',
                                  boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)',
                                },
                                children: [
                                  {
                                    type: 'div',
                                    props: {
                                      style: { display: 'flex', alignItems: 'center' },
                                      children: [
                                        {
                                          type: 'div',
                                          props: {
                                            style: {
                                              width: '46px',
                                              height: '46px',
                                              marginRight: '14px',
                                              borderRadius: '999px',
                                              background: 'linear-gradient(140deg, #a855f7 0%, #ec4899 100%)',
                                            },
                                          },
                                        },
                                        {
                                          type: 'div',
                                          props: {
                                            style: { display: 'flex', flexDirection: 'column' },
                                            children: [
                                              bar({ width: 132, height: 12, color: 'rgba(255, 255, 255, 0.88)' }),
                                              bar({ width: 84, height: 9, color: 'rgba(255, 255, 255, 0.30)', marginTop: 9 }),
                                            ],
                                          },
                                        },
                                        { type: 'div', props: { style: { display: 'flex', flexGrow: 1 } } },
                                        {
                                          type: 'div',
                                          props: {
                                            style: { display: 'flex', alignItems: 'flex-end', height: '32px' },
                                            children: [
                                              bar({ width: 6, height: 13, color: 'rgba(52, 211, 153, 0.45)', marginRight: 5 }),
                                              bar({ width: 6, height: 24, color: 'rgba(52, 211, 153, 0.70)', marginRight: 5 }),
                                              bar({ width: 6, height: 32, color: '#34d399' }),
                                            ],
                                          },
                                        },
                                      ],
                                    },
                                  },
                                  {
                                    type: 'div',
                                    props: {
                                      style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        alignSelf: 'flex-start',
                                        marginTop: '20px',
                                        padding: '7px 13px',
                                        borderRadius: '999px',
                                        border: '1px solid rgba(236, 72, 153, 0.5)',
                                        background: 'rgba(236, 72, 153, 0.16)',
                                      },
                                      children: [
                                        {
                                          type: 'div',
                                          props: {
                                            style: {
                                              width: '8px',
                                              height: '8px',
                                              marginRight: '9px',
                                              borderRadius: '999px',
                                              background: '#f472b6',
                                              boxShadow: '0 0 12px rgba(244, 114, 182, 0.9)',
                                            },
                                          },
                                        },
                                        {
                                          type: 'div',
                                          props: {
                                            style: {
                                              color: '#fbcfe8',
                                              fontSize: '13px',
                                              fontWeight: 700,
                                              letterSpacing: '1.3px',
                                            },
                                            children: 'SHOW MODE LIVE',
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        type: 'div',
                        props: {
                          style: {
                            display: 'flex',
                            alignItems: 'center',
                            marginTop: '30px',
                          },
                          children: [
                            chip('Check-ins'),
                            chip('Fan list'),
                            chip('Recap', true),
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
    { width: WIDTH, height: HEIGHT, fonts }
  )

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: WIDTH } })
  const pngBuffer = resvg.render().asPng()

  setHeader(event, 'Content-Type', 'image/png')
  setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=604800') // 1 day browser, 7 days CDN

  return pngBuffer
})

/** Soft stage light. Satori has no blur filter, so glows are radial gradients. */
function glow({ left, top, size, color }: { left: number; top: number; size: number; color: string }) {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '999px',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      },
    },
  }
}

/** Concentric echo arc radiating from the artist card. */
function ring({ offset, size, color }: { offset: number; size: number; color: string }) {
  return {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        left: `${offset}px`,
        top: `${offset}px`,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '999px',
        border: `1px solid ${color}`,
      },
    },
  }
}

function bar({
  width,
  height,
  color,
  marginTop = 0,
  marginRight = 0,
}: { width: number; height: number; color: string; marginTop?: number; marginRight?: number }) {
  return {
    type: 'div',
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        marginTop: `${marginTop}px`,
        marginRight: `${marginRight}px`,
        borderRadius: '999px',
        background: color,
      },
    },
  }
}

function chip(label: string, isLast = false) {
  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        padding: '9px 15px',
        marginRight: isLast ? '0px' : '10px',
        borderRadius: '999px',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        background: 'rgba(255, 255, 255, 0.06)',
        color: 'rgba(255, 255, 255, 0.72)',
        fontSize: '15px',
        fontWeight: 700,
      },
      children: label,
    },
  }
}

/**
 * Weight-specific files matter here: the previous version registered 400/700/800
 * but fetched the same regular file for all three, so nothing rendered bold.
 */
const FONT_SOURCES: Record<number, string[]> = {
  400: [
    'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.woff',
    'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff',
  ],
  700: ['https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.woff'],
  800: ['https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-800-normal.woff'],
}

async function loadFont(weight: number): Promise<ArrayBuffer | null> {
  for (const url of FONT_SOURCES[weight] || []) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const buffer = await response.arrayBuffer()
      if (buffer.byteLength > 0) return buffer
    } catch {
      // Try the next source. Satori falls back to a nearby weight if one is missing.
    }
  }

  return null
}
