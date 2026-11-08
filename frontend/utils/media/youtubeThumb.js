/**
 * YouTube poster URLs. `maxresdefault` 404s as a 120×90 placeholder (load still succeeds).
 */

export function youtubeThumbUrl(id, size = 'hqdefault') {
  const yid = String(id || '').trim()
  if (!yid) return ''
  return `https://i.ytimg.com/vi/${yid}/${size}.jpg`
}

export function promoteYoutubeThumb(event) {
  const img = event?.target
  if (!img || img.naturalWidth > 120) return
  const src = String(img.currentSrc || img.src || '')
  const match = src.match(/\/vi\/([^/]+)\//)
  if (!match) return
  const hq = youtubeThumbUrl(match[1], 'hqdefault')
  if (hq && img.src !== hq) img.src = hq
}
