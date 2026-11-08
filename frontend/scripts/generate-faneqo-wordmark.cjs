/**
 * Faneqo wordmark generator ("fan echo").
 *
 * Text-first music-tech wordmark "Faneqo" (only the F is capitalised):
 *  - body gradient matches the homepage: white -> pink-400 -> fuchsia-400 -> purple-400
 *  - the lowercase "e" (index 3) is accented with the homepage cyan-300 -> emerald-300
 *  - three compact echo arcs are integrated into the final "o" (cyan -> emerald)
 *  - rendered in real Poppins ExtraBold
 *
 * Tailwind only uses `theme.extend`, so the default palette stands for these.
 *
 * Run:
 *   node scripts/generate-faneqo-wordmark.cjs            (preview: candidates)
 *   node scripts/generate-faneqo-wordmark.cjs --preview  (same as above)
 *   node scripts/generate-faneqo-wordmark.cjs --final    (production assets)
 */
const { createCanvas, registerFont } = require('canvas')
const fs = require('fs')
const path = require('path')

const publicDir = path.join(__dirname, '..', 'public')
const fontsDir = path.join(__dirname, 'fonts')

// ── Homepage colours (Tailwind defaults — config only uses `extend`) ───────
const COLORS = {
  white: '#ffffff',
  pink400: '#f472b6',
  fuchsia400: '#e879f9',
  purple400: '#c084fc',
  cyan300: '#67e8f9',
  emerald300: '#6ee7b7',
  darkBg: '#000000',
}

// ── Central shared design config (Canvas AND SVG derive from this) ─────────
const DESIGN = {
  text: 'Faneqo',
  accentIndex: 3, // lowercase "e"
  fontFamily: 'Poppins',
  fontWeight: 800,
  glyphRatio: 0.6, // font px relative to nominal height
  trackingRatio: -0.02, // tracking-tight
  padXRatio: 0.16,
  padYRatio: 0.18,
  colors: COLORS,
  // body gradient stops [offset, color]
  body: [
    [0.0, COLORS.white],
    [0.3, COLORS.pink400],
    [0.62, COLORS.fuchsia400],
    [1.0, COLORS.purple400],
  ],
  bodyFlat: [
    [0.0, COLORS.white],
    [0.45, COLORS.pink400],
    [1.0, COLORS.purple400],
  ],
  accent: { top: COLORS.cyan300, bottom: COLORS.emerald300 }, // lowercase "e" + echo
  echo: {
    count: 3,
    gapRatio: 0.05, // gap between o edge and first arc (x glyph)
    radiiMul: [1.0, 1.5, 2.0], // x base radius (o radius + gap)
    widthRatio: [0.05, 0.034, 0.022], // x glyph
    opacities: [0.9, 0.58, 0.32],
    sweep: [0.34, 0.3, 0.26], // x PI
  },
  glow: {
    // crisp production glow — must not blur letterforms
    primary: { textBlur: 0.015, textAlpha: 0.3, accentAlpha: 0.35, waveBlur: 0.02, waveAlpha: 0.35 },
    // softer-but-stronger promo glow (still far below the old 0.14)
    promo: { textBlur: 0.05, textAlpha: 0.45, accentAlpha: 0.55, waveBlur: 0.05, waveAlpha: 0.55 },
    none: { textBlur: 0, textAlpha: 0, accentAlpha: 0, waveBlur: 0, waveAlpha: 0 },
  },
}

// ── Colour helpers ─────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) }
}
function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b)
  const r = Math.round(A.r + (B.r - A.r) * t)
  const g = Math.round(A.g + (B.g - A.g) * t)
  const bl = Math.round(A.b + (B.b - A.b) * t)
  return `rgb(${r},${g},${bl})`
}
function rgba(hex, a) {
  const c = hexToRgb(hex)
  return `rgba(${c.r},${c.g},${c.b},${a})`
}
function fontStr(size, weight) {
  return `${weight} ${size}px "${DESIGN.fontFamily}", "Segoe UI", Arial, sans-serif`
}
const f = (n) => Math.round(n * 10) / 10

// ── Validation: fonts + output dir ─────────────────────────────────────────
const FONT_EB = path.join(fontsDir, 'Poppins-ExtraBold.ttf')
const FONT_B = path.join(fontsDir, 'Poppins-Bold.ttf')
function assertFont(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`[faneqo] Required font missing: ${p}\n` +
      'Place Poppins-ExtraBold.ttf and Poppins-Bold.ttf in scripts/fonts/.')
  }
}
assertFont(FONT_EB)
assertFont(FONT_B)
registerFont(FONT_EB, { family: 'Poppins', weight: '800' })
registerFont(FONT_B, { family: 'Poppins', weight: '700' })
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

// ── Shared geometry (single source of truth for Canvas + SVG) ──────────────
// Measures the wordmark at a given glyph size and resolves every layout value:
// glyph positions, baseline, the optical centre/radius of the final "o", the
// echo arc radii, and the final canvas bounds (accounting for echo + glow so
// nothing is clipped on transparent OR dark output).
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

  // glyph x-positions (advance widths + tracking)
  const positions = []
  let cx = padX
  for (let i = 0; i < chars.length; i++) {
    positions.push(cx)
    cx += widths[i] + tracking
  }

  // final "o" optical metrics
  const oi = chars.length - 1
  const oM = m.measureText('o')
  const oAscent = oM.actualBoundingBoxAscent || glyph * 0.52 // ~ x-height
  const oRadius = oAscent / 2
  const oCenterX = positions[oi] + widths[oi] / 2

  // echo arc geometry, derived from the o (so it stays integrated)
  const base = (oRadius + glyph * DESIGN.echo.gapRatio) * waveScale
  const radii = DESIGN.echo.radiiMul.map((mu) => base * mu)
  const maxR = radii[radii.length - 1]
  const maxSweep = Math.PI * Math.max(...DESIGN.echo.sweep)
  const maxWidth = glyph * Math.max(...DESIGN.echo.widthRatio)
  const evh = wantEcho ? maxR * Math.sin(maxSweep) + maxWidth / 2 : 0

  // vertical bounds: text vs echo (echo centred oRadius above the baseline)
  const topNeed = Math.max(ascent, oRadius + evh)
  const botNeed = Math.max(descent, evh - oRadius)
  const glowAllow = Math.ceil(glyph * glowMaxRatio * 2)
  const baselineY = padY + glowAllow / 2 + topNeed
  const H = Math.ceil(topNeed + botNeed + padY * 2 + glowAllow)
  const oCenterY = baselineY - oRadius

  // horizontal bounds: text vs echo
  const textRight = padX + textW
  const echoRight = wantEcho ? oCenterX + maxR + maxWidth / 2 : 0
  const W = Math.ceil(Math.max(textRight, echoRight) + padX + glowAllow)

  return { chars, tracking, widths, textW, ascent, descent, padX, padY, positions, baselineY, oRadius, oCenterX, oCenterY, base, radii, W, H }
}

// ── Canvas render ──────────────────────────────────────────────────────────
function renderWordmark(opts = {}) {
  const height = opts.height || 512
  const text = opts.text || DESIGN.text
  const accentIndex = opts.accentIndex == null ? DESIGN.accentIndex : opts.accentIndex
  const glow = DESIGN.glow[opts.glow || 'primary']
  const waveScale = opts.waveScale == null ? 1 : opts.waveScale
  const mono = opts.mono || null
  const onDark = !!opts.onDark
  const wantEcho = opts.drawEcho !== false

  const glyph = Math.round(height * DESIGN.glyphRatio)
  const glowMaxRatio = Math.max(glow.textBlur, glow.waveBlur)
  const G = computeGeometry(glyph, text, waveScale, wantEcho, glowMaxRatio)
  const { chars, widths, textW, padX, positions, baselineY, oRadius, oCenterX, oCenterY, radii, W, H } = G
  if (!(Number.isFinite(W) && Number.isFinite(H) && W > 0 && H > 0)) {
    throw new Error('[faneqo] invalid canvas dimensions')
  }

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext('2d')
  if (onDark) {
    ctx.fillStyle = COLORS.darkBg
    ctx.fillRect(0, 0, W, H)
  }

  ctx.font = fontStr(glyph, DESIGN.fontWeight)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // body gradient (white -> pink -> fuchsia -> purple) across the text
  const stops = opts.body === 'flat' ? DESIGN.bodyFlat : DESIGN.body
  const body = ctx.createLinearGradient(padX, 0, padX + textW, 0)
  for (const [o, c] of stops) body.addColorStop(o, c)

  // accent gradient (cyan -> emerald) over the x-height band of the "e"
  const accent = ctx.createLinearGradient(0, baselineY - oRadius * 2, 0, baselineY)
  accent.addColorStop(0, DESIGN.accent.top)
  accent.addColorStop(1, DESIGN.accent.bottom)

  // one controlled glow pass per glyph (no glowing duplicate beneath)
  chars.forEach((ch, i) => {
    const isAccent = i === accentIndex
    ctx.save()
    if (!mono && glow.textBlur > 0) {
      ctx.shadowColor = rgba(isAccent ? DESIGN.accent.bottom : COLORS.purple400, isAccent ? glow.accentAlpha : glow.textAlpha)
      ctx.shadowBlur = glyph * glow.textBlur
    }
    ctx.fillStyle = mono ? mono : isAccent ? accent : body
    ctx.fillText(ch, positions[i], baselineY)
    ctx.restore()
  })

  // three compact echo arcs, concentric with the final "o"
  if (wantEcho) {
    ctx.save()
    ctx.lineCap = 'round'
    if (!mono && glow.waveBlur > 0) {
      ctx.shadowColor = rgba(DESIGN.accent.top, glow.waveAlpha)
      ctx.shadowBlur = glyph * glow.waveBlur
    }
    for (let i = 0; i < DESIGN.echo.count; i++) {
      const r = radii[i]
      const sweep = Math.PI * DESIGN.echo.sweep[i]
      const t = DESIGN.echo.count > 1 ? i / (DESIGN.echo.count - 1) : 0
      ctx.beginPath()
      ctx.arc(oCenterX, oCenterY, r, -sweep, sweep)
      ctx.lineWidth = glyph * DESIGN.echo.widthRatio[i]
      ctx.strokeStyle = mono ? mono : mix(DESIGN.accent.top, DESIGN.accent.bottom, t)
      ctx.globalAlpha = DESIGN.echo.opacities[i]
      ctx.stroke()
    }
    ctx.restore()
  }

  return canvas
}

function writePng(canvas, file) {
  try {
    fs.writeFileSync(path.join(publicDir, file), canvas.toBuffer('image/png'))
  } catch (err) {
    throw new Error(`[faneqo] failed to write ${file}: ${err.message}`)
  }
  console.log('  ✅', file, `${canvas.width}x${canvas.height}`)
}

// ── Vector SVG master — geometry derived from the SAME computeGeometry() ───
// Glyph outlines are kept as live <text> (no extra dependency); arc paths and
// gradient extents are computed, not hard-coded, so it matches the PNG.
function buildSvg(glyph = 240) {
  const G = computeGeometry(glyph, DESIGN.text, 1, true, 0)
  const { chars, tracking, textW, padX, positions, baselineY, oRadius, oCenterX, oCenterY, radii, W, H } = G

  const ai = DESIGN.accentIndex
  const before = chars.slice(0, ai).join('')
  const accentChar = chars[ai]
  const after = chars.slice(ai + 1).join('')

  const bodyStops = DESIGN.body.map(([o, c]) => `      <stop offset="${Math.round(o * 100)}%" stop-color="${c}"/>`).join('\n')

  let arcPaths = ''
  for (let i = 0; i < DESIGN.echo.count; i++) {
    const r = radii[i]
    const sweep = Math.PI * DESIGN.echo.sweep[i]
    const sx = oCenterX + r * Math.cos(-sweep)
    const sy = oCenterY + r * Math.sin(-sweep)
    const ex = oCenterX + r * Math.cos(sweep)
    const ey = oCenterY + r * Math.sin(sweep)
    const w = glyph * DESIGN.echo.widthRatio[i]
    const op = DESIGN.echo.opacities[i]
    const t = DESIGN.echo.count > 1 ? i / (DESIGN.echo.count - 1) : 0
    const col = mix(DESIGN.accent.top, DESIGN.accent.bottom, t)
    arcPaths += `    <path d="M ${f(sx)} ${f(sy)} A ${f(r)} ${f(r)} 0 0 1 ${f(ex)} ${f(ey)}" stroke="${col}" stroke-width="${f(w)}" opacity="${op}"/>\n`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Faneqo">
  <defs>
    <linearGradient id="fqBody" gradientUnits="userSpaceOnUse" x1="${f(padX)}" y1="0" x2="${f(padX + textW)}" y2="0">
${bodyStops}
    </linearGradient>
    <linearGradient id="fqAccent" gradientUnits="userSpaceOnUse" x1="0" y1="${f(baselineY - oRadius * 2)}" x2="0" y2="${f(baselineY)}">
      <stop offset="0%" stop-color="${DESIGN.accent.top}"/>
      <stop offset="100%" stop-color="${DESIGN.accent.bottom}"/>
    </linearGradient>
  </defs>
  <text x="${f(padX)}" y="${f(baselineY)}"
    font-family="Poppins, 'Segoe UI', Arial, sans-serif" font-weight="${DESIGN.fontWeight}"
    font-size="${glyph}" letter-spacing="${tracking}">
    <tspan fill="url(#fqBody)">${before}</tspan><tspan fill="url(#fqAccent)">${accentChar}</tspan><tspan fill="url(#fqBody)">${after}</tspan>
  </text>
  <g fill="none" stroke-linecap="round">
${arcPaths}  </g>
</svg>
`
}

function writeSvg(file, glyph) {
  const svg = buildSvg(glyph)
  try {
    fs.writeFileSync(path.join(publicDir, file), svg)
  } catch (err) {
    throw new Error(`[faneqo] failed to write ${file}: ${err.message}`)
  }
  console.log('  ✅', file, '(vector)')
}

// ── Dark contact sheet: each candidate at full / header / 160px / 80px ─────
function buildContactSheet(items) {
  const pad = 48
  const fullW = 460
  const rowH = 300
  const W = 1240
  const H = pad * 2 + items.length * rowH
  const c = createCanvas(W, H)
  const x = c.getContext('2d')
  x.fillStyle = '#0a0a0a'
  x.fillRect(0, 0, W, H)

  const byW = (img, w) => [w, (w * img.height) / img.width]
  const byH = (img, h) => [(h * img.width) / img.height, h]

  items.forEach((it, idx) => {
    const top = pad + idx * rowH
    x.fillStyle = '#ffffff'
    x.font = 'bold 24px "Segoe UI", Arial'
    x.textBaseline = 'top'
    x.fillText(it.label, pad, top)

    const img = it.canvas
    const fy = top + 44
    const [fw, fh] = byW(img, fullW)
    x.drawImage(img, pad, fy, fw, fh)

    // small-size column
    let sx = pad + fullW + 90
    let sy = fy
    x.fillStyle = '#8a8a8a'
    x.font = '13px "Segoe UI", Arial'

    const sizes = [
      { label: 'header (32px tall)', dims: byH(img, 32) },
      { label: '160px wide', dims: byW(img, 160) },
      { label: '80px wide', dims: byW(img, 80) },
    ]
    for (const s of sizes) {
      x.fillStyle = '#8a8a8a'
      x.fillText(s.label, sx, sy)
      x.drawImage(img, sx, sy + 20, s.dims[0], s.dims[1])
      sy += 20 + s.dims[1] + 26
    }
  })
  return c
}

// ── Candidate style presets ────────────────────────────────────────────────
const CANDIDATES = {
  a: { label: 'Candidate A — Recommended', glow: 'primary', body: 'full', waveScale: 1.0 },
  b: { label: 'Candidate B — Minimal', glow: 'none', body: 'flat', waveScale: 0.8 },
  c: { label: 'Candidate C — Brighter promo', glow: 'promo', body: 'full', waveScale: 1.0 },
}

function runPreview() {
  console.log('🎨 Faneqo wordmark — PREVIEW (production files untouched)\n')

  // Individual candidate files (on dark for easy viewing)
  const dims = {}
  for (const key of ['a', 'b', 'c']) {
    const s = CANDIDATES[key]
    const cv = renderWordmark({ height: 512, onDark: true, glow: s.glow, body: s.body, waveScale: s.waveScale })
    dims[key] = `${cv.width}x${cv.height}`
    writePng(cv, `faneqo-wordmark-candidate-${key}.png`)
  }

  // Contact sheet (transparent renders composited on dark)
  const sheetItems = ['a', 'b', 'c'].map((key) => {
    const s = CANDIDATES[key]
    return { label: s.label, canvas: renderWordmark({ height: 512, onDark: false, glow: s.glow, body: s.body, waveScale: s.waveScale }) }
  })
  writePng(buildContactSheet(sheetItems), 'faneqo-wordmark-contact-sheet.png')

  // Monochrome previews (transparent)
  writePng(renderWordmark({ height: 512, mono: '#ffffff' }), 'faneqo-wordmark-mono-white.png')
  writePng(renderWordmark({ height: 512, mono: '#000000' }), 'faneqo-wordmark-mono-black.png')

  // Compact logo-mark candidate (lowercase e + o + echo) — NOT used for icons
  writePng(renderWordmark({ height: 512, onDark: true, text: 'eo', accentIndex: 0, glow: 'primary' }), 'faneqo-mark-candidate.png')

  console.log('\nCandidate dimensions:')
  console.log(`  A ${dims.a}   B ${dims.b}   C ${dims.c}`)
  console.log('\n🚀 Preview done. Review faneqo-wordmark-contact-sheet.png and approve Candidate A.')
  console.log('   Then run: node scripts/generate-faneqo-wordmark.cjs --final')
}

function runFinal() {
  console.log('🎨 Faneqo wordmark — FINAL (Candidate A → production)\n')
  // Candidate A = primary (transparent) for nav/light contexts
  writePng(renderWordmark({ height: 512, onDark: false, glow: 'primary', body: 'full', waveScale: 1.0 }), 'faneqo-wordmark.png')
  // Promo on-dark for hero/social
  writePng(renderWordmark({ height: 512, onDark: true, glow: 'promo', body: 'full', waveScale: 1.0 }), 'faneqo-wordmark-on-dark.png')
  // Vector master
  writeSvg('faneqo-wordmark.svg')
  console.log('\n🚀 Final assets written to /public')
}

// ── Entry point ────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
try {
  if (args.includes('--final')) runFinal()
  else runPreview()
} catch (err) {
  console.error('\n' + err.message + '\n')
  process.exit(1)
}
