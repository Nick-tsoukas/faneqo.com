import sharp from 'sharp'
import path from 'path'

const root = path.resolve('public/brand-preview')
const tagline = "a band's best friend."
const safeTagline = tagline.replace(/&/g, '&amp;').replace(/'/g, '&#8217;')

async function makeTightLockup({
  source,
  out,
  bg = null,
  markSearchEnd = 0.72,
  /** Space between trimmed mark bottom and tagline baseline, as fraction of mark height. */
  gapRatio = 0.09,
  fontRatio = 0.085,
  letterSpacing = 1.35,
  fill = 'rgba(255,255,255,0.62)',
  sidePadRatio = 0.04,
  topPadRatio = 0.06,
  bottomPadRatio = 0.08,
}) {
  const srcPath = path.join(root, source)
  const meta = await sharp(srcPath).metadata()
  const srcW = meta.width
  const srcH = meta.height
  const searchEnd = Math.round(srcH * markSearchEnd)

  // Keep only the wordmark + waves (cut old tagline), then auto-trim black/empty
  const markRaw = await sharp(srcPath)
    .extract({ left: 0, top: 0, width: srcW, height: searchEnd })
    .png()
    .toBuffer()

  const trimmed = await sharp(markRaw)
    .trim({
      background: bg ? '#000000' : { r: 0, g: 0, b: 0, alpha: 0 },
      threshold: 12,
    })
    .png()
    .toBuffer()

  const markMeta = await sharp(trimmed).metadata()
  const markW = markMeta.width
  const markH = markMeta.height

  const fontSize = Math.max(20, Math.round(markH * fontRatio))
  const gap = Math.round(markH * gapRatio)
  const sidePad = Math.round(markW * sidePadRatio)
  const topPad = Math.round(markH * topPadRatio)
  const bottomPad = Math.round(markH * bottomPadRatio)

  const outW = markW + sidePad * 2
  // gap measured to baseline; leave a little descent room under the baseline
  const tagRoom = gap + Math.round(fontSize * 0.28)
  const outH = topPad + markH + tagRoom + bottomPad
  const markLeft = sidePad
  const tagY = topPad + markH + gap

  const overlaySvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${outW}" height="${outH}" xmlns="http://www.w3.org/2000/svg">
  <text x="${outW / 2}" y="${tagY}" text-anchor="middle"
    font-family="Poppins, 'Segoe UI', Arial, sans-serif"
    font-weight="700" font-size="${fontSize}" letter-spacing="${letterSpacing}"
    fill="${fill}">${safeTagline}</text>
</svg>`)

  const background = bg
    ? { r: 0, g: 0, b: 0, alpha: 1 }
    : { r: 0, g: 0, b: 0, alpha: 0 }

  const base = await sharp({
    create: { width: outW, height: outH, channels: 4, background },
  })
    .png()
    .toBuffer()

  await sharp(base)
    .composite([
      { input: trimmed, top: topPad, left: markLeft },
      { input: await sharp(overlaySvg).png().toBuffer(), top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(root, out))

  console.log(
    'wrote',
    out,
    `${outW}x${outH}`,
    `mark=${markW}x${markH}`,
    `gap=${gap}`,
    `font=${fontSize}`,
  )
}

await makeTightLockup({
  source: 'faneqo-lockup-headquarters-on-dark.png',
  out: 'faneqo-lockup-bands-best-friend-on-dark.png',
  bg: '#000000',
  markSearchEnd: 0.70,
  // gap = mark bottom → baseline; small air above larger caps
  gapRatio: 0.205,
  fontRatio: 0.22,
  letterSpacing: 0.6,
  fill: 'rgba(255,255,255,0.82)',
  bottomPadRatio: 0.08,
})

await makeTightLockup({
  source: 'faneqo-lockup-headquarters.png',
  out: 'faneqo-lockup-bands-best-friend.png',
  bg: null,
  markSearchEnd: 0.70,
  gapRatio: 0.205,
  fontRatio: 0.22,
  letterSpacing: 0.6,
  fill: 'rgba(255,255,255,0.96)',
  bottomPadRatio: 0.08,
})

await makeTightLockup({
  source: 'faneqo-logo-headquarters-transparent.png',
  out: 'faneqo-logo-bands-best-friend-transparent.png',
  bg: '#000000',
  markSearchEnd: 0.74,
  gapRatio: 0.21,
  fontRatio: 0.225,
  letterSpacing: 0.55,
  fill: 'rgba(255,255,255,0.90)',
  bottomPadRatio: 0.075,
})

await makeTightLockup({
  source: 'faneqo-logo-headquarters-dark.png',
  out: 'faneqo-logo-bands-best-friend-dark.png',
  bg: '#000000',
  markSearchEnd: 0.74,
  gapRatio: 0.21,
  fontRatio: 0.225,
  letterSpacing: 0.55,
  fill: 'rgba(255,255,255,0.90)',
  bottomPadRatio: 0.075,
})

console.log('done')
