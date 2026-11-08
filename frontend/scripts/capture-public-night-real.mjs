/**
 * Local visual capture for the real Public Night route.
 * Run: node scripts/capture-public-night-real.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-night-world')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const nightPath = '/therockers/night/the-rock-chicago-sep-3-2026-8bcefe8f'

async function capture({ name, width, height, fullPage = true, clickGallery = false }) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 2,
  })
  const response = await page.goto(`${base}${nightPath}`, {
    waitUntil: 'networkidle',
    timeout: 90000,
  })
  await page.waitForTimeout(700)
  await page.evaluate(() => {
    document.querySelector('vite-error-overlay')?.remove()
    document.getElementById('nuxt-devtools-container')?.remove()
    document.querySelector('nuxt-devtools-frame')?.remove()
    document.querySelectorAll('[id*="nuxt-devtools"], [class*="nuxt-devtools"]').forEach((el) => el.remove())
  })
  if (clickGallery) {
    await page.locator('.pn__chapter').first().click()
    await page.waitForTimeout(450)
  }
  const file = resolve(outDir, `${name}.png`)
  await page.screenshot({ path: file, fullPage: !clickGallery && fullPage })
  const info = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')].map((img) => ({
      cls: img.className,
      alt: img.alt,
      w: Math.round(img.getBoundingClientRect().width),
      h: Math.round(img.getBoundingClientRect().height),
      nw: img.naturalWidth,
      nh: img.naturalHeight,
      broken: img.complete && img.naturalWidth === 0,
      src: (img.currentSrc || img.src || '').split('/').pop(),
    }))
    const identity = document.querySelector('.pn__identity')
    const stage = document.querySelector('.pn__stage')
    return {
      title: document.title,
      canon: document.querySelector('link[rel="canonical"]')?.href || '',
      ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
      ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
      artist: document.querySelector('.pn__artist')?.textContent || '',
      h1: document.querySelector('h1')?.textContent || '',
      place: document.querySelector('.pn__place')?.textContent || '',
      date: document.querySelector('.pn__date')?.textContent || '',
      story: document.querySelector('.pn__story')?.textContent || '',
      lineup: !!document.querySelector('.pn__lineup'),
      galleries: [...document.querySelectorAll('.pn__chapter')].map((el) => (
        el.innerText.replace(/\s+/g, ' ').trim()
      )),
      viewer: !!document.querySelector('.ngv'),
      identityInStage: !!(stage && identity && stage.contains(identity)),
      admin: /Edit|Insights|Private band note|Message attendees/.test(document.body.innerText),
      broken: imgs.filter((row) => row.broken),
      imgs,
    }
  })
  console.log(`${response?.status() || '?'} ${name} -> ${file}`)
  writeFileSync(resolve(outDir, `${name}.json`), JSON.stringify(info, null, 2))
  await page.close()
  return info
}

await capture({ name: 'public-night-390', width: 390, height: 844 })
await capture({ name: 'public-night-430', width: 430, height: 932 })
await capture({ name: 'public-night-1280', width: 1280, height: 900 })
await capture({ name: 'public-night-390-vp', width: 390, height: 844, fullPage: false })
await capture({ name: 'public-night-1280-vp', width: 1280, height: 900, fullPage: false })
await capture({ name: 'public-night-390-viewer', width: 390, height: 844, clickGallery: true, fullPage: false })
await capture({ name: 'public-night-1280-viewer', width: 1280, height: 900, clickGallery: true, fullPage: false })

const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await page.goto(`${base}${nightPath}`, { waitUntil: 'networkidle', timeout: 90000 })
await page.waitForTimeout(500)
await page.evaluate(() => document.querySelector('.pn__from')?.scrollIntoView({ block: 'start' }))
await page.waitForTimeout(200)
await page.screenshot({ path: resolve(outDir, 'public-night-390-chapters.png'), fullPage: false })
await page.evaluate(() => document.querySelector('.pn__end')?.scrollIntoView({ block: 'end' }))
await page.waitForTimeout(200)
await page.screenshot({ path: resolve(outDir, 'public-night-390-end.png'), fullPage: false })
await page.close()

const lab = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
await lab.goto(`${base}/__dev/artist-world`, { waitUntil: 'networkidle', timeout: 90000 })
await lab.waitForTimeout(500)
await lab.screenshot({ path: resolve(outDir, 'public-night-lab-there-390.png'), fullPage: false })
await lab.close()

await browser.close()
console.log('capture-public-night-real: done')
