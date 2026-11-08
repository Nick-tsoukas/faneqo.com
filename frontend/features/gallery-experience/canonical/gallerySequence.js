/**
 * The sequence — which photographs hang together.
 *
 * A gallery is not a wall of tiles. It is a run of spreads: one photograph
 * given the whole stage, two hung side by side at the same height, and — in
 * a long gallery — occasionally three. The planner decides the partition;
 * CSS does every pixel (see `GallerySequence.vue`), so the plan is identical
 * on the server and on every screen width and the page never reflows after
 * hydration.
 *
 * The partition is chosen by cost, not by greed. Each candidate spread is
 * scored on how much of the stage it uses, how large its photographs are,
 * and whether it repeats the beat before it. The cheapest run wins. The
 * scoring uses a fixed reference stage because the question is about
 * proportion, not about one viewport.
 *
 * Nothing here crops. Every photograph keeps its own ratio in every spread.
 */

import { galleryPhotoRatio } from './galleryJustifiedRows.js'

/* ---- orientation ---- */

export const SEQUENCE_PORTRAIT_MAX = 0.85
export const SEQUENCE_LANDSCAPE_MIN = 1.2

/** 'portrait' | 'square' | 'landscape', from a layout ratio. */
export function sequenceOrientation(ratio) {
  const r = Number(ratio) || 0
  if (r > 0 && r < SEQUENCE_PORTRAIT_MAX) return 'portrait'
  if (r > SEQUENCE_LANDSCAPE_MIN) return 'landscape'
  return 'square'
}

/* ---- stage tokens: one source for the component CSS and `sizes` ---- */

/** Side padding of the sequence column, by breakpoint. */
export const SEQUENCE_PADDING = { sm: 0, md: 32, lg: 56, xl: 72 }
/** Gutter between prints in a spread and between spreads. */
export const SEQUENCE_GAP = { sm: 16, md: 28, lg: 36 }
/** The column never grows past this on a phone / tablet spread. */
export const SEQUENCE_MAX_WIDTH = 1600
/** Desktop editorial stage: two columns, natural ratios, no height-capped row. */
export const SEQUENCE_MASONRY = { from: 1024, maxWidth: 1280, gap: 24 }
/** A print this wide (or wider) spans both desktop columns instead of becoming a strip. */
export const SEQUENCE_PANORAMA_MIN = 2.15
/** Breakpoints, in CSS px. `sm` is a phone; `md` from 640; `lg` from 1024; `xl` from 1440. */
export const SEQUENCE_BREAKPOINTS = { md: 640, lg: 1024, xl: 1440 }
/** Share of the viewport height a spread may take. Mirrored in the CSS. */
export const SEQUENCE_CAP = { solo: 0.88, group: 0.78 }
/**
 * How far past its own pixels a print may be stretched in a wide column.
 * The viewer's rule (`galleryEnlargement.js`) at 1x: a small file is shown
 * honestly small rather than blown soft across the stage.
 */
export const SEQUENCE_ENLARGE_BUDGET = 2.4

/* ---- scoring ---- */

/** The stage the partition is scored against. Proportion only. */
const REFERENCE = { width: 1280, height: 820, gap: 24 }

const BASE = {
  soloLandscape: 0,
  soloSquare: 0.55,
  soloPortrait: 0.7,
  pair: 0.18,
  pairLandscapes: 0.4,
  pairPortraits: 0.22,
  pairMixed: 0.12,
  trio: 0.55,
  trioInShortGallery: 0.6,
  trioWide: 0.5,
  pairInTinyGallery: 0.4,
}

const RHYTHM = { solo: 0.3, pair: 0.25, trio: 0.8 }

function spreadKind(count) {
  if (count === 1) return 'solo'
  if (count === 2) return 'pair'
  return 'trio'
}

/**
 * Score one candidate spread. Lower is better.
 * `entries` are `{ ratio, orientation }`, `total` is the gallery length.
 */
export function scoreSpread(entries, { total, lastKind = null } = {}) {
  const k = entries.length
  const kind = spreadKind(k)
  const sum = entries.reduce((acc, e) => acc + e.ratio, 0)
  const { width: W, height: H, gap: g } = REFERENCE
  const cap = (k === 1 ? SEQUENCE_CAP.solo : SEQUENCE_CAP.group) * H
  const h = Math.min((W - g * (k - 1)) / sum, cap)
  const fill = (h * sum + g * (k - 1)) / W

  let cost = 0
  const o = entries.map((e) => e.orientation)

  if (kind === 'solo') {
    if (total === 1) cost = 0
    else if (o[0] === 'landscape') cost = BASE.soloLandscape
    else if (o[0] === 'square') cost = BASE.soloSquare
    else cost = BASE.soloPortrait
  } else if (kind === 'pair') {
    const landscapes = o.filter((x) => x === 'landscape').length
    const portraits = o.filter((x) => x === 'portrait').length
    if (landscapes === 2) cost = BASE.pairLandscapes
    else if (portraits === 2) cost = BASE.pairPortraits
    else if (landscapes === 1) cost = BASE.pairMixed
    else cost = BASE.pair
    if (total <= 2) cost += BASE.pairInTinyGallery
  } else {
    cost = BASE.trio
    if (total < 8) cost += BASE.trioInShortGallery
    if (sum > 4) cost += BASE.trioWide
  }

  // Stage left dark on both sides of a centred, height-capped spread.
  cost += (1 - fill) * 0.9
  // Prints that have shrunk into thumbnails.
  if (h < 0.34 * H) cost += 1.2
  if (h < 0.26 * H) cost += 3
  // The same beat twice.
  if (lastKind && lastKind === kind) cost += RHYTHM[kind]

  return { kind, cost, sum, fill, height: h }
}

/* ---- the plan ---- */

/**
 * Partition `photos` into spreads.
 *
 * Returns `[{ kind, items: [{ photo, index, ratio, orientation, share,
 * narrow, narrowShare }], ratioSum, count }]`. `share` is the print's share of
 * the spread width (its ratio over the spread's ratio sum). `narrow` says
 * what the print does on a phone: 'full' (its own row) or 'half' (paired
 * with the neighbouring portrait); `narrowShare` is its share of that pair.
 */
export function planGallerySequence(photos) {
  const list = Array.isArray(photos) ? photos.filter(Boolean) : []
  const n = list.length
  if (!n) return []

  const entries = list.map((photo, position) => {
    const ratio = galleryPhotoRatio(photo)
    return {
      photo,
      index: Number.isFinite(photo?.index) ? photo.index : position,
      ratio,
      orientation: sequenceOrientation(ratio),
    }
  })

  // best(i, lastKind) = cheapest run for entries[i..] given the beat before.
  const memo = new Map()
  function best(i, lastKind) {
    if (i >= n) return { cost: 0, cuts: [] }
    const key = `${i}:${lastKind || ''}`
    if (memo.has(key)) return memo.get(key)
    let winner = null
    for (let k = 1; k <= 3 && i + k <= n; k += 1) {
      const slice = entries.slice(i, i + k)
      const here = scoreSpread(slice, { total: n, lastKind })
      const rest = best(i + k, here.kind)
      const cost = here.cost + rest.cost
      if (!winner || cost < winner.cost - 1e-9) {
        winner = { cost, cuts: [k, ...rest.cuts] }
      }
    }
    memo.set(key, winner)
    return winner
  }

  const { cuts } = best(0, null)

  const spreads = []
  let at = 0
  for (const k of cuts) {
    const slice = entries.slice(at, at + k)
    const ratioSum = slice.reduce((acc, e) => acc + e.ratio, 0)
    const items = slice.map((e) => ({
      ...e,
      share: e.ratio / ratioSum,
      narrow: 'full',
      narrowShare: 1,
      span: e.ratio >= SEQUENCE_PANORAMA_MIN ? 'wide' : 'col',
      frameLimit: frameEnlargeLimit(e),
    }))
    // On a phone, two adjacent portraits inside a spread still hang as a pair.
    for (let j = 0; j < items.length - 1; j += 1) {
      const a = items[j]
      const b = items[j + 1]
      if (a.narrow === 'half') continue
      if (a.orientation === 'portrait' && b.orientation === 'portrait') {
        const pairSum = a.ratio + b.ratio
        a.narrow = 'half'
        b.narrow = 'half'
        a.narrowShare = a.ratio / pairSum
        b.narrowShare = b.ratio / pairSum
        j += 1
      }
    }
    spreads.push({
      kind: spreadKind(k),
      items,
      ratioSum,
      count: k,
      enlargeLimit: spreadEnlargeLimit(items),
    })
    at += k
  }

  /*
   * An odd last landscape would otherwise sit in the left column with an
   * empty neighbour. Give it the full stage. A trailing portrait keeps the
   * column — spanning it would turn it into a banner.
   */
  if (n % 2 === 1) {
    const last = spreads[spreads.length - 1]?.items?.at(-1)
    if (last && last.orientation !== 'portrait') last.span = 'wide'
  }

  return spreads
}

/**
 * The widest this spread may hang (prints only, gutters excluded) before
 * one of its photographs exceeds the enlargement budget. `null` when no
 * print carries a width to measure against.
 */
export function spreadEnlargeLimit(items) {
  let limit = Infinity
  for (const item of items) {
    const width = Number(item?.photo?.width)
    if (!Number.isFinite(width) || width <= 0 || !(item.share > 0)) continue
    limit = Math.min(limit, (width * SEQUENCE_ENLARGE_BUDGET) / item.share)
  }
  return Number.isFinite(limit) ? Math.round(limit) : null
}

/** Honest width of one print in a desktop column, before it goes soft. */
export function frameEnlargeLimit(item) {
  const width = Number(item?.photo?.width)
  if (!Number.isFinite(width) || width <= 0) return null
  return Math.round(width * SEQUENCE_ENLARGE_BUDGET)
}

/* ---- responsive sources ---- */

function round(value) {
  return Math.round(value * 1000) / 1000
}

/**
 * The honest `sizes` for one print: its share of the column at every
 * breakpoint, in the same numbers the CSS uses. A browser then fetches the
 * derivative for the width the print will actually be, never the viewport.
 */
function masonryWidth(pad, span) {
  const stage = `min(${SEQUENCE_MASONRY.maxWidth}px, 100vw - ${pad * 2}px)`
  if (span === 'wide') return stage
  return `((${stage} - ${SEQUENCE_MASONRY.gap}px) / 2)`
}

export function sequenceSizes(item, spread) {
  const k = spread.count
  const s = round(item.share)
  const gaps = (bp) => (k - 1) * SEQUENCE_GAP[bp]
  const mdColumn = `(100vw - ${SEQUENCE_PADDING.md * 2 + gaps('md')}px)`
  const narrow = item.narrow === 'half'
    ? `calc((100vw - ${SEQUENCE_GAP.sm}px) * ${round(item.narrowShare)})`
    : '100vw'
  const span = item.span === 'wide' ? 'wide' : 'col'
  return [
    `(min-width: ${SEQUENCE_BREAKPOINTS.xl}px) calc(${masonryWidth(SEQUENCE_PADDING.xl, span)})`,
    `(min-width: ${SEQUENCE_BREAKPOINTS.lg}px) calc(${masonryWidth(SEQUENCE_PADDING.lg, span)})`,
    `(min-width: ${SEQUENCE_BREAKPOINTS.md}px) calc(${mdColumn} * ${s})`,
    narrow,
  ].join(', ')
}

/** Images in the first spreads are above the fold on most screens. */
export function sequenceEagerCount() {
  return 3
}
