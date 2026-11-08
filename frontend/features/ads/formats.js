/**
 * Logical social canvases. One scale fits the stage; it never stretches.
 *
 * post  — Instagram organic feed post and the current ~3:4 profile grid.
 * feed  — Instagram / Facebook feed advertisement (Meta recommends 4:5).
 * story — Instagram / Facebook Story.
 */
export const AD_FORMATS = {
  post: {
    id: 'post',
    label: 'Post',
    chip: 'Post · 3:4',
    ratio: '3:4',
    width: 1080,
    height: 1440,
    title: 'Instagram Post — 3:4 · 1080×1440',
    file: 'instagram-post',
  },
  feed: {
    id: 'feed',
    label: 'Ad',
    chip: 'Ad · 4:5',
    ratio: '4:5',
    width: 1080,
    height: 1350,
    title: 'Instagram / Facebook Feed Ad — 4:5 · 1080×1350',
    file: 'feed-ad',
  },
  story: {
    id: 'story',
    label: 'Story',
    chip: 'Story · 9:16',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    title: 'Instagram / Facebook Story — 9:16 · 1080×1920',
    file: 'story',
  },
  square: {
    id: 'square',
    label: 'Square',
    chip: 'Square · 1:1',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    title: 'Square — 1:1 · 1080×1080 (carousels, Facebook feed, some ad placements)',
    file: 'square',
  },
}

export const AD_FORMAT_ORDER = ['post', 'feed', 'story', 'square']

/**
 * Guidance for the studio overlay, in logical pixels.
 * Meta placement previews stay authoritative.
 *
 * Post and ad: keep important content 80px from every edge.
 * Story: Instagram draws its own chrome over the top and bottom.
 */
export const AD_POST_SAFE = { top: 80, bottom: 80, side: 80 }

export const AD_SAFE_ZONES = {
  post: AD_POST_SAFE,
  feed: AD_POST_SAFE,
  story: { top: 250, bottom: 320, side: 48 },
  square: AD_POST_SAFE,
}

/** The current Instagram profile grid shows a centered ~3:4 thumbnail. */
export const AD_GRID_RATIO = 3 / 4

/**
 * Pixels the profile grid trims from a full image of this format.
 * 1080×1440 is already 3:4, so nothing is trimmed.
 * 1080×1350 loses about 34px on each side.
 * 1080×1920 posted to the feed loses 240px top and bottom.
 * 1080×1080 loses 135px on each side.
 */
export function gridCrop(formatId) {
  const format = AD_FORMATS[formatId]
  if (!format) return { top: 0, bottom: 0, left: 0, right: 0 }
  const { width, height } = format
  if (width / height > AD_GRID_RATIO) {
    const side = Math.round((width - height * AD_GRID_RATIO) / 2)
    return { top: 0, bottom: 0, left: side, right: side }
  }
  const band = Math.round((height - width / AD_GRID_RATIO) / 2)
  return { top: band, bottom: band, left: 0, right: 0 }
}

/** Safe area that survives both the full post and the grid thumbnail. */
export function gridSafeZone(formatId) {
  const safe = AD_SAFE_ZONES[formatId] || AD_POST_SAFE
  const crop = gridCrop(formatId)
  return {
    top: safe.top + crop.top,
    bottom: safe.bottom + crop.bottom,
    left: safe.side + crop.left,
    right: safe.side + crop.right,
  }
}

export function stageScale(hostWidth, hostHeight, boardWidth, boardHeight) {
  const hostW = Number(hostWidth) || 0
  const hostH = Number(hostHeight) || 0
  const boardW = Number(boardWidth) || 0
  const boardH = Number(boardHeight) || 0
  if (!hostW || !hostH || !boardW || !boardH) return 0
  return Math.min(hostW / boardW, hostH / boardH)
}

export function isAdFormat(id) {
  return Object.prototype.hasOwnProperty.call(AD_FORMATS, id)
}

export function resolveAdFormat(requested, supported) {
  const allowed = Array.isArray(supported) && supported.length ? supported : ['story']
  const ask = isAdFormat(requested) ? requested : ''
  if (ask && allowed.includes(ask)) return ask
  for (const id of AD_FORMAT_ORDER) {
    if (allowed.includes(id)) return id
  }
  return allowed[0]
}

export function formatSummary(formats) {
  return (Array.isArray(formats) ? formats : [])
    .map((id) => AD_FORMATS[id]?.ratio)
    .filter(Boolean)
    .join(' · ')
}

/**
 * Download name for a creative at a format, e.g.
 * badflower-artist-spotlight-instagram-post.png
 */
export function adFileName(ad, formatId, scene = null) {
  const format = AD_FORMATS[formatId]
  const parts = [ad?.subject, ad?.slug].filter(Boolean)
  if (scene != null) parts.push(`scene-${scene}`)
  parts.push(format?.file || formatId)
  return `${parts.join('-')}.png`
}
