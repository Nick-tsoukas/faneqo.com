'use strict';

/**
 * Verifies stuck status=sending recipients are reclaimed after crash.
 * Run: node scripts/check-stuck-sending-reclaim.js
 */

const path = require('path');

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${actual}\n        want: ${expected}`);
}

const recipients = new Map([
  [1, { id: 1, campaign: 10, status: 'sending' }],
  [2, { id: 2, campaign: 10, status: 'sent' }],
  [3, { id: 3, campaign: 10, status: 'sending' }],
  [4, { id: 4, campaign: 11, status: 'sending' }],
]);

global.strapi = {
  log: { info() {}, warn() {}, error() {}, debug() {} },
  entityService: {
    async findMany(uid, opts = {}) {
      if (uid !== 'api::message-recipient.message-recipient') return [];
      return Array.from(recipients.values()).filter((r) => {
        if (opts.filters?.campaign != null && r.campaign !== opts.filters.campaign) return false;
        if (opts.filters?.status != null && r.status !== opts.filters.status) return false;
        return true;
      });
    },
  },
  db: {
    query() {
      return {
        async update({ where, data }) {
          const row = recipients.get(where.id);
          if (!row) return null;
          if (where.status && row.status !== where.status) return null;
          Object.assign(row, data);
          return row;
        },
      };
    },
  },
};

const { reclaimStuckSendingRecipients } = require(path.join(
  __dirname,
  '../src/utils/messaging/campaignWorker'
));

(async () => {
  const n = await reclaimStuckSendingRecipients(10);
  check('reclaimed two stuck rows for campaign 10', n, 2);
  check('row 1 back to pending', recipients.get(1).status, 'pending');
  check('row 2 stays sent', recipients.get(2).status, 'sent');
  check('row 3 back to pending', recipients.get(3).status, 'pending');
  check('other campaign untouched', recipients.get(4).status, 'sending');

  if (failures) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log('\nStuck-sending reclaim checks passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
