/**
 * Photographic Afterlight — presentation only.
 * Derives a restrained surround from existing light-field / stage palette.
 * CSS only. Not GPU. Not a blurred wallpaper.
 *
 * Lab strengths A / B / C tune localization, spread, and contribution —
 * not a single global opacity multiply.
 */

import { lightFieldToStage } from '../core/lightField.js'

/** @deprecated Prefer AFTERLIGHT_STRENGTHS.A — kept for Pass 01 contracts. */
export const AFTERLIGHT_MAX_OPACITY = 0.34
export const AFTERLIGHT_HIGHLIGHT_ALPHA = 0.22
export const AFTERLIGHT_HAZE_ALPHA = 0.2
export const AFTERLIGHT_EDGE_ALPHA = 0.16
export const AFTERLIGHT_CHROMA_GATE = 0.028

/**
 * Lab bake-off strengths.
 * A = Signature Pass 01 V0
 * B ≈ +25% perceived presence (tighter spill, stronger edge/highlight)
 * C ≈ +50% perceived presence (still localized; reject if wallpaper)
 */
export const AFTERLIGHT_STRENGTHS = Object.freeze({
  A: Object.freeze({
    id: 'A',
    label: 'V0',
    maxOpacity: 0.34,
    highlightAlpha: 0.22,
    hazeAlpha: 0.20,
    edgeAlpha: 0.16,
    highlightSpread: 70,
    hazeSpread: 100,
    edgeReach: 34,
  }),
  B: Object.freeze({
    id: 'B',
    label: '+25%',
    maxOpacity: 0.38,
    highlightAlpha: 0.28,
    hazeAlpha: 0.24,
    edgeAlpha: 0.22,
    highlightSpread: 58,
    hazeSpread: 86,
    edgeReach: 28,
  }),
  C: Object.freeze({
    id: 'C',
    label: '+50%',
    maxOpacity: 0.42,
    highlightAlpha: 0.34,
    hazeAlpha: 0.28,
    edgeAlpha: 0.28,
    highlightSpread: 50,
    hazeSpread: 74,
    edgeReach: 22,
  }),
})

export const AFTERLIGHT_DEFAULT_STRENGTH = 'B'

export function resolveAfterlightStrength(id) {
  const key = String(id || AFTERLIGHT_DEFAULT_STRENGTH).toUpperCase()
  return AFTERLIGHT_STRENGTHS[key] || AFTERLIGHT_STRENGTHS.B
}

function clamp01(n) {
  const v = Number(n)
  if (!Number.isFinite(v)) return 0
  return Math.min(1, Math.max(0, v))
}

function hexToRgba(hex, alpha) {
  const raw = String(hex || '').replace('#', '')
  if (raw.length !== 6) return `rgba(0,0,0,${clamp01(alpha)})`
  const r = parseInt(raw.slice(0, 2), 16)
  const g = parseInt(raw.slice(2, 4), 16)
  const b = parseInt(raw.slice(4, 6), 16)
  if ([r, g, b].some((n) => Number.isNaN(n))) return `rgba(0,0,0,${clamp01(alpha)})`
  return `rgba(${r},${g},${b},${clamp01(alpha)})`
}

/**
 * Resolve CSS custom properties for the Afterlight layer.
 * @param {object} field — light field (from stage or analysis)
 * @param {{ x:number,y:number,w:number,h:number }|null} photoRect
 * @param {{ width:number, height:number }} viewport
 * @param {{ enabled?: boolean, reduced?: boolean, strength?: string }} options
 */
export function resolveAfterlightStyle(field, photoRect, viewport = {}, options = {}) {
  if (options.enabled === false || options.reduced) {
    return {
      '--fq-al-opacity': '0',
      '--fq-al-highlight': 'transparent',
      '--fq-al-haze': 'transparent',
      '--fq-al-left': 'transparent',
      '--fq-al-right': 'transparent',
      '--fq-al-hx': '50%',
      '--fq-al-hy': '40%',
      '--fq-al-hl-spread': '70%',
      '--fq-al-haze-spread': '100%',
      '--fq-al-edge-reach': '34%',
      '--fq-al-photo-x': '50%',
      '--fq-al-photo-y': '50%',
      '--fq-al-photo-w': '40%',
      '--fq-al-photo-h': '40%',
    }
  }

  const strength = resolveAfterlightStrength(options.strength)
  const stage = lightFieldToStage(field)
  const chroma = clamp01(field?.chroma)
  const energy = clamp01(field?.energy)
  const edge = field?.edge || { top: 0, right: 0, bottom: 0, left: 0 }

  // Monochrome / dead frames stay nearly black.
  const chromaScale = chroma <= AFTERLIGHT_CHROMA_GATE
    ? 0.12
    : Math.min(1, 0.35 + (chroma - AFTERLIGHT_CHROMA_GATE) / 0.09)
  const energyScale = 0.62 + energy * 0.55
  const presence = clamp01(chromaScale * energyScale)
  const opacity = +(strength.maxOpacity * presence).toFixed(3)

  const vw = Math.max(1, Number(viewport.width) || 1)
  const vh = Math.max(1, Number(viewport.height) || 1)
  const r = photoRect || { x: vw * 0.2, y: vh * 0.2, w: vw * 0.6, h: vh * 0.6 }
  const hx = clamp01(field?.highlight?.x ?? stage.highlightX ?? 0.5)
  const hy = clamp01(field?.highlight?.y ?? stage.highlightY ?? 0.4)

  // Map highlight into the photograph's on-screen box, then bleed slightly past edges.
  const spillX = ((Number(r.x) + Number(r.w) * hx) / vw) * 100
  const spillY = ((Number(r.y) + Number(r.h) * hy) / vh) * 100

  const leftEdge = clamp01(edge.left)
  const rightEdge = clamp01(edge.right)
  const leftA = strength.edgeAlpha * presence * (0.35 + leftEdge * 0.9)
  const rightA = strength.edgeAlpha * presence * (0.35 + rightEdge * 0.9)
  const edgePad = Math.max(18, Math.min(40, 100 - strength.edgeReach * 2))

  return {
    '--fq-al-opacity': String(opacity),
    '--fq-al-highlight': hexToRgba(stage.highlight, strength.highlightAlpha * presence),
    '--fq-al-haze': hexToRgba(stage.haze, strength.hazeAlpha * presence),
    '--fq-al-left': hexToRgba(stage.left, leftA),
    '--fq-al-right': hexToRgba(stage.right, rightA),
    '--fq-al-hx': `${spillX.toFixed(2)}%`,
    '--fq-al-hy': `${spillY.toFixed(2)}%`,
    '--fq-al-hl-spread': `${strength.highlightSpread}%`,
    '--fq-al-haze-spread': `${strength.hazeSpread}%`,
    '--fq-al-edge-reach': `${strength.edgeReach}%`,
    '--fq-al-edge-pad': `${edgePad}%`,
    '--fq-al-photo-x': `${((Number(r.x) / vw) * 100).toFixed(2)}%`,
    '--fq-al-photo-y': `${((Number(r.y) / vh) * 100).toFixed(2)}%`,
    '--fq-al-photo-w': `${((Number(r.w) / vw) * 100).toFixed(2)}%`,
    '--fq-al-photo-h': `${((Number(r.h) / vh) * 100).toFixed(2)}%`,
  }
}
