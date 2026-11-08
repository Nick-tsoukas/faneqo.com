import { AD_FORMATS, AD_SAFE_ZONES, isAdFormat } from '../formats.js'

/**
 * Per-format art direction as CSS variables. Each template declares a LAYOUTS
 * table keyed by format id; numbers become px, strings pass through. The
 * board then positions every block from variables instead of being cropped or
 * stretched from another canvas.
 */
export function resolveBoardFormat(formatId, supported) {
  if (isAdFormat(formatId) && (!supported || supported.includes(formatId))) return formatId
  return supported?.[0] || 'post'
}

export function boardVars(formatId, layouts = {}) {
  const id = isAdFormat(formatId) ? formatId : 'post'
  const canvas = AD_FORMATS[id]
  const safe = AD_SAFE_ZONES[id]
  const layout = layouts[id] || layouts.post || {}
  const vars = {
    '--board-w': `${canvas.width}px`,
    '--board-h': `${canvas.height}px`,
    '--safe-x': `${safe.side}px`,
    '--safe-top': `${safe.top}px`,
    '--safe-bottom': `${safe.bottom}px`,
  }
  for (const [key, value] of Object.entries(layout)) {
    vars[`--${key}`] = typeof value === 'number' ? `${value}px` : String(value)
  }
  return vars
}

/** Shrink display type for long names so a 30-character band still fits one or two lines. */
export function nameScale(text, { short = 10, medium = 16, long = 24 } = {}) {
  const n = String(text || '').trim().length
  if (n <= short) return 1
  if (n <= medium) return 0.82
  if (n <= long) return 0.66
  return 0.52
}

/** Headline scale by total characters across lines. */
export function headlineScale(lines) {
  const longest = Math.max(0, ...(lines || []).map((line) => String(line || '').length))
  if (longest <= 9) return 1
  if (longest <= 13) return 0.84
  if (longest <= 18) return 0.68
  if (longest <= 24) return 0.56
  return 0.46
}

export function px(value) {
  return `${Math.round(Number(value) || 0)}px`
}
