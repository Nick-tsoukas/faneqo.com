/**
 * Fun Time Last photography capture: 390/1280/1440 at 1x and 2x.
 * Run: FANEQO_CAPTURE_ORIGIN=http://localhost:3040 node scripts/capture-gallery-photography.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-media-viewer')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3040'
const nightPath = '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

async function clean(page) {
  await page.evaluate(() => {
    document.querySelector('vite-error-overlay')?.remove()
    document.getElementById('nuxt-devtools-container')?.remove()
    document.querySelector('nuxt-devtools-frame')?.remove()
    document.querySelectorAll('[id*="nuxt-devtools"], [class*="nuxt-devtools"]').forEach((el) => el.remove())
  })
}

async function measure(page) {
  return page.evaluate(() => {
    const grid = document.querySelector('.ngv .fq-media-grid')
    const body = document.querySelector('.ngv__body')
    const img = document.querySelector('.fq-mlb__img')
    return {
      path: location.pathname + location.search,
      dpr: window.devicePixelRatio,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      kind: grid?.dataset.kind || '',
      viewerScroll: body ? {
        x: body.scrollWidth,
        y: body.scrollHeight,
        cw: body.clientWidth,
        ch: body.clientHeight,
      } : null,
      lightbox: img ? {
        src: img.currentSrc || img.src,
        natural: `${img.naturalWidth}x${img.naturalHeight}`,
        rendered: `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}`,
        fit: getComputedStyle(img).objectFit,
      } : null,
      cells: [...document.querySelectorAll('.ngv .fq-media-grid__cell img')].map((el) => {
        const box = el.getBoundingClientRect()
        const cell = el.closest('.fq-media-grid__cell')
        const cellBox = cell?.getBoundingClientRect()
        return {
          src: el.currentSrc || el.src,
          srcset: el.getAttribute('srcset') || '',
          sizes: el.getAttribute('sizes') || '',
          key: el.dataset.srcKey || '',
          natural: `${el.naturalWidth}x${el.naturalHeight}`,
          rendered: `${Math.round(box.width)}x${Math.round(box.height)}`,
          fit: getComputedStyle(el).objectFit,
          cell: cellBox ? `${Math.round(cellBox.width)}x${Math.round(cellBox.height)}` : '',
          cellRatio: cellBox && cellBox.height ? Number((cellBox.width / cellBox.height).toFixed(3)) : 0,
          imgRatio: el.naturalHeight ? Number((el.naturalWidth / el.naturalHeight).toFixed(3)) : 0,
        }
      }),
    }
  })
}

async function openPublicGallery(page) {
  await page.waitForSelector('.pn__chapter', { timeout: 25000 })
  await page.waitForTimeout(600)
  const named = page.locator('.pn__chapter').filter({ hasText: /Fun Time/i }).first()
  const btn = (await named.count()) ? named : page.locator('.pn__chapter').last()
  await btn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(400)
  await btn.click({ force: true })
  await page.waitForSelector('.ngv .fq-media-grid__cell img', { timeout: 20000 })
  await page.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('.ngv .fq-media-grid__cell img')]
    return imgs.length >= 3 && imgs.every((img) => img.naturalWidth > 0)
  }, { timeout: 15000 })
  const grid = page.locator('.ngv .fq-media-grid').first()
  if (await grid.count()) await grid.scrollIntoViewIfNeeded()
}

async function shot({ name, width, height, dpr, lightbox = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  })
  const response = await page.goto(`${base}${nightPath}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(900)
  await clean(page)
  await openPublicGallery(page)
  if (lightbox) {
    await page.locator('.ngv .fq-media-grid__cell').first().click({ force: true })
    await page.waitForSelector('.fq-mlb__img', { timeout: 8000 })
    await page.waitForFunction(() => {
      const img = document.querySelector('.fq-mlb__img')
      return !!img && img.naturalWidth > 0
    }, { timeout: 8000 })
  }
  await page.waitForTimeout(400)
  const file = resolve(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  const gridShot = page.locator('.ngv .fq-media-grid').first()
  if (!lightbox && await gridShot.count()) {
    await gridShot.screenshot({ path: resolve(outDir, `${name}-grid.png`) })
  }
  const info = await measure(page)
  info.status = response?.status() || 0
  writeFileSync(resolve(outDir, `${name}.json`), JSON.stringify(info, null, 2))
  const lead = info.cells[0]
  console.log(`${info.status} ${name} kind=${info.kind} lead=${lead?.natural} ${lead?.rendered} r=${lead?.cellRatio} -> ${file}`)
  await page.close()
  return info
}

await shot({ name: 'photo-390-1x', width: 390, height: 844, dpr: 1 })
await shot({ name: 'photo-390-2x', width: 390, height: 844, dpr: 2 })
await shot({ name: 'photo-1280-1x', width: 1280, height: 900, dpr: 1 })
await shot({ name: 'photo-1280-2x', width: 1280, height: 900, dpr: 2 })
await shot({ name: 'photo-1440-1x', width: 1440, height: 900, dpr: 1 })
await shot({ name: 'photo-1440-2x', width: 1440, height: 900, dpr: 2 })
await shot({ name: 'photo-lightbox-1280', width: 1280, height: 900, dpr: 2, lightbox: true })

await browser.close()
console.log('capture-gallery-photography: done')
