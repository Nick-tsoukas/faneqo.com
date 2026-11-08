'use strict';

/**
 * Anonymous first-party fan visitor identity helpers.
 *
 * Browser holds an opaque raw token (`_vid`).
 * Server stores only SHA-256(pepper + token). Token is recognition, not auth.
 */

const crypto = require('crypto');

const MAX_TOKEN_LEN = 128;
const MIN_TOKEN_LEN = 16;

function getPepper() {
  return String(process.env.FAN_VISITOR_PEPPER || '');
}

function isValidVisitorToken(raw) {
  if (typeof raw !== 'string') return false;
  const token = raw.trim();
  if (token.length < MIN_TOKEN_LEN || token.length > MAX_TOKEN_LEN) return false;
  // UUID / hex / url-safe opaque strings only — reject obvious injection noise.
  return /^[A-Za-z0-9._~-]+$/.test(token);
}

function hashVisitorToken(raw) {
  const token = String(raw || '').trim();
  return crypto.createHash('sha256').update(`${getPepper()}${token}`).digest('hex');
}

/** Cryptographically random opaque token for new browsers. */
function mintVisitorToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Resolve visitor by raw token hash, or create a new visitor for a mint/new token.
 * @param {{ token?: string|null, incrementVisit?: boolean }} args
 */
async function establishVisitorSession({ token = null, incrementVisit = true } = {}) {
  const now = new Date().toISOString();
  let rawToken = isValidVisitorToken(token) ? String(token).trim() : null;
  let isNew = false;

  if (!rawToken) {
    rawToken = mintVisitorToken();
    isNew = true;
  }

  const visitorKeyHash = hashVisitorToken(rawToken);

  let visitor = (
    await strapi.entityService.findMany('api::fan-visitor.fan-visitor', {
      filters: { visitorKeyHash },
      limit: 1,
      fields: [
        'id',
        'firstSeenAt',
        'lastSeenAt',
        'visitCount',
        'lastPromptAt',
        'lastPromptTrigger',
        'dismissCount',
      ],
    })
  )[0];

  if (!visitor) {
    // Client sent a token we have never seen — treat as new identity for that token.
    isNew = true;
    visitor = await strapi.entityService.create('api::fan-visitor.fan-visitor', {
      data: {
        visitorKeyHash,
        firstSeenAt: now,
        lastSeenAt: now,
        visitCount: 1,
        dismissCount: 0,
      },
    });
  } else if (incrementVisit) {
    // Touch lastSeen always; bump visitCount at most once per 30 minutes
    // so SPA navigations don't inflate return-visit signals.
    const last = visitor.lastSeenAt ? new Date(visitor.lastSeenAt).getTime() : 0;
    const shouldBumpVisit = !last || Date.now() - last > 30 * 60 * 1000;
    visitor = await strapi.entityService.update('api::fan-visitor.fan-visitor', visitor.id, {
      data: {
        lastSeenAt: now,
        ...(shouldBumpVisit ? { visitCount: (visitor.visitCount || 1) + 1 } : {}),
      },
    });
  }

  const joinedArtistCount = await countJoinedArtists(visitor.id);
  const showAttendanceCount = await countShowAttendances(visitor.id);

  return {
    rawToken,
    isNew,
    visitor,
    joinedArtistCount,
    showAttendanceCount,
  };
}

async function findVisitorByToken(token) {
  if (!isValidVisitorToken(token)) return null;
  const visitorKeyHash = hashVisitorToken(token);
  const rows = await strapi.entityService.findMany('api::fan-visitor.fan-visitor', {
    filters: { visitorKeyHash },
    limit: 1,
    fields: ['id', 'firstSeenAt', 'lastSeenAt', 'visitCount', 'lastPromptAt', 'dismissCount'],
  });
  return rows[0] || null;
}

/**
 * Link an anonymous visitor to a band-scoped fan row.
 * Does not grant private-data access. Idempotent.
 */
async function attachVisitorToFan({ visitorToken, fanId }) {
  if (!fanId || !isValidVisitorToken(visitorToken)) return { linked: false, reason: 'invalid' };

  const visitor = await findVisitorByToken(visitorToken);
  if (!visitor) {
    // Soft-create visitor without bumping visit (join is not a session refresh).
    const established = await establishVisitorSession({
      token: visitorToken,
      incrementVisit: false,
    });
    await linkFan(fanId, established.visitor.id);
    return { linked: true, visitorId: established.visitor.id, created: established.isNew };
  }

  await linkFan(fanId, visitor.id);
  return { linked: true, visitorId: visitor.id, created: false };
}

async function linkFan(fanId, visitorEntityId) {
  const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
    fields: ['id'],
    populate: { visitor: { fields: ['id'] } },
  });
  if (!fan) return;

  const current = fan.visitor?.id || fan.visitor;
  if (current && String(current) === String(visitorEntityId)) return;

  // Prefer keeping an existing visitor link (first browser wins) to avoid
  // accidental takeover from a shared/public device later.
  if (current) return;

  await strapi.entityService.update('api::fan.fan', fanId, {
    data: { visitor: visitorEntityId },
  });
}

async function countJoinedArtists(visitorEntityId) {
  if (!visitorEntityId) return 0;
  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: {
      visitor: visitorEntityId,
      status: { $ne: 'removed' },
    },
    fields: ['id'],
    populate: { band: { fields: ['id'] } },
    limit: 500,
  });

  const bandIds = new Set();
  for (const fan of fans || []) {
    const bandId = fan.band?.id || fan.band;
    if (bandId) bandIds.add(String(bandId));
  }
  return bandIds.size;
}

async function countShowAttendances(visitorEntityId) {
  if (!visitorEntityId) return 0;
  const fans = await strapi.entityService.findMany('api::fan.fan', {
    filters: { visitor: visitorEntityId },
    fields: ['id'],
    limit: 500,
  });
  const fanIds = (fans || []).map((f) => f.id).filter(Boolean);
  if (!fanIds.length) return 0;

  return strapi.entityService.count('api::fan-show-attendance.fan-show-attendance', {
    filters: { fan: { id: { $in: fanIds } } },
  });
}

/**
 * Safe anonymous prompt-eligibility foundation (no UI, no PII).
 * Delegates selection to fanAccount when available; keeps signals for clients.
 */
function buildPromptEligibility({ visitor, joinedArtistCount, showAttendanceCount }) {
  const visitCount = visitor?.visitCount || 1;
  const firstSeenAt = visitor?.firstSeenAt ? new Date(visitor.firstSeenAt).getTime() : null;
  const lastSeenAt = visitor?.lastSeenAt ? new Date(visitor.lastSeenAt).getTime() : null;
  const dayMs = 24 * 60 * 60 * 1000;

  const returnVisit =
    visitCount >= 2 &&
    firstSeenAt != null &&
    lastSeenAt != null &&
    lastSeenAt - firstSeenAt >= dayMs * 0.75;

  const multiArtist = joinedArtistCount >= 2;
  const repeatShow = showAttendanceCount >= 2;

  const dismissCount = visitor?.dismissCount || 0;
  const lastPromptAt = visitor?.lastPromptAt || null;

  const availableTriggers = [];
  if (returnVisit) availableTriggers.push('return_visit');
  if (multiArtist) availableTriggers.push('second_artist');
  if (repeatShow) availableTriggers.push('repeat_show');

  let selected = null;
  try {
    // Lazy require avoids circular load issues at boot
    const fanAccount = require('./fanAccount');
    selected = fanAccount.selectPromptEligibility({
      signals: {
        returnVisit,
        multiArtist,
        repeatShow,
        joinedArtistCount,
        showAttendanceCount,
        visitCount,
      },
      visitor,
      currentContext: {},
      accountState: joinedArtistCount > 0 ? 'known_fan' : 'anonymous',
      promptsFlagEnabled: fanAccount.promptsEnabled(),
    });
  } catch {
    selected = null;
  }

  return {
    canEvaluate: true,
    cooldownActive: selected ? !selected.eligible && selected.reason === 'cooldown' : false,
    dismissCount,
    lastPromptAt,
    lastPromptTrigger: visitor?.lastPromptTrigger || null,
    signals: {
      returnVisit,
      multiArtist,
      repeatShow,
      joinedArtistCount,
      showAttendanceCount,
      visitCount,
    },
    availableTriggers,
    // Single best prompt selection (Fan Account Conversion V1)
    selected: selected
      ? {
          eligible: !!selected.eligible,
          trigger: selected.trigger,
          priority: selected.priority,
          cooldownRemaining: selected.cooldownRemaining || 0,
          presentation: selected.presentation,
          reason: selected.reason,
          context: selected.context || {},
        }
      : null,
  };
}

function toSafeSessionPayload({ rawToken, isNew, visitor, joinedArtistCount, showAttendanceCount }) {
  return {
    visitorToken: rawToken,
    isNew: !!isNew,
    firstSeenAt: visitor.firstSeenAt || null,
    lastSeenAt: visitor.lastSeenAt || null,
    visitCount: visitor.visitCount || 1,
    joinedArtistCount: joinedArtistCount || 0,
    showAttendanceCount: showAttendanceCount || 0,
    promptEligibility: buildPromptEligibility({
      visitor,
      joinedArtistCount,
      showAttendanceCount,
    }),
  };
}

module.exports = {
  isValidVisitorToken,
  hashVisitorToken,
  mintVisitorToken,
  establishVisitorSession,
  findVisitorByToken,
  attachVisitorToFan,
  countJoinedArtists,
  countShowAttendances,
  buildPromptEligibility,
  toSafeSessionPayload,
};
