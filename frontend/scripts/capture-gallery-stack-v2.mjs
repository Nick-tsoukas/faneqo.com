import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-gallery-stack-v2')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3095'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

function measureStacks() {
  const stacks = [...document.querySelectorAll('.fq-gstack')]
  return {
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    scrollY: window.scrollY,
    stacks: stacks.map((el) => ({
      label: el.getAttribute('aria-label'),
      browsable: el.classList.contains('is-browsable'),
      kind: [...el.classList].find((c) => ['is-single', 'is-pair', 'is-stack', 'is-empty'].includes(c)),
      imgs: el.querySelectorAll('img').length,
      mark: el.querySelector('.fq-gstack__mark')?.textContent || '',
      touch: getComputedStyle(el).touchAction,
      cursor: getComputedStyle(el).cursor,
    })),
  }
}

async function prep(page) {
  await page.addStyleTag({
    content: 'nuxt-devtools, #nuxt-devtools-container, vite-error-overlay { display: none !important }',
  })
  await page.waitForSelector('.fq-gstack', { timeout: 30000 })
  await page.waitForTimeout(500)
}

const report = []
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
const url = `${base}/__dev/galleries-archive`
const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(page)
const idle = await page.evaluate(measureStacks)
report.push({ step: 'idle-390', status: res?.status(), ...idle })
await page.screenshot({ path: resolve(outDir, '390-idle.png') })

const first = page.locator('.fq-gstack').first()
const box = await first.boundingBox()
const start = { x: box.x + box.width * 0.62, y: box.y + box.height * 0.42 }
await page.mouse.move(start.x, start.y)
await page.mouse.down()
await page.mouse.move(start.x - 28, start.y + 2, { steps: 4 })
await page.mouse.move(start.x - 96, start.y + 4, { steps: 8 })
await page.waitForTimeout(40)
const mid = await page.evaluate(() => {
  const el = document.querySelector('.fq-gstack')
  return {
    dragging: el.classList.contains('is-dragging'),
    browsing: el.classList.contains('is-browsing'),
    mark: el.querySelector('.fq-gstack__mark')?.textContent || '',
    transform: el.querySelector('.fq-gstack__print.is-front')?.style.transform || '',
    href: location.pathname,
  }
})
report.push({ step: 'mid-drag', ...mid })
await page.screenshot({ path: resolve(outDir, '390-mid-drag.png') })
await page.mouse.up()
await page.waitForTimeout(280)
const after = await page.evaluate(() => {
  const el = document.querySelector('.fq-gstack')
  const front = el?.querySelector('.fq-gstack__print.is-front img')
  return {
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    label: el?.getAttribute('aria-label'),
    mark: el?.querySelector('.fq-gstack__mark')?.textContent || '',
    imgs: el?.querySelectorAll('img').length,
    frontSrc: front?.getAttribute('src') || '',
    frontBroken: front?.classList.contains('is-broken') || false,
    frontNatural: front?.naturalWidth || 0,
    href: location.pathname,
  }
})
report.push({ step: 'after-commit', ...after })
await page.screenshot({ path: resolve(outDir, '390-after-swipe.png') })

const session = await page.context().newCDPSession(page)
const beforeY = await page.evaluate(() => window.scrollY)
const vx = Math.round(start.x)
const vy = Math.round(start.y + 24)
await session.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: vx, y: vy }],
})
for (const y of [vy + 40, vy + 90, vy + 150, vy + 220]) {
  await session.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: vx + 2, y }],
  })
}
await session.send('Input.dispatchTouchEvent', {
  type: 'touchEnd',
  touchPoints: [],
})
await page.waitForTimeout(220)
const afterY = await page.evaluate(() => ({
  scrollY: window.scrollY,
  href: location.pathname,
  firstLabel: document.querySelector('.fq-gstack')?.getAttribute('aria-label'),
}))
report.push({ step: 'vertical-touch-scroll', beforeY, ...afterY })
await page.screenshot({ path: resolve(outDir, '390-after-vertical.png') })

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(150)
const beforeHref = page.url()
await first.click({ position: { x: 48, y: 56 } })
await page.waitForTimeout(280)
report.push({
  step: 'tap-after-browse',
  beforeHref,
  afterHref: page.url(),
  navigated: page.url() !== beforeHref,
})

const page2 = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
await page2.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(page2)
const tapHref = page2.url()
await page2.locator('.fq-gstack').first().click({ position: { x: 80, y: 80 } })
await page2.waitForTimeout(250)
report.push({
  step: 'fresh-tap',
  before: tapHref,
  after: page2.url(),
  navigated: page2.url() !== tapHref,
})

const pageScroll = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
await pageScroll.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(pageScroll)
const scrollBox = await pageScroll.locator('.fq-gstack').first().boundingBox()
const scrollSession = await pageScroll.context().newCDPSession(pageScroll)
const scrollBefore = await pageScroll.evaluate(() => window.scrollY)
const sx = Math.round(scrollBox.x + scrollBox.width * 0.5)
const sy = Math.round(scrollBox.y + scrollBox.height * 0.45)
await scrollSession.send('Input.dispatchTouchEvent', {
  type: 'touchStart',
  touchPoints: [{ x: sx, y: sy }],
})
for (const y of [sy + 36, sy + 88, sy + 150, sy + 230]) {
  await scrollSession.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: sx + 1, y }],
  })
}
await scrollSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
await pageScroll.waitForTimeout(220)
report.push({
  step: 'fresh-vertical-touch',
  beforeY: scrollBefore,
  ...(await pageScroll.evaluate(() => ({
    scrollY: window.scrollY,
    label: document.querySelector('.fq-gstack')?.getAttribute('aria-label'),
  }))),
})
await pageScroll.close()

const pageSwipeTap = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  hasTouch: true,
  isMobile: true,
})
await pageSwipeTap.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(pageSwipeTap)
const swipeTap = pageSwipeTap.locator('.fq-gstack').first()
const stb = await swipeTap.boundingBox()
await pageSwipeTap.mouse.move(stb.x + stb.width * 0.6, stb.y + stb.height * 0.4)
await pageSwipeTap.mouse.down()
await pageSwipeTap.mouse.move(stb.x + stb.width * 0.6 - 100, stb.y + stb.height * 0.4 + 2, { steps: 8 })
await pageSwipeTap.mouse.up()
await pageSwipeTap.waitForTimeout(320)
const swipeTapBefore = pageSwipeTap.url()
const swipeTapLabel = await swipeTap.getAttribute('aria-label')
await swipeTap.click({ position: { x: 52, y: 60 } })
await pageSwipeTap.waitForTimeout(280)
report.push({
  step: 'swipe-then-tap',
  label: swipeTapLabel,
  before: swipeTapBefore,
  after: pageSwipeTap.url(),
  navigated: pageSwipeTap.url() !== swipeTapBefore,
})
await pageSwipeTap.close()

const page3 = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
})
await page3.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(page3)
await page3.locator('.fq-gstack').first().focus()
await page3.keyboard.press('ArrowRight')
await page3.waitForTimeout(80)
await page3.keyboard.press('ArrowRight')
const keys = await page3.evaluate(measureStacks)
report.push({ step: 'keyboard-next', first: keys.stacks[0] })
await page3.screenshot({ path: resolve(outDir, '390-keyboard.png') })
await page3.keyboard.press('ArrowLeft')
await page3.keyboard.press('ArrowLeft')
await page3.keyboard.press('ArrowLeft')
const keysBack = await page3.evaluate(measureStacks)
report.push({ step: 'keyboard-boundary', first: keysBack.stacks[0] })

const desktop = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 1,
})
await desktop.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
await prep(desktop)
const deskStack = desktop.locator('.fq-gstack').first()
await deskStack.hover()
await desktop.waitForTimeout(180)
const desk = await desktop.evaluate(measureStacks)
report.push({ step: 'desktop-hover', first: desk.stacks[0], overflowX: desk.overflowX })
await desktop.screenshot({ path: resolve(outDir, '1280-hover.png') })
const dbox = await deskStack.boundingBox()
await desktop.mouse.move(dbox.x + dbox.width * 0.6, dbox.y + dbox.height * 0.4)
await desktop.mouse.down()
await desktop.mouse.move(dbox.x + dbox.width * 0.6 - 120, dbox.y + dbox.height * 0.4 + 3, { steps: 10 })
await desktop.waitForTimeout(40)
const deskDrag = await desktop.evaluate(() => {
  const el = document.querySelector('.fq-gstack')
  return {
    dragging: el.classList.contains('is-dragging'),
    cursor: getComputedStyle(el).cursor,
    transform: el.querySelector('.fq-gstack__print.is-front')?.style.transform || '',
  }
})
report.push({ step: 'desktop-drag', ...deskDrag, grabbing: deskDrag.cursor === 'grabbing' })
await desktop.screenshot({ path: resolve(outDir, '1280-drag.png') })
await desktop.mouse.up()
await desktop.waitForTimeout(240)
const deskAfter = await desktop.evaluate(measureStacks)
report.push({ step: 'desktop-after', first: deskAfter.stacks[0] })
await desktop.screenshot({ path: resolve(outDir, '1280-after.png') })

for (const vp of [
  { name: '390x720', width: 390, height: 720 },
  { name: '430x932', width: 430, height: 932 },
  { name: '360x740', width: 360, height: 740 },
]) {
  const extra = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  })
  await extra.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await prep(extra)
  const m = await extra.evaluate(measureStacks)
  report.push({ step: vp.name, overflowX: m.overflowX, first: m.stacks[0], pair: m.stacks[3], single: m.stacks[5] })
  await extra.screenshot({ path: resolve(outDir, `${vp.name}.png`) })
  await extra.close()
}

writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
await browser.close()
