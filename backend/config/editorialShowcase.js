'use strict';

/**
 * Editorial Showcase entitlement configuration.
 * Emails are normalized to lowercase for comparison.
 * Do not expose this list in public API responses.
 */
const ALLOWLIST_EMAILS = new Set([
  'tara@rockdnamag.com',
]);

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
}

function isAllowlistedEmail(email) {
  return ALLOWLIST_EMAILS.has(normalizeEmail(email));
}

function hasEditorialShowcaseAccess(user) {
  if (!user) return false;
  if (user.editorialShowcaseAccess === true) return true;
  return isAllowlistedEmail(user.email);
}

module.exports = {
  ALLOWLIST_EMAILS,
  normalizeEmail,
  isAllowlistedEmail,
  hasEditorialShowcaseAccess,
};
