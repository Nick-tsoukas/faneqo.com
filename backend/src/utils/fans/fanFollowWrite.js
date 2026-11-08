'use strict';

/**
 * Native Follow writes against the canonical Fan row.
 * No Follow collection. Follow never mints email consent.
 * End-relationship Unfollow also leaves the Fan List. It does not delete the Fan.
 */

const fanIdentity = require('../fanIdentity');
const { findFanByBandEmail, createFanIdempotent, normalizeEmail } = require('./fanEmail');
const { isFollowing, followPatch, unfollowPatch, followReadModel } = require('./fanFollow');

function parseBandId(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function loadBand(strapi, bandId) {
  if (!bandId) return null;
  return strapi.entityService.findOne('api::band.band', bandId, { fields: ['id'] });
}

async function loadUser(strapi, userId) {
  if (!userId) return null;
  return strapi.entityService.findOne('plugin::users-permissions.user', userId, {
    fields: ['id', 'email'],
  });
}

function publicFollowResult(fan) {
  const read = followReadModel(fan);
  return {
    ok: true,
    isFollowing: read.isFollowing,
    followedAt: read.followedAt,
    status: fan?.status || null,
    fanId: fan?.id || null,
  };
}

async function establishFollowOnFan(strapi, fanId, { now } = {}) {
  if (!fanId) return { ok: false, error: 'missing_fan' };
  const fan = await strapi.entityService.findOne('api::fan.fan', fanId, {
    fields: ['id', 'status', 'followedAt', 'unfollowedAt'],
  });
  if (!fan) return { ok: false, error: 'not_found' };
  if (isFollowing(fan)) {
    return { ok: true, already: true, fan };
  }
  const updated = await strapi.entityService.update('api::fan.fan', fan.id, {
    data: followPatch(now || new Date()),
  });
  return { ok: true, already: false, fan: updated };
}

async function claimCurrentUser(strapi, user) {
  const fanAccount = require('../fanAccount');
  await fanAccount.claimFanRelationshipsForUser(user);
}

async function followArtistForUser(strapi, { userId, bandId }) {
  const resolvedBandId = parseBandId(bandId);
  if (!resolvedBandId) return { ok: false, error: 'invalid_band', status: 400 };
  if (!userId) return { ok: false, error: 'unauthorized', status: 401 };

  const [user, band] = await Promise.all([
    loadUser(strapi, userId),
    loadBand(strapi, resolvedBandId),
  ]);
  if (!user?.id) return { ok: false, error: 'unauthorized', status: 401 };
  const email = normalizeEmail(user.email);
  if (!email) return { ok: false, error: 'account_email_required', status: 400 };
  if (!band) return { ok: false, error: 'band_not_found', status: 404 };

  let fan = await findFanByBandEmail(strapi, resolvedBandId, email);
  const now = new Date();
  const nowISO = now.toISOString();

  if (!fan) {
    const created = await createFanIdempotent(strapi, {
      bandId: resolvedBandId,
      data: {
        email,
        band: resolvedBandId,
        // V1: email-ineligible. Not an unsubscribe action. Join Fan List later promotes.
        status: 'unsubscribed',
        source: 'other',
        subscribedAt: nowISO,
        firstSeenAt: nowISO,
        lastSeenAt: nowISO,
        captureContext: 'normal',
        captureSurface: 'unknown',
        followedAt: nowISO,
        unfollowedAt: null,
        accountUser: userId,
      },
    });
    fan = created.fan;
  }

  if (!isFollowing(fan)) {
    fan = await strapi.entityService.update('api::fan.fan', fan.id, {
      data: {
        ...followPatch(now),
        lastSeenAt: nowISO,
      },
    });
  }

  try {
    await claimCurrentUser(strapi, user);
  } catch (err) {
    strapi.log.warn('[FanFollow] claim after follow skipped', { message: err?.message });
  }

  const fresh = await strapi.entityService.findOne('api::fan.fan', fan.id, {
    fields: ['id', 'status', 'followedAt', 'unfollowedAt', 'accountUser'],
    populate: { accountUser: { fields: ['id'] } },
  });
  return publicFollowResult(fresh || fan);
}

function emptyRelationshipResult() {
  return {
    ok: true,
    isFollowing: false,
    followedAt: null,
    status: null,
    fanId: null,
  };
}

async function emitUnsubscribed(strapi, fan, occurredAt) {
  try {
    const { produceFanUnsubscribed } = require('../relationshipEvents/relationshipEventProducers');
    await produceFanUnsubscribed(strapi, fan, { occurredAt, reason: 'unfollow' });
  } catch (err) {
    strapi.log.warn('[FanFollow] fan_unsubscribed skipped', { message: err?.message });
  }
}

/**
 * End the active artist/fan relationship on an already-loaded Fan.
 * Sets unfollowedAt. If status is subscribed, also unsubscribes.
 * Never deletes the row. Idempotent.
 */
async function endArtistRelationshipOnFan(strapi, fan, { now, bandId } = {}) {
  if (!fan?.id) return emptyRelationshipResult();

  const when = now || new Date();
  const whenISO = when instanceof Date ? when.toISOString() : String(when);
  const wasFollowing = isFollowing(fan);
  const wasSubscribed = fan.status === 'subscribed';

  if (!wasFollowing && !wasSubscribed) {
    return publicFollowResult(fan);
  }

  const data = {};
  if (wasFollowing) Object.assign(data, unfollowPatch(when));
  if (wasSubscribed) {
    data.status = 'unsubscribed';
    data.unsubscribedAt = whenISO;
  }

  const updated = await strapi.entityService.update('api::fan.fan', fan.id, { data });
  if (wasSubscribed) {
    await emitUnsubscribed(strapi, {
      ...fan,
      ...updated,
      band: fan.band || updated.band || bandId,
    }, whenISO);
  }
  return publicFollowResult(updated);
}

async function findFanByVisitorBand(strapi, visitorId, bandId) {
  if (!visitorId || !bandId) return null;
  const rows = await strapi.entityService.findMany('api::fan.fan', {
    filters: { visitor: visitorId, band: bandId },
    sort: ['id:asc'],
    limit: 5,
    fields: ['id', 'status', 'followedAt', 'unfollowedAt', 'unsubscribedAt'],
    populate: { band: { fields: ['id'] } },
  });
  if (!rows?.length) return null;
  return [...rows].sort((a, b) => Number(a.id) - Number(b.id))[0];
}

async function unfollowArtistForUser(strapi, { userId, bandId }) {
  const resolvedBandId = parseBandId(bandId);
  if (!resolvedBandId) return { ok: false, error: 'invalid_band', status: 400 };
  if (!userId) return { ok: false, error: 'unauthorized', status: 401 };

  const [user, band] = await Promise.all([
    loadUser(strapi, userId),
    loadBand(strapi, resolvedBandId),
  ]);
  if (!user?.id) return { ok: false, error: 'unauthorized', status: 401 };
  const email = normalizeEmail(user.email);
  if (!email) return { ok: false, error: 'account_email_required', status: 400 };
  if (!band) return { ok: false, error: 'band_not_found', status: 404 };

  const fan = await findFanByBandEmail(strapi, resolvedBandId, email);
  if (!fan) return emptyRelationshipResult();

  return endArtistRelationshipOnFan(strapi, fan, { bandId: resolvedBandId });
}

/**
 * Anonymous Unfollow. Resolves the Fan only via this visitor + band.
 * Never accepts a client Fan id or email. Unguessable visitor token required.
 */
async function endArtistRelationshipForVisitor(strapi, { visitorToken, bandId }) {
  const resolvedBandId = parseBandId(bandId);
  if (!resolvedBandId) return { ok: false, error: 'invalid_band', status: 400 };
  if (!fanIdentity.isValidVisitorToken(visitorToken)) {
    return { ok: false, error: 'unauthorized', status: 401 };
  }

  const band = await loadBand(strapi, resolvedBandId);
  if (!band) return { ok: false, error: 'band_not_found', status: 404 };

  const visitor = await fanIdentity.findVisitorByToken(visitorToken);
  if (!visitor?.id) return emptyRelationshipResult();

  const fan = await findFanByVisitorBand(strapi, visitor.id, resolvedBandId);
  if (!fan) return emptyRelationshipResult();

  const result = await endArtistRelationshipOnFan(strapi, fan, { bandId: resolvedBandId });
  return {
    ok: true,
    isFollowing: result.isFollowing,
    followedAt: result.followedAt,
    status: result.status,
  };
}

/**
 * Anonymous Follow by email. Same Fan row as Join, without email consent.
 * An existing subscribed row stays subscribed. An unsubscribed row is not
 * restored. A removed row is left alone.
 */
async function followArtistByEmail(strapi, {
  email,
  bandId,
  source,
  captureSurface,
  visitorToken,
  firstName,
} = {}) {
  const resolvedBandId = parseBandId(bandId);
  const normalized = normalizeEmail(email);
  if (!resolvedBandId) return { ok: false, error: 'invalid_band', status: 400 };
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: 'invalid_email', status: 400 };
  }

  const band = await loadBand(strapi, resolvedBandId);
  if (!band) return { ok: false, error: 'band_not_found', status: 404 };

  const now = new Date();
  const nowISO = now.toISOString();
  let fan = await findFanByBandEmail(strapi, resolvedBandId, normalized);
  if (fan?.status === 'removed') {
    return { ok: false, error: 'removed', status: 409 };
  }

  const already = !!(fan && isFollowing(fan));
  if (!fan) {
    const created = await createFanIdempotent(strapi, {
      bandId: resolvedBandId,
      data: {
        email: normalized,
        firstName: firstName || null,
        band: resolvedBandId,
        status: 'unsubscribed',
        source: source || 'follow_modal',
        subscribedAt: nowISO,
        firstSeenAt: nowISO,
        lastSeenAt: nowISO,
        captureContext: 'normal',
        captureSurface: captureSurface || 'follow_modal',
        followedAt: nowISO,
        unfollowedAt: null,
      },
    });
    fan = created.fan;
    if (fan?.status === 'removed') {
      return { ok: false, error: 'removed', status: 409 };
    }
  }

  if (fan && !isFollowing(fan)) {
    fan = await strapi.entityService.update('api::fan.fan', fan.id, {
      data: {
        ...followPatch(now),
        lastSeenAt: nowISO,
      },
    });
  } else if (fan) {
    fan = await strapi.entityService.update('api::fan.fan', fan.id, {
      data: { lastSeenAt: nowISO },
    });
  }

  if (fan?.id && visitorToken) {
    try {
      await fanIdentity.attachVisitorToFan({ visitorToken, fanId: fan.id });
    } catch (err) {
      strapi.log.warn('[FanFollow] visitor link on email follow skipped', { message: err?.message });
    }
  }

  return {
    ok: true,
    already,
    fanId: fan?.id || null,
    status: fan?.status || null,
    subscribed: fan?.status === 'subscribed',
  };
}

module.exports = {
  parseBandId,
  establishFollowOnFan,
  followArtistForUser,
  followArtistByEmail,
  unfollowArtistForUser,
  endArtistRelationshipOnFan,
  endArtistRelationshipForVisitor,
};
