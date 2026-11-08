/**
 * Faneqo lockup generator — official brand package (external / press only).
 *
 * Official master = clean / crisp (not heavy glow).
 * Tagline: “Your Band’s Headquarters.”
 *
 * Color hierarchy:
 *   F  → pale pink / soft white (+ tiny mint kiss only)
 *   an → pink
 *   e  → distinctive mint / green (strongest green in the wordmark)
 *   qo → purple
 *   echo arcs → teal / cyan
 *
 * Run:
 *   node scripts/generate-faneqo-lockup.cjs
 *
 * Writes to public/brand-preview/:
 *   faneqo-logo-headquarters-master.svg
 *   faneqo-logo-headquarters-transparent.png
 *   faneqo-logo-headquarters-dark.png
 *   faneqo-logo-headquarters-light.png
 *   faneqo-logo-headquarters-glow.png
 *
 * Does NOT touch production wordmark assets or site UI.
 */
const { createCanvas, registerFont } = require('canvas')
const fs = require('fs')
const path = require('path')

const outDir = path.join(__dirname, '..', 'public', 'brand-preview')
const fontsDir = path.join(__dirname, 'fonts')
const TAGLINE = 'Your Band’s Headquarters.'

const COLORS = {
  white: '#ffffff',
  softPink: '#fce7f3',
  pink400: '#f472b6',
  fuchsia400: '#e879f9',
  purple400: '#c084fc',
  cyan300: '#67e8f9',
  teal300: '#5eead4',
  emerald300: '#6ee7b7',
  mintSoft: '#d1fae5',
  darkBg: '#000000',
  lightBg: '#ffffff',
  // Tagline surfaces
  taglineOnDark: 'rgba(255,255,255,0.88)',
  taglineOnLight: 'rgba(30,30,36,0.72)',
  taglineTransparent: 'rgba(255,255,255,0.90)',
  taglineShadow: 'rgba(0,0,0,0.35)',
}

/**
 * Official clean lockup geometry.
 * Echo sits slightly farther than the original production wordmark (gap 0.05),
 * but tighter/smaller than the oversized promo glow pass.
 */
const DESIGN = {
  text: 'Faneqo',
  accentIndex: 3, // lowercase “e”
  fontFamily: 'Poppins',
  fontWeight: 800,
  glyphRatio: 0.6,
  trackingRatio: -0.02,
  padXRatio: 0.16,
  padYRatio: 0.12,
  // Body: pale pink/white F → pink an → (e is separate accent) → purple qo
  // No green on F — “e” owns the mint entirely.
  body: [
    [0.0, COLORS.white],
    [0.08, COLORS.softPink],
    [0.22, COLORS.pink400],
    [0.52, COLORS.fuchsia400],
    [1.0, COLORS.purple400],
  ],
  // Light-bg: keep pale F readable (no pure white that vanishes on white)
  bodyLight: [
    [0.0, COLORS.softPink],
    [0.10, '#fbcfe8'],
    [0.24, COLORS.pink400],
    [0.52, COLORS.fuchsia400],
    [1.0, COLORS.purple400],
  ],
  // “e” — strongest green element in the wordmark
  accent: { top: COLORS.emerald300, bottom: '#34d399' },
  // Echo arcs — teal / cyan only (do not steal the green “e”)
  echoColors: { inner: COLORS.cyan300, outer: COLORS.teal300 },
  echo: {
    count: 3,
    // Middle ground: more air than original clean, less than oversized promo
    gapRatio: 0.175,
    centerOffsetRatio: 0.095,
    // Compact — extension of “o”, not a separate icon
    radiiMul: [1.0, 1.30, 1.60],
    widthRatio: [0.036, 0.023, 0.015],
    opacities: [0.90, 0.52, 0.25],
    sweep: [0.29, 0.255, 0.22],
  },
  glow: {
    none: { textBlur: 0, textAlpha: 0, accentAlpha: 0, waveBlur: 0, waveAlpha: 0 },
    // Official master: tiny softness only, crisp edges
    master: { textBlur: 0.006, textAlpha: 0.12, accentAlpha: 0.16, waveBlur: 0.008, waveAlpha: 0.14 },
    // Secondary promo only
    promo: { textBlur: 0.036, textAlpha: 0.38, accentAlpha: 0.46, waveBlur: 0.034, waveAlpha: 0.42 },
  },
  tagline: {
    sizeRatio: 0.225,
    weight: 700,
    // Near-kiss under the “q” tip — optical lockup tightness
    gapRatio: 0.008,
    letterSpacingEm: 0.025,
    bottomPadRatio: 0.08,
  },
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  return `rgb(${Math.round(A.r + (B.r - A.r) * t)},${Math.round(A.g + (B.g - A.g) * t)},${Math.round(A.b + (B.b - A.b) * t)})`
}
function rgba(hex, a) {
  const c = hexToRgb(hex)
  return `rgba(${c.r},${c.g},${c.b},${a})`
}
function fontStr(size, weight) {
  return `${weight} ${size}px "${DESIGN.fontFamily}", "Segoe UI", Arial, sans-serif`
}
const f = (n) => Math.round(n * 10) / 10

const FONT_EB = path.join(fontsDir, 'Poppins-ExtraBold.ttf')
const FONT_B = path.join(fontsDir, 'Poppins-Bold.ttf')
for (const p of [FONT_EB, FONT_B]) {
  if (!fs.existsSync(p)) throw new Error(`[faneqo-lockup] Required font missing: ${p}`)
}
registerFont(FONT_EB, { family: 'Poppins', weight: '800' })
registerFont(FONT_B, { family: 'Poppins', weight: '700' })
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function computeGeometry(glyph, text, waveScale, wantEcho, glowMaxRatio) {
  const m = createCanvas(8, 8).getContext('2d')
  m.font = fontStr(glyph, DESIGN.fontWeight)
  m.textBaseline = 'alphabetic'

  const chars = text.split('')
  const tracking = Math.round(glyph * DESIGN.trackingRatio)
  const widths = chars.map((c) => m.measureText(c).width)
  const textW = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1)

  const full = m.measureText(text)
  const ascent = full.actualBoundingBoxAscent || glyph * 0.72
  const descent = full.actualBoundingBoxDescent || glyph * 0.21
  const padX = Math.round(glyph * DESIGN.padXRatio)
  const padY = Math.round(glyph * DESIGN.padYRatio)

  const positions = []
  let cx = padX
  for (let i = 0; i < chars.length; i++) {
    positions.push(cx)
    cx += widths[i] + tracking
  }

  const oi = chars.length - 1
  const oM = m.measureText('o')
  const oAscent = oM.actualBoundingBoxAscent || glyph * 0.52
  const oRadius = oAscent / 2
  const oCenterX = positions[oi] + widths[oi] / 2
  const echoCenterX = oCenterX + glyph * DESIGN.echo.centerOffsetRatio

  const base = (oRadius + glyph * DESIGN.echo.gapRatio) * waveScale
  const radii = DESIGN.echo.radiiMul.map((mu) => base * mu)
  const maxR = radii[radii.length - 1]
  const maxSweep = Math.PI * Math.max(...DESIGN.echo.sweep)
  const maxWidth = glyph * Math.max(...DESIGN.echo.widthRatio)
  const evh = wantEcho ? maxR * Math.sin(maxSweep) + maxWidth / 2 : 0

  const topNeed = Math.max(ascent, oRadius + evh)
  const botNeed = Math.max(descent, evh - oRadius)
  const glowAllow = Math.ceil(glyph * glowMaxRatio * 2.2)
  const baselineY = padY + glowAllow / 2 + topNeed
  const H = Math.ceil(topNeed + botNeed + padY * 2 + glowAllow)
  const oCenterY = baselineY - oRadius

  const textRight = padX + textW
  const echoRight = wantEcho ? echoCenterX + maxR + maxWidth / 2 : 0
  const W = Math.ceil(Math.max(textRight, echoRight) + padX + glowAllow)

  return {
    chars, tracking, widths, textW, padX, padY, positions,
    baselineY, oRadius, oCenterX, echoCenterX, oCenterY, radii, W, H, ascent, descent,
  }
}

function renderWordmark(opts = {}) {
  const height = opts.height || 512
  const glow = DESIGN.glow[opts.glow || 'master']
  const surface = opts.surface || 'transparent' // transparent | dark | light
  const glyph = Math.round(height * DESIGN.glyphRatio)
  const glowMaxRatio = Math.max(glow.textBlur, glow.waveBlur, 0.008)
  const G = computeGeometry(glyph, DESIGN.text, 1, true, glowMaxRatio)
  const {
    chars, textW, padX, positions, baselineY, oRadius,
    echoCenterX, oCenterY, radii, W, H,
  } = G

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  if (surface === 'dark') {
    ctx.fillStyle = COLORS.darkBg
    ctx.fillRect(0, 0, W, H)
  } else if (surface === 'light') {
    ctx.fillStyle = COLORS.lightBg
    ctx.fillRect(0, 0, W, H)
  }

  ctx.font = fontStr(glyph, DESIGN.fontWeight)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const bodyStops = surface === 'light' ? DESIGN.bodyLight : DESIGN.body
  const body = ctx.createLinearGradient(padX, 0, padX + textW, 0)
  for (const [o, c] of bodyStops) body.addColorStop(o, c)

  const accent = ctx.createLinearGradient(0, baselineY - oRadius * 2, 0, baselineY)
  accent.addColorStop(0, DESIGN.accent.top)
  accent.addColorStop(1, DESIGN.accent.bottom)

  chars.forEach((ch, i) => {
    const isAccent = i === DESIGN.accentIndex
    ctx.save()
    if (glow.textBlur > 0) {
      ctx.shadowColor = rgba(
        isAccent ? DESIGN.accent.top : COLORS.purple400,
        isAccent ? glow.accentAlpha : glow.textAlpha
      )
      ctx.shadowBlur = glyph * glow.textBlur
    }
    ctx.fillStyle = isAccent ? accent : body
    ctx.fillText(ch, positions[i], baselineY)
    ctx.restore()
  })

  ctx.save()
  ctx.lineCap = 'round'
  if (glow.waveBlur > 0) {
    ctx.shadowColor = rgba(DESIGN.echoColors.inner, glow.waveAlpha)
    ctx.shadowBlur = glyph * glow.waveBlur
  }
  for (let i = 0; i < DESIGN.echo.count; i++) {
    const r = radii[i]
    const sweep = Math.PI * DESIGN.echo.sweep[i]
    const t = i / (DESIGN.echo.count - 1)
    ctx.beginPath()
    ctx.arc(echoCenterX, oCenterY, r, -sweep, sweep)
    ctx.lineWidth = glyph * DESIGN.echo.widthRatio[i]
    ctx.strokeStyle = mix(DESIGN.echoColors.inner, DESIGN.echoColors.outer, t)
    ctx.globalAlpha = DESIGN.echo.opacities[i]
    ctx.stroke()
  }
  ctx.restore()
  ctx.globalAlpha = 1

  return { canvas, glyph, G }
}

/**
 * First/last rows of real letter/arc ink on a transparent canvas.
 * Uses alpha only (ignores faint glow bloom) so the tagline gap stays tight.
 */
function findInkBoundsAlpha(canvas, alphaThreshold = 48) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  const { data } = ctx.getImageData(0, 0, width, height)
  const x0 = Math.floor(width * 0.03)
  const x1 = Math.ceil(width * 0.97)
  const rowSolid = (y) => {
    let solid = 0
    for (let x = x0; x < x1; x++) {
      if (data[(y * width + x) * 4 + 3] >= alphaThreshold) {
        solid++
        if (solid >= 3) return true
      }
    }
    return false
  }
  let top = 0
  let bottom = height - 1
  for (let y = 0; y < height; y++) {
    if (rowSolid(y)) { top = y; break }
  }
  for (let y = height - 1; y >= 0; y--) {
    if (rowSolid(y)) { bottom = y; break }
  }
  return { top, bottom }
}

function taglineColor(surface) {
  if (surface === 'light') return COLORS.taglineOnLight
  if (surface === 'dark') return COLORS.taglineOnDark
  return COLORS.taglineTransparent
}

function renderLockup(opts = {}) {
  const surface = opts.surface || 'transparent'
  const { canvas: wm, glyph, G } = renderWordmark(opts)

  // Measure crop from a transparent twin so bg/glow never inflate the gap
  const measureWm = renderWordmark({
    height: opts.height,
    surface: 'transparent',
    glow: opts.glow || 'master',
  }).canvas

  const tagSize = Math.round(glyph * DESIGN.tagline.sizeRatio)
  const gap = Math.round(glyph * DESIGN.tagline.gapRatio)
  const bottomPad = Math.round(glyph * DESIGN.tagline.bottomPadRatio)
  const letterSpacing = tagSize * DESIGN.tagline.letterSpacingEm

  const measure = createCanvas(8, 8).getContext('2d')
  measure.font = fontStr(tagSize, DESIGN.tagline.weight)
  const baseW = measure.measureText(TAGLINE).width
  const tagW = baseW + letterSpacing * (TAGLINE.length - 1)
  const tagAscent = measure.measureText(TAGLINE).actualBoundingBoxAscent || tagSize * 0.75
  const tagDescent = measure.measureText(TAGLINE).actualBoundingBoxDescent || tagSize * 0.25

  // Crop top to ink; place tagline under the LETTERING (not echo-arc tips —
  // arc endpoints sit below the x-height and were creating a fake huge gap).
  const bounds = findInkBoundsAlpha(measureWm, 52)
  const padTop = Math.round(glyph * 0.04)
  const srcY = Math.max(0, bounds.top - padTop)
  const letterBottom = Math.ceil(G.baselineY + (G.descent || glyph * 0.21))
  // Keep full wordmark (including arcs) in the drawn region…
  const srcBottom = Math.min(wm.height, Math.max(bounds.bottom, letterBottom) + Math.round(glyph * 0.01))
  const srcH = srcBottom - srcY
  // …but anchor the tagline to the lettering/descender, not the lowest arc tip.
  const tagAnchor = Math.max(0, letterBottom - srcY) + Math.round(glyph * 0.01)

  const W = Math.max(wm.width, Math.ceil(tagW + G.padX * 2))
  const tagY = tagAnchor + gap + tagAscent
  // Ensure canvas tall enough for both arcs (srcH) and tagline
  const H = Math.ceil(Math.max(srcH, tagY + tagDescent) + bottomPad)

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  if (surface === 'dark') {
    ctx.fillStyle = COLORS.darkBg
    ctx.fillRect(0, 0, W, H)
  } else if (surface === 'light') {
    ctx.fillStyle = COLORS.lightBg
    ctx.fillRect(0, 0, W, H)
  }

  const wmX = Math.round((W - wm.width) / 2)
  ctx.drawImage(wm, 0, srcY, wm.width, srcH, wmX, 0, wm.width, srcH)

  const tagX = (W - tagW) / 2
  ctx.font = fontStr(tagSize, DESIGN.tagline.weight)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1

  const drawTagline = (fill, ox = 0, oy = 0) => {
    let x = tagX + ox
    ctx.fillStyle = fill
    for (const ch of TAGLINE) {
      ctx.fillText(ch, x, tagY + oy)
      x += measure.measureText(ch).width + letterSpacing
    }
  }

  // Soft shadow only on transparent (helps light IDE previews / overlays)
  if (surface === 'transparent') {
    drawTagline(COLORS.taglineShadow, 0, 1)
  }
  drawTagline(taglineColor(surface))

  return { canvas, glyph, W, H, tagSize, tagY, G, contentBottom: srcH }
}

function writePng(canvas, file) {
  const dest = path.join(outDir, file)
  fs.writeFileSync(dest, canvas.toBuffer('image/png'))
  console.log('  ✅', path.relative(path.join(__dirname, '..'), dest), `${canvas.width}x${canvas.height}`)
}

function ensureMinWidth(canvas, minWidth = 2400) {
  if (canvas.width >= minWidth) return canvas
  const scale = minWidth / canvas.width
  const W = Math.round(canvas.width * scale)
  const H = Math.round(canvas.height * scale)
  const out = createCanvas(W, H)
  const ctx = out.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(canvas, 0, 0, W, H)
  return out
}

function buildSvg({ surface = 'transparent' } = {}) {
  const glyph = 240
  const glow = DESIGN.glow.master
  const glowMaxRatio = Math.max(glow.textBlur, glow.waveBlur, 0)
  const G = computeGeometry(glyph, DESIGN.text, 1, true, glowMaxRatio)
  const {
    chars, tracking, textW, padX, baselineY, oRadius,
    echoCenterX, oCenterY, radii, W: wmW,
  } = G

  const ai = DESIGN.accentIndex
  const before = chars.slice(0, ai).join('')
  const accentChar = chars[ai]
  const after = chars.slice(ai + 1).join('')
  const bodyStopsSrc = surface === 'light' ? DESIGN.bodyLight : DESIGN.body
  const bodyStops = bodyStopsSrc.map(([o, c]) => `      <stop offset="${Math.round(o * 100)}%" stop-color="${c}"/>`).join('\n')

  let arcPaths = ''
  for (let i = 0; i < DESIGN.echo.count; i++) {
    const r = radii[i]
    const sweep = Math.PI * DESIGN.echo.sweep[i]
    const sx = echoCenterX + r * Math.cos(-sweep)
    const sy = oCenterY + r * Math.sin(-sweep)
    const ex = echoCenterX + r * Math.cos(sweep)
    const ey = oCenterY + r * Math.sin(sweep)
    const w = glyph * DESIGN.echo.widthRatio[i]
    const op = DESIGN.echo.opacities[i]
    const t = i / (DESIGN.echo.count - 1)
    const col = mix(DESIGN.echoColors.inner, DESIGN.echoColors.outer, t)
    arcPaths += `    <path d="M ${f(sx)} ${f(sy)} A ${f(r)} ${f(r)} 0 0 1 ${f(ex)} ${f(ey)}" stroke="${col}" stroke-width="${f(w)}" opacity="${op}"/>\n`
  }

  const tagSize = Math.round(glyph * DESIGN.tagline.sizeRatio)
  const gap = Math.round(glyph * DESIGN.tagline.gapRatio)
  const bottomPad = Math.round(glyph * DESIGN.tagline.bottomPadRatio)
  const letterSpacing = f(tagSize * DESIGN.tagline.letterSpacingEm)
  const approxTagW = TAGLINE.length * tagSize * 0.52 + (TAGLINE.length - 1) * tagSize * DESIGN.tagline.letterSpacingEm
  const W = Math.max(wmW, Math.ceil(approxTagW + padX * 2))
  const inkTop = Math.max(0, Math.ceil(baselineY - (G.ascent || glyph * 0.72) - glyph * 0.04))
  const contentBottom = Math.ceil(baselineY + (G.descent || glyph * 0.21) + glyph * 0.008)
  const srcH = contentBottom - inkTop
  const tagY = srcH + gap + tagSize * 0.78
  const H = Math.ceil(tagY + tagSize * 0.35 + bottomPad)
  const offsetX = Math.round((W - wmW) / 2)
  const tagFill = taglineColor(surface === 'light' ? 'light' : 'transparent')

  const bg =
    surface === 'dark' ? `  <rect width="100%" height="100%" fill="${COLORS.darkBg}"/>\n` :
    surface === 'light' ? `  <rect width="100%" height="100%" fill="${COLORS.lightBg}"/>\n` : ''

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Faneqo — Your Band's Headquarters.">
  <defs>
    <linearGradient id="fqBody" gradientUnits="userSpaceOnUse" x1="${f(padX + offsetX)}" y1="${f(-inkTop)}" x2="${f(padX + textW + offsetX)}" y2="${f(-inkTop)}">
${bodyStops}
    </linearGradient>
    <linearGradient id="fqAccent" gradientUnits="userSpaceOnUse" x1="0" y1="${f(baselineY - oRadius * 2 - inkTop)}" x2="0" y2="${f(baselineY - inkTop)}">
      <stop offset="0%" stop-color="${DESIGN.accent.top}"/>
      <stop offset="100%" stop-color="${DESIGN.accent.bottom}"/>
    </linearGradient>
  </defs>
${bg}  <g transform="translate(${offsetX}, ${-inkTop})">
    <text x="${f(padX)}" y="${f(baselineY)}"
      font-family="Poppins, 'Segoe UI', Arial, sans-serif" font-weight="${DESIGN.fontWeight}"
      font-size="${glyph}" letter-spacing="${tracking}">
      <tspan fill="url(#fqBody)">${before}</tspan><tspan fill="url(#fqAccent)">${accentChar}</tspan><tspan fill="url(#fqBody)">${after}</tspan>
    </text>
    <g fill="none" stroke-linecap="round">
${arcPaths}    </g>
  </g>
  <text x="${W / 2}" y="${f(tagY)}" text-anchor="middle"
    font-family="Poppins, 'Segoe UI', Arial, sans-serif" font-weight="${DESIGN.tagline.weight}"
    font-size="${tagSize}" letter-spacing="${letterSpacing}"
    fill="${tagFill}">${TAGLINE}</text>
</svg>
`
}

function writeSvg(file, surface) {
  const dest = path.join(outDir, file)
  fs.writeFileSync(dest, buildSvg({ surface }))
  console.log('  ✅', path.relative(path.join(__dirname, '..'), dest), '(vector)')
}

console.log('🎨 Faneqo official lockup package — clean master + surfaces\n')

const MASTER_H = 960
const MIN_W = 2400

// 1) Transparent master (official)
const master = renderLockup({ height: MASTER_H, surface: 'transparent', glow: 'master' })
writePng(ensureMinWidth(master.canvas, MIN_W), 'faneqo-logo-headquarters-transparent.png')
writeSvg('faneqo-logo-headquarters-master.svg', 'transparent')

// 2) Dark background
const dark = renderLockup({ height: MASTER_H, surface: 'dark', glow: 'master' })
writePng(ensureMinWidth(dark.canvas, MIN_W), 'faneqo-logo-headquarters-dark.png')

// 3) Light background
const light = renderLockup({ height: MASTER_H, surface: 'light', glow: 'master' })
writePng(ensureMinWidth(light.canvas, MIN_W), 'faneqo-logo-headquarters-light.png')

// 4) Optional glow / promotional (secondary)
const glow = renderLockup({ height: MASTER_H, surface: 'dark', glow: 'promo' })
writePng(ensureMinWidth(glow.canvas, MIN_W), 'faneqo-logo-headquarters-glow.png')

console.log('\n🚀 Official package written to public/brand-preview/')
console.log('   Master: faneqo-logo-headquarters-master.svg + *-transparent.png')
console.log('   Production wordmark / site UI untouched.')
