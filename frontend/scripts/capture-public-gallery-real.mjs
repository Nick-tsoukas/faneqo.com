/**
 * Local visual capture for the canonical public Gallery.
 * Run: node scripts/capture-public-gallery-real.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-gallery-world')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3020'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const publicPath = '/therockers/gallery/fun-time-last-gallery'
const previewPath = '/therockers/gallery/fun-time-last-gallery?from=/galleries'

async function clean(page) {
  await page.evaluate(() => {
    document.querySelector('vite-error-overlay')?.remove()
    document.getElementById('nuxt-devtools-container')?.remove()
    document.querySelector('nuxt-devtools-frame')?.remove()
    document.querySelectorAll('[id*="nuxt-devtools"], [class*="nuxt-devtools"]').forEach((el) => el.remove())
  })
}

async function capture({ name, path, width, height, fullPage = true, openLightbox = false, openShare = false }) {
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
  if (openLightbox) {
    const cell = page.locator('.fq-media-grid.is-gallery .fq-media-grid__cell').first()
    if (await cell.count()) {
      await cell.click()
      await page.waitForTimeout(700)
      await page.waitForFunction(() => {
        const img = document.querySelector('.fq-mlb img')
        return !!img && img.naturalWidth > 0
      }, { timeout: 8000 }).catch(() => {})
    }
  }
  if (openShare) {
    const share = page.locator('.aw__share').first()
    if (await share.count()) {
      await share.click()
      await page.waitForTimeout(400)
    }
  }
  const file = resolve(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: !openLightbox && fullPage })
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map((img) => ({
      alt: img.alt,
      w: Math.round(img.getBoundingClientRect().width),
      h: Math.round(img.getBoundingClientRect().height),
      broken: img.complete && img.naturalWidth === 0,
      src: (img.currentSrc || img.src || '').split('/').pop(),
    }))
    const back = document.querySelector('.awc__back')
    return {
      title: document.title,
      canon: document.querySelector('link[rel="canonical"]')?.href || '',
      h1: document.querySelector('h1')?.textContent || '',
      artist: document.querySelector('.awc__artist')?.textContent || '',
      identity: document.querySelector('.awi.is-page')?.innerText.replace(/\s+/g, ' ').trim() || '',
      circle: (() => {
        const el = document.querySelector('.awi.is-page .awi__circle')
        if (!el) return null
        const box = el.getBoundingClientRect()
        return { w: Math.round(box.width), h: Math.round(box.height) }
      })(),
      back: (back?.textContent || '').replace(/\s+/g, ' ').trim(),
      night: document.querySelector('.aw__night')?.innerText.replace(/\s+/g, ' ').trim() || '',
      count: document.querySelector('.aw__count')?.textContent || '',
      caption: document.querySelector('.aw__caption')?.textContent || '',
      there: document.querySelector('.aw__there')?.innerText.replace(/\s+/g, ' ').trim() || '',
      toNight: document.querySelector('.aw__to-night')?.innerText.replace(/\s+/g, ' ').trim() || '',
      share: document.querySelector('.aw__share')?.textContent || '',
      shareSheet: document.querySelector('.ns__sheet')?.innerText.replace(/\s+/g, ' ').trim() || '',
      made: document.querySelector('.aw__made')?.textContent || '',
      lightbox: !!document.querySelector('.fq-mlb'),
      siteNav: !!document.querySelector('header.header, .site-header, .search-bands'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      broken: imgs.filter((row) => row.broken),
      imgs,
    }
  })
  console.log(`${response?.status() || '?'} ${name} -> ${file}`)
  writeFileSync(resolve(outDir, `${name}.json`), JSON.stringify(info, null, 2))
  await page.close()
  return info
}

await capture({ name: 'gallery-public-390', path: publicPath, width: 390, height: 844 })
await capture({ name: 'gallery-preview-390', path: previewPath, width: 390, height: 844 })
await capture({ name: 'gallery-public-430', path: publicPath, width: 430, height: 932 })
await capture({ name: 'gallery-public-390-vp', path: publicPath, width: 390, height: 844, fullPage: false })
await capture({ name: 'gallery-public-390-lightbox', path: publicPath, width: 390, height: 844, openLightbox: true, fullPage: false })
await capture({ name: 'gallery-public-390-share', path: publicPath, width: 390, height: 844, openShare: true, fullPage: false })
await capture({ name: 'gallery-public-1280', path: publicPath, width: 1280, height: 900 })
await capture({ name: 'gallery-preview-1280', path: previewPath, width: 1280, height: 900 })
await capture({ name: 'gallery-public-1280-vp', path: publicPath, width: 1280, height: 900, fullPage: false })
await capture({ name: 'gallery-public-1280-lightbox', path: publicPath, width: 1280, height: 900, openLightbox: true, fullPage: false })
await capture({ name: 'gallery-public-1280-share', path: publicPath, width: 1280, height: 900, openShare: true, fullPage: false })
await capture({ name: 'gallery-public-1440', path: publicPath, width: 1440, height: 960 })
await capture({ name: 'gallery-lab-390', path: '/__dev/artist-world', width: 390, height: 844 })
await capture({ name: 'gallery-lab-1280', path: '/__dev/artist-world', width: 1280, height: 900 })

async function captureLabSlice({ name, width, height, nth }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })
  await page.goto(`${base}/__dev/artist-world`, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForTimeout(700)
  await clean(page)
  const slice = page.locator('.aw').nth(nth)
  await slice.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  const file = resolve(outDir, `${name}.png`)
  await slice.screenshot({ path: file })
  console.log(`lab ${name} -> ${file}`)
  await page.close()
}

await captureLabSlice({ name: 'gallery-lab-one-390', width: 390, height: 844, nth: 0 })
await captureLabSlice({ name: 'gallery-lab-two-390', width: 390, height: 844, nth: 1 })
await captureLabSlice({ name: 'gallery-lab-there-390', width: 390, height: 844, nth: 0 })
await captureLabSlice({ name: 'gallery-lab-gated-390', width: 390, height: 844, nth: 5 })
await captureLabSlice({ name: 'gallery-lab-gated-1280', width: 1280, height: 900, nth: 5 })
await captureLabSlice({ name: 'gallery-lab-one-1280', width: 1280, height: 900, nth: 0 })
await captureLabSlice({ name: 'gallery-lab-two-1280', width: 1280, height: 900, nth: 1 })

await browser.close()
console.log('capture-public-gallery-real: done')
