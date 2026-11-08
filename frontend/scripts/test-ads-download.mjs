/**
 * Real-browser check of the Ads Studio "Download PNG" button.
 * Opens the private player locally, clicks Download for each supported
 * format, saves the actual downloaded files, and verifies their IHDR size.
 *
 *   node scripts/test-ads-download.mjs            # all static ads
 *   node scripts/test-ads-download.mjs artist-spotlight
 *
 * Requires the local Nuxt dev server (auth is bypassed for /ads in dev).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { adsCatalog } from '../features/ads/catalog.js'
import { AD_FORMATS, adFileName } from '../features/ads/formats.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, '.visual-review', 'ads-downloads')
const base = process.env.ADS_CAPTURE_URL || 'http://localhost:3000'
const only = process.argv[2]
const ads = adsCatalog.filter((ad) => (only ? ad.slug === only : true))

function pngSize(file) {
  const bytes = fs.readFileSync(file)
  if (bytes.toString('ascii', 1, 4) !== 'PNG') throw new Error(`${file} is not a PNG`)
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

fs.mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, acceptDownloads: true })
const page = await context.newPage()
const failures = []

try {
  for (const ad of ads) {
    for (const formatId of ad.formats) {
      const scene = ad.sceneCount > 1 ? 1 : null
      const url = `${base}/ads/${ad.slug}?format=${formatId}`
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.locator('.ad-stage > article').first().waitFor({ state: 'visible' })
      const button = page.getByRole('button', { name: 'Download PNG' })
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 60_000 }),
        button.click(),
      ])
      const expectedName = adFileName(ad, formatId, scene)
      const file = path.join(outDir, download.suggestedFilename())
      await download.saveAs(file)
      const size = pngSize(file)
      const want = AD_FORMATS[formatId]
      const ok = download.suggestedFilename() === expectedName && size.width === want.width && size.height === want.height
      const status = await page.locator('.ad-player__hint[role="status"]').textContent().catch(() => '')
      console.log(`${ok ? 'ok ' : 'BAD'} ${download.suggestedFilename()} ${size.width}×${size.height} — ${status?.trim()}`)
      if (!ok) failures.push(`${ad.slug} ${formatId}: ${download.suggestedFilename()} ${size.width}×${size.height}`)
    }
  }
} finally {
  await browser.close()
}

if (failures.length) {
  console.error(failures.join('\n'))
  process.exit(1)
}
console.log(`ads download: ok (${outDir})`)
