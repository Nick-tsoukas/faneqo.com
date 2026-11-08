'use strict';

const assert = require('assert');
const { createFeatureService, upsertEnrollment } = require('../src/utils/features/featureService');

function mockStrapi(rowsOrFn) {
  return {
    log: { warn() {} },
    entityService: {
      findMany: async () => (typeof rowsOrFn === 'function' ? rowsOrFn() : rowsOrFn),
    },
  };
}

function row(partial) {
  return {
    status: 'enabled',
    startsAt: null,
    endsAt: null,
    ...partial,
  };
}

async function main() {
  const rows = [
    row({
      featureKey: 'internal_labs',
      subjectType: 'user',
      subjectId: '7',
      metadata: { secret: 'nope' },
      grantedBy: 'admin',
    }),
    row({
      featureKey: 'moments',
      subjectType: 'band',
      subjectId: '42',
    }),
  ];

  const features = createFeatureService(mockStrapi(rows));
  const mine = await features.getMyFeatures({ user: { id: 7 }, band: { id: 42 } });
  const payload = JSON.stringify(mine);
  assert.strictEqual(mine.features.internal_labs, true);
  assert.strictEqual(mine.features.moments, true);
  assert.strictEqual(mine.user.moments, false, 'user map is user-only');
  assert.strictEqual(mine.band.moments, true, 'band map is band-only');
  assert.ok(!payload.includes('secret'));
  assert.ok(!payload.includes('nope'));
  assert.ok(!payload.includes('grantedBy'));
  assert.ok(!payload.includes('admin'));
  assert.ok(!payload.includes('metadata'));

  const otherBand = await features.getMyFeatures({ user: { id: 7 }, band: { id: 99 } });
  assert.strictEqual(otherBand.features.moments, false, 'band-specific separation');

  await assert.rejects(
    () => features.assertFeature('moments', { user: { id: 7 }, band: { id: 99 } }),
    (err) => err.status === 404 && err.code === 'feature_denied'
  );

  await assert.rejects(
    () => features.assertFeature('not_a_feature', { user: { id: 7 } }),
    (err) => err.status === 404
  );

  const throwing = createFeatureService(
    mockStrapi(() => {
      throw new Error('db down');
    })
  );
  assert.strictEqual(await throwing.hasFeature('internal_labs', { user: { id: 7 } }), false);

  const truncated = createFeatureService(
    mockStrapi(Array.from({ length: 500 }, (_, i) =>
      row({
        featureKey: 'internal_labs',
        subjectType: 'user',
        subjectId: String(i + 1),
      })
    ))
  );
  assert.strictEqual(
    await truncated.hasFeature('internal_labs', { user: { id: 1 } }),
    false,
    'truncated enrollment query must deny'
  );

  await assert.rejects(
    () => upsertEnrollment(mockStrapi([]), { featureKey: 'nope', subjectType: 'user', subjectId: '1' }),
    /Unknown feature key/
  );

  console.log('test-feature-service: ok');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
