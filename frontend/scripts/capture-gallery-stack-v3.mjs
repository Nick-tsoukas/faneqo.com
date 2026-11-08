import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-gallery-stack-v3')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3095'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

async function prep(page) {
  await page.addStyleTag({
    content: 'nuxt-devtools, #nuxt-devtools-container, vite-error-overlay { display: none !important }',
  })
}

const report = []
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
await page.goto(`${base}/__dev/galleries-archive`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await prep(page)
await page.waitForSelector('.fq-gstack')
await page.waitForTimeout(800)
const facts = await page.locator('.fq-gitem__facts').nth(2).innerText()
report.push({
  step: 'idle',
  facts,
  overflowX: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
  scrollY: await page.evaluate(() => window.scrollY),
})
await page.screenshot({ path: resolve(outDir, '390-idle.png') })

const stack = page.locator('.fq-gstack').first()
const box = await stack.boundingBox()
for (let i = 0; i < 3; i += 1) {
  await page.mouse.move(box.x + box.width * 0.62, box.y + box.height * 0.42)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width * 0.62 - 110, box.y + box.height * 0.42 + 2, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(240)
}
const beforeOpen = {
  label: await stack.getAttribute('aria-label'),
  scrollY: await page.evaluate(() => window.scrollY),
}
report.push({ step: 'browsed', ...beforeOpen })
await page.screenshot({ path: resolve(outDir, '390-photo-4.png') })

await stack.click({ position: { x: 52, y: 60 } })
await page.waitForSelector('.aw__title, .fq-mlb', { timeout: 20000 })
await page.waitForTimeout(400)
const opened = {
  url: page.url(),
  lightbox: await page.locator('.fq-mlb').count(),
  count: await page.locator('.fq-mlb__count').innerText().catch(() => ''),
  img: await page.locator('.fq-mlb__img').getAttribute('src').catch(() => ''),
}
report.push({ step: 'opened', ...opened })
await page.screenshot({ path: resolve(outDir, '390-lightbox.png') })

await page.goBack({ waitUntil: 'domcontentloaded' })
await page.waitForSelector('.fq-gstack')
await page.waitForTimeout(350)
const back = {
  url: page.url(),
  label: await page.locator('.fq-gstack').first().getAttribute('aria-label'),
  scrollY: await page.evaluate(() => window.scrollY),
  lightbox: await page.locator('.fq-mlb').count(),
}
report.push({ step: 'back', ...back })
await page.screenshot({ path: resolve(outDir, '390-back.png') })

const q = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await q.goto(`${base}/__dev/gallery-open/lab-1?from=/__dev/galleries-archive&photo=4`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await prep(q)
await q.waitForSelector('.aw__title, .fq-mlb', { timeout: 20000 })
await q.waitForTimeout(400)
report.push({
  step: 'query-photo-4',
  lightbox: await q.locator('.fq-mlb').count(),
  count: await q.locator('.fq-mlb__count').innerText().catch(() => ''),
})
await q.screenshot({ path: resolve(outDir, '390-query-photo.png') })

const desk = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
await desk.goto(`${base}/__dev/galleries-archive`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await prep(desk)
await desk.waitForSelector('.fq-gstack')
const dbox = await desk.locator('.fq-gstack').first().boundingBox()
await desk.mouse.move(dbox.x + dbox.width * 0.6, dbox.y + dbox.height * 0.4)
await desk.mouse.down()
await desk.mouse.move(dbox.x + dbox.width * 0.6 - 140, dbox.y + dbox.height * 0.4, { steps: 10 })
await desk.mouse.up()
await desk.waitForTimeout(250)
await desk.locator('.fq-gstack').first().click({ position: { x: 80, y: 80 } })
await desk.waitForSelector('.aw__title, .fq-mlb', { timeout: 20000 })
await desk.waitForTimeout(400)
report.push({
  step: 'desktop-open',
  url: desk.url(),
  lightbox: await desk.locator('.fq-mlb').count(),
  count: await desk.locator('.fq-mlb__count').innerText().catch(() => ''),
})
await desk.screenshot({ path: resolve(outDir, '1280-lightbox.png') })

writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
