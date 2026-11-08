import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-night-world')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const shots = [
  { name: 'artist-recap', path: '/__dev/artist-recap', widths: [390, 430, 768, 1280] },
  { name: 'artist-recap-artist', path: '/__dev/artist-recap?combo=artist', widths: [390, 1280] },
  { name: 'artist-recap-event', path: '/__dev/artist-recap?combo=artist-event', widths: [390, 1280] },
  { name: 'artist-recap-night', path: '/__dev/artist-recap?combo=artist-night', widths: [390, 1280] },
  { name: 'artist-recap-event-only', path: '/__dev/artist-recap?combo=event', widths: [390, 1280] },
  { name: 'artist-recap-night-only', path: '/__dev/artist-recap?combo=night', widths: [390, 1280] },
  { name: 'artist-recap-none', path: '/__dev/artist-recap?combo=none', widths: [390, 1280] },
  { name: 'artist-recap-edit', path: '/__dev/artist-recap?edit=1', widths: [390], wait: '.ne__sheet', viewportOnly: true },
  { name: 'artist-recap-lineup', path: '/__dev/artist-recap?edit=1&lineup=1', widths: [390, 1280], wait: '.ne__sub-sheet', viewportOnly: true },
  { name: 'artist-recap-share', path: '/__dev/artist-recap?share=1', widths: [390, 1280], wait: '.ns__sheet', viewportOnly: true },
  { name: 'artist-recap-insights', path: '/__dev/artist-recap?insights=1', widths: [390, 1280], wait: '.ins__sheet', viewportOnly: true },
  { name: 'artist-recap-gallery', path: '/__dev/artist-recap?gallery=live-set', widths: [390, 1280], wait: '.ngv__sheet', viewportOnly: true },
  { name: 'artist-recap-crop-wide', path: '/__dev/artist-recap?combo=artist&crop=wide', widths: [390, 1280], viewportOnly: true },
  { name: 'artist-recap-crop-fill', path: '/__dev/artist-recap?combo=artist&crop=fill', widths: [390, 1280], viewportOnly: true },
  { name: 'artist-recap-crop-framed', path: '/__dev/artist-recap?combo=artist&crop=framed', widths: [390, 1280], viewportOnly: true },
  { name: 'artist-recap-crop-square', path: '/__dev/artist-recap?combo=artist&crop=square', widths: [390, 1280], viewportOnly: true },
  { name: 'artist-recap-crop-portrait', path: '/__dev/artist-recap?combo=artist&crop=portrait', widths: [390, 1280], viewportOnly: true },
  { name: 'artist-recap-adjust', path: '/__dev/artist-recap?combo=artist&adjust=1', widths: [390, 1280], wait: '.aip__sheet', viewportOnly: true },
  { name: 'artist-recap-repositioned', path: '/__dev/artist-recap?combo=artist&crop=fill&adjust=1', widths: [390, 1280], reposition: true, viewportOnly: true },
]

for (const shot of shots) {
  for (const width of shot.widths) {
    const page = await browser.newPage({
      viewport: { width, height: width >= 768 ? 1024 : 844 },
      deviceScaleFactor: 2,
    })
    const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle', timeout: 60000 })
    if (shot.wait) {
      await page.waitForSelector(shot.wait, { timeout: 15000 })
    }
    if (shot.reposition) {
      await page.waitForSelector('.aip__sheet', { timeout: 15000 })
      await page.locator('#artist-image-position-y').fill('22')
      await page.getByRole('button', { name: 'Save' }).click()
      await page.waitForSelector('.aip__sheet', { state: 'detached', timeout: 10000 })
    }
    await page.waitForTimeout(350)
    const file = resolve(outDir, `${shot.name}-${width}.png`)
    await page.screenshot({ path: file, fullPage: !shot.viewportOnly })
    console.log(`${response?.status()} ${shot.name}-${width} -> ${file}`)
    await page.close()
  }
}

await browser.close()
