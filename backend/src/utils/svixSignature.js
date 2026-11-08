'use strict';

/**
 * Svix webhook signature verification.
 *
 * Resend signs webhooks with Svix. Implemented directly against `crypto`
 * rather than pulling in the `svix` package, and shaped to match the existing
 * Stripe webhook pattern in this codebase (raw body via `includeUnparsed`).
 *
 * Spec: signed content is `${id}.${timestamp}.${body}`, HMAC-SHA256 with the
 * base64-decoded portion of the `whsec_...` secret, compared base64.
 */

const crypto = require('crypto');

const TOLERANCE_SECONDS = 5 * 60;

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifySvixSignature({ secret, headers, rawBody }) {
  if (!secret) return { valid: false, reason: 'missing_secret' };
  if (!rawBody) return { valid: false, reason: 'missing_body' };

  const id = headers['svix-id'] || headers['webhook-id'];
  const timestamp = headers['svix-timestamp'] || headers['webhook-timestamp'];
  const signatureHeader = headers['svix-signature'] || headers['webhook-signature'];

  if (!id || !timestamp || !signatureHeader) {
    return { valid: false, reason: 'missing_headers' };
  }

  // Reject replays of an old, previously valid delivery.
  const sentAt = Number(timestamp);
  if (!Number.isFinite(sentAt)) return { valid: false, reason: 'bad_timestamp' };
  if (Math.abs(Date.now() / 1000 - sentAt) > TOLERANCE_SECONDS) {
    return { valid: false, reason: 'timestamp_out_of_tolerance' };
  }

  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', key).update(signedContent).digest('base64');

  // The header carries a space-separated list of versioned signatures.
  const provided = String(signatureHeader)
    .split(' ')
    .map((part) => part.split(','))
    .filter(([version]) => version === 'v1')
    .map(([, sig]) => sig)
    .filter(Boolean);

  if (!provided.length) return { valid: false, reason: 'no_v1_signature' };

  const matched = provided.some((sig) => timingSafeEqual(sig, expected));
  return matched ? { valid: true } : { valid: false, reason: 'signature_mismatch' };
}

module.exports = { verifySvixSignature, TOLERANCE_SECONDS };
