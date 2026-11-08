'use strict';

/**
 * Campaign testing modes.
 *
 * Development (`FANEQO_CAMPAIGN_TEST_MODE`):
 *   Non-production only. Bypasses lastMessagedAt time cooldown.
 *   Optional FANEQO_CAMPAIGN_TEST_EMAILS. Does not clamp audience.
 *
 * Production (`FANEQO_PROD_CAMPAIGN_TEST_MODE`):
 *   NODE_ENV=production AND explicit flag AND band allowlist AND email allowlist.
 *   Clamps Message Fans audience to the email allowlist, then bypasses 24h cooldown
 *   for those remaining recipients only. Misconfiguration fails closed.
 *
 * Neither mode trusts client headers/query/frontend flags.
 * Neither bypasses unsubscribe, bounce, complaint, ownership, or worker safety.
 */

function isTruthyFlag(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function isProductionNodeEnv(nodeEnv = process.env.NODE_ENV) {
  return String(nodeEnv || '').trim().toLowerCase() === 'production';
}

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function parseEmailList(raw) {
  const seen = new Set();
  const out = [];
  for (const part of String(raw || '').split(/[,;\n]+/)) {
    const email = normalizeEmail(part);
    if (!email || !email.includes('@') || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

function parseBandIds(raw) {
  const seen = new Set();
  const out = [];
  for (const part of String(raw || '').split(/[,;\n]+/)) {
    const trimmed = String(part || '').trim();
    if (!/^\d+$/.test(trimmed)) continue;
    const id = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function parseCampaignTestEmails(raw = process.env.FANEQO_CAMPAIGN_TEST_EMAILS) {
  return parseEmailList(raw);
}

function parseProdCampaignTestEmails(raw = process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS) {
  return parseEmailList(raw);
}

function parseProdCampaignTestBandIds(raw = process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS) {
  return parseBandIds(raw);
}

function isCampaignTestModeEnabled({
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FANEQO_CAMPAIGN_TEST_MODE,
} = {}) {
  if (isProductionNodeEnv(nodeEnv)) return false;
  return isTruthyFlag(flag);
}

function isProdCampaignTestFlagOn({
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE,
} = {}) {
  return isProductionNodeEnv(nodeEnv) && isTruthyFlag(flag);
}

function getProdCampaignTestMisconfigReason({
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE,
  bandIds = process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS,
  emails = process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS,
} = {}) {
  if (!isProdCampaignTestFlagOn({ nodeEnv, flag })) return null;
  const ids = parseBandIds(bandIds);
  const list = parseEmailList(emails);
  if (!ids.length) return 'missing_band_allowlist';
  if (!list.length) return 'missing_recipient_allowlist';
  return null;
}

function isProductionTestModeForBand(bandId, env = {}) {
  const nodeEnv = env.nodeEnv ?? process.env.NODE_ENV;
  const flag = env.flag ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE;
  const bandIdsRaw = env.bandIds ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS;
  const emailsRaw = env.emails ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS;

  if (getProdCampaignTestMisconfigReason({ nodeEnv, flag, bandIds: bandIdsRaw, emails: emailsRaw })) {
    return false;
  }
  if (!isProdCampaignTestFlagOn({ nodeEnv, flag })) return false;

  const id = Number.parseInt(bandId, 10);
  if (!Number.isFinite(id) || id <= 0) return false;
  return parseBandIds(bandIdsRaw).includes(id);
}

/** Why production test mode is not active for this band. Null when it is active. */
function getProductionTestSkipReason(bandId, env = {}) {
  const nodeEnv = env.nodeEnv ?? process.env.NODE_ENV;
  const flag = env.flag ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE;
  const bandIdsRaw = env.bandIds ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS;
  const emailsRaw = env.emails ?? process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS;

  if (!isProductionNodeEnv(nodeEnv)) return 'not_production';
  if (!isTruthyFlag(flag)) return 'flag_off';
  const misconfigured = getProdCampaignTestMisconfigReason({
    nodeEnv,
    flag,
    bandIds: bandIdsRaw,
    emails: emailsRaw,
  });
  if (misconfigured) return misconfigured;
  if (!isProductionTestModeForBand(bandId, { nodeEnv, flag, bandIds: bandIdsRaw, emails: emailsRaw })) {
    return 'band_not_allowlisted';
  }
  return null;
}

function clampFansToProdTestEmails(fans, emails = parseProdCampaignTestEmails()) {
  const allow = new Set(parseEmailList(Array.isArray(emails) ? emails.join(',') : emails));
  return (fans || []).filter((fan) => allow.has(normalizeEmail(fan?.email)));
}

/**
 * Skip lastMessagedAt time cooldown for this fan.
 *
 * Dev: non-production + FANEQO_CAMPAIGN_TEST_MODE (+ optional email allowlist).
 * Prod: production test mode for this band + email on FANEQO_PROD_CAMPAIGN_TEST_EMAILS.
 */
function shouldBypassFanCampaignCooldown({
  email,
  bandId,
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FANEQO_CAMPAIGN_TEST_MODE,
  allowlist = process.env.FANEQO_CAMPAIGN_TEST_EMAILS,
  prodFlag = process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE,
  prodBandIds = process.env.FANEQO_PROD_CAMPAIGN_TEST_BAND_IDS,
  prodEmails = process.env.FANEQO_PROD_CAMPAIGN_TEST_EMAILS,
} = {}) {
  if (
    isCampaignTestModeEnabled({ nodeEnv, flag }) &&
    !isProductionNodeEnv(nodeEnv)
  ) {
    const list = parseCampaignTestEmails(allowlist);
    if (!list.length) return true;
    const normalized = normalizeEmail(email);
    if (!normalized || !normalized.includes('@')) return false;
    return list.includes(normalized);
  }

  if (
    isProductionTestModeForBand(bandId, {
      nodeEnv,
      flag: prodFlag,
      bandIds: prodBandIds,
      emails: prodEmails,
    })
  ) {
    const normalized = normalizeEmail(email);
    if (!normalized || !normalized.includes('@')) return false;
    return parseProdCampaignTestEmails(prodEmails).includes(normalized);
  }

  return false;
}

function newCampaignRequestId() {
  return `req_${require('crypto').randomBytes(4).toString('hex')}`;
}

function prefixProdTestSubject(subject, maxLength) {
  const trimmed = String(subject || '').trim();
  if (!trimmed) return trimmed;
  const prefixed = /^\[test\]/i.test(trimmed) ? trimmed : `[TEST] ${trimmed}`;
  if (!maxLength) return prefixed;
  return prefixed.slice(0, maxLength);
}

function getCampaignTestModeSnapshot({
  nodeEnv = process.env.NODE_ENV,
  flag = process.env.FANEQO_CAMPAIGN_TEST_MODE,
  allowlist = process.env.FANEQO_CAMPAIGN_TEST_EMAILS,
} = {}) {
  const enabled = isCampaignTestModeEnabled({ nodeEnv, flag });
  const envName = String(nodeEnv || '').trim() || 'undefined';
  return {
    enabled,
    environment: envName,
    flagLoaded: String(flag || '').trim().length > 0,
    allowlistConfigured: parseCampaignTestEmails(allowlist).length > 0,
  };
}

function logCampaignTestModeOnBoot(strapi) {
  const snapshot = getCampaignTestModeSnapshot();
  const log = strapi?.log?.warn?.bind(strapi.log) || console.warn;
  const info = strapi?.log?.info?.bind(strapi.log) || console.info;

  if (snapshot.enabled) {
    log('[Faneqo Campaigns] DEVELOPMENT TEST MODE — email campaign cooldown bypass enabled.');
  }

  info(`[Faneqo Campaigns] test mode enabled: ${snapshot.enabled}`);
  info(`[Faneqo Campaigns] allowlist configured: ${snapshot.allowlistConfigured}`);
  info(`[Faneqo Campaigns] environment: ${snapshot.environment}`);

  if (!snapshot.enabled && !isProductionNodeEnv()) {
    log(
      '[Faneqo Campaigns] cooldown bypass inactive in this process. Restart Strapi after setting FANEQO_CAMPAIGN_TEST_MODE in qrserver/.env (env is not hot-reloaded).'
    );
  }

  const prodFlag = isTruthyFlag(process.env.FANEQO_PROD_CAMPAIGN_TEST_MODE);
  if (!prodFlag) return;

  if (!isProductionNodeEnv()) {
    info('[Faneqo Campaigns] FANEQO_PROD_CAMPAIGN_TEST_MODE is set but ignored because NODE_ENV is not production.');
    return;
  }

  const blocked = getProdCampaignTestMisconfigReason();
  if (blocked) {
    log(`[Faneqo Campaigns] production-test:blocked reason=${blocked}`);
    return;
  }

  log('[Faneqo Campaigns] PRODUCTION TEST MODE enabled — restricted to explicit bands and test recipients.');
  log(
    `[Faneqo Campaigns] approvedBands=${parseProdCampaignTestBandIds().length} approvedTestRecipients=${parseProdCampaignTestEmails().length}`
  );
}

module.exports = {
  isTruthyFlag,
  isProductionNodeEnv,
  normalizeEmail,
  parseEmailList,
  parseBandIds,
  parseCampaignTestEmails,
  parseProdCampaignTestEmails,
  parseProdCampaignTestBandIds,
  isCampaignTestModeEnabled,
  isProdCampaignTestFlagOn,
  getProdCampaignTestMisconfigReason,
  isProductionTestModeForBand,
  getProductionTestSkipReason,
  clampFansToProdTestEmails,
  shouldBypassFanCampaignCooldown,
  newCampaignRequestId,
  prefixProdTestSubject,
  getCampaignTestModeSnapshot,
  logCampaignTestModeOnBoot,
};
