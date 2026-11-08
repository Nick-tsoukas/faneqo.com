/**
 * CANONICAL Faneqo PWA icon generator.
 *
 * Uses the shared brand + mark libraries (scripts/lib/faneqo-brand.cjs and
 * scripts/lib/faneqo-mark.cjs). Renders every size directly from vector-like
 * geometry — never by resizing a low-resolution PNG.
 *
 *   node scripts/generate-faneqo-icons.cjs                 (preview, default)
 *   node scripts/generate-faneqo-icons.cjs --preview
 *   node scripts/generate-faneqo-icons.cjs --final --candidate=a   (production)
 *
 * PREVIEW writes only to public/brand-preview/ and never touches production
 * icons or the manifest. FINAL writes the production icon set to public/icons/
 * (plus public/faneqo-favicon.ico) and must be run only after approval.
 *
 * Legacy generators (NOT canonical, kept until usage confirmed):
 *   - scripts/generate-pwa-icons.cjs    (renders legacy "MBQ" text icons)
 *   - scripts/generate-ios-splash.cjs   (renders legacy "MBQ" splash)
 *   Use scripts/generate-faneqo-splashes.cjs for Faneqo splash screens.
 */
const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')
const { BRAND } = require('./lib/faneqo-brand.cjs')
const { renderIcon, roundRect } = require('./lib/faneqo-mark.cjs')

const publicDir = path.join(__dirname, '..', 'public')
const previewDir = path.join(publicDir, 'brand-preview')
const iconsDir = path.join(publicDir, 'icons')

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

// ── ICO writer (single PNG-encoded entry) ──────────────────────────────────
function pngToIco(pngBuffer, dim) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)
  const entry = Buffer.alloc(16)
  entry.writeUInt8(dim >= 256 ? 0 : dim, 0)
  entry.writeUInt8(dim >= 256 ? 0 : dim, 1)
  entry.writeUInt8(0, 2)
  entry.writeUInt8(0, 3)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuffer.length, 8)
  entry.writeUInt32LE(6 + 16, 12)
  return Buffer.concat([header, entry, pngBuffer])
}

function writePng(dir, file, canvas, expect) {
  if (expect && (canvas.width !== expect || canvas.height !== expect)) {
    throw new Error(`[faneqo-icons] ${file} expected ${expect}x${expect}, got ${canvas.width}x${canvas.height}`)
  }
  const buf = canvas.toBuffer('image/png')
  if (!buf || buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) {
    throw new Error(`[faneqo-icons] ${file} produced an invalid PNG`)
  }
  try {
    fs.writeFileSync(path.join(dir, file), buf)
  } catch (err) {
    throw new Error(`[faneqo-icons] failed to write ${file}: ${err.message}`)
  }
  console.log('  ✅', path.relative(publicDir, path.join(dir, file)), `${canvas.width}x${canvas.height}`)
  return buf
}

const CANDIDATES = [
  { key: 'a', label: 'A — Q Echo (RECOMMENDED)' },
  { key: 'b', label: 'B — Echo Ring (minimal)' },
  { key: 'c', label: 'C — FQ Monogram' },
]

function label(ctx, text, x, y, sizePx = 24, color = '#ffffff') {
  ctx.fillStyle = color
  ctx.font = `600 ${sizePx}px "Segoe UI", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText(text, x, y)
}

// ── 1) Candidates hero sheet: each candidate @ 512, labels outside art ──────
function buildCandidatesSheet() {
  const tile = 512
  const gap = 48
  const labelH = 70
  const cols = CANDIDATES.length
  const W = cols * tile + (cols + 1) * gap
  const H = tile + gap + labelH + gap
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#070708'
  ctx.fillRect(0, 0, W, H)
  CANDIDATES.forEach((cand, i) => {
    const x = gap + i * (tile + gap)
    const y = gap
    // full-bleed square icon, NO baked rounding (OS applies its own shape)
    ctx.drawImage(renderIcon(cand.key, tile), x, y)
    // thin preview-only frame so the square edge is visible on dark sheet
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1)
    label(ctx, cand.label, x + tile / 2, y + tile + 20, 26)
  })
  return writePng(previewDir, 'faneqo-icon-candidates.png', c)
}

// ── 2) Size test: each candidate across 512/192/64/32/16 (true geometry) ────
function buildSizeTest() {
  const sizes = [512, 192, 64, 32, 16]
  const cell = 200
  const gap = 28
  const headH = 56
  const rowH = cell + 60
  const cols = sizes.length
  const W = 220 + cols * (cell + gap) + gap
  const H = headH + CANDIDATES.length * (rowH + gap) + gap
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#070708'
  ctx.fillRect(0, 0, W, H)
  // column headers
  sizes.forEach((s, i) => {
    const x = 220 + i * (cell + gap) + cell / 2
    label(ctx, `${s}px`, x, 18, 22, '#9aa')
  })
  CANDIDATES.forEach((cand, r) => {
    const y = headH + r * (rowH + gap)
    label(ctx, cand.label, 110, y + cell / 2, 18, '#fff')
    sizes.forEach((s, i) => {
      const x = 220 + i * (cell + gap)
      const icon = renderIcon(cand.key, s) // rendered at native size
      // show true pixels: nearest-neighbour upscale into the cell
      ctx.imageSmoothingEnabled = false
      const draw = Math.min(cell, s >= cell ? cell : s * Math.floor(cell / s))
      const off = (cell - draw) / 2
      ctx.drawImage(icon, x + off, y + off, draw, draw)
      ctx.imageSmoothingEnabled = true
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
      label(ctx, `${s}px`, x + cell / 2, y + cell + 8, 16, '#778')
    })
  })
  return writePng(previewDir, 'faneqo-icon-size-test.png', c)
}

// ── 3) Mask test: maskable render under circle / squircle / iOS / safe-zone ─
function squirclePath(ctx, x, y, s, n = 4) {
  // superellipse |x|^n + |y|^n = 1 (Android adaptive-ish squircle)
  const cx = x + s / 2, cy = y + s / 2, r = s / 2
  ctx.beginPath()
  const steps = 180
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2
    const ct = Math.cos(t), st = Math.sin(t)
    const px = cx + r * Math.sign(ct) * Math.pow(Math.abs(ct), 2 / n)
    const py = cy + r * Math.sign(st) * Math.pow(Math.abs(st), 2 / n)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
}

function buildMaskTest() {
  const cell = 260
  const gap = 28
  const headH = 56
  const crops = ['circle', 'squircle', 'iOS rounded', 'safe-zone']
  const cols = crops.length
  const W = 220 + cols * (cell + gap) + gap
  const rowH = cell + 50
  const H = headH + CANDIDATES.length * (rowH + gap) + gap
  const c = createCanvas(W, H)
  const ctx = c.getContext('2d')
  ctx.fillStyle = '#070708'
  ctx.fillRect(0, 0, W, H)
  crops.forEach((cr, i) => label(ctx, cr, 220 + i * (cell + gap) + cell / 2, 18, 20, '#9aa'))

  CANDIDATES.forEach((cand, r) => {
    const y = headH + r * (rowH + gap)
    label(ctx, cand.label, 110, y + cell / 2, 18, '#fff')
    const icon = renderIcon(cand.key, cell, { maskable: true })
    crops.forEach((cr, i) => {
      const x = 220 + i * (cell + gap)
      ctx.save()
      if (cr === 'circle') {
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell / 2, 0, Math.PI * 2); ctx.clip()
        ctx.drawImage(icon, x, y)
      } else if (cr === 'squircle') {
        squirclePath(ctx, x, y, cell, 4); ctx.clip(); ctx.drawImage(icon, x, y)
      } else if (cr === 'iOS rounded') {
        roundRect(ctx, x, y, cell, cell, cell * 0.225); ctx.clip(); ctx.drawImage(icon, x, y)
      } else {
        // full bleed + safe-zone ring (Android keeps inner 80% circle visible)
        ctx.drawImage(icon, x, y)
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'
        ctx.setLineDash([6, 6]); ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(x + cell / 2, y + cell / 2, cell * 0.4, 0, Math.PI * 2); ctx.stroke()
        ctx.setLineDash([])
      }
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.strokeRect(x + 0.5, y + 0.5, cell - 1, cell - 1)
    })
  })
  return writePng(previewDir, 'faneqo-icon-mask-test.png', c)
}

// ── Preview / Final runners ─────────────────────────────────────────────────
function runPreview() {
  ensureDir(previewDir)
  console.log('🎨 Faneqo icons — PREVIEW (production + manifest untouched)\n')
  buildCandidatesSheet()
  buildSizeTest()
  buildMaskTest()
  console.log('\n🚀 Preview done. Review public/brand-preview/ then approve a candidate:')
  console.log('   node scripts/generate-faneqo-icons.cjs --final --candidate=a')
}

function runFinal(candidate) {
  ensureDir(iconsDir)
  console.log(`🎨 Faneqo icons — FINAL (candidate ${candidate.toUpperCase()} → public/icons/)\n`)
  // 1024 master preview (vector-rendered, not used as a resize source)
  writePng(iconsDir, 'faneqo-icon-master-1024.png', renderIcon(candidate, 1024), 1024)
  // production set — each rendered directly at its target size
  writePng(iconsDir, 'faneqo-icon-192.png', renderIcon(candidate, 192), 192)
  writePng(iconsDir, 'faneqo-icon-512.png', renderIcon(candidate, 512), 512)
  writePng(iconsDir, 'faneqo-icon-192-maskable.png', renderIcon(candidate, 192, { maskable: true }), 192)
  writePng(iconsDir, 'faneqo-icon-512-maskable.png', renderIcon(candidate, 512, { maskable: true }), 512)
  writePng(iconsDir, 'faneqo-apple-touch-icon.png', renderIcon(candidate, 180), 180)
  writePng(iconsDir, 'faneqo-favicon-32.png', renderIcon(candidate, 32), 32)
  writePng(iconsDir, 'faneqo-favicon-16.png', renderIcon(candidate, 16), 16)
  // favicon.ico (new file; does NOT overwrite legacy /public/favicon.ico)
  const ico = renderIcon(candidate, 32).toBuffer('image/png')
  fs.writeFileSync(path.join(publicDir, 'faneqo-favicon.ico'), pngToIco(ico, 32))
  console.log('  ✅ faneqo-favicon.ico')
  console.log('\n🚀 Final icons written. Manifest/Nuxt references NOT changed (see report).')
}

// ── CLI ─────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
try {
  if (args.includes('--final')) {
    const m = args.find((a) => a.startsWith('--candidate='))
    const cand = (m ? m.split('=')[1] : 'a').toLowerCase()
    if (!['a', 'b', 'c'].includes(cand)) throw new Error(`[faneqo-icons] invalid --candidate=${cand} (use a|b|c)`)
    runFinal(cand)
  } else {
    runPreview()
  }
} catch (err) {
  console.error('\n' + err.message + '\n')
  process.exit(1)
}
