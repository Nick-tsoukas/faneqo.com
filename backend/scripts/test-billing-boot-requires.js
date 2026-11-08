'use strict';

const assert = require('assert');
const path = require('path');

const files = [
  '../src/utils/billing/subscriptionStatus.js',
  '../src/utils/billing/billingTruth.js',
  '../src/utils/billing/stripeSignupCleanup.js',
  '../src/utils/billing/artistSignupBilling.js',
  '../src/utils/billing/provisionStripeTrial.js',
  '../src/utils/billing/artistEntitlement.js',
  '../src/policies/subscription-active.js',
];

for (const rel of files) {
  const abs = path.join(__dirname, rel);
  require.resolve(abs);
  require(abs);
}

const stripeCtrl = require('fs').readFileSync(
  path.join(__dirname, '../src/api/stripe/controllers/stripe.js'),
  'utf8'
);
assert.match(stripeCtrl, /utils\/billing\/billingTruth/);
assert.match(stripeCtrl, /utils\/billing\/subscriptionStatus/);

console.log('test-billing-boot-requires: ok');
