'use strict';

/**
 * Shared sanitizer for fan post-auth destinations.
 *
 * Internal paths only. Never trust a client-supplied URL as a redirect.
 * Frontend `musicbizqr/utils/fan/safeFanReturnTo.js` must keep the same rules.
 */

const FAN_RETURN_FALLBACK = '/fan';
const FAN_VERIFY_FALLBACK = '/fan?welcome=1';
const MAX_LEN = 512;
const CONTROL_OR_SLASH = /[\u0000-\u001f\u007f\\\u2028\u2029]/;
const ENCODED_CONTROL = /%0[0-9a-d]|%7f/i;
const SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const FAN_AUTH_PREFIXES = ['/fan/login', '/fan/verify'];

function firstString(value) {
  if (Array.isArray(value)) return firstString(value[0]);
  if (value == null) return '';
  return String(value);
}

function decodeLayer(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function fullyDecode(value) {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    const next = decodeLayer(current);
    if (next == null) return null;
    if (next === current) break;
    current = next;
  }
  return current;
}

function pathnameOf(path) {
  const cut = String(path || '').split(/[?#]/)[0];
  return cut || '';
}

function isFanAuthDestination(pathname) {
  return FAN_AUTH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function looksUnsafe(raw) {
  if (!raw || raw.length > MAX_LEN) return true;
  if (CONTROL_OR_SLASH.test(raw) || ENCODED_CONTROL.test(raw)) return true;
  if (SCHEME.test(raw)) return true;
  if (!raw.startsWith('/')) return true;
  if (raw.startsWith('//')) return true;
  if (raw.includes('..')) return true;
  return false;
}

function sanitizeFanReturnTo(value, { fallback = FAN_RETURN_FALLBACK } = {}) {
  const raw = firstString(value).trim();
  if (!raw) return fallback;
  if (looksUnsafe(raw)) return fallback;

  const decoded = fullyDecode(raw);
  if (decoded == null || looksUnsafe(decoded)) return fallback;

  const hashless = raw.split('#')[0];
  const pathname = pathnameOf(hashless);
  if (!pathname || isFanAuthDestination(pathname)) return fallback;

  return hashless;
}

function isLegacyPassportNightPath(value) {
  return /^\/fan\/passport\/nights\/\d+$/.test(pathnameOf(value));
}

function resolveFanLoginReturnTo(value, { fallback = FAN_RETURN_FALLBACK } = {}) {
  const dest = sanitizeFanReturnTo(value, { fallback });
  if (!dest) return dest;
  if (isLegacyPassportNightPath(dest)) return '/fan/passport';
  return dest;
}

function resolveMagicLinkRedirect(stored) {
  return resolveFanLoginReturnTo(stored, { fallback: FAN_VERIFY_FALLBACK });
}

module.exports = {
  FAN_RETURN_FALLBACK,
  FAN_VERIFY_FALLBACK,
  sanitizeFanReturnTo,
  isLegacyPassportNightPath,
  resolveFanLoginReturnTo,
  resolveMagicLinkRedirect,
};
