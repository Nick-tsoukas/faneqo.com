'use strict';

/**
 * Fan Account Conversion — magic-link auth + relationship claim + prompt engine.
 *
 * One users-permissions identity. Optional fan-profile. Artists may also be fans.
 * Claim only after verified email ownership. Lane 1 transactional mail only.
 *
 * Email-change policy (future): claiming keys off the verified email at claim time.
 * If an auth user's login email later changes, do NOT automatically unlink historical
 * fan.accountUser links. Re-claim / merge policy is a separate product decision.
 */

const crypto = require('crypto');
const fanIdentity = require('./fanIdentity');
const { followReadModel } = require('./fans/fanFollow');
const { createFanProfileService } = require('./fanProfile/fanProfileService');
const { sanitizeFanReturnTo, resolveMagicLinkRedirect } = require('./fanReturnTo');
const {
  isFanAccountTestModeEnabled,
  shouldBypassMagicLinkRateLimit,
} = require('./fanAccountTestMode');

const DAY_MS = 24 * 60 * 60 * 1000;
const LINK_TTL_MS = 30 * 60 * 1000; // 30 minutes
const HARD_PROMPT_WINDOW_MS = 3 * DAY_MS;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 3;

/** Relative strength — one best prompt per moment. */
const TRIGGER_PRIORITY = {
  second_artist: 90,
  repeat_show: 80,
  message_click: 70,
  return_visit: 50,
  save_attempt: 40,
};

const TRIGGER_ALIASES = {
  repeat_show_engagement: 'repeat_show',
  multi_artist: 'second_artist',
};

function normalizeTrigger(trigger) {
  if (!trigger || typeof trigger !== 'string') return null;
  const t = trigger.trim().toLowerCase();
  return TRIGGER_ALIASES[t] || t;
}

function normalizeEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const n = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n)) return null;
  return n;
}

function maskEmail(email) {
  const n = normalizeEmail(email);
  if (!n) return null;
  const [local, domain] = n.split('@');
  if (!local || !domain) return null;
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

function mintRawToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function mintRandomPassword() {
  return crypto.randomBytes(32).toString('base64url');
}

function siteUrl() {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, '');
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  return `https://${process.env.PUBLIC_HOSTNAME || 'faneqo.com'}`;
}

function buildFanVerifyUrl(rawToken, base = siteUrl()) {
  const origin = String(base || '').replace(/\/$/, '');
  return `${origin}/fan/verify?token=${encodeURIComponent(String(rawToken || ''))}`;
}

function promptsEnabled() {
  const v = String(process.env.FAN_ACCOUNT_PROMPTS_ENABLED || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function dismissCooldownMs(dismissCount) {
  if (dismissCount <= 0) return 0;
  if (dismissCount === 1) return 3 * DAY_MS;
  if (dismissCount === 2) return 7 * DAY_MS;
  return 21 * DAY_MS;
}

function priorityOf(trigger) {
  const t = normalizeTrigger(trigger);
  return t && TRIGGER_PRIORITY[t] != null ? TRIGGER_PRIORITY[t] : 0;
}

/**
 * Pure eligibility selection (testable without Strapi).
 */
function selectPromptEligibility({
  signals = {},
  visitor = {},
  currentContext = {},
  accountState = 'anonymous',
  promptsFlagEnabled = true,
} = {}) {
  if (accountState === 'authenticated_fan' || accountState === 'authenticated_user') {
    return {
      eligible: false,
      trigger: null,
      priority: 0,
      cooldownRemaining: 0,
      presentation: null,
      reason: 'already_authenticated',
      context: {},
    };
  }

  if (!promptsFlagEnabled) {
    return {
      eligible: false,
      trigger: null,
      priority: 0,
      cooldownRemaining: 0,
      presentation: null,
      reason: 'prompts_disabled',
      context: {
        joinedArtistCount: signals.joinedArtistCount || 0,
      },
    };
  }

  const joinedArtistCount = signals.joinedArtistCount || 0;
  const showAttendanceCount = signals.showAttendanceCount || 0;
  const visitCount = signals.visitCount || 1;
  const firstSeenAt = visitor.firstSeenAt ? new Date(visitor.firstSeenAt).getTime() : null;
  const lastSeenAt = visitor.lastSeenAt ? new Date(visitor.lastSeenAt).getTime() : null;

  const returnVisit =
    !!signals.returnVisit ||
    (visitCount >= 2 &&
      firstSeenAt != null &&
      lastSeenAt != null &&
      lastSeenAt - firstSeenAt >= DAY_MS * 0.75);

  const candidates = [];

  if (joinedArtistCount >= 2 || signals.multiArtist) {
    candidates.push({ trigger: 'second_artist', priority: TRIGGER_PRIORITY.second_artist });
  }
  if (showAttendanceCount >= 2 || signals.repeatShow) {
    candidates.push({ trigger: 'repeat_show', priority: TRIGGER_PRIORITY.repeat_show });
  }
  if (currentContext.trigger === 'message_click' || currentContext.messageClick) {
    candidates.push({ trigger: 'message_click', priority: TRIGGER_PRIORITY.message_click });
  }
  if (returnVisit) {
    candidates.push({ trigger: 'return_visit', priority: TRIGGER_PRIORITY.return_visit });
  }
  if (currentContext.trigger === 'save_attempt' || currentContext.saveAttempt) {
    candidates.push({ trigger: 'save_attempt', priority: TRIGGER_PRIORITY.save_attempt });
  }

  if (!candidates.length) {
    return {
      eligible: false,
      trigger: null,
      priority: 0,
      cooldownRemaining: 0,
      presentation: null,
      reason: 'no_trigger',
      context: { joinedArtistCount, showAttendanceCount, visitCount },
    };
  }

  candidates.sort((a, b) => b.priority - a.priority);
  const best = candidates[0];

  const dismissCount = visitor.dismissCount || 0;
  const lastPromptAt = visitor.lastPromptAt ? new Date(visitor.lastPromptAt).getTime() : null;
  const lastPromptTrigger = normalizeTrigger(visitor.lastPromptTrigger);
  const now = Date.now();

  let cooldownRemaining = 0;
  let cooldownActive = false;

  if (lastPromptAt) {
    const since = now - lastPromptAt;
    // Hard max: at most one modal in a multi-day window
    if (since < HARD_PROMPT_WINDOW_MS) {
      cooldownActive = true;
      cooldownRemaining = Math.max(cooldownRemaining, HARD_PROMPT_WINDOW_MS - since);
    }

    const dismissCd = dismissCooldownMs(dismissCount);
    if (dismissCount > 0 && since < dismissCd) {
      // Stronger trigger may become eligible sooner (priority gap ≥ 20)
      const lastPri = priorityOf(lastPromptTrigger);
      const gap = best.priority - lastPri;
      if (gap < 20) {
        cooldownActive = true;
        cooldownRemaining = Math.max(cooldownRemaining, dismissCd - since);
      }
    }
  }

  if (cooldownActive) {
    return {
      eligible: false,
      trigger: best.trigger,
      priority: best.priority,
      cooldownRemaining: Math.ceil(cooldownRemaining / 1000),
      presentation: null,
      reason: 'cooldown',
      context: {
        joinedArtistCount,
        showAttendanceCount,
        visitCount,
        artistNames: Array.isArray(currentContext.artistNames)
          ? currentContext.artistNames.slice(0, 5)
          : [],
      },
    };
  }

  const presentation =
    best.priority >= TRIGGER_PRIORITY.message_click ? 'modal' : 'inline';

  return {
    eligible: true,
    trigger: best.trigger,
    priority: best.priority,
    cooldownRemaining: 0,
    presentation,
    reason: null,
    context: {
      joinedArtistCount,
      showAttendanceCount,
      visitCount,
      artistNames: Array.isArray(currentContext.artistNames)
        ? currentContext.artistNames.slice(0, 5)
        : [],
      bandName: currentContext.bandName || null,
    },
  };
}

async function resolveAccountState({ visitor, userId }) {
  if (userId) {
    const profile = (
      await strapi.entityService.findMany('api::fan-profile.fan-profile', {
        filters: { user: userId },
        limit: 1,
        fields: ['id'],
      })
    )[0];
    if (profile) return 'authenticated_fan';

    // Authenticated artist/team user without fan profile yet — still not anonymous.
    // Treat as known for prompt suppression of "create account" if already logged in;
    // they can acquire a fan profile via magic link / claim on same email.
    return 'authenticated_user';
  }

  const joined = visitor?.id ? await fanIdentity.countJoinedArtists(visitor.id) : 0;
  if (joined > 0) return 'known_fan';
  return 'anonymous';
}

async function getSafeArtistNamesForVisitor(visitorEntityId) {
  if (!visitorEntityId) return [];
  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      visitor: visitorEntityId,
      status: { $ne: 'removed' },
    },
    fields: ['id'],
    populate: { band: { fields: ['id', 'name'] } },
    limit: 20,
  });

  const names = [];
  const seen = new Set();
  for (const fan of fans || []) {
    const name = fan.band?.name;
    const id = fan.band?.id;
    if (!name || !id) continue;
    const key = String(id);
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(String(name));
    if (names.length >= 5) break;
  }
  return names;
}

/**
 * Centralized eligibility service.
 */
async function getFanAccountPromptEligibility({
  visitorToken,
  currentContext = {},
  userId = null,
} = {}) {
  let visitor = null;
  if (fanIdentity.isValidVisitorToken(visitorToken)) {
    visitor = await fanIdentity.findVisitorByToken(visitorToken);
  }

  const accountState = await resolveAccountState({ visitor, userId });

  // Authenticated fans never see conversion prompts
  if (accountState === 'authenticated_fan') {
    return {
      eligible: false,
      trigger: null,
      priority: 0,
      cooldownRemaining: 0,
      presentation: null,
      reason: 'already_authenticated',
      accountState,
      context: {},
    };
  }

  // Already logged-in artist/team: skip "create account" prompt (they can claim via dedicated path later)
  if (accountState === 'authenticated_user') {
    return {
      eligible: false,
      trigger: null,
      priority: 0,
      cooldownRemaining: 0,
      presentation: null,
      reason: 'already_authenticated',
      accountState,
      context: {},
    };
  }

  const joinedArtistCount = visitor ? await fanIdentity.countJoinedArtists(visitor.id) : 0;
  const showAttendanceCount = visitor ? await fanIdentity.countShowAttendances(visitor.id) : 0;
  const artistNames = visitor ? await getSafeArtistNamesForVisitor(visitor.id) : [];

  const signals = {
    joinedArtistCount,
    showAttendanceCount,
    visitCount: visitor?.visitCount || 0,
    multiArtist: joinedArtistCount >= 2,
    repeatShow: showAttendanceCount >= 2,
    returnVisit: false,
  };

  const result = selectPromptEligibility({
    signals,
    visitor: visitor || {},
    currentContext: { ...currentContext, artistNames },
    accountState,
    promptsFlagEnabled: promptsEnabled(),
  });

  return {
    ...result,
    accountState,
  };
}

async function recordPromptEvent({ visitorToken, trigger, dismissed = false }) {
  if (!fanIdentity.isValidVisitorToken(visitorToken)) {
    return { ok: false, error: 'invalid_visitor' };
  }
  const visitor = await fanIdentity.findVisitorByToken(visitorToken);
  if (!visitor) return { ok: false, error: 'visitor_not_found' };

  const now = new Date().toISOString();
  const data = {
    lastPromptAt: now,
    lastPromptTrigger: normalizeTrigger(trigger) || trigger || null,
  };
  if (dismissed) {
    data.dismissCount = (visitor.dismissCount || 0) + 1;
  }

  await strapi.entityService.update('api::fan-visitor.fan-visitor', visitor.id, { data });
  return { ok: true };
}

/**
 * Resolve email for magic-link without trusting arbitrary fan IDs.
 * Prefer client email when provided; else single unique email from visitor-linked fans.
 */
async function resolveEmailForRequest({ visitorToken, email }) {
  const provided = normalizeEmail(email);
  if (provided) return { email: provided, source: 'client' };

  if (!fanIdentity.isValidVisitorToken(visitorToken)) {
    return { email: null, source: null, error: 'email_required' };
  }

  const visitor = await fanIdentity.findVisitorByToken(visitorToken);
  if (!visitor) return { email: null, source: null, error: 'email_required' };

  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      visitor: visitor.id,
      status: { $ne: 'removed' },
    },
    fields: ['id', 'email'],
    limit: 50,
  });

  const emails = new Set();
  for (const fan of fans || []) {
    const n = normalizeEmail(fan.email);
    if (n) emails.add(n);
  }

  if (emails.size === 1) {
    return { email: [...emails][0], source: 'visitor_fan' };
  }

  // Ambiguous or none — client must supply email (no enumeration of which)
  return { email: null, source: null, error: 'email_required' };
}

async function assertRateLimit({ email, visitorKeyHash, fingerprint }) {
  if (shouldBypassMagicLinkRateLimit({ email })) {
    strapi.log.info('[Fan Account Test] magic-link requested for allowlisted test user');
    return { ok: true, bypassed: true };
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
  // Count every request in the window (pending/used/expired). Status=pending
  // only would never throttle same-email retries because prior links are expired.
  const windowFilter = { createdAt: { $gte: since } };

  const byEmail = await strapi.entityService.count('api::fan-account-link.fan-account-link', {
    filters: { ...windowFilter, email },
  });
  if (byEmail >= RATE_LIMIT_MAX) {
    return { ok: false, error: 'rate_limited' };
  }

  if (fingerprint) {
    const byFp = await strapi.entityService.count('api::fan-account-link.fan-account-link', {
      filters: { ...windowFilter, requestFingerprint: fingerprint },
    });
    if (byFp >= RATE_LIMIT_MAX) {
      return { ok: false, error: 'rate_limited' };
    }
  }

  if (visitorKeyHash) {
    const byVis = await strapi.entityService.count('api::fan-account-link.fan-account-link', {
      filters: { ...windowFilter, visitorKeyHash },
    });
    if (byVis >= RATE_LIMIT_MAX) {
      return { ok: false, error: 'rate_limited' };
    }
  }

  return { ok: true };
}

async function sendMagicLinkEmail({ to, verifyUrl }) {
  const from = process.env.EMAIL_DEFAULT_FROM || 'Faneqo <noreply@mail.faneqo.com>';
  const replyTo = process.env.EMAIL_DEFAULT_REPLY_TO || from;
  const subject = 'Your Faneqo sign-in link';

  const text = [
    "You're one click away from keeping your artists and messages together.",
    '',
    'Continue to Faneqo:',
    verifyUrl,
    '',
    'This link expires in 30 minutes and can only be used once.',
    '',
    'If you did not request this, you can ignore this email.',
    '',
    '— Faneqo',
  ].join('\n');

  const html = `
<div style="font-family:ui-sans-serif,system-ui,Arial;line-height:1.6;color:#111827;max-width:520px;">
  <p style="margin:0 0 16px;">You're one click away from keeping your artists and messages together.</p>
  <p style="margin:0 0 20px;">
    <a href="${verifyUrl}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
      Continue to Faneqo
    </a>
  </p>
  <p style="margin:0;color:#6b7280;font-size:12px;">This link expires in 30 minutes and can only be used once.</p>
</div>`.trim();

  await strapi.plugin('email').service('email').send({
    to,
    from,
    replyTo,
    reply_to: replyTo,
    subject,
    text,
    html,
  });
}

async function requestMagicLink({
  visitorToken,
  email,
  trigger,
  fingerprint,
  returnTo,
} = {}) {
  const resolved = await resolveEmailForRequest({ visitorToken, email });
  if (!resolved.email) {
    // Need an address to send to — do not reveal whether visitor matches fan lists
    return {
      ok: false,
      error: 'email_required',
      message: 'Enter the email you use with artists on Faneqo.',
    };
  }

  const normalized = resolved.email;
  const visitorKeyHash = fanIdentity.isValidVisitorToken(visitorToken)
    ? fanIdentity.hashVisitorToken(visitorToken)
    : null;

  const limit = await assertRateLimit({
    email: normalized,
    visitorKeyHash,
    fingerprint: fingerprint || null,
  });
  if (!limit.ok) {
    // Same generic copy as success path — avoid timing/enumeration tells where practical
    return {
      ok: true,
      generic: true,
      rateLimited: true,
      message: 'If that email can be used, we have sent a link.',
      emailMasked: maskEmail(normalized),
      expiresInSeconds: Math.floor(LINK_TTL_MS / 1000),
    };
  }

  // Expire any prior pending links for this email
  const prior = await strapi.entityService.findMany('api::fan-account-link.fan-account-link', {
    filters: { email: normalized, status: 'pending' },
    fields: ['id'],
    limit: 20,
  });
  for (const row of prior || []) {
    await strapi.entityService.update('api::fan-account-link.fan-account-link', row.id, {
      data: { status: 'expired' },
    });
  }

  const rawToken = mintRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();

  await strapi.entityService.create('api::fan-account-link.fan-account-link', {
    data: {
      email: normalized,
      tokenHash,
      visitorKeyHash,
      status: 'pending',
      expiresAt,
      trigger: normalizeTrigger(trigger) || null,
      requestFingerprint: fingerprint || null,
      returnTo: sanitizeFanReturnTo(returnTo, { fallback: null }),
    },
  });

  const verifyUrl = buildFanVerifyUrl(rawToken);

  try {
    await sendMagicLinkEmail({ to: normalized, verifyUrl });
  } catch (err) {
    strapi.log.error('[FanAccount] magic-link email failed:', err);
    // Still generic to the client — do not confirm mailbox existence via error shape
    return {
      ok: true,
      generic: true,
      message: 'If that email can be used, we have sent a link.',
      emailMasked: maskEmail(normalized),
      expiresInSeconds: Math.floor(LINK_TTL_MS / 1000),
    };
  }

  return {
    ok: true,
    generic: true,
    message: 'If that email can be used, we have sent a link.',
    emailMasked: maskEmail(normalized),
    expiresInSeconds: Math.floor(LINK_TTL_MS / 1000),
  };
}

/**
 * Delegates to the canonical ensure primitive so there is exactly one
 * find-or-create path for FanProfile. Behavior is unchanged: idempotent, still
 * seeds claimedArtistCount 0, and still never sets profileCompletedAt.
 */
async function ensureFanProfile(userId) {
  return createFanProfileService(strapi).ensureForUser(userId);
}

async function findUserByEmail(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;
  const exact = await strapi.db.query('plugin::users-permissions.user').findOne({
    where: { email: normalized },
  });
  if (exact) return exact;
  const rows = await strapi.entityService.findMany('plugin::users-permissions.user', {
    filters: { email: { $eqi: normalized } },
    fields: ['id', 'email', 'username', 'confirmed', 'blocked'],
    limit: 2,
  });
  return rows?.[0] || null;
}

async function findOrCreateUserByEmail(email) {
  const normalized = normalizeEmail(email);
  const existing = await findUserByEmail(normalized);
  if (existing) {
    // Ensure confirmed for magic-link verified ownership
    if (!existing.confirmed) {
      await strapi.entityService.update('plugin::users-permissions.user', existing.id, {
        data: { confirmed: true },
      });
    }
    return { user: existing, created: false };
  }

  const authRole = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: 'authenticated' },
  });
  if (!authRole) {
    throw new Error('Authenticated role not found');
  }

  // No Stripe trial. Random password — magic link is the credential for V1 fans.
  const usernameBase = normalized.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 24) || 'fan';
  let username = usernameBase;
  let attempt = 0;
  while (attempt < 5) {
    const clash = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { username },
    });
    if (!clash) break;
    username = `${usernameBase}${crypto.randomBytes(2).toString('hex')}`;
    attempt += 1;
  }

  const user = await strapi.plugins['users-permissions'].services.user.add({
    username,
    email: normalized,
    password: mintRandomPassword(),
    provider: 'local',
    confirmed: true,
    role: authRole.id,
    // Fan identity is not artist billing. Never grant Pro via schema default.
    subscriptionStatus: 'unpaid',
  });

  return { user, created: true };
}

/**
 * Pure claim planner (testable): which fan rows to link for a verified user.
 * Never steals rows owned by another accountUser.
 */
function planFanClaimLinks(fans, userId) {
  const toLink = [];
  const alreadyLinked = [];
  const skippedOwnedByOther = [];

  for (const fan of fans || []) {
    if (!fan?.id) continue;
    const current = fan.accountUserId ?? fan.accountUser?.id ?? fan.accountUser ?? null;
    if (current && String(current) === String(userId)) {
      alreadyLinked.push(fan.id);
      continue;
    }
    if (current && String(current) !== String(userId)) {
      skippedOwnedByOther.push(fan.id);
      continue;
    }
    toLink.push(fan.id);
  }

  return { toLink, alreadyLinked, skippedOwnedByOther };
}

/**
 * Match unlinked fan rows to existing Faneqo users by email.
 * Same identity rule as claimFanRelationships — never logs email.
 */
function planExistingUserClaims(fans, emailToUserId) {
  const toLink = [];
  let skippedHasAccount = 0;
  let skippedNoUser = 0;
  const lookup =
    emailToUserId instanceof Map
      ? emailToUserId
      : new Map(Object.entries(emailToUserId || {}));

  for (const fan of fans || []) {
    if (!fan?.id) continue;
    const current = fan.accountUserId ?? fan.accountUser?.id ?? fan.accountUser ?? null;
    if (current) {
      skippedHasAccount += 1;
      continue;
    }
    const email = normalizeEmail(fan.email);
    if (!email) {
      skippedNoUser += 1;
      continue;
    }
    const userId = lookup.get(email);
    if (!userId) {
      skippedNoUser += 1;
      continue;
    }
    toLink.push({ fanId: fan.id, userId });
  }

  return { toLink, skippedHasAccount, skippedNoUser };
}

/**
 * Lazy-claim: if a fan email already belongs to a users-permissions user,
 * they are a Faneqo member. Artist login never claimed these rows; magic-link
 * verify and GET /fan-account/artists did. Opening Inbox should not require
 * a separate /fan visit.
 */
async function claimUnlinkedFansByExistingUsers({ bandId, limit = 200 } = {}) {
  const bid = Number(bandId);
  if (!bid) return { scanned: 0, claimed: 0 };

  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      band: bid,
      status: { $ne: 'removed' },
    },
    fields: ['id', 'email'],
    populate: { accountUser: { fields: ['id'] } },
    limit: Math.min(500, Math.max(1, parseInt(limit, 10) || 200)),
  });

  const unlinked = (fans || []).filter((fan) => !(fan.accountUser?.id || fan.accountUser));
  const scanned = unlinked.length;
  if (!scanned) return { scanned: 0, claimed: 0 };

  const emails = [...new Set(unlinked.map((fan) => normalizeEmail(fan.email)).filter(Boolean))];
  const emailToUserId = new Map();
  for (const email of emails) {
    const user = await findUserByEmail(email);
    if (user?.id) emailToUserId.set(email, user.id);
  }

  const plan = planExistingUserClaims(
    unlinked.map((fan) => ({
      id: fan.id,
      email: fan.email,
      accountUserId: fan.accountUser?.id || fan.accountUser || null,
    })),
    emailToUserId
  );

  for (const row of plan.toLink) {
    await strapi.entityService.update('api::fan.fan', row.fanId, {
      data: { accountUser: row.userId },
    });
  }

  if (plan.toLink.length) {
    strapi.log.info('[FanAccount] claimed existing users onto fan rows', {
      bandId: bid,
      scanned,
      claimed: plan.toLink.length,
    });
  }

  return { scanned, claimed: plan.toLink.length };
}

/**
 * Idempotent claim: link ALL matching fan rows (any status) to accountUser.
 *
 * Includes subscribed / unsubscribed / removed — account linking ≠ campaign eligibility.
 * Only writes accountUser. Never changes status, never reactivates mailing, never
 * recreates rows or migrates fan-show-attendance.
 */
async function claimFanRelationships(userId, email) {
  const normalized = normalizeEmail(email);
  if (!userId || !normalized) {
    return { claimed: 0, alreadyLinked: 0, skippedOwnedByOther: 0, fanIds: [], artistCount: 0 };
  }

  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      email: { $eqi: normalized },
    },
    fields: ['id', 'status'],
    populate: { accountUser: { fields: ['id'] }, band: { fields: ['id'] } },
    limit: 500,
  });

  const plan = planFanClaimLinks(
    (fans || []).map((f) => ({
      id: f.id,
      accountUserId: f.accountUser?.id || f.accountUser || null,
    })),
    userId
  );

  if (plan.skippedOwnedByOther.length) {
    strapi.log.warn('[FanAccount] claim conflict — leaving rows owned by another account', {
      userId,
      skippedCount: plan.skippedOwnedByOther.length,
    });
  }

  for (const fanId of plan.toLink) {
    // accountUser only — do not touch status / unsubscribe / suppression fields
    await strapi.entityService.update('api::fan.fan', fanId, {
      data: { accountUser: userId },
    });
    try {
      const row = (fans || []).find((f) => Number(f.id) === Number(fanId));
      const bandId = row?.band?.id || row?.band;
      const { producePassportClaimed } = require('./relationshipEvents/relationshipEventProducers');
      await producePassportClaimed(strapi, {
        fanId,
        bandId,
        accountUserId: userId,
      });
    } catch (err) {
      strapi.log.warn(`[RelationshipEvent] passport_claimed skipped: ${err.message}`);
    }
  }

  const claimed = plan.toLink.length;
  const alreadyLinked = plan.alreadyLinked.length;
  const fanIds = [...plan.alreadyLinked, ...plan.toLink];

  // Distinct bands across all linked relationships (including removed)
  const withBands = await strapi.entityService.findMany('api::fan.fan', {
    filters: { accountUser: userId },
    fields: ['id'],
    populate: { band: { fields: ['id'] } },
    limit: 500,
  });
  const bandIds = new Set();
  for (const f of withBands || []) {
    const bid = f.band?.id || f.band;
    if (bid) bandIds.add(String(bid));
  }

  // Use the canonical (lowest-id) row the ensure primitive just resolved.
  // A second unordered findMany could write bookkeeping onto a duplicate.
  const profile = await ensureFanProfile(userId);
  if (profile?.id) {
    await strapi.entityService.update('api::fan-profile.fan-profile', profile.id, {
      data: {
        claimedArtistCount: bandIds.size,
        lastClaimedAt: new Date().toISOString(),
      },
    });
  }

  return {
    claimed,
    alreadyLinked,
    skippedOwnedByOther: plan.skippedOwnedByOther.length,
    fanIds,
    artistCount: bandIds.size,
  };
}

/** Spec name: claimFanRelationshipsForUser(user) */
async function claimFanRelationshipsForUser(user) {
  if (!user?.id) {
    return { claimed: 0, alreadyLinked: 0, skippedOwnedByOther: 0, fanIds: [], artistCount: 0 };
  }
  return claimFanRelationships(user.id, user.email);
}

async function linkVisitorToAccount({ visitorKeyHash, userId }) {
  if (!visitorKeyHash || !userId) return { linked: false };

  const visitors = await strapi.entityService.findMany('api::fan-visitor.fan-visitor', {
    filters: { visitorKeyHash },
    limit: 1,
    fields: ['id'],
    populate: { accountUser: { fields: ['id'] } },
  });
  const visitor = visitors[0];
  if (!visitor) return { linked: false };

  const current = visitor.accountUser?.id || visitor.accountUser;
  if (current && String(current) === String(userId)) {
    return { linked: true, already: true };
  }
  // Prefer first authenticated owner; do not steal another account's visitor
  if (current) return { linked: false, reason: 'visitor_claimed' };

  await strapi.entityService.update('api::fan-visitor.fan-visitor', visitor.id, {
    data: { accountUser: userId },
  });
  return { linked: true, already: false };
}

async function verifyMagicLink({ rawToken }) {
  if (!rawToken || typeof rawToken !== 'string' || rawToken.length < 16) {
    return { ok: false, error: 'invalid_token' };
  }

  const tokenHash = hashToken(rawToken.trim());
  const rows = await strapi.entityService.findMany('api::fan-account-link.fan-account-link', {
    filters: { tokenHash },
    limit: 1,
    fields: ['id', 'email', 'status', 'expiresAt', 'usedAt', 'visitorKeyHash', 'trigger', 'returnTo'],
  });
  const link = rows[0];
  if (!link) return { ok: false, error: 'invalid_token' };

  if (link.status === 'used') {
    return { ok: false, error: 'token_used' };
  }
  if (link.status === 'expired') {
    return { ok: false, error: 'token_expired' };
  }

  const exp = link.expiresAt ? new Date(link.expiresAt).getTime() : 0;
  if (!exp || Date.now() > exp) {
    await strapi.entityService.update('api::fan-account-link.fan-account-link', link.id, {
      data: { status: 'expired' },
    });
    return { ok: false, error: 'token_expired' };
  }

  // Mark used immediately (one-time) before side effects
  await strapi.entityService.update('api::fan-account-link.fan-account-link', link.id, {
    data: {
      status: 'used',
      usedAt: new Date().toISOString(),
    },
  });

  const { user, created } = await findOrCreateUserByEmail(link.email);
  await ensureFanProfile(user.id);
  const claim = await claimFanRelationships(user.id, link.email);

  if (link.visitorKeyHash) {
    await linkVisitorToAccount({ visitorKeyHash: link.visitorKeyHash, userId: user.id });
  }

  const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

  return {
    ok: true,
    jwt,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    created,
    claim,
    redirectTo: resolveMagicLinkRedirect(link.returnTo),
  };
}

async function getMeStatus({ userId, visitorToken }) {
  if (userId) {
    const profile = (
      await strapi.entityService.findMany('api::fan-profile.fan-profile', {
        filters: { user: userId },
        fields: ['id', 'claimedArtistCount', 'lastClaimedAt'],
        sort: { id: 'asc' },
        limit: 1,
      })
    )[0];

    const linkedArtistCount = profile?.claimedArtistCount || 0;
    const fanAccount = !!profile;

    if (profile) {
      return {
        authenticated: true,
        fanAccount: true,
        accountState: 'authenticated_fan',
        linkedArtistCount,
        claimedArtistCount: linkedArtistCount,
        hasFanProfile: true,
      };
    }

    return {
      authenticated: true,
      fanAccount: false,
      accountState: 'authenticated_user',
      linkedArtistCount: 0,
      claimedArtistCount: 0,
      hasFanProfile: false,
    };
  }

  let visitor = null;
  if (fanIdentity.isValidVisitorToken(visitorToken)) {
    visitor = await fanIdentity.findVisitorByToken(visitorToken);
  }
  const joined = visitor ? await fanIdentity.countJoinedArtists(visitor.id) : 0;
  return {
    authenticated: false,
    fanAccount: false,
    accountState: joined > 0 ? 'known_fan' : 'anonymous',
    linkedArtistCount: 0,
    claimedArtistCount: 0,
    hasFanProfile: false,
  };
}

/**
 * Self-scoped "artists I follow" for the authenticated fan.
 * Public band fields only — never another band's Fan Intelligence.
 * Excludes removed from the follow list; unsubscribed remains visible as history.
 */
async function listClaimedArtists(userId) {
  if (!userId) return [];
  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      accountUser: userId,
      status: { $ne: 'removed' },
    },
    fields: ['id', 'status', 'subscribedAt', 'followedAt', 'unfollowedAt'],
    populate: {
      band: {
        fields: ['id', 'name', 'slug'],
        populate: { bandImg: { fields: ['url'] } },
      },
    },
    limit: 100,
  });

  const out = [];
  const seen = new Set();
  for (const fan of fans || []) {
    const band = fan.band;
    if (!band?.id || seen.has(String(band.id))) continue;
    seen.add(String(band.id));
    const follow = followReadModel(fan);
    out.push({
      bandId: band.id,
      name: band.name,
      slug: band.slug,
      logoUrl: band.bandImg?.url || null,
      status: fan.status || null,
      subscribedAt: fan.subscribedAt || null,
      isFollowing: follow.isFollowing,
      followedAt: follow.followedAt,
    });
  }
  return out;
}

module.exports = {
  TRIGGER_PRIORITY,
  LINK_TTL_MS,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  normalizeEmail,
  maskEmail,
  normalizeTrigger,
  hashToken,
  siteUrl,
  buildFanVerifyUrl,
  selectPromptEligibility,
  dismissCooldownMs,
  promptsEnabled,
  isFanAccountTestModeEnabled,
  shouldBypassMagicLinkRateLimit,
  planFanClaimLinks,
  planExistingUserClaims,
  getFanAccountPromptEligibility,
  recordPromptEvent,
  requestMagicLink,
  verifyMagicLink,
  claimFanRelationships,
  claimFanRelationshipsForUser,
  claimUnlinkedFansByExistingUsers,
  findUserByEmail,
  findOrCreateUserByEmail,
  ensureFanProfile,
  getMeStatus,
  listClaimedArtists,
  resolveEmailForRequest,
  sanitizeFanReturnTo,
  resolveMagicLinkRedirect,
};
