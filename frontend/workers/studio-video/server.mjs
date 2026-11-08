/**
 * Private Creative Studio video worker.
 *
 * Run this only on a machine that is not the public website. It renders with
 * scripts/export-studio-mp4.mjs (the same Vue page and FFmpeg path as local
 * development). It accepts a creative payload from the Nuxt server, never a
 * URL, a filesystem path, or a shell command.
 *
 *   STUDIO_VIDEO_WORKER_TOKEN   required. Empty token refuses every job.
 *   STUDIO_VIDEO_WORKER_HOST    default 127.0.0.1
 *   STUDIO_VIDEO_WORKER_PORT    default 8791
 *   STUDIO_RENDER_BASE          default http://127.0.0.1:3000 (localhost only)
 *   STUDIO_VIDEO_JOB_TTL_MS     default 2 hours
 */
import { spawn } from 'node:child_process'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { createServer } from 'node:http'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { assertExportableMotion, motionDownloadName, motionFrameCount } from '../../features/ads/studio/motionExport.js'
import { VIDEO_MAX_CONCURRENT, VIDEO_MAX_DURATION_MS, unsafeVideoFields } from '../../features/ads/studio/videoExportContract.js'

const jobs = new Map()
const token = String(process.env.STUDIO_VIDEO_WORKER_TOKEN || '')
const host = String(process.env.STUDIO_VIDEO_WORKER_HOST || '127.0.0.1')
const port = Number(process.env.STUDIO_VIDEO_WORKER_PORT || 8791)
const renderBase = String(process.env.STUDIO_RENDER_BASE || 'http://127.0.0.1:3000')
const ttlMs = Number(process.env.STUDIO_VIDEO_JOB_TTL_MS || 2 * 60 * 60 * 1000)
const root = resolve(fileURLToPath(new URL('../../..', import.meta.url)))

export function authorizeBearer(header, expected) {
  const got = String(header || '').replace(/^Bearer\s+/i, '').trim()
  const secret = String(expected || '')
  if (!got || !secret) return false
  const a = Buffer.from(got)
  const b = Buffer.from(secret)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function localRenderBase(value) {
  let url
  try { url = new URL(value) } catch { return '' }
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname)) return ''
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return ''
  return url.origin
}

function send(res, status, body, headers = {}) {
  const payload = Buffer.from(JSON.stringify(body))
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store', ...headers })
  res.end(payload)
}

function publicJob(job) {
  return {
    id: job.id,
    status: job.status,
    frame: job.frame,
    total: job.total,
    error: job.error,
    name: job.name,
  }
}

async function sweep() {
  const now = Date.now()
  for (const job of jobs.values()) {
    if (now - job.createdAt < ttlMs) continue
    if (job.status === 'running') job.child?.kill()
    jobs.delete(job.id)
    await rm(job.dir, { recursive: true, force: true }).catch(() => {})
  }
}

async function readProgress(job) {
  if (job.status !== 'running') return
  try {
    const text = await readFile(job.progressPath, 'utf8')
    const [done, total] = text.trim().split('/').map(Number)
    if (Number.isFinite(done)) job.frame = done
    if (Number.isFinite(total)) job.total = total
  } catch { /* written after the first frame */ }
}

async function startJob(body) {
  if (unsafeVideoFields(body).length) {
    const error = new Error('This export does not accept a render URL or a file path.')
    error.statusCode = 400
    throw error
  }
  const base = localRenderBase(renderBase)
  if (!base) {
    const error = new Error('The renderer only talks to this machine.')
    error.statusCode = 503
    throw error
  }
  const running = [...jobs.values()].filter((job) => job.status === 'running').length
  if (running >= VIDEO_MAX_CONCURRENT) {
    const error = new Error('A video export is already running.')
    error.statusCode = 429
    throw error
  }
  const creative = {
    id: body?.id,
    templateId: body?.templateId,
    artistName: body?.artistName || '',
    content: body?.content,
    snapshot: body?.snapshot || null,
  }
  const motion = assertExportableMotion(creative)
  if (motion.durationMs > VIDEO_MAX_DURATION_MS) {
    const error = new Error('This film is longer than the export limit.')
    error.statusCode = 400
    throw error
  }
  const id = randomBytes(16).toString('hex')
  const dir = join(tmpdir(), 'faneqo-studio-video', id)
  const payloadPath = join(dir, 'creative.json')
  const outPath = join(dir, 'out.mp4')
  const progressPath = join(dir, 'progress.txt')
  await mkdir(dir, { recursive: true })
  await writeFile(payloadPath, JSON.stringify({
    templateId: creative.templateId,
    artistName: creative.artistName,
    content: creative.content,
    snapshot: creative.snapshot,
  }))
  const child = spawn(process.execPath, [
    join(root, 'scripts', 'export-studio-mp4.mjs'),
    '--payload', payloadPath,
    '--out', outPath,
    '--progress', progressPath,
    '--base', base,
  ], {
    cwd: root,
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const job = {
    id,
    status: 'running',
    frame: 0,
    total: motionFrameCount(motion.durationMs),
    error: '',
    name: motionDownloadName(creative),
    dir,
    outPath,
    progressPath,
    child,
    stderr: '',
    createdAt: Date.now(),
  }
  child.stderr.on('data', (chunk) => { job.stderr = `${job.stderr}${chunk}`.slice(-4000) })
  child.on('error', (err) => {
    job.status = 'error'
    job.error = err.code === 'ENOENT' ? 'Node could not start the exporter.' : err.message
  })
  child.on('close', (code) => {
    if (job.status === 'cancelled') return
    if (code === 0) job.status = 'done'
    else {
      job.status = 'error'
      job.error = job.stderr.trim() || `Export exited ${code}.`
      rm(job.dir, { recursive: true, force: true }).catch(() => {})
    }
  })
  jobs.set(id, job)
  return job
}

async function cancelJob(id) {
  const job = jobs.get(id)
  if (!job) return null
  if (job.status === 'running') {
    job.status = 'cancelled'
    job.child?.kill()
  }
  await rm(job.dir, { recursive: true, force: true }).catch(() => {})
  job.file = null
  return job
}

async function handle(req, res) {
  await sweep()
  if (!authorizeBearer(req.headers.authorization, token)) {
    send(res, 401, { message: 'Unauthorized' })
    return
  }
  const url = new URL(req.url || '/', 'http://127.0.0.1')
  const match = url.pathname.match(/^\/jobs(?:\/([a-f0-9]{32}))?(?:\/(file))?$/)
  if (!match) {
    send(res, 404, { message: 'Not found' })
    return
  }
  const id = match[1] || ''
  const file = match[2] === 'file'
  try {
    if (req.method === 'POST' && !id) {
      const raw = await readBody(req)
      const body = raw ? JSON.parse(raw) : {}
      const job = await startJob(body)
      send(res, 202, publicJob(job))
      return
    }
    if (!id || !jobs.has(id)) {
      send(res, 404, { message: 'Not found' })
      return
    }
    const job = jobs.get(id)
    if (req.method === 'GET' && file) {
      if (job.status !== 'done') {
        send(res, 409, { message: 'The video is not ready.' })
        return
      }
      const bytes = await readFile(job.outPath)
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Filename': job.name,
      })
      res.end(bytes)
      return
    }
    if (req.method === 'DELETE') {
      await cancelJob(id)
      send(res, 200, { id, status: 'cancelled' })
      return
    }
    if (req.method === 'GET') {
      await readProgress(job)
      send(res, 200, publicJob(job))
      return
    }
    send(res, 404, { message: 'Not found' })
  } catch (err) {
    send(res, err.statusCode || 400, { message: err.message || 'Video export failed.' })
  }
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 512 * 1024) {
        reject(Object.assign(new Error('This creative is too large to export.'), { statusCode: 400 }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function listen() {
  if (!token) throw new Error('STUDIO_VIDEO_WORKER_TOKEN is required.')
  const server = createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (!res.headersSent) send(res, 500, { message: err.message || 'Video export failed.' })
    })
  })
  server.listen(port, host)
  return server
}

const invoked = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invoked) listen()
