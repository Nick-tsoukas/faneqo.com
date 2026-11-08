/**
 * Local visual capture for Slice 4B. Not a product test.
 * Run: node scripts/capture-artist-world.mjs
 */
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-night-world')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3001'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const shots = [
  { name: 'night-lab-390', url: '/__dev/artist-world', width: 390, height: 844 },
  { name: 'night-lab-430', url: '/__dev/artist-world', width: 430, height: 932 },
  { name: 'night-lab-768', url: '/__dev/artist-world', width: 768, height: 1024 },
  { name: 'night-lab-1280', url: '/__dev/artist-world', width: 1280, height: 900 },
  { name: 'night-404-390', url: '/badflower/night/does-not-exist-4b', width: 390, height: 844 },
  { name: 'gallery-404-390', url: '/badflower/gallery/does-not-exist-4b', width: 390, height: 844 },
]

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: 2,
  })
  const response = await page.goto(`${base}${shot.url}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(250)
  const file = resolve(outDir, `${shot.name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  console.log(`${response?.status()} ${shot.name} -> ${file}`)
  await page.close()
}

await browser.close()
