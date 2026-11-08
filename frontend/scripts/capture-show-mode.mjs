import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-show-mode')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const shots = [
  { name: 'idle-first', path: '/__dev/show-mode?state=idle-first' },
  { name: 'idle-returning', path: '/__dev/show-mode?state=idle-returning' },
  { name: 'setup', path: '/__dev/show-mode?state=setup', wait: '.sms__sheet', viewportOnly: true },
  { name: 'live', path: '/__dev/show-mode?state=live' },
  { name: 'end-confirm', path: '/__dev/show-mode?state=end-confirm', wait: '.end__sheet', viewportOnly: true },
  { name: 'generating', path: '/__dev/show-mode?state=generating' },
  { name: 'ready', path: '/__dev/show-mode?state=ready' },
  { name: 'timeout', path: '/__dev/show-mode?state=timeout' },
]

const widths = [320, 390, 430, 768, 1024, 1280, 1440, 1600]

for (const shot of shots) {
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: width >= 768 ? 1024 : 844 },
      deviceScaleFactor: 2,
    })
    const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await page.addStyleTag({
      content: 'nuxt-devtools, #nuxt-devtools-container, vite-error-overlay { display: none !important }',
    })
    await page.waitForSelector(shot.wait || '.show-mode-card', { timeout: 15000 })
    await page.waitForTimeout(400)
    const file = resolve(outDir, `${shot.name}-${width}.png`)
    await page.screenshot({ path: file, fullPage: !shot.viewportOnly })
    console.log(`${response?.status()} ${shot.name}-${width} -> ${file}`)
    await page.close()
  }
}

await browser.close()
