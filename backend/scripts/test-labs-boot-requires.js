'use strict';

/**
 * Boot-critical Labs requires. A wrong relative path crashes Strapi start.
 * Run: node scripts/test-labs-boot-requires.js
 */

const assert = require('assert');
const path = require('path');

const labsAuthPath = path.join(__dirname, '../src/api/labs/utils/labsAuth.js');
const resolved = require.resolve(labsAuthPath);
assert.ok(resolved);

require(labsAuthPath);

require(path.join(__dirname, '../src/utils/inbox/inboxPure'));
require(path.join(__dirname, '../src/utils/artistUpdates/protectedMediaPure'));
require(path.join(__dirname, '../src/utils/artistUpdates/artistUpdatePure'));
require(path.join(__dirname, '../src/utils/artistUpdates/protectedMedia'));
require(path.join(__dirname, '../src/utils/artistUpdates/artistUpdateService'));
require(path.join(__dirname, '../src/utils/galleries/galleryDraftPure'));
require(path.join(__dirname, '../src/utils/galleries/galleryDraftService'));
require(path.join(__dirname, '../src/utils/db/patchPgSchemaSync'));
require(path.join(__dirname, '../src/utils/moments/momentKeys'));
require(path.join(__dirname, '../src/utils/moments/momentPure'));
require(path.join(__dirname, '../src/utils/moments/momentIndexes'));
require(path.join(__dirname, '../src/utils/milestones/milestoneKeys'));
require(path.join(__dirname, '../src/utils/milestones/milestonePure'));
require(path.join(__dirname, '../src/utils/milestones/milestoneIndexes'));
require(path.join(__dirname, '../src/api/artist-fan-relationship/controllers/artist-fan-relationship'));
require(path.join(__dirname, '../src/api/artist-fan-relationship/routes/artist-fan-relationship'));
require(path.join(__dirname, '../src/utils/fanProfile/fanProfilePure'));
require(path.join(__dirname, '../src/utils/fanProfile/fanProfileAvatarPure'));
require(path.join(__dirname, '../src/utils/fanProfile/fanProfileAvatar'));
require(path.join(__dirname, '../src/utils/fanProfile/fanProfileService'));
require(path.join(__dirname, '../src/utils/fanProfile/fanProfileIndexes'));
require(path.join(__dirname, '../src/api/fan-account/routes/01-fan-account'));
require(path.join(__dirname, '../src/utils/fans/fanFollow'));
require(path.join(__dirname, '../src/utils/fans/fanFollowWrite'));
require(path.join(__dirname, '../src/utils/fanReturnTo'));
require(path.join(__dirname, '../src/utils/passport/passportPure'));
require(path.join(__dirname, '../src/utils/showMode/showCoverPure'));
require(path.join(__dirname, '../src/utils/showMode/eventActivationPure'));
require(path.join(__dirname, '../src/utils/showMode/showModeIntegrityPure'));
require(path.join(__dirname, '../src/utils/showMode/recapWritePure'));
require(path.join(__dirname, '../src/utils/showMode/nightEnrichmentPure'));
require(path.join(__dirname, '../src/utils/showMode/nightCover'));
require(path.join(__dirname, '../src/utils/showTime'));
require(path.join(__dirname, '../src/utils/band/publicBandPure'));
require(path.join(__dirname, '../src/utils/showMode/publicNightSharePure'));
require(path.join(__dirname, '../src/utils/showMode/publicShareService'));
require(path.join(__dirname, '../src/utils/bands/resolveAuthorizedWorkspaceBand'));
require(path.join(__dirname, '../src/api/band/routes/show-mode'));
require(path.join(__dirname, '../src/api/band/controllers/show-mode'));
require(path.join(__dirname, '../src/api/band/services/showMode'));
require(path.join(__dirname, '../src/api/analytics/services/imageProxyGuard'));

// GET /image-proxy must resolve to the hardened analytics handler only. The
// legacy src/api/image-proxy API registered a duplicate public route bound to
// an unvalidated fetch; it now declares no routes.
const legacyImageProxyRoutes = require(path.join(__dirname, '../src/api/image-proxy/routes/image-proxy')).routes;
assert.deepStrictEqual(legacyImageProxyRoutes, [], 'src/api/image-proxy must not register HTTP routes');
const analyticsImageProxyRoutes = require(path.join(__dirname, '../src/api/analytics/routes/analytics')).routes
  .filter((route) => route.path === '/image-proxy');
assert.strictEqual(analyticsImageProxyRoutes.length, 1, 'expected exactly one /image-proxy route');
assert.strictEqual(analyticsImageProxyRoutes[0].handler, 'analytics.imageProxy');

const artistUpdateRoutes = require(path.join(__dirname, '../src/api/artist-update/routes/01-artist-update')).routes;
const artistUpdateControllerSrc = require('fs').readFileSync(
  path.join(__dirname, '../src/api/artist-update/controllers/artist-update.js'),
  'utf8'
);
assert.ok(artistUpdateRoutes.some((r) => r.method === 'PATCH' && r.path === '/artist-updates/:id/visibility'));
assert.match(artistUpdateControllerSrc, /async updateVisibility\(ctx\)/);
for (const route of artistUpdateRoutes) {
  const method = String(route.handler).split('.')[1];
  assert.match(artistUpdateControllerSrc, new RegExp(`async ${method}\\(ctx\\)`), `missing artist-update handler ${method}`);
}
assert.ok(artistUpdateRoutes.some((r) => r.method === 'GET' && r.path === '/artist-updates/:id/manage'));
assert.ok(artistUpdateRoutes.some((r) => r.method === 'PATCH' && r.path === '/artist-updates/:id/manage'));

// Gallery drafts: schema, routes, and controller must agree or Strapi boots
// with dead endpoints the frontend already calls.
const galleryDraftSchema = require(path.join(__dirname, '../src/api/gallery-draft/content-types/gallery-draft/schema.json'));
assert.strictEqual(galleryDraftSchema.info.singularName, 'gallery-draft');
assert.strictEqual(galleryDraftSchema.attributes.sessionId.unique, true);
for (const field of ['band', 'createdByUser', 'kind', 'mode', 'visibility', 'mediaOrder', 'mediaCaptions', 'coverMediaId', 'status', 'lastActivityAt']) {
  assert.ok(galleryDraftSchema.attributes[field], `gallery-draft schema missing ${field}`);
}
const artistUpdateSchema = require(path.join(__dirname, '../src/api/artist-update/content-types/artist-update/schema.json'));
for (const field of ['coverMediaId', 'mediaCaptions', 'galleryVersion']) {
  assert.ok(artistUpdateSchema.attributes[field], `artist-update schema missing ${field}`);
}

require(path.join(__dirname, '../src/api/gallery-draft/services/gallery-draft'));
const galleryDraftRoutes = require(path.join(__dirname, '../src/api/gallery-draft/routes/01-gallery-draft')).routes;
const galleryDraftControllerSrc = require('fs').readFileSync(
  path.join(__dirname, '../src/api/gallery-draft/controllers/gallery-draft.js'),
  'utf8'
);
for (const route of galleryDraftRoutes) {
  const method = String(route.handler).split('.')[1];
  assert.match(galleryDraftControllerSrc, new RegExp(`async ${method}\\(ctx\\)`), `missing gallery-draft handler ${method}`);
}
assert.ok(galleryDraftRoutes.some((r) => r.method === 'POST' && r.path === '/gallery-drafts'));
assert.ok(galleryDraftRoutes.some((r) => r.method === 'GET' && r.path === '/gallery-drafts/active'));
assert.ok(galleryDraftRoutes.some((r) => r.method === 'PUT' && r.path === '/gallery-drafts/:sessionId/audience'));
assert.ok(galleryDraftRoutes.some((r) => r.method === 'POST' && r.path === '/gallery-drafts/:sessionId/publish'));

// The daily cron must still be the single cleanup schedule.
const cronTasks = require(path.join(__dirname, '../config/cron-tasks'));
assert.strictEqual(typeof cronTasks['20 4 * * *'], 'function', 'protected media cleanup cron must stay wired');

const publicNightRoutes = require(path.join(__dirname, '../src/api/show-recap/routes/01-public-night')).routes;
const publicGalleryRoutes = require(path.join(__dirname, '../src/api/artist-update/routes/02-public-gallery')).routes;
const showRecapControllerSrc = require('fs').readFileSync(
  path.join(__dirname, '../src/api/show-recap/controllers/show-recap.js'),
  'utf8'
);
assert.ok(publicNightRoutes.some((r) => r.method === 'GET' && r.path === '/public/bands/:bandSlug/nights/:nightSlug'));
assert.ok(publicGalleryRoutes.some((r) => r.method === 'GET' && r.path === '/public/bands/:bandSlug/galleries/:gallerySlug'));
assert.ok(!publicNightRoutes.some((r) => r.path === '/public/bands/:bandSlug/nights'));
assert.match(showRecapControllerSrc, /async publicNight\(ctx\)/);
assert.match(artistUpdateControllerSrc, /async publicGallery\(ctx\)/);
assert.doesNotMatch(showRecapControllerSrc, /prepare-share/);

const passportRoutes = require(path.join(__dirname, '../src/api/passport-gallery-save/routes/01-passport-gallery-save')).routes;
const passportController = require('fs').readFileSync(
  path.join(__dirname, '../src/api/passport-gallery-save/controllers/passport-gallery-save.js'),
  'utf8'
);
for (const route of passportRoutes) {
  const method = String(route.handler).split('.')[1];
  assert.match(passportController, new RegExp(`async ${method}\\(ctx\\)`), `missing passport handler ${method}`);
}
assert.ok(passportRoutes.some((r) => r.method === 'GET' && r.path === '/fan-passport/memories'));
assert.ok(passportRoutes.some((r) => r.method === 'GET' && r.path === '/fan-passport/memories/:id'));

const bootSrc = require('fs').readFileSync(path.join(__dirname, '../src/index.js'), 'utf8');
assert.match(bootSrc, /utils\/fanProfile\/fanProfileIndexes/);
assert.match(bootSrc, /ensureFanProfileIndexes/);

// The fan-account controller requires the fan profile service at boot; a wrong
// relative path there crashes Strapi start.
const fanAccountController = require('fs').readFileSync(
  path.join(__dirname, '../src/api/fan-account/controllers/fan-account.js'),
  'utf8'
);
assert.match(
  fanAccountController,
  /require\('\.\.\/\.\.\/\.\.\/utils\/fanProfile\/fanProfileService'\)/
);
require.resolve(path.join(__dirname, '../src/utils/fanProfile/fanProfileService.js'));

// Every route handler must exist on the controller module.
const fanAccountRoutes = require(path.join(__dirname, '../src/api/fan-account/routes/01-fan-account')).routes;
for (const route of fanAccountRoutes) {
  const method = String(route.handler).split('.')[1];
  assert.match(fanAccountController, new RegExp(`async ${method}\\(ctx\\)`), `missing handler ${method}`);
}
assert.ok(fanAccountRoutes.some((r) => r.method === 'GET' && r.path === '/fan-account/profile'));
assert.ok(fanAccountRoutes.some((r) => r.method === 'PATCH' && r.path === '/fan-account/profile'));
assert.ok(fanAccountRoutes.some((r) => r.method === 'POST' && r.path === '/fan-account/profile'));
assert.ok(fanAccountRoutes.some((r) => r.method === 'POST' && r.path === '/fan-account/avatar'));
assert.ok(fanAccountRoutes.some((r) => r.method === 'DELETE' && r.path === '/fan-account/avatar'));

const src = require('fs').readFileSync(labsAuthPath, 'utf8');
assert.match(src, /require\('\.\.\/\.\.\/\.\.\/utils\/features\/featureService'\)/);
assert.match(src, /require\('\.\.\/\.\.\/\.\.\/utils\/bandRoles'\)/);
assert.doesNotMatch(src, /require\('\.\.\/\.\.\/utils\/features\/featureService'\)/);

const { labsNotFound, requireLabsUser } = require(labsAuthPath);
const ctx = {
  status: 200,
  body: null,
  state: {},
  request: { headers: {} },
};
labsNotFound(ctx);
assert.strictEqual(ctx.status, 404);
assert.strictEqual(ctx.body.error.status, 404);

requireLabsUser(ctx).then((gated) => {
  assert.ok(gated.error);
  assert.strictEqual(ctx.status, 404);
  console.log('test-labs-boot-requires: ok');
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
