import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-public-night-hero')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const shots = [
  { name: 'public-artist-fallback', path: '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f', widths: [390, 1280] },
  { name: 'public-night-hero', path: '/__dev/artist-world?hero=1', widths: [390, 1280, 1440], wait: '.pn__stage' },
  { name: 'preview-fan-view', path: '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f?from=/fans/recaps/88', widths: [390, 1280] },
]

for (const shot of shots) {
  for (const width of shot.widths) {
    const page = await browser.newPage({
      viewport: { width, height: width >= 768 ? 1024 : 844 },
      deviceScaleFactor: 2,
    })
    const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle', timeout: 60000 })
    if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 15000 }).catch(() => {})
    await page.evaluate(() => {
      document.querySelector('vite-error-overlay')?.remove()
      document.getElementById('nuxt-devtools-container')?.remove()
    })
    await page.waitForTimeout(500)
    const file = resolve(outDir, `${shot.name}-${width}.png`)
    await page.screenshot({ path: file, fullPage: width < 768 })
    console.log(`${response?.status()} ${shot.name}-${width} -> ${file}`)
    await page.close()
  }
}

await browser.close()
