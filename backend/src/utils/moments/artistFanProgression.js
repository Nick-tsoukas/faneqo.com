'use strict';

/**
 * Artist × Fan progression — prepared read model. Not persisted. Not a score.
 *
 * Reads canonical fan, canonical show summary, RelationshipEvent communication
 * facts, sparse Moments, and durable Milestones. One artist sees only its own fan row.
 */

const { getCanonicalFanShowSummary } = require('../fans/canonicalShowSummary');
const { getBandRole } = require('../bandRoles');
const { listFanMoments } = require('./momentService');
const { resolveMomentViews, loadAttendancesByIds } = require('./momentResolver');
const { listFanMilestones } = require('../milestones/milestoneService');
const { resolveMilestoneViews, attendanceIdFromEvidence } = require('../milestones/milestoneResolver');
const {
  toId,
  joinedAtFromFan,
  displayNameFromFan,
  emptyCommunicationFacts,
  communicationFactsFromEvents,
  maxTimestamp,
} = require('./momentPure');

const COMMUNICATION_TYPES = ['artist_message_sent', 'fan_replied'];
const COMMUNICATION_LIMIT = 200;

function emptyShows() {
  return {
    count: 0,
    firstShowAt: null,
    latestShowAt: null,
    returning: false,
  };
}

async function loadFanForBand(strapi, { bandId, fanId }) {
  const fid = toId(fanId);
  const bid = toId(bandId);
  if (!fid || !bid) return null;
  const fan = await strapi.entityService.findOne('api::fan.fan', fid, {
    fields: ['id', 'email', 'firstName', 'lastName', 'status', 'subscribedAt', 'createdAt'],
    populate: {
      band: { fields: ['id', 'name', 'slug'] },
      accountUser: { fields: ['id'] },
    },
  });
  if (!fan) return null;
  const fanBand = toId(fan.band);
  if (String(fanBand) !== String(bid)) return null;
  return fan;
}

async function loadCommunicationFacts(strapi, { bandId, fanId }) {
  const rows = await strapi.entityService.findMany('api::relationship-event.relationship-event', {
    filters: {
      band: bandId,
      fan: fanId,
      type: { $in: COMMUNICATION_TYPES },
    },
    fields: ['id', 'type', 'occurredAt'],
    sort: ['occurredAt:desc'],
    limit: COMMUNICATION_LIMIT,
  });
  return communicationFactsFromEvents(rows);
}

/**
 * Labs / internal artist view of one band × one fan.
 * Denied: anonymous, other band, fan that does not belong to the band.
 */
async function authorizeArtistProgression(strapi, { userId, bandId, fanId }) {
  const bid = toId(bandId);
  const fid = toId(fanId);
  if (!userId || !bid || !fid) {
    return { allowed: false, reason: 'not_found' };
  }
  const role = await getBandRole(strapi, bid, userId);
  if (!role) return { allowed: false, reason: 'not_found' };
  const fan = await loadFanForBand(strapi, { bandId: bid, fanId: fid });
  if (!fan) return { allowed: false, reason: 'not_found' };
  return { allowed: true, role, fan, bandId: bid, fanId: fid };
}

async function getArtistFanProgression(strapi, { userId, bandId, fanId, maskEmail }) {
  const auth = await authorizeArtistProgression(strapi, { userId, bandId, fanId });
  if (!auth.allowed) return { error: 'not_found', status: 404 };

  const fan = auth.fan;
  const bid = auth.bandId;
  const fid = auth.fanId;
  const band = fan.band && typeof fan.band === 'object' ? fan.band : { id: bid };

  const [shows, communication, momentRows, milestoneRows] = await Promise.all([
    getCanonicalFanShowSummary(strapi, { bandId: bid, fanId: fid }),
    loadCommunicationFacts(strapi, { bandId: bid, fanId: fid }),
    listFanMoments(strapi, { bandId: bid, fanId: fid }),
    listFanMilestones(strapi, { bandId: bid, fanId: fid }),
  ]);

  const viewer = {
    userId,
    bandId: bid,
    bandRole: auth.role,
    isArtist: auth.role === 'owner' || auth.role === 'manager',
    isSubjectFan: false,
    subjectFanId: fid,
    fan: { id: fid, status: fan.status },
  };

  const milestoneAttendanceIds = (milestoneRows || [])
    .map((row) => attendanceIdFromEvidence(row.evidence))
    .filter(Boolean);
  const momentAttendanceIds = (momentRows || [])
    .filter((row) => row.sourceType === 'fan_show_attendance')
    .map((row) => Number(row.sourceId));
  const attendanceMap = await loadAttendancesByIds(strapi, [...momentAttendanceIds, ...milestoneAttendanceIds]);

  const moments = await resolveMomentViews(strapi, {
    moments: momentRows,
    viewer,
    bandId: bid,
    attendanceMap,
  });
  const milestones = resolveMilestoneViews(milestoneRows, { attendanceMap });

  const joinedAt = joinedAtFromFan(fan);
  const comm = communication || emptyCommunicationFacts();
  const lastRelationshipActivityAt = maxTimestamp([
    joinedAt,
    shows.firstShowAt,
    shows.latestShowAt,
    comm.lastArtistMessageAt,
    comm.lastReplyAt,
    moments.length ? moments[moments.length - 1].occurredAt : null,
    milestones.length ? milestones[milestones.length - 1].occurredAt : null,
  ]);

  const displayName = displayNameFromFan(fan);
  const emailMasked = typeof maskEmail === 'function' ? maskEmail(fan.email) : null;

  return {
    data: {
      band: {
        id: band.id,
        name: band.name || null,
        slug: band.slug || null,
      },
      fan: {
        id: fan.id,
        displayName,
        firstName: fan.firstName || null,
        status: fan.status,
        claimed: Boolean(toId(fan.accountUser)),
        emailMasked,
      },
      joinedAt,
      shows: {
        count: Number(shows.showCount) || 0,
        firstShowAt: shows.firstShowAt || null,
        latestShowAt: shows.latestShowAt || null,
        returning: shows.returning === true,
      },
      communication: comm,
      moments,
      milestones,
      lastRelationshipActivityAt,
    },
  };
}

module.exports = {
  authorizeArtistProgression,
  getArtistFanProgression,
  loadCommunicationFacts,
  loadFanForBand,
  emptyShows,
};
