/**
 * Capture Recap / Night Photo / Gallery viewer after the defect pass.
 * Run: FANEQO_CAPTURE_ORIGIN=http://localhost:3000 node scripts/capture-media-viewer-defects.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-media-viewer')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
const recapId = process.env.FANEQO_RECAP_ID || ''
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
    const img = document.querySelector('.fq-mlb__img')
    const stage = document.querySelector('.fq-mlb__stage')
    const viewer = document.querySelector('.ngv')
    const body = document.querySelector('.ngv__body')
    const rail = document.querySelector('.ar__galleries')
    const fit = img ? getComputedStyle(img).objectFit : ''
    const imgBox = img?.getBoundingClientRect()
    const stageBox = stage?.getBoundingClientRect()
    return {
      path: location.pathname + location.search,
      title: document.title,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      bodyLock: document.body.style.overflow || document.documentElement.style.overflow || document.body.dataset.fqOverlayLock || '',
      lightbox: !!img,
      fit,
      imgW: imgBox ? Math.round(imgBox.width) : 0,
      imgH: imgBox ? Math.round(imgBox.height) : 0,
      stageW: stageBox ? Math.round(stageBox.width) : 0,
      stageH: stageBox ? Math.round(stageBox.height) : 0,
      natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : '',
      viewer: !!viewer,
      viewerScroll: body ? { x: body.scrollWidth, y: body.scrollHeight, cw: body.clientWidth, ch: body.clientHeight } : null,
      rail: rail ? {
        padRight: getComputedStyle(rail).paddingRight,
        card: rail.querySelector('li')?.getBoundingClientRect().width || 0,
      } : null,
      h1: document.querySelector('h1')?.textContent || '',
      viewerTitle: document.querySelector('#ngv-title')?.textContent || '',
      viewerArtist: document.querySelector('.ngv .awi__name')?.textContent || '',
      viewerNight: document.querySelector('.ngv__night')?.textContent || '',
      viewerCount: document.querySelector('.ngv__count')?.textContent || '',
      viewerCaption: document.querySelector('.ngv__caption')?.textContent || '',
      viewerShare: document.querySelector('.ngv [aria-label*="Share"]') ? 'Share' : '',
      viewerClose: document.querySelector('.ngv [aria-label*="Close"]') ? 'Close' : '',
      hasPublicLabel: /·\s*Public/.test(document.querySelector('.ngv')?.innerText || ''),
      cells: [...document.querySelectorAll('.ngv .fq-media-grid__cell img')].map((img) => {
        const box = img.getBoundingClientRect()
        const cell = img.closest('.fq-media-grid__cell')
        const cellBox = cell?.getBoundingClientRect()
        return {
          src: img.currentSrc || img.src,
          key: img.dataset.srcKey || '',
          natural: `${img.naturalWidth}x${img.naturalHeight}`,
          rendered: `${Math.round(box.width)}x${Math.round(box.height)}`,
          fit: getComputedStyle(img).objectFit,
          cell: cellBox ? `${Math.round(cellBox.width)}x${Math.round(cellBox.height)}` : '',
          cellRatio: cellBox && cellBox.height ? Number((cellBox.width / cellBox.height).toFixed(3)) : 0,
          imgRatio: img.naturalHeight ? Number((img.naturalWidth / img.naturalHeight).toFixed(3)) : 0,
        }
      }),
    }
  })
}

async function shot({ name, path, width, height, fullPage = true, after }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })
  const response = await page.goto(`${base}${path}`, {
    waitUntil: 'domcontentloaded',
    timeout: 90000,
  })
  await page.waitForTimeout(900)
  await clean(page)
  if (after) await after(page)
  await page.waitForTimeout(350)
  const file = resolve(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage })
  const info = await measure(page)
  info.status = response?.status() || 0
  writeFileSync(resolve(outDir, `${name}.json`), JSON.stringify(info, null, 2))
  console.log(`${info.status} ${name} overflowX=${info.overflowX} fit=${info.fit || '-'} viewer=${info.viewer} -> ${file}`)
  await page.close()
  return info
}

async function openNightPhoto(page) {
  const btn = page.locator('.ar__memory-btn').first()
  if (!(await btn.count())) return
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true })
  await page.waitForSelector('.fq-mlb__img', { timeout: 12000 }).catch(() => {})
  await page.waitForFunction(() => {
    const img = document.querySelector('.fq-mlb__img')
    return !!img && img.naturalWidth > 0
  }, { timeout: 8000 }).catch(() => {})
}

async function openRecapGallery(page) {
  const btn = page.locator('.ar__gallery').first()
  if (!(await btn.count())) return
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true })
  await page.waitForSelector('.ngv__sheet', { timeout: 12000 }).catch(() => {})
}

async function openPublicGallery(page) {
  const named = page.locator('.pn__chapter').filter({ hasText: /Fun Time|gallery/i }).first()
  const btn = (await named.count()) ? named : page.locator('.pn__chapter').first()
  if (!(await btn.count())) return
  await btn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(250)
  await btn.click({ force: true })
  await page.waitForSelector('.ngv__sheet', { timeout: 16000 }).catch(() => {})
}

const recapPath = recapId ? `/fans/recaps/${recapId}` : '/__dev/artist-recap?combo=artist-night'

if (recapId) {
  await shot({ name: 'show-recap-390', path: recapPath, width: 390, height: 844 })
  await shot({ name: 'show-recap-1280', path: recapPath, width: 1280, height: 900 })
  await shot({ name: 'night-photo-390', path: recapPath, width: 390, height: 844, fullPage: false, after: openNightPhoto })
  await shot({ name: 'night-photo-1280', path: recapPath, width: 1280, height: 900, fullPage: false, after: openNightPhoto })
  await shot({ name: 'recap-gallery-390', path: recapPath, width: 390, height: 844, fullPage: false, after: openRecapGallery })
  await shot({ name: 'recap-gallery-1280', path: recapPath, width: 1280, height: 900, fullPage: false, after: openRecapGallery })
} else {
  await shot({ name: 'show-recap-390', path: recapPath, width: 390, height: 844 })
  await shot({ name: 'show-recap-1280', path: recapPath, width: 1280, height: 900 })
  await shot({ name: 'night-photo-390', path: recapPath, width: 390, height: 844, fullPage: false, after: openNightPhoto })
  await shot({ name: 'night-photo-1280', path: recapPath, width: 1280, height: 900, fullPage: false, after: openNightPhoto })
  await shot({
    name: 'recap-gallery-390',
    path: '/__dev/artist-recap?gallery=live-set',
    width: 390,
    height: 844,
    fullPage: false,
    after: async (page) => { await page.waitForSelector('.ngv__sheet', { timeout: 8000 }).catch(() => {}) },
  })
  await shot({
    name: 'recap-gallery-1280',
    path: '/__dev/artist-recap?gallery=live-set',
    width: 1280,
    height: 900,
    fullPage: false,
    after: async (page) => { await page.waitForSelector('.ngv__sheet', { timeout: 8000 }).catch(() => {}) },
  })
}

await shot({ name: 'public-night-gallery-390', path: nightPath, width: 390, height: 844, fullPage: false, after: openPublicGallery })
await shot({ name: 'public-night-gallery-430', path: nightPath, width: 430, height: 932, fullPage: false, after: openPublicGallery })
await shot({ name: 'public-night-gallery-1280', path: nightPath, width: 1280, height: 900, fullPage: false, after: openPublicGallery })
await shot({ name: 'public-night-gallery-1440', path: nightPath, width: 1440, height: 900, fullPage: false, after: openPublicGallery })
async function openPublicLightbox(page) {
  await openPublicGallery(page)
  const cell = page.locator('.ngv .fq-media-grid__cell').first()
  if (await cell.count()) {
    await cell.click({ force: true })
    await page.waitForSelector('.fq-mlb__img', { timeout: 8000 }).catch(() => {})
  }
}
await shot({ name: 'public-night-lightbox-390', path: nightPath, width: 390, height: 844, fullPage: false, after: openPublicLightbox })
await shot({ name: 'public-night-lightbox-1280', path: nightPath, width: 1280, height: 900, fullPage: false, after: openPublicLightbox })
await shot({ name: 'public-night-lightbox-1440', path: nightPath, width: 1440, height: 900, fullPage: false, after: openPublicLightbox })

const railPage = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await railPage.goto(`${base}${recapPath}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
await railPage.waitForTimeout(800)
await clean(railPage)
const rail = railPage.locator('.ar__galleries')
if (await rail.count()) {
  await rail.scrollIntoViewIfNeeded()
  await railPage.waitForTimeout(200)
  await rail.screenshot({ path: resolve(outDir, 'show-recap-390-rail.png') })
}
const note = railPage.locator('.ar__note')
if (await note.count()) {
  await note.scrollIntoViewIfNeeded()
  await railPage.waitForTimeout(200)
  await railPage.screenshot({ path: resolve(outDir, 'show-recap-390-end.png'), fullPage: false })
}
await railPage.close()

await browser.close()
console.log('capture-media-viewer-defects: done')
