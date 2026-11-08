'use strict';

/**
 * Show-attendee Inbox identity.
 *
 * Attendance remains the only proof someone was at the show.
 * Inbox delivery also needs a verified accountUser. When the attendance Fan
 * row does not have one, reuse a same-band Fan that already shares that
 * visitor and has a claimed account.
 *
 * fan-visitor.accountUser is bound on magic-link verify (first owner wins).
 * The fallback therefore also requires that bound account to match the
 * sibling Fan's accountUser. Same visitor id alone is not enough.
 *
 * Never match by email. Fail closed if the visitor is unclaimed, or if the
 * visitor's bound account does not match exactly one same-band claimed Fan.
 */

function visitorIdOf(fan) {
  const visitor = fan?.visitor;
  if (visitor == null || visitor === '') return null;
  if (typeof visitor === 'object') {
    return visitor.id == null || visitor.id === '' ? null : String(visitor.id);
  }
  return String(visitor);
}

function accountUserIdOf(fan) {
  const accountUser = fan?.accountUser;
  if (accountUser == null || accountUser === '') return null;
  if (typeof accountUser === 'object') {
    return accountUser.id == null || accountUser.id === '' ? null : Number(accountUser.id);
  }
  const id = Number(accountUser);
  return Number.isFinite(id) ? id : null;
}

function visitorAccountUserIdOf(fan) {
  const visitor = fan?.visitor;
  if (!visitor || typeof visitor !== 'object') return null;
  return accountUserIdOf({ accountUser: visitor.accountUser });
}

function isExcludedAccount(accountUserId, excludeAccountUserId) {
  if (accountUserId == null || excludeAccountUserId == null || excludeAccountUserId === '') {
    return false;
  }
  return Number(accountUserId) === Number(excludeAccountUserId);
}

function isInboxEligibleFan(fan) {
  return Boolean(fan?.id) && fan.demo !== true && fan.status !== 'removed';
}

/**
 * @param {object} attendanceFan
 * @param {{ claimedByVisitor?: object[], excludeAccountUserId?: number|string|null }} [options]
 * @returns {object|null} fan payload with numeric accountUser, or null
 */
function resolveShowInboxRecipient(attendanceFan, { claimedByVisitor = [], excludeAccountUserId = null } = {}) {
  if (!isInboxEligibleFan(attendanceFan)) return null;

  const direct = accountUserIdOf(attendanceFan);
  if (direct) {
    if (isExcludedAccount(direct, excludeAccountUserId)) return null;
    return { ...attendanceFan, accountUser: direct };
  }

  const visitorId = visitorIdOf(attendanceFan);
  const visitorAccountUserId = visitorAccountUserIdOf(attendanceFan);
  if (!visitorId || !visitorAccountUserId) return null;
  if (isExcludedAccount(visitorAccountUserId, excludeAccountUserId)) return null;

  const byAccount = new Map();
  for (const twin of claimedByVisitor) {
    if (!isInboxEligibleFan(twin)) continue;
    if (visitorIdOf(twin) !== visitorId) continue;
    const accountUserId = accountUserIdOf(twin);
    if (!accountUserId || Number(accountUserId) !== Number(visitorAccountUserId)) continue;
    if (isExcludedAccount(accountUserId, excludeAccountUserId)) continue;
    if (!byAccount.has(String(accountUserId))) {
      byAccount.set(String(accountUserId), { ...twin, accountUser: accountUserId });
    }
  }

  if (byAccount.size !== 1) return null;
  return byAccount.values().next().value;
}

module.exports = {
  visitorIdOf,
  accountUserIdOf,
  visitorAccountUserIdOf,
  resolveShowInboxRecipient,
};
