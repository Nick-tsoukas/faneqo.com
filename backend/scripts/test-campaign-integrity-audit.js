'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { classifyCheck, readiness, relationSql } = require('../src/utils/messaging/campaignIntegrity');

assert.equal(classifyCheck({ n: 0 }), 'CLEAN');
assert.equal(classifyCheck({ n: 2 }), 'DIRTY');
assert.equal(classifyCheck({ skipped: true }), 'UNKNOWN');
assert.equal(readiness({ a: { n: 0 }, b: { n: 0 } }).state, 'CLEAN');
assert.equal(readiness({ a: { n: 0 }, b: { n: 1 } }).state, 'DIRTY');
assert.equal(readiness({ a: { n: 0 }, b: { skipped: true } }).state, 'UNKNOWN');
assert.match(relationSql({ mode: 'inline', target: 'campaign_id' }, 'campaign_id'), /campaign_id IS NOT NULL/);
assert.match(relationSql({ mode: 'links', source: 'message_recipient_id', target: 'fan_id', table: 'links' }, 'fan_id'), /FROM links/);

const script = fs.readFileSync(path.join(__dirname, 'audit-message-campaign-integrity.js'), 'utf8');
assert.match(script, /--apply is forbidden/);
assert.match(script, /pii: 'not_logged'/);
assert.doesNotMatch(script, /SELECT\s+email/i);

console.log('campaign integrity audit tests passed');
