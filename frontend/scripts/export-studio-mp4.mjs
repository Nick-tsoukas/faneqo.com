/**
 * Local MP4 export for a Creative Studio motion film.
 *
 *   node scripts/export-studio-mp4.mjs
 *   node scripts/export-studio-mp4.mjs --frames 8
 *   node scripts/export-studio-mp4.mjs --payload creative.json --out C:\path\out.mp4
 *
 * Requires `npm run dev` and FFmpeg (`ffmpeg` on PATH). Does not install anything.
 * Frame N is captured at N / 30 seconds. One Chromium, one page, then H.264.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'
import { PRODUCT_MOTION_MS, defaultProductMotion } from '../features/ads/studio/motion.js'
import {
  MOTION_EXPORT_HEIGHT,
  MOTION_EXPORT_WIDTH,
  MOTION_FPS,
  assertExportableMotion,
  motionFrameTimes,
  pngSize,
} from '../features/ads/studio/motionExport.js'

const { values } = parseArgs({
  options: {
    payload: { type: 'string' },
    out: { type: 'string' },
    base: { type: 'string', default: process.env.BASE || 'http://localhost:3000' },
    frames: { type: 'string' },
    progress: { type: 'string' },
  },
})

const started = Date.now()
let peakRss = process.memoryUsage().rss
let browser = null
let ffmpeg = null
let outPath = ''
let failed = false

function sampleMemory() {
  peakRss = Math.max(peakRss, process.memoryUsage().rss)
}

function assertLocalBase(base) {
  let url
  try { url = new URL(base) } catch { throw new Error('The renderer address is not a URL.') }
  const host = url.hostname
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) {
    throw new Error('The renderer only talks to this machine.')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('The renderer address must be http or https.')
  return url.origin
}

function loadPayload() {
  if (!values.payload) {
    return {
      templateId: 'product-showcase',
      artistName: 'Badflower',
      content: {
        variant: 'stack',
        excerpt: 'page',
        headlineTop: 'Your entire',
        headlineAccent: 'music world.',
        support: 'Music, video, links, shows, and fans — one artist page.',
        cta: 'Start your page',
        site: 'faneqo.com',
        kicker: 'One page. One world.',
        motion: defaultProductMotion(),
      },
      snapshot: null,
      demo: true,
    }
  }
  const file = resolve(values.payload)
  let parsed
  try { parsed = JSON.parse(readFileSync(file, 'utf8')) } catch (err) {
    throw new Error(`Could not read the creative file (${err.message}).`)
  }
  assertExportableMotion(parsed)
  return parsed
}

function outputPath(creative) {
  if (values.out) {
    const target = resolve(values.out)
    if (target.includes('\0')) throw new Error('The output path is not valid.')
    return target
  }
  const name = creative.demo ? 'your-entire-music-world.mp4' : 'studio-motion.mp4'
  return join(tmpdir(), 'faneqo-motion', name)
}

function ffmpegMissing() {
  console.error('FFmpeg was not found on PATH.')
  console.error('Install it for this user, then open a new terminal:')
  console.error('  winget install Gyan.FFmpeg')
  console.error('This script does not install software for you.')
}

function startEncoder(width, height) {
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel', 'error',
    '-f', 'image2pipe',
    '-framerate', String(MOTION_FPS),
    '-vcodec', 'png',
    '-i', 'pipe:0',
  ]
  if (width !== MOTION_EXPORT_WIDTH || height !== MOTION_EXPORT_HEIGHT) {
    args.push('-vf', `scale=${MOTION_EXPORT_WIDTH}:${MOTION_EXPORT_HEIGHT}:flags=lanczos`)
  }
  args.push(
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-profile:v', 'high',
    '-crf', '18',
    '-preset', 'medium',
    '-movflags', '+faststart',
    '-an',
    outPath,
  )
  const child = spawn('ffmpeg', args, { shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (chunk) => { stderr += chunk.toString() })
  child.on('error', (err) => {
    if (err.code === 'ENOENT') ffmpegMissing()
  })
  child.stdin.on('error', () => {})
  return { child, stderr: () => stderr }
}

function writeFrame(stdin, buffer) {
  return new Promise((resolve, reject) => {
    const ok = stdin.write(buffer, (err) => { if (err) reject(err) })
    if (ok) resolve()
    else stdin.once('drain', resolve)
  })
}

async function stop(signal) {
  failed = true
  console.error(signal ? `Stopped (${signal}).` : 'Stopped.')
  try { ffmpeg?.stdin?.end() } catch { /* already closed */ }
  try { ffmpeg?.kill('SIGKILL') } catch { /* already gone */ }
  try { await browser?.close() } catch { /* already closed */ }
  if (outPath) { try { rmSync(outPath, { force: true }) } catch { /* missing */ } }
}

process.on('SIGINT', () => { stop('SIGINT').finally(() => process.exit(1)) })
process.on('SIGTERM', () => { stop('SIGTERM').finally(() => process.exit(1)) })

const base = assertLocalBase(values.base)
const creative = loadPayload()
const motion = creative.demo ? { durationMs: PRODUCT_MOTION_MS } : assertExportableMotion(creative)
const times = motionFrameTimes(motion.durationMs, MOTION_FPS)
const limit = values.frames ? Math.max(1, Math.min(times.length, Number(values.frames) || 1)) : times.length
const frames = times.slice(0, limit)
outPath = outputPath(creative)
mkdirSync(resolve(outPath, '..'), { recursive: true })

function noteProgress(done, total) {
  if (!values.progress) return
  writeFileSync(values.progress, `${done}/${total}`)
}

const captureStarted = Date.now()
browser = await chromium.launch({
  headless: true,
  ...(process.env.STUDIO_VIDEO_CHROME_PATH
    ? { executablePath: process.env.STUDIO_VIDEO_CHROME_PATH }
    : { channel: process.env.STUDIO_VIDEO_CHROME_CHANNEL || 'chrome' }),
})
const page = await browser.newPage({ viewport: { width: 1200, height: 2100 }, deviceScaleFactor: 2 / 3 })
page.on('pageerror', (err) => console.error('pageerror', err.message))

const params = new URLSearchParams({
  template: creative.templateId || 'product-showcase',
  format: 'story',
  motion: '1',
  artist: creative.demo ? 'demo' : 'none',
  t: '0',
})
if (creative.content?.variant) params.set('variant', creative.content.variant)
await page.goto(`${base}/__dev/studio-render?${params}`, { waitUntil: 'domcontentloaded', timeout: 90000 })
const ready = await pollAttribute(page, 'html', 'data-render-ready', ['1', 'error'], 60000)
if (ready === 'error') {
  const message = await page.locator('.render__error').textContent().catch(() => 'The creative did not render.')
  throw new Error(message || 'The creative did not render.')
}
if (!creative.demo) {
  await page.locator('.render__seek').evaluate((input, payload) => {
    input.dataset.payload = JSON.stringify(payload)
    input.dispatchEvent(new Event('payload', { bubbles: true }))
  }, {
    templateId: creative.templateId,
    artistName: creative.artistName || '',
    content: creative.content,
    snapshot: creative.snapshot || null,
  })
  await pollAttribute(page, 'html', 'data-render-ready', ['applied'], 20000)
}
await page.waitForSelector('.render__frame[data-t]', { timeout: 30000 })
await page.locator('.render__frame').evaluate(async (frame) => {
  await document.fonts.ready
  const images = [...frame.querySelectorAll('img')]
  await Promise.all(images.map((img) => img.complete && img.naturalWidth > 0 ? null : new Promise((resolve) => {
    const done = () => resolve()
    img.addEventListener('load', done, { once: true })
    img.addEventListener('error', done, { once: true })
  })))
  const broken = images.filter((img) => img.complete && img.naturalWidth === 0).map((img) => img.getAttribute('src') || 'image')
  if (broken.length) throw new Error(`Images failed to load: ${broken.join(', ')}`)
})
await page.addStyleTag({ content: '[class*=nuxt-devtools]{display:none!important}' })

const first = await page.locator('.render__frame').screenshot({ type: 'png', scale: 'device' })
const size = pngSize(first)
if (!size) throw new Error('The first frame was not a PNG.')
console.log(`frame ${size.width}×${size.height} → ${MOTION_EXPORT_WIDTH}×${MOTION_EXPORT_HEIGHT}, ${frames.length} frames`)
const encoder = startEncoder(size.width, size.height)
ffmpeg = encoder.child
if (ffmpeg.exitCode != null) throw new Error(encoder.stderr() || 'FFmpeg exited before the first frame.')

async function pollAttribute(target, selector, name, accepted, timeout) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    const value = await target.locator(selector).getAttribute(name)
    if (accepted.includes(value)) return value
    await target.waitForTimeout(80)
  }
  throw new Error('The creative did not become ready to capture.')
}

async function seekAndCapture(ms, reuse) {
  if (!reuse) {
    await page.locator('.render__seek').fill(String(ms))
    const start = Date.now()
    while (Date.now() - start < 10000) {
      const value = await page.locator('.render__frame').getAttribute('data-t')
      if (value === String(ms)) break
      await page.waitForTimeout(16)
    }
    const painted = await page.locator('.render__frame').getAttribute('data-t')
    if (painted !== String(ms)) throw new Error(`The frame did not seek to ${ms}ms.`)
    await page.locator('.render__frame').evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  }
  return page.locator('.render__frame').screenshot({ type: 'png', scale: 'device' })
}

await writeFrame(ffmpeg.stdin, first)
noteProgress(1, frames.length)
sampleMemory()
for (let index = 1; index < frames.length; index += 1) {
  if (failed) break
  const png = await seekAndCapture(frames[index], false)
  await writeFrame(ffmpeg.stdin, png)
  noteProgress(index + 1, frames.length)
  sampleMemory()
  if (index % 30 === 0 || index === frames.length - 1) {
    const seconds = ((Date.now() - captureStarted) / 1000).toFixed(1)
    console.log(`captured ${index + 1}/${frames.length} in ${seconds}s`)
  }
}
ffmpeg.stdin.end()
const encodeTail = Date.now()
const code = await new Promise((resolve) => ffmpeg.on('close', resolve))
await browser.close()
browser = null
if (code !== 0) throw new Error(encoder.stderr() || `FFmpeg exited ${code}.`)

const file = statSync(outPath)
const total = ((Date.now() - started) / 1000).toFixed(1)
const tail = ((Date.now() - encodeTail) / 1000).toFixed(1)
console.log(JSON.stringify({
  path: outPath,
  bytes: file.size,
  frames: frames.length,
  fps: MOTION_FPS,
  seconds: frames.length / MOTION_FPS,
  elapsedSec: Number(total),
  encodeTailSec: Number(tail),
  peakNodeRssMb: Math.round(peakRss / 1048576),
}, null, 2))

if (!isAbsolute(outPath)) throw new Error('Output path was not absolute.')
