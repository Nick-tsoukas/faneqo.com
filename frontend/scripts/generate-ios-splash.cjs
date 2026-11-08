const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, '..', 'public', 'splash')

// iOS splash screen sizes for various devices
const splashSizes = [
  // iPhone
  { width: 1170, height: 2532, name: 'apple-splash-1170x2532' }, // iPhone 12/13/14
  { width: 1179, height: 2556, name: 'apple-splash-1179x2556' }, // iPhone 14 Pro
  { width: 1284, height: 2778, name: 'apple-splash-1284x2778' }, // iPhone 12/13/14 Pro Max
  { width: 1290, height: 2796, name: 'apple-splash-1290x2796' }, // iPhone 14 Pro Max
  { width: 1125, height: 2436, name: 'apple-splash-1125x2436' }, // iPhone X/XS/11 Pro
  { width: 1242, height: 2688, name: 'apple-splash-1242x2688' }, // iPhone XS Max/11 Pro Max
  { width: 828, height: 1792, name: 'apple-splash-828x1792' },   // iPhone XR/11
  { width: 750, height: 1334, name: 'apple-splash-750x1334' },   // iPhone 8/SE
  { width: 1242, height: 2208, name: 'apple-splash-1242x2208' }, // iPhone 8 Plus
  // iPad
  { width: 2048, height: 2732, name: 'apple-splash-2048x2732' }, // iPad Pro 12.9
  { width: 1668, height: 2388, name: 'apple-splash-1668x2388' }, // iPad Pro 11
  { width: 1536, height: 2048, name: 'apple-splash-1536x2048' }, // iPad Air/Mini
]

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

function generateSplash(width, height, name) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')

  // Black background
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)

  // Gradient orbs (subtle background effect)
  const gradient1 = ctx.createRadialGradient(
    width * 0.3, height * 0.3, 0,
    width * 0.3, height * 0.3, width * 0.5
  )
  gradient1.addColorStop(0, 'rgba(255, 0, 255, 0.15)')
  gradient1.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient1
  ctx.fillRect(0, 0, width, height)

  const gradient2 = ctx.createRadialGradient(
    width * 0.7, height * 0.6, 0,
    width * 0.7, height * 0.6, width * 0.4
  )
  gradient2.addColorStop(0, 'rgba(145, 0, 255, 0.12)')
  gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = gradient2
  ctx.fillRect(0, 0, width, height)

  // Calculate text size based on screen width
  const textSize = Math.min(width, height) * 0.15
  
  // MBQ text with gradient
  ctx.font = `bold ${textSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Text gradient
  const textGradient = ctx.createLinearGradient(
    width / 2 - textSize, height / 2,
    width / 2 + textSize, height / 2
  )
  textGradient.addColorStop(0, '#FF00FF')
  textGradient.addColorStop(1, '#9100FF')

  // Glow effect
  ctx.shadowColor = '#FF00FF'
  ctx.shadowBlur = textSize * 0.3
  ctx.fillStyle = textGradient
  ctx.fillText('MBQ', width / 2, height / 2)

  // Remove shadow for tagline
  ctx.shadowBlur = 0
  
  // Tagline
  const taglineSize = textSize * 0.15
  ctx.font = `500 ${taglineSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  ctx.fillText('Smart Links for Artists', width / 2, height / 2 + textSize * 0.7)

  // Save
  const buffer = canvas.toBuffer('image/png')
  const filePath = path.join(outputDir, `${name}.png`)
  fs.writeFileSync(filePath, buffer)
  console.log(`✅ Generated: ${name}.png (${width}x${height})`)
}

console.log('🎨 Generating iOS splash screens...\n')

splashSizes.forEach(({ width, height, name }) => {
  generateSplash(width, height, name)
})

console.log(`\n✅ All splash screens saved to: ${outputDir}`)
