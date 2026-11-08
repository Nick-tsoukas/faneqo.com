/**
 * Faneqo Social Avatar Generator
 *
 * Generates elite social avatars with full-bleed square dark background,
 * circular safe zone for the essential mark, and no baked-in circular crop.
 *
 * Features:
 * - Full-bleed square dark background (#0a0a0f)
 * - Essential mark within circular safe zone (80% diameter)
 * - Progressive echo arc reduction by resolution
 * - Pink/fuchsia/purple gradient on q bowl
 * - Cyan/emerald echo waves
 * - Increased composition size (larger mark within safe zone)
 * - Centered and refined tail
 *
 * Usage:
 *   node scripts/generate-faneqo-social-avatar.cjs --preview
 *   node scripts/generate-faneqo-social-avatar.cjs --final
 */
const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')
const { BRAND, mix, rgba } = require('./lib/faneqo-brand.cjs')
const C = BRAND.colors

const publicDir = path.join(__dirname, '..', 'public')
const previewDir = path.join(publicDir, 'brand-preview')
const socialDir = path.join(publicDir, 'social-avatars')

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

// ── Size-aware detail for social avatars ─────────────────────────────────────
function socialDetailFor(size) {
  // Social avatar sizes: 512, 256, 128, 64, 32
  if (size >= 512) return { arcs: 3, glow: 1.0, simplify: false, tiny: false }
  if (size >= 256) return { arcs: 3, glow: 0.85, simplify: false, tiny: false }
  if (size >= 128) return { arcs: 2, glow: 0.6, simplify: false, tiny: false }
  if (size >= 64) return { arcs: 2, glow: 0.3, simplify: true, tiny: false }
  return { arcs: 1, glow: 0.0, simplify: true, tiny: true }
}

// ── Full-bleed dark background for social avatars ───────────────────────────
function paintSocialBackground(ctx, size, glow = 1) {
  ctx.fillStyle = C.background
  ctx.fillRect(0, 0, size, size)
  
  if (glow <= 0 || size < 64) return

  // Purple/fuchsia glow behind the q (left-of-centre)
  const g1 = ctx.createRadialGradient(size * 0.40, size * 0.46, 0, size * 0.40, size * 0.46, size * 0.62)
  g1.addColorStop(0, rgba(C.purple, 0.35 * glow))
  g1.addColorStop(0.45, rgba(C.fuchsia, 0.15 * glow))
  g1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, size, size)

  // Cyan/emerald glow on the wave (right) side
  const g2 = ctx.createRadialGradient(size * 0.72, size * 0.56, 0, size * 0.72, size * 0.56, size * 0.5)
  g2.addColorStop(0, rgba(C.cyan, 0.20 * glow))
  g2.addColorStop(0.5, rgba(C.emerald, 0.08 * glow))
  g2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, size, size)
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function bowlGradient(ctx, cx, cy, R) {
  // Diagonal pink → fuchsia → purple gradient
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
  g.addColorStop(0, C.pink)
  g.addColorStop(0.5, C.fuchsia)
  g.addColorStop(1, C.purple)
  return g
}

// ── Refined echo arcs with progressive width/opacity reduction ─────────────
const SOCIAL_ECHO = {
  radiiMul: [1.30, 1.58, 1.86], // Slightly tighter spacing for social
  widthMul: [0.14, 0.09, 0.055], // Progressive width reduction
  opacities: [1.0, 0.68, 0.42], // Progressive opacity reduction
  sweepNormal: Math.PI * 0.28, // ~50° sweep for social
  sweepTiny: Math.PI * 0.34,
}

function drawSocialEcho(ctx, cx, cy, R, size, { count, glow, tiny }) {
  const sweep = tiny ? SOCIAL_ECHO.sweepTiny : SOCIAL_ECHO.sweepNormal
  ctx.save()
  ctx.lineCap = 'round'
  if (glow > 0) {
    ctx.shadowColor = rgba(C.cyan, 0.60 * glow)
    ctx.shadowBlur = R * 0.18 * glow
  }
  for (let i = 0; i < count; i++) {
    const r = R * SOCIAL_ECHO.radiiMul[i]
    const t = count > 1 ? i / (count - 1) : 0
    ctx.beginPath()
    ctx.arc(cx, cy, r, -sweep, sweep)
    ctx.lineWidth = R * SOCIAL_ECHO.widthMul[i]
    ctx.strokeStyle = mix(C.cyan, C.emerald, t)
    ctx.globalAlpha = SOCIAL_ECHO.opacities[i]
    ctx.stroke()
  }
  ctx.restore()
}

// ── Refined q geometry for social avatars ───────────────────────────────────
// Increased composition size, centered, refined tail
function socialQBBox(withEcho, count) {
  const thickness = 0.32 // Slightly thinner for elegance
  const tailLen = 0.52 // Refined tail length
  const tailCx = 0.48 // Centered tail x
  const tailHalf = (thickness * 0.90) / 2
  const tailBottom = 1 + tailLen
  const tailRight = tailCx + tailHalf
  const maxR = withEcho ? SOCIAL_ECHO.radiiMul[Math.min(count, 3) - 1] : 1
  const sweep = SOCIAL_ECHO.sweepNormal
  const arcVert = withEcho ? maxR * Math.sin(sweep) : 0
  const left = -1
  const right = Math.max(1, tailRight, withEcho ? maxR : 0)
  const top = -Math.max(1, arcVert)
  const bottom = Math.max(1, tailBottom, arcVert)
  return { left, right, top, bottom, w: right - left, h: bottom - top }
}

function drawSocialQ(ctx, cx, cy, R, size, detail, opts = {}) {
  const { glow, tiny } = detail
  const count = detail.arcs
  const echo = opts.echo !== false
  const thickness = R * 0.32

  // Echo arcs first (behind the q tail/ring)
  if (echo && count > 0) drawSocialEcho(ctx, cx, cy, R, size, { count, glow, tiny })

  const grad = bowlGradient(ctx, cx, cy, R)

  // Refined descending tail
  const tailW = thickness * 0.90
  const tailCx = cx + R * 0.48 // Centered
  const tailTop = cy + R * 0.16 // Slightly higher start
  const tailBottom = cy + R + R * 0.52 // Refined length
  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.purple, 0.55 * glow)
    ctx.shadowBlur = R * 0.18 * glow
  }
  ctx.fillStyle = grad
  roundRect(ctx, tailCx - tailW / 2, tailTop, tailW, tailBottom - tailTop, tailW / 2)
  ctx.fill()
  ctx.restore()

  // Ring bowl
  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.fuchsia, 0.55 * glow)
    ctx.shadowBlur = R * 0.22 * glow
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R - thickness / 2, 0, Math.PI * 2)
  ctx.lineWidth = thickness
  ctx.strokeStyle = grad
  ctx.stroke()
  ctx.restore()

  // Restrained white highlight
  if (!tiny && size >= 64) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R - thickness / 2, Math.PI * 1.05, Math.PI * 1.4)
    ctx.lineWidth = thickness * 0.36
    ctx.strokeStyle = rgba(C.white, 0.38)
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.restore()
  }
}

// ── Fit into circular safe zone (80% of square) ─────────────────────────────
function fitSocialLayout(size, bbox) {
  // Circular safe zone: 80% diameter, centered
  const safeZone = size * 0.80
  const fit = safeZone
  const x0 = (size - fit) / 2
  const R = Math.min(fit / bbox.w, fit / bbox.h)
  
  // Center the bbox within the safe zone
  const bboxCx = (bbox.left + bbox.right) / 2
  const bboxCy = (bbox.top + bbox.bottom) / 2
  const cx = x0 + fit / 2 - bboxCx * R
  const cy = x0 + fit / 2 - bboxCy * R
  return { cx, cy, R }
}

// ── Render social avatar with full-bleed background ─────────────────────────
function renderSocialAvatar(size, opts = {}) {
  const { transparent = false } = opts
  const detail = opts.detail || socialDetailFor(size)
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  if (!transparent) paintSocialBackground(ctx, size, detail.glow)

  const echoCount = detail.arcs
  const bbox = socialQBBox(echoCount > 0, echoCount)
  const { cx, cy, R } = fitSocialLayout(size, bbox)
  drawSocialQ(ctx, cx, cy, R, size, detail, { echo: echoCount > 0 })

  return canvas
}

function writePng(dir, file, canvas, expect) {
  if (expect && (canvas.width !== expect || canvas.height !== expect)) {
    throw new Error(`[social-avatar] ${file} expected ${expect}x${expect}, got ${canvas.width}x${canvas.height}`)
  }
  const buf = canvas.toBuffer('image/png')
  if (!buf || buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) {
    throw new Error(`[social-avatar] ${file} produced an invalid PNG`)
  }
  try {
    fs.writeFileSync(path.join(dir, file), buf)
  } catch (err) {
    throw new Error(`[social-avatar] failed to write ${file}: ${err.message}`)
  }
  console.log('  ✅', path.relative(publicDir, path.join(dir, file)), `${canvas.width}x${canvas.height}`)
  return buf
}

// ── Preview sheet: all sizes with labels ───────────────────────────────────────
function buildPreviewSheet() {
  const sizes = [512, 256, 128, 64, 32]
  const cell = 200
  const gap = 32
  const headH = 56
  const rowH = cell + 70
  const cols = sizes.length
  const W = 180 + cols * (cell + gap) + gap
  const H = headH + rowH + gap
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#0a0a0f'
  ctx.fillRect(0, 0, W, H)

  // Header
  ctx.fillStyle = '#ffffff'
  ctx.font = '600 24px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('Faneqo Social Avatar — Size Preview', 24, 36)

  // Column headers
  sizes.forEach((s, i) => {
    const x = 180 + i * (cell + gap) + cell / 2
    ctx.fillStyle = '#9aa'
    ctx.font = '500 18px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${s}px`, x, headH - 12)
  })

  // Row with all sizes
  const y = headH + gap
  sizes.forEach((s, i) => {
    const x = 180 + i * (cell + gap)
    const avatar = renderSocialAvatar(s)
    // Nearest-neighbor upscale to show true pixels
    ctx.imageSmoothingEnabled = false
    const draw = Math.min(cell, s >= cell ? cell : s * Math.floor(cell / s))
    const off = (cell - draw) / 2
    ctx.drawImage(avatar, x + off, y + off, draw, draw)
    ctx.imageSmoothingEnabled = true
    
    // Frame
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
    
    // Label
    ctx.fillStyle = '#778'
    ctx.font = '400 14px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${s}px`, x + cell / 2, y + cell + 20)
  })

  return writePng(previewDir, 'faneqo-social-avatar-preview.png', c)
}

// ── Safe zone visualization ───────────────────────────────────────────────────
function buildSafeZoneSheet() {
  const size = 512
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')
  
  // Full-bleed background
  paintSocialBackground(ctx, size, 1.0)
  
  // Draw the avatar
  const avatar = renderSocialAvatar(size)
  ctx.drawImage(avatar, 0, 0)
  
  // Draw safe zone ring (80% diameter)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 8])
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.40, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
  
  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = '600 20px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('Circular Safe Zone (80%)', size / 2, size - 24)

  return writePng(previewDir, 'faneqo-social-avatar-safezone.png', c)
}

// ── Preview runner ────────────────────────────────────────────────────────────
function runPreview() {
  ensureDir(previewDir)
  console.log('🎨 Faneqo Social Avatar — PREVIEW\n')
  buildPreviewSheet()
  buildSafeZoneSheet()
  console.log('\n🚀 Preview done. Review public/brand-preview/ then run:')
  console.log('   node scripts/generate-faneqo-social-avatar.cjs --final')
}

// ── Final runner ──────────────────────────────────────────────────────────────
function runFinal() {
  ensureDir(socialDir)
  console.log('🎨 Faneqo Social Avatar — FINAL (public/social-avatars/)\n')
  
  const sizes = [512, 256, 128, 64, 32]
  sizes.forEach(size => {
    writePng(socialDir, `faneqo-social-${size}.png`, renderSocialAvatar(size), size)
  })
  
  // Transparent mark version (512px)
  writePng(socialDir, 'faneqo-social-512-transparent.png', renderSocialAvatar(512, { transparent: true }), 512)
  
  console.log('\n🚀 Social avatars written to public/social-avatars/')
}

// ── CLI ───────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
try {
  if (args.includes('--final')) {
    runFinal()
  } else {
    runPreview()
  }
} catch (err) {
  console.error('\n' + err.message + '\n')
  process.exit(1)
}
