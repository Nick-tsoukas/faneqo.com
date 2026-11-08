const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

// Icon sizes to generate
const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'icon-512-maskable.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180 },
]

// Brand colors
const ACCENT = '#FF00FF'
const NEON_PURPLE = '#9100FF'

function generateIcon(size, maskable = false) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  
  // Background - soft black radial gradient
  const bgGradient = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size * 0.7
  )
  bgGradient.addColorStop(0, '#1a1a1a')
  bgGradient.addColorStop(0.5, '#0d0d0d')
  bgGradient.addColorStop(1, '#000000')
  
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, size, size)
  
  // Subtle accent glow in corner
  const glowGradient = ctx.createRadialGradient(
    size * 0.85, size * 0.15, 0,
    size * 0.85, size * 0.15, size * 0.4
  )
  glowGradient.addColorStop(0, 'rgba(255, 0, 255, 0.15)')
  glowGradient.addColorStop(0.5, 'rgba(145, 0, 255, 0.05)')
  glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
  
  ctx.fillStyle = glowGradient
  ctx.fillRect(0, 0, size, size)
  
  // Secondary glow bottom left
  const glow2 = ctx.createRadialGradient(
    size * 0.15, size * 0.85, 0,
    size * 0.15, size * 0.85, size * 0.35
  )
  glow2.addColorStop(0, 'rgba(57, 255, 20, 0.1)')
  glow2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, size, size)
  
  // Calculate font size based on icon size
  const fontSize = Math.floor(size * 0.32)
  
  // MBQ text with gradient
  ctx.font = `bold ${fontSize}px "Segoe UI", "Arial Black", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  const text = 'MBQ'
  const textX = size / 2
  const textY = size / 2
  
  // Text gradient
  const textGradient = ctx.createLinearGradient(
    textX - fontSize, textY,
    textX + fontSize, textY
  )
  textGradient.addColorStop(0, '#ffffff')
  textGradient.addColorStop(0.3, ACCENT)
  textGradient.addColorStop(0.7, NEON_PURPLE)
  textGradient.addColorStop(1, '#ffffff')
  
  // Glow effect behind text
  ctx.shadowColor = ACCENT
  ctx.shadowBlur = size * 0.08
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
  
  // Draw text with gradient
  ctx.fillStyle = textGradient
  ctx.fillText(text, textX, textY)
  
  // Reset shadow and add subtle outline
  ctx.shadowBlur = 0
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.lineWidth = Math.max(1, size * 0.005)
  ctx.strokeText(text, textX, textY)
  
  // Add subtle border for non-maskable icons
  if (!maskable) {
    const borderRadius = size * 0.18
    ctx.beginPath()
    ctx.roundRect(2, 2, size - 4, size - 4, borderRadius)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  
  return canvas.toBuffer('image/png')
}

// Generate all icons
const outputDir = path.join(__dirname, '../public/icons')

// Ensure directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

console.log('🎨 Generating MBQ PWA icons...\n')

sizes.forEach(({ name, size, maskable }) => {
  const buffer = generateIcon(size, maskable)
  const outputPath = path.join(outputDir, name)
  fs.writeFileSync(outputPath, buffer)
  console.log(`✅ Generated ${name} (${size}x${size}${maskable ? ' maskable' : ''})`)
})

// Also generate favicon
const faviconBuffer = generateIcon(32)
fs.writeFileSync(path.join(__dirname, '../public/favicon.png'), faviconBuffer)
console.log('✅ Generated favicon.png (32x32)')

console.log('\n🚀 All icons generated in public/icons/')
