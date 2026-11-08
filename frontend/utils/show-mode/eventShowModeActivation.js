/**
 * Event → Show Mode activation on the dashboard Events list.
 *
 * The backend owns this policy end to end
 * (`qrserver/src/utils/showMode/eventActivationPure.js`):
 *
 *   opensAt  = eventStart - 24h
 *   closesAt = min(eventStart + 4h, next 6 AM in the resolved venue zone)
 *
 * Event `date` + `time` carry no timezone, so this module never rebuilds the
 * Event's start instant. Doing that in the browser zone made a touring artist
 * in Los Angeles see a Chicago show as closed while the server considered it
 * eligible. Instead the server sends absolute `opensAt` / `closesAt` instants
 * (batched, band-scoped, on `GET /api/bands/:id/show-mode`) and we only compare
 * them against the local clock — which is the same instant everywhere.
 *
 * Deciding which control to draw is presentation. `activateFromEvent`
 * re-derives the window at click time and refuses anything out of window.
 */

/** Mirrors the backend state enum. Values are read, never recomputed. */
export const ACTIVATION_STATE = Object.freeze({
  NO_TIME: 'no_time',
  TOO_EARLY: 'too_early',
  OPEN: 'open',
  CLOSED: 'closed',
})

export const EVENT_SHOW_MODE_CONTROL = Object.freeze({
  /** Nothing to draw: no permission, or the server has not answered yet. */
  NONE: 'none',
  LIVE: 'live',
  START: 'start',
  /** Upcoming: quiet status telling the artist when it opens. */
  WAITING: 'waiting',
  /** Event has no usable time, so Event-backed activation is unavailable. */
  MISSING_TIME: 'missing_time',
  /** Historical: label only, never a control. */
  PAST: 'past',
  /** Eligible, but the artist already has a different session live. */
  OTHER_LIVE: 'other_live',
})

function instantMs(value) {
  if (value == null || value === '') return null
  const ms = value instanceof Date ? value.getTime() : Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

/**
 * Normalize one server activation row into absolute milliseconds.
 * Returns null for anything unusable, so callers fail closed rather than
 * inventing a window.
 */
export function normalizeServerActivation(raw) {
  if (!raw || typeof raw !== 'object') return null
  const eventId = Number(raw.eventId)
  if (!Number.isInteger(eventId) || eventId <= 0) return null

  return {
    eventId,
    state: typeof raw.state === 'string' ? raw.state : null,
    eligible: !!raw.eligible,
    timezone: typeof raw.timezone === 'string' && raw.timezone ? raw.timezone : null,
    eventStartMs: instantMs(raw.eventStartsAt),
    opensAtMs: instantMs(raw.opensAt),
    closesAtMs: instantMs(raw.closesAt),
    reason: typeof raw.reason === 'string' ? raw.reason : null,
  }
}

/** Index a batched activation response by event id. */
export function indexServerActivation(rows) {
  const index = {}
  for (const row of Array.isArray(rows) ? rows : []) {
    const normalized = normalizeServerActivation(row)
    if (normalized) index[String(normalized.eventId)] = normalized
  }
  return index
}

/**
 * The live state at `nowMs`, from the server's absolute window.
 *
 * The server's own `state` was true when it answered; a window can open or
 * close while the dashboard stays open, so the instants are what we trust.
 * Opening is inclusive, closing is exclusive — same as the backend.
 */
export function deriveActivationState(activation, nowMs = Date.now()) {
  if (!activation) return null
  if (activation.opensAtMs == null || activation.closesAtMs == null) {
    return activation.state || ACTIVATION_STATE.NO_TIME
  }
  if (nowMs < activation.opensAtMs) return ACTIVATION_STATE.TOO_EARLY
  if (nowMs >= activation.closesAtMs) return ACTIVATION_STATE.CLOSED
  return ACTIVATION_STATE.OPEN
}

function browserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null
  } catch {
    return null
  }
}

function zoneAbbreviation(date, timeZone) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
      .formatToParts(date)
    return parts.find((part) => part.type === 'timeZoneName')?.value || ''
  } catch {
    return ''
  }
}

/**
 * "Show Mode available Sep 15 at 8:00 PM" in the resolved venue zone.
 *
 * The abbreviation is appended only when that zone differs from the browser's,
 * where the bare time would otherwise read as the wrong hour.
 */
export function formatActivationOpensAt(opensAtMs, timeZone = null) {
  if (!Number.isFinite(opensAtMs)) return ''
  const date = new Date(opensAtMs)

  const dayOptions = { month: 'short', day: 'numeric' }
  const timeOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
  if (timeZone) {
    dayOptions.timeZone = timeZone
    timeOptions.timeZone = timeZone
  }

  let label
  try {
    const day = new Intl.DateTimeFormat('en-US', dayOptions).format(date)
    const time = new Intl.DateTimeFormat('en-US', timeOptions).format(date)
    label = `Show Mode available ${day} at ${time}`
  } catch {
    return ''
  }

  const local = browserTimeZone()
  if (timeZone && local && timeZone !== local) {
    const abbreviation = zoneAbbreviation(date, timeZone)
    if (abbreviation) label += ` ${abbreviation}`
  }

  return label
}

/**
 * The single control an Event card should render.
 *
 * A session started inside the window may legitimately outlive `closesAt`, so
 * the live check wins over the window. Without a server answer we draw nothing
 * rather than guess — a wrong Start button costs the artist a failed tap.
 */
export function eventShowModeControl({
  activation = null,
  nowMs = Date.now(),
  canOperateShowMode = false,
  isLiveForEvent = false,
  bandSessionLive = false,
} = {}) {
  if (isLiveForEvent) {
    return {
      kind: EVENT_SHOW_MODE_CONTROL.LIVE,
      label: 'Show Mode Live',
      hint: 'Show Mode is live for this event. Open the Show Mode card to manage it.',
      state: ACTIVATION_STATE.OPEN,
      timezone: activation?.timezone || null,
      eventStartMs: activation?.eventStartMs ?? null,
      opensAtMs: activation?.opensAtMs ?? null,
      closesAtMs: activation?.closesAtMs ?? null,
    }
  }

  const blank = {
    kind: EVENT_SHOW_MODE_CONTROL.NONE,
    label: '',
    hint: '',
    state: null,
    timezone: activation?.timezone || null,
    eventStartMs: activation?.eventStartMs ?? null,
    opensAtMs: activation?.opensAtMs ?? null,
    closesAtMs: activation?.closesAtMs ?? null,
  }

  if (!canOperateShowMode || !activation) return blank

  const state = deriveActivationState(activation, nowMs)

  if (state === ACTIVATION_STATE.OPEN) {
    // A live session is never replaced. The conflict outranks the window so
    // the artist is sent to the session they already have.
    if (bandSessionLive) {
      return {
        ...blank,
        kind: EVENT_SHOW_MODE_CONTROL.OTHER_LIVE,
        label: 'Another show is live',
        hint: 'Show Mode is already live for another show. Open the Show Mode card to manage it.',
        state,
      }
    }
    return {
      ...blank,
      kind: EVENT_SHOW_MODE_CONTROL.START,
      label: 'Start Show Mode',
      hint: 'Start Show Mode for this event now.',
      state,
    }
  }

  if (state === ACTIVATION_STATE.TOO_EARLY) {
    return {
      ...blank,
      kind: EVENT_SHOW_MODE_CONTROL.WAITING,
      label: formatActivationOpensAt(activation.opensAtMs, activation.timezone),
      hint: 'Show Mode opens 24 hours before the event starts.',
      state,
    }
  }

  if (state === ACTIVATION_STATE.NO_TIME) {
    return {
      ...blank,
      kind: EVENT_SHOW_MODE_CONTROL.MISSING_TIME,
      label: 'Add an event time to use Show Mode.',
      hint: 'Show Mode needs the event date and start time.',
      state,
    }
  }

  // Historical. A past Event must never mint a new session; manual Show Mode
  // stays available on the Show Mode card for tonight's unplanned show.
  return {
    ...blank,
    kind: EVENT_SHOW_MODE_CONTROL.PAST,
    label: 'Past event',
    hint: '',
    state,
  }
}

const SORT_RANK = Object.freeze({
  LIVE: 0,
  READY: 1,
  UPCOMING: 2,
  PAST: 3,
  UNDATED: 4,
})

function sortRank(item) {
  if (item?.showModeLiveForEvent) return SORT_RANK.LIVE
  switch (item?.showModeControl?.state) {
    case ACTIVATION_STATE.OPEN: return SORT_RANK.READY
    case ACTIVATION_STATE.TOO_EARLY: return SORT_RANK.UPCOMING
    case ACTIVATION_STATE.CLOSED: return SORT_RANK.PAST
    default: return SORT_RANK.UNDATED
  }
}

function numericId(item) {
  const id = Number(item?.id)
  return Number.isFinite(id) ? id : 0
}

/**
 * Tonight first, then what is coming, then what happened.
 *
 * Pure and deterministic: ranked by the server's absolute timing, never by the
 * browser's reading of `date` + `time`, with the id as a final tiebreak so the
 * order never shuffles between renders.
 */
export function sortDashboardEvents(items) {
  return [...(Array.isArray(items) ? items : [])].sort((a, b) => {
    const rankA = sortRank(a)
    const rankB = sortRank(b)
    if (rankA !== rankB) return rankA - rankB

    const startA = a?.showModeControl?.eventStartMs
    const startB = b?.showModeControl?.eventStartMs

    if (Number.isFinite(startA) && Number.isFinite(startB) && startA !== startB) {
      // Historical reads newest first; everything else reads soonest first.
      return rankA === SORT_RANK.PAST ? startB - startA : startA - startB
    }
    if (Number.isFinite(startA) !== Number.isFinite(startB)) {
      return Number.isFinite(startA) ? -1 : 1
    }

    return numericId(a) - numericId(b)
  })
}
