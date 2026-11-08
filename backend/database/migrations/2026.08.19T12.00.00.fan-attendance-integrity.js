'use strict';

/**
 * Conditional uniqueness for fans and show attendance.
 *
 * NEVER fails Strapi boot: dirty data or missing tables skip unique indexes.
 * Unique indexes are created only when a read-only audit reports CLEAN.
 * Production cleanliness is UNKNOWN until that database is actually audited.
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
    console.warn(`[Integrity] unique index migration skipped: ${err.message}`);
  }
}

async function down() {}

module.exports = { up, down };
