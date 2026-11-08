/**
 * Faneqo application mark — geometric, font-free, built from Canvas paths.
 *
 * Exposes three candidate marks plus a full-bleed near-black background and a
 * size-aware renderer. All geometry is expressed in "design units" relative to
 * a bowl radius R=1, then fitted (bbox-aware) into the maskable/normal safe
 * zone so the mark is large and confident yet never clipped.
 *
 * Candidate A — "Q Echo": geometric lowercase q (ring bowl + short descending
 *   tail) with three cyan→emerald echo arcs radiating from the right of the bowl.
 * Candidate B — "Echo Ring": same ring + tighter, minimal arcs, almost no glow.
 * Candidate C — "FQ Monogram": compact geometric F sharing a q bowl.
 */
const { createCanvas } = require('canvas')
const { BRAND, mix, rgba } = require('./faneqo-brand.cjs')
const C = BRAND.colors

// ── Size-aware detail ───────────────────────────────────────────────────────
function detailFor(size) {
  if (size >= 384) return { arcs: 3, glow: 1.0, simplify: false, tiny: false }
  if (size >= 160) return { arcs: 3, glow: 0.7, simplify: false, tiny: false } // 192 / 180
  if (size >= 48) return { arcs: 2, glow: 0.3, simplify: false, tiny: false } // 64 / 48
  if (size >= 28) return { arcs: 2, glow: 0.0, simplify: true, tiny: false } // 32
  return { arcs: 1, glow: 0.0, simplify: true, tiny: true } // 16
}

// ── Full-bleed near-black background with restrained radial glows ───────────
function paintBackground(ctx, size, glow = 1) {
  ctx.fillStyle = C.background
  ctx.fillRect(0, 0, size, size)
  if (glow <= 0 || size < 48) return // flat at favicon sizes for contrast

  // purple/fuchsia glow behind the q (left-of-centre)
  const g1 = ctx.createRadialGradient(size * 0.40, size * 0.46, 0, size * 0.40, size * 0.46, size * 0.62)
  g1.addColorStop(0, rgba(C.purple, 0.30 * glow))
  g1.addColorStop(0.45, rgba(C.fuchsia, 0.12 * glow))
  g1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, size, size)

  // cyan/emerald glow on the wave (right) side
  const g2 = ctx.createRadialGradient(size * 0.72, size * 0.56, 0, size * 0.72, size * 0.56, size * 0.5)
  g2.addColorStop(0, rgba(C.cyan, 0.16 * glow))
  g2.addColorStop(0.5, rgba(C.emerald, 0.06 * glow))
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
  // diagonal pink → fuchsia → purple, like the homepage wordmark body
  const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R)
  g.addColorStop(0, C.pink)
  g.addColorStop(0.5, C.fuchsia)
  g.addColorStop(1, C.purple)
  return g
}

// ── Echo arcs (cyan → emerald), concentric with the bowl, right side ────────
// Shared so drawEcho() and qBBox() always agree on geometry.
const ECHO = {
  radiiMul: [1.34, 1.64, 1.94], // clear gap from the ring (outer = 1.0)
  widthMul: [0.12, 0.085, 0.058],
  opacities: [1.0, 0.74, 0.48],
  sweepNormal: Math.PI * 0.26, // tight rightward ripple (~47°)
  sweepTiny: Math.PI * 0.32,
}

function drawEcho(ctx, cx, cy, R, size, { count, glow, tiny }) {
  const sweep = tiny ? ECHO.sweepTiny : ECHO.sweepNormal
  ctx.save()
  ctx.lineCap = 'round'
  if (glow > 0) {
    ctx.shadowColor = rgba(C.cyan, 0.55 * glow)
    ctx.shadowBlur = R * 0.16 * glow
  }
  for (let i = 0; i < count; i++) {
    const r = R * ECHO.radiiMul[i]
    const t = count > 1 ? i / (count - 1) : 0
    ctx.beginPath()
    ctx.arc(cx, cy, r, -sweep, sweep)
    ctx.lineWidth = R * ECHO.widthMul[i]
    ctx.strokeStyle = mix(C.cyan, C.emerald, t)
    ctx.globalAlpha = ECHO.opacities[i]
    ctx.stroke()
  }
  ctx.restore()
}

// ── Candidate A/B: geometric lowercase q (ring bowl + descending tail) ──────
// Returns the bbox (in design units, R=1) so the caller can fit it precisely.
function qBBox(withEcho, count) {
  const thickness = 0.34
  const tailLen = 0.5
  const tailCx = 0.5
  const tailHalf = (thickness * 0.92) / 2
  const tailBottom = 1 + tailLen
  const tailRight = tailCx + tailHalf
  const maxR = withEcho ? ECHO.radiiMul[Math.min(count, 3) - 1] : 1
  const sweep = ECHO.sweepNormal
  const arcVert = withEcho ? maxR * Math.sin(sweep) : 0
  const left = -1
  const right = Math.max(1, tailRight, withEcho ? maxR : 0)
  const top = -Math.max(1, arcVert)
  const bottom = Math.max(1, tailBottom, arcVert)
  return { left, right, top, bottom, w: right - left, h: bottom - top }
}

function drawQ(ctx, cx, cy, R, size, detail, opts = {}) {
  const { glow, tiny } = detail
  const count = detail.arcs
  const echo = opts.echo !== false
  const thickness = R * 0.34

  // echo arcs first (behind the q tail/ring on the right)
  if (echo && count > 0) drawEcho(ctx, cx, cy, R, size, { count, glow, tiny })

  const grad = bowlGradient(ctx, cx, cy, R)

  // descending tail (drawn before ring so the ring edge stays crisp on top)
  const tailW = thickness * 0.92
  const tailCx = cx + R * 0.5
  const tailTop = cy + R * 0.18
  const tailBottom = cy + R + R * 0.55
  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.purple, 0.5 * glow)
    ctx.shadowBlur = R * 0.16 * glow
  }
  ctx.fillStyle = grad
  roundRect(ctx, tailCx - tailW / 2, tailTop, tailW, tailBottom - tailTop, tailW / 2)
  ctx.fill()
  ctx.restore()

  // ring bowl (stroked circle = clean inner cutout, round thickness)
  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.fuchsia, 0.5 * glow)
    ctx.shadowBlur = R * 0.2 * glow
  }
  ctx.beginPath()
  ctx.arc(cx, cy, R - thickness / 2, 0, Math.PI * 2)
  ctx.lineWidth = thickness
  ctx.strokeStyle = grad
  ctx.stroke()
  ctx.restore()

  // restrained white highlight on the upper-left of the bowl
  if (!tiny && size >= 48) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, R - thickness / 2, Math.PI * 1.05, Math.PI * 1.4)
    ctx.lineWidth = thickness * 0.34
    ctx.strokeStyle = rgba(C.white, 0.35)
    ctx.lineCap = 'round'
    ctx.stroke()
    ctx.restore()
  }
}

// ── Candidate C: compact geometric FQ monogram ──────────────────────────────
function fqBBox() {
  // F bars on the left, q bowl overlapping lower-right; tail descends.
  return { left: -1.35, right: 1.0, top: -1.15, bottom: 1.5, w: 2.35, h: 2.65 }
}

function drawFQ(ctx, cx, cy, R, size, detail) {
  const { glow, tiny } = detail
  const count = detail.arcs
  const grad = bowlGradient(ctx, cx, cy, R)
  const bar = R * 0.30
  const r = bar * 0.32

  // subtle echo cut from the bowl (one/two arcs only, restrained)
  if (count > 0 && !tiny) drawEcho(ctx, cx, cy, R, size, { count: Math.min(count, 2), glow, tiny })

  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.fuchsia, 0.45 * glow)
    ctx.shadowBlur = R * 0.16 * glow
  }
  ctx.fillStyle = grad

  // F: vertical spine + top bar + mid bar, placed left
  const fx = cx - R * 1.32
  const fyTop = cy - R * 1.1
  const fH = R * 2.2
  roundRect(ctx, fx, fyTop, bar, fH, r)
  ctx.fill()
  roundRect(ctx, fx, fyTop, R * 1.05, bar, r)
  ctx.fill()
  roundRect(ctx, fx, fyTop + fH * 0.42, R * 0.8, bar, r)
  ctx.fill()
  ctx.restore()

  // q bowl on the right, slightly smaller, sharing the visual centre
  const qR = R * 0.92
  const qcx = cx + R * 0.05
  const qcy = cy + R * 0.18
  const thickness = qR * 0.36
  ctx.save()
  if (glow > 0) {
    ctx.shadowColor = rgba(C.purple, 0.45 * glow)
    ctx.shadowBlur = R * 0.16 * glow
  }
  // tail
  const tailW = thickness * 0.92
  ctx.fillStyle = grad
  roundRect(ctx, qcx + qR * 0.5 - tailW / 2, qcy + qR * 0.1, tailW, qR * 1.4, tailW / 2)
  ctx.fill()
  // ring
  ctx.beginPath()
  ctx.arc(qcx, qcy, qR - thickness / 2, 0, Math.PI * 2)
  ctx.lineWidth = thickness
  ctx.strokeStyle = grad
  ctx.stroke()
  ctx.restore()
}

// ── Fit a design-unit bbox into the safe zone and return pixel layout ───────
function fitLayout(size, bbox, { maskable }) {
  // essential-mark padding: ~15% normal, ~20% maskable
  const padRatio = maskable ? 0.2 : 0.15
  const fit = size * (1 - padRatio * 2)
  const x0 = (size - fit) / 2
  const R = Math.min(fit / bbox.w, fit / bbox.h)
  // centre the bbox within the fit box
  const bboxCx = (bbox.left + bbox.right) / 2
  const bboxCy = (bbox.top + bbox.bottom) / 2
  const cx = x0 + fit / 2 - bboxCx * R
  const cy = x0 + fit / 2 - bboxCy * R
  return { cx, cy, R }
}

// ── Public: render one icon candidate at an exact size ──────────────────────
function renderIcon(candidate, size, opts = {}) {
  const { maskable = false, background = true } = opts
  const detail = opts.detail || detailFor(size)
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  if (background) paintBackground(ctx, size, detail.glow)

  if (candidate === 'c') {
    const { cx, cy, R } = fitLayout(size, fqBBox(), { maskable })
    drawFQ(ctx, cx, cy, R, size, detail)
  } else {
    const echoCount = candidate === 'b' ? Math.min(detail.arcs, 2) : detail.arcs
    const bbox = qBBox(echoCount > 0, echoCount)
    const { cx, cy, R } = fitLayout(size, bbox, { maskable })
    const d = candidate === 'b'
      ? { ...detail, arcs: echoCount, glow: detail.glow * 0.25 } // minimal
      : detail
    drawQ(ctx, cx, cy, R, size, d, { echo: echoCount > 0 })
  }
  return canvas
}

module.exports = { renderIcon, paintBackground, roundRect, detailFor, drawQ, drawFQ, qBBox, fqBBox, fitLayout, bowlGradient }
