import { DEFAULT_STAGE_TUNING } from '../core/presentationState.js'

export function matteStageStyle(field, tuning = DEFAULT_STAGE_TUNING, opacity = 1) {
  const intensity = Number(tuning?.matteIntensity)
  const spread = Number(tuning?.lightSpread)
  const darkness = Number(tuning?.darkness)
  const alpha = Math.min(1, Math.max(0, Number(opacity)))
  return {
    '--fq-deep': field?.deep || '#000',
    '--fq-left': field?.left || '#111',
    '--fq-right': field?.right || '#111',
    '--fq-top': field?.top || '#1a1010',
    '--fq-bottom': field?.bottom || '#030204',
    '--fq-highlight': field?.highlight || '#444',
    '--fq-haze': field?.haze || '#664428',
    '--fq-hx': String(Number.isFinite(Number(field?.highlightX)) ? field.highlightX : 0.5),
    '--fq-hy': String(Number.isFinite(Number(field?.highlightY)) ? field.highlightY : 0.4),
    '--fq-intensity': String(Number.isFinite(intensity) ? intensity : DEFAULT_STAGE_TUNING.matteIntensity),
    '--fq-spread': String(Number.isFinite(spread) ? spread : DEFAULT_STAGE_TUNING.lightSpread),
    '--fq-darkness': String(Number.isFinite(darkness) ? darkness : DEFAULT_STAGE_TUNING.darkness),
    '--fq-matte-opacity': String(alpha),
  }
}
