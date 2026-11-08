'use strict';

/**
 * Sanity check for Resend/Svix webhook signature verification.
 * Run: node scripts/check-svix-signature.js
 */

const crypto = require('crypto');

const { verifySvixSignature } = require('../src/utils/svixSignature');

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}\n        got: ${actual}\n        want: ${expected}`);
}

const SECRET = `whsec_${Buffer.from('a-test-signing-key-value').toString('base64')}`;
const body = JSON.stringify({ type: 'email.bounced', data: { to: ['dead@example.com'] } });

function sign({ id, timestamp, secret = SECRET, content = body }) {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  return crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${content}`).digest('base64');
}

const now = Math.floor(Date.now() / 1000);
const id = 'msg_2abc';
const good = sign({ id, timestamp: now });

const headersFor = (overrides = {}) => ({
  'svix-id': id,
  'svix-timestamp': String(now),
  'svix-signature': `v1,${good}`,
  ...overrides,
});

check(
  'a correctly signed payload is accepted',
  verifySvixSignature({ secret: SECRET, headers: headersFor(), rawBody: body }).valid,
  true
);

check(
  'a tampered body is rejected',
  verifySvixSignature({ secret: SECRET, headers: headersFor(), rawBody: body + ' ' }).valid,
  false
);

check(
  'a signature from a different secret is rejected',
  verifySvixSignature({
    secret: SECRET,
    headers: headersFor({
      'svix-signature': `v1,${sign({ id, timestamp: now, secret: `whsec_${Buffer.from('other').toString('base64')}` })}`,
    }),
    rawBody: body,
  }).valid,
  false
);

check(
  'an old delivery is rejected as a replay',
  verifySvixSignature({
    secret: SECRET,
    headers: headersFor({
      'svix-timestamp': String(now - 3600),
      'svix-signature': `v1,${sign({ id, timestamp: now - 3600 })}`,
    }),
    rawBody: body,
  }).reason,
  'timestamp_out_of_tolerance'
);

check(
  'a missing signature header is rejected',
  verifySvixSignature({ secret: SECRET, headers: { 'svix-id': id, 'svix-timestamp': String(now) }, rawBody: body })
    .reason,
  'missing_headers'
);

check(
  'a missing raw body is rejected',
  verifySvixSignature({ secret: SECRET, headers: headersFor(), rawBody: null }).reason,
  'missing_body'
);

check(
  'no configured secret is rejected',
  verifySvixSignature({ secret: '', headers: headersFor(), rawBody: body }).reason,
  'missing_secret'
);

check(
  'the correct signature is found among several',
  verifySvixSignature({
    secret: SECRET,
    headers: headersFor({ 'svix-signature': `v1,ZmFrZQ== v1,${good}` }),
    rawBody: body,
  }).valid,
  true
);

check(
  'an unknown signature version alone is rejected',
  verifySvixSignature({ secret: SECRET, headers: headersFor({ 'svix-signature': `v2,${good}` }), rawBody: body })
    .reason,
  'no_v1_signature'
);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
