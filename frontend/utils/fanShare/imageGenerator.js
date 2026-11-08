/**
 * MBQ Fan Share Image Generator
 * 
 * Generates "poster energy" images for fan shares.
 * These are emotion-driven, not data-driven.
 * 
 * Visual rules:
 * - Band image centered and prominent
 * - Bold emotional headline
 * - NO stats or data
 * - Poster vibe, not report card
 */

// ============================================================
// ACCENT COLORS (shared with band shareables)
// ============================================================

const ACCENT_COLORS = {
  violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.3)' },
  blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.3)' },
  emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.3)' },
  amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' },
  rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.3)' },
}

// ============================================================
// MOMENT TYPE TO ACCENT MAPPING
// ============================================================

const MOMENT_ACCENTS = {
  FIRST_DISCOVERY: 'violet',
  AFTER_SHOW_FAN: 'rose',
  CITY_SUPPORT: 'blue',
  RETURNING_FAN: 'emerald',
  SUPER_FAN_ACTION: 'amber',
  SHOW_CHECK_IN: 'rose',
  DEFAULT: 'violet',
}

/**
 * Get accent color for a moment type
 * @param {string} momentType 
 * @returns {{ primary: string, glow: string }}
 */
export function getAccentForMoment(momentType) {
  const accentKey = MOMENT_ACCENTS[momentType] || 'violet'
  return ACCENT_COLORS[accentKey]
}

// ============================================================
// TEXT HELPERS
// ============================================================

/**
 * Wrap text to fit within maxWidth
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} maxWidth 
 * @param {number} maxLines 
 * @returns {string[]}
 */
function wrapText(ctx, text, maxWidth, maxLines = 2) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  // Truncate if too many lines
  if (lines.length > maxLines) {
    const truncated = lines.slice(0, maxLines)
    truncated[maxLines - 1] = truncated[maxLines - 1].slice(0, -3) + '...'
    return truncated
  }

  return lines
}

/**
 * Auto-fit text to width by reducing font size
 * @param {CanvasRenderingContext2D} ctx 
 * @param {string} text 
 * @param {number} maxWidth 
 * @param {number} baseFontSize 
 * @param {number} minFontSize 
 * @returns {{ fontSize: number, fits: boolean }}
 */
function fitTextToWidth(ctx, text, maxWidth, baseFontSize, minFontSize) {
  let fontSize = baseFontSize
  
  while (fontSize >= minFontSize) {
    ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`
    const metrics = ctx.measureText(text)
    
    if (metrics.width <= maxWidth) {
      return { fontSize, fits: true }
    }
    fontSize -= 2
  }
  
  return { fontSize: minFontSize, fits: false }
}

// ============================================================
// IMAGE GENERATOR
// ============================================================

/**
 * Generate fan share image (poster style)
 * @param {Object} options
 * @param {HTMLCanvasElement} options.canvasEl - Canvas element (1080x1080)
 * @param {string} options.headline - Emotional headline (e.g., "JUST FOUND SOMETHING SPECIAL")
 * @param {string} options.bandName - Band name
 * @param {string|null} options.bandImageUrl - Optional band image URL
 * @param {boolean} options.isBandNameInLogo - Skip band name if true
 * @param {string} options.momentType - Fan moment type for accent color
 * @param {Function} options.loadImage - Image loader function
 * @returns {Promise<Blob|null>}
 */
export async function generateFanShareImage({
  canvasEl,
  headline,
  bandName,
  bandImageUrl = null,
  isBandNameInLogo = false,
  momentType = 'DEFAULT',
  loadImage,
}) {
  console.log('[fanShareImage] generateFanShareImage called with:', {
    hasCanvas: !!canvasEl,
    headline,
    bandName,
    bandImageUrl,
    isBandNameInLogo,
    momentType,
    hasLoadImage: !!loadImage,
  })

  if (!canvasEl) {
    console.error('[fanShareImage] No canvas element provided')
    return null
  }

  try {
    const ctx = canvasEl.getContext('2d')
    const width = 1080
    const height = 1080

    // Get accent colors
    const accent = getAccentForMoment(momentType)

    // === BACKGROUND ===
    // Clean cinematic gradient
    const bgGradient = ctx.createLinearGradient(0, 0, width, height)
    bgGradient.addColorStop(0, '#1a0a2e')      // Deep purple-black
    bgGradient.addColorStop(0.5, '#0f0f0f')    // Near black
    bgGradient.addColorStop(1, '#0a1a1a')      // Dark teal hint
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // === SUBTLE VIGNETTE ===
    const vignetteGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    )
    vignetteGradient.addColorStop(0, 'transparent')
    vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)')
    ctx.fillStyle = vignetteGradient
    ctx.fillRect(0, 0, width, height)

    // === ACCENT GLOW (top) ===
    ctx.beginPath()
    ctx.arc(width / 2, 0, 400, 0, Math.PI * 2)
    const topGlow = ctx.createRadialGradient(
      width / 2, 0, 0,
      width / 2, 0, 400
    )
    topGlow.addColorStop(0, accent.glow)
    topGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = topGlow
    ctx.fill()

    ctx.textAlign = 'center'

    // === BAND IMAGE ===
    const imageSize = 340
    const imageY = 200

    // Helper to draw placeholder with initials
    function drawPlaceholder() {
      console.log('[fanShareImage] Drawing placeholder, bandName:', bandName, 'at y:', imageY)
      
      // Draw circle background - more visible
      ctx.beginPath()
      ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
      ctx.closePath()
      const placeholderGradient = ctx.createLinearGradient(
        width / 2 - imageSize / 2, imageY,
        width / 2 + imageSize / 2, imageY + imageSize
      )
      placeholderGradient.addColorStop(0, accent.primary)
      placeholderGradient.addColorStop(1, accent.primary + '80')
      ctx.fillStyle = placeholderGradient
      ctx.fill()
      
      // Draw border - more visible
      ctx.beginPath()
      ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.stroke()

      // Draw initials
      if (bandName && bandName.trim()) {
        const initials = bandName
          .trim()
          .split(' ')
          .filter(w => w.length > 0)
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        
        if (initials) {
          ctx.font = 'bold 120px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = '#ffffff'
          ctx.fillText(initials, width / 2, imageY + imageSize / 2 + 40)
        }
      }
    }

    let imageDrawn = false

    console.log('[fanShareImage] bandImageUrl:', bandImageUrl, 'loadImage:', !!loadImage)

    // Try to load and draw the band image
    if (bandImageUrl && loadImage) {
      try {
        console.log('[fanShareImage] Attempting to load image...')
        const img = await loadImage(bandImageUrl)
        console.log('[fanShareImage] Image loaded:', img?.width, 'x', img?.height)
        
        if (img && img.width > 0 && img.height > 0) {
          // Draw circular clipped image
          ctx.save()
          ctx.beginPath()
          ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          
          // Draw image centered and cover the circle
          const imgAspect = img.width / img.height
          let drawWidth, drawHeight, drawX, drawY
          
          if (imgAspect > 1) {
            drawHeight = imageSize
            drawWidth = imageSize * imgAspect
            drawX = width / 2 - drawWidth / 2
            drawY = imageY
          } else {
            drawWidth = imageSize
            drawHeight = imageSize / imgAspect
            drawX = width / 2 - imageSize / 2
            drawY = imageY - (drawHeight - imageSize) / 2
          }
          
          ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
          ctx.restore()
          
          // Subtle glow around image
          ctx.beginPath()
          ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2 + 4, 0, Math.PI * 2)
          ctx.strokeStyle = accent.primary + '40'
          ctx.lineWidth = 3
          ctx.stroke()
          
          imageDrawn = true
          console.log('[fanShareImage] Band image drawn successfully')
        }
      } catch (imgErr) {
        console.warn('[fanShareImage] Failed to load band image:', imgErr)
        imageDrawn = false
      }
    }
    
    // ALWAYS draw placeholder if image wasn't drawn successfully
    if (!imageDrawn) {
      console.log('[fanShareImage] Drawing placeholder (imageDrawn=false)')
      drawPlaceholder()
    }

    // === DECORATIVE LINE ===
    const lineY = imageY + imageSize + 50
    ctx.beginPath()
    ctx.moveTo(width / 2 - 60, lineY)
    ctx.lineTo(width / 2 + 60, lineY)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 2
    ctx.stroke()

    // === HEADLINE ===
    const headlineY = lineY + 80
    const headlineText = headline || 'PUT SOMEONE ON'
    
    // Fit headline to width
    const { fontSize: headlineFontSize } = fitTextToWidth(
      ctx, headlineText, width - 100, 64, 40
    )
    
    ctx.font = `900 ${headlineFontSize}px system-ui, -apple-system, sans-serif`
    
    // Gradient fill for headline (pink -> violet -> emerald)
    const headlineGradient = ctx.createLinearGradient(
      width / 2 - 300, headlineY,
      width / 2 + 300, headlineY
    )
    headlineGradient.addColorStop(0, '#ec4899')    // pink-500
    headlineGradient.addColorStop(0.5, '#8b5cf6')  // violet-500
    headlineGradient.addColorStop(1, '#34d399')   // emerald-400
    ctx.fillStyle = headlineGradient
    
    // Wrap if needed
    const headlineLines = wrapText(ctx, headlineText, width - 100, 2)
    headlineLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, headlineY + i * (headlineFontSize + 10))
    })

    // === BAND NAME ===
    if (!isBandNameInLogo && bandName) {
      const bandNameY = headlineY + headlineLines.length * (headlineFontSize + 10) + 50
      ctx.font = '600 36px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      
      // Truncate if too long
      let displayName = bandName
      while (ctx.measureText(displayName).width > width - 100 && displayName.length > 10) {
        displayName = displayName.slice(0, -4) + '...'
      }
      ctx.fillText(`— ${displayName} —`, width / 2, bandNameY)
    }

    // === TAGLINE ===
    ctx.font = '28px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.fillText('Scan • Listen • Follow', width / 2, height - 100)

    // === BRANDING ===
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
    ctx.fillText('via Faneqo', width / 2, height - 55)

    // Convert to blob
    console.log('[fanShareImage] Converting canvas to blob...')
    return new Promise((resolve) => {
      try {
        canvasEl.toBlob((blob) => {
          console.log('[fanShareImage] Blob created:', blob ? `${blob.size} bytes` : 'null')
          resolve(blob)
        }, 'image/png')
      } catch (toBlobErr) {
        console.error('[fanShareImage] toBlob failed (likely CORS tainted canvas):', toBlobErr)
        resolve(null)
      }
    })
  } catch (err) {
    console.error('[fanShareImage] Failed to generate image:', err)
    return null
  }
}

// ============================================================
// SHOW CHECK-IN BADGE IMAGE GENERATOR
// ============================================================

/**
 * The badge is deliberately a gig-poster, not a profile card: a full-bleed
 * artist photo, a heavy left-aligned type stack anchored to the bottom, and
 * only enough chrome to make the check-in feel verified.
 */
const BADGE_SIZE = 1080
const BADGE_MARGIN = 84
const BADGE_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

// Brand tokens (tailwind.config.js): accent #FF00FF, neon-purple #9100FF,
// neon-green #39FF14. Used in small doses so the artist photo stays the subject.
const BADGE_MAGENTA = '255, 0, 255'
const BADGE_VIOLET = '145, 0, 255'
const BADGE_GREEN = '#39FF14'

/**
 * Get verification label based on confidence score
 * @param {number} score
 * @returns {string}
 */
function getVerificationLabel(score) {
  if (score >= 85) return 'VERIFIED ATTENDEE'
  if (score >= 70) return 'LIVE CHECK-IN'
  return 'FAN CHECK-IN'
}

function getVerificationTone(score) {
  if (score >= 85) {
    return { dot: BADGE_GREEN, border: 'rgba(57, 255, 20, 0.55)', bg: 'rgba(57, 255, 20, 0.12)' }
  }
  if (score >= 70) {
    return { dot: '#22d3ee', border: 'rgba(34, 211, 238, 0.5)', bg: 'rgba(34, 211, 238, 0.12)' }
  }
  return { dot: '#c084fc', border: 'rgba(192, 132, 252, 0.45)', bg: 'rgba(192, 132, 252, 0.12)' }
}

/**
 * Format date for badge display. Returns '' for missing or unparseable input
 * so the layout drops the row instead of printing "Invalid Date".
 * @param {string|Date} dateInput
 * @returns {string}
 */
function formatBadgeDateShort(dateInput) {
  if (!dateInput) return ''

  const d = new Date(dateInput)
  if (Number.isNaN(d.getTime())) return ''

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ---- text helpers ---------------------------------------------------------

function cleanField(value) {
  const text = String(value ?? '').trim()
  // Guards against 'undefined'/'null' arriving as strings from upstream data.
  if (!text || text === 'undefined' || text === 'null') return ''
  return text
}

/** Trim to fit maxWidth, appending an ellipsis only when something was cut. */
function ellipsize(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text

  let out = text
  while (out.length > 1 && ctx.measureText(`${out}…`).width > maxWidth) {
    out = out.slice(0, -1)
  }
  return `${out.trimEnd()}…`
}

/** Word-wrap into at most maxLines, marking dropped words with an ellipsis. */
function wrapToLines(ctx, text, maxWidth, maxLines) {
  const words = cleanField(text).split(/\s+/).filter(Boolean)
  if (!words.length) return []

  const lines = []
  let current = ''
  let dropped = false

  for (const word of words) {
    const test = current ? `${current} ${word}` : word

    if (current && ctx.measureText(test).width > maxWidth) {
      lines.push(current)
      current = word

      if (lines.length === maxLines) {
        current = ''
        dropped = true
        break
      }
    } else {
      current = test
    }
  }

  if (current) lines.push(current)

  const last = lines.length - 1
  return lines.map((line, i) => ellipsize(ctx, dropped && i === last ? `${line}…` : line, maxWidth))
}

/** Shrink until the text fits, so long band names never overflow the margin. */
function fitFontSize(ctx, text, maxWidth, fontFor, maxSize, minSize) {
  let size = maxSize

  while (size > minSize) {
    ctx.font = fontFor(size)
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 2
  }

  ctx.font = fontFor(size)
  return size
}

/** Canvas has no letter-spacing in older engines, so track manually. */
function measureTracked(ctx, text, tracking) {
  let width = 0
  for (const char of text) width += ctx.measureText(char).width + tracking
  return width - tracking
}

function drawTracked(ctx, text, x, y, tracking) {
  let cursor = x
  for (const char of text) {
    ctx.fillText(char, cursor, y)
    cursor += ctx.measureText(char).width + tracking
  }
}

function getInitials(bandName) {
  const name = cleanField(bandName)
  if (!name) return ''

  const words = name.split(/\s+/).filter(Boolean)
  if (words.length > 1) {
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  }

  // Single token: split camel case ("BurningThunder" -> BT) rather than taking
  // the first two letters, which reads like a typo.
  const humps = name.match(/[A-Z][a-z]*/g)
  if (humps && humps.length > 1) {
    return humps.slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  }

  return name[0].toUpperCase()
}

// ---- drawing helpers ------------------------------------------------------

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function radialWash(ctx, x, y, radius, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, color)
  g.addColorStop(1, 'transparent')
  ctx.fillStyle = g
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

/** Cover-fit, biased upward because subjects sit high and the base is scrimmed. */
function drawCoverImage(ctx, img, W, H) {
  const scale = Math.max(W / img.width, H / img.height)
  const w = img.width * scale
  const h = img.height * scale
  ctx.drawImage(img, (W - w) / 2, (H - h) * 0.35, w, h)
}

function drawLightCone(ctx, x, topWidth, length, color) {
  const g = ctx.createLinearGradient(x, -60, x, length)
  g.addColorStop(0, color)
  g.addColorStop(1, 'transparent')

  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(x - topWidth / 2, -60)
  ctx.lineTo(x + topWidth / 2, -60)
  ctx.lineTo(x + topWidth * 2.2, length)
  ctx.lineTo(x - topWidth * 2.2, length)
  ctx.closePath()
  ctx.fill()
}

/**
 * No artist photo: build a stage instead of showing an empty frame. Gradient
 * backdrop, two light cones, echo arcs and the band's initials as a watermark.
 */
function drawFallbackStage(ctx, W, H, bandName) {
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#1b0630')
  bg.addColorStop(0.5, '#0a0714')
  bg.addColorStop(1, '#170326')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  drawLightCone(ctx, W * 0.3, W * 0.15, H * 0.95, `rgba(${BADGE_VIOLET}, 0.24)`)
  drawLightCone(ctx, W * 0.72, W * 0.18, H * 0.88, `rgba(${BADGE_MAGENTA}, 0.17)`)

  const cx = W / 2
  const cy = H * 0.36
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy, 170 + i * 118, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(${BADGE_MAGENTA}, ${0.22 - i * 0.042})`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const initials = getInitials(bandName)
  if (initials) {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${Math.round(W * 0.34)}px ${BADGE_FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)'
    ctx.fillText(initials, cx, cy)
    ctx.restore()
  }
}

/** Additive stage glow so colour sits in the light rather than over it. */
function drawStageGlow(ctx, W, H) {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  radialWash(ctx, W * 0.1, H * 0.84, W * 0.58, `rgba(${BADGE_MAGENTA}, 0.20)`)
  radialWash(ctx, W * 0.92, H * 0.16, W * 0.5, `rgba(${BADGE_VIOLET}, 0.17)`)
  ctx.restore()
}

/** Darkening passes that guarantee text contrast over any photo. */
function drawScrims(ctx, W, H) {
  ctx.fillStyle = 'rgba(7, 5, 12, 0.34)'
  ctx.fillRect(0, 0, W, H)

  const bottom = ctx.createLinearGradient(0, H * 0.32, 0, H)
  bottom.addColorStop(0, 'rgba(5, 3, 10, 0)')
  bottom.addColorStop(0.45, 'rgba(5, 3, 10, 0.74)')
  bottom.addColorStop(1, 'rgba(5, 3, 10, 0.97)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, H * 0.32, W, H * 0.68)

  const top = ctx.createLinearGradient(0, 0, 0, H * 0.26)
  top.addColorStop(0, 'rgba(5, 3, 10, 0.82)')
  top.addColorStop(1, 'rgba(5, 3, 10, 0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, H * 0.26)

  const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8)
  vignette.addColorStop(0, 'rgba(0, 0, 0, 0)')
  vignette.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)
}

/**
 * Speckle rather than per-pixel noise: `getImageData` throws on a canvas
 * tainted by a cross-origin photo, and this costs under a frame.
 */
function drawGrain(ctx, W, H) {
  ctx.save()
  ctx.globalAlpha = 0.05
  ctx.fillStyle = '#ffffff'
  for (let i = 0; i < 1500; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2)
  }
  ctx.restore()
}

function drawVerificationStamp(ctx, label, x, y, tone) {
  ctx.save()
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.font = `800 26px ${BADGE_FONT}`

  const tracking = 3.5
  const textWidth = measureTracked(ctx, label, tracking)
  const padX = 30
  const dotSize = 13
  const dotGap = 16
  const w = padX * 2 + dotSize + dotGap + textWidth
  const h = 62
  const midY = y + h / 2

  roundRectPath(ctx, x, y, w, h, h / 2)
  ctx.fillStyle = tone.bg
  ctx.fill()
  ctx.strokeStyle = tone.border
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.shadowColor = tone.dot
  ctx.shadowBlur = 18
  ctx.beginPath()
  ctx.arc(x + padX + dotSize / 2, midY, dotSize / 2, 0, Math.PI * 2)
  ctx.fillStyle = tone.dot
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)'
  drawTracked(ctx, label, x + padX + dotSize + dotGap, midY, tracking)
  ctx.restore()
}

function drawAccentRule(ctx, x, top, width) {
  const g = ctx.createLinearGradient(x, top, x + width, top)
  g.addColorStop(0, `rgb(${BADGE_MAGENTA})`)
  g.addColorStop(1, BADGE_GREEN)
  ctx.fillStyle = g
  roundRectPath(ctx, x, top, width, 7, 3.5)
  ctx.fill()
}

/**
 * Generate show check-in badge image (1080x1080)
 * @param {Object} options
 * @param {HTMLCanvasElement} options.canvasEl - Canvas element
 * @param {string} options.bandName - Band name
 * @param {string|null} options.bandImageUrl - Band image URL
 * @param {string} options.showTitle - Show title
 * @param {string} options.venue - Venue name
 * @param {string} options.city - City
 * @param {string|Date} options.checkedInAt - Check-in timestamp
 * @param {number} options.confidenceScore - 0-100
 * @param {Function} options.loadImage - Image loader function
 * @returns {Promise<Blob|null>}
 */
export async function generateShowCheckInBadgeImage({
  canvasEl,
  bandName,
  bandImageUrl = null,
  showTitle = '',
  venue = '',
  city = '',
  checkedInAt = null,
  confidenceScore = 50,
  loadImage,
}) {
  if (!canvasEl) {
    console.error('[badgeImage] No canvas element provided')
    return null
  }

  try {
    const ctx = canvasEl.getContext('2d')
    const W = BADGE_SIZE
    const H = BADGE_SIZE
    const M = BADGE_MARGIN
    const maxW = W - M * 2

    // Resetting the size also clears prior state, so a retry never draws over
    // a half-finished badge.
    canvasEl.width = W
    canvasEl.height = H

    const name = cleanField(bandName)
    const title = cleanField(showTitle)
    const location = [cleanField(venue), cleanField(city)].filter(Boolean).join('  ·  ')
    const dateStr = formatBadgeDateShort(checkedInAt)
    const score = Number(confidenceScore) || 0

    // === ARTIST PHOTO (full bleed) ===
    let bandImg = null
    if (bandImageUrl && loadImage) {
      try {
        bandImg = await loadImage(bandImageUrl)
      } catch (imgErr) {
        console.warn('[badgeImage] Failed to load band image:', imgErr)
      }
    }

    const hasImage = Boolean(bandImg && bandImg.width > 0 && bandImg.height > 0)
    ctx.fillStyle = '#07050c'
    ctx.fillRect(0, 0, W, H)

    if (hasImage) {
      drawCoverImage(ctx, bandImg, W, H)
    } else {
      drawFallbackStage(ctx, W, H, name)
    }

    drawStageGlow(ctx, W, H)
    drawScrims(ctx, W, H)
    drawGrain(ctx, W, H)

    // === VERIFICATION STAMP ===
    drawVerificationStamp(ctx, getVerificationLabel(score), M, M, getVerificationTone(score))

    // === POSTER STACK ===
    // Built bottom-up so missing fields collapse instead of leaving holes.
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'

    let y = H - 150

    if (dateStr) {
      ctx.font = `500 30px ${BADGE_FONT}`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.fillText(dateStr, M, y)
      y -= 48
    }

    if (location) {
      ctx.font = `500 32px ${BADGE_FONT}`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.64)'
      ctx.fillText(ellipsize(ctx, location, maxW), M, y)
      y -= 50
    }

    if (title) {
      ctx.font = `600 36px ${BADGE_FONT}`
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      const titleLines = wrapToLines(ctx, title, maxW, 2)
      for (let i = titleLines.length - 1; i >= 0; i--) {
        ctx.fillText(titleLines[i], M, y)
        y -= 46
      }
      y -= 6
    }

    if (name) {
      const nameSize = fitFontSize(ctx, name, maxW, (s) => `800 ${s}px ${BADGE_FONT}`, 66, 34)
      ctx.fillStyle = '#ffffff'
      ctx.fillText(ellipsize(ctx, name, maxW), M, y)
      y -= nameSize + 30
    }

    drawAccentRule(ctx, M, y - 7, 150)
    y -= 48

    // === HERO: I WAS THERE ===
    const headlineFont = (s) => `900 ${s}px ${BADGE_FONT}`
    const widthLimited = Math.min(
      fitFontSize(ctx, 'I WAS', maxW, headlineFont, 190, 90),
      fitFontSize(ctx, 'THERE', maxW, headlineFont, 190, 90)
    )
    // Two lines at 0.9 leading occupy roughly 1.62em; keep them clear of the stamp.
    const heightLimited = (y - 210) / 1.62
    const headlineSize = Math.max(90, Math.min(widthLimited, heightLimited))
    const leading = Math.round(headlineSize * 0.9)

    ctx.save()
    ctx.font = headlineFont(headlineSize)
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
    ctx.shadowBlur = 30
    ctx.shadowOffsetY = 6
    ctx.fillText('THERE', M, y)
    ctx.fillText('I WAS', M, y - leading)
    ctx.restore()

    // === FOOTER ===
    const footerY = H - 74
    ctx.font = `600 28px ${BADGE_FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.58)'
    ctx.fillText('Checked in with Faneqo', M, footerY)

    ctx.font = `700 21px ${BADGE_FONT}`
    ctx.fillStyle = 'rgba(255, 255, 255, 0.32)'
    const modeLabel = 'SHOW MODE'
    drawTracked(ctx, modeLabel, W - M - measureTracked(ctx, modeLabel, 4), footerY, 4)

    // Convert to blob
    return new Promise((resolve) => {
      try {
        canvasEl.toBlob((blob) => {
          resolve(blob)
        }, 'image/png')
      } catch (toBlobErr) {
        console.error('[badgeImage] toBlob failed:', toBlobErr)
        resolve(null)
      }
    })
  } catch (err) {
    console.error('[badgeImage] Failed to generate badge image:', err)
    return null
  }
}

export default {
  generateFanShareImage,
  generateShowCheckInBadgeImage,
  getAccentForMoment,
  ACCENT_COLORS,
  MOMENT_ACCENTS,
}
