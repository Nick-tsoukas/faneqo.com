'use strict';

/**
 * Intentional Event → Show Mode activation.
 * Event creation must never make Show Mode live. The artist starts it.
 *
 * Event-backed Show Mode is an immediate live action, never a scheduling
 * action. An Event may only mint a session inside a bounded window around its
 * own start, so a historical Event cannot manufacture a new campaign,
 * attendance window, or recap, and a far-future Event cannot go live now.
 *
 * Source label: `event_page` is the existing enum value for an Event surface.
 * `event_dashboard` would be clearer, but adding an enum value is a schema
 * change. Do not use `event_auto` for this click.
 */

const integrity = require('./showModeIntegrityPure');
const showTime = require('../showTime');

const EVENT_DASHBOARD_SOURCE = 'event_page';

const ACTIVATION_OPENS_BEFORE_MS = 24 * 60 * 60 * 1000;
const ACTIVATION_CLOSES_AFTER_MS = 4 * 60 * 60 * 1000;

const ACTIVATION_STATE = Object.freeze({
  NO_TIME: 'no_time',
  TOO_EARLY: 'too_early',
  OPEN: 'open',
  CLOSED: 'closed',
});

/** Stable reason code per state, so the client never parses prose. */
const ACTIVATION_REASON = Object.freeze({
  [ACTIVATION_STATE.NO_TIME]: 'event_time_missing',
  [ACTIVATION_STATE.TOO_EARLY]: 'event_activation_not_open',
  [ACTIVATION_STATE.CLOSED]: 'event_activation_closed',
  [ACTIVATION_STATE.OPEN]: null,
});

const ACTIVATION_REFUSAL = Object.freeze({
  [ACTIVATION_STATE.NO_TIME]: {
    error: 'event_time_missing',
    status: 400,
    message: 'This event needs a date and a start time before Show Mode can start from it.',
  },
  [ACTIVATION_STATE.TOO_EARLY]: {
    error: 'event_activation_not_open',
    status: 400,
    message: 'Show Mode opens 24 hours before the event starts.',
  },
  [ACTIVATION_STATE.CLOSED]: {
    error: 'event_activation_closed',
    status: 400,
    message: 'This event has already passed. Start Show Mode manually if you are playing right now.',
  },
});

function positiveId(value) {
  if (value && typeof value === 'object') {
    return positiveId(value.id ?? value.data?.id);
  }
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function trimText(value) {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text || null;
}

function eventBandId(event) {
  return positiveId(event?.band?.id ?? event?.band);
}

function eventBelongsToBand(event, bandId) {
  const eventBand = eventBandId(event);
  const band = positiveId(bandId);
  return !!(eventBand && band && eventBand === band);
}

function showModeAlreadyLive(band) {
  return integrity.showModeAlreadyLive(band);
}

function eventShowDetails(event) {
  return {
    eventId: positiveId(event?.id),
    title: trimText(event?.title),
    venue: trimText(event?.venue),
    city: trimText(event?.city),
    region: trimText(event?.state) || trimText(event?.region),
    country: trimText(event?.country),
    date: trimText(event?.date),
    sourceDetail: EVENT_DASHBOARD_SOURCE,
  };
}

/**
 * Strict Event `time` parse. Unlike showTime.parseTimeParts this never falls
 * back to a default 8 PM: an Event with no usable time is not activatable.
 */
function parseEventTimeParts(time) {
  if (typeof time !== 'string') return null;
  const match = time.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return { hour, minute };
}

/** The Event's own start instant, or null when date/time are unusable. */
function eventStartInstant(event, timeZone = null) {
  const dateParts = showTime.parseDateParts(event?.date);
  const timeParts = parseEventTimeParts(event?.time);
  if (!dateParts || !timeParts) return null;

  const start = showTime.isValidTimeZone(timeZone)
    ? showTime.zonedTimeToUtc({ ...dateParts, ...timeParts }, timeZone)
    : new Date(dateParts.year, dateParts.month - 1, dateParts.day, timeParts.hour, timeParts.minute, 0, 0);

  return Number.isNaN(start.getTime()) ? null : start;
}

/**
 * The bounded window in which this Event may start a live session.
 *
 *   opensAt  = eventStart - 24h
 *   closesAt = min(eventStart + 4h, next 6 AM local after eventStart)
 */
function resolveEventActivationWindow({ event, timeZone = null, now = new Date() } = {}) {
  const eventStart = eventStartInstant(event, timeZone);
  if (!eventStart) {
    return {
      state: ACTIVATION_STATE.NO_TIME,
      eventStart: null,
      opensAt: null,
      closesAt: null,
    };
  }

  const opensAt = new Date(eventStart.getTime() - ACTIVATION_OPENS_BEFORE_MS);
  const byDuration = new Date(eventStart.getTime() + ACTIVATION_CLOSES_AFTER_MS);
  const safetyCeiling = showTime.nextLocalSixAm(eventStart, timeZone);
  const closesAt = byDuration.getTime() <= safetyCeiling.getTime() ? byDuration : safetyCeiling;

  const at = now instanceof Date && !Number.isNaN(now.getTime()) ? now : new Date();
  let state = ACTIVATION_STATE.OPEN;
  if (at.getTime() < opensAt.getTime()) state = ACTIVATION_STATE.TOO_EARLY;
  else if (at.getTime() >= closesAt.getTime()) state = ACTIVATION_STATE.CLOSED;

  return { state, eventStart, opensAt, closesAt };
}

/**
 * Timezone authority for Event activation, most trustworthy signal first.
 *
 * The Event schema has no timezone column, so the venue's `state` is the most
 * canonical location signal we actually own; `resolveShowTimeZone` reads it
 * first and then falls back to the band's stored `showModeTimezone`. The
 * browser's zone comes last, and only when nothing else is usable: a touring
 * artist's laptop is in whatever zone they woke up in, so trusting it first let
 * the activation window drift away from the venue's clock.
 */
function resolveActivationTimeZone({ event, band, clientTimezone = null } = {}) {
  return showTime.resolveUsableTimeZone(
    showTime.resolveShowTimeZone({ event, band }),
    clientTimezone
  );
}

/**
 * Authoritative, serializable activation timing for one Event.
 *
 * Absolute instants only. The client compares them against `Date.now()` rather
 * than rebuilding the Event's start from `date` + `time` in the browser zone,
 * which is how an eligible show could look closed to a touring artist.
 * Presentation only — `activateFromEvent` re-derives all of this at click time.
 */
function describeEventActivation({ event, band = null, clientTimezone = null, now = new Date() } = {}) {
  const timeZone = resolveActivationTimeZone({ event, band, clientTimezone });
  const window = resolveEventActivationWindow({ event, timeZone, now });

  return {
    eventId: positiveId(event?.id),
    state: window.state,
    eligible: window.state === ACTIVATION_STATE.OPEN,
    timezone: timeZone,
    eventStartsAt: showTime.toIso(window.eventStart),
    opensAt: showTime.toIso(window.opensAt),
    closesAt: showTime.toIso(window.closesAt),
    reason: ACTIVATION_REASON[window.state] || null,
  };
}

/** Refusal payload for a window that is not open, or null when it is. */
function activationRefusal(window) {
  const refusal = ACTIVATION_REFUSAL[window?.state];
  if (!refusal) return null;
  return {
    ...refusal,
    activation: {
      state: window.state,
      eventStartsAt: showTime.toIso(window.eventStart),
      opensAt: showTime.toIso(window.opensAt),
      closesAt: showTime.toIso(window.closesAt),
    },
  };
}

module.exports = {
  EVENT_DASHBOARD_SOURCE,
  ACTIVATION_OPENS_BEFORE_MS,
  ACTIVATION_CLOSES_AFTER_MS,
  ACTIVATION_STATE,
  ACTIVATION_REASON,
  positiveId,
  trimText,
  eventBandId,
  eventBelongsToBand,
  showModeAlreadyLive,
  eventShowDetails,
  parseEventTimeParts,
  eventStartInstant,
  resolveEventActivationWindow,
  resolveActivationTimeZone,
  describeEventActivation,
  activationRefusal,
};
