/**
 * Export the three static ads at exact Instagram canvas sizes.
 * Requires the local Nuxt dev server. Screenshots the artwork only.
 *
 *   node scripts/capture-ads.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, '.visual-review', 'ads-formats')
const base = process.env.ADS_CAPTURE_URL || 'http://localhost:3000'
const jobs = [
  { slug: 'your-entire-music-world', formats: ['feed', 'story'] },
  { slug: 'stop-renting-your-audience', formats: ['feed', 'story'] },
  { slug: 'still-using-a-basic-link-in-bio', formats: ['feed', 'story'] },
  { slug: 'artist-spotlight', formats: ['post', 'feed', 'story'] },
]
const expected = {
  post: { width: 1080, height: 1440 },
  feed: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
}

function pngSize(file) {
  const bytes = fs.readFileSync(file)
  if (bytes.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error(`${file} is not a PNG`)
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 2100 }, deviceScaleFactor: 1 })

fs.mkdirSync(outDir, { recursive: true })

try {
  for (const job of jobs) {
    for (const format of job.formats) {
      const slug = job.slug
      const url = `${base}/__dev/ads-export?slug=${slug}&format=${format}`
      const response = await page.goto(url, { waitUntil: 'networkidle' })
      if (!response || response.status() >= 400) {
        throw new Error(`${url} returned ${response ? response.status() : 'no response'}. Restart the dev server so it can see pages/__dev/ads-export.vue.`)
      }
      const board = page.locator('article.board')
      await board.waitFor({ state: 'visible' })
      const box = await board.boundingBox()
      const want = expected[format]
      if (!box || Math.round(box.width) !== want.width || Math.round(box.height) !== want.height) {
        throw new Error(`${slug} ${format} rendered ${box && Math.round(box.width)}×${box && Math.round(box.height)}, expected ${want.width}×${want.height}`)
      }
      const file = path.join(outDir, `${slug}-${format}.png`)
      await board.screenshot({ path: file, scale: 'css' })
      const size = pngSize(file)
      if (size.width !== want.width || size.height !== want.height) {
        throw new Error(`${file} is ${size.width}×${size.height}`)
      }
      console.log(`${path.basename(file)} ${size.width}×${size.height}`)
    }
  }
} finally {
  await browser.close()
}
