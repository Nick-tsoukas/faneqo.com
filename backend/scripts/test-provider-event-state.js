'use strict';

const assert = require('assert');
const {
  buildProviderEventTransition,
  isPermanentBounce,
} = require('../src/utils/messaging/providerEventState');

const T1 = '2026-08-26T10:00:00.000Z';
const T2 = '2026-08-26T10:01:00.000Z';
const T3 = '2026-08-26T10:02:00.000Z';

function event(type, createdAt = T2, data = {}) {
  return { type, created_at: createdAt, data };
}

function transition(row, type, createdAt, data) {
  return buildProviderEventTransition({ row, event: event(type, createdAt, data) });
}

function run() {
  assert.equal(isPermanentBounce({ bounce: { type: 'Permanent' } }), true);
  assert.equal(isPermanentBounce({ bounce: { type: 'Transient' } }), false);
  assert.equal(isPermanentBounce({ bounce: { type: 'Undetermined' } }), false);
  assert.equal(isPermanentBounce({}), true);

  const unsupported = transition({}, 'contact.created', T1);
  assert.equal(unsupported.action, 'ignore');
  assert.equal(unsupported.reason, 'unsupported_event');

  const invalid = transition({}, 'email.sent', 'not-a-date');
  assert.equal(invalid.action, 'ignore');
  assert.equal(invalid.reason, 'invalid_occurred_at');

  const sent = transition({ status: 'pending' }, 'email.sent', T1);
  assert.equal(sent.data.status, 'sent');
  assert.equal(sent.data.sentAt, T1);
  assert.deepEqual(sent.newFacts, ['sent']);

  const delivered = transition({ status: 'pending' }, 'email.delivered', T2);
  assert.equal(delivered.data.status, 'delivered');
  assert.equal(delivered.data.sentAt, T2);
  assert.equal(delivered.data.deliveredAt, T2);
  assert.deepEqual(delivered.newFacts, ['sent', 'delivered']);

  const duplicateDelivered = transition({
    status: 'delivered',
    sentAt: T1,
    deliveredAt: T2,
    lastProviderEventAt: T2,
  }, 'email.delivered', T2);
  assert.equal(duplicateDelivered.action, 'ignore');
  assert.deepEqual(duplicateDelivered.newFacts, []);

  const opened = transition({ status: 'sent' }, 'email.opened', T1);
  assert.equal(opened.data.openedAt, T1);
  assert.equal(opened.data.status, undefined);

  const earlierOpen = transition({ status: 'delivered', openedAt: T2 }, 'email.opened', T1);
  assert.equal(earlierOpen.data.openedAt, T1);

  const delayed = transition({ status: 'sent' }, 'email.delivery_delayed', T2);
  assert.equal(delayed.action, 'record_only');
  assert.equal(delayed.suppressFan, null);

  const transientBounce = transition(
    { status: 'sent', sentAt: T1 },
    'email.bounced',
    T2,
    { bounce: { type: 'Transient' } }
  );
  assert.equal(transientBounce.action, 'record_only');
  assert.equal(transientBounce.suppressFan, null);

  const hardBounce = transition(
    { status: 'delivered', sentAt: T1, deliveredAt: T2 },
    'email.bounced',
    T3,
    { bounce: { type: 'Permanent' } }
  );
  assert.equal(hardBounce.data.status, 'bounced');
  assert.equal(hardBounce.data.bouncedAt, T3);
  assert.equal(hardBounce.data.failureCode, 'bounced');
  assert.equal(hardBounce.suppressFan, 'bounced');

  const complaint = transition(
    { status: 'delivered', sentAt: T1, deliveredAt: T2 },
    'email.complained',
    T3
  );
  assert.equal(complaint.data.status, 'suppressed');
  assert.equal(complaint.data.failureCode, 'complained');
  assert.equal(complaint.suppressFan, 'complained');

  const bounceAfterComplaint = transition({
    status: 'suppressed',
    failureCode: 'complained',
    failureReason: 'complained',
    suppressedAt: T2,
    lastProviderEventAt: T2,
  }, 'email.bounced', T3, { bounce: { type: 'Permanent' } });
  assert.equal(bounceAfterComplaint.data.status, undefined);
  assert.equal(bounceAfterComplaint.data.failureCode, undefined);
  assert.equal(bounceAfterComplaint.data.bouncedAt, T3);

  const deliveredAfterBounce = transition({
    status: 'bounced',
    failureCode: 'bounced',
    bouncedAt: T2,
    lastProviderEventAt: T2,
  }, 'email.delivered', T1);
  assert.equal(deliveredAfterBounce.data.status, undefined);
  assert.equal(deliveredAfterBounce.data.failureCode, undefined);
  assert.equal(deliveredAfterBounce.data.sentAt, T1);
  assert.equal(deliveredAfterBounce.data.deliveredAt, T1);
  assert.equal(deliveredAfterBounce.reason, 'out_of_order_fact_only');

  const providerSuppressed = transition({ status: 'sent', sentAt: T1 }, 'email.suppressed', T2);
  assert.equal(providerSuppressed.data.status, 'suppressed');
  assert.equal(providerSuppressed.data.failureCode, 'provider_suppressed');
  assert.equal(providerSuppressed.suppressFan, null);

  const failed = transition({ status: 'sent', sentAt: T1 }, 'email.failed', T2);
  assert.equal(failed.data.status, 'failed');
  assert.equal(failed.data.failedAt, T2);

  const deliveredAfterFailure = transition({
    status: 'failed',
    sentAt: T1,
    failedAt: T2,
    lastProviderEventAt: T2,
  }, 'email.delivered', T3);
  assert.equal(deliveredAfterFailure.data.status, 'delivered');

  const failedAfterDelivery = transition({
    status: 'delivered',
    sentAt: T1,
    deliveredAt: T2,
    lastProviderEventAt: T2,
  }, 'email.failed', T3);
  assert.equal(failedAfterDelivery.data.status, undefined);
  assert.equal(failedAfterDelivery.data.failureCode, undefined);

  const canceledDelivery = transition({ status: 'canceled' }, 'email.delivered', T2);
  assert.equal(canceledDelivery.data.status, undefined);
  assert.equal(canceledDelivery.data.sentAt, T2);
  assert.equal(canceledDelivery.data.deliveredAt, T2);
  assert.equal(canceledDelivery.reason, 'manual_canceled_terminal');

  const canceledOpen = transition({ status: 'canceled' }, 'email.opened', T2);
  assert.equal(canceledOpen.data.openedAt, T2);
  assert.equal(canceledOpen.data.status, undefined);

  console.log('provider event state tests passed');
}

run();
