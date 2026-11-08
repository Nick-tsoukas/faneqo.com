/**
 * Public route surface snapshot.
 *
 * Every custom route with `auth: false` must appear in
 * scripts/public-routes.snapshot.json. Those were reviewed on 2026-11-04: each
 * is either public by design (tracking beacons, health, token receipts, fan
 * signup, checkout, Stripe/Resend webhooks with signature checks) or verifies
 * the caller inside its handler. A new anonymous route fails this test until
 * someone reviews it and adds it here; a removed one fails until the snapshot
 * is trimmed (so the list stays an accurate record).
 *
 * Core routers must not set auth:false unless they expose nothing (only: []).
 *
 * Run: node scripts/test-public-route-snapshot.js
 * Update after review: node scripts/test-public-route-snapshot.js --write
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const snapshotFile = path.join(__dirname, 'public-routes.snapshot.json');

function collect() {
  const api = path.join(root, 'src', 'api');
  const out = [];
  const coreWithAuthFalse = [];
  for (const name of fs.readdirSync(api)) {
    const dir = path.join(api, name, 'routes');
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
      const full = path.join(dir, file);
      const src = fs.readFileSync(full, 'utf8');
      if (/createCoreRouter/.test(src)) {
        // auth:false is inert when the router exposes nothing (only: [])
        if (/auth\s*:\s*false/.test(src) && !/only\s*:\s*\[\s*\]/.test(src)) coreWithAuthFalse.push(`${name}/${file}`);
        continue;
      }
      const mod = require(full);
      for (const r of mod.routes || []) {
        if (r.config && r.config.auth === false) out.push(`${r.method} ${r.path} -> ${r.handler}`);
      }
    }
  }
  return { routes: [...new Set(out)].sort(), coreWithAuthFalse };
}

const { routes, coreWithAuthFalse } = collect();

if (process.argv.includes('--write')) {
  fs.writeFileSync(snapshotFile, `${JSON.stringify(routes, null, 2)}\n`);
  console.log(`wrote ${routes.length} public routes`);
  process.exit(0);
}

const expected = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
const added = routes.filter((r) => !expected.includes(r));
const removed = expected.filter((r) => !routes.includes(r));

let failed = 0;
const check = (name, fn) => {
  try { fn(); console.log(`  PASS  ${name}`); } catch (e) { failed += 1; console.log(`  FAIL  ${name}\n        ${e.message}`); }
};

check('no unreviewed public routes', () => assert.deepStrictEqual(added, [], `new auth:false routes need review:\n          ${added.join('\n          ')}`));
check('snapshot has no stale entries', () => assert.deepStrictEqual(removed, [], `remove from snapshot:\n          ${removed.join('\n          ')}`));
check('core routers only set auth:false when they expose nothing', () => assert.deepStrictEqual(coreWithAuthFalse, []));
check('known-dangerous routes stay unrouted', () => {
  for (const gone of ['/stripe/create-customer', '/stripe/create-checkout-session', '/stripe/confirm-payment', '/stripe/test', '/stripe/confirm-social', '/merch-concierge/create-checkout', '/test-email', '/scans/backfill']) {
    assert.ok(!routes.some((r) => r.split(' ')[1] === gone), `${gone} is routed publicly`);
  }
  assert.ok(!routes.some((r) => /\/youtube\/debug/.test(r)), 'YouTube debug route present');
});

console.log(`\n${routes.length} public routes; ${failed ? `${failed} failed` : 'all checks passed'}`);
if (failed) process.exit(1);
