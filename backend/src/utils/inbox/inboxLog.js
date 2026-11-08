'use strict';

/**
 * Structured Inbox logs. Never log message body, JWT, email, or tokens.
 */

const crypto = require('crypto');

function newInboxRequestId() {
  return `req_${crypto.randomBytes(4).toString('hex')}`;
}

function jwtFailureReason(err) {
  const name = String(err?.name || '');
  const msg = String(err?.message || '').toLowerCase();
  if (name === 'TokenExpiredError' || msg.includes('jwt expired') || msg.includes('expired')) {
    return 'expired_token';
  }
  return 'invalid_token';
}

function attachInboxRequest(ctx, requestId) {
  if (!ctx || !requestId) return requestId;
  if (ctx.state) ctx.state.inboxRequestId = requestId;
  try {
    ctx.set('X-Faneqo-Inbox-Request-Id', requestId);
  } catch {
    /* header optional */
  }
  return requestId;
}

function inboxLog(logger, event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`);
  const line = `[Faneqo Inbox] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`;
  const blocked = String(event).includes('blocked') || String(event).includes('error');
  if (blocked) {
    (logger?.warn || console.warn).call(logger || console, line);
    return;
  }
  (logger?.info || console.info).call(logger || console, line);
}

module.exports = {
  newInboxRequestId,
  inboxLog,
  jwtFailureReason,
  attachInboxRequest,
};
