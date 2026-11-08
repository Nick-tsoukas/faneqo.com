'use strict';

const assert = require('assert');
const {
  FEATURE_KEYS,
  assertFeatureKey,
  isFeatureKey,
} = require('../src/utils/features/featureKeys');
const { resolveFeature, resolveFeatureMap, isActiveRow } = require('../src/utils/features/resolveFeatures');

const now = new Date('2026-08-19T12:00:00.000Z');

function row(partial) {
  return {
    status: 'enabled',
    startsAt: null,
    endsAt: null,
    ...partial,
  };
}

const user = { userId: '7', bandId: null, cohortKeys: [] };
const bandCtx = { userId: '7', bandId: '42', cohortKeys: [] };

assert.strictEqual(FEATURE_KEYS.length, 7);
assert.strictEqual(isFeatureKey('moments'), true);
assert.strictEqual(isFeatureKey('not_a_feature'), false);
assert.throws(() => assertFeatureKey('nope'), /Unknown feature key/);

assert.strictEqual(resolveFeature('internal_labs', user, []), false, 'default deny');
assert.strictEqual(resolveFeature('moments', bandCtx, []), false, 'default deny band');

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [row({ featureKey: 'internal_labs', subjectType: 'user', subjectId: '7' })]
  ),
  true,
  'explicit user enable'
);

assert.strictEqual(
  resolveFeature(
    'moments',
    bandCtx,
    [row({ featureKey: 'moments', subjectType: 'band', subjectId: '42' })]
  ),
  true,
  'explicit band enable'
);

assert.strictEqual(
  resolveFeature(
    'moments',
    { userId: '7', bandId: '99', cohortKeys: [] },
    [row({ featureKey: 'moments', subjectType: 'band', subjectId: '42' })]
  ),
  false,
  'band-specific separation'
);

assert.strictEqual(
  resolveFeature(
    'moments',
    { userId: '7', bandId: null, cohortKeys: [] },
    [row({ featureKey: 'moments', subjectType: 'user', subjectId: '7' })]
  ),
  false,
  'missing band denies band-scoped even if user enabled'
);

assert.strictEqual(
  resolveFeature(
    'moments',
    bandCtx,
    [
      row({ featureKey: 'moments', subjectType: 'band', subjectId: '42' }),
      row({ featureKey: 'moments', subjectType: 'user', subjectId: '7', status: 'disabled' }),
    ]
  ),
  false,
  'explicit user disable overrides band enable'
);

assert.strictEqual(
  resolveFeature(
    'moments',
    bandCtx,
    [
      row({ featureKey: 'moments', subjectType: 'user', subjectId: '7' }),
      row({ featureKey: 'moments', subjectType: 'band', subjectId: '42', status: 'disabled' }),
    ]
  ),
  false,
  'explicit band disable overrides user enable'
);

assert.strictEqual(
  isActiveRow(row({ startsAt: '2026-08-20T00:00:00.000Z' }), now),
  false
);
assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [row({ featureKey: 'internal_labs', subjectType: 'user', subjectId: '7', startsAt: '2026-08-20T00:00:00.000Z' })],
    now
  ),
  false,
  'future startsAt'
);

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [row({ featureKey: 'internal_labs', subjectType: 'user', subjectId: '7', endsAt: '2026-08-19T00:00:00.000Z' })],
    now
  ),
  false,
  'expired endsAt'
);

assert.strictEqual(
  resolveFeature('not_a_feature', user, [row({ featureKey: 'not_a_feature', subjectType: 'platform', subjectId: '*' })]),
  false,
  'unknown key deny'
);

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [row({ featureKey: 'internal_labs', subjectType: 'cohort', subjectId: 'beta' })],
  ),
  false,
  'cohort without matching key'
);

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    { userId: '7', bandId: null, cohortKeys: ['beta'] },
    [row({ featureKey: 'internal_labs', subjectType: 'cohort', subjectId: 'beta' })]
  ),
  true,
  'cohort enable'
);

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [row({ featureKey: 'internal_labs', subjectType: 'platform', subjectId: '*' })]
  ),
  true,
  'platform enable'
);

assert.strictEqual(
  resolveFeature(
    'internal_labs',
    user,
    [
      row({ featureKey: 'internal_labs', subjectType: 'platform', subjectId: '*' }),
      row({ featureKey: 'internal_labs', subjectType: 'user', subjectId: '7', status: 'disabled' }),
    ]
  ),
  false,
  'user disable overrides platform'
);

const map = resolveFeatureMap(user, [
  row({ featureKey: 'internal_labs', subjectType: 'user', subjectId: '7' }),
]);
assert.strictEqual(map.internal_labs, true);
assert.strictEqual(map.moments, false);
assert.strictEqual(map.share_studio, false);
assert.ok(!('metadata' in map));

console.log('test-feature-resolution: ok');
