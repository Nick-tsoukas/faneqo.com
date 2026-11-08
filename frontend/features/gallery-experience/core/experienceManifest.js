/**
 * Experience manifest — presentation data for Living Gallery / Enter the Night.
 * Not canonical Gallery/Night truth. Not a renderer.
 */

function text(value) {
  return String(value || '').trim()
}

function num(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function normalizeStageField(stage = {}) {
  return {
    deep: text(stage.deep) || '#050208',
    left: text(stage.left) || '#12080c',
    right: text(stage.right) || '#0c0812',
    top: text(stage.top) || '#1a1010',
    bottom: text(stage.bottom) || '#030204',
    highlight: text(stage.highlight) || '#c8a078',
    haze: text(stage.haze) || '#8a6040',
    highlightX: Math.min(1, Math.max(0, num(stage.highlightX, 0.5))),
    highlightY: Math.min(1, Math.max(0, num(stage.highlightY, 0.4))),
  }
}

export function normalizeMemory(memory, index = 0) {
  const id = text(memory?.id) || `memory-${index}`
  const src = text(memory?.src)
  const width = Math.max(1, num(memory?.width, 1600))
  const srcset = text(memory?.srcset)
  const srcsetCandidates = Array.isArray(memory?.srcsetCandidates)
    ? memory.srcsetCandidates
      .map((row) => ({
        src: text(row?.src),
        width: Math.max(0, num(row?.width, 0)),
      }))
      .filter((row) => row.src && row.width > 0)
    : []
  return {
    id,
    role: text(memory?.role) || 'memory',
    gravity: Math.min(1, Math.max(0, num(memory?.gravity, 0.5))),
    energy: Math.min(1, Math.max(0, num(memory?.energy, 0.5))),
    src,
    thumbSrc: text(memory?.thumbSrc) || src,
    mediumSrc: text(memory?.mediumSrc) || src,
    fullSrc: text(memory?.fullSrc) || src,
    srcset: srcset || undefined,
    srcsetCandidates,
    width,
    height: Math.max(1, num(memory?.height, 1066)),
    alt: text(memory?.alt) || 'Concert photograph',
    photographer: text(memory?.photographer),
    caption: text(memory?.caption),
    stage: normalizeStageField(memory?.stage),
  }
}

export function normalizeExperienceManifest(input) {
  const night = input?.night && typeof input.night === 'object' ? input.night : {}
  const memories = Array.isArray(input?.memories)
    ? input.memories.map((row, index) => normalizeMemory(row, index)).filter((row) => row.src)
    : []
  return {
    version: num(input?.version, 1),
    night: {
      artist: text(night.artist),
      venue: text(night.venue),
      city: text(night.city),
      state: text(night.state),
      date: text(night.date),
      displayDate: text(night.displayDate) || text(night.date),
      galleryTitle: text(night.galleryTitle),
      galleryCaption: text(night.galleryCaption),
      galleryId: text(night.galleryId),
      showLinked: night.showLinked === true || night.showLinked === false
        ? Boolean(night.showLinked)
        : undefined,
      photographer: text(night.photographer),
    },
    memories,
  }
}

/**
 * Map experience memories onto the existing Faneqo media read shape
 * so later production wiring can reuse layout/src helpers without
 * making the renderer own Gallery truth.
 */
export function memoriesToMediaItems(memories) {
  const list = Array.isArray(memories) ? memories : []
  return list.map((memory, index) => ({
    mediaId: memory.id,
    id: memory.id,
    url: memory.src,
    largeUrl: memory.fullSrc || memory.largeUrl || memory.src,
    thumbnailUrl: memory.thumbSrc || memory.src,
    mediumUrl: memory.mediumSrc || memory.src,
    srcset: memory.srcset,
    srcsetCandidates: memory.srcsetCandidates || [],
    width: memory.width,
    height: memory.height,
    alt: memory.alt,
    caption: memory.caption,
    photographer: memory.photographer,
    order: index,
    mime: 'image/jpeg',
  }))
}
