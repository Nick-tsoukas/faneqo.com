import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-recap-type')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3065'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const shots = [
  { name: 'recap-full', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [320, 390, 430, 1280], full: true },
  { name: 'recap-lineup', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [320, 390, 430, 1280], scroll: '.ar__lineup-block', full: false },
  { name: 'recap-story', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [390, 1280], scroll: '.ar__story-block', full: false },
  { name: 'recap-lower', path: '/__dev/artist-recap?combo=artist-event-night&hero=1', widths: [390, 1280], scroll: '.ar__after', full: false },
]

for (const shot of shots) {
  for (const width of shot.widths) {
    const page = await browser.newPage({
      viewport: { width, height: width >= 768 ? 1100 : 844 },
      deviceScaleFactor: 2,
    })
    const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('.ar__lineup-block, .ar__empty', { timeout: 20000 })
    await page.evaluate(() => {
      document.querySelector('vite-error-overlay')?.remove()
      document.getElementById('nuxt-devtools-container')?.remove()
    })
    if (shot.scroll) {
      await page.waitForSelector(shot.scroll, { timeout: 15000 })
      await page.locator(shot.scroll).scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
    } else {
      await page.waitForTimeout(350)
    }
    const overflow = await page.evaluate(() => ({
      x: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      lineupW: document.querySelector('.ar__lineup')?.getBoundingClientRect().width || 0,
      storyW: document.querySelector('.ar__story')?.getBoundingClientRect().width || 0,
    }))
    const file = resolve(outDir, `${shot.name}-${width}.png`)
    await page.screenshot({ path: file, fullPage: Boolean(shot.full) })
    console.log(`${response?.status()} ${shot.name}-${width} overflowX=${overflow.x} lineup=${Math.round(overflow.lineupW)} story=${Math.round(overflow.storyW)} -> ${file}`)
    await page.close()
  }
}

await browser.close()
