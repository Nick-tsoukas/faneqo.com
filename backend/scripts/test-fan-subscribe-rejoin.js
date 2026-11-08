/**
 * Explicit Join Fan List must restore unsubscribed/removed rows, not invent a second Fan.
 * Run: node scripts/test-fan-subscribe-rejoin.js
 */
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(
  path.join(__dirname, '../src/api/fan/services/fan.js'),
  'utf8'
);

assert.match(
  src,
  /existing\.status === 'removed' \|\| existing\.status === 'unsubscribed'/
);
assert.match(src, /status: 'subscribed'/);
assert.match(src, /return \{ success: true, fan: restored, fanId: restored\.id, restored: true \}/);

console.log('test-fan-subscribe-rejoin: ok');
