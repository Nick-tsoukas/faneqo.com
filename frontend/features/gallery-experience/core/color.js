/**
 * Perceptual color helpers for Matte & Stage interpolation.
 * Presentation only. Not Gallery truth.
 */

function clamp01(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function parseHexColor(input) {
  const raw = String(input || '').trim()
  const hex = raw[0] === '#' ? raw.slice(1) : raw
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }
  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    if ([r, g, b].some((n) => Number.isNaN(n))) return null
    return { r, g, b }
  }
  return null
}

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(channel) {
  const c = channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * (channel ** (1 / 2.4)) - 0.055
  return Math.round(Math.min(255, Math.max(0, c * 255)))
}

export function rgbToOklab({ r, g, b }) {
  const lr = srgbToLinear(r)
  const lg = srgbToLinear(g)
  const lb = srgbToLinear(b)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  const l_ = Math.cbrt(l)
  const m_ = Math.cbrt(m)
  const s_ = Math.cbrt(s)
  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  }
}

export function oklabToRgb({ L, a, b }) {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b
  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_
  return {
    r: linearToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    g: linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    b: linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  }
}

export function rgbToHex({ r, g, b }) {
  const to = (n) => Math.min(255, Math.max(0, Number(n) || 0)).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export function mixHex(from, to, t) {
  const a = parseHexColor(from)
  const b = parseHexColor(to)
  const p = clamp01(t)
  if (!a && !b) return '#000000'
  if (!a) return rgbToHex(b)
  if (!b) return rgbToHex(a)
  const oa = rgbToOklab(a)
  const ob = rgbToOklab(b)
  return rgbToHex(oklabToRgb({
    L: oa.L + (ob.L - oa.L) * p,
    a: oa.a + (ob.a - oa.a) * p,
    b: oa.b + (ob.b - oa.b) * p,
  }))
}

export function mixNumber(from, to, t) {
  const a = Number(from)
  const b = Number(to)
  const p = clamp01(t)
  if (!Number.isFinite(a) && !Number.isFinite(b)) return 0
  if (!Number.isFinite(a)) return b
  if (!Number.isFinite(b)) return a
  return a + (b - a) * p
}

export function easeSoftness(t, softness) {
  const p = clamp01(t)
  const s = clamp01(softness)
  const smooth = p * p * (3 - 2 * p)
  return p * (1 - s) + smooth * s
}

export { clamp01 }
