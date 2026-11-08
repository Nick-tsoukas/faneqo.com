'use strict';

/**
 * Global fan presentation identity — pure helpers. No Strapi, no I/O.
 *
 * `fan-profile` is the fan's own chosen identity. `fan` rows stay canonical for
 * relationship history, email greetings, and anonymous fallbacks. This module
 * owns the ONE precedence rule; controllers must not re-implement it.
 */

const inboxPure = require('../inbox/inboxPure');
const avatarPure = require('./fanProfileAvatarPure');

const DISPLAY_NAME_MAX = 40;
const FIRST_NAME_MAX = 50;
const LAST_NAME_MAX = 50;

/** Only these may be written through PATCH /fan-account/profile. */
const PROFILE_WRITABLE_FIELDS = ['displayName', 'firstName', 'lastName'];

/**
 * Media is never assigned by client-supplied id — avatar upload is its own
 * authenticated endpoint. Reject rather than ignore so a client cannot believe
 * an avatar write succeeded.
 */
const PROFILE_REJECTED_FIELDS = ['avatar', 'avatarId', 'avatarFileId', 'file', 'fileId', 'files'];

/**
 * Rejected only after whitespace normalization, so tabs, newlines and
 * line separators collapse to spaces instead of failing a paste.
 *
 * C0/C1 controls, zero-width characters, and bidi overrides. The invisible
 * ones matter because these names are rendered to artists: they allow
 * lookalike and direction-spoofed identities.
 */
const DISALLOWED_CHARS_RE =
  /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069]/;

function collapseWhitespace(value) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim();
}

/** Count code points, so astral characters are one visible unit, not two. */
function visibleLength(value) {
  return Array.from(String(value == null ? '' : value)).length;
}

function hasDisallowedCharacters(value) {
  return DISALLOWED_CHARS_RE.test(String(value == null ? '' : value));
}

function hasMarkup(value) {
  return /[<>]/.test(String(value == null ? '' : value));
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value == null ? '' : value).trim());
}

/**
 * Shared name validator.
 * Explicit null or an empty string clears the field — a fan may remove their
 * own name. A non-empty value must pass every rule; we never truncate.
 */
function validateNameField(value, { field, max }) {
  if (value === undefined) return { skip: true };
  if (value === null) return { value: null };
  if (typeof value !== 'string') {
    return { error: `${field}_invalid`, message: `${field} must be text.` };
  }

  const collapsed = collapseWhitespace(value);
  if (!collapsed) return { value: null };

  if (hasDisallowedCharacters(collapsed)) {
    return { error: `${field}_invalid`, message: `${field} contains characters we can't use.` };
  }
  if (hasMarkup(collapsed)) {
    return { error: `${field}_invalid`, message: `${field} cannot contain < or >.` };
  }
  // An email as a display name would leak the fan's address to artists.
  if (looksLikeEmail(collapsed)) {
    return { error: `${field}_invalid`, message: `${field} cannot be an email address.` };
  }
  if (visibleLength(collapsed) > max) {
    return { error: `${field}_too_long`, message: `${field} must be ${max} characters or fewer.` };
  }

  return { value: collapsed };
}

function validateDisplayName(value) {
  return validateNameField(value, { field: 'displayName', max: DISPLAY_NAME_MAX });
}

function validateFirstName(value) {
  return validateNameField(value, { field: 'firstName', max: FIRST_NAME_MAX });
}

function validateLastName(value) {
  return validateNameField(value, { field: 'lastName', max: LAST_NAME_MAX });
}

const FIELD_VALIDATORS = {
  displayName: validateDisplayName,
  firstName: validateFirstName,
  lastName: validateLastName,
};

/**
 * Allow-list a PATCH body into a safe update payload.
 * Unknown keys (userId, profileId, email, claimedArtistCount, …) are dropped;
 * media keys are rejected outright.
 */
function validateProfilePatch(body) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};

  for (const key of PROFILE_REJECTED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      return {
        error: 'avatar_not_writable',
        status: 400,
        message: 'Profile photo has its own upload step.',
      };
    }
  }

  const data = {};
  for (const field of PROFILE_WRITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) continue;
    const result = FIELD_VALIDATORS[field](input[field]);
    if (result.error) return { error: result.error, status: 400, message: result.message };
    if (result.skip) continue;
    data[field] = result.value;
  }

  if (!Object.keys(data).length) {
    return {
      error: 'no_editable_fields',
      status: 400,
      message: 'Send displayName, firstName or lastName.',
    };
  }

  return { data };
}

/** Media relation → public URL. Never returns the raw Upload object. */
function avatarUrlFromProfile(profile) {
  return avatarPure.avatarUrlFromMedia(avatarPure.avatarMediaFromProfile(profile));
}

/**
 * The ONE fan display identity rule.
 *
 *   1. profile.displayName  — the fan's explicit choice, shown verbatim
 *   2. profile.firstName    — structured name, last name reduced to an initial
 *   3. fan.firstName        — existing relationship name, same reduction
 *   4. "{city} fan"
 *   5. "Unnamed fan"
 *
 * A chosen displayName is never reduced to an initial: "Nik Beats" stays
 * "Nik Beats", while a structured "Nik Beats" becomes "Nik B.".
 *
 * `source` is diagnostic only and carries no private data.
 */
function resolveFanDisplayIdentity({ fan = null, profile = null } = {}) {
  const avatarUrl = avatarUrlFromProfile(profile);

  const chosen = inboxPure.normalizePersonName(profile?.displayName);
  if (chosen) {
    return { displayName: chosen, avatarUrl, source: 'profile_display_name' };
  }

  if (inboxPure.normalizePersonName(profile?.firstName)) {
    return {
      displayName: inboxPure.safeFanDisplayName({
        firstName: profile.firstName,
        lastName: profile.lastName,
      }),
      avatarUrl,
      source: 'profile_name',
    };
  }

  if (inboxPure.normalizePersonName(fan?.firstName)) {
    return {
      displayName: inboxPure.safeFanDisplayName({
        firstName: fan.firstName,
        lastName: fan.lastName,
      }),
      avatarUrl,
      source: 'fan_name',
    };
  }

  // city fan / Unnamed fan. Any stray fan.displayName is deliberately ignored
  // so precedence stays deterministic.
  const fallback = inboxPure.safeFanDisplayName({ city: fan?.city });
  return {
    displayName: fallback,
    avatarUrl,
    source: fallback === 'Unnamed fan' ? 'fallback' : 'city',
  };
}

/**
 * Initials from a resolved identity (or its displayName string).
 * "Nik Beats" → "NB". City / Unnamed fallbacks → "F". Never from email.
 */
function identityInitials(identity) {
  const name = typeof identity === 'string' ? identity : identity?.displayName;
  return inboxPure.fanInitials(typeof name === 'string' ? name : '');
}

/**
 * Safe artist-facing presentation fields from a resolver result.
 * Does not include `source`, email, profile id, or the raw Upload object.
 */
function presentResolvedIdentity(identity) {
  const resolved = identity && typeof identity === 'object'
    ? identity
    : resolveFanDisplayIdentity({ fan: null, profile: null });
  return {
    displayName: resolved.displayName || 'Unnamed fan',
    initials: identityInitials(resolved),
    avatarUrl: resolved.avatarUrl || null,
  };
}

/**
 * Memory-store / test fallback: resolve each fan with no FanProfile I/O.
 * Production wires `resolveIdentitiesForFans` instead.
 */
function resolveIdentitiesFromFans(fans) {
  const byFanId = new Map();
  for (const fan of fans || []) {
    if (fan == null || fan.id == null) continue;
    byFanId.set(fan.id, resolveFanDisplayIdentity({ fan, profile: null }));
  }
  return byFanId;
}

/** Self-scoped GET/PATCH response. Email is read from the auth user, never stored here. */
function serializeSelfProfile({ profile = null, user = null } = {}) {
  return {
    displayName: profile?.displayName || null,
    firstName: profile?.firstName || null,
    lastName: profile?.lastName || null,
    avatarUrl: avatarUrlFromProfile(profile),
    profileCompletedAt: profile?.profileCompletedAt || null,
    email: user?.email || null,
  };
}

function positiveId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

/** Unique accountUser ids across fan rows — the input to the bulk profile loader. */
function accountUserIdsFromFans(fans) {
  const ids = new Set();
  for (const fan of fans || []) {
    const raw = fan?.accountUserId ?? fan?.accountUser?.id ?? fan?.accountUser ?? null;
    const id = positiveId(raw);
    if (id) ids.add(id);
  }
  return [...ids];
}

function chunk(items, size) {
  const max = Math.max(1, Number(size) || 1);
  const out = [];
  for (let i = 0; i < items.length; i += max) out.push(items.slice(i, i + max));
  return out;
}

module.exports = {
  DISPLAY_NAME_MAX,
  FIRST_NAME_MAX,
  LAST_NAME_MAX,
  PROFILE_WRITABLE_FIELDS,
  PROFILE_REJECTED_FIELDS,
  collapseWhitespace,
  visibleLength,
  hasDisallowedCharacters,
  hasMarkup,
  looksLikeEmail,
  validateDisplayName,
  validateFirstName,
  validateLastName,
  validateProfilePatch,
  avatarUrlFromProfile,
  resolveFanDisplayIdentity,
  identityInitials,
  presentResolvedIdentity,
  resolveIdentitiesFromFans,
  serializeSelfProfile,
  positiveId,
  accountUserIdsFromFans,
  chunk,
};
