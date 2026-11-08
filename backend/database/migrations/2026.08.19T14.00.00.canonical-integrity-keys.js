'use strict';

/**
 * Identity-key unique indexes. Skip-safe: never fails Strapi boot.
 *
 * Columns come from Strapi schema sync. Unique indexes are created only when
 * the connected database is CLEAN, key coverage is complete, and duplicate
 * keys are zero. Production uniqueness remains pending until that host is
 * audited and backfilled (see scripts/backfill-canonical-integrity-keys.js).
 */

const integrity = require('../../src/utils/integrity/fanAttendanceIntegrity');

async function up(knex) {
  try {
    const fakeStrapi = {
      log: {
        info: (m) => console.info(m),
        warn: (m) => console.warn(m),
      },
      db: { connection: knex },
    };
    await integrity.ensureFanAttendanceIntegrityIndexes(fakeStrapi);
  } catch (err) {
    console.warn(`[Integrity] identity-key migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
