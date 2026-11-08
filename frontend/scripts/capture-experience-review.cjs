/**
 * Local visual capture for the experience integration review.
 * Not a product script. Do not ship.
 */
const fs = require('fs')
const path = require('path')
const { chromium } = require('playwright-core')

const BASE = process.env.FANEQO_DEV_URL || 'http://[::1]:3001'
const OUT = path.join(__dirname, '..', '.tmp-experience-review')
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'

const WIDTHS = [390, 430, 1280]
const HEIGHT = 900

const pages = [
  { name: 'gallery', url: '/__dev/gallery', pill: true },
  { name: 'night-story', url: '/__dev/night-story', pill: true },
  { name: 'share-photos', url: '/__dev/share-photos', pill: true },
  { name: 'dm-media', url: '/__dev/dm-media', pill: true },
  { name: 'rel-thesis', url: '/__dev/relationship?case=thesis', pill: false },
  { name: 'rel-zero', url: '/__dev/relationship?case=zero', pill: false },
  { name: 'rel-one', url: '/__dev/relationship?case=one', pill: false },
  { name: 'rel-nophoto', url: '/__dev/relationship?case=nophoto', pill: false },
  { name: 'rel-photorich', url: '/__dev/relationship?case=photorich', pill: false },
  { name: 'rel-five', url: '/__dev/relationship?case=five', pill: false },
]

const only = process.argv.includes('--rel')
    ? pages.filter((row) => row.name.startsWith('rel-'))
    : pages

async function clickWidth(page, width) {
  const btn = page.locator(`button:has-text("${width}")`).first()
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(250)
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  })
  const results = []
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: HEIGHT },
      deviceScaleFactor: 2,
    })
    const page = await context.newPage()
    for (const spec of only) {
      const url = BASE + spec.url
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
      const status = resp ? resp.status() : 0
      await page.waitForTimeout(900)
      if (spec.pill) await clickWidth(page, width)
      const file = `${spec.name}-${width}.png`
      await page.screenshot({ path: path.join(OUT, file), fullPage: true })
      results.push({ file, status, url, width })
      console.log(`${status} ${file}`)
    }
    await context.close()
  }
  await browser.close()
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(results, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
