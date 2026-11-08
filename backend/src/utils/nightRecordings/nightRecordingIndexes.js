'use strict';

/**
 * Lightweight Night Recording indexes. Skip-safe if the table is not synced yet.
 */

const TABLE = 'night_recordings';

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

async function execIndex(strapi, knex, label, sql) {
  try {
    await knex.raw(sql);
    strapi.log?.info?.(`[NightRecording] index ok: ${label}`);
    return { ok: true, label };
  } catch (err) {
    strapi.log?.warn?.(`[NightRecording] index skipped: ${label} (${err.message})`);
    return { ok: false, label, error: err.message };
  }
}

async function ensureNightRecordingIndexes(strapi) {
  const knex = strapi.db?.connection;
  if (!knex || typeof knex.raw !== 'function') return { skipped: true, reason: 'no_connection' };
  if (!(await tableExists(knex, TABLE))) return { skipped: true, reason: 'no_table' };

  const results = [];
  if (await columnExists(knex, TABLE, 'sort_order')) {
    results.push(
      await execIndex(
        strapi,
        knex,
        'sort_order',
        'CREATE INDEX IF NOT EXISTS night_recordings_sort_order ON night_recordings (sort_order, id)'
      )
    );
  }
  if (await columnExists(knex, TABLE, 'status')) {
    results.push(
      await execIndex(
        strapi,
        knex,
        'status',
        'CREATE INDEX IF NOT EXISTS night_recordings_status ON night_recordings (status)'
      )
    );
  }

  const recapLinks = 'night_recordings_show_recap_links';
  if (
    await tableExists(knex, recapLinks)
    && await columnExists(knex, recapLinks, 'show_recap_id')
  ) {
    const sql = await columnExists(knex, recapLinks, 'night_recording_id')
      ? 'CREATE INDEX IF NOT EXISTS night_recordings_show_recap_links_recap ON night_recordings_show_recap_links (show_recap_id, night_recording_id)'
      : 'CREATE INDEX IF NOT EXISTS night_recordings_show_recap_links_recap ON night_recordings_show_recap_links (show_recap_id)';
    results.push(await execIndex(strapi, knex, 'show_recap_links', sql));
  }

  const bandLinks = 'night_recordings_band_links';
  if (await tableExists(knex, bandLinks) && await columnExists(knex, bandLinks, 'band_id')) {
    results.push(
      await execIndex(
        strapi,
        knex,
        'band_links',
        'CREATE INDEX IF NOT EXISTS night_recordings_band_links_band ON night_recordings_band_links (band_id)'
      )
    );
  }

  const okCount = results.filter((row) => row.ok).length;
  strapi.log?.info?.(`[NightRecording] indexes:ready ok=${okCount} attempted=${results.length}`);
  return { results };
}

module.exports = { ensureNightRecordingIndexes };
