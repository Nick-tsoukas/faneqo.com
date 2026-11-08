'use strict';

const assert = require('assert');
const media = require('../src/utils/artistUpdates/protectedMediaPure');
const mediaRuntime = require('../src/utils/artistUpdates/protectedMedia');
const blockUploadFileEnumeration = require('../src/middlewares/block-upload-file-enumeration');
const updatePure = require('../src/utils/artistUpdates/artistUpdatePure');

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ❌ ${name}`);
    console.log(`     ${err.message}`);
  }
}

(async () => {
  console.log('\n=== Protected media helpers ===\n');

  await test('general galleries accept 60 photos and reject the 61st', () => {
    assert.strictEqual(updatePure.MAX_IMAGES, 60);
    const sixty = Array.from({ length: 60 }, (_, index) => index + 1);
    const allowed = updatePure.validatePublishInput({
      visibility: 'public',
      mediaIds: sixty,
    });
    assert.strictEqual(allowed.error, undefined);
    assert.strictEqual(allowed.mediaIds.length, 60);
    const denied = updatePure.validatePublishInput({
      visibility: 'public',
      mediaIds: [...sixty, 61],
    });
    assert.strictEqual(denied.error, 'too_many_images');
  });

  await test('show galleries accept 60 photos and reject the 61st', () => {
    assert.strictEqual(updatePure.MAX_SHOW_IMAGES, 60);
    const sixty = Array.from({ length: 60 }, (_, index) => index + 1);
    const allowed = updatePure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: sixty,
      eventId: 9,
      protectedReady: true,
    });
    assert.strictEqual(allowed.error, undefined);
    assert.strictEqual(allowed.mediaIds.length, 60);
    const denied = updatePure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [...sixty, 61],
      eventId: 9,
      protectedReady: true,
    });
    assert.strictEqual(denied.error, 'too_many_images');
  });

  await test('delivery stays fail-closed without the env flag', () => {
    const status = media.isProtectedMediaConfigured({
      AWS_BUCKET: 'b',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'k',
      AWS_ACCESS_SECRET: 's',
      JWT_SECRET: 'secret',
    });
    assert.strictEqual(status.ready, false);
    assert.strictEqual(status.reason, 'flag_off');
  });

  await test('delivery is ready only with flag + AWS + signing secret', () => {
    const status = media.isProtectedMediaConfigured({
      FANEQO_PROTECTED_MEDIA_ENABLED: 'true',
      AWS_BUCKET: 'b',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'k',
      AWS_ACCESS_SECRET: 's',
      JWT_SECRET: 'secret',
    });
    assert.strictEqual(status.ready, true);
  });

  await test('content API cannot enumerate upload file metadata', async () => {
    const middleware = blockUploadFileEnumeration();
    let nextCalls = 0;
    const blocked = { method: 'GET', path: '/api/upload/files', request: {} };
    await middleware(blocked, async () => { nextCalls += 1; });
    assert.strictEqual(blocked.status, 404);
    assert.strictEqual(blocked.body.error.name, 'NotFoundError');
    assert.strictEqual(nextCalls, 0);

    const blockedDetail = { method: 'GET', path: '/api/upload/files/444', request: {} };
    await middleware(blockedDetail, async () => { nextCalls += 1; });
    assert.strictEqual(blockedDetail.status, 404);
    assert.strictEqual(nextCalls, 0);

    const upload = { method: 'POST', path: '/api/upload', request: {} };
    await middleware(upload, async () => { nextCalls += 1; });
    assert.strictEqual(nextCalls, 1);
  });

  await test('public access probes run concurrently across bounded candidates', async () => {
    let active = 0;
    let maxActive = 0;
    let calls = 0;
    const result = await mediaRuntime.probePublicAccess(
      'faneqo-protected/test/gallery.webp',
      {
        CDN_URL: 'https://cdn.example',
        AWS_BUCKET: 'bucket',
        AWS_REGION: 'us-east-1',
      },
      {
        timeoutMs: 100,
        fetchImpl: async () => {
          calls += 1;
          active += 1;
          maxActive = Math.max(maxActive, active);
          await new Promise((resolve) => setTimeout(resolve, 10));
          active -= 1;
          return {
            ok: false,
            headers: { get: () => 'application/xml' },
          };
        },
      }
    );
    assert.strictEqual(result.public, false);
    assert.strictEqual(result.reason, 'not_public');
    assert.strictEqual(calls, 3);
    assert.ok(maxActive > 1);
  });

  await test('public access probe rejects any publicly readable derivative', async () => {
    const result = await mediaRuntime.probePublicAccess(
      'faneqo-protected/test/gallery.webp',
      {
        CDN_URL: 'https://cdn.example',
        AWS_BUCKET: 'bucket',
        AWS_REGION: 'us-east-1',
      },
      {
        timeoutMs: 100,
        fetchImpl: async (url) => ({
          ok: url.includes('cdn.example'),
          headers: { get: () => url.includes('cdn.example') ? 'image/webp' : 'application/xml' },
        }),
      }
    );
    assert.strictEqual(result.public, true);
    assert.strictEqual(result.reason, 'public_get_ok');
  });

  await test('gated publish still blocked when protectedReady is false', () => {
    const gated = updatePure.validatePublishInput({
      visibility: 'show_attendees',
      mediaIds: [1],
      eventId: 9,
      protectedReady: false,
    });
    assert.strictEqual(gated.error, 'gated_delivery_unavailable');
  });

  await test('gated publish is allowed when protectedReady is true', () => {
    const gated = updatePure.validatePublishInput({
      visibility: 'fan_list',
      mediaIds: [1, 2],
      protectedReady: true,
    });
    assert.strictEqual(gated.error, undefined);
    assert.strictEqual(gated.contentKind, 'gallery');
  });

  await test('HMAC token verifies and rejects expiry / tamper', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const exp = Math.floor(Date.now() / 1000) + 60;
    const token = media.signMediaToken({ updateId: 4, mediaId: 8, size: 'gallery', exp }, env);
    const ok = media.verifyMediaToken({ updateId: 4, mediaId: 8, size: 'gallery', exp, sig: token.sig }, env);
    assert.strictEqual(ok.ok, true);
    const expired = media.verifyMediaToken({
      updateId: 4,
      mediaId: 8,
      size: 'gallery',
      exp: Math.floor(Date.now() / 1000) - 10,
      sig: token.sig,
      now: Date.now(),
    }, env);
    assert.strictEqual(expired.ok, false);
    const tampered = media.verifyMediaToken({
      updateId: 4,
      mediaId: 99,
      size: 'gallery',
      exp,
      sig: token.sig,
    }, env);
    assert.strictEqual(tampered.ok, false);
  });

  await test('protected serializer never emits S3/CDN URLs', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const row = media.serializeProtectedMedia({
      id: 12,
      width: 800,
      height: 600,
      mime: 'image/webp',
      alternativeText: 'Stage',
      url: 'https://cdn.example/secret.jpg',
      provider: 'faneqo-protected',
    }, { updateId: 3, extraHosts: ['cdn.example'] }, env);
    assert.ok(row);
    assert.ok(row.url.includes('/api/artist-updates/3/media/12'));
    assert.strictEqual(media.looksLikeStorageUrl(row.url, ['cdn.example']), false);
    assert.strictEqual(row.protected, true);
    assert.strictEqual(row.mediaId, 12);
    assert.strictEqual(row.thumbnailUrl, row.thumbUrl);
    assert.strictEqual(row.aspectRatio, 800 / 600);
    const blob = JSON.stringify(row);
    assert.strictEqual(blob.includes('amazonaws'), false);
    assert.strictEqual(blob.includes('faneqo-protected://'), false);
    assert.strictEqual(blob.includes('cdn.example/secret'), false);
    assert.strictEqual(blob.includes('originalUrl'), false);
  });

  await test('protected media identity is file id, not the rotating signed URL', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const file = { id: 12, width: 960, height: 640, mime: 'image/webp', provider: 'faneqo-protected' };
    const a = media.serializeProtectedMedia(file, { updateId: 3 }, env);
    const b = media.serializeProtectedMedia(file, { updateId: 3, publicOrigin: 'https://api.example' }, env);
    assert.strictEqual(a.mediaId, b.mediaId);
    assert.notStrictEqual(a.url, b.url);
    assert.ok(b.url.includes('sig='));
  });

  await test('foreign media id does not belong to the update', () => {
    assert.strictEqual(media.mediaBelongsToUpdate({ mediaIds: [1, 2] }, 9), false);
    assert.strictEqual(media.mediaBelongsToUpdate({ mediaIds: [1, 2] }, 2), true);
  });

  await test('public candidate URLs include CDN and S3 hosts', () => {
    const urls = media.buildPublicCandidateUrls('faneqo-protected/abc/gallery.webp', {
      cdnUrl: 'https://cdn.example',
      cdnRootPath: 'uploads',
      bucket: 'bucket',
      region: 'us-east-1',
    });
    assert.ok(urls.some((url) => url.includes('cdn.example/uploads/faneqo-protected/')));
    assert.ok(urls.some((url) => url.includes('bucket.s3.us-east-1.amazonaws.com')));
  });

  await test('stream access prefers live viewer over a leftover token', () => {
    const revoked = media.decideStreamAccess({
      access: { allowed: false, reason: 'fan_list' },
      tokenOk: true,
      userId: 9,
      isDraft: false,
      isArtist: false,
    });
    assert.strictEqual(revoked.allowed, false);
    assert.strictEqual(revoked.reason, 'fan_list');
    const draft = media.decideStreamAccess({
      access: { allowed: true, reason: 'artist' },
      tokenOk: true,
      userId: null,
      isDraft: true,
      isArtist: false,
    });
    assert.strictEqual(draft.allowed, false);
    assert.strictEqual(draft.reason, 'draft');
    const imgTag = media.decideStreamAccess({
      access: { allowed: false, reason: 'account_required' },
      tokenOk: true,
      userId: null,
      isDraft: false,
      isArtist: false,
    });
    assert.strictEqual(imgTag.allowed, true);
  });

  await test('gated serialize issues proxy URLs and never the raw file.url', () => {
    const list = updatePure.serializeUpdateMediaList([{
      id: 12,
      url: 'https://bucket.s3.us-east-1.amazonaws.com/secret.jpg',
      mime: 'image/webp',
      width: 960,
      height: 640,
      provider: 'faneqo-protected',
    }], {
      updateId: 3,
      visibility: 'show_attendees',
      extraHosts: [],
      env: { JWT_SECRET: 'unit-test-secret' },
    });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].protected, true);
    assert.ok(list[0].url.includes('/api/artist-updates/3/media/12'));
    assert.strictEqual(JSON.stringify(list).includes('amazonaws'), false);
  });

  await test('conversation tokens cannot be reused as ArtistUpdate tokens', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const exp = Math.floor(Date.now() / 1000) + 60;
    const dm = media.signConversationMediaToken({
      conversationId: 4,
      messageId: 9,
      mediaId: 88,
      size: 'large',
      exp,
    }, env);
    const asUpdate = media.verifyMediaToken({
      updateId: 4,
      mediaId: 88,
      size: 'large',
      exp,
      sig: dm.sig,
    }, env);
    assert.strictEqual(asUpdate.ok, false);
    const issued = media.issueConversationMediaUrls({
      conversationId: 4,
      messageId: 9,
      mediaId: 88,
    }, env);
    assert.ok(issued.thumb.includes('/api/conversations/4/messages/9/media/88'));
    assert.ok(issued.large.includes('size=large'));
    const row = media.serializeConversationProtectedMedia({
      id: 88,
      width: 800,
      height: 600,
      mime: 'image/webp',
      url: 'https://cdn.example/secret.jpg',
      provider: 'faneqo-protected',
      provider_metadata: { protected: true, domain: 'conversation' },
    }, { conversationId: 4, messageId: 9, extraHosts: ['cdn.example'] }, env);
    assert.ok(row);
    assert.strictEqual(row.protected, true);
    assert.strictEqual(row.mediaId, 88);
    assert.strictEqual(JSON.stringify(row).includes('cdn.example/secret'), false);
    const artistFile = media.serializeConversationProtectedMedia({
      id: 88,
      mime: 'image/webp',
      provider: 'faneqo-protected',
      provider_metadata: { protected: true, domain: 'artist-update' },
    }, { conversationId: 4, messageId: 9 }, env);
    assert.strictEqual(artistFile, null);
  });

  await test('denied teaser never includes media URLs after show_attendees deny', () => {
    const teaser = updatePure.publicTeaser({
      id: 3,
      slug: 'nashville',
      visibility: 'show_attendees',
      status: 'published',
      media: [{ url: 'https://bucket.s3.us-east-1.amazonaws.com/secret.jpg' }],
      photoCount: 2,
    }, { allowed: false, reason: 'show_attendees', teaser: true, youWereThere: false });
    assert.deepStrictEqual(teaser.media, []);
    assert.strictEqual(JSON.stringify(teaser).includes('amazonaws'), false);
    assert.strictEqual(JSON.stringify(teaser).includes('secret.jpg'), false);
  });

  await test('_vid still cannot authorize gated JSON access', () => {
    const access = updatePure.decideArtistUpdateAccess({
      update: { status: 'published', visibility: 'show_attendees', eventId: 1 },
      viewer: {},
      visitorClaim: 'vid_abc',
    });
    assert.strictEqual(access.allowed, false);
  });

  await test('production never allows public DM media fallback', () => {
    const prod = media.dmAttachmentDeliveryPolicy({
      NODE_ENV: 'production',
      FANEQO_PROTECTED_MEDIA_ENABLED: 'true',
      FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1',
      AWS_BUCKET: 'b',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'k',
      AWS_ACCESS_SECRET: 's',
      JWT_SECRET: 'secret',
    });
    assert.strictEqual(prod.ready, true);
    assert.strictEqual(prod.publicFallbackAllowed, false);
    const missing = media.dmAttachmentDeliveryPolicy({
      NODE_ENV: 'production',
      FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1',
    });
    assert.strictEqual(missing.ready, false);
    assert.strictEqual(missing.publicFallbackAllowed, false);
    assert.strictEqual(missing.attachmentsEnabled, false);
    const local = media.dmAttachmentDeliveryPolicy({
      NODE_ENV: 'development',
      FANEQO_DM_PUBLIC_MEDIA_FALLBACK: '1',
    });
    assert.strictEqual(local.publicFallbackAllowed, true);
    assert.strictEqual(local.attachmentsEnabled, true);
    const localOff = media.dmAttachmentDeliveryPolicy({ NODE_ENV: 'development' });
    assert.strictEqual(localOff.publicFallbackAllowed, false);
    assert.strictEqual(localOff.attachmentsEnabled, false);
  });

  await test('thumbnail token does not authorize a different derivative', () => {
    const env = { JWT_SECRET: 'unit-test-secret' };
    const exp = Math.floor(Date.now() / 1000) + 60;
    const thumb = media.signMediaToken({ updateId: 4, mediaId: 8, size: 'thumb', exp }, env);
    const asLarge = media.verifyMediaToken({
      updateId: 4,
      mediaId: 8,
      size: 'large',
      exp,
      sig: thumb.sig,
    }, env);
    assert.strictEqual(asLarge.ok, false);
  });

  await test('missing signing secret serializes as unavailable, not public', () => {
    const row = media.serializeProtectedMedia({
      id: 12,
      width: 800,
      height: 600,
      mime: 'image/webp',
      url: 'https://cdn.example/secret.jpg',
      provider: 'faneqo-protected',
    }, { updateId: 3, extraHosts: ['cdn.example'] }, {});
    assert.ok(row);
    assert.strictEqual(row.unavailable, true);
    assert.strictEqual(row.url, null);
    assert.strictEqual(row.protected, true);
    assert.strictEqual(JSON.stringify(row).includes('cdn.example'), false);
  });

  await test('orphan cleanup never selects referenced or fresh protected files', () => {
    const now = Date.now();
    const fresh = {
      id: 1,
      provider: 'faneqo-protected',
      createdAt: new Date(now - 60 * 60 * 1000).toISOString(),
    };
    const old = {
      id: 2,
      provider: 'faneqo-protected',
      createdAt: new Date(now - 25 * 60 * 60 * 1000).toISOString(),
    };
    const publicFile = {
      id: 3,
      provider: 'aws-s3',
      createdAt: new Date(now - 48 * 60 * 60 * 1000).toISOString(),
    };
    assert.strictEqual(media.isProtectedOrphanCandidate(fresh, { now }), false);
    assert.strictEqual(media.isProtectedOrphanCandidate(old, { now }), true);
    assert.strictEqual(media.isProtectedOrphanCandidate(publicFile, { now }), false);
    const orphans = media.unreferencedProtectedFiles([old, { ...old, id: 9 }], [9]);
    assert.deepStrictEqual(orphans.map((file) => file.id), [2]);
  });

  await test('HEIC copy is human, not MIME jargon', () => {
    /* HEIC is accepted now, so this copy only appears when a real HEIC fails
       to decode — it must read like an answer, not a format rejection. */
    assert.match(media.unsupportedImageMessage('image/heic', 'IMG.HEIC'), /could not be read/);
    /* Submittable, but never storable — it is converted on the way in. */
    assert.ok(media.isAllowedUploadMime('image/heic'));
    assert.ok(media.isAllowedUploadMime('image/heif'));
    assert.strictEqual(media.isAllowedImageMime('image/heic'), false);
    assert.match(media.unsupportedImageMessage('image/gif', 'x.gif'), /Choose a JPEG, PNG, HEIC, or WebP/);
    assert.strictEqual(media.IMAGE_TOO_LARGE_COPY, 'Photos can be up to 8 MB.');
  });

  await test('a real HEIC decodes into normal gallery derivatives', async () => {
    const fs = require('fs');
    const path = require('path');
    const fixture = path.join(__dirname, 'fixtures', 'sample-iphone.heic');
    /* A renamed JPEG would prove nothing, so skip loudly rather than fake it. */
    if (!fs.existsSync(fixture)) {
      throw new Error('missing scripts/fixtures/sample-iphone.heic');
    }
    const buffer = fs.readFileSync(fixture);
    assert.strictEqual(buffer.subarray(4, 8).toString('latin1'), 'ftyp');

    const heic = require('../src/utils/artistUpdates/heicDecode');
    assert.strictEqual(heic.looksLikeHeic(buffer, 'image/heic', 'sample-iphone.heic'), true);
    assert.strictEqual(heic.looksLikeHeic(Buffer.from('not an image'), 'image/jpeg', 'a.jpg'), false);

    const { processArtistUpdateImage } = require('../src/utils/artistUpdates/protectedMedia');
    const processed = await processArtistUpdateImage(buffer, { mime: 'image/heic', name: 'sample-iphone.heic' });
    for (const size of media.MEDIA_SIZES) {
      const variant = processed.variants[size];
      assert.ok(variant, `missing ${size} derivative`);
      assert.strictEqual(variant.mime, 'image/webp');
      assert.ok(variant.width > 0 && variant.bytes > 0);
    }
    /* JPEG must still take the untouched native path. */
    const sharp = require('sharp');
    const jpeg = await sharp({ create: { width: 40, height: 30, channels: 3, background: '#333' } }).jpeg().toBuffer();
    const jpegOut = await processArtistUpdateImage(jpeg, { mime: 'image/jpeg', name: 'a.jpg' });
    assert.strictEqual(jpegOut.variants[media.MEDIA_SIZES[0]].mime, 'image/webp');
  });

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
  if (failed) process.exitCode = 1;
})();
