/**
 * Spatial photographic light field.
 * Semantic presentation data. Not shader uniforms. Not Gallery truth.
 */
import {
  clamp01,
  easeSoftness,
  mixHex,
  mixNumber,
  oklabToRgb,
  parseHexColor,
  rgbToHex,
  rgbToOklab,
} from './color.js'
import { normalizeStageField } from './experienceManifest.js'

export const LIGHT_FIELD_CELLS = 9
const ACHROMA = 0.038

function labOfHex(hex, fallback = { L: 0, a: 0, b: 0 }) {
  const rgb = parseHexColor(hex)
  return rgb ? rgbToOklab(rgb) : fallback
}

function hexOfLab(lab) {
  return rgbToHex(oklabToRgb(lab))
}

function chromaOf(lab) {
  return Math.hypot(Number(lab?.a) || 0, Number(lab?.b) || 0)
}

function mixLab(a, b, t) {
  const p = clamp01(t)
  return {
    L: (Number(a?.L) || 0) + ((Number(b?.L) || 0) - (Number(a?.L) || 0)) * p,
    a: (Number(a?.a) || 0) + ((Number(b?.a) || 0) - (Number(a?.a) || 0)) * p,
    b: (Number(a?.b) || 0) + ((Number(b?.b) || 0) - (Number(a?.b) || 0)) * p,
  }
}

function cellFromLab(lab) {
  const next = {
    L: Number(lab?.L) || 0,
    a: Number(lab?.a) || 0,
    b: Number(lab?.b) || 0,
  }
  return { ...next, hex: hexOfLab(next), chroma: chromaOf(next) }
}

function cellFromHex(hex) {
  return cellFromLab(labOfHex(hex))
}

function desaturateLab(lab, amount) {
  const p = clamp01(amount)
  return {
    L: Number(lab?.L) || 0,
    a: (Number(lab?.a) || 0) * (1 - p),
    b: (Number(lab?.b) || 0) * (1 - p),
  }
}

export function emptyLightField() {
  const black = cellFromHex('#000000')
  return {
    cells: Array.from({ length: LIGHT_FIELD_CELLS }, () => ({ ...black })),
    highlight: { x: 0.5, y: 0.4, ...cellFromHex('#222222') },
    haze: cellFromHex('#111111'),
    deep: cellFromHex('#000000'),
    chroma: 0,
    energy: 0,
    edge: { top: 0, right: 0, bottom: 0, left: 0 },
  }
}

export function lightFieldFromStage(stage) {
  const s = normalizeStageField(stage)
  const top = cellFromHex(s.top)
  const bottom = cellFromHex(s.bottom)
  const left = cellFromHex(s.left)
  const right = cellFromHex(s.right)
  const highlight = cellFromHex(s.highlight)
  const haze = cellFromHex(s.haze)
  const deep = cellFromHex(s.deep)
  const center = cellFromLab(mixLab(mixLab(highlight, haze, 0.55), deep, 0.42))
  const cells = [
    cellFromLab(mixLab(top, left, 0.5)),
    top,
    cellFromLab(mixLab(top, right, 0.5)),
    left,
    center,
    right,
    cellFromLab(mixLab(bottom, left, 0.5)),
    bottom,
    cellFromLab(mixLab(bottom, right, 0.5)),
  ]
  const chroma = cells.reduce((sum, cell) => sum + cell.chroma * Math.max(0.08, cell.L), 0)
    / cells.reduce((sum, cell) => sum + Math.max(0.08, cell.L), 0)
  const energy = cells.reduce((sum, cell) => sum + cell.L, 0) / cells.length
  return {
    cells,
    highlight: { x: s.highlightX, y: s.highlightY, ...highlight },
    haze,
    deep,
    chroma,
    energy,
    edge: {
      top: top.L,
      right: right.L,
      bottom: bottom.L,
      left: left.L,
    },
  }
}

function regionMean(data, width, height, x0, y0, x1, y1) {
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  const minX = Math.max(0, Math.floor(x0))
  const minY = Math.max(0, Math.floor(y0))
  const maxX = Math.min(width, Math.ceil(x1))
  const maxY = Math.min(height, Math.ceil(y1))
  for (let y = minY; y < maxY; y += 1) {
    for (let x = minX; x < maxX; x += 1) {
      const i = (y * width + x) * 4
      r += data[i]
      g += data[i + 1]
      b += data[i + 2]
      count += 1
    }
  }
  if (!count) return cellFromHex('#000000')
  return cellFromLab(rgbToOklab({
    r: r / count,
    g: g / count,
    b: b / count,
  }))
}

function edgeMeanL(data, width, height, side) {
  const band = Math.max(1, Math.round(Math.min(width, height) * 0.12))
  if (side === 'top') return regionMean(data, width, height, 0, 0, width, band).L
  if (side === 'bottom') return regionMean(data, width, height, 0, height - band, width, height).L
  if (side === 'left') return regionMean(data, width, height, 0, 0, band, height).L
  return regionMean(data, width, height, width - band, 0, width, height).L
}

/**
 * Derive a 3×3 spatial field from a tiny ImageData / downsample.
 * No ML. Prototype analysis only.
 */
export function analyzeImageData(image) {
  const width = Math.max(1, Number(image?.width) || 0)
  const height = Math.max(1, Number(image?.height) || 0)
  const data = image?.data
  if (!data || !width || !height) return emptyLightField()

  const cells = []
  const colW = width / 3
  const rowH = height / 3
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      cells.push(regionMean(
        data,
        width,
        height,
        col * colW,
        row * rowH,
        (col + 1) * colW,
        (row + 1) * rowH,
      ))
    }
  }

  let chromaAcc = 0
  let chromaW = 0
  let energy = 0
  let peakL = 0
  let peakX = 0.5
  let peakY = 0.4
  let brightX = 0
  let brightY = 0
  let brightW = 0
  let deepL = 1
  let deepR = 0
  let deepG = 0
  let deepB = 0
  let deepN = 0

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const rgb = { r: data[i], g: data[i + 1], b: data[i + 2] }
      const lab = rgbToOklab(rgb)
      const w = Math.max(0.04, lab.L)
      chromaAcc += chromaOf(lab) * w
      chromaW += w
      energy += lab.L
      if (lab.L > peakL) {
        peakL = lab.L
        peakX = (x + 0.5) / width
        peakY = (y + 0.5) / height
      }
      if (lab.L > 0.62) {
        const bw = (lab.L - 0.62) ** 2
        brightX += ((x + 0.5) / width) * bw
        brightY += ((y + 0.5) / height) * bw
        brightW += bw
      }
      if (lab.L < 0.12) {
        deepL = Math.min(deepL, lab.L)
        deepR += rgb.r
        deepG += rgb.g
        deepB += rgb.b
        deepN += 1
      }
    }
  }

  let chroma = chromaW > 0 ? chromaAcc / chromaW : 0
  energy /= width * height

  if (chroma < ACHROMA) {
    chroma = 0
    for (let i = 0; i < cells.length; i += 1) {
      cells[i] = cellFromLab(desaturateLab(cells[i], 1))
    }
  }

  const hx = brightW > 0 ? brightX / brightW : peakX
  const hy = brightW > 0 ? brightY / brightW : peakY
  const highlightCell = regionMean(
    data,
    width,
    height,
    Math.max(0, hx * width - 2),
    Math.max(0, hy * height - 2),
    Math.min(width, hx * width + 2),
    Math.min(height, hy * height + 2),
  )
  const highlight = chroma < ACHROMA
    ? cellFromLab(desaturateLab(highlightCell, 1))
    : highlightCell

  const deepRgb = deepN
    ? { r: deepR / deepN, g: deepG / deepN, b: deepB / deepN }
    : { r: 0, g: 0, b: 0 }
  const deep = chroma < ACHROMA
    ? cellFromLab(desaturateLab(rgbToOklab(deepRgb), 1))
    : cellFromLab(rgbToOklab(deepRgb))

  const haze = cellFromLab(mixLab(highlight, cells[4], 0.55))

  return {
    cells,
    highlight: { x: clamp01(hx), y: clamp01(hy), ...highlight },
    haze,
    deep,
    chroma,
    energy,
    edge: {
      top: edgeMeanL(data, width, height, 'top'),
      right: edgeMeanL(data, width, height, 'right'),
      bottom: edgeMeanL(data, width, height, 'bottom'),
      left: edgeMeanL(data, width, height, 'left'),
    },
  }
}

function killChromaToward(from, to, t) {
  const destChroma = chromaOf(to)
  const srcChroma = chromaOf(from)
  if (destChroma < ACHROMA && srcChroma > destChroma) {
    const kill = Math.max(clamp01(t), easeSoftness(t, 0.18))
    return mixLab(from, desaturateLab(to, 0), kill)
  }
  if (srcChroma < ACHROMA && destChroma < ACHROMA) {
    return desaturateLab(mixLab(from, to, t), 1)
  }
  return mixLab(from, to, t)
}

export function interpolateLightField(from, to, t, softness = 0.55) {
  const a = from?.cells?.length === LIGHT_FIELD_CELLS ? from : emptyLightField()
  const b = to?.cells?.length === LIGHT_FIELD_CELLS ? to : emptyLightField()
  const p = easeSoftness(t, softness)
  const cells = a.cells.map((cell, i) => cellFromLab(killChromaToward(cell, b.cells[i], p)))
  const highlightLab = killChromaToward(a.highlight, b.highlight, p)
  const haze = cellFromLab(killChromaToward(a.haze, b.haze, p))
  const deep = cellFromLab(killChromaToward(a.deep, b.deep, p))
  return {
    cells,
    highlight: {
      x: mixNumber(a.highlight.x, b.highlight.x, p),
      y: mixNumber(a.highlight.y, b.highlight.y, p),
      ...cellFromLab(highlightLab),
    },
    haze,
    deep,
    chroma: mixNumber(a.chroma, b.chroma, p),
    energy: mixNumber(a.energy, b.energy, p),
    edge: {
      top: mixNumber(a.edge.top, b.edge.top, p),
      right: mixNumber(a.edge.right, b.edge.right, p),
      bottom: mixNumber(a.edge.bottom, b.edge.bottom, p),
      left: mixNumber(a.edge.left, b.edge.left, p),
    },
  }
}

export function lightFieldAtProgress(fields, progress, {
  reduced = false,
  softness = 0.55,
} = {}) {
  const list = Array.isArray(fields) ? fields : []
  if (!list.length) return emptyLightField()
  const n = list.length
  const index = Math.min(n - 1, Math.max(0, Math.round(Number(progress?.index) || 0)))
  if (reduced || !progress || progress.from === progress.to || !(progress.t > 0)) {
    return list[index] || emptyLightField()
  }
  const from = list[Math.min(n - 1, Math.max(0, Math.round(Number(progress.from) || 0)))]
  const to = list[Math.min(n - 1, Math.max(0, Math.round(Number(progress.to) || 0)))]
  return interpolateLightField(from, to, progress.t, softness)
}

export function lightFieldToStage(field) {
  const f = field?.cells?.length === LIGHT_FIELD_CELLS ? field : emptyLightField()
  return {
    deep: f.deep.hex,
    left: f.cells[3].hex,
    right: f.cells[5].hex,
    top: f.cells[1].hex,
    bottom: f.cells[7].hex,
    highlight: f.highlight.hex,
    haze: f.haze.hex,
    highlightX: f.highlight.x,
    highlightY: f.highlight.y,
  }
}

export { mixHex }
