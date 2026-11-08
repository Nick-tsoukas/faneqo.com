/**
 * Semantic presentation state for the experience lab.
 * Replaceable later (shader / GPU / depth) without changing the manifest.
 */
import { easeSoftness, mixHex, mixNumber } from './color.js'
import { normalizeStageField } from './experienceManifest.js'

export const STAGE_MODE_BLACK = 'black'
export const STAGE_MODE_CSS = 'css'
export const STAGE_MODE_GPU = 'gpu'

export const DEFAULT_STAGE_TUNING = Object.freeze({
  stageMode: STAGE_MODE_BLACK,
  matteIntensity: 0.72,
  lightSpread: 0.58,
  darkness: 0.90,
  imageSurround: 0,
  photoScaleBias: 1,
  transitionSoftness: 0.52,
  highlightIntensity: 0.64,
  highlightRadius: 0.38,
  haze: 0.20,
  spatialFidelity: 0.92,
  velocityResponse: 0.16,
  persistence: 0.24,
  persistenceDecay: 0.84,
})

export const RENDERER_DOM_CSS = 'DOM/CSS'
export const RENDERER_BLACK = 'BLACK'

export function clampIndex(index, count) {
  const n = Math.max(0, Number(count) || 0)
  if (!n) return 0
  const i = Number(index)
  if (!Number.isFinite(i)) return 0
  return Math.min(n - 1, Math.max(0, Math.round(i)))
}

export function interpolateStage(from, to, t, softness = 0.55) {
  const a = normalizeStageField(from)
  const b = normalizeStageField(to)
  const p = easeSoftness(t, softness)
  return {
    deep: mixHex(a.deep, b.deep, p),
    left: mixHex(a.left, b.left, p),
    right: mixHex(a.right, b.right, p),
    top: mixHex(a.top, b.top, p),
    bottom: mixHex(a.bottom, b.bottom, p),
    highlight: mixHex(a.highlight, b.highlight, p),
    haze: mixHex(a.haze, b.haze, p),
    highlightX: mixNumber(a.highlightX, b.highlightX, p),
    highlightY: mixNumber(a.highlightY, b.highlightY, p),
  }
}

export function stageAtProgress(memories, progress, {
  reduced = false,
  softness = DEFAULT_STAGE_TUNING.transitionSoftness,
} = {}) {
  const list = Array.isArray(memories) ? memories : []
  if (!list.length) return normalizeStageField()
  const index = clampIndex(progress?.index, list.length)
  if (reduced || !progress || progress.from === progress.to || !(progress.t > 0)) {
    return normalizeStageField(list[index]?.stage)
  }
  const from = list[clampIndex(progress.from, list.length)]
  const to = list[clampIndex(progress.to, list.length)]
  return interpolateStage(from?.stage, to?.stage, progress.t, softness)
}

export function createDefaultTuning() {
  return { ...DEFAULT_STAGE_TUNING }
}

export function memoryScale(gravity, energy = 0.5) {
  const g = Math.min(1, Math.max(0, Number(gravity) || 0))
  const e = Math.min(1, Math.max(0, Number(energy) || 0))
  return 0.70 + g * 0.24 + e * 0.04
}
