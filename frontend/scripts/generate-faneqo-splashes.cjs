/**
 * CANONICAL Faneqo iOS splash-screen generator.
 *
 * Replaces the legacy MBQ splash (scripts/generate-ios-splash.cjs) using the
 * shared brand + mark libraries. Near-black background, subtle fuchsia/purple
 * and cyan/emerald glows, the approved Faneqo q-echo mark centred, the Faneqo
 * wordmark beneath, and a restrained tagline.
 *
 *   node scripts/generate-faneqo-splashes.cjs                  (preview, default)
 *   node scripts/generate-faneqo-splashes.cjs --final --candidate=a
 *
 * PREVIEW writes a single representative splash to public/brand-preview/.
 * FINAL writes the full device set to public/splash-faneqo/ (NEW folder, so the
 * legacy /public/splash/*.png files are never overwritten until references are
 * switched after approval).
 */
const { createCanvas, registerFont } = require('canvas')
const fs = require('fs')
const path = require('path')
const { BRAND, rgba } = require('./lib/faneqo-brand.cjs')
const { renderIcon } = require('./lib/faneqo-mark.cjs')

const C = BRAND.colors
const publicDir = path.join(__dirname, '..', 'public')
const previewDir = path.join(publicDir, 'brand-preview')
const finalDir = path.join(publicDir, 'splash-faneqo')
const fontsDir = path.join(__dirname, 'fonts')

// Optional Poppins for the wordmark (falls back to system if absent).
let hasPoppins = false
const FONT_EB = path.join(fontsDir, 'Poppins-ExtraBold.ttf')
if (fs.existsSync(FONT_EB)) {
  registerFont(FONT_EB, { family: 'Poppins', weight: '800' })
  hasPoppins = true
}

const DEVICES = [
  { width: 1170, height: 2532, name: 'apple-splash-1170x2532' },
  { width: 1179, height: 2556, name: 'apple-splash-1179x2556' },
  { width: 1284, height: 2778, name: 'apple-splash-1284x2778' },
  { width: 1290, height: 2796, name: 'apple-splash-1290x2796' },
  { width: 1125, height: 2436, name: 'apple-splash-1125x2436' },
  { width: 1242, height: 2688, name: 'apple-splash-1242x2688' },
  { width: 828, height: 1792, name: 'apple-splash-828x1792' },
  { width: 750, height: 1334, name: 'apple-splash-750x1334' },
  { width: 1242, height: 2208, name: 'apple-splash-1242x2208' },
  { width: 2048, height: 2732, name: 'apple-splash-2048x2732' },
  { width: 1668, height: 2388, name: 'apple-splash-1668x2388' },
  { width: 1536, height: 2048, name: 'apple-splash-1536x2048' },
]

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
}

function renderSplash(width, height, candidate) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const minDim = Math.min(width, height)

  // near-black base
  ctx.fillStyle = C.black
  ctx.fillRect(0, 0, width, height)

  // subtle fuchsia/purple atmospheric glow (upper centre)
  const g1 = ctx.createRadialGradient(width * 0.5, height * 0.4, 0, width * 0.5, height * 0.4, minDim * 0.7)
  g1.addColorStop(0, rgba(C.purple, 0.16))
  g1.addColorStop(0.5, rgba(C.fuchsia, 0.06))
  g1.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g1
  ctx.fillRect(0, 0, width, height)

  // subtle cyan/emerald glow (lower right)
  const g2 = ctx.createRadialGradient(width * 0.68, height * 0.6, 0, width * 0.68, height * 0.6, minDim * 0.6)
  g2.addColorStop(0, rgba(C.cyan, 0.1))
  g2.addColorStop(0.5, rgba(C.emerald, 0.04))
  g2.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g2
  ctx.fillRect(0, 0, width, height)

  // centred mark (restrained: ~28% of the short edge), transparent bg
  const markSize = Math.round(minDim * 0.28)
  const mark = renderIcon(candidate, markSize, { background: false })
  const mx = (width - markSize) / 2
  const my = height / 2 - markSize * 0.78
  ctx.drawImage(mark, mx, my)

  // Faneqo wordmark text beneath
  const wordSize = Math.round(minDim * 0.085)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const wordY = my + markSize + wordSize * 1.1
  const grad = ctx.createLinearGradient(width * 0.5 - wordSize * 1.8, 0, width * 0.5 + wordSize * 1.8, 0)
  grad.addColorStop(0, C.white)
  grad.addColorStop(0.45, C.fuchsia)
  grad.addColorStop(1, C.purple)
  ctx.font = `800 ${wordSize}px ${hasPoppins ? '"Poppins",' : ''} "Segoe UI", Arial, sans-serif`
  ctx.fillStyle = grad
  ctx.fillText('Faneqo', width / 2, wordY)

  // tagline
  const tagSize = Math.round(minDim * 0.03)
  ctx.font = `500 ${tagSize}px "Segoe UI", Arial, sans-serif`
  ctx.fillStyle = rgba(C.white, 0.45)
  ctx.fillText(BRAND.tagline, width / 2, wordY + tagSize * 2.2)

  return canvas
}

function write(dir, name, canvas) {
  const buf = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(dir, `${name}.png`), buf)
  console.log('  ✅', path.relative(publicDir, path.join(dir, `${name}.png`)), `${canvas.width}x${canvas.height}`)
}

function runPreview(candidate) {
  ensureDir(previewDir)
  console.log('🎨 Faneqo splash — PREVIEW (legacy /public/splash untouched)\n')
  const c = renderSplash(1170, 2532, candidate)
  // downscale a copy for an easy-to-view preview
  fs.writeFileSync(path.join(previewDir, 'faneqo-splash-preview.png'), c.toBuffer('image/png'))
  console.log('  ✅ brand-preview/faneqo-splash-preview.png 1170x2532')
  console.log('\n🚀 Preview done. Approve, then: node scripts/generate-faneqo-splashes.cjs --final --candidate=a')
}

function runFinal(candidate) {
  ensureDir(finalDir)
  console.log(`🎨 Faneqo splash — FINAL (candidate ${candidate.toUpperCase()} → public/splash-faneqo/)\n`)
  for (const d of DEVICES) write(finalDir, d.name, renderSplash(d.width, d.height, candidate))
  console.log('\n🚀 Final splashes written. Nuxt startup-image references NOT changed (see report).')
}

const args = process.argv.slice(2)
const m = args.find((a) => a.startsWith('--candidate='))
const cand = (m ? m.split('=')[1] : 'a').toLowerCase()
try {
  if (!['a', 'b', 'c'].includes(cand)) throw new Error(`[faneqo-splash] invalid --candidate=${cand} (use a|b|c)`)
  if (args.includes('--final')) runFinal(cand)
  else runPreview(cand)
} catch (err) {
  console.error('\n' + err.message + '\n')
  process.exit(1)
}
