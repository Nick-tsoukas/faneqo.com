import { isPlaceholderText, showcaseLinkKeys } from './artistSnapshot.js'

/** Story film length for Product Showcase. One scene. */
export const PRODUCT_MOTION_MS = 11000

export const PRODUCT_MOTION_CLOSE = 'Your music. Your fans. Your world.'
export const FAN_LIST_CLOSE = "Your followers aren't your fan list."
export const NIGHT_CLOSE = 'The night lives on.'

export function motionCloseFor(style) {
  if (style === 'fan-list') return FAN_LIST_CLOSE
  if (style === 'night') return NIGHT_CLOSE
  return PRODUCT_MOTION_CLOSE
}

/**
 * Settings stored on content.motion. Playback time is not stored.
 * Absent motion, or enabled: false, leaves the still composition alone.
 */
export function defaultProductMotion(style) {
  return {
    enabled: true,
    durationMs: PRODUCT_MOTION_MS,
    scenes: [{ index: 0, durationMs: PRODUCT_MOTION_MS }],
    close: motionCloseFor(style),
  }
}

/**
 * Which Product Showcase film can be exported. Null means the creative stays a still.
 * The artist-page phone is the original film. Fan list and The night are the others.
 */
export function productMotionFilm(content) {
  const style = content?.style
  if (!style || style === 'page') {
    if ((content?.excerpt || 'page') !== 'page') return null
    return 'page'
  }
  if (style === 'fan-list' || style === 'night') return style
  return null
}

export function motionSettings(content) {
  const motion = content?.motion
  if (!motion || motion.enabled === false) return null
  const durationMs = Number(motion.durationMs)
  if (!Number.isFinite(durationMs) || durationMs <= 0) return null
  return {
    enabled: true,
    durationMs,
    close: String(motion.close || PRODUCT_MOTION_CLOSE).slice(0, 120),
  }
}

export function formatMotionClock(ms) {
  const safe = Number.isFinite(Number(ms)) ? Math.max(0, Number(ms)) : 0
  return `${(Math.round(safe / 100) / 10).toFixed(1)}s`
}

/** Split a closing line on sentence punctuation so the end card can stack. */
export function closeLines(text) {
  const raw = String(text || '').trim()
  if (!raw) return []
  const parts = raw.match(/[^.!?]+[.!?]?/g)
  if (!parts) return [raw]
  return parts.map((part) => part.trim()).filter(Boolean)
}

/**
 * How far the phone page can travel, in board pixels.
 * Missing song, links, bio, or fan list add nothing — the film does not invent them.
 */
export function pageTravel(snapshot) {
  const snap = snapshot || {}
  const hasBio = !isPlaceholderText(snap.bio, 'bio') && String(snap.bio || '').trim()
  const song = snap.song
  const hasSong = Boolean(song && !isPlaceholderText(song.title, 'song') && String(song.title || '').trim())
  const links = showcaseLinkKeys(snap, null, 3)
  const hasList = Boolean(snap.fanList?.enabled)
  if (!hasBio && !hasSong && !links.length && !hasList) return 0
  let px = 0
  if (hasBio) px += 40
  if (hasSong) px += 120
  if (links.length) px += 36 * links.length
  if (hasList) px += 48
  // The portrait stays pinned. This distance only lifts the sheet under it,
  // far enough to bring the fan list in without crossing a face.
  return Math.min(px, 200)
}

function clamp(n, a, b) {
  return Math.min(b, Math.max(a, n))
}

function seg(t, start, end) {
  if (end <= start) return t >= end ? 1 : 0
  return clamp((t - start) / (end - start), 0, 1)
}

function outCubic(t) {
  return 1 - (1 - t) ** 3
}

function smooth(t) {
  return t * t * (3 - 2 * t)
}

/**
 * Deterministic pose for the Product Showcase story film.
 * The same t always returns the same numbers. No clock, no randomness.
 * Times are authored at PRODUCT_MOTION_MS and scale with durationMs.
 */
export function productShowcasePose(tMs, durationMs = PRODUCT_MOTION_MS) {
  const duration = Number.isFinite(Number(durationMs)) && Number(durationMs) > 0 ? Number(durationMs) : PRODUCT_MOTION_MS
  const t = clamp(Number(tMs) || 0, 0, duration) * (PRODUCT_MOTION_MS / duration)

  // Frame 0 is the Reel's cover and autoplay frame: the headline is already
  // set and only settles. The phone is the entrance.
  const line1In = outCubic(seg(t, 0, 900))
  const line2In = outCubic(seg(t, 0, 1150))
  // The phone is in the cover frame, low; its rise is the entrance.
  const phoneIn = outCubic(seg(t, 300, 3600))
  const live = smooth(seg(t, 3600, 7600))
  // One hand-off, in order: the headline leaves, then the close arrives.
  // The close lands at 9.6s and the last 1.4s hold still.
  const headOut = smooth(seg(t, 7600, 8500))
  const settle = smooth(seg(t, 7800, 9200))
  // The phone steps back before the closing words arrive under it.
  const lift = smooth(seg(t, 7900, 8900))
  const close = outCubic(seg(t, 8700, 9700))
  const hold = 1 - headOut
  // The sheet travels, then returns so the portrait — not a clipped row — is the last thing you see.
  const scroll = live * (1 - settle)

  return {
    kicker: round(hold),
    line1: round(hold),
    line2: round(hold),
    line1Y: round((1 - line1In) * 14),
    line2Y: round((1 - line2In) * 18),
    mastY: round((1 - phoneIn) * 200),
    mastScale: round(1.05 - phoneIn * 0.05),
    phoneOpacity: round(1 - lift * 0.06),
    phoneY: round((1 - phoneIn) * 420 - lift * 96),
    phoneScale: round(0.94 + phoneIn * 0.06 - lift * 0.18),
    scroll: round(scroll),
    drift: round(phoneIn * 0.2 + scroll * 0.8),
    dock: round(phoneIn * hold),
    glow: round(phoneIn * (1 - lift * 0.35)),
    close: round(close),
    closeY: round((1 - close) * 28),
  }
}

function round(n) {
  return Math.round(n * 10000) / 10000
}

function scaledTime(tMs, durationMs) {
  const duration = Number.isFinite(Number(durationMs)) && Number(durationMs) > 0 ? Number(durationMs) : PRODUCT_MOTION_MS
  return clamp(Number(tMs) || 0, 0, duration) * (PRODUCT_MOTION_MS / duration)
}

/**
 * Fan list film. The photograph holds. The line arrives, then the real join card,
 * then the gallery thumbs. The close replaces the opening line.
 */
export function fanListPose(tMs, durationMs = PRODUCT_MOTION_MS) {
  const t = scaledTime(tMs, durationMs)
  const kicker = outCubic(seg(t, 80, 700))
  const line1 = outCubic(seg(t, 280, 1400))
  const line2 = outCubic(seg(t, 620, 1900))
  const card = outCubic(seg(t, 2200, 5200))
  const thumbs = outCubic(seg(t, 4800, 7000))
  const headOut = smooth(seg(t, 7800, 8700))
  const close = outCubic(seg(t, 8500, 9600))
  const hold = 1 - headOut
  return {
    kicker: round(kicker * hold),
    line1: round(line1 * hold),
    line2: round(line2 * hold),
    line1Y: round((1 - line1) * 28),
    line2Y: round((1 - line2) * 36),
    card: round(card * (1 - close)),
    cardY: round((1 - card) * 64),
    thumbs: round(thumbs * (1 - close)),
    close: round(close),
    closeY: round((1 - close) * 24),
  }
}

/**
 * Gallery film. Up to three real photographs crossfade. Type arrives late.
 * A missing frame holds the previous photograph. Nothing is invented.
 */
export function nightPose(tMs, durationMs = PRODUCT_MOTION_MS, count = 1) {
  const t = scaledTime(tMs, durationMs)
  const frames = Math.max(1, Math.min(3, Number(count) || 1))
  const toB = frames > 1 ? smooth(seg(t, 2600, 3400)) : 0
  const toC = frames > 2 ? smooth(seg(t, 5600, 6400)) : 0
  const type = outCubic(seg(t, 6800, 8400))
  const close = outCubic(seg(t, 8400, 9600))
  return {
    a: round(1 - toB),
    b: round(toB * (1 - toC)),
    c: round(toC),
    type: round(type * (1 - close * 0.2)),
    strip: round(outCubic(seg(t, 7400, 9200)) * (1 - close * 0.4)),
    close: round(close),
    closeY: round((1 - close) * 24),
  }
}
