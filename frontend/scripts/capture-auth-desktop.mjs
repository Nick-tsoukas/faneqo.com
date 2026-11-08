/**
 * Desktop auth brand polish captures. Not a product test.
 * Run: node scripts/capture-auth-desktop.mjs
 */
import { mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-auth-desktop')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3055'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
})

const shots = [
  { name: 'login-1024', path: '/login', width: 1024, height: 768 },
  { name: 'login-1280', path: '/login', width: 1280, height: 800 },
  { name: 'login-1440', path: '/login', width: 1440, height: 900 },
  { name: 'login-1600', path: '/login', width: 1600, height: 900 },
  { name: 'login-720h', path: '/login', width: 1280, height: 720 },
  { name: 'signup-1024', path: '/signup', width: 1024, height: 768 },
  { name: 'signup-1280', path: '/signup', width: 1280, height: 800 },
  { name: 'signup-1440', path: '/signup', width: 1440, height: 900 },
  { name: 'login-390', path: '/login', width: 390, height: 844 },
  { name: 'signup-390', path: '/signup', width: 390, height: 844 },
]

for (const shot of shots) {
  const page = await browser.newPage({
    viewport: { width: shot.width, height: shot.height },
    deviceScaleFactor: shot.width < 768 ? 2 : 1,
  })
  const response = await page.goto(`${base}${shot.path}`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(400)
  const metrics = await page.evaluate(() => ({
    scroll: document.documentElement.scrollHeight,
    inner: window.innerHeight,
    brandSrc: document.querySelector('.auth-shell__brand-logo')?.getAttribute('src') || null,
    mobileSrc: document.querySelector('.auth-shell__logo')?.getAttribute('src') || null,
    brandDisplay: getComputedStyle(document.querySelector('.auth-shell__brand') || document.body).display,
    formWidth: document.querySelector('.auth-shell__column')?.getBoundingClientRect().width || 0,
  }))
  const file = resolve(outDir, `${shot.name}.png`)
  await page.screenshot({ path: file, fullPage: false })
  const overflow = metrics.scroll - metrics.inner
  console.log(`${response?.status()} ${shot.name} scrollΔ=${overflow} form=${Math.round(metrics.formWidth)} brand=${metrics.brandDisplay} src=${metrics.brandSrc || metrics.mobileSrc} -> ${file}`)
  await page.close()
}

await browser.close()
