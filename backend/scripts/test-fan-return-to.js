/**
 * F.2 — magic-link returnTo sanitization + storage contract.
 * Run: node scripts/test-fan-return-to.js
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const {
  FAN_VERIFY_FALLBACK,
  sanitizeFanReturnTo,
  resolveMagicLinkRedirect,
} = require(path.join(root, 'src/utils/fanReturnTo'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✅ ${name}`);
}

test('sanitizeFanReturnTo allows safe internal destinations', () => {
  assert.strictEqual(sanitizeFanReturnTo('/fan'), '/fan');
  assert.strictEqual(sanitizeFanReturnTo('/fan/passport'), '/fan/passport');
  assert.strictEqual(sanitizeFanReturnTo('/fan/messages/123'), '/fan/messages/123');
  assert.strictEqual(
    sanitizeFanReturnTo('/artist-slug/updates/gallery-slug'),
    '/artist-slug/updates/gallery-slug'
  );
  assert.strictEqual(
    sanitizeFanReturnTo('/the-rockers?feq_intent=follow'),
    '/the-rockers?feq_intent=follow'
  );
});

test('sanitizeFanReturnTo rejects external and malformed destinations', () => {
  const rejected = [
    'https://evil.com',
    '//evil.com',
    '\\evil',
    'javascript:alert(1)',
    '/fan/../../../etc',
    '/fan/%2e%2e/dashboard',
    '/fan/\r\nLocation: https://evil.com',
  ];
  for (const value of rejected) {
    assert.strictEqual(sanitizeFanReturnTo(value), '/fan', value);
  }
});

test('missing or invalid returnTo falls back to /fan?welcome=1 on verify', () => {
  assert.strictEqual(resolveMagicLinkRedirect(null), FAN_VERIFY_FALLBACK);
  assert.strictEqual(resolveMagicLinkRedirect(''), FAN_VERIFY_FALLBACK);
  assert.strictEqual(resolveMagicLinkRedirect('https://evil.com'), FAN_VERIFY_FALLBACK);
  assert.strictEqual(resolveMagicLinkRedirect('/fan/passport'), '/fan/passport');
  assert.strictEqual(resolveMagicLinkRedirect('/fan/passport/nights/18'), '/fan/passport');
  assert.strictEqual(
    resolveMagicLinkRedirect('/the-rockers/night/the-rad-spot'),
    '/the-rockers/night/the-rad-spot'
  );
});

test('request-link sanitizes returnTo before create; verify returns stored path', () => {
  const fanAccount = read('src/utils/fanAccount.js');
  const controller = read('src/api/fan-account/controllers/fan-account.js');
  const schema = read(
    'src/api/fan-account-link/content-types/fan-account-link/schema.json'
  );

  assert.match(schema, /"returnTo"/);
  assert.match(schema, /"private": true/);
  assert.match(controller, /returnTo: body\.returnTo/);
  assert.match(fanAccount, /sanitizeFanReturnTo\(returnTo, \{ fallback: null \}\)/);
  assert.match(fanAccount, /fields: \[.*'returnTo'/);
  assert.match(fanAccount, /resolveMagicLinkRedirect\(link\.returnTo\)/);
  assert.doesNotMatch(fanAccount, /redirectTo: '\/fan\?welcome=1'/);
});

test('fanReturnTo is require-safe', () => {
  const resolved = require.resolve(path.join(root, 'src/utils/fanReturnTo.js'));
  assert.ok(resolved);
});

console.log(`\n=== fan returnTo: ${passed} passed ===`);
