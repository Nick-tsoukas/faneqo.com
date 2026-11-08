import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-night-hero')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3055'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const only = String(process.env.FANEQO_CAPTURE_ONLY || '')
const shots = only === 'edit'
  ? [
    { name: 'edit-artist-fallback', path: '/__dev/artist-recap?edit=1', widths: [390, 1280], wait: '.ne__sheet', viewportOnly: true },
    { name: 'edit-night-hero', path: '/__dev/artist-recap?hero=1&edit=1', widths: [390, 1280], wait: '.ne__sheet', viewportOnly: true },
  ]
  : only === 'adjust'
  ? [
    { name: 'recap-artist-fallback', path: '/__dev/artist-recap?combo=artist-event-night', widths: [390, 1280] },
    { name: 'recap-night-hero', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [390, 1280] },
    { name: 'position-night-hero', path: '/__dev/artist-recap?hero=1&adjust=1', widths: [390, 1280], wait: '.aip__sheet', viewportOnly: true },
  ]
  : [
    { name: 'recap-artist-fallback', path: '/__dev/artist-recap?combo=artist-event-night', widths: [390, 1280] },
    { name: 'recap-night-hero', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [390, 1280] },
    { name: 'edit-artist-fallback', path: '/__dev/artist-recap?edit=1', widths: [390, 1280], wait: '.ne__sheet', viewportOnly: true },
    { name: 'edit-night-hero', path: '/__dev/artist-recap?hero=1&edit=1', widths: [390, 1280], wait: '.ne__sheet', viewportOnly: true },
    { name: 'position-night-hero', path: '/__dev/artist-recap?hero=1&adjust=1', widths: [390, 1280], wait: '.aip__sheet', viewportOnly: true },
  ]

for (const shot of shots) {
  for (const width of shot.widths) {
    const page = await browser.newPage({
      viewport: { width, height: width >= 768 ? 1024 : 844 },
      deviceScaleFactor: 2,
    })
    const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle', timeout: 60000 })
    if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 15000 })
    await page.evaluate(() => {
      document.querySelector('vite-error-overlay')?.remove()
      document.getElementById('nuxt-devtools-container')?.remove()
    })
    await page.waitForTimeout(400)
    const file = resolve(outDir, `${shot.name}-${width}.png`)
    await page.screenshot({ path: file, fullPage: !shot.viewportOnly })
    console.log(`${response?.status()} ${shot.name}-${width} -> ${file}`)
    await page.close()
  }
}

await browser.close()
