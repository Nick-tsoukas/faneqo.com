'use strict';

/**
 * Slice B — global fan profile backend foundation.
 * Run: node scripts/test-fan-profile-identity.js
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const pure = require('../src/utils/fanProfile/fanProfilePure');
const { createFanProfileService } = require('../src/utils/fanProfile/fanProfileService');

const repo = (rel) => path.join(__dirname, '..', rel);
const read = (rel) => fs.readFileSync(repo(rel), 'utf8');
const clone = (v) => JSON.parse(JSON.stringify(v));

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  void name;
}

/* ------------------------------------------------------------------ *
 * Fake Strapi
 * ------------------------------------------------------------------ */

const UID_PROFILE = 'api::fan-profile.fan-profile';
const UID_USER = 'plugin::users-permissions.user';

function makeStrapi({ users = [], profiles = [] } = {}) {
  const state = { users: clone(users), profiles: clone(profiles), calls: [], nextId: 500 };

  const strapi = {
    log: { error() {}, warn() {}, info() {} },
    entityService: {
      async findOne(uid, id, _params) {
        state.calls.push({ op: 'findOne', uid });
        if (uid === UID_USER) return state.users.find((u) => u.id === Number(id)) || null;
        return state.profiles.find((p) => p.id === Number(id)) || null;
      },
      async findMany(uid, params) {
        state.calls.push({ op: 'findMany', uid, params });
        if (uid !== UID_PROFILE) return [];
        const filters = params?.filters || {};
        let rows = state.profiles;
        const ownerOf = (p) => Number(p.user?.id ?? p.user);
        if (filters.user && typeof filters.user === 'object' && filters.user.id?.$in) {
          const wanted = new Set(filters.user.id.$in.map(Number));
          rows = rows.filter((p) => wanted.has(ownerOf(p)));
        } else if (filters.user != null) {
          rows = rows.filter((p) => ownerOf(p) === Number(filters.user));
        }
        if (params?.limit) rows = rows.slice(0, params.limit);
        return clone(rows);
      },
      async create(uid, { data }) {
        state.calls.push({ op: 'create', uid, data });
        const row = { id: state.nextId++, ...data, user: { id: Number(data.user) } };
        state.profiles.push(row);
        return clone(row);
      },
      async update(uid, id, { data }) {
        state.calls.push({ op: 'update', uid, id, data });
        const row = state.profiles.find((p) => p.id === Number(id));
        if (!row) throw new Error('missing profile row');
        Object.assign(row, data);
        return clone(row);
      },
    },
  };

  return { strapi, state };
}

const countCalls = (state, op, uid) =>
  state.calls.filter((c) => c.op === op && (!uid || c.uid === uid)).length;

/* ------------------------------------------------------------------ *
 * 1. Schema is additive and nullable
 * ------------------------------------------------------------------ */

const schema = JSON.parse(read('src/api/fan-profile/content-types/fan-profile/schema.json'));
const attrs = schema.attributes;

check('existing attributes preserved', () => {
  assert.strictEqual(schema.collectionName, 'fan_profiles');
  assert.strictEqual(attrs.user.target, 'plugin::users-permissions.user');
  assert.strictEqual(attrs.user.relation, 'oneToOne');
  assert.strictEqual(attrs.claimedArtistCount.type, 'integer');
  assert.strictEqual(attrs.claimedArtistCount.default, 0);
  assert.strictEqual(attrs.lastClaimedAt.type, 'datetime');
});

check('new identity fields exist and are nullable', () => {
  for (const field of ['displayName', 'firstName', 'lastName', 'profileCompletedAt', 'avatar']) {
    assert.ok(attrs[field], `${field} missing from schema`);
    assert.notStrictEqual(attrs[field].required, true, `${field} must stay nullable`);
    assert.strictEqual(attrs[field].default, undefined, `${field} must not have a default`);
  }
  assert.strictEqual(attrs.displayName.type, 'string');
  assert.strictEqual(attrs.displayName.maxLength, pure.DISPLAY_NAME_MAX);
  assert.strictEqual(attrs.firstName.maxLength, pure.FIRST_NAME_MAX);
  assert.strictEqual(attrs.lastName.maxLength, pure.LAST_NAME_MAX);
  assert.strictEqual(attrs.profileCompletedAt.type, 'datetime');
});

check('avatar is a single Upload image relation, not a new table', () => {
  assert.strictEqual(attrs.avatar.type, 'media');
  assert.strictEqual(attrs.avatar.multiple, false);
  assert.deepStrictEqual(attrs.avatar.allowedTypes, ['images']);
  assert.doesNotMatch(read('src/api/fan-profile/content-types/fan-profile/schema.json'), /MediaAsset|media-asset/i);
});

check('no email column duplicated onto fan-profile', () => {
  assert.strictEqual(attrs.email, undefined);
});

/* ------------------------------------------------------------------ *
 * 2. Validation
 * ------------------------------------------------------------------ */

check('display names common to music fans are accepted verbatim', () => {
  for (const name of ['Nik', 'nikbeats', 'Sarah J.', 'drumkid92', "O'Brien", 'José', 'DJ K-9']) {
    assert.deepStrictEqual(pure.validateDisplayName(name), { value: name }, name);
  }
});

check('whitespace is trimmed and collapsed rather than rejected', () => {
  assert.deepStrictEqual(pure.validateDisplayName('  Sarah   J.  '), { value: 'Sarah J.' });
  assert.deepStrictEqual(pure.validateFirstName('\tNik\n'), { value: 'Nik' });
  assert.deepStrictEqual(pure.validateDisplayName('Nik\u2028Beats'), { value: 'Nik Beats' });
  assert.deepStrictEqual(pure.validateDisplayName('Nik\u00A0Beats'), { value: 'Nik Beats' });
});

check('length limits are enforced by visible characters, never truncated', () => {
  assert.deepStrictEqual(pure.validateDisplayName('a'.repeat(40)), { value: 'a'.repeat(40) });
  assert.strictEqual(pure.validateDisplayName('a'.repeat(41)).error, 'displayName_too_long');
  // Astral characters count as one visible unit, not two UTF-16 units.
  assert.deepStrictEqual(pure.validateDisplayName('🎸'.repeat(40)), { value: '🎸'.repeat(40) });
  assert.strictEqual(pure.validateDisplayName('🎸'.repeat(41)).error, 'displayName_too_long');
  assert.strictEqual(pure.validateFirstName('n'.repeat(51)).error, 'firstName_too_long');
  assert.deepStrictEqual(pure.validateFirstName('n'.repeat(50)), { value: 'n'.repeat(50) });
  assert.strictEqual(pure.validateLastName('n'.repeat(51)).error, 'lastName_too_long');
});

check('control, invisible, bidi, markup and email values are rejected', () => {
  assert.strictEqual(pure.validateDisplayName('Nik\u0000beats').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('Nik\u0007beats').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('Nik\u001Bbeats').error, 'displayName_invalid');
  // Invisible and direction-spoofing characters would fake identities in the inbox.
  assert.strictEqual(pure.validateDisplayName('Nik\u200Bbeats').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('Nik\u202Ebeats').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('<script>alert(1)</script>').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('Nik <b>').error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName('nik@example.com').error, 'displayName_invalid');
  assert.strictEqual(pure.validateFirstName('nik@example.com').error, 'firstName_invalid');
});

check('non-string values are rejected, not coerced', () => {
  assert.strictEqual(pure.validateDisplayName(42).error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName({ a: 1 }).error, 'displayName_invalid');
  assert.strictEqual(pure.validateDisplayName(['Nik']).error, 'displayName_invalid');
});

check('empty values clear the field to null', () => {
  assert.deepStrictEqual(pure.validateLastName(''), { value: null });
  assert.deepStrictEqual(pure.validateLastName('   '), { value: null });
  assert.deepStrictEqual(pure.validateDisplayName(null), { value: null });
  assert.deepStrictEqual(pure.validateFirstName(''), { value: null });
});

check('patch allow-list drops unknown keys and requires an editable field', () => {
  const ok = pure.validateProfilePatch({
    displayName: 'nikbeats',
    userId: 999,
    id: 7,
    profileId: 7,
    user: 999,
    email: 'attacker@example.com',
    claimedArtistCount: 99,
    profileCompletedAt: '2020-01-01T00:00:00.000Z',
  });
  assert.deepStrictEqual(ok, { data: { displayName: 'nikbeats' } });

  assert.strictEqual(pure.validateProfilePatch({}).error, 'no_editable_fields');
  assert.strictEqual(pure.validateProfilePatch({ userId: 3 }).error, 'no_editable_fields');
  assert.strictEqual(pure.validateProfilePatch(null).error, 'no_editable_fields');
  assert.strictEqual(pure.validateProfilePatch('displayName=x').error, 'no_editable_fields');
});

check('avatar and file ids are rejected by patch', () => {
  for (const key of pure.PROFILE_REJECTED_FIELDS) {
    const res = pure.validateProfilePatch({ displayName: 'nikbeats', [key]: 12 });
    assert.strictEqual(res.error, 'avatar_not_writable', key);
    assert.strictEqual(res.status, 400);
  }
  // The read-only mirror field is ignored rather than treated as a write.
  assert.deepStrictEqual(
    pure.validateProfilePatch({ displayName: 'nikbeats', avatarUrl: '/uploads/x.png' }),
    { data: { displayName: 'nikbeats' } }
  );
});

check('writable allow-list is exactly the three name fields', () => {
  assert.deepStrictEqual(pure.PROFILE_WRITABLE_FIELDS, ['displayName', 'firstName', 'lastName']);
});

/* ------------------------------------------------------------------ *
 * 3. Display identity resolver precedence
 * ------------------------------------------------------------------ */

const resolve = pure.resolveFanDisplayIdentity;

check('1. explicit profile.displayName wins and is shown verbatim', () => {
  const out = resolve({
    fan: { firstName: 'Nikolas', lastName: 'Petrov', city: 'Chicago' },
    profile: { displayName: 'drumkid92', firstName: 'Nik', lastName: 'Beats' },
  });
  assert.strictEqual(out.displayName, 'drumkid92');
  assert.strictEqual(out.source, 'profile_display_name');
  // A chosen name is never reduced to an initial.
  assert.strictEqual(resolve({ profile: { displayName: 'Nik Beats' } }).displayName, 'Nik Beats');
  assert.strictEqual(resolve({ profile: { displayName: 'Sarah J.' } }).displayName, 'Sarah J.');
});

check('2. profile first name, with last name reduced to an initial', () => {
  const out = resolve({
    fan: { firstName: 'Nikolas', lastName: 'Petrov', city: 'Chicago' },
    profile: { displayName: null, firstName: 'Nik', lastName: 'Beats' },
  });
  assert.strictEqual(out.displayName, 'Nik B.');
  assert.strictEqual(out.source, 'profile_name');
  assert.strictEqual(resolve({ profile: { firstName: 'Nik' } }).displayName, 'Nik');
});

check('3. fan row name when the profile has no name', () => {
  const out = resolve({
    fan: { firstName: 'Nikolas', lastName: 'Petrov', city: 'Chicago' },
    profile: { displayName: '', firstName: '', lastName: '' },
  });
  assert.strictEqual(out.displayName, 'Nikolas P.');
  assert.strictEqual(out.source, 'fan_name');
  assert.strictEqual(resolve({ fan: { firstName: 'Nikolas' } }).displayName, 'Nikolas');
});

check('4. city fallback for an anonymous fan', () => {
  const out = resolve({ fan: { city: 'Chicago' }, profile: null });
  assert.strictEqual(out.displayName, 'Chicago fan');
  assert.strictEqual(out.source, 'city');
});

check('5. Unnamed fan is the final fallback', () => {
  assert.strictEqual(resolve({ fan: {}, profile: null }).displayName, 'Unnamed fan');
  assert.strictEqual(resolve({}).displayName, 'Unnamed fan');
  assert.strictEqual(resolve().displayName, 'Unnamed fan');
  assert.strictEqual(resolve({ fan: { city: '  ' } }).source, 'fallback');
});

check('resolver never falls back to an email or username', () => {
  const out = resolve({
    fan: { firstName: 'fan@example.com', email: 'fan@example.com', username: 'fan@example.com' },
    profile: { displayName: 'fan@example.com', firstName: 'fan@example.com' },
  });
  assert.strictEqual(out.displayName, 'Unnamed fan');
});

check('resolver ignores a stray fan.displayName so precedence stays deterministic', () => {
  const out = resolve({ fan: { displayName: 'Injected Name', city: 'Austin' }, profile: null });
  assert.strictEqual(out.displayName, 'Austin fan');
});

check('resolver exposes avatarUrl and no private data', () => {
  const out = resolve({
    fan: { firstName: 'Nik', email: 'nik@example.com' },
    profile: { avatar: { url: '/uploads/nik.png' } },
  });
  assert.strictEqual(out.avatarUrl, '/uploads/nik.png');
  assert.deepStrictEqual(Object.keys(out).sort(), ['avatarUrl', 'displayName', 'source']);
  assert.doesNotMatch(JSON.stringify(out), /example\.com/);
  assert.strictEqual(resolve({ profile: { avatar: null } }).avatarUrl, null);
  assert.strictEqual(resolve({ profile: {} }).avatarUrl, null);
});

check('resolver precedence lives in one module only', () => {
  const controller = read('src/api/fan-account/controllers/fan-account.js');
  assert.doesNotMatch(controller, /Unnamed fan/);
  assert.doesNotMatch(read('src/utils/fanProfile/fanProfileService.js'), /Unnamed fan/);
});

check('identity initials come from the resolved display name, never email', () => {
  assert.strictEqual(pure.identityInitials({ displayName: 'Nik Beats' }), 'NB');
  assert.strictEqual(pure.identityInitials('Nik Beats'), 'NB');
  assert.strictEqual(pure.identityInitials({ displayName: 'Nashville fan' }), 'F');
  assert.strictEqual(pure.identityInitials({ displayName: 'Unnamed fan' }), 'F');
  assert.strictEqual(pure.identityInitials({ displayName: 'fan@example.com' }), 'F');
  assert.strictEqual(pure.presentResolvedIdentity({ displayName: 'Nik Beats', avatarUrl: '/a.webp' }).initials, 'NB');
  assert.strictEqual(pure.presentResolvedIdentity({ displayName: 'Nik Beats', avatarUrl: '/a.webp' }).avatarUrl, '/a.webp');
  assert.deepStrictEqual(
    Object.keys(pure.presentResolvedIdentity({ displayName: 'Nik', avatarUrl: '/a.webp', source: 'profile_display_name' })).sort(),
    ['avatarUrl', 'displayName', 'initials']
  );
});

/* ------------------------------------------------------------------ *
 * 4. Self-scoped GET
 * ------------------------------------------------------------------ */

const FAN_USER = { id: 11, email: 'fan@example.com' };
const OTHER_USER = { id: 22, email: 'other@example.com' };

(async () => {
  {
    // An existing profile written before this slice must still work.
    const { strapi, state } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 }, claimedArtistCount: 3, lastClaimedAt: '2026-01-01T00:00:00.000Z' }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.getSelfProfile({ userId: 11 });

    check('legacy profile row remains valid and reads back as empty identity', () => {
      assert.deepStrictEqual(res, {
        ok: true,
        displayName: null,
        firstName: null,
        lastName: null,
        avatarUrl: null,
        profileCompletedAt: null,
        email: 'fan@example.com',
      });
      assert.strictEqual(countCalls(state, 'create'), 0, 'must not recreate an existing profile');
      assert.strictEqual(state.profiles[0].claimedArtistCount, 3, 'claim state untouched');
      assert.strictEqual(state.profiles[0].lastClaimedAt, '2026-01-01T00:00:00.000Z');
    });
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER] });
    const svc = createFanProfileService(strapi);
    const first = await svc.getSelfProfile({ userId: 11 });
    const second = await svc.getSelfProfile({ userId: 11 });

    check('GET ensures a profile once and never marks it complete', () => {
      assert.strictEqual(first.ok, true);
      assert.strictEqual(first.profileCompletedAt, null);
      assert.strictEqual(second.profileCompletedAt, null);
      assert.strictEqual(countCalls(state, 'create'), 1, 'ensure must be idempotent');
      assert.strictEqual(state.profiles.length, 1);
      assert.strictEqual(state.profiles[0].claimedArtistCount, 0);
      assert.strictEqual(state.profiles[0].profileCompletedAt, undefined);
    });
  }

  {
    // Even if a stale row carried an email column, the response must use the auth user.
    const { strapi } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 }, email: 'stale@profile.invalid', displayName: 'nikbeats' }],
    });
    const res = await createFanProfileService(strapi).getSelfProfile({ userId: 11 });

    check('GET email comes from users-permissions.user, not the profile', () => {
      assert.strictEqual(res.email, 'fan@example.com');
      assert.strictEqual(res.displayName, 'nikbeats');
    });
  }

  {
    const { strapi } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 }, avatar: { url: '/uploads/nik.png' } }],
    });
    const res = await createFanProfileService(strapi).getSelfProfile({ userId: 11 });

    check('GET returns an existing avatarUrl', () => {
      assert.strictEqual(res.avatarUrl, '/uploads/nik.png');
    });
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER] });
    const svc = createFanProfileService(strapi);

    const badActors = [null, undefined, 0, -1, 'abc', 999];
    const results = [];
    for (const userId of badActors) results.push(await svc.getSelfProfile({ userId }));

    check('unauthenticated and unknown-user reads are rejected without side effects', () => {
      results.forEach((res, i) => {
        const label = String(badActors[i]);
        assert.strictEqual(res.ok, false, label);
        assert.strictEqual(res.status, 401, label);
        assert.strictEqual(res.error, 'unauthorized', label);
      });
      assert.strictEqual(countCalls(state, 'create'), 0, 'no ghost profile rows');
    });
  }

  /* ---------------------------------------------------------------- *
   * 5. Self-scoped PATCH
   * ---------------------------------------------------------------- */

  {
    const { strapi, state } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 }, claimedArtistCount: 2 }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.updateSelfProfile({ userId: 11, body: { displayName: '  nikbeats  ' } });

    check('PATCH saves displayName and stamps profileCompletedAt', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.displayName, 'nikbeats');
      assert.strictEqual(res.email, 'fan@example.com');
      assert.ok(res.profileCompletedAt, 'profileCompletedAt must be set on explicit save');
      assert.ok(!Number.isNaN(Date.parse(res.profileCompletedAt)));
      assert.strictEqual(state.profiles[0].claimedArtistCount, 2, 'claim state untouched');
    });
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 } }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.updateSelfProfile({
      userId: 11,
      body: { firstName: 'Nik', lastName: 'Beats' },
    });

    check('PATCH saves firstName/lastName', () => {
      assert.strictEqual(res.firstName, 'Nik');
      assert.strictEqual(res.lastName, 'Beats');
      assert.strictEqual(res.displayName, null, 'displayName is never auto-generated');
    });

    const cleared = await svc.updateSelfProfile({ userId: 11, body: { lastName: '' } });
    check('PATCH can clear an optional name to null', () => {
      assert.strictEqual(cleared.lastName, null);
      assert.strictEqual(cleared.firstName, 'Nik', 'omitted fields are left alone');
    });

    check('PATCH only writes fan-profile rows', () => {
      const uids = new Set(state.calls.filter((c) => c.op === 'update').map((c) => c.uid));
      assert.deepStrictEqual([...uids], [UID_PROFILE]);
    });
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN_USER, OTHER_USER],
      profiles: [
        { id: 1, user: { id: 11 } },
        { id: 2, user: { id: 22 }, displayName: 'otherfan' },
      ],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.updateSelfProfile({
      userId: 11,
      body: { displayName: 'nikbeats', userId: 22, id: 2, profileId: 2, user: 22 },
    });

    check('client-supplied userId/profileId cannot retarget the write', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(state.profiles[0].displayName, 'nikbeats');
      assert.strictEqual(state.profiles[1].displayName, 'otherfan', "other fan's profile untouched");
      assert.strictEqual(Number(state.profiles[0].user.id), 11, 'ownership cannot be reassigned');
      const updates = state.calls.filter((c) => c.op === 'update');
      assert.strictEqual(updates.length, 1);
      assert.strictEqual(updates[0].id, 1);
      assert.strictEqual(updates[0].data.user, undefined);
    });
  }

  {
    const { strapi, state } = makeStrapi({
      users: [FAN_USER],
      profiles: [{ id: 1, user: { id: 11 } }],
    });
    const svc = createFanProfileService(strapi);
    const res = await svc.updateSelfProfile({ userId: 11, body: { displayName: 'nikbeats', avatar: 4321 } });

    check('PATCH cannot attach media', () => {
      assert.strictEqual(res.ok, false);
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.error, 'avatar_not_writable');
      assert.strictEqual(countCalls(state, 'update'), 0, 'rejected patch writes nothing');
      assert.strictEqual(state.profiles[0].displayName, undefined);
      assert.strictEqual(state.profiles[0].profileCompletedAt, undefined);
    });
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER], profiles: [{ id: 1, user: { id: 11 } }] });
    const svc = createFanProfileService(strapi);
    const unauth = await svc.updateSelfProfile({ userId: null, body: { displayName: 'nikbeats' } });
    const stranger = await svc.updateSelfProfile({ userId: 999, body: { displayName: 'nikbeats' } });

    check('unauthenticated PATCH is rejected before validation or writes', () => {
      assert.strictEqual(unauth.status, 401);
      assert.strictEqual(unauth.error, 'unauthorized');
      assert.strictEqual(stranger.status, 401);
      assert.strictEqual(countCalls(state, 'update'), 0);
      assert.strictEqual(countCalls(state, 'create'), 0);
    });
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER], profiles: [{ id: 1, user: { id: 11 } }] });
    const svc = createFanProfileService(strapi);
    const tooLong = await svc.updateSelfProfile({ userId: 11, body: { displayName: 'a'.repeat(500) } });
    const empty = await svc.updateSelfProfile({ userId: 11, body: {} });

    check('invalid PATCH bodies are rejected, never silently truncated', () => {
      assert.strictEqual(tooLong.status, 400);
      assert.strictEqual(tooLong.error, 'displayName_too_long');
      assert.strictEqual(empty.error, 'no_editable_fields');
      assert.strictEqual(countCalls(state, 'update'), 0);
      assert.strictEqual(state.profiles[0].profileCompletedAt, undefined);
    });
  }

  {
    // An artist/team account is the same global identity, not a second user.
    const artistUser = { id: 33, email: 'artist@example.com' };
    const { strapi, state } = makeStrapi({ users: [artistUser] });
    const svc = createFanProfileService(strapi);
    const res = await svc.updateSelfProfile({ userId: 33, body: { displayName: 'nikbeats' } });

    check('an artist/team account can own a fan profile on the same user', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.displayName, 'nikbeats');
      assert.strictEqual(state.users.length, 1, 'no second account created');
      assert.strictEqual(state.profiles.length, 1);
      assert.strictEqual(Number(state.profiles[0].user.id), 33);
    });
  }

  /* ---------------------------------------------------------------- *
   * 6. Bulk loader — no N+1
   * ---------------------------------------------------------------- */

  {
    const profiles = [
      { id: 1, user: { id: 11 }, displayName: 'nikbeats' },
      { id: 2, user: { id: 22 }, firstName: 'Sarah', lastName: 'Jones' },
      { id: 3, user: { id: 33 } },
    ];
    const { strapi, state } = makeStrapi({ profiles });
    const svc = createFanProfileService(strapi);

    // 60 fan rows across 3 accounts, plus anonymous rows with no account.
    const fans = [];
    for (let i = 0; i < 60; i += 1) {
      fans.push({ id: 1000 + i, accountUser: { id: [11, 22, 33][i % 3] }, firstName: 'Legacy' });
    }
    fans.push({ id: 2000, accountUser: null, firstName: '', city: 'Austin' });
    fans.push({ id: 2001, accountUserId: 11 });
    fans.push({ id: 2002, accountUser: { id: 33 } });

    const uniqueIds = pure.accountUserIdsFromFans(fans);
    const map = await svc.loadProfilesByAccountUser(uniqueIds);

    check('fan rows collapse to unique accountUser ids', () => {
      assert.deepStrictEqual(uniqueIds, [11, 22, 33]);
    });

    check('bulk loader issues one bounded query for the whole batch', () => {
      const queries = state.calls.filter((c) => c.op === 'findMany');
      assert.strictEqual(queries.length, 1, `expected 1 query, got ${queries.length}`);
      assert.deepStrictEqual(queries[0].params.filters, { user: { id: { $in: [11, 22, 33] } } });
      // Bounded by the id count, with headroom so duplicate rows predating the
      // unique index cannot truncate the canonical lowest-id row away.
      assert.strictEqual(queries[0].params.limit, 6, 'query must be bounded');
      assert.deepStrictEqual(queries[0].params.sort, { id: 'asc' }, 'lowest id wins');
      assert.strictEqual(map.size, 3);
      assert.strictEqual(map.get(11).displayName, 'nikbeats');
      assert.strictEqual(map.get(99), undefined);
    });

    const identities = await svc.resolveIdentitiesForFans(fans);
    check('batch identity resolution stays bounded and applies precedence', () => {
      assert.strictEqual(state.calls.filter((c) => c.op === 'findMany').length, 2, 'one more query total');
      assert.strictEqual(identities.get(1000).displayName, 'nikbeats');
      assert.strictEqual(identities.get(1001).displayName, 'Sarah J.');
      assert.strictEqual(identities.get(1002).displayName, 'Legacy', 'falls back to the fan row');
      assert.strictEqual(identities.get(2000).displayName, 'Austin fan');
      assert.strictEqual(identities.get(2001).displayName, 'nikbeats');
      // Has a profile row, but the fan never chose a name and has no city.
      assert.strictEqual(identities.get(2002).displayName, 'Unnamed fan');
    });
  }

  {
    const profiles = [];
    for (let i = 1; i <= 5; i += 1) profiles.push({ id: i, user: { id: i } });
    const { strapi, state } = makeStrapi({ profiles });
    const svc = createFanProfileService(strapi);
    const map = await svc.loadProfilesByAccountUser([1, 2, 3, 4, 5], { chunkSize: 2 });

    check('large batches are chunked, not sent as one unbounded $in', () => {
      assert.strictEqual(state.calls.filter((c) => c.op === 'findMany').length, 3);
      assert.strictEqual(map.size, 5);
    });

    assert.strictEqual(svc.PROFILE_CHUNK_SIZE, 200);
  }

  {
    const { strapi, state } = makeStrapi({ profiles: [{ id: 1, user: { id: 11 } }] });
    const svc = createFanProfileService(strapi);
    const empty = await svc.loadProfilesByAccountUser([]);
    const junk = await svc.loadProfilesByAccountUser([null, 0, -3, 'abc', undefined]);

    check('bulk loader short-circuits when there is nothing to load', () => {
      assert.strictEqual(empty.size, 0);
      assert.strictEqual(junk.size, 0);
      assert.strictEqual(state.calls.filter((c) => c.op === 'findMany').length, 0);
    });
  }

  /* ---------------------------------------------------------------- *
   * 7. Routes and legacy POST
   * ---------------------------------------------------------------- */

  const routes = read('src/api/fan-account/routes/01-fan-account.js');
  const controller = read('src/api/fan-account/controllers/fan-account.js');

  check('GET and PATCH /fan-account/profile are registered', () => {
    assert.match(routes, /method:\s*'GET',\s*path:\s*'\/fan-account\/profile',\s*handler:\s*'fan-account\.getProfile'/);
    assert.match(routes, /method:\s*'PATCH',\s*path:\s*'\/fan-account\/profile',\s*handler:\s*'fan-account\.patchProfile'/);
  });

  check('legacy POST /fan-account/profile route is unchanged', () => {
    assert.match(routes, /method:\s*'POST',\s*path:\s*'\/fan-account\/profile',\s*handler:\s*'fan-account\.updateProfile'/);
    assert.strictEqual((routes.match(/fan-account\.updateProfile/g) || []).length, 1);
  });

  check('legacy POST handler still syncs band-scoped Fan names via messaging', () => {
    const body = controller.slice(controller.indexOf('async updateProfile(ctx)'));
    assert.match(body, /updateFanMessagingProfile\(\{/);
    assert.match(body, /bandId:\s*body\.bandId/);
    assert.match(body, /firstName:\s*body\.firstName/);
    assert.match(body, /lastName:\s*body\.lastName/);
    // The legacy path must not have been rerouted into the global profile service.
    const legacy = body.slice(0, body.indexOf('async listMessageRequests'));
    assert.doesNotMatch(legacy, /createFanProfileService/);
    assert.doesNotMatch(legacy, /profileCompletedAt/);
  });

  check('new handlers do not touch band-scoped Fan name sync', () => {
    const get = controller.slice(controller.indexOf('async getProfile(ctx)'), controller.indexOf('async patchProfile(ctx)'));
    const patch = controller.slice(controller.indexOf('async patchProfile(ctx)'), controller.indexOf('async updateProfile(ctx)'));
    assert.doesNotMatch(get, /updateFanMessagingProfile/);
    assert.doesNotMatch(patch, /updateFanMessagingProfile/);
    assert.match(get, /ctx\.unauthorized/);
    assert.match(patch, /ctx\.unauthorized/);
    // Ownership comes only from the resolved JWT user.
    assert.match(patch, /userId,\s*\n\s*body: ctx\.request\.body/);
    assert.doesNotMatch(patch, /body\.userId|body\.profileId/);
  });

  check('no generic fan-profile CRUD surface was exposed', () => {
    // The core controller/service exist, but the route table is intentionally
    // empty, so the new identity fields gain no public endpoint.
    const profileRoutes = read('src/api/fan-profile/routes/fan-profile.js');
    assert.match(profileRoutes, /routes:\s*\[\s*\]/);
    assert.deepStrictEqual(require(repo('src/api/fan-profile/routes/fan-profile.js')).routes, []);
  });

  /* ---------------------------------------------------------------- *
   * 8. Untouched neighbours
   * ---------------------------------------------------------------- */

  check('claim/status paths still create an empty, incomplete profile', () => {
    const fanAccountSrc = read('src/utils/fanAccount.js');
    const service = read('src/utils/fanProfile/fanProfileService.js');
    // Slice B.1 made the claim path delegate to the canonical ensure primitive.
    const ensure = fanAccountSrc.slice(
      fanAccountSrc.indexOf('async function ensureFanProfile'),
      fanAccountSrc.indexOf('async function findUserByEmail')
    );
    assert.match(ensure, /ensureForUser\(userId\)/);
    assert.match(service, /claimedArtistCount: 0/);

    // Match assignment, not prose: both files mention the field in comments.
    const ASSIGNS_COMPLETED = /profileCompletedAt\s*[:=][^:]/;
    assert.doesNotMatch(ensure, ASSIGNS_COMPLETED, 'account creation must not mark a profile complete');
    assert.doesNotMatch(ensure, /displayName/, 'account creation must not invent a display name');
    assert.doesNotMatch(fanAccountSrc, ASSIGNS_COMPLETED);
    // No backfill of Fan row names into the global profile.
    assert.doesNotMatch(fanAccountSrc, /displayName/);
  });

  check('messaging profile sync still only writes Fan rows', () => {
    const src = read('src/utils/inbox/conversationRequests.js');
    const fn = src.slice(src.indexOf('updateFanMessagingProfile'));
    assert.doesNotMatch(fn, /api::fan-profile\.fan-profile/);
    assert.doesNotMatch(fn, /profileCompletedAt/);
  });

  check('attendance, unsubscribe and message snapshots untouched', () => {
    const service = read('src/utils/fanProfile/fanProfileService.js');
    for (const uid of ['fan-show-attendance', 'message-recipient', 'api::fan.fan', 'unsubscribe']) {
      assert.ok(!service.includes(uid), `service must not reference ${uid}`);
    }
    const uids = service.match(/'(api::|plugin::)[^']+'/g) || [];
    assert.deepStrictEqual(
      [...new Set(uids)].sort(),
      ["'api::fan-profile.fan-profile'", "'plugin::users-permissions.user'"]
    );
  });

  console.log(`fan profile identity tests passed (${passed} groups)`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
