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
const report = []

async function prep(page) {
  await page.addStyleTag({
    content: 'nuxt-devtools, #nuxt-devtools-container, vite-error-overlay { display: none !important }',
  })
}

async function waitScrollable(page, minHeight = 2400) {
  await page.waitForFunction(() => {
    const html = document.documentElement
    return html.classList.contains('fq-archive-lab')
      && html.scrollHeight >= 2400
  }, { timeout: 20000 }).catch(() => {})
  const metrics = await page.evaluate((min) => {
    const el = document.scrollingElement || document.documentElement
    return {
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      maxY: Math.max(0, el.scrollHeight - el.clientHeight),
      lab: document.documentElement.classList.contains('fq-archive-lab'),
      enough: el.scrollHeight >= min,
    }
  }, minHeight)
  return metrics
}

async function scrollToY(page, y) {
  await page.evaluate((target) => {
    const el = document.scrollingElement || document.documentElement
    el.scrollTo(0, target)
    window.scrollTo(0, target)
  }, y)
  await page.waitForFunction((target) => {
    const current = window.scrollY || document.scrollingElement?.scrollTop || 0
    return current >= target - 8
  }, y, { timeout: 4000 }).catch(() => {})
  return page.evaluate(() => window.scrollY || document.scrollingElement?.scrollTop || 0)
}

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

async function withPage(viewport, fn) {
  const page = await browser.newPage({
    viewport,
    deviceScaleFactor: viewport.width <= 430 ? 2 : 1,
    hasTouch: viewport.width <= 430,
    isMobile: viewport.width <= 430,
  })
  try {
    return await fn(page)
  } finally {
    await page.close()
  }
}

const nightProof = await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/__dev/artist-world?hero=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.pn .fq-gstack')
  await page.waitForTimeout(700)
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  await page.screenshot({ path: resolve(outDir, '390-night-hero.png') })
  await page.locator('.pn__from').scrollIntoViewIfNeeded()
  await page.waitForTimeout(350)
  await page.screenshot({ path: resolve(outDir, '390-night-galleries.png') })

  const stack = page.locator('.pn .fq-gstack').first()
  await swipeStack(page, stack, 3)
  const browsedLabel = await stack.getAttribute('aria-label')
  const browsedMark = await stack.locator('.fq-gstack__mark').innerText().catch(() => '')
  await page.screenshot({ path: resolve(outDir, '390-night-photo-4.png') })

  await stack.click({ position: { x: 56, y: 64 } })
  await page.waitForSelector('.fq-mlb', { timeout: 15000 })
  await page.waitForTimeout(350)
  const opened = {
    count: await page.locator('.fq-mlb__count').innerText().catch(() => ''),
    lightbox: await page.locator('.fq-mlb').count(),
    viewer: await page.locator('.ngv').count(),
    url: page.url(),
    currentThumb: await page.locator('.fq-mlb__thumb.is-current').count(),
  }
  await page.screenshot({ path: resolve(outDir, '390-night-lightbox.png') })

  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(280)
  const afterClose = {
    url: page.url(),
    lightbox: await page.locator('.fq-mlb').count(),
    viewer: await page.locator('.ngv').count(),
    label: await page.locator('.pn .fq-gstack').first().getAttribute('aria-label'),
    mark: await page.locator('.pn .fq-gstack').first().locator('.fq-gstack__mark').innerText().catch(() => ''),
    overflowX: await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1),
  }
  await page.screenshot({ path: resolve(outDir, '390-night-return.png') })

  return { overflowX, browsedLabel, browsedMark, opened, afterClose }
})
report.push({ step: 'night-390', ...nightProof })

const reducedProof = await withPage({ width: 390, height: 844 }, async (page) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`${base}/__dev/artist-world?hero=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.pn .fq-gstack')
  await page.locator('.pn__from').scrollIntoViewIfNeeded()
  const stack = page.locator('.pn .fq-gstack').first()
  await swipeStack(page, stack, 3)
  await stack.click({ position: { x: 56, y: 64 } })
  await page.waitForSelector('.fq-mlb', { timeout: 15000 })
  const count = await page.locator('.fq-mlb__count').innerText().catch(() => '')
  await page.screenshot({ path: resolve(outDir, '390-night-reduced.png') })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(160)
  await page.keyboard.press('Escape')
  const mark = await page.locator('.pn .fq-gstack').first().locator('.fq-gstack__mark').innerText().catch(() => '')
  return { count, mark }
})
report.push({ step: 'night-reduced', ...reducedProof })

const lockedProof = await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/__dev/artist-world?hero=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.pn__from')
  await page.locator('.pn__from').scrollIntoViewIfNeeded()
  const locked = page.locator('.pn__chapter.is-locked')
  const lockedCount = await locked.count()
  if (!lockedCount) return { lockedCount }
  await locked.first().scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  await locked.first().click({ force: true })
  const opened = await page.locator('.ngv').waitFor({ timeout: 8000 }).then(() => true).catch(() => false)
  const veil = {
    opened,
    lightbox: await page.locator('.fq-mlb').count(),
    lockCopy: await page.locator('.ngv__lock-copy').innerText().catch(() => ''),
    grid: await page.locator('.ngv .fq-mgrid').count(),
  }
  await page.screenshot({ path: resolve(outDir, '390-night-locked.png') })
  return { lockedCount, ...veil }
})
report.push({ step: 'night-locked', ...lockedProof })

for (const viewport of [
  { width: 360, height: 740, name: '360' },
  { width: 430, height: 932, name: '430' },
]) {
  const shot = await withPage(viewport, async (page) => {
    await page.goto(`${base}/__dev/artist-world?hero=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await prep(page)
    await page.waitForSelector('.pn .fq-gstack')
    await page.locator('.pn__from').scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)
    await page.screenshot({ path: resolve(outDir, `${viewport.name}-night-galleries.png`) })
    const overflowX = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
    return { overflowX }
  })
  report.push({ step: `night-${viewport.name}`, ...shot })
}

for (const viewport of [
  { width: 1280, height: 900, name: '1280' },
  { width: 1440, height: 960, name: '1440' },
]) {
  const shot = await withPage(viewport, async (page) => {
    await page.goto(`${base}/__dev/artist-world?hero=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await prep(page)
    await page.waitForSelector('.pn .fq-gstack')
    await page.screenshot({ path: resolve(outDir, `${viewport.name}-night-hero.png`) })
    await page.locator('.pn__from').scrollIntoViewIfNeeded()
    await page.waitForTimeout(400)
    await page.screenshot({ path: resolve(outDir, `${viewport.name}-night-galleries.png`) })
    const stack = page.locator('.pn .fq-gstack').first()
    await swipeStack(page, stack, 3)
    await stack.click({ position: { x: 70, y: 80 } })
    await page.waitForSelector('.fq-mlb', { timeout: 15000 })
    const count = await page.locator('.fq-mlb__count').innerText().catch(() => '')
    await page.screenshot({ path: resolve(outDir, `${viewport.name}-night-lightbox.png`) })
    return { count }
  })
  report.push({ step: `night-${viewport.name}`, ...shot })
}

const archiveProof = await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/__dev/galleries-archive?scroll=1`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.fq-gstack')
  const metrics = await waitScrollable(page)
  const target = Math.min(900, Math.max(720, Math.floor(metrics.maxY * 0.45)))
  const before = await scrollToY(page, target)
  await page.screenshot({ path: resolve(outDir, '390-archive-scrolled.png') })
  if (before < 700) {
    return { metrics, target, before, after: before, proven: false, reason: 'could-not-scroll' }
  }

  const recordedBefore = await page.evaluate(() => window.scrollY)
  const visible = page.locator('.fq-gstack').nth(2)
  const stack = (await visible.count()) ? visible : page.locator('.fq-gstack').first()
  await stack.click({ position: { x: 52, y: 60 }, force: true })
  await page.waitForSelector('.aw__title, .fq-mlb', { timeout: 20000 })
  await page.waitForTimeout(250)
  await page.screenshot({ path: resolve(outDir, '390-archive-opened.png') })
  await page.goBack({ waitUntil: 'domcontentloaded' })
  await page.waitForSelector('.fq-gstack', { timeout: 20000 })
  await page.waitForTimeout(80)
  let after = await page.evaluate(() => window.scrollY)
  for (let i = 0; i < 12 && after < 200; i += 1) {
    await page.waitForTimeout(80)
    after = await page.evaluate(() => window.scrollY)
  }
  const delta = Math.abs(after - recordedBefore)
  await page.screenshot({ path: resolve(outDir, '390-archive-restored.png') })
  return {
    metrics,
    target,
    before: recordedBefore,
    after,
    delta,
    proven: recordedBefore >= 700 && after >= 700 && delta <= 80,
  }
})
report.push({ step: 'archive-scroll', ...archiveProof })

const mixedProof = await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/__dev/galleries-archive`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.fq-gstack')
  const stack = page.locator('.fq-gstack').first()
  const beforeBox = await stack.boundingBox()
  await swipeStack(page, stack, 1)
  const midBox = await stack.boundingBox()
  await swipeStack(page, stack, 1)
  const afterBox = await stack.boundingBox()
  await page.screenshot({ path: resolve(outDir, '390-archive-mixed.png') })
  const heightJump = Math.max(
    Math.abs((midBox?.height || 0) - (beforeBox?.height || 0)),
    Math.abs((afterBox?.height || 0) - (beforeBox?.height || 0)),
  )
  return {
    beforeH: beforeBox?.height || 0,
    midH: midBox?.height || 0,
    afterH: afterBox?.height || 0,
    heightJump,
    stable: heightJump <= 8,
  }
})
report.push({ step: 'mixed-orientation', ...mixedProof })

const desktopArchive = await withPage({ width: 1280, height: 900 }, async (page) => {
  await page.goto(`${base}/__dev/galleries-archive`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await prep(page)
  await page.waitForSelector('.fq-gstack')
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(outDir, '1280-archive-idle.png') })
})
report.push({ step: 'archive-1280', ok: true })

await browser.close()
writeFileSync(resolve(outDir, 'report.json'), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
