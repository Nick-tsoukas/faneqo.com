import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-artist-share')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3055'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const hideChrome = `
  [data-v-inspector],
  .nuxt-devtools-float,
  #nuxt-devtools-container,
  button[aria-label="Toggle Nuxt DevTools"],
  button[aria-label="Toggle Component Inspector"] { display: none !important; }
`

const shots = [
  { name: 'share-320', width: 320, height: 844 },
  { name: 'share-360', width: 360, height: 800 },
  { name: 'share-390', width: 390, height: 844 },
  { name: 'share-430', width: 430, height: 932 },
  { name: 'share-390-short', width: 390, height: 600 },
  { name: 'share-768', width: 768, height: 1024 },
]

const context = await browser.newContext({
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
})
await context.grantPermissions(['clipboard-read', 'clipboard-write'])

async function openDrawer(page) {
  await page.goto(`${base}/__dev/artist-nav?tab=dashboard&share=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 45000,
  })
  await page.waitForSelector('.asq[role="dialog"]', { timeout: 20000 })
  await page.addStyleTag({ content: hideChrome })
  await page.waitForTimeout(250)
}

for (const shot of shots) {
  const page = await context.newPage()
  await page.setViewportSize({ width: shot.width, height: shot.height })
  try {
    await openDrawer(page)
    const file = resolve(outDir, `${shot.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    const metrics = await page.evaluate(() => {
      const qr = document.querySelector('.asq__qr svg')
      const share = document.querySelector('.asq__share')
      const close = document.querySelector('.asq__head button')
      const sheet = document.querySelector('.asq__sheet')
      const qrBox = qr?.getBoundingClientRect()
      return {
        title: document.getElementById('asq-title')?.textContent,
        artist: document.querySelector('.asq__name')?.textContent,
        svgW: qr ? Number(qr.getAttribute('width')) : 0,
        svgH: qr ? Number(qr.getAttribute('height')) : 0,
        cssW: qrBox ? Math.round(qrBox.width) : 0,
        transform: qr ? getComputedStyle(qr).transform : '',
        filter: qr ? getComputedStyle(qr).filter : '',
        shareVisible: share ? share.getBoundingClientRect().bottom <= window.innerHeight : false,
        closeVisible: close ? close.getBoundingClientRect().top >= 0 : false,
        sheetH: sheet ? Math.round(sheet.getBoundingClientRect().height) : 0,
      }
    })
    console.log(`${shot.name} ${JSON.stringify(metrics)} -> ${file}`)

    const decoded = await page.evaluate(async () => {
      const svg = document.querySelector('.asq__qr svg')
      if (!svg) return { ok: false, reason: 'no-svg' }
      if (typeof BarcodeDetector !== 'function') return { ok: false, reason: 'no-detector' }
      const xml = new XMLSerializer().serializeToString(svg)
      const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
      try {
        const img = new Image()
        img.src = url
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth || Number(svg.getAttribute('width')) || 200
        canvas.height = img.naturalHeight || Number(svg.getAttribute('height')) || 200
        canvas.getContext('2d').drawImage(img, 0, 0)
        const codes = await new BarcodeDetector({ formats: ['qr_code'] }).detect(canvas)
        return { ok: codes.length > 0, value: codes[0]?.rawValue || '' }
      } catch (err) {
        return { ok: false, reason: err.message }
      } finally {
        URL.revokeObjectURL(url)
      }
    })
    console.log(`${shot.name} decode ${JSON.stringify(decoded)}`)

    if (shot.name === 'share-390') {
      await page.getByRole('button', { name: 'Copy link' }).click()
      await page.waitForSelector('.asq__status', { timeout: 4000 })
      await page.screenshot({ path: resolve(outDir, 'share-390-copied.png'), fullPage: false })
      await page.locator('.asq__share').focus()
      await page.screenshot({ path: resolve(outDir, 'share-390-focus.png'), fullPage: false })
    }
  } catch (err) {
    console.error(`FAIL ${shot.name}: ${err.message}`)
  }
  await page.close()
}

await browser.close()
