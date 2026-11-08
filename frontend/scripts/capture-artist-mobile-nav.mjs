import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-artist-nav')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3055'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const widths = [320, 390, 430]
const shots = [
  { name: 'dashboard', path: '/__dev/artist-nav?tab=dashboard' },
  { name: 'messages', path: '/__dev/artist-nav?tab=messages' },
  { name: 'artist', path: '/__dev/artist-nav?tab=artist' },
  { name: 'analytics', path: '/__dev/artist-nav?tab=analytics' },
  { name: 'share', path: '/__dev/artist-nav?tab=dashboard&share=1', wait: '.asq[role="dialog"]' },
  { name: 'recap', path: '/__dev/artist-recap?dock=1', viewportOnly: true },
]

const context = await browser.newContext({
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})

for (const width of widths) {
  const page = await context.newPage()
  await page.setViewportSize({ width, height: 844 })
  for (const shot of shots) {
    try {
      const response = await page.goto(`${base}${shot.path}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      })
      await page.waitForSelector('nav.fq-artist-nav', { timeout: 20000 })
      await page.addStyleTag({
        content: '[data-v-inspector], .nuxt-devtools-float, button[aria-label="Toggle Nuxt DevTools"], button[aria-label="Toggle Component Inspector"] { display: none !important; }',
      })
      if (shot.wait) {
        await page.waitForSelector(shot.wait, { timeout: 12000 })
      }
      await page.waitForTimeout(250)
      const file = resolve(outDir, `${shot.name}-${width}.png`)
      await page.screenshot({ path: file, fullPage: !shot.viewportOnly })
      console.log(`${response?.status()} ${shot.name}-${width} -> ${file}`)
    } catch (err) {
      console.error(`FAIL ${shot.name}-${width}: ${err.message}`)
    }
  }
  await page.close()
}

await browser.close()
