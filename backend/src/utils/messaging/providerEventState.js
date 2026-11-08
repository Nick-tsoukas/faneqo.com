'use strict';

/**
 * Pure Resend provider-event normalization and recipient transition policy.
 *
 * No Strapi or database I/O belongs here. The webhook ingester is responsible
 * for durable svix-id claims and applying the returned mutation atomically.
 */

const SUPPORTED_EVENT_TYPES = new Set([
  'email.sent',
  'email.delivered',
  'email.delivery_delayed',
  'email.failed',
  'email.bounced',
  'email.suppressed',
  'email.complained',
  'email.opened',
  'email.clicked',
]);

const PERMANENT_BOUNCE_TYPES = new Set(['permanent', 'hard', 'hardbounce']);
const NON_PERMANENT_BOUNCE_TYPES = new Set(['transient', 'soft', 'softbounce', 'undetermined']);

function normalizedIso(value) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function earlierIso(current, candidate) {
  const a = normalizedIso(current);
  const b = normalizedIso(candidate);
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() <= new Date(b).getTime() ? a : b;
}

function laterIso(current, candidate) {
  const a = normalizedIso(current);
  const b = normalizedIso(candidate);
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

function bounceTypeFromData(data = {}) {
  return String(data?.bounce?.type || data?.bounce_type || '').trim().toLowerCase();
}

/**
 * Resend currently documents email.bounced as permanent. An explicit
 * transient/undetermined classification still fails safe and never suppresses.
 */
function isPermanentBounce(data = {}) {
  const type = bounceTypeFromData(data);
  if (!type) return true;
  if (NON_PERMANENT_BOUNCE_TYPES.has(type)) return false;
  return PERMANENT_BOUNCE_TYPES.has(type);
}

function eventOccurredAt(event = {}) {
  return normalizedIso(event.created_at || event.createdAt || event?.data?.created_at || event?.data?.createdAt);
}

function currentStateRank(row = {}) {
  if (row.status === 'canceled') return 100;
  if (row.status === 'suppressed' && row.failureCode === 'complained') return 60;
  if (row.status === 'bounced') return 50;
  if (row.status === 'suppressed') return 40;
  if (row.status === 'delivered') return 30;
  if (row.status === 'failed') return 20;
  if (row.status === 'sent') return 10;
  if (row.status === 'sending') return 5;
  return 0;
}

function targetState(type) {
  switch (type) {
    case 'email.sent':
      return { status: 'sent', rank: 10 };
    case 'email.delivered':
      return { status: 'delivered', rank: 30 };
    case 'email.failed':
      return { status: 'failed', rank: 20, failureCode: 'provider_failed', failureReason: 'provider_failed' };
    case 'email.bounced':
      return { status: 'bounced', rank: 50, failureCode: 'bounced', failureReason: 'permanent_bounce' };
    case 'email.suppressed':
      return { status: 'suppressed', rank: 40, failureCode: 'provider_suppressed', failureReason: 'provider_suppressed' };
    case 'email.complained':
      return { status: 'suppressed', rank: 60, failureCode: 'complained', failureReason: 'complained' };
    default:
      return null;
  }
}

function setFirstTimestamp(data, row, field, occurredAt, facts) {
  const next = earlierIso(row?.[field], occurredAt);
  const current = normalizedIso(row?.[field]);
  if (next && next !== current) data[field] = next;
  if (!current && next) facts.push(field.replace(/At$/, ''));
}

function buildProviderEventTransition({ row = {}, event = {} } = {}) {
  const type = String(event.type || '').trim();
  if (!SUPPORTED_EVENT_TYPES.has(type)) {
    return { supported: false, action: 'ignore', reason: 'unsupported_event', type };
  }

  const occurredAt = eventOccurredAt(event);
  if (!occurredAt) {
    return { supported: true, action: 'ignore', reason: 'invalid_occurred_at', type };
  }

  if (type === 'email.bounced' && !isPermanentBounce(event.data || {})) {
    return {
      supported: true,
      action: 'record_only',
      reason: 'non_permanent_bounce',
      type,
      occurredAt,
      data: {},
      newFacts: [],
      suppressFan: null,
    };
  }

  if (type === 'email.delivery_delayed') {
    return {
      supported: true,
      action: 'record_only',
      reason: 'delivery_delayed',
      type,
      occurredAt,
      data: {},
      newFacts: [],
      suppressFan: null,
    };
  }

  const data = {};
  const newFacts = [];
  let suppressFan = null;

  if (type === 'email.sent') {
    setFirstTimestamp(data, row, 'sentAt', occurredAt, newFacts);
  } else if (type === 'email.delivered') {
    // Delivery implies provider acceptance, even if the sent webhook arrived late.
    setFirstTimestamp(data, row, 'sentAt', occurredAt, newFacts);
    setFirstTimestamp(data, row, 'deliveredAt', occurredAt, newFacts);
  } else if (type === 'email.failed') {
    setFirstTimestamp(data, row, 'failedAt', occurredAt, newFacts);
  } else if (type === 'email.bounced') {
    setFirstTimestamp(data, row, 'bouncedAt', occurredAt, newFacts);
    suppressFan = 'bounced';
  } else if (type === 'email.suppressed') {
    setFirstTimestamp(data, row, 'suppressedAt', occurredAt, newFacts);
  } else if (type === 'email.complained') {
    setFirstTimestamp(data, row, 'suppressedAt', occurredAt, newFacts);
    suppressFan = 'complained';
  } else if (type === 'email.opened') {
    setFirstTimestamp(data, row, 'openedAt', occurredAt, newFacts);
  } else if (type === 'email.clicked') {
    setFirstTimestamp(data, row, 'clickedAt', occurredAt, newFacts);
  }

  const priorProviderAt = normalizedIso(row.lastProviderEventAt);
  const outOfOrder = Boolean(priorProviderAt && new Date(occurredAt) < new Date(priorProviderAt));
  const nextProviderAt = laterIso(priorProviderAt, occurredAt);
  if (nextProviderAt && nextProviderAt !== priorProviderAt) {
    data.lastProviderEventAt = nextProviderAt;
  }

  const target = targetState(type);
  let stateReason = null;

  if (target) {
    const currentRank = currentStateRank(row);
    if (row.status === 'canceled') {
      stateReason = 'manual_canceled_terminal';
    } else if (outOfOrder) {
      stateReason = 'out_of_order_fact_only';
    } else if (target.rank > currentRank) {
      data.status = target.status;
      if (target.failureCode) data.failureCode = target.failureCode;
      if (target.failureReason) data.failureReason = target.failureReason;
    } else if (
      target.rank === currentRank
      && target.failureCode
      && row.failureCode !== target.failureCode
    ) {
      data.status = target.status;
      data.failureCode = target.failureCode;
      data.failureReason = target.failureReason;
    } else {
      stateReason = 'weaker_or_duplicate_state';
    }
  }

  const keys = Object.keys(data);
  return {
    supported: true,
    action: keys.length ? 'apply' : 'ignore',
    reason: stateReason || (keys.length ? 'apply' : 'duplicate'),
    type,
    occurredAt,
    data,
    newFacts,
    suppressFan,
  };
}

module.exports = {
  SUPPORTED_EVENT_TYPES,
  PERMANENT_BOUNCE_TYPES,
  NON_PERMANENT_BOUNCE_TYPES,
  normalizedIso,
  earlierIso,
  laterIso,
  bounceTypeFromData,
  isPermanentBounce,
  eventOccurredAt,
  currentStateRank,
  targetState,
  buildProviderEventTransition,
};
