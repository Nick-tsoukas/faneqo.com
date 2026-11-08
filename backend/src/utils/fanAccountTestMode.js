'use strict';

/**
 * Development-only fan magic-link request-throttle bypass.
 *
 * Production always wins: NODE_ENV=production ignores FAN_ACCOUNT_TEST_MODE.
 * Bypass never uses client headers/query strings.
 * Does not affect campaign cooldowns, token TTL, one-time use, or auth.
 */

function isTruthyFlag(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function isProductionNodeEnv(nodeEnv = process.env.NODE_ENV) {
  return String(nodeEnv || '').trim().toLowerCase() === 'production';
}

function isFanAccountTestModeEnabled({
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FAN_ACCOUNT_TEST_MODE,
} = {}) {
  if (isProductionNodeEnv(nodeEnv)) return false;
  return isTruthyFlag(flag);
}

function parseTestEmailAllowlist(raw = process.env.FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST) {
  return String(raw || '')
    .split(/[,;\n]+/)
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.includes('@'));
}

/**
 * Bypass application magic-link *request* throttling only.
 * Requires: non-production + FAN_ACCOUNT_TEST_MODE + allowlisted email.
 */
function shouldBypassMagicLinkRateLimit({
  email,
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FAN_ACCOUNT_TEST_MODE,
  allowlist = process.env.FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST,
} = {}) {
  if (!isFanAccountTestModeEnabled({ nodeEnv, flag })) return false;
  const list = parseTestEmailAllowlist(allowlist);
  if (!list.length) return false;
  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized || !normalized.includes('@')) return false;
  return list.includes(normalized);
}

function logFanAccountTestModeOnBoot(strapi) {
  if (!isFanAccountTestModeEnabled()) return;
  const list = parseTestEmailAllowlist();
  const log = strapi?.log?.warn?.bind(strapi.log) || console.warn;
  if (!list.length) {
    log(
      '[Fan Account] DEVELOPMENT TEST MODE is set, but FAN_ACCOUNT_TEST_EMAIL_ALLOWLIST is empty — magic-link request throttling still applies.'
    );
    return;
  }
  log(
    '[Fan Account] DEVELOPMENT TEST MODE enabled — magic-link request throttling relaxed for allowlisted test identities.'
  );
}

module.exports = {
  isTruthyFlag,
  isProductionNodeEnv,
  isFanAccountTestModeEnabled,
  parseTestEmailAllowlist,
  shouldBypassMagicLinkRateLimit,
  logFanAccountTestModeOnBoot,
};
