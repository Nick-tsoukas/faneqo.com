'use strict';

/**
 * Slice B.1 — FanProfile uniqueness + canonical ensure hardening.
 * Run: node scripts/test-fan-profile-uniqueness.js
 *
 * Uses a real SQLite database for the index/audit paths so the DDL and the
 * uniqueness race are exercised against an actual engine, not a mock.
 */

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const idx = require('../src/utils/fanProfile/fanProfileIndexes');
const { createFanProfileService } = require('../src/utils/fanProfile/fanProfileService');

const repo = (rel) => path.join(__dirname, '..', rel);
const read = (rel) => fs.readFileSync(repo(rel), 'utf8');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  void name;
}

/* ------------------------------------------------------------------ *
 * Pure classification
 * ------------------------------------------------------------------ */

check('pair-only unique index is not accepted as a one-profile-per-user guarantee', () => {
  // This is the index Strapi generates for the oneToOne relation.
  const pair = {
    name: 'fan_profiles_user_links_unique',
    def: 'CREATE UNIQUE INDEX fan_profiles_user_links_unique ON fan_profiles_user_links (fan_profile_id, user_id)',
  };
  assert.strictEqual(idx.indexGuaranteesOneProfilePerUser(pair), false);

  const userOnly = {
    name: 'fan_profiles_user_id_unique',
    def: 'CREATE UNIQUE INDEX fan_profiles_user_id_unique ON fan_profiles_user_links USING btree (user_id) WHERE (user_id IS NOT NULL)',
  };
  assert.strictEqual(idx.indexGuaranteesOneProfilePerUser(userOnly), true);

  // A non-unique index on user_id guarantees nothing.
  assert.strictEqual(
    idx.indexGuaranteesOneProfilePerUser({
      def: 'CREATE INDEX fan_profiles_user_links_inv_fk on fan_profiles_user_links (user_id)',
    }),
    false
  );

  const summary = idx.summarizeIndexes([pair, userOnly]);
  assert.strictEqual(summary.userUnique, true);
  assert.strictEqual(summary.pairUnique, true);
  assert.strictEqual(idx.summarizeIndexes(null).inspected, false);
  assert.strictEqual(idx.summarizeIndexes(null).userUnique, null);
});

check('duplicate groups classify SAFE only when extras carry no fan-authored identity', () => {
  const empty = (id) => ({ id, display_name: null, first_name: null, last_name: null, profile_completed_at: null });

  // Extras are empty — the lowest id already holds everything.
  assert.strictEqual(
    idx.classifyDuplicateGroup([{ ...empty(4), display_name: 'chosen' }, empty(9)]),
    'SAFE'
  );

  // An extra holds a name the fan chose. Dropping it would lose data.
  assert.strictEqual(
    idx.classifyDuplicateGroup([empty(4), { ...empty(9), display_name: 'chosen' }]),
    'CONFLICTING'
  );
  assert.strictEqual(
    idx.classifyDuplicateGroup([empty(4), { ...empty(9), first_name: 'Nik' }]),
    'CONFLICTING'
  );
  assert.strictEqual(
    idx.classifyDuplicateGroup([empty(4), { ...empty(9), profile_completed_at: '2026-01-01' }]),
    'CONFLICTING'
  );
  // Avatar counts as fan-authored even though it is not a column on the table.
  assert.strictEqual(
    idx.classifyDuplicateGroup([empty(4), { ...empty(9), hasAvatar: true }]),
    'CONFLICTING'
  );

  // Order of input must not matter; id order decides which row is canonical.
  assert.strictEqual(
    idx.classifyDuplicateGroup([{ ...empty(9), display_name: 'chosen' }, empty(4)]),
    'CONFLICTING'
  );

  assert.strictEqual(idx.classifyDuplicateGroup([empty(4)]), 'UNKNOWN');
  assert.strictEqual(idx.classifyDuplicateGroup(null), 'UNKNOWN');
  assert.strictEqual(
    idx.classifyDuplicateGroup([empty(4), empty(9)], { identityColumnsPresent: false }),
    'UNKNOWN'
  );
});

check('claim bookkeeping on an extra row is recoverable, not a conflict', () => {
  const empty = (id) => ({ id, display_name: null, first_name: null, last_name: null, profile_completed_at: null });
  const group = [empty(4), { ...empty(9), claimed_artist_count: 3, last_claimed_at: '2026-01-01' }];
  assert.strictEqual(idx.classifyDuplicateGroup(group), 'SAFE');
  assert.strictEqual(idx.groupCarriesBookkeepingOnly(group), true);
  assert.strictEqual(idx.groupCarriesBookkeepingOnly([empty(4), empty(9)]), false);
});

check('unique index SQL is partial and targets the table holding user_id', () => {
  assert.strictEqual(
    idx.userUniqueSql('links'),
    'CREATE UNIQUE INDEX IF NOT EXISTS fan_profiles_user_id_unique ON fan_profiles_user_links (user_id) WHERE user_id IS NOT NULL'
  );
  assert.match(idx.userUniqueSql('inline'), /ON fan_profiles \(user_id\)/);
  // IF NOT EXISTS keeps boot idempotent; the partial clause keeps orphan links legal.
  for (const layout of ['links', 'inline']) {
    assert.match(idx.userUniqueSql(layout), /IF NOT EXISTS/);
    assert.match(idx.userUniqueSql(layout), /WHERE user_id IS NOT NULL/);
  }
});

check('audit and boot activation never contain destructive SQL', () => {
  const src = read('src/utils/fanProfile/fanProfileIndexes.js');
  for (const bad of ['DROP ', 'DELETE ', 'TRUNCATE', 'UPDATE ', 'ALTER TABLE']) {
    assert.ok(!src.includes(bad), `must not contain ${bad}`);
  }
  const script = read('scripts/audit-fan-profile-uniqueness.js');
  assert.match(script, /--apply is forbidden/);
  for (const bad of ['CREATE UNIQUE', 'DROP ', 'DELETE ']) {
    assert.ok(!script.includes(bad), `audit script must not contain ${bad}`);
  }
});

/* ------------------------------------------------------------------ *
 * Real SQLite: layout, audit, index behavior, race
 * ------------------------------------------------------------------ */

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'faneqo-fanprofile-'));
const dbFile = path.join(tmpDir, 'test.db');

function connect() {
  return require('knex')({
    client: 'better-sqlite3',
    connection: { filename: dbFile },
    useNullAsDefault: true,
  });
}

/** Recreate the tables and indexes Strapi generates for this relation. */
async function buildSchema(knex) {
  await knex.schema.createTable('fan_profiles', (t) => {
    t.increments('id').primary();
    t.integer('claimed_artist_count').nullable();
    t.datetime('last_claimed_at').nullable();
    t.string('display_name').nullable();
    t.string('first_name').nullable();
    t.string('last_name').nullable();
    t.datetime('profile_completed_at').nullable();
  });
  await knex.schema.createTable('fan_profiles_user_links', (t) => {
    t.increments('id').primary();
    t.integer('fan_profile_id').nullable();
    t.integer('user_id').nullable();
  });
  // Strapi's own index: the PAIR is unique, the user is not.
  await knex.raw(
    'CREATE UNIQUE INDEX fan_profiles_user_links_unique ON fan_profiles_user_links (fan_profile_id, user_id)'
  );
}

async function link(knex, profileId, userId, profile = {}) {
  await knex('fan_profiles').insert({ id: profileId, claimed_artist_count: 0, ...profile });
  await knex('fan_profiles_user_links').insert({ fan_profile_id: profileId, user_id: userId });
}

(async () => {
  {
    const knex = connect();
    await buildSchema(knex);

    const layout = await idx.resolveLayout(knex);
    check('layout resolves to the Strapi link table', () => {
      assert.strictEqual(layout, 'links');
    });

    await link(knex, 1, 11, { display_name: 'nikbeats' });
    await link(knex, 2, 22);

    const clean = await idx.auditFanProfileUniqueness(knex);
    check('clean database audits CLEAN and reports the pair-only index gap', () => {
      assert.strictEqual(clean.state, 'CLEAN');
      assert.strictEqual(clean.layout, 'links');
      assert.strictEqual(clean.table, 'fan_profiles_user_links');
      assert.strictEqual(clean.counts.profiles, 2);
      assert.strictEqual(clean.counts.linkedUsers, 2);
      assert.strictEqual(clean.counts.orphanLinks, 0);
      assert.strictEqual(clean.counts.profilesWithoutLink, 0);
      assert.strictEqual(clean.duplicates.groups, 0);
      // This is the whole point of the slice.
      assert.strictEqual(clean.index.pairUnique, true);
      assert.strictEqual(clean.index.userUnique, false);
      assert.strictEqual(clean.canActivateUnique, true);
    });

    // Prove the pair index really does allow a second profile for one user.
    await link(knex, 3, 11);
    const dirty = await idx.auditFanProfileUniqueness(knex);
    check('the Strapi pair index does not stop a second profile for one user', () => {
      assert.strictEqual(dirty.state, 'DUPLICATES');
      assert.strictEqual(dirty.duplicates.groups, 1);
      assert.strictEqual(dirty.duplicates.extraRows, 1);
      assert.strictEqual(dirty.duplicates.largestGroup, 2);
      assert.strictEqual(dirty.duplicates.safeGroups, 1, 'extra row is empty, so lowest id wins safely');
      assert.strictEqual(dirty.duplicates.conflictingGroups, 0);
      assert.strictEqual(dirty.canActivateUnique, false, 'must refuse to constrain dirty data');
    });

    // A conflicting duplicate must block activation and be reported separately.
    await link(knex, 4, 22, { display_name: 'otherfan' });
    const conflicting = await idx.auditFanProfileUniqueness(knex);
    check('a duplicate whose extra row holds chosen identity is CONFLICTING', () => {
      assert.strictEqual(conflicting.duplicates.groups, 2);
      assert.strictEqual(conflicting.duplicates.safeGroups, 1);
      assert.strictEqual(conflicting.duplicates.conflictingGroups, 1);
      assert.strictEqual(conflicting.canActivateUnique, false);
    });

    const boot = await idx.ensureFanProfileIndexes({ db: { connection: knex }, log: { info() {}, warn() {} } });
    const stillNoIndex = await idx.auditFanProfileUniqueness(knex);
    check('boot activation refuses to apply the index while duplicates exist', () => {
      assert.strictEqual(boot.skipped, true);
      assert.strictEqual(boot.reason, 'DUPLICATES');
      assert.strictEqual(stillNoIndex.index.userUnique, false, 'no index was created on dirty data');
    });

    await knex.destroy();
    fs.rmSync(dbFile, { force: true });
  }

  {
    const knex = connect();
    await buildSchema(knex);
    await link(knex, 1, 11, { display_name: 'nikbeats' });

    const strapiLike = { db: { connection: knex }, log: { info() {}, warn() {} } };
    const first = await idx.ensureFanProfileIndexes(strapiLike);
    const second = await idx.ensureFanProfileIndexes(strapiLike);

    check('boot activation applies the index on clean data and is idempotent', () => {
      assert.strictEqual(first.ok, true);
      assert.strictEqual(second.ok, true, 're-running boot must not fail');
    });

    const audited = await idx.auditFanProfileUniqueness(knex);
    check('after activation the database guarantees one profile per user', () => {
      assert.strictEqual(audited.index.userUnique, true);
      assert.ok(audited.index.names.includes('fan_profiles_user_id_unique'));
    });

    let raced = null;
    try {
      await knex('fan_profiles').insert({ id: 2, claimed_artist_count: 0 });
      await knex('fan_profiles_user_links').insert({ fan_profile_id: 2, user_id: 11 });
    } catch (err) {
      raced = err;
    }
    check('the database now rejects a second profile for the same user', () => {
      assert.ok(raced, 'insert should have been rejected');
      assert.match(String(raced.message), /unique/i);
      // And the error is recognized as a race, not an unexpected failure.
      assert.strictEqual(require('../src/utils/inbox/inboxPure').isUniqueViolation(raced), true);
    });

    await knex('fan_profiles').insert({ id: 3, claimed_artist_count: 0 });
    await knex('fan_profiles_user_links').insert({ fan_profile_id: 3, user_id: null });
    await knex('fan_profiles').insert({ id: 4, claimed_artist_count: 0 });
    await knex('fan_profiles_user_links').insert({ fan_profile_id: 4, user_id: null });
    const withOrphans = await idx.auditFanProfileUniqueness(knex);
    check('orphan links with a null user remain legal under a partial index', () => {
      assert.strictEqual(withOrphans.counts.orphanLinks, 2);
      assert.strictEqual(withOrphans.state, 'CLEAN', 'null user links are not duplicates');
      // Profiles 3 and 4 have null-user links; profile 2 is the row left behind
      // when the rejected race insert rolled back only its link.
      assert.strictEqual(withOrphans.counts.profilesWithoutLink, 3);
    });

    await knex.destroy();
    fs.rmSync(dbFile, { force: true });
  }

  {
    const knex = connect();
    const missing = await idx.auditFanProfileUniqueness(knex);
    check('a database without the table audits UNKNOWN, never CLEAN', () => {
      assert.strictEqual(missing.state, 'UNKNOWN');
      assert.strictEqual(missing.reason, 'no_table');
      assert.strictEqual(missing.canActivateUnique, false);
    });
    const boot = await idx.ensureFanProfileIndexes({ db: { connection: knex }, log: { info() {}, warn() {} } });
    assert.strictEqual(boot.skipped, true);
    await knex.destroy();
    fs.rmSync(dbFile, { force: true });
  }

  const noConn = await idx.ensureFanProfileIndexes({});
  const noDb = await idx.ensureFanProfileIndexes({ db: {} });
  check('missing connection is skipped, never crashed on', () => {
    assert.deepStrictEqual(noConn, { skipped: true, reason: 'no_connection' });
    assert.deepStrictEqual(noDb, { skipped: true, reason: 'no_connection' });
  });

  /* ---------------------------------------------------------------- *
   * Canonical ensure via the service
   * ---------------------------------------------------------------- */

  const UID_PROFILE = 'api::fan-profile.fan-profile';
  const UID_USER = 'plugin::users-permissions.user';

  function makeStrapi({ users = [], profiles = [], failCreateOnce = false } = {}) {
    const state = {
      users: JSON.parse(JSON.stringify(users)),
      profiles: JSON.parse(JSON.stringify(profiles)),
      calls: [],
      nextId: 500,
      pendingRaceRow: null,
      failCreateOnce,
    };
    const owner = (p) => Number(p.user?.id ?? p.user);
    const strapi = {
      log: { info() {}, warn() {}, error() {} },
      entityService: {
        async findOne(uid, id) {
          state.calls.push({ op: 'findOne', uid });
          if (uid === UID_USER) return state.users.find((u) => u.id === Number(id)) || null;
          return state.profiles.find((p) => p.id === Number(id)) || null;
        },
        async findMany(uid, params) {
          state.calls.push({ op: 'findMany', uid, params });
          if (uid !== UID_PROFILE) return [];
          let rows = state.profiles;
          const f = params?.filters || {};
          if (f.user && typeof f.user === 'object' && f.user.id?.$in) {
            const wanted = new Set(f.user.id.$in.map(Number));
            rows = rows.filter((p) => wanted.has(owner(p)));
          } else if (f.user != null) {
            rows = rows.filter((p) => owner(p) === Number(f.user));
          }
          rows = [...rows].sort((a, b) => a.id - b.id);
          if (params?.limit) rows = rows.slice(0, params.limit);
          return JSON.parse(JSON.stringify(rows));
        },
        async create(uid, { data }) {
          state.calls.push({ op: 'create', uid, data });
          if (state.failCreateOnce) {
            state.failCreateOnce = false;
            // Simulate a concurrent insert winning the race: the row now exists
            // and our own insert is rejected by the unique index.
            state.profiles.push({
              id: state.nextId++,
              user: { id: Number(data.user) },
              claimedArtistCount: 0,
              displayName: 'winner',
            });
            const err = new Error(
              'insert into "fan_profiles_user_links" - UNIQUE constraint failed: fan_profiles_user_links.user_id'
            );
            err.code = 'SQLITE_CONSTRAINT_UNIQUE';
            throw err;
          }
          const row = { id: state.nextId++, ...data, user: { id: Number(data.user) } };
          state.profiles.push(row);
          return JSON.parse(JSON.stringify(row));
        },
        async update(uid, id, { data }) {
          state.calls.push({ op: 'update', uid, id, data });
          const row = state.profiles.find((p) => p.id === Number(id));
          if (!row) throw new Error('missing profile row');
          Object.assign(row, data);
          return JSON.parse(JSON.stringify(row));
        },
      },
    };
    return { strapi, state };
  }

  const countCalls = (state, op) => state.calls.filter((c) => c.op === op).length;
  const FAN_USER = { id: 11, email: 'fan@example.com' };

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER] });
    const svc = createFanProfileService(strapi);
    const a = await svc.ensureForUser(11);
    const b = await svc.ensureForUser(11);
    const c = await svc.ensureForUser(11);

    check('repeated ensure returns the same profile and creates once', () => {
      assert.ok(a && a.id);
      assert.strictEqual(a.id, b.id);
      assert.strictEqual(b.id, c.id);
      assert.strictEqual(countCalls(state, 'create'), 1);
      assert.strictEqual(state.profiles.length, 1);
    });

    check('automatic ensure never completes the profile', () => {
      assert.strictEqual(a.profileCompletedAt, undefined);
      assert.strictEqual(state.profiles[0].profileCompletedAt, undefined);
      assert.strictEqual(state.profiles[0].claimedArtistCount, 0);
      assert.strictEqual(countCalls(state, 'update'), 0);
    });
  }

  {
    // The uniqueness race: our insert loses, and we must return the winner.
    const { strapi, state } = makeStrapi({ users: [FAN_USER], failCreateOnce: true });
    const svc = createFanProfileService(strapi);
    const profile = await svc.ensureForUser(11);

    check('a lost uniqueness race refetches the winning profile instead of throwing', () => {
      assert.ok(profile, 'ensure must not return null');
      assert.strictEqual(profile.displayName, 'winner');
      assert.strictEqual(state.profiles.length, 1, 'no duplicate row was created');
    });

    const res = await svc.getSelfProfile({ userId: 11 });
    check('GET survives the race with a 200, not a 500', () => {
      assert.strictEqual(res.ok, true);
      assert.strictEqual(res.displayName, 'winner');
      assert.strictEqual(res.email, 'fan@example.com');
    });
  }

  {
    // A non-uniqueness failure must still surface.
    const { strapi } = makeStrapi({ users: [FAN_USER] });
    strapi.entityService.create = async () => {
      const err = new Error('connection terminated unexpectedly');
      err.code = 'ECONNRESET';
      throw err;
    };
    const svc = createFanProfileService(strapi);
    let thrown = null;
    try {
      await svc.ensureForUser(11);
    } catch (err) {
      thrown = err;
    }
    check('a real database error is not swallowed as a race', () => {
      assert.ok(thrown);
      assert.strictEqual(thrown.code, 'ECONNRESET');
    });
  }

  {
    // Duplicates predating the index: lowest id must win, deterministically.
    const { strapi } = makeStrapi({
      users: [FAN_USER],
      profiles: [
        { id: 9, user: { id: 11 }, displayName: 'newer' },
        { id: 4, user: { id: 11 }, displayName: 'canonical' },
      ],
    });
    const svc = createFanProfileService(strapi);
    const ensured = await svc.ensureForUser(11);
    const res = await svc.getSelfProfile({ userId: 11 });
    const patched = await svc.updateSelfProfile({ userId: 11, body: { firstName: 'Nik' } });
    const bulk = await svc.loadProfilesByAccountUser([11]);

    check('lowest id wins across ensure, GET, PATCH and the bulk loader', () => {
      assert.strictEqual(ensured.id, 4);
      assert.strictEqual(res.displayName, 'canonical');
      assert.strictEqual(patched.firstName, 'Nik');
      assert.strictEqual(patched.displayName, 'canonical', 'patched the canonical row');
      assert.strictEqual(bulk.get(11).id, 4);
    });
  }

  {
    // An artist/team user is the same identity; ensure must work for them too.
    const { strapi, state } = makeStrapi({ users: [{ id: 33, email: 'artist@example.com' }] });
    const svc = createFanProfileService(strapi);
    const a = await svc.ensureForUser(33);
    const b = await svc.ensureForUser(33);

    check('artist/team account still gets exactly one fan profile', () => {
      assert.strictEqual(a.id, b.id);
      assert.strictEqual(state.users.length, 1);
      assert.strictEqual(state.profiles.length, 1);
      assert.strictEqual(Number(state.profiles[0].user.id), 33);
    });
  }

  {
    const { strapi, state } = makeStrapi({ users: [FAN_USER] });
    const svc = createFanProfileService(strapi);
    const bad = [null, undefined, 0, -1, 'abc', {}];
    const results = [];
    for (const value of bad) results.push(await svc.ensureForUser(value));

    check('invalid user ids never create a profile', () => {
      results.forEach((res, i) => assert.strictEqual(res, null, String(bad[i])));
      assert.strictEqual(countCalls(state, 'create'), 0);
    });
  }

  /* ---------------------------------------------------------------- *
   * One implementation, unchanged neighbours
   * ---------------------------------------------------------------- */

  const fanAccountSrc = read('src/utils/fanAccount.js');

  check('fanAccount.ensureFanProfile delegates instead of duplicating find-or-create', () => {
    const fn = fanAccountSrc.slice(
      fanAccountSrc.indexOf('async function ensureFanProfile'),
      fanAccountSrc.indexOf('async function findUserByEmail')
    );
    assert.match(fn, /createFanProfileService\(strapi\)\.ensureForUser\(userId\)/);
    assert.doesNotMatch(fn, /entityService\.create/, 'second create path must be gone');
    assert.doesNotMatch(fn, /entityService\.findMany/, 'second find path must be gone');
    assert.match(fanAccountSrc, /require\('\.\/fanProfile\/fanProfileService'\)/);
  });

  check('there is now exactly one fan-profile create in the codebase', () => {
    const files = ['src/utils/fanAccount.js', 'src/utils/fanProfile/fanProfileService.js'];
    const creates = files.flatMap((file) => {
      const src = read(file);
      return (src.match(/entityService\.create\((?:\s*)UID_PROFILE|entityService\.create\('api::fan-profile/g) || []);
    });
    assert.strictEqual(creates.length, 1, `expected 1 create path, found ${creates.length}`);
  });

  check('automatic ensure still never sets profileCompletedAt anywhere', () => {
    // Match assignment, not prose: these files mention the field in comments.
    const ASSIGNS = /profileCompletedAt\s*[:=][^:]/;
    assert.doesNotMatch(fanAccountSrc, ASSIGNS);
    const service = read('src/utils/fanProfile/fanProfileService.js');
    const ensure = service.slice(
      service.indexOf('async function ensureForUser'),
      service.indexOf('async function getSelfProfile')
    );
    assert.doesNotMatch(ensure, ASSIGNS);
    // Only the explicit PATCH sets it.
    assert.strictEqual((service.match(/profileCompletedAt: new Date/g) || []).length, 1);
  });

  check('claim bookkeeping still works through the delegated ensure', () => {
    // claimedArtistCount / lastClaimedAt are written by the claim path, and the
    // canonical ensure returns them so the old contract is a subset.
    assert.match(fanAccountSrc, /claimedArtistCount: bandIds\.size/);
    assert.match(fanAccountSrc, /lastClaimedAt: new Date\(\)\.toISOString\(\)/);
    // The write must use the row ensure returned, not a second unordered find.
    assert.match(fanAccountSrc, /const profile = await ensureFanProfile\(userId\)/);
    const claimWrite = fanAccountSrc.slice(
      fanAccountSrc.indexOf('const profile = await ensureFanProfile'),
      fanAccountSrc.indexOf('async function claimFanRelationshipsForUser')
    );
    assert.match(claimWrite, /profile\.id/);
    assert.doesNotMatch(claimWrite, /findMany/);
    const service = read('src/utils/fanProfile/fanProfileService.js');
    assert.match(service, /'claimedArtistCount',\s*\n\s*'lastClaimedAt',/);
    assert.match(service, /claimedArtistCount: 0/);
  });

  check('GET /me also reads the lowest-id profile', () => {
    const me = fanAccountSrc.slice(
      fanAccountSrc.indexOf('async function getMeStatus'),
      fanAccountSrc.indexOf('async function listClaimedArtists') || fanAccountSrc.length
    );
    assert.match(me, /sort: \{ id: 'asc' \}/);
  });

  check('canonical reads are ordered so lowest id wins', () => {
    const service = read('src/utils/fanProfile/fanProfileService.js');
    assert.strictEqual((service.match(/sort: \{ id: 'asc' \}/g) || []).length, 2);
  });

  check('boot wiring audits before constraining and cannot block boot', () => {
    const boot = read('src/index.js');
    assert.match(boot, /ensureFanProfileIndexes/);
    const block = boot.slice(boot.indexOf("require('./utils/fanProfile/fanProfileIndexes')") - 200);
    assert.match(block.slice(0, 500), /catch \(err\)[\s\S]*log\.warn/);
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(`fan profile uniqueness tests passed (${passed} groups)`);
})().catch((err) => {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    /* ignore cleanup failure */
  }
  console.error(err);
  process.exit(1);
});
