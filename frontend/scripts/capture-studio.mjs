/**
 * Capture every Creative Studio family at 1:1 for visual review.
 * Requires `npm run dev` (dev-only render route) and local Chrome.
 *
 *   node scripts/capture-studio.mjs                 # demo Badflower + no-artist families
 *   node scripts/capture-studio.mjs therockers      # also a real local artist slug
 *   OUT=C:/somewhere node scripts/capture-studio.mjs
 *
 * Output defaults to %TEMP%/faneqo-studio-captures (outside the repo).
 */
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { chromium } from 'playwright-core'

const BASE = process.env.BASE || 'http://localhost:3000'
const OUT = process.env.OUT || join(tmpdir(), 'faneqo-studio-captures')
const slug = process.argv[2] || ''
mkdirSync(OUT, { recursive: true })

const FORMATS = ['post', 'feed', 'story', 'square']

const PLAN = [
  { template: 'artist-spotlight', artist: 'demo', variants: ['photo', 'portrait', 'product'] },
  { template: 'song-spotlight', artist: 'demo', variants: ['cover', 'bleed', 'sleeve'] },
  { template: 'product-showcase', artist: 'demo', variants: ['stack', 'bleed'], extra: { excerpt: 'shows' } },
  { template: 'type-statement', artist: 'none', variants: ['statement', 'poster', 'manifesto'], extra: { preset: 'stop-renting' } },
  { template: 'education', artist: 'none', variants: ['editorial', 'cards'], scenes: [0, 1, 6] },
  { template: 'show-promo', artist: 'demo', variants: ['poster', 'ticket'] },
]

if (slug) {
  PLAN.push(
    { template: 'artist-spotlight', artist: slug, variants: ['photo', 'portrait'], tag: slug },
    { template: 'song-spotlight', artist: slug, variants: ['cover', 'sleeve'], tag: slug },
    { template: 'show-promo', artist: slug, variants: ['poster', 'ticket'], extra: { show: '0' }, tag: slug },
    { template: 'product-showcase', artist: slug, variants: ['stack'], extra: { excerpt: 'gallery' }, tag: slug },
  )
}

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1200, height: 2100 }, deviceScaleFactor: 1 })
page.on('pageerror', (e) => console.error('pageerror', e.message))

let count = 0
for (const item of PLAN) {
  const family = item.template
  for (const variant of item.variants) {
    for (const format of FORMATS) {
      const scenes = item.scenes || [0]
      for (const scene of scenes) {
        const params = new URLSearchParams({ template: family, format, variant, artist: item.artist, scene: String(scene), ...(item.extra || {}) })
        const url = `${BASE}/__dev/studio-render?${params}`
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
        const frame = page.locator('.render__frame')
        try {
          await frame.waitFor({ state: 'visible', timeout: 60000 })
          await page.waitForFunction(() => [...document.querySelectorAll('.render__frame img')].every((img) => img.complete), null, { timeout: 30000 }).catch(() => {})
        } catch {
          console.error('no frame for', url, await page.locator('.render__error').textContent().catch(() => ''))
          continue
        }
        await page.addStyleTag({ content: '[class*=nuxt-devtools]{display:none!important}' })
        await page.waitForTimeout(250)
        const name = [item.tag || item.artist, family, variant, format, scenes.length > 1 ? `s${scene + 1}` : null].filter(Boolean).join('-')
        await frame.screenshot({ path: join(OUT, `${name}.png`), scale: 'css' })
        count += 1
      }
    }
  }
}

await browser.close()
console.log(`captured ${count} frames → ${OUT}`)
