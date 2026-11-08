'use strict';

/**
 * Controlled RelationshipEvent type registry.
 * Add keys here — not in controllers. Producer wiring may lag the registry.
 */

const EVENT_TYPES = Object.freeze([
  'fan_joined',
  'fan_unsubscribed',
  'show_checked_in',
  'show_returned',
  'artist_message_sent',
  'fan_replied',
  'artist_update_published',
  'show_gallery_added',
  'passport_claimed',
  'milestone_earned',
  'support_received',
]);

const EVENT_TYPE_SET = new Set(EVENT_TYPES);

const SOURCE_TYPES = Object.freeze([
  'fan',
  'fan_show_attendance',
  'conversation_message',
  'artist_update',
  'milestone',
  'support_moment',
]);

const SOURCE_TYPE_SET = new Set(SOURCE_TYPES);

const VISIBILITIES = Object.freeze([
  'artist_fan',
  'fan_only',
  'artist_only',
  'derived_from_source',
]);

const VISIBILITY_SET = new Set(VISIBILITIES);

const DEFAULT_VISIBILITY = {
  fan_joined: 'artist_fan',
  fan_unsubscribed: 'artist_fan',
  show_checked_in: 'artist_fan',
  show_returned: 'artist_fan',
  artist_message_sent: 'artist_fan',
  fan_replied: 'artist_fan',
  artist_update_published: 'derived_from_source',
  show_gallery_added: 'derived_from_source',
  passport_claimed: 'fan_only',
  milestone_earned: 'artist_fan',
  support_received: 'artist_fan',
};

function assertEventType(type) {
  const key = String(type || '');
  if (!EVENT_TYPE_SET.has(key)) {
    const err = new Error(`Unknown relationship event type: ${key || '(empty)'}`);
    err.code = 'unknown_event_type';
    throw err;
  }
  return key;
}

function assertSourceType(sourceType) {
  const key = String(sourceType || '');
  if (!SOURCE_TYPE_SET.has(key)) {
    const err = new Error(`Unknown relationship source type: ${key || '(empty)'}`);
    err.code = 'unknown_source_type';
    throw err;
  }
  return key;
}

function assertVisibility(visibility) {
  const key = String(visibility || '');
  if (!VISIBILITY_SET.has(key)) {
    const err = new Error(`Unknown relationship visibility: ${key || '(empty)'}`);
    err.code = 'unknown_visibility';
    throw err;
  }
  return key;
}

function defaultVisibilityFor(type) {
  return DEFAULT_VISIBILITY[type] || 'artist_fan';
}

function idempotencyKey(type, ...parts) {
  const t = assertEventType(type);
  const rest = parts.map((p) => String(p)).join(':');
  return rest ? `${t}:${rest}` : t;
}

module.exports = {
  EVENT_TYPES,
  EVENT_TYPE_SET,
  SOURCE_TYPES,
  SOURCE_TYPE_SET,
  VISIBILITIES,
  VISIBILITY_SET,
  DEFAULT_VISIBILITY,
  assertEventType,
  assertSourceType,
  assertVisibility,
  defaultVisibilityFor,
  idempotencyKey,
};
