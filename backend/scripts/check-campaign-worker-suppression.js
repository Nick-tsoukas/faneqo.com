'use strict';

/**
 * Verifies pre-delivery suppression recheck (unsubscribe after queue).
 * Run: node scripts/check-campaign-worker-suppression.js
 */

const path = require('path');

let failures = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${actual}\n        want: ${expected}`);
}

const fansById = {
  1: { id: 1, email: 'ok@example.com', status: 'subscribed', suppressionReason: null },
  2: { id: 2, email: 'gone@example.com', status: 'unsubscribed', suppressionReason: 'manual' },
  3: { id: 3, email: 'dead@example.com', status: 'subscribed', suppressionReason: 'bounced' },
  4: { id: 4, email: 'bad', status: 'subscribed', suppressionReason: null },
  5: { id: 5, email: 'off@example.com', status: 'unsubscribed', accountUser: { id: 50 } },
  6: { id: 6, email: 'anon@example.com', status: 'subscribed', accountUser: null },
  7: { id: 7, email: 'removed@example.com', status: 'removed', accountUser: { id: 70 } },
  8: { id: 8, email: 'self@example.com', status: 'subscribed', accountUser: { id: 80 } },
  9: {
    id: 9,
    email: 'recent@example.com',
    status: 'subscribed',
    accountUser: { id: 90 },
    lastInboxBroadcastAt: new Date().toISOString(),
  },
};

global.strapi = {
  entityService: {
    async findOne(uid, id) {
      if (uid === 'api::fan.fan') return fansById[id] || null;
      return null;
    },
  },
  log: { info() {}, warn() {}, error() {}, debug() {} },
};

const { recheckSuppression, recheckInboxEligibility } = require(path.join(
  __dirname,
  '../src/utils/messaging/campaignWorker'
));

(async () => {
  check('subscribed fan is sendable', (await recheckSuppression(1)).suppress, false);
  check('unsubscribed after queue is blocked', (await recheckSuppression(2)).reason, 'unsubscribed');
  check('bounced fan is blocked', (await recheckSuppression(3)).reason, 'bounced');
  check('invalid email is blocked', (await recheckSuppression(4)).reason, 'invalid_email');
  check('missing fan is blocked', (await recheckSuppression(999)).reason, 'fan_missing');
  check('email opt-out does not block inbox', (await recheckInboxEligibility(5, 1)).suppress, false);
  check('fan without an account is blocked from inbox', (await recheckInboxEligibility(6, 1)).reason, 'not_on_faneqo');
  check('removed relationship is blocked from inbox', (await recheckInboxEligibility(7, 1)).reason, 'fan_removed');
  check('artist cannot broadcast to self', (await recheckInboxEligibility(8, 80)).reason, 'self_message');
  check('recent inbox broadcast remains sendable', (await recheckInboxEligibility(9, 1)).suppress, false);

  if (failures) {
    console.error(`\n${failures} failure(s)`);
    process.exit(1);
  }
  console.log('\nSuppression recheck checks passed.');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
