'use strict';

/**
 * FanProfile uniqueness: audit first, constrain only when clean.
 *
 * One users-permissions user must own at most one FanProfile. Strapi stores the
 * oneToOne relation in a link table and only guarantees the *pair*
 * (fan_profile_id, user_id) is unique — which does not stop two profiles from
 * pointing at the same user. This module audits for that, classifies any
 * duplicates, and activates a partial unique index only when the audit is clean.
 *
 * Mirrors src/utils/integrity/fanAttendanceIntegrity.js.
 */

const { dialectOf } = require('../integrity/fanAttendanceIntegrity');

const PROFILE_TABLE = 'fan_profiles';
const USER_LINKS = 'fan_profiles_user_links';
const USER_UNIQUE = 'fan_profiles_user_id_unique';

/** Fan-authored identity. Losing one of these is data loss, not bookkeeping. */
const IDENTITY_COLUMNS = ['display_name', 'first_name', 'last_name', 'profile_completed_at'];

/** Claim cache the claim path recomputes on next visit. */
const BOOKKEEPING_COLUMNS = ['claimed_artist_count', 'last_claimed_at'];

const MAX_GROUPS_INSPECTED = 200;

function rawRows(result) {
  if (!result) return [];
  if (Array.isArray(result.rows)) return result.rows;
  if (Array.isArray(result)) {
    if (result[0] && Array.isArray(result[0])) return result[0];
    return result;
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

async function countSql(knex, sql, bindings) {
  const rows = rawRows(bindings ? await knex.raw(sql, bindings) : await knex.raw(sql));
  const row = rows[0] || {};
  return Number(row.n || row.count || 0);
}

/** Relation may be an inline column or a Strapi link table. */
async function resolveLayout(knex) {
  if (await columnExists(knex, PROFILE_TABLE, 'user_id')) return 'inline';
  if (await tableExists(knex, USER_LINKS)) return 'links';
  return 'missing';
}

function userUniqueSql(layout) {
  const table = layout === 'inline' ? PROFILE_TABLE : USER_LINKS;
  return `CREATE UNIQUE INDEX IF NOT EXISTS ${USER_UNIQUE} ON ${table} (user_id) WHERE user_id IS NOT NULL`;
}

/** Existing indexes on whichever table holds user_id. */
async function listUserIndexes(knex, layout) {
  const table = layout === 'inline' ? PROFILE_TABLE : USER_LINKS;
  const dialect = dialectOf(knex);
  try {
    if (dialect === 'postgres') {
      const rows = rawRows(
        await knex.raw('SELECT indexname AS name, indexdef AS def FROM pg_indexes WHERE tablename = ?', [table])
      );
      return rows.map((r) => ({ name: String(r.name), def: String(r.def || '') }));
    }
    if (dialect === 'sqlite') {
      const rows = rawRows(
        await knex.raw("SELECT name, sql AS def FROM sqlite_master WHERE type='index' AND tbl_name = ?", [table])
      );
      return rows.map((r) => ({ name: String(r.name), def: String(r.def || '') }));
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Does an existing index actually guarantee one profile per user?
 * The Strapi-generated pair index does not, so a definition mentioning
 * fan_profile_id is explicitly not a guarantee.
 */
function indexGuaranteesOneProfilePerUser(index) {
  const def = String(index?.def || '');
  if (!/unique/i.test(def)) return false;
  const columns = def.slice(def.indexOf('('), def.lastIndexOf(')') + 1);
  if (/fan_profile_id/i.test(columns)) return false;
  return /user_id/i.test(columns);
}

function summarizeIndexes(indexes) {
  if (!Array.isArray(indexes)) {
    return { inspected: false, userUnique: null, pairUnique: null, names: [] };
  }
  return {
    inspected: true,
    userUnique: indexes.some(indexGuaranteesOneProfilePerUser),
    pairUnique: indexes.some(
      (i) => /unique/i.test(i.def) && /fan_profile_id/i.test(i.def) && /user_id/i.test(i.def)
    ),
    names: indexes.map((i) => i.name).sort(),
  };
}

function hasValue(row, column) {
  const value = row?.[column];
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (typeof value === 'number') return value !== 0;
  return true;
}

/**
 * Classify one duplicate group.
 *
 *   SAFE        — only the lowest-id row carries fan-authored identity, so the
 *                 existing "lowest id wins" rule loses nothing.
 *   CONFLICTING — a row that is not canonical carries identity or an avatar.
 *                 Dropping it would destroy something the fan chose.
 *   UNKNOWN     — the rows could not be inspected.
 */
function classifyDuplicateGroup(rows, { identityColumnsPresent = true } = {}) {
  if (!Array.isArray(rows) || rows.length < 2) return 'UNKNOWN';
  if (!identityColumnsPresent) return 'UNKNOWN';

  const ordered = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
  const extras = ordered.slice(1);

  const carriesIdentity = (row) =>
    IDENTITY_COLUMNS.some((column) => hasValue(row, column)) || Boolean(row.hasAvatar);

  if (extras.some(carriesIdentity)) return 'CONFLICTING';
  return 'SAFE';
}

function groupCarriesBookkeepingOnly(rows) {
  const ordered = [...rows].sort((a, b) => Number(a.id) - Number(b.id));
  return ordered.slice(1).some((row) => BOOKKEEPING_COLUMNS.some((column) => hasValue(row, column)));
}

function emptyDuplicates() {
  return {
    groups: 0,
    extraRows: 0,
    largestGroup: 0,
    safeGroups: 0,
    conflictingGroups: 0,
    unknownGroups: 0,
    bookkeepingOnlyGroups: 0,
    groupsInspected: 0,
    truncated: false,
  };
}

/** Duplicate user groups, then classify a bounded sample of them. */
async function auditDuplicateProfiles(knex, layout) {
  if (layout === 'missing') return { skipped: true, reason: 'no_relation', ...emptyDuplicates() };

  const table = layout === 'inline' ? PROFILE_TABLE : USER_LINKS;
  const profileRef = layout === 'inline' ? 'id' : 'fan_profile_id';

  const groupsSql = `SELECT user_id, COUNT(DISTINCT ${profileRef}) AS c
       FROM ${table}
      WHERE user_id IS NOT NULL
   GROUP BY user_id
     HAVING COUNT(DISTINCT ${profileRef}) > 1
   ORDER BY user_id
      LIMIT ${MAX_GROUPS_INSPECTED + 1}`;

  let groupRows;
  try {
    groupRows = rawRows(await knex.raw(groupsSql));
  } catch (err) {
    return { skipped: true, reason: err.code || 'query_failed', ...emptyDuplicates() };
  }

  const truncated = groupRows.length > MAX_GROUPS_INSPECTED;
  const inspectable = truncated ? groupRows.slice(0, MAX_GROUPS_INSPECTED) : groupRows;

  const totals = emptyDuplicates();
  totals.groups = groupRows.length;
  totals.truncated = truncated;
  totals.extraRows = inspectable.reduce((sum, row) => sum + (Number(row.c) - 1), 0);
  totals.largestGroup = inspectable.reduce((max, row) => Math.max(max, Number(row.c)), 0);
  if (!inspectable.length) return totals;

  const identityColumnsPresent = (
    await Promise.all(IDENTITY_COLUMNS.map((column) => columnExists(knex, PROFILE_TABLE, column)))
  ).every(Boolean);

  const userIds = inspectable.map((row) => row.user_id);
  const selectColumns = ['id', ...IDENTITY_COLUMNS, ...BOOKKEEPING_COLUMNS];

  let profileRows = [];
  try {
    profileRows =
      layout === 'inline'
        ? await knex(PROFILE_TABLE).select([...selectColumns, 'user_id']).whereIn('user_id', userIds)
        : await knex(USER_LINKS)
            .join(PROFILE_TABLE, `${PROFILE_TABLE}.id`, `${USER_LINKS}.fan_profile_id`)
            .select([
              ...selectColumns.map((c) => `${PROFILE_TABLE}.${c}`),
              `${USER_LINKS}.user_id`,
            ])
            .whereIn(`${USER_LINKS}.user_id`, userIds);
  } catch (err) {
    totals.unknownGroups = inspectable.length;
    totals.groupsInspected = 0;
    totals.reason = err.code || 'profile_read_failed';
    return totals;
  }

  // Avatar lives in Strapi's polymorphic upload table, not on fan_profiles.
  const avatarIds = new Set();
  if (await tableExists(knex, 'files_related_morphs')) {
    try {
      const morphs = await knex('files_related_morphs')
        .select('related_id')
        .where('related_type', 'api::fan-profile.fan-profile')
        .whereIn(
          'related_id',
          profileRows.map((row) => row.id)
        );
      for (const row of morphs) avatarIds.add(Number(row.related_id));
    } catch {
      /* avatar presence is best-effort; classification falls back to columns */
    }
  }

  const byUser = new Map();
  for (const row of profileRows) {
    const key = String(row.user_id);
    if (!byUser.has(key)) byUser.set(key, []);
    byUser.get(key).push({ ...row, hasAvatar: avatarIds.has(Number(row.id)) });
  }

  for (const group of byUser.values()) {
    const verdict = classifyDuplicateGroup(group, { identityColumnsPresent });
    if (verdict === 'SAFE') totals.safeGroups += 1;
    else if (verdict === 'CONFLICTING') totals.conflictingGroups += 1;
    else totals.unknownGroups += 1;
    if (verdict === 'SAFE' && groupCarriesBookkeepingOnly(group)) totals.bookkeepingOnlyGroups += 1;
  }
  totals.groupsInspected = byUser.size;

  return totals;
}

async function auditFanProfileUniqueness(knex) {
  const dialect = dialectOf(knex);

  if (!(await tableExists(knex, PROFILE_TABLE))) {
    return {
      dialect,
      layout: 'missing',
      state: 'UNKNOWN',
      reason: 'no_table',
      counts: {},
      duplicates: emptyDuplicates(),
      index: summarizeIndexes(null),
      canActivateUnique: false,
    };
  }

  const layout = await resolveLayout(knex);
  const linkTable = layout === 'inline' ? PROFILE_TABLE : USER_LINKS;

  const counts = { profiles: await countSql(knex, `SELECT COUNT(*) AS n FROM ${PROFILE_TABLE}`) };

  if (layout !== 'missing') {
    counts.linkedUsers = await countSql(
      knex,
      `SELECT COUNT(DISTINCT user_id) AS n FROM ${linkTable} WHERE user_id IS NOT NULL`
    );
    counts.orphanLinks = await countSql(
      knex,
      `SELECT COUNT(*) AS n FROM ${linkTable} WHERE user_id IS NULL`
    );
    if (layout === 'links') {
      counts.links = await countSql(knex, `SELECT COUNT(*) AS n FROM ${USER_LINKS}`);
      counts.profilesWithoutLink = await countSql(
        knex,
        `SELECT COUNT(*) AS n FROM ${PROFILE_TABLE} p
          WHERE NOT EXISTS (SELECT 1 FROM ${USER_LINKS} l WHERE l.fan_profile_id = p.id AND l.user_id IS NOT NULL)`
      );
    }
  }

  const duplicates = await auditDuplicateProfiles(knex, layout);
  const index = summarizeIndexes(await listUserIndexes(knex, layout));

  let state = 'UNKNOWN';
  if (layout === 'missing' || duplicates.skipped) state = 'UNKNOWN';
  else if (duplicates.groups === 0) state = 'CLEAN';
  else state = 'DUPLICATES';

  return {
    dialect,
    layout,
    table: linkTable,
    state,
    counts,
    duplicates,
    index,
    uniqueSql: layout === 'missing' ? null : userUniqueSql(layout),
    canActivateUnique: state === 'CLEAN' && layout !== 'missing',
  };
}

async function execIndex(strapi, knex, label, sql) {
  try {
    await knex.raw(sql);
    strapi?.log?.info?.(`[FanProfile] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi?.log?.warn?.(`[FanProfile] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

/**
 * Boot-time activation. Never destructive: if the audit finds duplicates the
 * index is left unapplied and the state is logged for a human to reconcile.
 */
async function ensureFanProfileIndexes(strapi) {
  const knex = strapi?.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };

  let audit;
  try {
    audit = await auditFanProfileUniqueness(knex);
  } catch (err) {
    strapi?.log?.warn?.(`[FanProfile] uniqueness audit skipped: ${err.message}`);
    return { skipped: true, reason: 'audit_failed' };
  }

  if (!audit.canActivateUnique) {
    strapi?.log?.warn?.(
      `[FanProfile] unique index NOT applied state=${audit.state} layout=${audit.layout} ` +
        `duplicateGroups=${audit.duplicates.groups} conflicting=${audit.duplicates.conflictingGroups}`
    );
    return { skipped: true, reason: audit.state, audit };
  }

  const result = await execIndex(strapi, knex, USER_UNIQUE, audit.uniqueSql);
  strapi?.log?.info?.(
    `[FanProfile] uniqueness:ready state=${audit.state} profiles=${audit.counts.profiles} index=${result.ok}`
  );
  return { ok: result.ok, results: [result], audit };
}

module.exports = {
  PROFILE_TABLE,
  USER_LINKS,
  USER_UNIQUE,
  IDENTITY_COLUMNS,
  BOOKKEEPING_COLUMNS,
  resolveLayout,
  userUniqueSql,
  indexGuaranteesOneProfilePerUser,
  summarizeIndexes,
  classifyDuplicateGroup,
  groupCarriesBookkeepingOnly,
  auditDuplicateProfiles,
  auditFanProfileUniqueness,
  ensureFanProfileIndexes,
};
