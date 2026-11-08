'use strict';

/**
 * Pulse snapshot persistence and surge-notification evaluation.
 *
 * This work used to run as a side effect of `GET /analytics/pulse`: loading a
 * dashboard wrote a `pulse-snapshot` row and could create `notification` rows.
 * While that route was `auth: false` it meant an anonymous request could make
 * the platform write records and queue push notifications for an artist.
 *
 * A GET must not mutate state, so the write path lives here and is driven by
 * the daily analytics cron (`config/cron-tasks.js`). The read endpoint now only
 * reads the snapshot this produces.
 */

const { DateTime } = require('luxon');
const { normalizeSignals, computePulse, fetchEntityData } = require('./pulse');
const {
  computeActivityTotals,
  evaluateSurgePush,
  createSurgeNotifications,
  updateSnapshotAfterPush,
} = require('./pushEligibility');

const SNAPSHOT_UID = 'api::pulse-snapshot.pulse-snapshot';
const DEFAULT_RANGE = '30d';

/** Latest snapshot for a band+range, or null. Read-only. */
async function readLatestSnapshot(strapi, bandId, rangeKey) {
  const rows = await strapi.entityService.findMany(SNAPSHOT_UID, {
    filters: { band: bandId, rangeKey },
    sort: { computedAt: 'desc' },
    limit: 1,
  });
  return rows[0] || null;
}

/**
 * Persist the snapshot for one band+range and, on a transition into "surging",
 * evaluate and create the surge notification.
 *
 * Extracted verbatim from the old controller side effect so behavior is
 * unchanged apart from when it runs.
 */
async function persistPulseSnapshot(strapi, { bandId, rangeKey, pulse, currentSignals, now }) {
  const prevSnapshot = await readLatestSnapshot(strapi, bandId, rangeKey);

  const totalActivity = computeActivityTotals(currentSignals);
  const prevTotalActivity = prevSnapshot?.totalActivity || 0;
  const absoluteIncrease = totalActivity - prevTotalActivity;

  const prevMomentum = prevSnapshot?.momentumState || 'steady';
  const currentMomentum = pulse.momentumState;
  const momentumChanged = prevMomentum !== currentMomentum;

  const snapshotData = {
    band: bandId,
    rangeKey,
    pulseScore: pulse.pulseScore,
    momentumState: currentMomentum,
    totalActivity,
    growthPct: pulse.drivers?.growthPct || 0,
    absoluteIncrease,
    computedAt: now.toISO(),
    drivers: pulse.drivers,
  };

  if (momentumChanged) {
    snapshotData.lastMomentumChangeAt = now.toISO();
  } else if (prevSnapshot?.lastMomentumChangeAt) {
    snapshotData.lastMomentumChangeAt = prevSnapshot.lastMomentumChangeAt;
  }

  if (prevSnapshot) {
    snapshotData.surgePushSent = prevSnapshot.surgePushSent;
    snapshotData.lastSurgePushAt = prevSnapshot.lastSurgePushAt;
  }

  if (currentMomentum === 'steady' || currentMomentum === 'cooling') {
    snapshotData.surgePushSent = false;
  }

  const snapshot = prevSnapshot
    ? await strapi.entityService.update(SNAPSHOT_UID, prevSnapshot.id, { data: snapshotData })
    : await strapi.entityService.create(SNAPSHOT_UID, { data: snapshotData });

  let surgeEvaluation = null;

  // Only evaluate on a transition INTO surging.
  if (prevMomentum !== 'surging' && currentMomentum === 'surging') {
    const band = await strapi.entityService.findOne('api::band.band', bandId, {
      populate: ['users_permissions_user'],
    });

    if (band?.users_permissions_user) {
      const user = band.users_permissions_user;

      surgeEvaluation = evaluateSurgePush({
        user,
        band,
        currentPulse: pulse,
        currentSignals,
        prevSnapshot,
        now: now.toJSDate(),
      });

      if (surgeEvaluation.eligible && surgeEvaluation.wouldSend) {
        const notifResult = await createSurgeNotifications(strapi, {
          user,
          band,
          notification: surgeEvaluation.notification,
        });

        if (notifResult.created) {
          await updateSnapshotAfterPush(strapi, snapshot.id, now);
          surgeEvaluation.notificationCreated = true;
        } else {
          surgeEvaluation.notificationCreated = false;
          surgeEvaluation.notificationSkipReason = notifResult.reason;
        }
      }
    }
  }

  return { snapshot, surgeEvaluation, prevMomentum, currentMomentum };
}

/**
 * Compute and persist one band's pulse snapshot end to end. This is the entry
 * point for the scheduled job.
 */
async function refreshBandPulseSnapshot(strapi, { bandId, rangeKey = DEFAULT_RANGE, now } = {}) {
  const at = now || DateTime.utc();
  const days = Number(String(rangeKey).replace('d', '')) || 30;

  const currentFrom = at.minus({ days: days - 1 }).startOf('day').toISO();
  const currentTo = at.endOf('day').toISO();
  const prevFrom = at.minus({ days: days * 2 - 1 }).startOf('day').toISO();
  const prevTo = at.minus({ days }).endOf('day').toISO();

  const [currentRaw, previousRaw] = await Promise.all([
    fetchEntityData(strapi, 'band', bandId, days, currentFrom, currentTo),
    fetchEntityData(strapi, 'band', bandId, days, prevFrom, prevTo),
  ]);

  if (!currentRaw) return { ok: false, reason: 'no_data' };

  const currentSignals = normalizeSignals('band', bandId, rangeKey, currentRaw);
  const previousSignals = previousRaw
    ? normalizeSignals('band', bandId, rangeKey, previousRaw)
    : null;
  const pulse = computePulse(currentSignals, previousSignals);

  const result = await persistPulseSnapshot(strapi, {
    bandId,
    rangeKey,
    pulse,
    currentSignals,
    now: at,
  });

  return { ok: true, ...result };
}

module.exports = {
  SNAPSHOT_UID,
  DEFAULT_RANGE,
  readLatestSnapshot,
  persistPulseSnapshot,
  refreshBandPulseSnapshot,
};
