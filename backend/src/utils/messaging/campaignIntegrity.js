'use strict';

/**
 * Read-only integrity checks for message campaigns and their immutable
 * recipient snapshots. This module deliberately contains no repair or index
 * creation path.
 */

const CAMPAIGN_TABLE = 'message_campaigns';
const RECIPIENT_TABLE = 'message_recipients';
const CAMPAIGN_LINKS = 'message_recipients_campaign_links';
const FAN_LINKS = 'message_recipients_fan_links';
const CAMPAIGN_BAND_LINKS = 'message_campaigns_band_links';
const CAMPAIGN_RECAP_LINKS = 'message_campaigns_show_recap_links';

function rawRows(result) {
  if (!result) return [];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) {
    if (result[0] && Array.isArray(result[0])) return result[0];
    if (!result[0] || typeof result[0] === 'object') return result;
  }
  return [];
}

async function tableExists(knex, table) {
  try { return await knex.schema.hasTable(table); } catch { return false; }
}

async function columns(knex, table) {
  try { return await knex(table).columnInfo(); } catch { return {}; }
}

function firstColumn(info, candidates) {
  return candidates.find((name) => Object.prototype.hasOwnProperty.call(info, name)) || null;
}

async function resolveRelation(knex, options) {
  const baseTable = options.baseTable || RECIPIENT_TABLE;
  const base = await columns(knex, baseTable);
  if (base[options.inline]) {
    return { mode: 'inline', source: 'id', target: options.inline, table: baseTable };
  }
  if (!(await tableExists(knex, options.linkTable))) return { mode: 'missing' };
  const link = await columns(knex, options.linkTable);
  const source = firstColumn(link, options.sourceCandidates || ['message_recipient_id']);
  const target = firstColumn(link, options.targetCandidates);
  return source && target
    ? { mode: 'links', source, target, table: options.linkTable }
    : { mode: 'missing' };
}

function relationSql(relation, targetAlias, sourceAlias = 'recipient_id') {
  if (relation.mode === 'inline') {
    return `SELECT id AS ${sourceAlias}, ${relation.target} AS ${targetAlias} FROM ${relation.table} WHERE ${relation.target} IS NOT NULL`;
  }
  if (relation.mode === 'links') {
    return `SELECT ${relation.source} AS ${sourceAlias}, ${relation.target} AS ${targetAlias} FROM ${relation.table}`;
  }
  return null;
}

function number(row, key = 'n') {
  return Number(row?.[key] || 0);
}

function classifyCheck(check) {
  if (!check || check.skipped || check.error) return 'UNKNOWN';
  return number(check) === 0 ? 'CLEAN' : 'DIRTY';
}

function readiness(checks) {
  const states = Object.fromEntries(Object.entries(checks).map(([key, value]) => [key, classifyCheck(value)]));
  const values = Object.values(states);
  return {
    state: values.includes('DIRTY') ? 'DIRTY' : values.includes('UNKNOWN') ? 'UNKNOWN' : 'CLEAN',
    checks: states,
  };
}

async function safeCount(knex, sql) {
  try { return { n: number(rawRows(await knex.raw(sql))[0]) }; }
  catch (err) { return { skipped: true, error: err.message }; }
}

async function duplicateScalar(knex, column) {
  const info = await columns(knex, RECIPIENT_TABLE);
  if (!info[column]) return { skipped: true, reason: `missing_${column}` };
  return safeCount(knex, `SELECT COUNT(*) AS n FROM (
    SELECT ${column} FROM ${RECIPIENT_TABLE}
    WHERE ${column} IS NOT NULL AND ${column} <> ''
    GROUP BY ${column} HAVING COUNT(*) > 1
  ) duplicates`);
}

async function auditCampaignIntegrity(knex, options = {}) {
  const campaignExists = await tableExists(knex, CAMPAIGN_TABLE);
  const recipientExists = await tableExists(knex, RECIPIENT_TABLE);
  if (!campaignExists || !recipientExists) {
    const checks = { requiredTables: { skipped: true, reason: 'missing_required_table' } };
    return { layout: {}, checks, readiness: readiness(checks) };
  }

  const campaignRelation = await resolveRelation(knex, {
    inline: 'campaign_id',
    linkTable: CAMPAIGN_LINKS,
    targetCandidates: ['message_campaign_id', 'campaign_id'],
  });
  const fanRelation = await resolveRelation(knex, {
    inline: 'fan_id',
    linkTable: FAN_LINKS,
    targetCandidates: ['fan_id'],
  });
  const bandRelation = await resolveRelation(knex, {
    baseTable: CAMPAIGN_TABLE,
    inline: 'band_id',
    linkTable: CAMPAIGN_BAND_LINKS,
    sourceCandidates: ['message_campaign_id'],
    targetCandidates: ['band_id'],
  });
  const recapRelation = await resolveRelation(knex, {
    baseTable: CAMPAIGN_TABLE,
    inline: 'show_recap_id',
    linkTable: CAMPAIGN_RECAP_LINKS,
    sourceCandidates: ['message_campaign_id'],
    targetCandidates: ['show_recap_id'],
  });
  const campaignSql = relationSql(campaignRelation, 'campaign_id');
  const fanSql = relationSql(fanRelation, 'fan_id');
  const bandSql = relationSql(bandRelation, 'band_id', 'campaign_id');
  const recapSql = relationSql(recapRelation, 'show_recap_id', 'campaign_id');
  const checks = {};

  checks.duplicateIdempotencyKeys = await duplicateScalar(knex, 'idempotency_key');
  checks.duplicateProviderMessageIds = await duplicateScalar(knex, 'provider_message_id');

  if (!campaignSql) {
    checks.snapshotCountMismatch = { skipped: true, reason: 'missing_campaign_relation' };
    checks.activeWithoutRecipients = { skipped: true, reason: 'missing_campaign_relation' };
    checks.counterDrift = { skipped: true, reason: 'missing_campaign_relation' };
  } else {
    checks.snapshotCountMismatch = await safeCount(knex, `WITH rel AS (${campaignSql}), actual AS (
      SELECT campaign_id, COUNT(DISTINCT recipient_id) AS n FROM rel GROUP BY campaign_id
    ) SELECT COUNT(*) AS n FROM ${CAMPAIGN_TABLE} c LEFT JOIN actual a ON a.campaign_id = c.id
      WHERE COALESCE(c.recipient_count, 0) <> COALESCE(a.n, 0)`);

    checks.activeWithoutRecipients = await safeCount(knex, `WITH rel AS (${campaignSql}), actual AS (
      SELECT campaign_id, COUNT(DISTINCT recipient_id) AS n FROM rel GROUP BY campaign_id
    ) SELECT COUNT(*) AS n FROM ${CAMPAIGN_TABLE} c LEFT JOIN actual a ON a.campaign_id = c.id
      WHERE c.status IN ('queued', 'sending') AND COALESCE(a.n, 0) = 0`);

    checks.counterDrift = await safeCount(knex, `WITH rel AS (${campaignSql}), facts AS (
      SELECT rel.campaign_id,
        SUM(CASE WHEN r.sent_at IS NOT NULL THEN 1 ELSE 0 END) AS sent_n,
        SUM(CASE WHEN r.delivered_at IS NOT NULL THEN 1 ELSE 0 END) AS delivered_n,
        SUM(CASE WHEN r.failed_at IS NOT NULL AND r.delivered_at IS NULL
          AND r.suppressed_at IS NULL AND r.bounced_at IS NULL THEN 1 ELSE 0 END) AS failed_n,
        SUM(CASE WHEN r.suppressed_at IS NOT NULL THEN 1 ELSE 0 END) AS suppressed_n,
        SUM(CASE WHEN r.bounced_at IS NOT NULL THEN 1 ELSE 0 END) AS bounced_n
      FROM rel INNER JOIN ${RECIPIENT_TABLE} r ON r.id = rel.recipient_id GROUP BY rel.campaign_id
    ) SELECT COUNT(*) AS n FROM ${CAMPAIGN_TABLE} c LEFT JOIN facts f ON f.campaign_id = c.id
      WHERE COALESCE(c.sent_count, 0) <> COALESCE(f.sent_n, 0)
         OR COALESCE(c.delivered_count, 0) <> COALESCE(f.delivered_n, 0)
         OR COALESCE(c.failed_count, 0) <> COALESCE(f.failed_n, 0)
         OR COALESCE(c.suppressed_count, 0) <> COALESCE(f.suppressed_n, 0)
         OR COALESCE(c.bounced_count, 0) <> COALESCE(f.bounced_n, 0)`);

    checks.partialSnapshotCandidates = await safeCount(knex, `WITH rel AS (${campaignSql}), actual AS (
      SELECT campaign_id, COUNT(DISTINCT recipient_id) AS n FROM rel GROUP BY campaign_id
    ) SELECT COUNT(*) AS n FROM ${CAMPAIGN_TABLE} c LEFT JOIN actual a ON a.campaign_id = c.id
      WHERE c.status IN ('draft', 'queued', 'sending', 'failed')
        AND COALESCE(c.recipient_count, 0) <> COALESCE(a.n, 0)`);
  }

  checks.duplicateCampaignFans = campaignSql && fanSql
    ? await safeCount(knex, `WITH cr AS (${campaignSql}), fr AS (${fanSql}) SELECT COUNT(*) AS n FROM (
        SELECT cr.campaign_id, fr.fan_id FROM cr INNER JOIN fr ON fr.recipient_id = cr.recipient_id
        GROUP BY cr.campaign_id, fr.fan_id HAVING COUNT(*) > 1
      ) duplicates`)
    : { skipped: true, reason: 'missing_campaign_or_fan_relation' };

  checks.activeDispatchScopeCollisions = bandSql
    ? await safeCount(knex, `WITH bands AS (${bandSql}) SELECT COUNT(*) AS n FROM (
        SELECT bands.band_id, c.audience_type, COALESCE(c.audience_reference, '') AS audience_reference
        FROM ${CAMPAIGN_TABLE} c INNER JOIN bands ON bands.campaign_id = c.id
        WHERE c.status IN ('draft', 'queued', 'sending')
        GROUP BY bands.band_id, c.audience_type, COALESCE(c.audience_reference, '')
        HAVING COUNT(*) > 1
      ) duplicates`)
    : { skipped: true, reason: 'missing_campaign_band_relation' };

  if ((await tableExists(knex, 'show_recaps')) && recapSql) {
    const recapInfo = await columns(knex, 'show_recaps');
    checks.recapCooldownWithoutCampaign = recapInfo.last_message_sent_at
      ? await safeCount(knex, `WITH recaps AS (${recapSql}) SELECT COUNT(*) AS n
          FROM show_recaps s LEFT JOIN recaps r ON r.show_recap_id = s.id
          WHERE s.last_message_sent_at IS NOT NULL AND r.campaign_id IS NULL`)
      : { skipped: true, reason: 'missing_last_message_sent_at' };
  } else {
    checks.recapCooldownWithoutCampaign = { skipped: true, reason: 'missing_show_recap_relation' };
  }

  const staleMinutes = Number(options.staleMinutes || 30);
  try {
    const rows = await knex(CAMPAIGN_TABLE)
      .select('status', 'created_at', 'queued_at', 'started_at', 'worker_lock_at')
      .whereIn('status', ['draft', 'queued', 'sending']);
    const cutoff = Date.now() - staleMinutes * 60 * 1000;
    const stale = rows.filter((row) => {
      const value = row.worker_lock_at || row.started_at || row.queued_at || row.created_at;
      const time = value ? new Date(value).getTime() : NaN;
      return Number.isFinite(time) && time < cutoff;
    });
    checks.staleActiveCampaigns = { n: stale.length, thresholdMinutes: staleMinutes };
  } catch (err) {
    checks.staleActiveCampaigns = { skipped: true, error: err.message };
  }

  try {
    const rows = await knex(RECIPIENT_TABLE)
      .select('created_at', 'updated_at', 'queued_at')
      .where('status', 'sending');
    const cutoff = Date.now() - staleMinutes * 60 * 1000;
    checks.staleSendingRecipients = {
      n: rows.filter((row) => {
        const value = row.updated_at || row.queued_at || row.created_at;
        const time = value ? new Date(value).getTime() : NaN;
        return Number.isFinite(time) && time < cutoff;
      }).length,
      thresholdMinutes: staleMinutes,
    };
  } catch (err) {
    checks.staleSendingRecipients = { skipped: true, error: err.message };
  }

  return {
    layout: {
      campaign: campaignRelation.mode,
      fan: fanRelation.mode,
      campaignBand: bandRelation.mode,
      campaignShowRecap: recapRelation.mode,
    },
    checks,
    readiness: readiness(checks),
  };
}

module.exports = {
  CAMPAIGN_TABLE,
  RECIPIENT_TABLE,
  classifyCheck,
  readiness,
  resolveRelation,
  relationSql,
  auditCampaignIntegrity,
};
