/**
 * Capture Messaging lab states for visual review.
 * Reuses the existing frontend at FANEQO_CAPTURE_ORIGIN (default 3095).
 */
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'

const origin = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
const chromePath = process.env.FANEQO_CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const outDir = resolve('.tmp-messaging-lab')
mkdirSync(outDir, { recursive: true })

const jobs = [
  { name: 'd-artist-inbox', w: 1280, h: 900, path: '/__dev/messages?case=artist-inbox' },
  { name: 'd-artist-empty-thread', w: 1280, h: 900, path: '/__dev/messages?case=artist-empty-thread' },
  { name: 'd-artist-unread', w: 1440, h: 900, path: '/__dev/messages?case=artist-unread' },
  { name: 'd-artist-wide', w: 1920, h: 1080, path: '/__dev/messages?case=artist-inbox' },
  { name: 'd-fan-thread', w: 1280, h: 900, path: '/__dev/messages?case=fan-thread' },
  { name: 'd-artist-request', w: 1280, h: 900, path: '/__dev/messages?case=artist-request' },
  { name: 'm-artist-thread', w: 390, h: 844, path: '/__dev/messages?case=artist-inbox&bare=1' },
  { name: 'm-fan-thread', w: 390, h: 844, path: '/__dev/messages?case=fan-thread&bare=1' },
  { name: 'm-artist-list', w: 390, h: 844, path: '/__dev/messages?case=artist-empty-thread&bare=1' },
  { name: 'm-360', w: 360, h: 740, path: '/__dev/messages?case=artist-inbox&bare=1' },
]

const browser = await chromium.launch({ executablePath: chromePath, headless: true })
for (const job of jobs) {
  const page = await browser.newPage({
    viewport: { width: job.w, height: job.h },
    deviceScaleFactor: job.w <= 430 ? 2 : 1,
    hasTouch: job.w <= 430,
    isMobile: job.w <= 430,
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${origin}${job.path}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForSelector('.fq-inbox, .dev-msg__stage', { timeout: 20000 })
  await page.waitForTimeout(700)
  await page.screenshot({ path: resolve(outDir, `${job.name}.png`), fullPage: false })
  await page.close()
  console.log(`wrote ${job.name}`)
}
await browser.close()
console.log(`done ${outDir}`)
