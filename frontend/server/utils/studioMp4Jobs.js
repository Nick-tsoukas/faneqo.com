import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
const jobs = new Map()
const MAX_BYTES = 512 * 1024

function motionOf(creative) {
  const motion = creative?.content?.motion
  if (!motion || motion.enabled === false) throw new Error('Turn motion on before exporting video.')
  const durationMs = Number(motion.durationMs)
  if (!Number.isFinite(durationMs) || durationMs <= 0) throw new Error('Turn motion on before exporting video.')
  if (creative.templateId !== 'product-showcase') throw new Error('This template cannot export video yet.')
  const style = creative.content?.style
  const pageFilm = !style || style === 'page'
  if (pageFilm && (creative.content?.excerpt || 'page') !== 'page') throw new Error('Video export plays the artist-page phone. Other excerpts stay stills.')
  if (!pageFilm && style !== 'fan-list' && style !== 'night') throw new Error('This style stays a still.')
  const bytes = JSON.stringify({
    templateId: creative.templateId,
    content: creative.content,
    snapshot: creative.snapshot || null,
    artistName: creative.artistName || '',
  }).length
  if (bytes > MAX_BYTES) throw new Error(`This creative is too large to export (${bytes} bytes).`)
  return { durationMs }
}

function downloadName(creative) {
  const artist = String(creative?.artistName || 'faneqo').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'faneqo'
  const family = String(creative?.templateId || 'creative').replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'creative'
  return `${artist}-${family}-story.mp4`
}

function frameCount(durationMs) {
  return Math.max(1, Math.round((durationMs / 1000) * 30))
}

function devOnly() {
  if (!import.meta.dev) {
    const error = new Error('Not found')
    error.statusCode = 404
    throw error
  }
}

export function studioMp4Status(id) {
  devOnly()
  const job = jobs.get(String(id || ''))
  if (!job) return null
  return {
    id: job.id,
    status: job.status,
    frame: job.frame,
    total: job.total,
    error: job.error,
    name: job.name,
  }
}

export async function studioMp4File(id) {
  devOnly()
  const job = jobs.get(String(id || ''))
  if (!job || job.status !== 'done') return null
  const bytes = await readFile(job.outPath)
  const name = job.name
  jobs.delete(job.id)
  await rm(job.dir, { recursive: true, force: true }).catch(() => {})
  return { bytes, name }
}

export async function studioMp4Cancel(id) {
  devOnly()
  const job = jobs.get(String(id || ''))
  if (!job || job.status !== 'running') return false
  job.status = 'cancelled'
  job.child?.kill()
  await rm(job.dir, { recursive: true, force: true }).catch(() => {})
  return true
}

export async function studioMp4Start(creative) {
  devOnly()
  if ([...jobs.values()].some((job) => job.status === 'running')) {
    const error = new Error('A video export is already running.')
    error.statusCode = 409
    throw error
  }
  const motion = motionOf(creative)
  const id = randomBytes(16).toString('hex')
  const dir = join(tmpdir(), 'faneqo-mp4', id)
  const payloadPath = join(dir, 'creative.json')
  const outPath = join(dir, 'out.mp4')
  const progressPath = join(dir, 'progress.txt')
  await mkdir(dir, { recursive: true })
  await writeFile(payloadPath, JSON.stringify({
    templateId: creative.templateId,
    artistName: creative.artistName || '',
    content: creative.content,
    snapshot: creative.snapshot || null,
  }))
  const child = spawn(process.execPath, [
    join(process.cwd(), 'scripts', 'export-studio-mp4.mjs'),
    '--payload', payloadPath,
    '--out', outPath,
    '--progress', progressPath,
  ], {
    cwd: process.cwd(),
    shell: false,
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const job = {
    id,
    status: 'running',
    frame: 0,
    total: frameCount(motion.durationMs),
    error: '',
    name: downloadName(creative),
    dir,
    outPath,
    progressPath,
    child,
    stderr: '',
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
    }
  })
  jobs.set(id, job)
  return studioMp4Status(id)
}

export async function studioMp4Refresh(id) {
  const job = jobs.get(String(id || ''))
  if (!job || job.status !== 'running') return studioMp4Status(id)
  try {
    const text = await readFile(job.progressPath, 'utf8')
    const [done, total] = text.trim().split('/').map(Number)
    if (Number.isFinite(done)) job.frame = done
    if (Number.isFinite(total)) job.total = total
  } catch { /* progress file is written after the first frame */ }
  return studioMp4Status(id)
}
