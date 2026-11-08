'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

const fanSchema = JSON.parse(read('src/api/fan/content-types/fan/schema.json'));
assert.strictEqual(fanSchema.collectionName, 'fans');
assert.ok(fanSchema.attributes.email);
assert.strictEqual(fanSchema.attributes.email.unique, undefined);

assert.ok(fanSchema.attributes.canonicalIdentityKey);
assert.strictEqual(fanSchema.attributes.canonicalIdentityKey.private, true);
assert.strictEqual(fanSchema.attributes.canonicalIdentityKey.unique, true);
assert.strictEqual(fanSchema.attributes.canonicalIdentityKey.column.unique, true);
assert.strictEqual(fanSchema.attributes.canonicalIdentityKey.maxLength, 64);

const attSchema = JSON.parse(
  read('src/api/fan-show-attendance/content-types/fan-show-attendance/schema.json')
);
assert.strictEqual(attSchema.collectionName, 'fan_show_attendances');
assert.strictEqual(attSchema.attributes.campaignId.type, 'string');
assert.ok(attSchema.attributes.suppressedDuplicate);
assert.strictEqual(attSchema.attributes.suppressedDuplicate.default, false);
assert.strictEqual(attSchema.attributes.campaignIdentityKey.private, true);
assert.strictEqual(attSchema.attributes.campaignIdentityKey.unique, true);
assert.strictEqual(attSchema.attributes.campaignIdentityKey.column.unique, true);
assert.strictEqual(attSchema.attributes.eventIdentityKey.private, true);
assert.strictEqual(attSchema.attributes.eventIdentityKey.unique, true);
assert.strictEqual(attSchema.attributes.eventIdentityKey.column.unique, true);

const fanEmail = read('src/utils/fans/fanEmail.js');
assert.match(fanEmail, /trim\(\)\.toLowerCase\(\)/);
assert.match(fanEmail, /\$eqi/);
assert.match(fanEmail, /createFanIdempotent/);

const indexes = read('src/utils/integrity/fanAttendanceIntegrity.js');
assert.match(indexes, /fans_canonical_identity_key_unique/);
assert.match(indexes, /fan_show_attendances_campaign_identity_key_unique/);
assert.match(indexes, /fans_band_normalized_email_unique/);
assert.match(indexes, /fan_show_attendances_fan_campaign_unique/);
assert.match(indexes, /IS NOT TRUE/);
assert.match(indexes, /fans_band_links/);
assert.match(indexes, /skipped_join_table_layout/);
assert.doesNotMatch(indexes, /Fix All/);

const keys = read('src/utils/integrity/canonicalIdentityKeys.js');
assert.match(keys, /fan:\$\{FAN_KEY_VERSION\}/);
assert.match(keys, /createHash\('sha256'\)/);
assert.doesNotMatch(keys, /require\(['"]pgcrypto['"]\)/);

const checkIn = read('src/api/fan-interaction/services/fan-interaction.js');
assert.match(checkIn, /findFanByBandEmail/);
assert.match(checkIn, /createFanIdempotent/);
assert.match(checkIn, /createAttendanceIdempotent/);
assert.match(checkIn, /shouldIncrementCheckedInShowCount/);
assert.match(checkIn, /unique_conflict/);
assert.doesNotMatch(checkIn, /filters: \{ email: normalizedEmail, band: bandId \}/);

const fanService = read('src/api/fan/services/fan.js');
assert.match(fanService, /createFanIdempotent/);

const inbox = read('src/utils/inbox/directMessaging.js');
assert.match(inbox, /createFanIdempotent/);

const attendance = read('src/api/fan-show-attendance/services/fan-show-attendance.js');
assert.match(attendance, /canonicalAttendanceFilters/);
assert.match(attendance, /campaignId \|\| eventId/);

const boot = read('src/index.js');
assert.match(boot, /ensureFanAttendanceIntegrityIndexes/);

const labsRoutes = read('src/api/labs/routes/01-labs.js');
assert.match(labsRoutes, /\/labs\/integrity/);
assert.match(labsRoutes, /auth: false/);

const labs = read('src/api/labs/controllers/labs.js');
assert.match(labs, /async integrity/);
assert.match(labs, /identityKeyIndex/);
assert.match(labs, /keyCoveragePct/);
assert.doesNotMatch(labs, /Fix All/);
assert.doesNotMatch(labs, /suppressedDuplicate: true/);

const migration = read('database/migrations/2026.08.19T12.00.00.fan-attendance-integrity.js');
assert.match(migration, /ensureFanAttendanceIntegrityIndexes/);
assert.match(migration, /skipped/);

const dbConfig = read('config/database.js');
assert.match(dbConfig, /forceMigration:\s*false/);

const identityMigration = read('database/migrations/2026.08.19T14.00.00.canonical-integrity-keys.js');
assert.match(identityMigration, /ensureFanAttendanceIntegrityIndexes/);
assert.match(identityMigration, /skipped/);

const convertIdentity = read(
  'database/migrations/2026.08.20T21.50.00.convert-canonical-identity-unique-indexes.js'
);
assert.match(convertIdentity, /fans_canonical_identity_key_unique/);
assert.match(convertIdentity, /fan_show_attendances_campaign_identity_key_unique/);
assert.match(convertIdentity, /fan_show_attendances_event_identity_key_unique/);
assert.match(convertIdentity, /convertIndexToConstraintSql/);

const script = read('scripts/audit-fan-attendance-integrity.js');
assert.match(script, /read-only/);
assert.match(script, /--apply is not implemented/);

const backfill = read('scripts/backfill-canonical-integrity-keys.js');
assert.match(backfill, /DRY RUN/);
assert.match(backfill, /--apply/);
assert.match(backfill, /does not merge fans/);

console.log('test-fan-attendance-integrity-schema: ok');
