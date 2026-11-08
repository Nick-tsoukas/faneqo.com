import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, '.tmp-check-in')
const base = process.env.FANEQO_CAPTURE_ORIGIN || 'http://localhost:3000'
mkdirSync(outDir, { recursive: true })

const chromePath = process.env.FANEQO_CHROME
  || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const browser = await chromium.launch({ executablePath: chromePath, headless: true })

const shots = [
  { name: 'pre-idle', state: 'idle' },
  { name: 'pre-new', state: 'idle-new' },
  { name: 'identity', state: 'identity' },
  { name: 'success', state: 'success' },
  { name: 'already', state: 'already' },
  { name: 'error', state: 'error' },
  { name: 'badge-failed', state: 'badge-failed', wait: '.badge-card' },
]

const viewports = [
  { name: '390x844', width: 390, height: 844 },
  { name: '390x720', width: 390, height: 720 },
  { name: '430x932', width: 430, height: 932 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '1440x900', width: 1440, height: 900 },
]

const measures = []

for (const shot of shots) {
  for (const viewport of viewports) {
    if (shot.state === 'badge-failed' && viewport.width >= 1280) continue
    if (shot.state === 'identity' && viewport.name !== '390x844') continue
    if (shot.state === 'pre-new' && viewport.name !== '390x844') continue
    if ((shot.state === 'already' || shot.state === 'error') && viewport.name !== '390x844' && viewport.name !== '390x720') continue
    if (shot.state === 'success' && !['390x844', '390x720'].includes(viewport.name) && viewport.width < 1280) continue

    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.width >= 1280 ? 1 : 2,
    })
    const url = `${base}/__dev/check-in?state=${shot.state}&rail=0`
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.addStyleTag({
      content: 'nuxt-devtools, #nuxt-devtools-container, vite-error-overlay { display: none !important }',
    })
    const waitSel = shot.wait || '.checkin-frame'
    await page.waitForFunction((sel) => {
      const el = document.querySelector(sel)
      if (!el) return false
      const box = el.getBoundingClientRect()
      return box.width > 40 && box.height > 40
    }, waitSel, { timeout: 30000 })
    await page.waitForTimeout(600)

    if (shot.state === 'idle' || shot.state === 'success') {
      const metrics = await page.evaluate(() => {
        const cta = document.querySelector('.btn-primary')
        const close = document.querySelector('.checkin-close')
        const hero = document.querySelector('.show-hero')
        const flag = document.querySelector('.checked-flag')
        const chrome = document.querySelector('.checkin-chrome')
        const vh = window.innerHeight
        const box = cta ? cta.getBoundingClientRect() : null
        return {
          ctaTop: box ? Math.round(box.top) : null,
          ctaBottom: box ? Math.round(box.bottom) : null,
          ctaVisible: box ? box.bottom <= vh && box.top >= 0 : false,
          closeAbsolute: close ? getComputedStyle(close).position === 'absolute' : false,
          closeSize: close ? Math.round(close.getBoundingClientRect().height) : null,
          heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
          flagTop: flag ? Math.round(flag.getBoundingClientRect().top) : null,
          chromeRow: Boolean(chrome),
          viewportHeight: vh,
        }
      })
      measures.push({ shot: shot.name, viewport: viewport.name, ...metrics })
    }

    const file = resolve(outDir, `${shot.name}-${viewport.name}.png`)
    await page.screenshot({ path: file, fullPage: false })
    console.log(`${response?.status()} ${shot.name}-${viewport.name} -> ${file}`)
    await page.close()
  }
}

writeFileSync(resolve(outDir, 'above-fold.json'), JSON.stringify(measures, null, 2))
console.log('above-fold', measures)

await browser.close()
