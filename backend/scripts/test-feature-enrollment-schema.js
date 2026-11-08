'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const schema = JSON.parse(read('src/api/feature-enrollment/content-types/feature-enrollment/schema.json'));
assert.strictEqual(schema.collectionName, 'feature_enrollments');
assert.strictEqual(schema.options.draftAndPublish, false);
assert.ok(schema.attributes.featureKey);
assert.strictEqual(schema.attributes.featureKey.unique, undefined);
assert.deepStrictEqual(schema.attributes.subjectType.enum, ['user', 'band', 'cohort', 'platform']);
assert.deepStrictEqual(schema.attributes.status.enum, ['enabled', 'disabled']);

assert.ok(schema.indexes);
assert.strictEqual(schema.indexes[0].name, 'feature_enrollments_feature_subject_unique');
assert.deepStrictEqual(schema.indexes[0].columns, ['feature_key', 'subject_type', 'subject_id']);

const routes = read('src/api/feature-enrollment/routes/feature-enrollment.js');
assert.match(routes, /routes: \[\]/);

const indexSrc = read('src/utils/features/featureEnrollmentIndexes.js');
assert.match(indexSrc, /CREATE UNIQUE INDEX IF NOT EXISTS \$\{INDEX_NAME\}/);
assert.match(indexSrc, /feature_enrollments_feature_subject_unique/);
assert.match(indexSrc, /feature_key, subject_type, subject_id/);

const migration = read('database/migrations/2026.08.19T00.00.00.feature-enrollments-unique.js');
assert.match(migration, /UNIQUE_SQL/);

const seed = read('src/utils/features/seedFounderLabs.js');
assert.match(seed, /FANEQO_LABS_FOUNDER_USER_ID/);
assert.match(seed, /FANEQO_LABS_FOUNDER_EMAIL/);
assert.match(seed, /bootstrap:env/);
assert.match(seed, /\$eqi/);

const service = read('src/utils/features/featureService.js');
assert.match(service, /ENROLLMENT_QUERY_LIMIT/);
assert.match(service, /enrollment_query_truncated/);

const controller = read('src/api/labs/controllers/labs.js');
assert.match(controller, /labsNotFound/);
assert.doesNotMatch(controller, /FANEQO_LABS_FOUNDER/);
const labsAuth = read('src/api/labs/utils/labsAuth.js');
assert.match(labsAuth, /status: 404/);
assert.match(labsAuth, /assertFeature\('internal_labs'/);

console.log('test-feature-enrollment-schema: ok');
