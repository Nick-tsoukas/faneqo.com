'use strict';

/**
 * Global fan profile service — self-scoped reads/writes plus a bulk profile
 * loader for future artist-facing lists.
 *
 * Ownership always comes from the authenticated user id passed in by the
 * controller. This service never reads a user/profile id from a request body.
 */

const pure = require('./fanProfilePure');
const avatarPure = require('./fanProfileAvatarPure');
const avatarIo = require('./fanProfileAvatar');
const { isUniqueViolation } = require('../inbox/inboxPure');

const UID_PROFILE = 'api::fan-profile.fan-profile';
const UID_USER = 'plugin::users-permissions.user';

// Claim bookkeeping is included so this stays a superset of the older
// ensureFanProfile contract in fanAccount.js, which now delegates here.
const PROFILE_FIELDS = [
  'id',
  'displayName',
  'firstName',
  'lastName',
  'profileCompletedAt',
  'claimedArtistCount',
  'lastClaimedAt',
];
const PROFILE_POPULATE = {
  avatar: { fields: ['id', 'url', 'mime', 'width', 'height', 'provider', 'formats'] },
};

/** Bounded $in size so a large inbox page cannot build an unbounded query. */
const PROFILE_CHUNK_SIZE = 200;

function unauthorized() {
  return { ok: false, status: 401, error: 'unauthorized', message: 'Authentication required' };
}

function createFanProfileService(strapi) {
  async function findAuthUser(userId) {
    const id = pure.positiveId(userId);
    if (!id) return null;
    const user = await strapi.entityService.findOne(UID_USER, id, { fields: ['id', 'email'] });
    return user || null;
  }

  /**
   * Canonical read. Ordered by id so that if duplicates predate the unique
   * index, the lowest id deterministically wins. Never silently switches rows.
   */
  async function findByUser(userId) {
    const id = pure.positiveId(userId);
    if (!id) return null;
    const rows = await strapi.entityService.findMany(UID_PROFILE, {
      filters: { user: id },
      fields: PROFILE_FIELDS,
      populate: PROFILE_POPULATE,
      sort: { id: 'asc' },
      limit: 1,
    });
    return rows?.[0] || null;
  }

  /**
   * THE canonical find-or-create primitive. `fanAccount.ensureFanProfile`
   * delegates here so there is only one implementation.
   *
   * Creating a profile is not evidence the fan chose an identity, so
   * profileCompletedAt stays null. A concurrent insert is a normal race, not a
   * server error: the loser refetches the winner's row and returns it.
   */
  async function ensureForUser(userId) {
    const id = pure.positiveId(userId);
    if (!id) return null;

    const existing = await findByUser(id);
    if (existing) return existing;

    try {
      await strapi.entityService.create(UID_PROFILE, {
        data: { user: id, claimedArtistCount: 0 },
      });
    } catch (err) {
      if (!isUniqueViolation(err)) throw err;
      strapi?.log?.info?.('[FanProfile] concurrent ensure lost the race; using existing profile');
    }

    return findByUser(id);
  }

  /** GET /fan-account/profile */
  async function getSelfProfile({ userId }) {
    const user = await findAuthUser(userId);
    if (!user) return unauthorized();

    const profile = await ensureForUser(user.id);
    return { ok: true, ...pure.serializeSelfProfile({ profile, user }) };
  }

  /** PATCH /fan-account/profile */
  async function updateSelfProfile({ userId, body }) {
    const user = await findAuthUser(userId);
    if (!user) return unauthorized();

    const validated = pure.validateProfilePatch(body);
    if (validated.error) {
      return {
        ok: false,
        status: validated.status || 400,
        error: validated.error,
        message: validated.message,
      };
    }

    const profile = await ensureForUser(user.id);
    if (!profile) {
      return { ok: false, status: 500, error: 'profile_unavailable', message: 'Could not load your profile.' };
    }

    // An explicit save is the only thing that marks the profile complete.
    await strapi.entityService.update(UID_PROFILE, profile.id, {
      data: { ...validated.data, profileCompletedAt: new Date().toISOString() },
    });

    const updated = await findByUser(user.id);
    return { ok: true, ...pure.serializeSelfProfile({ profile: updated, user }) };
  }

  async function serializeAfterMutation(user) {
    const profile = await findByUser(user.id);
    return { ok: true, ...pure.serializeSelfProfile({ profile, user }) };
  }

  /**
   * POST /fan-account/avatar
   * Multipart only. Never reads a file id from the client.
   * profileCompletedAt is left alone — media is not an identity save.
   */
  async function uploadSelfAvatar({ userId, incoming, body }) {
    const user = await findAuthUser(userId);
    if (!user) return unauthorized();

    const injected = avatarPure.rejectAvatarInjection(body);
    if (injected) return { ok: false, ...injected };

    const descriptor = avatarIo.incomingDescriptor(incoming);
    let buffer;
    try {
      buffer = await avatarIo.readIncomingBuffer(descriptor);
    } catch (err) {
      strapi?.log?.warn?.(`[FanProfile Avatar] could not read upload (${err.code || 'read_failed'})`);
      return { ok: false, status: 400, error: 'avatar_missing', message: 'Choose a profile photo to upload.' };
    }

    const validated = avatarPure.validateIncomingAvatar({
      buffer,
      mime: descriptor?.mime,
      filename: descriptor?.filename,
      size: descriptor?.size,
    });
    if (validated.error) {
      return { ok: false, status: validated.status, error: validated.error, message: validated.message };
    }

    let normalized;
    try {
      normalized = await avatarIo.normalizeAvatarImage(validated.buffer);
    } catch (err) {
      if (err.code === 'sharp_missing') {
        return { ok: false, status: 503, error: 'avatar_process_unavailable', message: 'Photo processing is not available right now.' };
      }
      return { ok: false, status: 400, error: 'avatar_process_failed', message: 'Could not process that photo.' };
    }
    if (normalized.hasExif) {
      return { ok: false, status: 500, error: 'avatar_process_failed', message: 'Could not process that photo.' };
    }

    const profile = await ensureForUser(user.id);
    if (!profile) {
      return { ok: false, status: 500, error: 'profile_unavailable', message: 'Could not load your profile.' };
    }
    const priorFileId = avatarPure.avatarFileId(profile);

    let uploaded;
    try {
      uploaded = await avatarIo.uploadNormalizedAvatar(strapi, normalized);
    } catch (err) {
      strapi?.log?.error?.('[FanProfile Avatar] upload plugin failed:', err);
      return { ok: false, status: 500, error: 'avatar_upload_failed', message: 'Could not save that photo.' };
    }

    try {
      await strapi.entityService.update(UID_PROFILE, profile.id, {
        data: { avatar: uploaded.id },
      });
    } catch (err) {
      strapi?.log?.error?.('[FanProfile Avatar] association failed:', err);
      await avatarIo.removeOrphanUpload(strapi, uploaded);
      return { ok: false, status: 500, error: 'avatar_associate_failed', message: 'Could not save that photo.' };
    }

    const associated = await findByUser(user.id);
    const associatedId = avatarPure.avatarFileId(associated);
    if (associatedId !== uploaded.id) {
      await avatarIo.removeOrphanUpload(strapi, uploaded);
      return { ok: false, status: 500, error: 'avatar_associate_failed', message: 'Could not save that photo.' };
    }

    if (priorFileId && priorFileId !== uploaded.id) {
      await avatarIo.removeOwnedPriorAvatar(strapi, {
        priorFileId,
        capturedFileId: priorFileId,
        newFileId: uploaded.id,
        profileId: profile.id,
      });
    }

    return { ok: true, ...pure.serializeSelfProfile({ profile: associated, user }) };
  }

  /**
   * DELETE /fan-account/avatar
   * Idempotent: no avatar is a success. profileCompletedAt is preserved.
   */
  async function deleteSelfAvatar({ userId, body }) {
    const user = await findAuthUser(userId);
    if (!user) return unauthorized();

    const injected = avatarPure.rejectAvatarInjection(body);
    if (injected) return { ok: false, ...injected };

    const profile = await ensureForUser(user.id);
    if (!profile) {
      return { ok: false, status: 500, error: 'profile_unavailable', message: 'Could not load your profile.' };
    }

    const priorFileId = avatarPure.avatarFileId(profile);
    if (!priorFileId) {
      return serializeAfterMutation(user);
    }

    try {
      await strapi.entityService.update(UID_PROFILE, profile.id, {
        data: { avatar: null },
      });
    } catch (err) {
      strapi?.log?.error?.('[FanProfile Avatar] unlink failed:', err);
      return { ok: false, status: 500, error: 'avatar_delete_failed', message: 'Could not remove that photo.' };
    }

    const cleared = await findByUser(user.id);
    if (avatarPure.avatarFileId(cleared)) {
      return { ok: false, status: 500, error: 'avatar_delete_failed', message: 'Could not remove that photo.' };
    }

    await avatarIo.removeOwnedPriorAvatar(strapi, {
      priorFileId,
      capturedFileId: priorFileId,
      newFileId: null,
      profileId: profile.id,
    });

    return { ok: true, ...pure.serializeSelfProfile({ profile: cleared, user }) };
  }

  /**
   * Bulk loader: unique accountUser ids in, Map(accountUserId → profile) out.
   * One query per chunk of PROFILE_CHUNK_SIZE ids — never one query per fan row.
   */
  async function loadProfilesByAccountUser(accountUserIds, { chunkSize = PROFILE_CHUNK_SIZE } = {}) {
    const unique = [...new Set((accountUserIds || []).map(pure.positiveId).filter(Boolean))];
    const byUserId = new Map();
    if (!unique.length) return byUserId;

    for (const ids of pure.chunk(unique, chunkSize)) {
      const rows = await strapi.entityService.findMany(UID_PROFILE, {
        filters: { user: { id: { $in: ids } } },
        fields: PROFILE_FIELDS,
        populate: { ...PROFILE_POPULATE, user: { fields: ['id'] } },
        sort: { id: 'asc' },
        // Duplicates predating the unique index would otherwise be truncated
        // away before the lowest-id row could be chosen.
        limit: ids.length * 2,
      });
      for (const row of rows || []) {
        const ownerId = pure.positiveId(row?.user?.id ?? row?.user);
        // Sorted ascending, so the first row seen is the canonical lowest id.
        if (!ownerId || byUserId.has(ownerId)) continue;
        byUserId.set(ownerId, row);
      }
    }

    return byUserId;
  }

  /**
   * Fan rows → display identities, with one bounded profile query for the batch.
   * Artist Inbox list / candidates / requests call this after authorization.
   */
  async function resolveIdentitiesForFans(fans, options) {
    const profiles = await loadProfilesByAccountUser(pure.accountUserIdsFromFans(fans), options);
    const byFanId = new Map();
    for (const fan of fans || []) {
      const ownerId = pure.positiveId(fan?.accountUserId ?? fan?.accountUser?.id ?? fan?.accountUser);
      const profile = ownerId ? profiles.get(ownerId) || null : null;
      byFanId.set(fan?.id, pure.resolveFanDisplayIdentity({ fan, profile }));
    }
    return byFanId;
  }

  return {
    findByUser,
    ensureForUser,
    getSelfProfile,
    updateSelfProfile,
    uploadSelfAvatar,
    deleteSelfAvatar,
    loadProfilesByAccountUser,
    resolveIdentitiesForFans,
    PROFILE_CHUNK_SIZE,
  };
}

module.exports = { createFanProfileService, PROFILE_CHUNK_SIZE };
