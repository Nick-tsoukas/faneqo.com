import { analyzeImageData, lightFieldFromStage } from '../core/lightField.js'

const SIZE = 24
const cache = new Map()
const analyzed = new Set()
let worker = null
let workerFailed = false
let seq = 0

function getWorker() {
  if (workerFailed || typeof window === 'undefined' || typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('./lightField.worker.js', import.meta.url), { type: 'module' })
    return worker
  } catch {
    workerFailed = true
    worker = null
    return null
  }
}

function analyzeOnMain(bitmap) {
  const canvas = document.createElement('canvas')
  canvas.width = SIZE
  canvas.height = SIZE
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(bitmap, 0, 0, SIZE, SIZE)
  const field = analyzeImageData(ctx.getImageData(0, 0, SIZE, SIZE))
  if (typeof bitmap.close === 'function') bitmap.close()
  return field
}

async function loadBitmap(src) {
  const response = await fetch(src)
  if (!response.ok) throw new Error(`light-field fetch ${response.status}`)
  const blob = await response.blob()
  if (typeof createImageBitmap === 'function') return createImageBitmap(blob)
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('image decode failed'))
    image.src = URL.createObjectURL(blob)
  })
}

function requestWorker(src) {
  const w = getWorker()
  if (!w) return null
  const id = `lf-${seq += 1}`
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      if (event.data?.id !== id) return
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
      if (event.data.ok) resolve(event.data.field)
      else reject(new Error(event.data.error || 'worker failed'))
    }
    const onError = () => {
      w.removeEventListener('message', onMessage)
      w.removeEventListener('error', onError)
      workerFailed = true
      reject(new Error('worker error'))
    }
    w.addEventListener('message', onMessage)
    w.addEventListener('error', onError)
    w.postMessage({ id, url: src })
  })
}

export function peekLightField(memory) {
  if (!memory?.id) return lightFieldFromStage(memory?.stage)
  return cache.get(memory.id) || lightFieldFromStage(memory.stage)
}

export function seedLightField(memory) {
  if (!memory?.id) return peekLightField(memory)
  if (!cache.has(memory.id)) cache.set(memory.id, lightFieldFromStage(memory.stage))
  return cache.get(memory.id)
}

export async function analyzeMemoryLightField(memory) {
  if (!memory?.src) return lightFieldFromStage(memory?.stage)
  seedLightField(memory)
  if (analyzed.has(memory.id)) return cache.get(memory.id)
  try {
    let field = null
    const viaWorker = requestWorker(memory.src)
    if (viaWorker) {
      field = await viaWorker
    } else {
      const bitmap = await loadBitmap(memory.src)
      field = analyzeOnMain(bitmap)
    }
    cache.set(memory.id, interpolateLightField(lightFieldFromStage(memory.stage), field, 0.48, 0.12))
    analyzed.add(memory.id)
    return field
  } catch {
    return cache.get(memory.id) || lightFieldFromStage(memory.stage)
  }
}

export function disposeLightFieldCache() {
  cache.clear()
  analyzed.clear()
}
