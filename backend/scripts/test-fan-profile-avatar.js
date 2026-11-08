'use strict';

/**
 * Slice D1 — fan avatar backend + media safety.
 * Run: node scripts/test-fan-profile-avatar.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const pure = require('../src/utils/fanProfile/fanProfileAvatarPure');
const avatarIo = require('../src/utils/fanProfile/fanProfileAvatar');
const identityPure = require('../src/utils/fanProfile/fanProfilePure');
const { createFanProfileService } = require('../src/utils/fanProfile/fanProfileService');

const repo = (rel) => path.join(__dirname, '..', rel);
const read = (rel) => fs.readFileSync(repo(rel), 'utf8');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  void name;
}

async function jpeg({ width = 80, height = 60, withExif = false } = {}) {
  let pipeline = sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 80, b: 120 } },
  }).jpeg({ quality: 80 });
  if (withExif) {
    pipeline = pipeline.withMetadata({
      orientation: 6,
      exif: { IFD0: { Copyright: 'GPS-SECRET', Artist: 'venue-selfie' } },
    });
  }
  return pipeline.toBuffer();
}

async function png(width = 64, height = 64) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 20, b: 20 } },
  })
    .png()
    .toBuffer();
}

async function webp(width = 64, height = 48) {
  return sharp({
    create: { width, height, channels: 3, background: { r: 20, g: 200, b: 80 } },
  })
    .webp()
    .toBuffer();
}

function gifBytes() {
  return Buffer.from('GIF89a\x01\x00\x01\x00\x00\x00\x00;', 'binary');
}

function pdfBytes() {
  return Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\n', 'utf8');
}

function svgBytes() {
  return Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>', 'utf8');
}

function jpegHeaderOnly(size) {
  const buf = Buffer.alloc(size, 0);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  return buf;
}

/* ------------------------------------------------------------------ *
 * Pure validation
 * ------------------------------------------------------------------ */

check('magic bytes classify jpeg/png/webp and reject gif/svg/pdf/unknown', () => {
  assert.strictEqual(pure.sniffImageKind(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), 'jpeg');
  assert.strictEqual(pure.sniffImageKind(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), 'png');
  assert.strictEqual(
    pure.sniffImageKind(Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WEBP')])),
    'webp'
  );
  assert.strictEqual(pure.sniffImageKind(gifBytes()), 'gif');
  assert.strictEqual(pure.sniffImageKind(pdfBytes()), 'pdf');
  assert.strictEqual(pure.sniffImageKind(svgBytes()), 'svg');
  assert.strictEqual(pure.sniffImageKind(Buffer.from('not-an-image')), 'unknown');
  const heic = Buffer.alloc(12);
  heic.write('xxxxftypheic', 0);
  assert.strictEqual(pure.sniffImageKind(heic), 'heic');
});

check('filename and declared MIME cannot smuggle a GIF as a JPEG', () => {
  const res = pure.validateIncomingAvatar({
    buffer: gifBytes(),
    mime: 'image/jpeg',
    filename: 'me.jpg',
    size: gifBytes().length,
  });
  assert.strictEqual(res.error, 'avatar_invalid_type');
});

check('HEIC is rejected even when the name looks like a JPEG', () => {
  const heic = Buffer.alloc(16);
  heic.write('\0\0\0\0ftypheic', 0);
  const res = pure.validateIncomingAvatar({
    buffer: heic,
    mime: 'image/jpeg',
    filename: 'IMG_1234.jpg',
  });
  assert.strictEqual(res.error, 'avatar_invalid_type');
  assert.match(res.message, /JPEG, PNG, or WebP/);
});

check('oversize is rejected before processing, including a JPEG header', () => {
  const huge = jpegHeaderOnly(pure.AVATAR_MAX_BYTES + 1);
  const byBuffer = pure.validateIncomingAvatar({ buffer: huge, mime: 'image/jpeg', filename: 'big.jpg' });
  assert.strictEqual(byBuffer.error, 'avatar_too_large');
  const byDeclared = pure.validateIncomingAvatar({
    buffer: Buffer.from([0xff, 0xd8, 0xff]),
    mime: 'image/jpeg',
    size: pure.AVATAR_MAX_BYTES + 10,
  });
  assert.strictEqual(byDeclared.error, 'avatar_too_large');
});

check('missing file and injection keys are rejected', () => {
  assert.strictEqual(pure.validateIncomingAvatar({}).error, 'avatar_missing');
  assert.strictEqual(pure.rejectAvatarInjection({ fileId: 99 }).error, 'avatar_not_writable');
  assert.strictEqual(pure.rejectAvatarInjection({ avatarId: '12' }).error, 'avatar_not_writable');
  assert.strictEqual(pure.rejectAvatarInjection({ userId: 22, profileId: 3 }).error, 'avatar_not_writable');
  assert.strictEqual(pure.rejectAvatarInjection({}), null);
  assert.strictEqual(pure.rejectAvatarInjection(null), null);
});

check('prior-avatar delete is owned-only and fail-closed', () => {
  assert.strictEqual(
    pure.canSafelyDeletePriorAvatar({
      priorFileId: 10,
      capturedFileId: 10,
      newFileId: 11,
      relations: [],
      file: { id: 10, provider: 'aws-s3' },
    }),
    true
  );
  assert.strictEqual(
    pure.canSafelyDeletePriorAvatar({
      priorFileId: 10,
      capturedFileId: 99,
      newFileId: 11,
      relations: [],
      file: { id: 10 },
    }),
    false,
    'client-supplied id cannot retarget delete'
  );
  assert.strictEqual(
    pure.canSafelyDeletePriorAvatar({
      priorFileId: 10,
      capturedFileId: 10,
      newFileId: 11,
      relations: [{ related_type: 'api::conversation.conversation', field: 'attachments' }],
      file: { id: 10 },
    }),
    false
  );
  assert.strictEqual(
    pure.canSafelyDeletePriorAvatar({
      priorFileId: 10,
      capturedFileId: 10,
      newFileId: 11,
      relations: [],
      file: { id: 10, provider: 'faneqo-protected', provider_metadata: { protected: true } },
    }),
    false
  );
  assert.strictEqual(
    pure.canSafelyDeletePriorAvatar({
      priorFileId: 10,
      capturedFileId: 10,
      newFileId: 11,
      relations: null,
      file: { id: 10 },
    }),
    false,
    'unknown relation state must not delete'
  );
});

check('avatar URL serializer never returns the Upload object or protected URLs', () => {
  assert.strictEqual(pure.avatarUrlFromMedia({ url: '/uploads/a.webp', id: 9, formats: {} }), '/uploads/a.webp');
  assert.strictEqual(
    pure.avatarUrlFromMedia({ url: 'faneqo-protected://abc', formats: { thumbnail: { url: '/t.webp' } } }),
    '/t.webp'
  );
  assert.strictEqual(pure.avatarUrlFromMedia({ url: 'faneqo-protected://abc' }), null);
  assert.deepStrictEqual(identityPure.serializeSelfProfile({
    profile: { displayName: 'nik', avatar: { id: 3, url: '/uploads/a.webp', mime: 'image/webp' } },
    user: { email: 'a@b.c' },
  }), {
    displayName: 'nik',
    firstName: null,
    lastName: null,
    avatarUrl: '/uploads/a.webp',
    profileCompletedAt: null,
    email: 'a@b.c',
  });
});

/* ------------------------------------------------------------------ *
 * Sharp normalization
 * ------------------------------------------------------------------ */

(async () => {
  {
    const input = await jpeg({ width: 900, height: 400, withExif: true });
    const before = await sharp(input).metadata();
    assert.ok(before.exif || before.orientation === 6, 'fixture must carry EXIF or orientation');

    const out = await avatarIo.normalizeAvatarImage(input);
    const after = await sharp(out.buffer).metadata();

    check('normalize is a 512 square WebP with EXIF stripped', () => {
      assert.strictEqual(out.mime, 'image/webp');
      assert.strictEqual(out.width, 512);
      assert.strictEqual(out.height, 512);
      assert.strictEqual(after.width, 512);
      assert.strictEqual(after.height, 512);
      assert.strictEqual(after.format, 'webp');
      assert.strictEqual(after.exif, undefined);
      assert.ok(!after.orientation || after.orientation === 1);
      assert.strictEqual(out.hasExif, false);
      assert.doesNotMatch(out.buffer.toString('latin1'), /GPS-SECRET|venue-selfie/);
    });
  }

  {
    const pngBuf = await png(32, 96);
    const webpBuf = await webp();
    const jpegBuf = await jpeg();
    for (const [label, buf] of [['png', pngBuf], ['webp', webpBuf], ['jpeg', jpegBuf]]) {
      const ok = pure.validateIncomingAvatar({ buffer: buf, mime: `image/${label}`, filename: `x.${label}` });
      assert.strictEqual(ok.error, undefined, label);
      const out = await avatarIo.normalizeAvatarImage(ok.buffer);
      assert.strictEqual(out.width, 512, label);
      assert.strictEqual(out.mime, 'image/webp', label);
    }
    check('valid JPEG, PNG and WebP normalize to the same 512 WebP', () => {});
  }

  {
    let failed = null;
    try {
      await avatarIo.normalizeAvatarImage(Buffer.from('not-an-image'));
    } catch (err) {
      failed = err;
    }
    check('sharp failure surfaces instead of uploading', () => {
      assert.ok(failed);
    });
  }

  /* ---------------------------------------------------------------- *
   * Service: mocked Upload plugin + canonical profile
   * ---------------------------------------------------------------- */

  const UID_PROFILE = 'api::fan-profile.fan-profile';
  const UID_USER = 'plugin::users-permissions.user';
  const UID_FILE = 'plugin::upload.file';

  function makeStrapi({
    users = [],
    profiles = [],
    files = [],
    failUpload = false,
    failAssociate = false,
    failRemove = false,
    relationsByFile = {},
  } = {}) {
    const state = {
      users: JSON.parse(JSON.stringify(users)),
      profiles: JSON.parse(JSON.stringify(profiles)),
      files: JSON.parse(JSON.stringify(files)),
      calls: [],
      nextProfileId: 500,
      nextFileId: 900,
      failUpload,
      failAssociate,
      failRemove,
      relationsByFile,
    };
    const owner = (p) => Number(p.user?.id ?? p.user);

    const uploadService = {
      async upload() {
        state.calls.push({ op: 'upload' });
        if (state.failUpload) {
          const err = new Error('provider down');
          err.code = 'upload_failed';
          throw err;
        }
        const row = {
          id: state.nextFileId++,
          url: `/uploads/fan-avatar-${state.nextFileId}.webp`,
          mime: 'image/webp',
          width: 512,
          height: 512,
          provider: 'aws-s3',
        };
        state.files.push(row);
        return [row];
      },
      async remove(file) {
        state.calls.push({ op: 'remove', id: file.id });
        if (state.failRemove) {
          const err = new Error('provider delete failed');
          err.code = 'remove_failed';
          throw err;
        }
        state.files = state.files.filter((f) => f.id !== file.id);
        return file;
      },
    };

    const strapi = {
      log: { info() {}, warn() {}, error() {} },
      plugin(name) {
        if (name !== 'upload') return null;
        return { service: () => uploadService };
      },
      db: {
        connection: {
          schema: { async hasTable() { return true; } },
          async raw() { return []; },
        },
      },
      entityService: {
        async findOne(uid, id) {
          state.calls.push({ op: 'findOne', uid });
          if (uid === UID_USER) return state.users.find((u) => u.id === Number(id)) || null;
          if (uid === UID_FILE) return state.files.find((f) => f.id === Number(id)) || null;
          return state.profiles.find((p) => p.id === Number(id)) || null;
        },
        async findMany(uid, params) {
          state.calls.push({ op: 'findMany', uid, params });
          if (uid !== UID_PROFILE) return [];
          let rows = state.profiles;
          const f = params?.filters || {};
          if (f.user != null) rows = rows.filter((p) => owner(p) === Number(f.user));
          rows = [...rows].sort((a, b) => a.id - b.id);
          if (params?.limit) rows = rows.slice(0, params.limit);
          return JSON.parse(JSON.stringify(rows));
        },
        async create(uid, { data }) {
          state.calls.push({ op: 'create', uid, data });
          const row = { id: state.nextProfileId++, ...data, user: { id: Number(data.user) } };
          state.profiles.push(row);
          return JSON.parse(JSON.stringify(row));
        },
        async update(uid, id, { data }) {
          state.calls.push({ op: 'update', uid, id, data });
          if (state.failAssociate && data.avatar != null) {
            const err = new Error('db write failed');
            err.code = 'associate_failed';
            throw err;
          }
          const row = state.profiles.find((p) => p.id === Number(id));
          if (!row) throw new Error('missing profile');
          if (Object.prototype.hasOwnProperty.call(data, 'avatar')) {
            if (data.avatar == null) row.avatar = null;
            else {
              const file = state.files.find((f) => f.id === Number(data.avatar));
              row.avatar = file ? { ...file } : { id: Number(data.avatar) };
            }
          }
          Object.keys(data).forEach((key) => {
            if (key !== 'avatar') row[key] = data[key];
          });
          return JSON.parse(JSON.stringify(row));
        },
      },
    };

    // listFileRelations uses knex-like builder; stub it on the io via db.connection
    strapi.db.connection = Object.assign(async () => [], {
      schema: { async hasTable() { return true; } },
    });
    // Override listFileRelations by monkeypatching after create — tests that
    // need custom relations set state.relationsByFile and we wrap below.
    const originalList = avatarIo.listFileRelations;
    avatarIo.listFileRelations = async (_s, fileId) => state.relationsByFile[fileId] ?? [];
    state.restore = () => {
      avatarIo.listFileRelations = originalList;
    };

    return { strapi, state, uploadService };
  }

  const FAN = { id: 11, email: 'fan@example.com' };
  const OTHER = { id: 22, email: 'other@example.com' };

  {
    const jpegBuf = await jpeg();
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, displayName: 'nikbeats', profileCompletedAt: '2026-01-01T00:00:00.000Z' }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: jpegBuf, filename: 'me.jpg', mime: 'image/jpeg', size: jpegBuf.length },
      body: {},
    });

    check('valid JPEG upload associates only the caller canonical profile', () => {
      assert.strictEqual(res.ok, true);
      assert.match(res.avatarUrl, /^\/uploads\//);
      assert.strictEqual(res.displayName, 'nikbeats');
      assert.strictEqual(res.email, 'fan@example.com');
      assert.strictEqual(res.profileCompletedAt, '2026-01-01T00:00:00.000Z');
      assert.strictEqual(state.profiles[0].avatar.id, 900);
      assert.strictEqual(state.files.length, 1);
    });

    const got = await svc.getSelfProfile({ userId: 11 });
    check('GET returns avatarUrl after upload', () => {
      assert.strictEqual(got.avatarUrl, res.avatarUrl);
      assert.strictEqual(got.profileCompletedAt, '2026-01-01T00:00:00.000Z');
    });
    state.restore();
  }

  {
    const pngBuf = await png();
    const webpBuf = await webp();
    for (const [label, buf, mime] of [
      ['png', pngBuf, 'image/png'],
      ['webp', webpBuf, 'image/webp'],
    ]) {
      const { strapi, state } = makeStrapi({ users: [FAN], profiles: [{ id: 1, user: { id: 11 } }] });
      const res = await createFanProfileService(strapi).uploadSelfAvatar({
        userId: 11,
        incoming: { buffer: buf, filename: `me.${label}`, mime, size: buf.length },
        body: {},
      });
      assert.strictEqual(res.ok, true, label);
      assert.ok(res.avatarUrl, label);
      state.restore();
    }
    check('valid PNG and WebP uploads are accepted', () => {});
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN], profiles: [{ id: 1, user: { id: 11 } }] });
    const svc = createFanProfileService(strapi);
    const unauth = await svc.uploadSelfAvatar({ userId: null, incoming: { buffer: await jpeg() }, body: {} });
    const del = await svc.deleteSelfAvatar({ userId: null, body: {} });
    const stranger = await svc.uploadSelfAvatar({ userId: 999, incoming: { buffer: await jpeg() }, body: {} });
    check('unauthenticated upload and delete are rejected', () => {
      assert.strictEqual(unauth.status, 401);
      assert.strictEqual(del.status, 401);
      assert.strictEqual(stranger.status, 401);
      assert.strictEqual(state.files.length, 0);
      assert.strictEqual(state.calls.filter((c) => c.op === 'upload').length, 0);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { id: 50, url: '/uploads/old.webp' } }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
    });
    const svc = createFanProfileService(strapi);
    const injected = await svc.uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: { fileId: 50, avatarId: 50, userId: 22, profileId: 9 },
    });
    check('file-id / userId injection cannot attach media', () => {
      assert.strictEqual(injected.ok, false);
      assert.strictEqual(injected.error, 'avatar_not_writable');
      assert.strictEqual(state.profiles[0].avatar.id, 50, 'previous avatar preserved');
      assert.strictEqual(state.calls.filter((c) => c.op === 'upload').length, 0);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN, OTHER],
      profiles: [
        { id: 1, user: { id: 11 }, displayName: 'nikbeats' },
        { id: 2, user: { id: 22 }, displayName: 'otherfan', avatar: { id: 70, url: '/uploads/other.webp' } },
      ],
      files: [{ id: 70, url: '/uploads/other.webp', provider: 'aws-s3' }],
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: { userId: 22, profileId: 2, fileId: 70 },
    });
    check('retargeting body cannot change another account even before upload', () => {
      assert.strictEqual(res.error, 'avatar_not_writable');
      assert.strictEqual(state.profiles[1].avatar.id, 70);
      assert.strictEqual(state.profiles[0].avatar, undefined);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [
        { id: 9, user: { id: 11 }, displayName: 'newer' },
        { id: 4, user: { id: 11 }, displayName: 'canonical', profileCompletedAt: '2026-02-01T00:00:00.000Z' },
      ],
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: {},
    });
    check('upload writes the lowest-id canonical profile only', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.displayName, 'canonical');
      assert.strictEqual(res.profileCompletedAt, '2026-02-01T00:00:00.000Z');
      assert.ok(state.profiles.find((p) => p.id === 4).avatar?.url);
      assert.strictEqual(state.profiles.find((p) => p.id === 9).avatar, undefined);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { id: 50, url: '/uploads/old.webp' } }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: {},
    });
    check('replace associates the new file then deletes the prior owned file', () => {
      assert.strictEqual(res.ok, true);
      assert.notStrictEqual(res.avatarUrl, '/uploads/old.webp');
      assert.strictEqual(state.profiles[0].avatar.id, 900);
      assert.ok(state.calls.some((c) => c.op === 'remove' && c.id === 50));
      assert.ok(!state.files.some((f) => f.id === 50));
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { id: 50, url: '/uploads/old.webp' } }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
      failUpload: true,
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: {},
    });
    check('upload plugin failure preserves the previous avatar', () => {
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'avatar_upload_failed');
      assert.strictEqual(state.profiles[0].avatar.id, 50);
      assert.strictEqual(state.profiles[0].avatar.url, '/uploads/old.webp');
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { id: 50, url: '/uploads/old.webp' } }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
      failAssociate: true,
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: {},
    });
    check('association failure keeps the old avatar and cleans the unused new file', () => {
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.error, 'avatar_associate_failed');
      assert.strictEqual(state.profiles[0].avatar.id, 50);
      assert.ok(state.calls.some((c) => c.op === 'remove'));
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { id: 50, url: '/uploads/old.webp' } }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
      failRemove: true,
    });
    const res = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: await jpeg(), filename: 'me.jpg', mime: 'image/jpeg' },
      body: {},
    });
    check('old-file cleanup failure still leaves the new avatar valid', () => {
      assert.strictEqual(res.ok, true);
      assert.match(res.avatarUrl, /fan-avatar/);
      assert.strictEqual(state.profiles[0].avatar.id, 900);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{
        id: 1,
        user: { id: 11 },
        avatar: { id: 50, url: '/uploads/old.webp' },
        profileCompletedAt: '2026-03-01T00:00:00.000Z',
      }],
      files: [{ id: 50, url: '/uploads/old.webp', provider: 'aws-s3' }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.deleteSelfAvatar({ userId: 11, body: {} });
    check('delete clears avatar, removes owned file, and leaves completion alone', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.avatarUrl, null);
      assert.strictEqual(res.profileCompletedAt, '2026-03-01T00:00:00.000Z');
      assert.strictEqual(state.profiles[0].avatar, null);
      assert.ok(state.calls.some((c) => c.op === 'remove' && c.id === 50));
      assert.ok(!state.calls.some((c) => c.data && c.data.profileCompletedAt));
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 }, displayName: 'nikbeats' }],
    });
    const res = await createFanProfileService(strapi).deleteSelfAvatar({ userId: 11, body: {} });
    check('delete with no avatar is idempotent success', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.avatarUrl, null);
      assert.strictEqual(res.displayName, 'nikbeats');
      assert.strictEqual(state.calls.filter((c) => c.op === 'remove').length, 0);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN],
      profiles: [{ id: 1, user: { id: 11 } }],
    });
    const gif = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: gifBytes(), filename: 'dance.gif', mime: 'image/gif' },
      body: {},
    });
    const huge = await createFanProfileService(strapi).uploadSelfAvatar({
      userId: 11,
      incoming: { buffer: jpegHeaderOnly(100), filename: 'big.jpg', mime: 'image/jpeg', size: 5 * 1024 * 1024 },
      body: {},
    });
    check('invalid MIME and oversized uploads never reach Upload', () => {
      assert.strictEqual(gif.error, 'avatar_invalid_type');
      assert.strictEqual(huge.error, 'avatar_too_large');
      assert.strictEqual(state.calls.filter((c) => c.op === 'upload').length, 0);
    });
    state.restore();
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN], profiles: [{ id: 1, user: { id: 11 } }] });
    const res = await createFanProfileService(strapi).updateSelfProfile({
      userId: 11,
      body: { displayName: 'nikbeats', avatar: 900, fileId: 900 },
    });
    check('PATCH still cannot write avatar', () => {
      assert.strictEqual(res.error, 'avatar_not_writable');
    });
    state.restore();
  }

  /* ---------------------------------------------------------------- *
   * Static: routes, no inbox wiring, uniqueness untouched
   * ---------------------------------------------------------------- */

  const routes = read('src/api/fan-account/routes/01-fan-account.js');
  const controller = read('src/api/fan-account/controllers/fan-account.js');

  check('avatar routes exist and legacy POST profile is unchanged', () => {
    assert.match(routes, /method:\s*'POST',\s*path:\s*'\/fan-account\/avatar',\s*handler:\s*'fan-account\.uploadAvatar'/);
    assert.match(routes, /method:\s*'DELETE',\s*path:\s*'\/fan-account\/avatar',\s*handler:\s*'fan-account\.deleteAvatar'/);
    assert.match(routes, /method:\s*'POST',\s*path:\s*'\/fan-account\/profile',\s*handler:\s*'fan-account\.updateProfile'/);
  });

  check('controllers never attach a client file id', () => {
    const upload = controller.slice(controller.indexOf('async uploadAvatar'), controller.indexOf('async deleteAvatar'));
    assert.doesNotMatch(upload, /body\.fileId|body\.avatarId|body\.userId/);
    assert.match(upload, /ctx\.request\.files/);
  });

  check('avatar I/O uses the Upload plugin, not a hand-rolled S3 delete', () => {
    const io = read('src/utils/fanProfile/fanProfileAvatar.js');
    assert.match(io, /plugin\?\.\('upload'\)\?\.service\?\.\('upload'\)/);
    assert.match(io, /\.remove\(/);
    assert.doesNotMatch(io, /DeleteObjectCommand|S3Client/);
    assert.doesNotMatch(io, /faneqo-protected|PROTECTED_PREFIX/);
  });

  check('inbox and uniqueness were not wired to avatar', () => {
    assert.doesNotMatch(read('src/utils/inbox/directMessaging.js'), /fanProfileAvatar|uploadSelfAvatar/);
    assert.doesNotMatch(read('src/utils/inbox/conversationRequests.js'), /uploadSelfAvatar|fan-account\/avatar/);
    assert.doesNotMatch(read('src/utils/fanProfile/fanProfileIndexes.js'), /uploadSelfAvatar/);
    assert.match(read('src/utils/fanProfile/fanProfileService.js'), /ensureForUser/);
  });

  console.log(`fan profile avatar tests passed (${passed} groups)`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
