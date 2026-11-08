'use strict';

/**
 * Dashboard glance aggregate: window math, trend honesty, count-only queries.
 * Run: node scripts/test-dashboard-glance.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

const servicePath = path.join(__dirname, '../src/api/analytics/services/dashboardGlance');
const {
  DEFAULT_DAYS,
  MAX_DAYS,
  resolveWindows,
  percentChange,
  buildMetric,
  pageViewFilters,
  scanFilters,
  newFanFilters,
  fetchDashboardGlance,
} = require(servicePath);

// Boot path: new controller requires must resolve or Strapi will not start.
require(path.join(__dirname, '../src/api/analytics/routes/analytics'));
require(path.join(__dirname, '../src/api/analytics/controllers/analytics'));
require(path.join(__dirname, '../src/utils/bandRoles'));
require(path.join(__dirname, '../src/index'));

// The route must be authenticated: it exposes fan counts.
const routesSrc = fs.readFileSync(
  path.join(__dirname, '../src/api/analytics/routes/analytics.js'),
  'utf8'
);
const glanceRoute = routesSrc.slice(routesSrc.indexOf('/analytics/dashboard-glance'));
const authenticatedConst = (routesSrc.match(/const AUTHENTICATED = \{[^}]*\}/) || [''])[0];
const usesSharedAuth = /config: AUTHENTICATED\b/.test(glanceRoute.slice(0, 220));
assert.ok(
  /plugin::users-permissions\.isAuthenticated/.test(glanceRoute.slice(0, 220)) ||
    (usesSharedAuth && /plugin::users-permissions\.isAuthenticated/.test(authenticatedConst)),
  'dashboard-glance must require an authenticated user'
);
assert.doesNotMatch(glanceRoute.slice(0, 220), /auth: false/);

// Permission sync so the route works without a manual admin toggle.
const indexSrc = fs.readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
assert.match(indexSrc, /api::analytics\.analytics\.dashboardGlance/);
assert.match(indexSrc, /ensureDashboardGlancePermissions\(strapi\)/);

// Authorization must fail closed for callers without band analytics access.
const controllerSrc = fs.readFileSync(
  path.join(__dirname, '../src/api/analytics/controllers/analytics.js'),
  'utf8'
);
const glanceHandler = controllerSrc.slice(
  controllerSrc.indexOf('async dashboardGlance'),
  controllerSrc.indexOf('async rollups')
);
assert.match(glanceHandler, /ctx\.unauthorized/);
assert.match(glanceHandler, /requireBandPermission\(strapi, user\.id, bandId, "viewAnalytics"\)/);
assert.match(glanceHandler, /ctx\.forbidden/);

// ---------------------------------------------------------------- windows

const now = DateTime.fromISO('2026-09-03T18:30:00Z', { zone: 'utc' });

const w = resolveWindows(7, now);
assert.strictEqual(w.days, 7);
assert.strictEqual(w.current.from, DateTime.fromISO('2026-08-28T00:00:00Z', { zone: 'utc' }).toISO());
assert.strictEqual(w.current.to, DateTime.fromISO('2026-09-03T23:59:59.999Z', { zone: 'utc' }).toISO());
assert.strictEqual(w.previous.from, DateTime.fromISO('2026-08-21T00:00:00Z', { zone: 'utc' }).toISO());
assert.strictEqual(w.previous.to, DateTime.fromISO('2026-08-27T23:59:59.999Z', { zone: 'utc' }).toISO());

// The two windows abut exactly: no overlap, no gap.
assert.ok(DateTime.fromISO(w.previous.to) < DateTime.fromISO(w.current.from));
assert.strictEqual(
  Math.round(DateTime.fromISO(w.current.from).diff(DateTime.fromISO(w.previous.to)).as('milliseconds')),
  1
);

assert.strictEqual(resolveWindows(undefined, now).days, DEFAULT_DAYS);
assert.strictEqual(resolveWindows('nonsense', now).days, DEFAULT_DAYS);
assert.strictEqual(resolveWindows(0, now).days, 1);
assert.strictEqual(resolveWindows(-5, now).days, 1);
assert.strictEqual(resolveWindows(9999, now).days, MAX_DAYS);
assert.strictEqual(resolveWindows('30', now).days, 30);

// ------------------------------------------------------------- percentages

assert.strictEqual(percentChange(554, 469), 18);
assert.strictEqual(percentChange(87, 66), 32);
assert.strictEqual(percentChange(50, 100), -50);
assert.strictEqual(percentChange(0, 10), -100);
assert.strictEqual(percentChange(10, 10), 0);

// No honest baseline -> no trend. Never Infinity, never NaN, never fake +100%.
assert.strictEqual(percentChange(10, 0), null);
assert.strictEqual(percentChange(0, 0), null);
assert.strictEqual(percentChange(5, null), null);
assert.strictEqual(percentChange(5, undefined), null);
assert.strictEqual(percentChange(NaN, 5), null);
assert.strictEqual(percentChange(5, -3), null);

for (const [a, b] of [[10, 0], [0, 0], [1, 0], [0, 5], [7, 7]]) {
  const pct = percentChange(a, b);
  assert.ok(pct === null || Number.isFinite(pct), `percentChange(${a},${b}) must be null or finite`);
}

// ----------------------------------------------------------------- metrics

assert.deepStrictEqual(buildMetric(554, 469), { current: 554, previous: 469, changePct: 18 });
assert.deepStrictEqual(buildMetric(0, 0), { current: 0, previous: 0, changePct: null });
assert.deepStrictEqual(buildMetric(undefined, undefined), { current: 0, previous: 0, changePct: null });

// ----------------------------------------------------------------- filters

const win = { from: 'A', to: 'B' };

assert.deepStrictEqual(pageViewFilters(12, win), {
  band: { id: 12 },
  timestamp: { $gte: 'A', $lte: 'B' },
});

// Scans reach a band directly or via their QR; both legs must be counted once.
const scanF = scanFilters(12, win);
assert.deepStrictEqual(scanF.date, { $gte: 'A', $lte: 'B' });
assert.deepStrictEqual(scanF.$or, [{ band: { id: 12 } }, { qr: { band: { id: 12 } } }]);

// New fans must match fan.getMyFansAnalytics().newFans7d exactly.
assert.deepStrictEqual(newFanFilters(12, win), {
  band: { id: 12 },
  status: 'subscribed',
  subscribedAt: { $gte: 'A', $lte: 'B' },
});

const fanService = fs.readFileSync(path.join(__dirname, '../src/api/fan/services/fan.js'), 'utf8');
assert.match(fanService, /subscribedAt: \{ \$gte/);
assert.match(fanService, /status: 'subscribed'/);

// ------------------------------------------------------------ fetch shape

const calls = [];
const fakeStrapi = {
  entityService: {
    async count(uid, opts) {
      calls.push({ uid, filters: opts.filters });
      const map = {
        'api::band-page-view.band-page-view': [554, 469],
        'api::scan.scan': [87, 66],
        'api::fan.fan': [14, 13],
      };
      const seen = calls.filter((c) => c.uid === uid).length;
      return map[uid][seen - 1];
    },
    findMany() {
      throw new Error('dashboard glance must not hydrate rows');
    },
  },
};

fetchDashboardGlance({ strapi: fakeStrapi, bandId: '12', days: 7, now }).then((result) => {
  // Exactly six counts, no row hydration.
  assert.strictEqual(calls.length, 6);
  assert.strictEqual(calls.filter((c) => c.uid === 'api::band-page-view.band-page-view').length, 2);
  assert.strictEqual(calls.filter((c) => c.uid === 'api::scan.scan').length, 2);
  assert.strictEqual(calls.filter((c) => c.uid === 'api::fan.fan').length, 2);

  // bandId arrives as a query string but must be filtered as a number.
  assert.strictEqual(calls[0].filters.band.id, 12);

  assert.strictEqual(result.days, 7);
  assert.deepStrictEqual(result.metrics.views, { current: 554, previous: 469, changePct: 18 });
  assert.deepStrictEqual(result.metrics.qrScans, { current: 87, previous: 66, changePct: 32 });
  assert.deepStrictEqual(result.metrics.newFans, { current: 14, previous: 13, changePct: 8 });

  console.log('test-dashboard-glance: ok');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
