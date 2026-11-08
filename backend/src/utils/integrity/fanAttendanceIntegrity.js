'use strict';

/**
 * Read-only fan + attendance integrity audits and conditional unique indexes.
 * Never deletes or merges rows.
 *
 * Strapi v4 stores band/fan/event manyToOne relations in join tables on this
 * schema, so UNIQUE(band_id, email) cannot sit on `fans`. Phase 05A.1 uses
 * hashed scalar integrity keys on the canonical rows instead.
 *
 * Join-table unique indexes remain skipped. Identity-key unique indexes are
 * created only when columns exist, the duplicate audit is CLEAN, and key
 * coverage is complete. Dirty or uninspected production must not fail boot.
 */

const { hashEmailKey } = require('../fans/fanEmail');

const FAN_TABLE = 'fans';
const ATT_TABLE = 'fan_show_attendances';
const FAN_BAND_LINKS = 'fans_band_links';
const FAN_ACCOUNT_LINKS = 'fans_account_user_links';
const FAN_VISITOR_LINKS = 'fans_visitor_links';
const ATT_FAN_LINKS = 'fan_show_attendances_fan_links';
const ATT_EVENT_LINKS = 'fan_show_attendances_event_links';

const FAN_UNIQUE = 'fans_band_normalized_email_unique';
const ATT_CAMPAIGN_UNIQUE = 'fan_show_attendances_fan_campaign_unique';
const ATT_EVENT_UNIQUE = 'fan_show_attendances_fan_event_unique';
const FAN_IDENTITY_UNIQUE = 'fans_canonical_identity_key_unique';
const ATT_CAMPAIGN_IDENTITY_UNIQUE = 'fan_show_attendances_campaign_identity_key_unique';
const ATT_EVENT_IDENTITY_UNIQUE = 'fan_show_attendances_event_identity_key_unique';
const ATT_FAN_CHECKED = 'fan_show_attendances_fan_checked_in';
const ATT_FAN_LINKS_IDX = 'fan_show_attendances_fan_links_fan';
const FAN_BAND_LINKS_IDX = 'fans_band_links_band_fan';

const FAN_MERGE_CHILD_REFS = [
  { table: 'fan_show_attendances', column: 'fan_id', linkTable: ATT_FAN_LINKS, meaning: 'canonical attendance' },
  { table: 'relationship_events', column: 'fan_id', linkTable: 'relationship_events_fan_links', meaning: 'ledger rows; do not delete; retarget or compensate' },
  { table: 'conversations', column: 'origin_fan_id', linkTable: 'conversations_origin_fan_links', linkColumn: 'fan_id', meaning: 'Inbox origin fan context' },
  { table: 'conversation_requests', column: 'requester_fan_id', linkTable: 'conversation_requests_requester_fan_links', linkColumn: 'fan_id', meaning: 'message-request origin fan' },
  { table: 'fan_interactions', column: 'fan_id', linkTable: 'fan_interactions_fan_links', meaning: 'telemetry; not canonical show count' },
  { table: 'message_recipients', column: 'fan_id', linkTable: 'message_recipients_fan_links', meaning: 'campaign delivery snapshot identity' },
];

const FAN_MERGE_CONTRACT = {
  identity: 'Keep the oldest row (min id) as canonical unless a CONFLICTING group requires product judgment.',
  email: 'Canonical stored email is trim+lowercase of the surviving row.',
  accountUser: 'If exactly one row has accountUser, keep it. If two different accountUsers, STOP.',
  visitor: 'If mixed visitors, STOP (UNKNOWN).',
  status: 'Do not auto-pick subscribed vs unsubscribed vs removed.',
  children: FAN_MERGE_CHILD_REFS.map((r) => r.linkTable || `${r.table}.${r.column}`),
  relationshipEvents: 'Retarget fan_id onto the survivor. Never silently delete ledger history.',
  notImplemented: true,
};

function dialectOf(knex) {
  const name = String(knex?.client?.config?.client || knex?.client?.dialect || '').toLowerCase();
  if (name.includes('pg') || name.includes('postgres')) return 'postgres';
  if (name.includes('sqlite')) return 'sqlite';
  return 'other';
}

function rawRows(result) {
  if (!result) return [];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) {
    if (result[0] && Array.isArray(result[0])) return result[0];
    if (result[0] && typeof result[0] === 'object' && !Array.isArray(result[0])) return result;
  }
  return [];
}

async function tableExists(knex, table) {
  try {
    return await knex.schema.hasTable(table);
  } catch {
    return false;
  }
}

async function columnExists(knex, table, column) {
  try {
    return await knex.schema.hasColumn(table, column);
  } catch {
    return false;
  }
}

function emailExpr(dialect, alias) {
  const col = alias ? `${alias}.email` : 'email';
  return dialect === 'sqlite' ? `lower(trim(${col}))` : `lower(btrim(${col}))`;
}

function validAttendanceExpr(dialect, alias) {
  const col = alias ? `${alias}.suppressed_duplicate` : 'suppressed_duplicate';
  return dialect === 'sqlite'
    ? `(${col} IS NULL OR ${col} = 0)`
    : `(${col} IS NOT TRUE)`;
}

function classifyFanDuplicateGroup(group) {
  if (group.distinctAccountUsers > 1) return 'CONFLICTING';
  if (group.attendanceSplit || group.interactionSplit || group.eventSplit) return 'CONFLICTING';
  if (group.nullAccounts > 0 && group.distinctAccountUsers === 1) return 'UNKNOWN';
  if (group.distinctStatuses > 1) return 'UNKNOWN';
  if (group.distinctVisitors > 1) return 'UNKNOWN';
  if (group.n >= 2 && group.distinctAccountUsers <= 1) return 'SAFE';
  return 'UNKNOWN';
}

function canonicalShowCountSql() {
  return {
    count: `SELECT COUNT(*) AS n FROM ${ATT_TABLE}
            WHERE fan_id = ? AND (suppressed_duplicate IS NOT TRUE)`,
    note: 'If fan_id is not on fan_show_attendances, join fan_show_attendances_fan_links.',
  };
}

async function relMode(knex, table, column, linkTable) {
  if (await columnExists(knex, table, column)) return 'inline';
  if (linkTable && (await tableExists(knex, linkTable))) return 'links';
  return 'missing';
}

async function resolveLayout(knex) {
  return {
    fanBand: await relMode(knex, FAN_TABLE, 'band_id', FAN_BAND_LINKS),
    fanAccount: await relMode(knex, FAN_TABLE, 'account_user_id', FAN_ACCOUNT_LINKS),
    fanVisitor: await relMode(knex, FAN_TABLE, 'visitor_id', FAN_VISITOR_LINKS),
    attFan: await relMode(knex, ATT_TABLE, 'fan_id', ATT_FAN_LINKS),
    attEvent: await relMode(knex, ATT_TABLE, 'event_id', ATT_EVENT_LINKS),
    attBand: await relMode(knex, ATT_TABLE, 'band_id', 'fan_show_attendances_band_links'),
  };
}

function canApplyFanUnique(layout) {
  return layout.fanBand === 'inline';
}

function canApplyCampaignUnique(layout) {
  return layout.attFan === 'inline';
}

function canApplyEventUnique(layout) {
  return layout.attFan === 'inline' && layout.attEvent === 'inline';
}

async function inspectPhysicalColumns(knex) {
  const layout = await resolveLayout(knex);
  return {
    layout,
    uniqueIndexApplicability: {
      fan: canApplyFanUnique(layout) ? 'inline_fk' : 'skipped_join_table_layout',
      campaignAttendance: canApplyCampaignUnique(layout) ? 'inline_fk' : 'skipped_join_table_layout',
      eventAttendance: canApplyEventUnique(layout) ? 'inline_fk' : 'skipped_join_table_layout',
      identityKeys: 'scalar_sha256_on_canonical_row',
    },
  };
}

async function countSql(knex, sql, bindings) {
  const rows = rawRows(bindings ? await knex.raw(sql, bindings) : await knex.raw(sql));
  const row = rows[0] || {};
  return Number(row.n || row.c || row.count || 0);
}

function fanFromSql(dialect, layout) {
  const expr = emailExpr(dialect, 'f');
  const bandSelect = layout.fanBand === 'inline' ? 'f.band_id' : 'bl.band_id';
  const bandJoin =
    layout.fanBand === 'links' ? `INNER JOIN ${FAN_BAND_LINKS} bl ON bl.fan_id = f.id` : '';
  const accountJoin =
    layout.fanAccount === 'links' ? `LEFT JOIN ${FAN_ACCOUNT_LINKS} al ON al.fan_id = f.id` : '';
  const visitorJoin =
    layout.fanVisitor === 'links' ? `LEFT JOIN ${FAN_VISITOR_LINKS} vl ON vl.fan_id = f.id` : '';
  const distinctAccount =
    layout.fanAccount === 'inline'
      ? 'COUNT(DISTINCT f.account_user_id)'
      : layout.fanAccount === 'links'
        ? 'COUNT(DISTINCT al.user_id)'
        : '0';
  const nullAccounts =
    layout.fanAccount === 'inline'
      ? 'SUM(CASE WHEN f.account_user_id IS NULL THEN 1 ELSE 0 END)'
      : layout.fanAccount === 'links'
        ? 'SUM(CASE WHEN al.user_id IS NULL THEN 1 ELSE 0 END)'
        : '0';
  const distinctVisitors =
    layout.fanVisitor === 'inline'
      ? 'COUNT(DISTINCT f.visitor_id)'
      : layout.fanVisitor === 'links'
        ? 'COUNT(DISTINCT vl.fan_visitor_id)'
        : '0';
  const bandWhere = layout.fanBand === 'inline' ? 'AND f.band_id IS NOT NULL' : '';
  return {
    inner: `
    SELECT ${bandSelect} AS band_id,
           ${expr} AS norm_email,
           COUNT(*) AS n,
           COUNT(DISTINCT f.status) AS distinct_statuses,
           ${distinctAccount} AS distinct_account_users,
           ${nullAccounts} AS null_accounts,
           ${distinctVisitors} AS distinct_visitors,
           COUNT(DISTINCT f.source) AS distinct_sources,
           MIN(f.id) AS min_id,
           MAX(f.id) AS max_id
    FROM ${FAN_TABLE} f
    ${bandJoin}
    ${accountJoin}
    ${visitorJoin}
    WHERE f.email IS NOT NULL AND ${expr} <> '' ${bandWhere}
    GROUP BY ${bandSelect}, ${expr}
    HAVING COUNT(*) > 1
  `,
    expr,
    bandSelect,
    bandJoin,
  };
}

async function auditFanDuplicates(knex, layout) {
  if (!(await tableExists(knex, FAN_TABLE))) {
    return { skipped: true, reason: 'no_table', groups: 0, excessRows: 0, largestGroup: 0, samples: [] };
  }
  const resolved = layout || (await resolveLayout(knex));
  if (resolved.fanBand === 'missing') {
    return { skipped: true, reason: 'no_band_relation', groups: 0, excessRows: 0, largestGroup: 0, samples: [] };
  }

  const dialect = dialectOf(knex);
  const built = fanFromSql(dialect, resolved);

  let totals;
  try {
    totals = rawRows(
      await knex.raw(
        `SELECT COUNT(*) AS groups, COALESCE(SUM(n - 1), 0) AS excess, COALESCE(MAX(n), 0) AS largest FROM (${built.inner}) d`
      )
    )[0];
  } catch (err) {
    return { skipped: true, reason: err.message, groups: 0, excessRows: 0, largestGroup: 0, samples: [] };
  }

  let groups = [];
  try {
    groups = rawRows(await knex.raw(`${built.inner} ORDER BY n DESC LIMIT 50`));
  } catch (err) {
    return { skipped: true, reason: err.message, groups: 0, excessRows: 0, largestGroup: 0, samples: [] };
  }

  const samples = [];
  const classes = { SAFE: 0, CONFLICTING: 0, UNKNOWN: 0 };

  for (const row of groups) {
    const n = Number(row.n || 0);
    let attendanceSplit = false;
    let interactionSplit = false;
    let eventSplit = false;
    if (samples.length < 20) {
      try {
        const idSql =
          resolved.fanBand === 'links'
            ? `SELECT f.id FROM ${FAN_TABLE} f INNER JOIN ${FAN_BAND_LINKS} bl ON bl.fan_id = f.id WHERE bl.band_id = ? AND ${built.expr} = ?`
            : `SELECT f.id FROM ${FAN_TABLE} f WHERE f.band_id = ? AND ${built.expr} = ?`;
        const ids = rawRows(await knex.raw(idSql, [row.band_id, row.norm_email])).map((r) => r.id);
        if (ids.length >= 2) {
          const split = async (table, col, linkTable) => {
            const listed = ids.map(() => '?').join(',');
            if (await columnExists(knex, table, col)) {
              const hits = rawRows(
                await knex.raw(
                  `SELECT ${col} AS fan_id, COUNT(*) AS n FROM ${table} WHERE ${col} IN (${listed}) GROUP BY ${col}`,
                  ids
                )
              );
              return hits.filter((h) => Number(h.n) > 0).length > 1;
            }
            if (linkTable && (await tableExists(knex, linkTable))) {
              const hits = rawRows(
                await knex.raw(
                  `SELECT fan_id, COUNT(*) AS n FROM ${linkTable} WHERE fan_id IN (${listed}) GROUP BY fan_id`,
                  ids
                )
              );
              return hits.filter((h) => Number(h.n) > 0).length > 1;
            }
            return false;
          };
          attendanceSplit = await split(ATT_TABLE, 'fan_id', ATT_FAN_LINKS);
          interactionSplit = await split('fan_interactions', 'fan_id', 'fan_interactions_fan_links');
          eventSplit = await split('relationship_events', 'fan_id', 'relationship_events_fan_links');
        }
      } catch {
        /* child split is advisory */
      }
    }

    const classified = classifyFanDuplicateGroup({
      n,
      distinctStatuses: Number(row.distinct_statuses || 0),
      distinctAccountUsers: Number(row.distinct_account_users || 0),
      nullAccounts: Number(row.null_accounts || 0),
      distinctVisitors: Number(row.distinct_visitors || 0),
      attendanceSplit,
      interactionSplit,
      eventSplit,
    });
    classes[classified] += 1;
    samples.push({
      bandId: row.band_id,
      emailHash: hashEmailKey(row.norm_email),
      n,
      distinctStatuses: Number(row.distinct_statuses || 0),
      distinctAccountUsers: Number(row.distinct_account_users || 0),
      nullAccounts: Number(row.null_accounts || 0),
      distinctVisitors: Number(row.distinct_visitors || 0),
      distinctSources: Number(row.distinct_sources || 0),
      minId: row.min_id,
      maxId: row.max_id,
      attendanceSplit,
      interactionSplit,
      eventSplit,
      class: classified,
    });
  }

  const childCounts = {};
  for (const ref of FAN_MERGE_CHILD_REFS) {
    childCounts[ref.table] = { column: ref.column, meaning: ref.meaning, duplicateFansReferenced: null };
    try {
      const idSub =
        resolved.fanBand === 'links'
          ? `SELECT f.id FROM ${FAN_TABLE} f
             INNER JOIN ${FAN_BAND_LINKS} bl ON bl.fan_id = f.id
             INNER JOIN (
               SELECT bl2.band_id, ${emailExpr(dialect, 'f2')} AS n
               FROM ${FAN_TABLE} f2
               INNER JOIN ${FAN_BAND_LINKS} bl2 ON bl2.fan_id = f2.id
               WHERE f2.email IS NOT NULL AND ${emailExpr(dialect, 'f2')} <> ''
               GROUP BY bl2.band_id, ${emailExpr(dialect, 'f2')}
               HAVING COUNT(*) > 1
             ) d ON d.band_id = bl.band_id AND ${emailExpr(dialect, 'f')} = d.n`
          : `SELECT f.id FROM ${FAN_TABLE} f
             INNER JOIN (
               SELECT band_id, ${emailExpr(dialect)} AS n FROM ${FAN_TABLE}
               WHERE email IS NOT NULL AND ${emailExpr(dialect)} <> '' AND band_id IS NOT NULL
               GROUP BY band_id, ${emailExpr(dialect)}
               HAVING COUNT(*) > 1
             ) d ON f.band_id = d.band_id AND ${emailExpr(dialect, 'f')} = d.n`;

      let n = null;
      if (await columnExists(knex, ref.table, ref.column)) {
        n = await countSql(
          knex,
          `SELECT COUNT(DISTINCT c.${ref.column}) AS n FROM ${ref.table} c INNER JOIN (${idSub}) dup ON dup.id = c.${ref.column}`
        );
      } else if (ref.linkTable && (await tableExists(knex, ref.linkTable))) {
        const col = ref.linkColumn || 'fan_id';
        n = await countSql(
          knex,
          `SELECT COUNT(DISTINCT c.${col}) AS n FROM ${ref.linkTable} c INNER JOIN (${idSub}) dup ON dup.id = c.${col}`
        );
      }
      childCounts[ref.table].duplicateFansReferenced = n;
    } catch {
      childCounts[ref.table].duplicateFansReferenced = null;
    }
  }

  return {
    skipped: false,
    groups: Number(totals?.groups || 0),
    excessRows: Number(totals?.excess || 0),
    largestGroup: Number(totals?.largest || 0),
    classes,
    samples,
    childRefs: childCounts,
    mergeContract: FAN_MERGE_CONTRACT,
  };
}

function attendanceFanExpr(layout) {
  return layout.attFan === 'inline' ? 'a.fan_id' : 'fl.fan_id';
}

function attendanceFanJoin(layout) {
  return layout.attFan === 'links'
    ? `INNER JOIN ${ATT_FAN_LINKS} fl ON fl.fan_show_attendance_id = a.id`
    : '';
}

function attendanceEventExpr(layout) {
  return layout.attEvent === 'inline' ? 'a.event_id' : 'el.event_id';
}

function attendanceEventJoin(layout, inner = false) {
  if (layout.attEvent !== 'links') return '';
  const kind = inner ? 'INNER JOIN' : 'LEFT JOIN';
  return `${kind} ${ATT_EVENT_LINKS} el ON el.fan_show_attendance_id = a.id`;
}

async function auditAttendanceDuplicates(knex, layout) {
  if (!(await tableExists(knex, ATT_TABLE))) {
    return {
      skipped: true,
      reason: 'no_table',
      campaignGroups: 0,
      eventGroups: 0,
      suppressedValues: [],
      bothCampaignAndEvent: 0,
    };
  }

  const resolved = layout || (await resolveLayout(knex));
  if (resolved.attFan === 'missing') {
    return { skipped: true, reason: 'no_fan_relation', campaignGroups: 0, eventGroups: 0 };
  }

  const dialect = dialectOf(knex);
  const valid = validAttendanceExpr(dialect, 'a');
  const fanCol = attendanceFanExpr(resolved);
  const fanJoin = attendanceFanJoin(resolved);
  const eventCol = attendanceEventExpr(resolved);
  const eventJoinLeft = attendanceEventJoin(resolved, false);
  const eventJoinInner = attendanceEventJoin(resolved, true);
  const hasSource = await columnExists(knex, ATT_TABLE, 'check_in_source');
  const distinctEventsSql = resolved.attEvent === 'missing' ? '0' : `COUNT(DISTINCT ${eventCol})`;

  const campaignInner = `
    SELECT ${fanCol} AS fan_id, a.campaign_id, COUNT(*) AS n,
           ${distinctEventsSql} AS distinct_events,
           ${hasSource ? 'COUNT(DISTINCT a.check_in_source)' : '0'} AS distinct_sources
    FROM ${ATT_TABLE} a
    ${fanJoin}
    ${eventJoinLeft}
    WHERE a.campaign_id IS NOT NULL AND a.campaign_id <> '' AND ${valid}
    GROUP BY ${fanCol}, a.campaign_id
    HAVING COUNT(*) > 1
  `;

  const eventInner =
    resolved.attEvent === 'missing'
      ? null
      : `
    SELECT ${fanCol} AS fan_id, ${eventCol} AS event_id, COUNT(*) AS n,
           COUNT(DISTINCT a.campaign_id) AS distinct_campaigns
    FROM ${ATT_TABLE} a
    ${fanJoin}
    ${eventJoinInner}
    WHERE ${eventCol} IS NOT NULL AND ${valid}
    GROUP BY ${fanCol}, ${eventCol}
    HAVING COUNT(*) > 1
  `;

  let campaignTotals = { groups: 0, excess: 0, largest: 0 };
  let eventTotals = { groups: 0, excess: 0, largest: 0 };
  let campaign = [];
  let event = [];
  let suppressedValues = [];
  let both = 0;
  let ledgerOnDupes = 0;
  try {
    campaignTotals = rawRows(
      await knex.raw(
        `SELECT COUNT(*) AS groups, COALESCE(SUM(n - 1), 0) AS excess, COALESCE(MAX(n), 0) AS largest FROM (${campaignInner}) d`
      )
    )[0] || campaignTotals;
    campaign = rawRows(await knex.raw(`${campaignInner} ORDER BY n DESC LIMIT 50`));
    if (eventInner) {
      eventTotals = rawRows(
        await knex.raw(
          `SELECT COUNT(*) AS groups, COALESCE(SUM(n - 1), 0) AS excess, COALESCE(MAX(n), 0) AS largest FROM (${eventInner}) d`
        )
      )[0] || eventTotals;
      event = rawRows(await knex.raw(`${eventInner} ORDER BY n DESC LIMIT 50`));
    }
    suppressedValues = rawRows(
      await knex.raw(`SELECT suppressed_duplicate AS v, COUNT(*) AS n FROM ${ATT_TABLE} GROUP BY suppressed_duplicate`)
    );
    const bothJoin = `${fanJoin} ${eventJoinLeft}`;
    const bothEvent = resolved.attEvent === 'missing' ? '0' : eventCol;
    both = await countSql(
      knex,
      `SELECT COUNT(*) AS n FROM ${ATT_TABLE} a
       ${bothJoin}
       WHERE a.campaign_id IS NOT NULL AND a.campaign_id <> ''
         AND ${resolved.attEvent === 'missing' ? '0=1' : `${bothEvent} IS NOT NULL`}`
    );
  } catch (err) {
    return { skipped: true, reason: err.message, campaignGroups: 0, eventGroups: 0 };
  }

  const anyTrue = suppressedValues.some((r) => r.v === true || r.v === 1 || r.v === '1');

  return {
    skipped: false,
    campaignGroups: Number(campaignTotals.groups || 0),
    campaignExcess: Number(campaignTotals.excess || 0),
    campaignLargest: Number(campaignTotals.largest || 0),
    campaignSamples: campaign.slice(0, 10).map((r) => ({
      fanId: r.fan_id,
      n: Number(r.n),
      distinctEvents: Number(r.distinct_events || 0),
    })),
    eventGroups: Number(eventTotals.groups || 0),
    eventExcess: Number(eventTotals.excess || 0),
    eventLargest: Number(eventTotals.largest || 0),
    eventSamples: event.slice(0, 10).map((r) => ({
      fanId: r.fan_id,
      eventId: r.event_id,
      n: Number(r.n),
      distinctCampaigns: Number(r.distinct_campaigns || 0),
    })),
    suppressedValues: suppressedValues.map((r) => ({ value: r.v, count: Number(r.n || 0) })),
    neverSuppressedTrue: !anyTrue,
    bothCampaignAndEvent: both,
    campaignEventModel:
      'One attendance row may hold both a campaign scalar and an event relation. Unique(fan,campaign) and Unique(fan,event) then both describe that same row. Two valid rows for the same fan+event with different campaigns is not a supported Show Mode workflow.',
    relationshipEventsOnDuplicateAttendances: ledgerOnDupes,
    uniqueIndexNote:
      resolved.attFan === 'inline'
        ? 'inline_fk'
        : 'fan_id/event_id live on Strapi join tables; requested UNIQUE(fan_id, campaign_id) cannot be placed on fan_show_attendances',
  };
}

function readiness(audit, kind) {
  if (audit.skipped) return 'UNKNOWN';
  if (kind === 'fan') return audit.groups === 0 ? 'CLEAN' : 'BLOCKED';
  if (kind === 'campaign') return audit.campaignGroups === 0 ? 'CLEAN' : 'BLOCKED';
  if (kind === 'event') return audit.eventGroups === 0 ? 'CLEAN' : 'BLOCKED';
  return 'UNKNOWN';
}

function identityIndexState({ columnPresent, duplicateGroups, missingKeys, duplicateKeyGroups, indexPresent }) {
  if (!columnPresent) return 'UNKNOWN';
  if (Number(duplicateGroups || 0) > 0 || Number(duplicateKeyGroups || 0) > 0) return 'BLOCKED';
  if (Number(missingKeys || 0) > 0) return 'PENDING';
  if (indexPresent) return 'ACTIVE';
  return 'PENDING';
}

function coveragePct(eligible, withKey) {
  const total = Number(eligible || 0);
  if (total === 0) return 100;
  return Math.round((Number(withKey || 0) / total) * 1000) / 10;
}

async function countDuplicateKeys(knex, table, column) {
  if (!(await columnExists(knex, table, column))) return 0;
  const rows = rawRows(
    await knex.raw(
      `SELECT COUNT(*) AS n FROM (
         SELECT ${column} AS k, COUNT(*) AS c
         FROM ${table}
         WHERE ${column} IS NOT NULL AND ${column} <> ''
         GROUP BY ${column}
         HAVING COUNT(*) > 1
       ) d`
    )
  );
  return Number(rows[0]?.n || 0);
}

async function auditIdentityKeyCoverage(knex, layout) {
  const resolved = layout || (await resolveLayout(knex));
  const dialect = dialectOf(knex);
  const empty = {
    fansScanned: 0,
    fansEligible: 0,
    fansMissingKey: 0,
    fansWithKey: 0,
    fanKeyCoveragePct: 100,
    fanDuplicateKeyGroups: 0,
    fanColumnPresent: false,
    attendanceScanned: 0,
    campaignEligible: 0,
    campaignMissingKey: 0,
    campaignWithKey: 0,
    campaignKeyCoveragePct: 100,
    campaignDuplicateKeyGroups: 0,
    campaignColumnPresent: false,
    eventEligible: 0,
    eventMissingKey: 0,
    eventWithKey: 0,
    eventKeyCoveragePct: 100,
    eventDuplicateKeyGroups: 0,
    eventColumnPresent: false,
  };

  if (!(await tableExists(knex, FAN_TABLE))) return empty;

  const fanCol = await columnExists(knex, FAN_TABLE, 'canonical_identity_key');
  empty.fanColumnPresent = fanCol;
  empty.fansScanned = await countSql(knex, `SELECT COUNT(*) AS n FROM ${FAN_TABLE}`);

  if (fanCol && resolved.fanBand !== 'missing') {
    const bandJoin = resolved.fanBand === 'links' ? `INNER JOIN ${FAN_BAND_LINKS} bl ON bl.fan_id = f.id` : '';
    const bandWhere = resolved.fanBand === 'inline' ? 'AND f.band_id IS NOT NULL' : '';
    const expr = emailExpr(dialect, 'f');
    const eligibleSql = `SELECT COUNT(*) AS n FROM ${FAN_TABLE} f ${bandJoin}
      WHERE f.email IS NOT NULL AND ${expr} <> '' ${bandWhere}`;
    const withKeySql = `SELECT COUNT(*) AS n FROM ${FAN_TABLE} f ${bandJoin}
      WHERE f.email IS NOT NULL AND ${expr} <> '' ${bandWhere}
        AND f.canonical_identity_key IS NOT NULL AND f.canonical_identity_key <> ''`;
    empty.fansEligible = await countSql(knex, eligibleSql);
    empty.fansWithKey = await countSql(knex, withKeySql);
    empty.fansMissingKey = Math.max(0, empty.fansEligible - empty.fansWithKey);
    empty.fanKeyCoveragePct = coveragePct(empty.fansEligible, empty.fansWithKey);
    empty.fanDuplicateKeyGroups = await countDuplicateKeys(knex, FAN_TABLE, 'canonical_identity_key');
  }

  if (!(await tableExists(knex, ATT_TABLE))) return empty;

  empty.attendanceScanned = await countSql(knex, `SELECT COUNT(*) AS n FROM ${ATT_TABLE}`);
  empty.campaignColumnPresent = await columnExists(knex, ATT_TABLE, 'campaign_identity_key');
  empty.eventColumnPresent = await columnExists(knex, ATT_TABLE, 'event_identity_key');

  if (resolved.attFan !== 'missing') {
    const valid = validAttendanceExpr(dialect, 'a');
    const fanJoin = attendanceFanJoin(resolved);
    const eventJoinInner = attendanceEventJoin(resolved, true);
    const eventCol = attendanceEventExpr(resolved);

    if (empty.campaignColumnPresent) {
      const campaignEligibleSql = `SELECT COUNT(*) AS n FROM ${ATT_TABLE} a ${fanJoin}
        WHERE a.campaign_id IS NOT NULL AND a.campaign_id <> '' AND ${valid}`;
      const campaignWithSql = `SELECT COUNT(*) AS n FROM ${ATT_TABLE} a ${fanJoin}
        WHERE a.campaign_id IS NOT NULL AND a.campaign_id <> '' AND ${valid}
          AND a.campaign_identity_key IS NOT NULL AND a.campaign_identity_key <> ''`;
      empty.campaignEligible = await countSql(knex, campaignEligibleSql);
      empty.campaignWithKey = await countSql(knex, campaignWithSql);
      empty.campaignMissingKey = Math.max(0, empty.campaignEligible - empty.campaignWithKey);
      empty.campaignKeyCoveragePct = coveragePct(empty.campaignEligible, empty.campaignWithKey);
      empty.campaignDuplicateKeyGroups = await countDuplicateKeys(knex, ATT_TABLE, 'campaign_identity_key');
    }

    if (empty.eventColumnPresent && resolved.attEvent !== 'missing') {
      const eventEligibleSql = `SELECT COUNT(*) AS n FROM ${ATT_TABLE} a ${fanJoin} ${eventJoinInner}
        WHERE ${eventCol} IS NOT NULL AND ${valid}`;
      const eventWithSql = `SELECT COUNT(*) AS n FROM ${ATT_TABLE} a ${fanJoin} ${eventJoinInner}
        WHERE ${eventCol} IS NOT NULL AND ${valid}
          AND a.event_identity_key IS NOT NULL AND a.event_identity_key <> ''`;
      empty.eventEligible = await countSql(knex, eventEligibleSql);
      empty.eventWithKey = await countSql(knex, eventWithSql);
      empty.eventMissingKey = Math.max(0, empty.eventEligible - empty.eventWithKey);
      empty.eventKeyCoveragePct = coveragePct(empty.eventEligible, empty.eventWithKey);
      empty.eventDuplicateKeyGroups = await countDuplicateKeys(knex, ATT_TABLE, 'event_identity_key');
    }
  }

  return empty;
}

function coverageLabel(pct) {
  if (pct == null || pct === '') return 'KEY COVERAGE UNKNOWN';
  return `KEY COVERAGE ${pct}%`;
}

function uniqueIndexLabel(state) {
  if (state === 'ACTIVE') return 'UNIQUE INDEX ACTIVE';
  if (state === 'PENDING') return 'UNIQUE INDEX PENDING';
  if (state === 'BLOCKED') return 'UNIQUE INDEX BLOCKED';
  return 'UNIQUE INDEX UNKNOWN';
}

function integrityDimensionLabel({ uniqueness, coveragePct, indexState }) {
  return `${uniqueness || 'UNKNOWN'} / ${coverageLabel(coveragePct)} / ${uniqueIndexLabel(indexState)}`;
}

function connectedIntegrityLabels(audit) {
  return {
    fanIdentity: integrityDimensionLabel({
      uniqueness: audit.constraints?.fanUniqueness,
      coveragePct: audit.coverage?.fanKeyCoveragePct,
      indexState: audit.identityIndexes?.fan,
    }),
    campaignAttendance: integrityDimensionLabel({
      uniqueness: audit.constraints?.campaignAttendance,
      coveragePct: audit.coverage?.campaignKeyCoveragePct,
      indexState: audit.identityIndexes?.campaign,
    }),
    eventAttendance: integrityDimensionLabel({
      uniqueness: audit.constraints?.eventAttendance,
      coveragePct: audit.coverage?.eventKeyCoveragePct,
      indexState: audit.identityIndexes?.event,
    }),
  };
}

function identityIndexStates(coverage, fans, attendance, indexes) {
  return {
    fan: identityIndexState({
      columnPresent: coverage.fanColumnPresent,
      duplicateGroups: fans.groups,
      missingKeys: coverage.fansMissingKey,
      duplicateKeyGroups: coverage.fanDuplicateKeyGroups,
      indexPresent: Boolean(indexes[FAN_IDENTITY_UNIQUE]),
    }),
    campaign: identityIndexState({
      columnPresent: coverage.campaignColumnPresent,
      duplicateGroups: attendance.campaignGroups,
      missingKeys: coverage.campaignMissingKey,
      duplicateKeyGroups: coverage.campaignDuplicateKeyGroups,
      indexPresent: Boolean(indexes[ATT_CAMPAIGN_IDENTITY_UNIQUE]),
    }),
    event: identityIndexState({
      columnPresent: coverage.eventColumnPresent,
      duplicateGroups: attendance.eventGroups,
      missingKeys: coverage.eventMissingKey,
      duplicateKeyGroups: coverage.eventDuplicateKeyGroups,
      indexPresent: Boolean(indexes[ATT_EVENT_IDENTITY_UNIQUE]),
    }),
  };
}

async function listIntegrityIndexes(knex) {
  const dialect = dialectOf(knex);
  const wanted = [
    FAN_UNIQUE,
    ATT_CAMPAIGN_UNIQUE,
    ATT_EVENT_UNIQUE,
    FAN_IDENTITY_UNIQUE,
    ATT_CAMPAIGN_IDENTITY_UNIQUE,
    ATT_EVENT_IDENTITY_UNIQUE,
    ATT_FAN_CHECKED,
    ATT_FAN_LINKS_IDX,
    FAN_BAND_LINKS_IDX,
  ];
  const present = {};
  for (const name of wanted) present[name] = false;
  try {
    if (dialect === 'postgres') {
      const rows = rawRows(
        await knex.raw(
          `SELECT indexname FROM pg_indexes WHERE indexname IN (${wanted.map(() => '?').join(',')})`,
          wanted
        )
      );
      for (const row of rows) present[row.indexname] = true;
    } else if (dialect === 'sqlite') {
      for (const table of [FAN_TABLE, ATT_TABLE, ATT_FAN_LINKS, FAN_BAND_LINKS]) {
        if (!(await tableExists(knex, table))) continue;
        const rows = rawRows(await knex.raw(`PRAGMA index_list('${table}')`));
        for (const row of rows) {
          if (wanted.includes(row.name)) present[row.name] = true;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return present;
}

async function runIntegrityAudit(knex) {
  const physical = await inspectPhysicalColumns(knex);
  const layout = physical.layout;
  const fans = await auditFanDuplicates(knex, layout);
  const attendance = await auditAttendanceDuplicates(knex, layout);
  const coverage = await auditIdentityKeyCoverage(knex, layout);
  const indexes = await listIntegrityIndexes(knex);
  const identityIndexes = identityIndexStates(coverage, fans, attendance, indexes);
  const dialect = dialectOf(knex);
  return {
    physical,
    fans,
    attendance,
    coverage,
    identityIndexes,
    constraints: {
      fanUniqueness: readiness(fans, 'fan'),
      campaignAttendance: readiness(attendance, 'campaign'),
      eventAttendance: readiness(attendance, 'event'),
    },
    indexes,
    environment: {
      dialect,
      label: dialect === 'sqlite' ? 'local_sqlite' : dialect === 'postgres' ? 'configured_postgres' : 'unknown',
      note: 'This audit reflects the connected database only. Production Railway Postgres is UNKNOWN until a host that can resolve postgres.railway.internal runs the audit.',
    },
    productionStatus: 'UNKNOWN',
    labels: connectedIntegrityLabels({
      constraints: {
        fanUniqueness: readiness(fans, 'fan'),
        campaignAttendance: readiness(attendance, 'campaign'),
        eventAttendance: readiness(attendance, 'event'),
      },
      coverage,
      identityIndexes,
    }),
  };
}

function fanIdentityUniqueSql() {
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${FAN_IDENTITY_UNIQUE} ON ${FAN_TABLE} (canonical_identity_key) WHERE canonical_identity_key IS NOT NULL`;
}

function campaignIdentityUniqueSql() {
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${ATT_CAMPAIGN_IDENTITY_UNIQUE} ON ${ATT_TABLE} (campaign_identity_key) WHERE campaign_identity_key IS NOT NULL`;
}

function eventIdentityUniqueSql() {
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${ATT_EVENT_IDENTITY_UNIQUE} ON ${ATT_TABLE} (event_identity_key) WHERE event_identity_key IS NOT NULL`;
}

function canActivateFanIdentityUnique(audit) {
  return (
    audit.coverage?.fanColumnPresent &&
    audit.constraints?.fanUniqueness === 'CLEAN' &&
    Number(audit.coverage.fansMissingKey || 0) === 0 &&
    Number(audit.coverage.fanDuplicateKeyGroups || 0) === 0
  );
}

function canActivateCampaignIdentityUnique(audit) {
  return (
    audit.coverage?.campaignColumnPresent &&
    audit.constraints?.campaignAttendance === 'CLEAN' &&
    Number(audit.coverage.campaignMissingKey || 0) === 0 &&
    Number(audit.coverage.campaignDuplicateKeyGroups || 0) === 0
  );
}

function canActivateEventIdentityUnique(audit) {
  return (
    audit.coverage?.eventColumnPresent &&
    audit.constraints?.eventAttendance === 'CLEAN' &&
    Number(audit.coverage.eventMissingKey || 0) === 0 &&
    Number(audit.coverage.eventDuplicateKeyGroups || 0) === 0
  );
}

function fanUniqueSql(dialect) {
  if (dialect === 'sqlite') {
    return `CREATE UNIQUE INDEX IF NOT EXISTS ${FAN_UNIQUE} ON ${FAN_TABLE} (band_id, lower(trim(email))) WHERE email IS NOT NULL AND trim(email) <> '' AND band_id IS NOT NULL`;
  }
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${FAN_UNIQUE} ON ${FAN_TABLE} (band_id, (lower(btrim(email)))) WHERE email IS NOT NULL AND btrim(email) <> '' AND band_id IS NOT NULL`;
}

function campaignUniqueSql(dialect) {
  const valid = validAttendanceExpr(dialect);
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${ATT_CAMPAIGN_UNIQUE} ON ${ATT_TABLE} (fan_id, campaign_id) WHERE campaign_id IS NOT NULL AND campaign_id <> '' AND ${valid}`;
}

function eventUniqueSql(dialect) {
  const valid = validAttendanceExpr(dialect);
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${ATT_EVENT_UNIQUE} ON ${ATT_TABLE} (fan_id, event_id) WHERE event_id IS NOT NULL AND ${valid}`;
}

const CHECKED_IN_SQL = `CREATE INDEX IF NOT EXISTS ${ATT_FAN_CHECKED} ON ${ATT_TABLE} (checked_in_at DESC)`;
const ATT_FAN_LINKS_SQL = `CREATE INDEX IF NOT EXISTS ${ATT_FAN_LINKS_IDX} ON ${ATT_FAN_LINKS} (fan_id, fan_show_attendance_id)`;
const FAN_BAND_LINKS_SQL = `CREATE INDEX IF NOT EXISTS ${FAN_BAND_LINKS_IDX} ON ${FAN_BAND_LINKS} (band_id, fan_id)`;

async function execIndex(strapi, knex, label, sql) {
  try {
    await knex.raw(sql);
    strapi?.log?.info?.(`[Integrity] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi?.log?.warn?.(`[Integrity] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureFanAttendanceIntegrityIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };

  const dialect = dialectOf(knex);
  if (dialect === 'other') return { skipped: true, reason: 'unsupported_dialect' };

  const audit = await runIntegrityAudit(knex);
  const layout = audit.physical.layout;
  const applied = [];

  if (await tableExists(knex, ATT_TABLE)) {
    if (await columnExists(knex, ATT_TABLE, 'checked_in_at')) {
      applied.push(await execIndex(strapi, knex, ATT_FAN_CHECKED, CHECKED_IN_SQL));
    }
    if (await tableExists(knex, ATT_FAN_LINKS)) {
      applied.push(await execIndex(strapi, knex, ATT_FAN_LINKS_IDX, ATT_FAN_LINKS_SQL));
    }
    if (canApplyCampaignUnique(layout) && audit.constraints.campaignAttendance === 'CLEAN') {
      applied.push(await execIndex(strapi, knex, ATT_CAMPAIGN_UNIQUE, campaignUniqueSql(dialect)));
    } else {
      strapi?.log?.warn?.(
        `[Integrity] ${ATT_CAMPAIGN_UNIQUE} not applied (${audit.constraints.campaignAttendance}/${audit.physical.uniqueIndexApplicability.campaignAttendance})`
      );
    }
    if (canApplyEventUnique(layout) && audit.constraints.eventAttendance === 'CLEAN') {
      applied.push(await execIndex(strapi, knex, ATT_EVENT_UNIQUE, eventUniqueSql(dialect)));
    } else {
      strapi?.log?.warn?.(
        `[Integrity] ${ATT_EVENT_UNIQUE} not applied (${audit.constraints.eventAttendance}/${audit.physical.uniqueIndexApplicability.eventAttendance})`
      );
    }
    if (canActivateCampaignIdentityUnique(audit)) {
      applied.push(await execIndex(strapi, knex, ATT_CAMPAIGN_IDENTITY_UNIQUE, campaignIdentityUniqueSql()));
    } else {
      strapi?.log?.info?.(
        `[Integrity] ${ATT_CAMPAIGN_IDENTITY_UNIQUE} pending (${audit.identityIndexes?.campaign || 'UNKNOWN'})`
      );
    }
    if (canActivateEventIdentityUnique(audit)) {
      applied.push(await execIndex(strapi, knex, ATT_EVENT_IDENTITY_UNIQUE, eventIdentityUniqueSql()));
    } else {
      strapi?.log?.info?.(
        `[Integrity] ${ATT_EVENT_IDENTITY_UNIQUE} pending (${audit.identityIndexes?.event || 'UNKNOWN'})`
      );
    }
  }

  if (await tableExists(knex, FAN_TABLE)) {
    if (await tableExists(knex, FAN_BAND_LINKS)) {
      applied.push(await execIndex(strapi, knex, FAN_BAND_LINKS_IDX, FAN_BAND_LINKS_SQL));
    }
    if (canApplyFanUnique(layout) && audit.constraints.fanUniqueness === 'CLEAN') {
      applied.push(await execIndex(strapi, knex, FAN_UNIQUE, fanUniqueSql(dialect)));
    } else {
      strapi?.log?.warn?.(
        `[Integrity] ${FAN_UNIQUE} not applied (${audit.constraints.fanUniqueness}/${audit.physical.uniqueIndexApplicability.fan})`
      );
    }
    if (canActivateFanIdentityUnique(audit)) {
      applied.push(await execIndex(strapi, knex, FAN_IDENTITY_UNIQUE, fanIdentityUniqueSql()));
    } else {
      strapi?.log?.info?.(
        `[Integrity] ${FAN_IDENTITY_UNIQUE} pending (${audit.identityIndexes?.fan || 'UNKNOWN'})`
      );
    }
  }

  return { audit, applied, dialect };
}

module.exports = {
  FAN_TABLE,
  ATT_TABLE,
  FAN_BAND_LINKS,
  ATT_FAN_LINKS,
  ATT_EVENT_LINKS,
  FAN_UNIQUE,
  ATT_CAMPAIGN_UNIQUE,
  ATT_EVENT_UNIQUE,
  FAN_IDENTITY_UNIQUE,
  ATT_CAMPAIGN_IDENTITY_UNIQUE,
  ATT_EVENT_IDENTITY_UNIQUE,
  ATT_FAN_CHECKED,
  FAN_MERGE_CONTRACT,
  FAN_MERGE_CHILD_REFS,
  dialectOf,
  classifyFanDuplicateGroup,
  canonicalShowCountSql,
  auditFanDuplicates,
  auditAttendanceDuplicates,
  auditIdentityKeyCoverage,
  identityIndexState,
  identityIndexStates,
  runIntegrityAudit,
  readiness,
  fanUniqueSql,
  campaignUniqueSql,
  eventUniqueSql,
  fanIdentityUniqueSql,
  campaignIdentityUniqueSql,
  eventIdentityUniqueSql,
  canActivateFanIdentityUnique,
  canActivateCampaignIdentityUnique,
  canActivateEventIdentityUnique,
  CHECKED_IN_SQL,
  ensureFanAttendanceIntegrityIndexes,
  listIntegrityIndexes,
  resolveLayout,
  canApplyFanUnique,
  canApplyCampaignUnique,
  canApplyEventUnique,
  tableExists,
  columnExists,
  rawRows,
  validAttendanceExpr,
  attendanceFanExpr,
  attendanceFanJoin,
  connectedIntegrityLabels,
  integrityDimensionLabel,
};
