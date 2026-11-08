/**
 * Share Kit composable - shared utilities for band and moment sharing
 * Provides helpers for Web Share API, clipboard, downloads, and social sharing
 * 
 * V2: Now includes fan share system with identity-driven copy and poster-style images
 */

import { useRuntimeConfig } from '#imports'
import {
  FAN_MOMENT_TYPES,
  getFanCaption,
  getAllCaptions,
  getFanHeadline,
  detectFanMomentType,
  buildFanShareText,
  getBadgeCaption,
  getAllBadgeCaptions,
  getBadgeHeadline,
  getVerificationLabel,
  formatBadgeDate,
} from '@/utils/fanShare/copy'
import { generateFanShareImage, generateShowCheckInBadgeImage, getAccentForMoment } from '@/utils/fanShare/imageGenerator'

export function useShareKit() {
  /**
   * Build the share URL for a band
   */
  function buildShareUrl({ bandSlug }) {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/${bandSlug}`
  }

  /**
   * Build caption text (without URL) - for Instagram/social copy
   * LEGACY: Use getFanCaption for new fan shares
   */
  function buildCaption({ bandName, momentType = null, momentTitle = null }) {
    if (momentType) {
      switch (momentType) {
        case 'I_WAS_THERE':
          return `I was there. ${bandName} was a vibe 🔥`
        case 'FUELED_MOMENTUM':
          return `I just supported ${bandName}. Help them keep it moving 💜`
        case 'PULSE_SURGE':
          return `${bandName} is heating up right now 🔥`
        case 'AFTER_SHOW_RECAP':
          return `Last night was wild — ${bandName} brought the heat.`
        default:
          return `Put someone on: ${bandName} 🎧`
      }
    }
    // Default band share caption
    return `Been listening to ${bandName}. Put someone on 🎧`
  }

  /**
   * Build share text (with URL) - for SMS/email/Web Share
   * LEGACY: Use buildFanShareText for new fan shares
   */
  function buildShareText({ bandName, shareUrl, momentType = null, momentTitle = null }) {
    if (momentType) {
      const caption = buildCaption({ bandName, momentType, momentTitle })
      return `${caption} ${shareUrl}`
    }
    return `Check out ${bandName} on Faneqo: ${shareUrl}`
  }

  /**
   * Generate share image using canvas
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvasEl - Canvas element to draw on
   * @param {string} options.bandName - Band name
   * @param {string|null} options.bandImageUrl - Optional band image URL
   * @param {string|null} options.momentTitle - Optional moment title (e.g., "You were part of this moment")
   * @param {string|null} options.subtitle - Optional subtitle (e.g., location)
   * @param {boolean} options.isBandNameInLogo - If true, hide band name text (it's in the logo)
   * @returns {Promise<Blob|null>}
   */
  async function generateShareImage({ canvasEl, bandName, bandImageUrl = null, momentTitle = null, subtitle = null, isBandNameInLogo = false }) {
    if (!canvasEl) return null

    try {
      const ctx = canvasEl.getContext('2d')
      const width = 1080
      const height = 1080

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#1a0a2e')
      gradient.addColorStop(0.5, '#0f0f0f')
      gradient.addColorStop(1, '#0a1a1a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Decorative circles
      ctx.beginPath()
      ctx.arc(width * 0.85, height * 0.15, 180, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(width * 0.15, height * 0.85, 140, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)'
      ctx.fill()

      ctx.textAlign = 'center'

      // Calculate layout based on whether we have an image
      const hasImage = !!bandImageUrl
      const showBandNameText = !isBandNameInLogo
      
      // Image dimensions and position
      const imageSize = 320
      const imageY = hasImage ? (momentTitle ? height * 0.22 : height * 0.18) : 0

      // Load and draw band image if available
      let imageLoaded = false
      if (bandImageUrl) {
        try {
          console.log('[useShareKit] Loading band image:', bandImageUrl)
          const img = await loadImage(bandImageUrl)
          
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
            
            // Add subtle border around image
            ctx.beginPath()
            ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 3
            ctx.stroke()
            
            imageLoaded = true
            console.log('[useShareKit] Band image drawn successfully')
          } else {
            console.warn('[useShareKit] Image loaded but has invalid dimensions')
          }
        } catch (imgErr) {
          console.warn('[useShareKit] Failed to load band image:', imgErr)
        }
      }

      // Calculate text positions based on image presence
      const textStartY = hasImage ? imageY + imageSize + 50 : (momentTitle ? height * 0.32 : height * 0.35)

      // If moment title exists, draw it
      if (momentTitle) {
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
        ctx.fillText(momentTitle, width / 2, hasImage ? textStartY : height * 0.32)
      }

      // Band name - only if not in logo
      if (showBandNameText) {
        const bandNameY = momentTitle 
          ? (hasImage ? textStartY + 70 : height * 0.48)
          : (hasImage ? textStartY + 20 : height * 0.42)
        
        ctx.fillStyle = momentTitle ? '#c4b5fd' : '#ffffff'
        ctx.font = `bold ${hasImage ? 56 : (momentTitle ? 64 : 80)}px system-ui, -apple-system, sans-serif`

        // Word wrap band name if too long
        const maxWidth = width - 120
        const words = bandName.split(' ')
        let lines = []
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

        // Draw band name lines
        const lineHeight = hasImage ? 65 : (momentTitle ? 75 : 95)
        const adjustedStartY = bandNameY - ((lines.length - 1) * lineHeight) / 2
        lines.forEach((line, i) => {
          ctx.fillText(line, width / 2, adjustedStartY + i * lineHeight)
        })

        // Subtitle (location) if provided
        if (subtitle) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
          ctx.font = '32px system-ui, -apple-system, sans-serif'
          ctx.fillText(subtitle, width / 2, adjustedStartY + lines.length * lineHeight + 25)
        }
      } else if (subtitle) {
        // If no band name text but we have subtitle, show it below image/moment title
        const subtitleY = momentTitle 
          ? (hasImage ? textStartY + 70 : height * 0.48)
          : (hasImage ? textStartY + 20 : height * 0.50)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.font = '32px system-ui, -apple-system, sans-serif'
        ctx.fillText(subtitle, width / 2, subtitleY)
      }

      // Tagline
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = '36px system-ui, -apple-system, sans-serif'
      ctx.fillText('Scan • Listen • Follow', width / 2, height * 0.82)

      // Faneqo branding
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = '28px system-ui, -apple-system, sans-serif'
      ctx.fillText('via Faneqo', width / 2, height * 0.92)

      // Convert to blob
      return new Promise((resolve) => {
        canvasEl.toBlob((blob) => {
          resolve(blob)
        }, 'image/png')
      })
    } catch (err) {
      console.error('[useShareKit] Failed to generate image:', err)
      return null
    }
  }

  // Get runtime config for proxy URL
  const runtimeConfig = useRuntimeConfig()

  /**
   * Load an image from URL (handles CORS via backend proxy)
   * @param {string} url
   * @returns {Promise<HTMLImageElement>}
   */
  async function loadImage(url) {
    console.log('[useShareKit] loadImage called with:', url)
    
    // Strategy 1: Use backend proxy for external images (most reliable)
    const needsProxy = url.includes('cloudinary.com') || 
                       url.includes('res.cloudinary') || 
                       url.includes('.s3.') || 
                       url.includes('s3.amazonaws.com')
    
    if (needsProxy) {
      try {
        const proxyUrl = `${runtimeConfig.public.strapiUrl}/api/image-proxy?url=${encodeURIComponent(url)}`
        console.log('[useShareKit] Trying proxy URL:', proxyUrl)
        const img = await loadImageDirect(proxyUrl)
        console.log('[useShareKit] Proxy load succeeded')
        return img
      } catch (e) {
        console.warn('[useShareKit] Proxy load failed:', e)
      }
    }
    
    // Strategy 2: Try direct load with crossOrigin
    try {
      console.log('[useShareKit] Trying direct load with crossOrigin')
      const img = await loadImageDirect(url)
      console.log('[useShareKit] Direct load succeeded')
      return img
    } catch (e) {
      console.warn('[useShareKit] Direct image load failed:', e)
    }

    // Strategy 3: Try fetching as blob directly
    try {
      console.log('[useShareKit] Trying fetch as blob')
      const response = await fetch(url, { mode: 'cors' })
      if (response.ok) {
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        
        const img = await new Promise((resolve, reject) => {
          const image = new Image()
          image.onload = () => {
            URL.revokeObjectURL(objectUrl)
            resolve(image)
          }
          image.onerror = () => {
            URL.revokeObjectURL(objectUrl)
            reject(new Error('Blob image load failed'))
          }
          image.src = objectUrl
        })
        console.log('[useShareKit] Blob load succeeded')
        return img
      }
    } catch (fetchErr) {
      console.warn('[useShareKit] Fetch blob failed:', fetchErr)
    }

    // Strategy 4: Load without crossOrigin (canvas will be tainted but image shows)
    console.warn('[useShareKit] All CORS strategies failed, loading without crossOrigin')
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = url
    })
  }

  /**
   * Direct image load with crossOrigin and timeout
   */
  function loadImageDirect(url, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'))
      }, timeoutMs)
      
      img.onload = () => {
        clearTimeout(timeout)
        resolve(img)
      }
      img.onerror = (err) => {
        clearTimeout(timeout)
        reject(err || new Error('Image load error'))
      }
      img.src = url
    })
  }

  /**
   * Attempt Web Share API
   * @returns {{ ok: boolean, usedFile: boolean }}
   */
  async function webShare({ title, text, url, imageBlob = null, filename = 'share.png' }) {
    if (!navigator.share) {
      return { ok: false, usedFile: false }
    }

    try {
      const shareData = { title, text, url }

      // Try with file if available
      if (imageBlob && navigator.canShare) {
        const file = new File([imageBlob], filename, { type: 'image/png' })
        const dataWithFile = { ...shareData, files: [file] }

        if (navigator.canShare(dataWithFile)) {
          await navigator.share(dataWithFile)
          return { ok: true, usedFile: true }
        }
      }

      // Fallback: share without file
      await navigator.share(shareData)
      return { ok: true, usedFile: false }
    } catch (err) {
      if (err.name === 'AbortError') {
        // User cancelled - not an error
        return { ok: false, usedFile: false }
      }
      console.error('[useShareKit] Web Share failed:', err)
      return { ok: false, usedFile: false }
    }
  }

  /**
   * Copy text to clipboard
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text)
        return true
      }
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      return true
    } catch (err) {
      console.error('[useShareKit] Copy failed:', err)
      return false
    }
  }

  /**
   * Download blob as file
   */
  function downloadBlob(blob, filename) {
    try {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      return true
    } catch (err) {
      console.error('[useShareKit] Download failed:', err)
      return false
    }
  }

  /**
   * Open Facebook sharer in new tab
   */
  function openFacebookSharer(shareUrl) {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=400')
  }

  /**
   * Generate filename for share image
   */
  function getShareFilename(bandSlug, type = 'share') {
    return `${bandSlug}-${type}.png`
  }

  // ============================================================
  // NEW: ShareCard Image Generation (V1 Shareables)
  // ============================================================

  const ACCENT_COLORS = {
    violet: { primary: '#8B5CF6', glow: 'rgba(139, 92, 246, 0.25)' },
    blue: { primary: '#3B82F6', glow: 'rgba(59, 130, 246, 0.25)' },
    emerald: { primary: '#10B981', glow: 'rgba(16, 185, 129, 0.25)' },
    amber: { primary: '#F59E0B', glow: 'rgba(245, 158, 11, 0.25)' },
    rose: { primary: '#F43F5E', glow: 'rgba(244, 63, 94, 0.25)' },
  }

  /**
   * Strip leading emoji from text for canvas rendering
   */
  function stripLeadingEmoji(text) {
    if (!text) return ''
    // Remove leading emoji and whitespace
    return text.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}\s]+/u, '').trim()
  }

  /**
   * Wrap text to fit within maxWidth, shrinking font if needed
   * Returns { lines: string[], fontSize: number }
   */
  function wrapText(ctx, text, maxWidth, maxLines = 2, baseFontSize = 40, minFontSize = 28) {
    let fontSize = baseFontSize
    let lines = []

    while (fontSize >= minFontSize) {
      ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
      lines = []
      const words = text.split(' ')
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

      if (lines.length <= maxLines) {
        return { lines, fontSize }
      }
      fontSize -= 2
    }

    // If still too many lines, truncate
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines)
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -3) + '...'
    }

    return { lines, fontSize: minFontSize }
  }

  /**
   * Fit hero text to width, shrinking if needed
   * Returns { text: string, fontSize: number }
   */
  function fitHeroText(ctx, text, maxWidth, baseFontSize = 128, minFontSize = 72) {
    let fontSize = baseFontSize

    while (fontSize >= minFontSize) {
      ctx.font = `900 ${fontSize}px system-ui, -apple-system, sans-serif`
      const metrics = ctx.measureText(text)
      
      if (metrics.width <= maxWidth) {
        return { text, fontSize }
      }
      fontSize -= 4
    }

    return { text, fontSize: minFontSize }
  }

  /**
   * Generate share card image for V1 Shareables
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvasEl - Canvas element (1080x1080)
   * @param {Object} options.card - Card data { headline, hero, proof, accent, microCaption }
   * @param {string} options.bandName - Band name
   * @param {string|null} options.bandImageUrl - Optional band image URL
   * @param {boolean} options.isBandNameInLogo - Skip band name if true
   * @param {string} options.captionStyle - 'hype' | 'grateful' | 'tease'
   * @returns {Promise<Blob|null>}
   */
  async function generateShareCardImage({
    canvasEl,
    card,
    bandName,
    bandImageUrl = null,
    isBandNameInLogo = false,
    captionStyle = 'hype',
  }) {
    if (!canvasEl || !card) return null

    try {
      const ctx = canvasEl.getContext('2d')
      const width = 1080
      const height = 1080

      // Get accent colors
      const accent = ACCENT_COLORS[card.accent] || ACCENT_COLORS.violet

      // === BACKGROUND ===
      // Clean cinematic gradient
      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, '#1a0a2e')      // Deep purple-black
      bgGradient.addColorStop(0.4, '#0f0f0f')    // Near black
      bgGradient.addColorStop(0.7, '#0a1220')    // Hint of blue
      bgGradient.addColorStop(1, '#0a1a1a')      // Dark teal hint
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // === DECORATIVE ELEMENTS ===
      // Top-right accent orb
      ctx.beginPath()
      ctx.arc(width * 0.85, height * 0.12, 200, 0, Math.PI * 2)
      const orbGradient = ctx.createRadialGradient(
        width * 0.85, height * 0.12, 0,
        width * 0.85, height * 0.12, 200
      )
      orbGradient.addColorStop(0, accent.glow)
      orbGradient.addColorStop(1, 'transparent')
      ctx.fillStyle = orbGradient
      ctx.fill()

      // Bottom-left subtle orb
      ctx.beginPath()
      ctx.arc(width * 0.15, height * 0.88, 150, 0, Math.PI * 2)
      const orb2Gradient = ctx.createRadialGradient(
        width * 0.15, height * 0.88, 0,
        width * 0.15, height * 0.88, 150
      )
      orb2Gradient.addColorStop(0, 'rgba(16, 185, 129, 0.12)')
      orb2Gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = orb2Gradient
      ctx.fill()

      ctx.textAlign = 'center'

      // Check if this is a simple band share (no card content)
      const isBandShareOnly = !card.headline && !card.hero

      // === ARTIST PHOTO ===
      const hasImage = !!bandImageUrl
      // Larger image for band-only shares
      const imageSize = isBandShareOnly ? 360 : 280
      const imageY = isBandShareOnly ? 200 : 160

      if (bandImageUrl) {
        try {
          const img = await loadImage(bandImageUrl)
          
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
            
            // Add subtle border around image
            ctx.beginPath()
            ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
            ctx.lineWidth = 3
            ctx.stroke()
          }
        } catch (imgErr) {
          console.warn('[useShareKit] Failed to load band image:', imgErr)
        }
      } else {
        // Placeholder circle with initials
        ctx.beginPath()
        ctx.arc(width / 2, imageY + imageSize / 2, imageSize / 2, 0, Math.PI * 2)
        const placeholderGradient = ctx.createLinearGradient(
          width / 2 - imageSize / 2, imageY,
          width / 2 + imageSize / 2, imageY + imageSize
        )
        placeholderGradient.addColorStop(0, accent.primary + '40')
        placeholderGradient.addColorStop(1, accent.primary + '20')
        ctx.fillStyle = placeholderGradient
        ctx.fill()

        // Draw initials
        const initials = bandName
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
        ctx.font = 'bold 80px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText(initials, width / 2, imageY + imageSize / 2 + 28)
      }

      // === BAND SHARE ONLY LAYOUT ===
      if (isBandShareOnly) {
        // Clean band-focused layout - no stats, just band presentation
        
        // Band name prominently below image
        if (!isBandNameInLogo) {
          const bandNameY = imageY + imageSize + 80
          ctx.font = 'bold 56px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = '#ffffff'
          
          let displayName = bandName
          while (ctx.measureText(displayName).width > width - 100 && displayName.length > 10) {
            displayName = displayName.slice(0, -4) + '...'
          }
          ctx.fillText(displayName, width / 2, bandNameY)
          
          // Accent underline below band name
          const underlineWidth = Math.min(ctx.measureText(displayName).width * 0.6, 200)
          ctx.beginPath()
          ctx.moveTo(width / 2 - underlineWidth / 2, bandNameY + 20)
          ctx.lineTo(width / 2 + underlineWidth / 2, bandNameY + 20)
          ctx.strokeStyle = accent.primary
          ctx.lineWidth = 3
          ctx.stroke()
        }
        
        // Tagline
        ctx.font = '32px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.fillText('Scan • Listen • Follow', width / 2, height - 120)

        // Branding
        ctx.font = '24px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillText('via Faneqo', width / 2, height - 70)
      } else {
        // === FULL CARD LAYOUT (with headline/hero/proof) ===
        
        // === HEADLINE ===
        const headlineY = hasImage ? imageY + imageSize + 60 : 280
        const headlineText = stripLeadingEmoji(card.headline) || card.headline
        const { lines: headlineLines, fontSize: headlineFontSize } = wrapText(
          ctx, headlineText, width - 120, 2, 42, 30
        )
        
        ctx.font = `bold ${headlineFontSize}px system-ui, -apple-system, sans-serif`
        ctx.fillStyle = '#ffffff'
        headlineLines.forEach((line, i) => {
          ctx.fillText(line, width / 2, headlineY + i * (headlineFontSize + 8))
        })

        // === HERO STAT ===
        const heroY = headlineY + headlineLines.length * (headlineFontSize + 8) + 80
        const { text: heroText, fontSize: heroFontSize } = fitHeroText(
          ctx, card.hero, width - 100, 120, 72
        )

        // Hero glow effect
        ctx.save()
        ctx.shadowColor = accent.glow
        ctx.shadowBlur = 40
        ctx.font = `900 ${heroFontSize}px system-ui, -apple-system, sans-serif`
        
        // MBQ gradient fill for hero
        const heroGradient = ctx.createLinearGradient(
          width / 2 - 200, heroY,
          width / 2 + 200, heroY
        )
        heroGradient.addColorStop(0, '#F472B6')    // Pink
        heroGradient.addColorStop(0.3, accent.primary)  // Accent color
        heroGradient.addColorStop(0.6, '#60A5FA')  // Blue
        heroGradient.addColorStop(1, '#34D399')    // Green
        ctx.fillStyle = heroGradient
        ctx.fillText(heroText, width / 2, heroY)
        ctx.restore()

        // Thin accent underline
        ctx.beginPath()
        ctx.moveTo(width / 2 - 80, heroY + 20)
        ctx.lineTo(width / 2 + 80, heroY + 20)
        ctx.strokeStyle = accent.primary + '60'
        ctx.lineWidth = 2
        ctx.stroke()

        // === PROOF LINE ===
        const proofY = heroY + 60
        ctx.font = '600 28px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.fillText(card.proof || '', width / 2, proofY)

        // === CAPTION (optional) ===
        const caption = card.microCaption?.[captionStyle] || card.microCaption?.hype
        if (caption) {
          const captionY = proofY + 55
          ctx.font = 'italic 30px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
          
          // Wrap caption to 2 lines max
          const { lines: captionLines } = wrapText(ctx, `"${caption}"`, width - 140, 2, 30, 24)
          ctx.font = `italic 28px system-ui, -apple-system, sans-serif`
          captionLines.forEach((line, i) => {
            ctx.fillText(line, width / 2, captionY + i * 36)
          })
        }

        // === BAND NAME ===
        if (!isBandNameInLogo) {
          const bandNameY = height - 160
          ctx.font = 'bold 40px system-ui, -apple-system, sans-serif'
          ctx.fillStyle = '#ffffff'
          
          // Truncate if too long
          let displayName = bandName
          while (ctx.measureText(displayName).width > width - 100 && displayName.length > 10) {
            displayName = displayName.slice(0, -4) + '...'
          }
          ctx.fillText(displayName, width / 2, bandNameY)
        }

        // === TAGLINE ===
        ctx.font = '28px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.fillText('Scan • Listen • Follow', width / 2, height - 100)

        // === BRANDING ===
        ctx.font = '22px system-ui, -apple-system, sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.fillText('via Faneqo', width / 2, height - 55)
      }

      // Convert to blob
      return new Promise((resolve) => {
        canvasEl.toBlob((blob) => {
          resolve(blob)
        }, 'image/png')
      })
    } catch (err) {
      console.error('[useShareKit] Failed to generate share card image:', err)
      return null
    }
  }

  // ============================================================
  // SHARE TRACKING (V1 Shareables)
  // ============================================================

  /**
   * Build share URL with attribution params
   * @param {Object} options
   * @param {string} options.bandSlug
   * @param {string} options.shareableId - Optional shareable card ID
   * @returns {string}
   */
  function buildShareUrlWithAttribution({ bandSlug, shareableId = null }) {
    if (typeof window === 'undefined') return ''
    const baseUrl = `${window.location.origin}/${bandSlug}`
    
    if (shareableId) {
      return `${baseUrl}?src=shareable&sid=${encodeURIComponent(shareableId)}`
    }
    return baseUrl
  }

  /**
   * Track a share action to the backend
   * @param {Object} payload
   * @returns {Promise<{ ok: boolean }>}
   */
  async function trackShareAction(payload) {
    const {
      bandId,
      shareableId,
      cardType,
      window: windowKey,
      accent,
      captionStyle,
      placement,
      action,
    } = payload

    if (!bandId) {
      console.warn('[useShareKit] trackShareAction: bandId required')
      return { ok: false }
    }

    try {
      const strapiUrl = runtimeConfig.public.strapiUrl
      const response = await fetch(`${strapiUrl}/api/pulse/shareables/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bandId,
          shareableId,
          cardType,
          window: windowKey,
          accent,
          captionStyle,
          placement,
          action,
        }),
      })

      const data = await response.json()
      return { ok: data.ok === true }
    } catch (err) {
      console.error('[useShareKit] Failed to track share:', err)
      return { ok: false }
    }
  }

  /**
   * Enhanced webShare with tracking
   */
  async function webShareWithTracking({
    title,
    text,
    url,
    imageBlob = null,
    filename = 'share.png',
    trackingPayload = null,
  }) {
    const result = await webShare({ title, text, url, imageBlob, filename })
    
    // Track if share was successful
    if (result.ok && trackingPayload) {
      await trackShareAction({
        ...trackingPayload,
        action: 'webShare',
      })
    }

    return result
  }

  /**
   * Copy link with tracking
   */
  async function copyLinkWithTracking(url, trackingPayload = null) {
    const success = await copyToClipboard(url)
    
    if (success && trackingPayload) {
      await trackShareAction({
        ...trackingPayload,
        action: 'copyLink',
      })
    }

    return success
  }

  /**
   * Download image with tracking
   */
  function downloadImageWithTracking(blob, filename, trackingPayload = null) {
    const success = downloadBlob(blob, filename)
    
    if (success && trackingPayload) {
      trackShareAction({
        ...trackingPayload,
        action: 'download',
      })
    }

    return success
  }

  /**
   * Open Facebook sharer with tracking
   */
  function openFacebookSharerWithTracking(shareUrl, trackingPayload = null) {
    openFacebookSharer(shareUrl)
    
    if (trackingPayload) {
      trackShareAction({
        ...trackingPayload,
        action: 'facebook',
      })
    }
  }

  // ============================================================
  // SHOW CHECK-IN BADGE HELPERS (V3)
  // ============================================================

  /**
   * Generate a show check-in badge image blob
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvasEl
   * @param {Object} options.attendanceData - Full attendance context
   * @returns {Promise<Blob|null>}
   */
  async function generateShowCheckInBadge({ canvasEl, attendanceData }) {
    if (!canvasEl || !attendanceData) return null

    return generateShowCheckInBadgeImage({
      canvasEl,
      bandName: attendanceData.bandName || '',
      bandImageUrl: attendanceData.bandImageUrl || null,
      showTitle: attendanceData.showTitle || '',
      venue: attendanceData.venue || '',
      city: attendanceData.city || '',
      checkedInAt: attendanceData.checkedInAt || null,
      confidenceScore: attendanceData.confidenceScore || 50,
      loadImage,
    })
  }

  /**
   * Share a check-in badge via Web Share API
   * @param {Object} options
   * @param {Blob} options.imageBlob - Badge image blob
   * @param {Object} options.attendanceData - Attendance context for caption
   * @param {string} options.bandSlug - For share URL
   * @param {string} options.captionStyle - 'hype' | 'grateful' | 'tease'
   * @returns {Promise<{ ok: boolean, usedFile: boolean }>}
   */
  async function webShareShowCheckInBadge({ imageBlob, attendanceData, bandSlug, captionStyle = 'hype' }) {
    const caption = getBadgeCaption(captionStyle, {
      bandName: attendanceData.bandName || '',
      city: attendanceData.city || '',
    })
    const shareUrl = buildShareUrl({ bandSlug })
    const text = buildFanShareText(caption, shareUrl)
    const filename = getShareFilename(bandSlug, 'i-was-there')

    return webShare({
      title: `I Was There — ${attendanceData.bandName || ''}`,
      text,
      url: shareUrl,
      imageBlob,
      filename,
    })
  }

  /**
   * Download a check-in badge image
   * @param {Blob} imageBlob
   * @param {string} bandSlug
   * @returns {boolean}
   */
  function downloadShowCheckInBadge(imageBlob, bandSlug) {
    const filename = getShareFilename(bandSlug, 'i-was-there')
    return downloadBlob(imageBlob, filename)
  }

  /**
   * Copy check-in share link to clipboard
   * @param {string} bandSlug
   * @returns {Promise<boolean>}
   */
  async function copyShowCheckInLink(bandSlug) {
    const shareUrl = buildShareUrl({ bandSlug })
    return copyToClipboard(shareUrl)
  }

  return {
    // Legacy functions
    buildShareUrl,
    buildShareUrlWithAttribution,
    buildCaption,
    buildShareText,
    generateShareImage,
    generateShareCardImage,
    
    // Core share functions
    webShare,
    webShareWithTracking,
    copyToClipboard,
    copyLinkWithTracking,
    downloadBlob,
    downloadImageWithTracking,
    openFacebookSharer,
    openFacebookSharerWithTracking,
    getShareFilename,
    trackShareAction,
    
    // Fan share system (V2)
    FAN_MOMENT_TYPES,
    getFanCaption,
    getAllCaptions,
    getFanHeadline,
    detectFanMomentType,
    buildFanShareText,
    generateFanShareImage,
    getAccentForMoment,
    
    // Show check-in badge (V3)
    generateShowCheckInBadge,
    webShareShowCheckInBadge,
    downloadShowCheckInBadge,
    copyShowCheckInLink,
    getBadgeCaption,
    getAllBadgeCaptions,
    getBadgeHeadline,
    getVerificationLabel,
    formatBadgeDate,
    generateShowCheckInBadgeImage,
    
    // Shared
    ACCENT_COLORS,
  }
}
