/**
 * Fan Account Conversion V1 — unit tests for pure eligibility + helpers.
 * Run: node scripts/test-fan-account-conversion.js
 *
 * Does not require a running Strapi (pure functions only).
 */

const assert = require('assert');
const path = require('path');

// Load only the pure exports by requiring the module.
// fanAccount requires fanIdentity which needs no DB for these helpers.
const fanAccount = require(path.join(__dirname, '../src/utils/fanAccount'));

const {
  selectPromptEligibility,
  normalizeEmail,
  maskEmail,
  dismissCooldownMs,
  hashToken,
  TRIGGER_PRIORITY,
  planFanClaimLinks,
  planExistingUserClaims,
} = fanAccount;

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✅ ${name}`);
  } catch (err) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n=== Fan Account Conversion V1 (unit) ===\n');

test('normalizeEmail lowercases and trims', () => {
  assert.strictEqual(normalizeEmail('  Nick@Example.COM '), 'nick@example.com');
});

test('normalizeEmail rejects garbage', () => {
  assert.strictEqual(normalizeEmail('not-an-email'), null);
});

test('maskEmail hides local part', () => {
  assert.strictEqual(maskEmail('nick@gmail.com'), 'n***@gmail.com');
});

test('hashToken is stable sha256 hex', () => {
  const a = hashToken('abc');
  const b = hashToken('abc');
  assert.strictEqual(a, b);
  assert.strictEqual(a.length, 64);
  assert.notStrictEqual(hashToken('abc'), hashToken('abcd'));
});

test('anonymous with no signals is not eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 0, visitCount: 1 },
    visitor: {},
    accountState: 'anonymous',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'no_trigger');
});

test('first join alone (single artist, first visit) is not return_visit', () => {
  const now = Date.now();
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 1, visitCount: 1 },
    visitor: {
      firstSeenAt: new Date(now).toISOString(),
      lastSeenAt: new Date(now).toISOString(),
      visitCount: 1,
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
});

test('second_artist becomes eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 2, multiArtist: true, visitCount: 1 },
    visitor: {},
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'second_artist');
  assert.strictEqual(r.priority, TRIGGER_PRIORITY.second_artist);
});

test('return_visit becomes eligible with time separation', () => {
  const first = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const last = Date.now();
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 1, visitCount: 3 },
    visitor: {
      firstSeenAt: new Date(first).toISOString(),
      lastSeenAt: new Date(last).toISOString(),
      visitCount: 3,
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'return_visit');
});

test('repeat_show becomes eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 1, showAttendanceCount: 2, repeatShow: true },
    visitor: {},
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'repeat_show');
});

test('second_artist beats return_visit priority', () => {
  const first = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const r = selectPromptEligibility({
    signals: {
      joinedArtistCount: 2,
      multiArtist: true,
      visitCount: 4,
      showAttendanceCount: 0,
    },
    visitor: {
      firstSeenAt: new Date(first).toISOString(),
      lastSeenAt: new Date().toISOString(),
      visitCount: 4,
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.trigger, 'second_artist');
});

test('dismissal cooldown blocks same-strength re-prompt', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 2, multiArtist: true },
    visitor: {
      dismissCount: 1,
      lastPromptAt: new Date().toISOString(),
      lastPromptTrigger: 'second_artist',
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'cooldown');
});

test('authenticated_fan never eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 5, multiArtist: true },
    visitor: {},
    accountState: 'authenticated_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'already_authenticated');
});

test('prompts flag disables eligibility', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 2, multiArtist: true },
    visitor: {},
    accountState: 'known_fan',
    promptsFlagEnabled: false,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'prompts_disabled');
});

test('save_attempt context is eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 1 },
    visitor: {},
    currentContext: { saveAttempt: true, trigger: 'save_attempt' },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'save_attempt');
});

test('message_click context is eligible', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 1 },
    visitor: {},
    currentContext: { messageClick: true },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'message_click');
});

test('dismissCooldownMs grows with dismissals', () => {
  assert.ok(dismissCooldownMs(1) < dismissCooldownMs(2));
  assert.ok(dismissCooldownMs(2) < dismissCooldownMs(3));
});

test('authenticated_user (artist) never gets create-account prompt', () => {
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 3, multiArtist: true },
    visitor: {},
    accountState: 'authenticated_user',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'already_authenticated');
});

test('hard max prompt window blocks even when stronger trigger exists', () => {
  // Dismissed return_visit; second_artist is stronger, but lastPromptAt within 3 days
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 2, multiArtist: true, visitCount: 4 },
    visitor: {
      dismissCount: 1,
      lastPromptAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      lastPromptTrigger: 'return_visit',
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, false);
  assert.strictEqual(r.reason, 'cooldown');
});

test('after hard window, stronger trigger can beat dismiss cooldown', () => {
  // dismissCount=2 → 7-day dismiss cooldown; lastPromptAt 4 days ago → past hard 3-day window
  // second_artist vs last return_visit gap >= 20 → eligible despite remaining dismiss cooldown
  const r = selectPromptEligibility({
    signals: { joinedArtistCount: 2, multiArtist: true },
    visitor: {
      dismissCount: 2,
      lastPromptAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      lastPromptTrigger: 'return_visit',
    },
    accountState: 'known_fan',
    promptsFlagEnabled: true,
  });
  assert.strictEqual(r.eligible, true);
  assert.strictEqual(r.trigger, 'second_artist');
});

test('existing-user claim planner links unlinked fans by email', () => {
  const plan = planExistingUserClaims(
    [
      { id: 1, email: 'Nick@Example.COM', accountUserId: null },
      { id: 2, email: 'nobody@example.com', accountUserId: null },
      { id: 3, email: 'taken@example.com', accountUserId: 9 },
    ],
    new Map([
      ['nick@example.com', 44],
      ['taken@example.com', 9],
    ])
  );
  assert.deepStrictEqual(plan.toLink, [{ fanId: 1, userId: 44 }]);
  assert.strictEqual(plan.skippedNoUser, 1);
  assert.strictEqual(plan.skippedHasAccount, 1);
});

test('claim planner links unowned rows', () => {
  const plan = planFanClaimLinks(
    [
      { id: 1, accountUserId: null },
      { id: 2, accountUserId: null },
    ],
    99
  );
  assert.deepStrictEqual(plan.toLink, [1, 2]);
  assert.deepStrictEqual(plan.alreadyLinked, []);
  assert.deepStrictEqual(plan.skippedOwnedByOther, []);
});

test('claim planner is idempotent for already-linked rows', () => {
  const plan = planFanClaimLinks(
    [
      { id: 1, accountUserId: 99 },
      { id: 2, accountUserId: 99 },
    ],
    99
  );
  assert.deepStrictEqual(plan.toLink, []);
  assert.deepStrictEqual(plan.alreadyLinked, [1, 2]);
});

test('claim planner never steals another account\'s fans', () => {
  const plan = planFanClaimLinks(
    [
      { id: 1, accountUserId: null },
      { id: 2, accountUserId: 55 },
      { id: 3, accountUserId: 99 },
    ],
    99
  );
  assert.deepStrictEqual(plan.toLink, [1]);
  assert.deepStrictEqual(plan.alreadyLinked, [3]);
  assert.deepStrictEqual(plan.skippedOwnedByOther, [2]);
});

test('different userId cannot claim via planner ownership check', () => {
  const plan = planFanClaimLinks([{ id: 10, accountUserId: 1 }], 2);
  assert.deepStrictEqual(plan.toLink, []);
  assert.deepStrictEqual(plan.skippedOwnedByOther, [10]);
});

test('claim planner ignores status — removed/unsubscribed rows still linkable', () => {
  // Status is not part of planner input; claimFanRelationships loads all statuses.
  // This documents that ownership alone decides link vs skip.
  const plan = planFanClaimLinks(
    [
      { id: 1, accountUserId: null }, // would be status=removed in DB
      { id: 2, accountUserId: null }, // would be status=unsubscribed in DB
      { id: 3, accountUserId: null }, // subscribed
    ],
    7
  );
  assert.deepStrictEqual(plan.toLink, [1, 2, 3]);
});

test('normalizeEmail matches fan subscription canonicalization', () => {
  // Same trim+lowercase contract as api::fan.fan normalizeEmail
  assert.strictEqual(normalizeEmail('  Sarah@Example.COM '), 'sarah@example.com');
});

const {
  isFanAccountTestModeEnabled,
  shouldBypassMagicLinkRateLimit,
  parseTestEmailAllowlist,
} = require(path.join(__dirname, '../src/utils/fanAccountTestMode'));
const { buildFanVerifyUrl, LINK_TTL_MS } = fanAccount;

test('magic-link TTL is 30 minutes', () => {
  assert.strictEqual(LINK_TTL_MS, 30 * 60 * 1000);
});

test('verify URL is /fan/verify with encoded token and no open redirect', () => {
  const url = buildFanVerifyUrl('abc+/=', 'https://faneqo.com');
  assert.strictEqual(url, 'https://faneqo.com/fan/verify?token=abc%2B%2F%3D');
  assert.ok(url.startsWith('https://faneqo.com/fan/verify?'));
  assert.ok(!url.includes('//evil'));
});

test('parseTestEmailAllowlist splits and lowercases', () => {
  assert.deepStrictEqual(parseTestEmailAllowlist('A@Example.com, b@test.com'), [
    'a@example.com',
    'b@test.com',
  ]);
});

test('production NODE_ENV never enables test mode even if flag is true', () => {
  assert.strictEqual(
    isFanAccountTestModeEnabled({ nodeEnv: 'production', flag: 'true' }),
    false
  );
  assert.strictEqual(
    shouldBypassMagicLinkRateLimit({
      email: 'test@example.com',
      nodeEnv: 'production',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    false
  );
});

test('test mode + allowlisted email bypasses only in non-production', () => {
  assert.strictEqual(
    shouldBypassMagicLinkRateLimit({
      email: 'test@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    true
  );
});

test('test mode does not bypass non-allowlisted emails', () => {
  assert.strictEqual(
    shouldBypassMagicLinkRateLimit({
      email: 'other@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: 'test@example.com',
    }),
    false
  );
});

test('test mode with empty allowlist does not bypass', () => {
  assert.strictEqual(
    shouldBypassMagicLinkRateLimit({
      email: 'test@example.com',
      nodeEnv: 'development',
      flag: 'true',
      allowlist: '',
    }),
    false
  );
});

test('test flag off never bypasses in development', () => {
  assert.strictEqual(
    shouldBypassMagicLinkRateLimit({
      email: 'test@example.com',
      nodeEnv: 'development',
      flag: '',
      allowlist: 'test@example.com',
    }),
    false
  );
});

console.log(`\n${passed} tests passed.\n`);
