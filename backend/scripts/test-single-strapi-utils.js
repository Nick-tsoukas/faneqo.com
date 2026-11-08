'use strict';

/**
 * One @strapi/utils for the whole app.
 *
 * Strapi's error middleware turns its own ForbiddenError / UnauthorizedError
 * into 403 / 401 with an `instanceof` check. When a plugin pulls in a second
 * @strapi/utils (in 2026-11, @strapi/plugin-documentation ^4.25 hoisted 4.25.22
 * over the 4.24.4 the rest of Strapi uses), each package gets its own copy, the
 * check fails, and every refused anonymous request became a 500.
 *
 * Run: node scripts/test-single-strapi-utils.js
 */

const assert = require('assert');
const path = require('path');

const root = path.join(__dirname, '..');
const lock = require(path.join(root, 'package-lock.json'));
const pkg = require(path.join(root, 'package.json'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  PASS  ${name}`);
}

const strapiVersion = pkg.dependencies['@strapi/strapi'];

test('@strapi/strapi is pinned to an exact version', () => {
  assert.match(strapiVersion, /^\d+\.\d+\.\d+$/);
});

test('package-lock has exactly one @strapi/utils, at the Strapi version', () => {
  const copies = Object.entries(lock.packages || {})
    .filter(([key]) => key.endsWith('node_modules/@strapi/utils'))
    .map(([key, v]) => `${key}@${v.version}`);
  assert.deepStrictEqual(copies, [`node_modules/@strapi/utils@${strapiVersion}`]);
});

test('core Strapi plugins are pinned to the Strapi version', () => {
  for (const [name, range] of Object.entries(pkg.dependencies)) {
    if (!/^@strapi\/plugin-/.test(name)) continue;
    assert.strictEqual(range, strapiVersion, `${name} is ${range}, expected ${strapiVersion}`);
  }
});

console.log(`\n${passed} passed`);
