import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-gallery-stack-final')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3095'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

async function swipeStack(page, stack, times = 3) {
  const box = await stack.boundingBox()
  if (!box) throw new Error('stack has no box')
  for (let i = 0; i < times; i += 1) {
    const x = box.x + box.width * 0.68
    const y = box.y + box.height * 0.42
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x - Math.min(140, box.width * 0.42), y + 1, { steps: 10 })
    await page.mouse.up()
    await page.waitForTimeout(220)
  }
}

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
await page.goto(`${base}/__dev/artist-recap`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.addStyleTag({ content: 'nuxt-devtools, #nuxt-devtools-container { display: none !important }' })
await page.waitForSelector('.ar__from .fq-gstack')
await page.locator('.ar__from').scrollIntoViewIfNeeded()
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(outDir, '390-recap-galleries.png') })

const stack = page.locator('.ar__from .fq-gstack').first()
await swipeStack(page, stack, 3)
const browsed = {
  label: await stack.getAttribute('aria-label'),
  mark: await stack.locator('.fq-gstack__mark').innerText().catch(() => ''),
  visibility: await page.locator('.ar__from .ar__gallery-meta').first().innerText(),
}
await page.screenshot({ path: resolve(outDir, '390-recap-photo-4.png') })
await stack.click({ position: { x: 56, y: 64 } })
await page.waitForSelector('.fq-mlb', { timeout: 15000 })
const opened = {
  count: await page.locator('.fq-mlb__count').innerText().catch(() => ''),
  url: page.url(),
}
await page.screenshot({ path: resolve(outDir, '390-recap-lightbox.png') })
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
const after = {
  url: page.url(),
  lightbox: await page.locator('.fq-mlb').count(),
  viewer: await page.locator('.ngv').count(),
  label: await page.locator('.ar__from .fq-gstack').first().getAttribute('aria-label'),
}
await page.screenshot({ path: resolve(outDir, '390-recap-return.png') })
await page.close()

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 } })
await desktop.goto(`${base}/__dev/artist-recap`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await desktop.addStyleTag({ content: 'nuxt-devtools, #nuxt-devtools-container { display: none !important }' })
await desktop.waitForSelector('.ar__from .fq-gstack')
await desktop.locator('.ar__from').scrollIntoViewIfNeeded()
await desktop.waitForTimeout(400)
await desktop.screenshot({ path: resolve(outDir, '1280-recap-galleries.png') })
const dStack = desktop.locator('.ar__from .fq-gstack').first()
await swipeStack(desktop, dStack, 3)
await dStack.click({ position: { x: 70, y: 80 } })
await desktop.waitForSelector('.fq-mlb', { timeout: 15000 })
const desktopOpened = { count: await desktop.locator('.fq-mlb__count').innerText().catch(() => '') }
await desktop.screenshot({ path: resolve(outDir, '1280-recap-lightbox.png') })
await desktop.close()

await browser.close()
const report = { browsed, opened, after, desktopOpened }
writeFileSync(resolve(outDir, 'recap-report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
