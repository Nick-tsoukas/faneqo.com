'use strict';

/**
 * Faneqo Inbox / DM service (Phase 2).
 *
 * Independent of message-campaign / Resend.
 * Conversation identity = band (artist) ↔ fanAccountUser (verified fan).
 * originFan is band-scoped relationship context only.
 */

const { requireBandPermission } = require('../bandRoles');
const { checkInboxSendRate } = require('./inboxRateLimit');
const { inboxLog, newInboxRequestId } = require('./inboxLog');
const { attachConversationRequests } = require('./conversationRequests');
const pure = require('./inboxPure');
const galleryRef = require('./galleryReference');
const { createProtectedMediaService } = require('../artistUpdates/protectedMedia');
const mediaPure = require('../artistUpdates/protectedMediaPure');
const { createFanIdempotent, normalizeEmail } = require('../fans/fanEmail');
const { emptyShowSummary, overlayFanShowSummary, getCanonicalFanShowSummaries } = require('../fans/canonicalShowSummary');
const fanProfilePure = require('../fanProfile/fanProfilePure');

const UID_CONV = 'api::conversation.conversation';
const UID_PART = 'api::conversation-participant.conversation-participant';
const UID_MSG = 'api::conversation-message.conversation-message';
const UID_REQ = 'api::conversation-request.conversation-request';
const UID_FAN = 'api::fan.fan';
const UID_BAND = 'api::band.band';

const ARTIST_INBOX_PERMISSION = 'sendFanMessages';

// entityService returns only the relations named in `populate`, so `conversation`
// must be listed. Protected attachment URLs and media stream authorization are
// both keyed on the owning conversation id.
const MESSAGE_POPULATE = {
  conversation: { fields: ['id'] },
  attachmentMedia: true,
  attachmentGallery: true,
};

function logSafe(logger, level, msg, meta) {
  const log = logger && logger[level] ? logger[level].bind(logger) : null;
  if (log) log(msg, meta || {});
}

function errResult(name, message, status = 400, extra = {}) {
  return { ok: false, error: name, message, status, ...extra };
}

function ok(data) {
  return { ok: true, ...data };
}

async function requireArtistInboxAccess(strapi, userId, bandId) {
  return requireBandPermission(strapi, userId, bandId, ARTIST_INBOX_PERMISSION);
}

function createMemoryInboxStore() {
  let convSeq = 1;
  let partSeq = 1;
  let msgSeq = 1;
  let reqSeq = 1;
  let fanSeq = 200;
  const conversations = new Map();
  const participants = new Map();
  const messages = new Map();
  const requests = new Map();
  const fans = new Map();
  const bands = new Map();
  const users = new Map();
  const profiles = new Map();
  const members = new Map(); // `${bandId}:${userId}` -> role
  const files = new Map();
  const attendances = [];

  const nowIso = () => new Date().toISOString();

  function clone(row) {
    return row ? JSON.parse(JSON.stringify(row)) : null;
  }

  return {
    fans,
    bands,
    users,
    members,
    conversations,
    participants,
    messages,
    requests,

    seedUser(user) {
      users.set(Number(user.id), { ...user });
    },
    seedBand(band) {
      bands.set(Number(band.id), { ...band });
    },
    seedFan(fan) {
      fans.set(Number(fan.id), { ...fan });
    },
    seedAttendance(row) {
      attendances.push({
        id: row.id || attendances.length + 1,
        fan: Number(row.fan),
        checkedInAt: row.checkedInAt || nowIso(),
        suppressedDuplicate: row.suppressedDuplicate === true,
        campaignId: row.campaignId || null,
        event: row.event || null,
      });
    },
    seedMember(bandId, userId, role) {
      members.set(`${bandId}:${userId}`, role);
    },
    seedFile(file) {
      files.set(Number(file.id), { ...file });
    },

    async findFan(id) {
      return clone(fans.get(Number(id)));
    },
    async findFanByAccountUserAndBand(userId, bandId) {
      for (const fan of fans.values()) {
        if (Number(fan.accountUser) === Number(userId) && Number(fan.band) === Number(bandId)) {
          return clone(fan);
        }
      }
      return null;
    },
    async findFansByAccountUser(userId) {
      return [...fans.values()]
        .filter((fan) => Number(fan.accountUser) === Number(userId))
        .map(clone);
    },
    seedFanProfile(profile) {
      profiles.set(Number(profile.user), { ...profile });
    },
    async findFanProfileByUser(userId) {
      return clone(profiles.get(Number(userId))) || null;
    },
    async findFanByEmailAndBand(email, bandId) {
      const needle = String(email || '').trim().toLowerCase();
      if (!needle) return null;
      for (const fan of fans.values()) {
        if (Number(fan.band) !== Number(bandId)) continue;
        if (String(fan.email || '').trim().toLowerCase() === needle) return clone(fan);
      }
      return null;
    },
    async createFan(data) {
      const ids = [...fans.keys()];
      const id = data.id || Math.max(fanSeq, ...(ids.length ? ids : [0])) + 1;
      fanSeq = Math.max(fanSeq, id + 1);
      const row = {
        id,
        status: 'subscribed',
        checkedInShowCount: 0,
        ...data,
      };
      fans.set(row.id, row);
      return clone(row);
    },
    async updateFan(id, data) {
      const row = fans.get(Number(id));
      if (!row) return null;
      Object.assign(row, data);
      return clone(row);
    },
    async findRequestById(id) {
      return clone(requests.get(Number(id)));
    },
    async findPendingRequestByPairKey(key) {
      if (!key) return null;
      for (const row of requests.values()) {
        if (row.status === 'pending' && (row.pendingPairKey === key || row.pairKey === key)) {
          return clone(row);
        }
      }
      return null;
    },
    async findLatestDeclinedByPairKey(key) {
      if (!key) return null;
      let latest = null;
      for (const row of requests.values()) {
        if (row.status !== 'declined' || row.pairKey !== key) continue;
        if (!latest || new Date(row.declinedAt || row.respondedAt || 0) > new Date(latest.declinedAt || latest.respondedAt || 0)) {
          latest = row;
        }
      }
      return clone(latest);
    },
    async listRequestsByBand(bandId, { status } = {}) {
      return [...requests.values()]
        .filter((row) => Number(row.recipientBand) === Number(bandId))
        .filter((row) => !status || row.status === status)
        .map(clone);
    },
    async listRequestsByRequesterUser(userId) {
      return [...requests.values()]
        .filter((row) => Number(row.requesterUser) === Number(userId))
        .map(clone);
    },
    async createRequest(data) {
      if (data.pendingPairKey) {
        for (const row of requests.values()) {
          if (row.pendingPairKey === data.pendingPairKey) {
            const e = new Error('duplicate key value violates unique constraint "conversation_requests_pending_pair_key_unique"');
            e.code = '23505';
            throw e;
          }
        }
      }
      const row = {
        id: reqSeq++,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        requesterType: 'fan',
        status: 'pending',
        ...data,
      };
      requests.set(row.id, row);
      return clone(row);
    },
    async updateRequest(id, data) {
      const row = requests.get(Number(id));
      if (!row) return null;
      Object.assign(row, data, { updatedAt: nowIso() });
      return clone(row);
    },
    async listFansForBand(bandId, { search = '', limit = 40 } = {}) {
      const q = String(search || '').trim().toLowerCase();
      const max = Math.min(50, Math.max(1, parseInt(limit, 10) || 40));
      const rows = [];
      for (const fan of fans.values()) {
        if (Number(fan.band) !== Number(bandId)) continue;
        if (fan.status === 'removed') continue;
        if (q) {
          const name = String(fan.firstName || '').toLowerCase();
          const last = String(fan.lastName || '').toLowerCase();
          const city = String(fan.city || '').toLowerCase();
          if (!name.includes(q) && !last.includes(q) && !city.includes(q)) continue;
        }
        rows.push(clone(fan));
        if (rows.length >= max) break;
      }
      return rows;
    },
    async findBand(id) {
      return clone(bands.get(Number(id)));
    },
    async findUser(id) {
      return clone(users.get(Number(id)));
    },
    async getBandRole(bandId, userId) {
      return members.get(`${bandId}:${userId}`) || null;
    },
    async findConversationById(id) {
      return clone(conversations.get(Number(id)));
    },
    async findConversationByPairKey(key) {
      for (const row of conversations.values()) {
        if (row.pairKey === key) return clone(row);
      }
      return null;
    },
    async listConversationsByBand(bandId) {
      return [...conversations.values()]
        .filter((c) => Number(c.band) === Number(bandId))
        .map(clone);
    },
    async listConversationsForFanUser(userId) {
      return [...conversations.values()]
        .filter((c) => Number(c.fanAccountUser) === Number(userId))
        .map(clone);
    },
    async createConversation(data) {
      if ([...conversations.values()].some((c) => c.pairKey === data.pairKey)) {
        const e = new Error('duplicate key value violates unique constraint "conversations_pair_key_unique"');
        e.code = '23505';
        throw e;
      }
      const row = {
        id: convSeq++,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        lastMessageAt: null,
        lastMessagePreview: null,
        lastMessageSenderSide: null,
        lastMessageId: null,
        status: 'active',
        originType: 'artist_direct',
        ...data,
      };
      conversations.set(row.id, row);
      return clone(row);
    },
    async updateConversation(id, data) {
      const row = conversations.get(Number(id));
      if (!row) return null;
      Object.assign(row, data, { updatedAt: nowIso() });
      return clone(row);
    },
    async listParticipants(conversationId) {
      return [...participants.values()]
        .filter((p) => Number(p.conversation) === Number(conversationId))
        .map(clone);
    },
    async findParticipantById(id) {
      return clone(participants.get(Number(id)));
    },
    async createParticipant(data) {
      if ([...participants.values()].some((p) => p.conversationSideKey === data.conversationSideKey)) {
        const e = new Error('duplicate key value violates unique constraint');
        e.code = '23505';
        throw e;
      }
      const row = {
        id: partSeq++,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        lastReadAt: null,
        lastReadMessageId: null,
        blockedAt: null,
        ...data,
      };
      participants.set(row.id, row);
      return clone(row);
    },
    async updateParticipant(id, data) {
      const row = participants.get(Number(id));
      if (!row) return null;
      Object.assign(row, data, { updatedAt: nowIso() });
      return clone(row);
    },
    async findMessageById(id) {
      const row = messages.get(Number(id));
      if (!row) return null;
      const out = clone(row);
      if (out && out.attachmentMedia != null && typeof out.attachmentMedia !== 'object') {
        out.attachmentMedia = clone(files.get(Number(out.attachmentMedia)));
      }
      if (out && Array.isArray(out.attachmentGallery)) {
        out.attachmentGallery = out.attachmentGallery.map((item) => (
          item && typeof item === 'object' ? item : clone(files.get(Number(item))) || item
        ));
      }
      return out;
    },
    async findMessageByIdempotencyKey(key) {
      if (!key) return null;
      for (const row of messages.values()) {
        if (row.idempotencyKey === key) return clone(row);
      }
      return null;
    },
    async findUploadFile(id) {
      return clone(files.get(Number(id)));
    },
    async findMessageUsingMedia(mediaId) {
      const mid = Number(mediaId);
      for (const row of messages.values()) {
        const media = pure.collectMessageMedia(row);
        if (media.some((item) => Number(item?.id || item) === mid)) return clone(row);
      }
      return null;
    },
    async listMessages(conversationId) {
      return [...messages.values()]
        .filter((m) => Number(m.conversation) === Number(conversationId))
        .map(clone);
    },
    async createMessage(data) {
      if (data.idempotencyKey) {
        for (const row of messages.values()) {
          if (row.idempotencyKey === data.idempotencyKey) {
            const e = new Error('duplicate key value violates unique constraint');
            e.code = '23505';
            throw e;
          }
        }
      }
      const row = {
        id: msgSeq++,
        createdAt: nowIso(),
        updatedAt: nowIso(),
        ...data,
      };
      if (data.attachmentMedia != null && typeof data.attachmentMedia !== 'object') {
        row.attachmentMedia = files.get(Number(data.attachmentMedia)) || data.attachmentMedia;
      }
      if (Array.isArray(data.attachmentGallery)) {
        row.attachmentGallery = data.attachmentGallery.map((id) => (
          typeof id === 'object' ? id : files.get(Number(id)) || id
        ));
      }
      messages.set(row.id, row);
      return clone(row);
    },
    async transaction(fn) {
      return fn();
    },
    async batchEngagementTiers() {
      return {};
    },
    async batchShowSummaries(fanIds) {
      const ids = [...new Set((fanIds || []).map((id) => Number(id)).filter(Boolean))];
      const out = {};
      for (const id of ids) out[id] = emptyShowSummary();
      const byFan = {};
      for (const row of attendances) {
        if (row.suppressedDuplicate === true) continue;
        const fanId = Number(row.fan);
        if (!ids.includes(fanId)) continue;
        if (!byFan[fanId]) byFan[fanId] = [];
        byFan[fanId].push(row);
      }
      const { showStatsFromAttendances } = require('../fans/canonicalAttendance');
      const { summaryFromStats } = require('../fans/canonicalShowSummary');
      for (const id of ids) {
        out[id] = summaryFromStats(showStatsFromAttendances(byFan[id] || []));
      }
      return out;
    },
  };
}

function createStrapiInboxStore(strapi) {
  const logger = strapi.log;

  async function withTransaction(fn) {
    if (typeof strapi.db?.transaction === 'function') {
      return strapi.db.transaction(async () => fn());
    }
    return fn();
  }

  function relId(entity, key) {
    const v = entity?.[key];
    if (v && typeof v === 'object') return v.id;
    return v ?? null;
  }

  function normalizeConv(row) {
    if (!row) return null;
    return {
      ...row,
      band: relId(row, 'band') ?? row.band,
      fanAccountUser: relId(row, 'fanAccountUser') ?? row.fanAccountUser,
      originFan: relId(row, 'originFan') ?? row.originFan,
    };
  }

  function normalizePart(row) {
    if (!row) return null;
    return {
      ...row,
      conversation: relId(row, 'conversation') ?? row.conversation,
      accountUser: relId(row, 'accountUser') ?? row.accountUser,
    };
  }

  function normalizeMsg(row) {
    if (!row) return null;
    return {
      ...row,
      conversation: relId(row, 'conversation') ?? row.conversation,
      senderParticipant: relId(row, 'senderParticipant') ?? row.senderParticipant,
      senderUser: relId(row, 'senderUser') ?? row.senderUser,
    };
  }

  return {
    logger,
    async findFan(id) {
      const row = await strapi.entityService.findOne(UID_FAN, id, {
        fields: [
          'id',
          'firstName',
          'lastName',
          'status',
          'city',
          'checkedInShowCount',
          'subscribedAt',
          'suppressionReason',
        ],
        populate: {
          band: { fields: ['id'] },
          accountUser: { fields: ['id'] },
        },
      });
      if (!row) return null;
      return {
        ...row,
        band: row.band?.id ?? row.band,
        accountUser: row.accountUser?.id ?? row.accountUser,
      };
    },
    async listFansForBand(bandId, { search = '', limit = 40 } = {}) {
      const q = String(search || '').trim();
      const max = Math.min(50, Math.max(1, parseInt(limit, 10) || 40));
      const filters = {
        band: bandId,
        status: { $ne: 'removed' },
      };
      if (q) {
        filters.$or = [
          { firstName: { $containsi: q } },
          { lastName: { $containsi: q } },
          { city: { $containsi: q } },
        ];
      }
      const rows = await strapi.entityService.findMany(UID_FAN, {
        filters,
        fields: ['id', 'firstName', 'lastName', 'status', 'city', 'checkedInShowCount'],
        populate: { accountUser: { fields: ['id'] } },
        limit: max,
        sort: { firstName: 'asc' },
      });
      return (rows || []).map((row) => ({
        ...row,
        band: bandId,
        accountUser: row.accountUser?.id ?? row.accountUser,
      }));
    },
    async findFanByAccountUserAndBand(userId, bandId) {
      const rows = await strapi.entityService.findMany(UID_FAN, {
        filters: { accountUser: userId, band: bandId },
        fields: ['id', 'firstName', 'lastName', 'status', 'city', 'checkedInShowCount', 'email'],
        populate: {
          band: { fields: ['id'] },
          accountUser: { fields: ['id'] },
        },
        limit: 1,
      });
      const row = rows?.[0];
      if (!row) return null;
      return {
        ...row,
        band: row.band?.id ?? row.band ?? bandId,
        accountUser: row.accountUser?.id ?? row.accountUser,
      };
    },
    async findFansByAccountUser(userId) {
      const rows = await strapi.entityService.findMany(UID_FAN, {
        filters: { accountUser: userId },
        fields: ['id', 'firstName', 'lastName', 'status', 'city', 'checkedInShowCount'],
        populate: { band: { fields: ['id'] }, accountUser: { fields: ['id'] } },
        limit: 100,
      });
      return (rows || []).map((row) => ({
        ...row,
        band: row.band?.id ?? row.band,
        accountUser: row.accountUser?.id ?? row.accountUser,
      }));
    },
    async findFanProfileByUser(userId) {
      const rows = await strapi.entityService.findMany('api::fan-profile.fan-profile', {
        filters: { user: userId },
        fields: ['id', 'firstName', 'lastName', 'displayName'],
        sort: { id: 'asc' },
        limit: 1,
      });
      return rows?.[0] || null;
    },
    async findFanByEmailAndBand(email, bandId) {
      const needle = String(email || '').trim();
      if (!needle) return null;
      const rows = await strapi.entityService.findMany(UID_FAN, {
        filters: { email: { $eqi: needle }, band: bandId },
        fields: ['id', 'firstName', 'lastName', 'status', 'city', 'checkedInShowCount', 'email'],
        populate: { band: { fields: ['id'] }, accountUser: { fields: ['id'] } },
        sort: ['id:asc'],
        limit: 5,
      });
      const row = rows?.[0];
      if (!row) return null;
      return {
        ...row,
        band: row.band?.id ?? row.band ?? bandId,
        accountUser: row.accountUser?.id ?? row.accountUser,
      };
    },
    async createFan(data) {
      const email = normalizeEmail(data?.email) || data?.email;
      const bandId = data?.band;
      const result = await createFanIdempotent(strapi, {
        bandId,
        data: { ...data, email },
      });
      const row = result.fan;
      const fan = {
        ...row,
        band: row.band?.id ?? row.band ?? data.band,
        accountUser: row.accountUser?.id ?? row.accountUser ?? data.accountUser,
      };
      if (result.created) {
        try {
          const { produceFanJoined } = require('../relationshipEvents/relationshipEventProducers');
          await produceFanJoined(strapi, fan);
        } catch (err) {
          strapi.log?.warn?.(`[RelationshipEvent] fan_joined skipped: ${err.message}`);
        }
      }
      return fan;
    },
    async updateFan(id, data) {
      const row = await strapi.entityService.update(UID_FAN, id, {
        data,
        populate: { band: { fields: ['id'] }, accountUser: { fields: ['id'] } },
      });
      return {
        ...row,
        band: row.band?.id ?? row.band,
        accountUser: row.accountUser?.id ?? row.accountUser,
      };
    },
    normalizeRequest(row) {
      if (!row) return null;
      return {
        ...row,
        requesterUser: relId(row, 'requesterUser') ?? row.requesterUser,
        requesterFan: relId(row, 'requesterFan') ?? row.requesterFan,
        recipientBand: relId(row, 'recipientBand') ?? row.recipientBand,
        conversation: relId(row, 'conversation') ?? row.conversation,
        requesterFanRow: row.requesterFan && typeof row.requesterFan === 'object' && row.requesterFan.firstName !== undefined
          ? {
              ...row.requesterFan,
              band: row.requesterFan.band?.id ?? row.requesterFan.band,
              accountUser: row.requesterFan.accountUser?.id ?? row.requesterFan.accountUser,
            }
          : null,
        recipientBandRow: row.recipientBand && typeof row.recipientBand === 'object' && row.recipientBand.name
          ? {
              id: row.recipientBand.id,
              name: row.recipientBand.name,
              slug: row.recipientBand.slug || null,
              avatarUrl: row.recipientBand.bandImg?.url || row.recipientBand.avatarUrl || null,
            }
          : null,
      };
    },
    async findRequestById(id) {
      const row = await strapi.entityService.findOne(UID_REQ, id, {
        populate: {
          requesterUser: { fields: ['id'] },
          requesterFan: {
            fields: ['id', 'firstName', 'lastName', 'city', 'checkedInShowCount', 'status'],
            populate: { accountUser: { fields: ['id'] } },
          },
          recipientBand: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
          conversation: { fields: ['id'] },
        },
      });
      return this.normalizeRequest(row);
    },
    async findPendingRequestByPairKey(key) {
      if (!key) return null;
      const rows = await strapi.entityService.findMany(UID_REQ, {
        filters: { pendingPairKey: key, status: 'pending' },
        limit: 1,
        populate: {
          requesterFan: {
            fields: ['id', 'firstName', 'lastName', 'city', 'checkedInShowCount', 'status'],
            populate: { accountUser: { fields: ['id'] } },
          },
          recipientBand: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
        },
      });
      return this.normalizeRequest(rows?.[0] || null);
    },
    async findLatestDeclinedByPairKey(key) {
      if (!key) return null;
      const rows = await strapi.entityService.findMany(UID_REQ, {
        filters: { pairKey: key, status: 'declined' },
        sort: { declinedAt: 'desc' },
        limit: 1,
      });
      return this.normalizeRequest(rows?.[0] || null);
    },
    async listRequestsByBand(bandId, { status } = {}) {
      const filters = { recipientBand: bandId };
      if (status) filters.status = status;
      const rows = await strapi.entityService.findMany(UID_REQ, {
        filters,
        sort: { createdAt: 'desc' },
        limit: 200,
        populate: {
          requesterFan: {
            fields: ['id', 'firstName', 'lastName', 'city', 'checkedInShowCount', 'status'],
            populate: { accountUser: { fields: ['id'] } },
          },
        },
      });
      return (rows || []).map((row) => this.normalizeRequest(row));
    },
    async listRequestsByRequesterUser(userId) {
      const rows = await strapi.entityService.findMany(UID_REQ, {
        filters: { requesterUser: userId },
        sort: { createdAt: 'desc' },
        limit: 200,
        populate: {
          requesterFan: {
            fields: ['id', 'firstName', 'lastName', 'status'],
            populate: { accountUser: { fields: ['id'] } },
          },
          recipientBand: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
        },
      });
      return (rows || []).map((row) => this.normalizeRequest(row));
    },
    async createRequest(data) {
      const row = await strapi.entityService.create(UID_REQ, { data });
      return this.normalizeRequest(row);
    },
    async updateRequest(id, data) {
      const row = await strapi.entityService.update(UID_REQ, id, { data });
      return this.normalizeRequest(row);
    },
    async findBand(id) {
      const row = await strapi.entityService.findOne(UID_BAND, id, {
        fields: ['id', 'name', 'slug'],
        populate: { bandImg: true },
      });
      if (!row) return null;
      return {
        id: row.id,
        name: row.name,
        slug: row.slug || null,
        avatarUrl: row.bandImg?.url || null,
      };
    },
    async findUser(id) {
      return strapi.entityService.findOne('plugin::users-permissions.user', id, {
        fields: ['id', 'email'],
      });
    },
    async getBandRole(bandId, userId) {
      const { getBandRole } = require('../bandRoles');
      return getBandRole(strapi, bandId, userId);
    },
    async findConversationById(id) {
      const row = await strapi.entityService.findOne(UID_CONV, id, {
        populate: {
          band: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
          fanAccountUser: { fields: ['id'] },
          originFan: { fields: ['id'] },
        },
      });
      if (!row) return null;
      return {
        ...normalizeConv(row),
        bandRow: row.band && typeof row.band === 'object' ? row.band : null,
      };
    },
    async findConversationByPairKey(key) {
      const rows = await strapi.entityService.findMany(UID_CONV, {
        filters: { pairKey: key },
        limit: 1,
        populate: {
          band: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
          fanAccountUser: { fields: ['id'] },
          originFan: { fields: ['id'] },
        },
      });
      const row = rows?.[0] || null;
      if (!row) return null;
      return {
        ...normalizeConv(row),
        bandRow: row.band && typeof row.band === 'object' ? row.band : null,
      };
    },
    async listConversationsByBand(bandId) {
      const rows = await strapi.entityService.findMany(UID_CONV, {
        filters: { band: bandId },
        sort: { lastMessageAt: 'desc' },
        limit: 500,
        populate: {
          fanAccountUser: { fields: ['id'] },
          originFan: {
            fields: ['id', 'firstName', 'lastName', 'city', 'checkedInShowCount', 'status', 'subscribedAt'],
            populate: { accountUser: { fields: ['id'] } },
          },
        },
      });
      return (rows || []).map((row) => ({
        ...normalizeConv(row),
        originFanRow: row.originFan && typeof row.originFan === 'object'
          ? {
              ...row.originFan,
              accountUser: row.originFan.accountUser?.id ?? row.originFan.accountUser,
            }
          : null,
      }));
    },
    async listConversationsForFanUser(userId) {
      // fanAccountUser is a manyToOne relation (join table). Never put it in
      // `fields` — Strapi treats those as scalar columns and SQLite throws
      // `no such column: t0.fanAccountUser`. Filter + populate only.
      const rows = await strapi.entityService.findMany(UID_CONV, {
        filters: { fanAccountUser: { id: userId } },
        sort: { lastMessageAt: 'desc' },
        limit: 500,
        populate: {
          band: { fields: ['id', 'name', 'slug'], populate: { bandImg: true } },
          originFan: { fields: ['id', 'status'] },
          fanAccountUser: { fields: ['id'] },
        },
      });
      return (rows || []).map((row) => ({
        ...normalizeConv(row),
        bandRow: row.band && typeof row.band === 'object' ? row.band : null,
        originFanRow: row.originFan && typeof row.originFan === 'object' ? row.originFan : null,
      }));
    },
    async createConversation(data) {
      const row = await strapi.entityService.create(UID_CONV, { data });
      return normalizeConv(row);
    },
    async updateConversation(id, data) {
      const row = await strapi.entityService.update(UID_CONV, id, { data });
      return normalizeConv(row);
    },
    async listParticipants(conversationId) {
      const rows = await strapi.entityService.findMany(UID_PART, {
        filters: { conversation: conversationId },
        limit: 10,
        populate: { accountUser: { fields: ['id'] } },
      });
      return (rows || []).map(normalizePart);
    },
    async findParticipantById(id) {
      const row = await strapi.entityService.findOne(UID_PART, id, {
        populate: { accountUser: { fields: ['id'] }, conversation: { fields: ['id'] } },
      });
      return normalizePart(row);
    },
    async createParticipant(data) {
      const row = await strapi.entityService.create(UID_PART, { data });
      return normalizePart(row);
    },
    async updateParticipant(id, data) {
      const row = await strapi.entityService.update(UID_PART, id, { data });
      return normalizePart(row);
    },
    async findMessageById(id) {
      const row = await strapi.entityService.findOne(UID_MSG, id, {
        populate: MESSAGE_POPULATE,
      });
      return normalizeMsg(row);
    },
    async findMessageByIdempotencyKey(key) {
      if (!key) return null;
      const rows = await strapi.entityService.findMany(UID_MSG, {
        filters: { idempotencyKey: key },
        limit: 1,
        populate: MESSAGE_POPULATE,
      });
      return normalizeMsg(rows?.[0] || null);
    },
    async findUploadFile(id) {
      return strapi.entityService.findOne('plugin::upload.file', id, {
        fields: [
          'id',
          'url',
          'mime',
          'size',
          'width',
          'height',
          'alternativeText',
          'name',
          'createdAt',
          'provider',
          'provider_metadata',
          'formats',
        ],
        populate: { createdBy: { fields: ['id'] } },
      });
    },
    async findMessageUsingMedia(mediaId) {
      const byLegacy = await strapi.entityService.findMany(UID_MSG, {
        filters: { attachmentMedia: mediaId },
        limit: 1,
        fields: ['id'],
      });
      if (byLegacy?.[0]) return byLegacy[0];
      const byGallery = await strapi.entityService.findMany(UID_MSG, {
        filters: { attachmentGallery: mediaId },
        limit: 1,
        fields: ['id'],
      });
      return byGallery?.[0] || null;
    },
    async listMessages(conversationId) {
      const rows = await strapi.entityService.findMany(UID_MSG, {
        filters: { conversation: conversationId },
        sort: { createdAt: 'asc' },
        limit: 5000,
        populate: MESSAGE_POPULATE,
      });
      return (rows || []).map(normalizeMsg);
    },
    async createMessage(data) {
      const row = await strapi.entityService.create(UID_MSG, {
        data,
        populate: MESSAGE_POPULATE,
      });
      return normalizeMsg(row);
    },
    async transaction(fn) {
      return withTransaction(fn);
    },
    async batchEngagementTiers(fanIds) {
      if (!fanIds?.length) return {};
      try {
        const svc = strapi.service('api::fan-interaction.fan-interaction');
        if (!svc?.calculateBatchEngagementScores) return {};
        const map = await svc.calculateBatchEngagementScores(fanIds);
        const out = {};
        for (const [id, val] of Object.entries(map || {})) {
          out[id] = val?.tier || null;
        }
        return out;
      } catch (err) {
        logSafe(logger, 'warn', '[Inbox] engagement lookup skipped', { error: err.message });
        return {};
      }
    },
    async batchShowSummaries(fanIds) {
      return getCanonicalFanShowSummaries(strapi, { fanIds });
    },
  };
}

function createInboxService(store, options = {}) {
  const logger = options.logger || store.logger || console;
  const strapi = options.strapi || null;
  const env = options.env || process.env;
  const resolveFanIdentitiesRaw = options.resolveFanIdentities
    || ((fans) => Promise.resolve(fanProfilePure.resolveIdentitiesFromFans(fans)));
  // Closure-only capability used by the already-authorized campaign worker.
  // It cannot be supplied through an HTTP request and prevents interactive
  // rate limits / permission lookups from turning a large broadcast into N+1.
  const campaignWorkerCapability = Symbol('campaign-worker-send');
  const requireArtistAccessRaw =
    options.requireArtistAccess ||
    (async (userId, bandId) => {
      const role = await store.getBandRole(bandId, userId);
      if (role === 'owner') return { hasAccess: true, role, permissions: { sendFanMessages: true } };
      return null;
    });
  const resolveGalleryReferencesRaw =
    options.resolveGalleryReferences ||
    (strapi
      ? async ({ userId, updateIds }) => {
          const { createArtistUpdateService } = require('../artistUpdates/artistUpdateService');
          const result = await createArtistUpdateService(strapi).listAccessibleByIds({
            userId,
            updateIds,
          });
          return result?.data || [];
        }
      : async () => []);

  async function loadShowSummaries(fanIds) {
    const ids = [...new Set((fanIds || []).map((id) => Number(id)).filter(Boolean))];
    if (!ids.length) return {};
    if (typeof store.batchShowSummaries === 'function') {
      return store.batchShowSummaries(ids);
    }
    if (strapi) return getCanonicalFanShowSummaries(strapi, { fanIds: ids });
    const out = {};
    for (const id of ids) out[id] = emptyShowSummary();
    return out;
  }

  function summaryFor(summaries, fanId) {
    if (fanId == null) return emptyShowSummary();
    return summaries?.[fanId] || summaries?.[String(fanId)] || emptyShowSummary();
  }

  function fanForIdentity(fan, conversation) {
    if (!fan) return fan;
    if (fan.accountUser != null || fan.accountUserId != null) return fan;
    const fromConv = conversation?.fanAccountUser;
    if (fromConv == null) return fan;
    return { ...fan, accountUser: fromConv };
  }

  async function identitiesForFans(fans, conversation) {
    const prepared = (fans || [])
      .filter(Boolean)
      .map((fan) => fanForIdentity(fan, conversation));
    const map = await resolveFanIdentitiesRaw(prepared);
    return map || new Map();
  }

  async function identityForFan(fan, conversation) {
    if (!fan) return fanProfilePure.resolveFanDisplayIdentity({ fan: null, profile: null });
    const map = await identitiesForFans([fan], conversation);
    return map.get(fan.id)
      || fanProfilePure.resolveFanDisplayIdentity({ fan: fanForIdentity(fan, conversation), profile: null });
  }

  function artistFanPresentation(fan, identity, extra = {}) {
    const presented = fanProfilePure.presentResolvedIdentity(
      identity || fanProfilePure.resolveFanDisplayIdentity({ fan, profile: extra.profile || null })
    );
    const summary = extra.summary || emptyShowSummary();
    const showCount = extra.showCount != null ? extra.showCount : Number(summary.showCount) || 0;
    return {
      fanId: fan?.id || extra.fanId || null,
      displayName: presented.displayName,
      initials: presented.initials,
      avatarUrl: presented.avatarUrl,
      city: fan?.city || null,
      showCount,
      context: extra.context || pure.buildFanContextLine({
        city: fan?.city,
        showCount,
        tier: extra.tier,
        displayName: presented.displayName,
      }),
    };
  }

  async function requireArtistAccess(userId, bandId, { logSuccess = false } = {}) {
    const access = await requireArtistAccessRaw(userId, bandId);
    if (!access) {
      inboxLog(logger, 'permission', {
        actorUserId: userId,
        bandId,
        allowed: false,
        permission: ARTIST_INBOX_PERMISSION,
      });
      return null;
    }
    if (logSuccess) {
      inboxLog(logger, 'permission', {
        actorUserId: userId,
        bandId,
        allowed: true,
        role: access.role,
        permission: ARTIST_INBOX_PERMISSION,
      });
    }
    return access;
  }

  function partsBySide(parts) {
    return {
      band: (parts || []).find((p) => p.side === 'band') || null,
      fan: (parts || []).find((p) => p.side === 'fan') || null,
    };
  }

  async function loadGraph(conversationId) {
    const conversation = await store.findConversationById(conversationId);
    if (!conversation) return null;
    const parts = await store.listParticipants(conversationId);
    const sided = partsBySide(parts);
    let originFan = conversation.originFanRow || null;
    if (!originFan && conversation.originFan) {
      originFan = await store.findFan(conversation.originFan);
    }
    let band = conversation.bandRow || null;
    if (!band && conversation.band) {
      band = await store.findBand(conversation.band);
    }
    if (band && !band.avatarUrl && band.bandImg?.url) {
      band = { ...band, avatarUrl: band.bandImg.url };
    }
    return { conversation, parts, sided, originFan, band };
  }

  function fanParticipantIntegrity(conversation, fanPart) {
    const canonicalUserId = conversation?.fanAccountUser;
    if (canonicalUserId == null || canonicalUserId === '') {
      return { status: 'no_canonical', canonicalUserId: null, participantId: fanPart?.id || null };
    }
    if (!fanPart) {
      return { status: 'missing', canonicalUserId, participantId: null };
    }
    if (fanPart.accountUser == null || fanPart.accountUser === '') {
      return { status: 'null', canonicalUserId, participantId: fanPart.id };
    }
    if (Number(fanPart.accountUser) === Number(canonicalUserId)) {
      return { status: 'ok', canonicalUserId, participantId: fanPart.id };
    }
    return {
      status: 'conflict',
      canonicalUserId,
      participantId: fanPart.id,
      reason: 'fan_participant_account_user_mismatch',
    };
  }

  async function resolveAccess(userId, graph) {
    if (!userId || !graph) return { role: null, participant: null };
    const integrity = fanParticipantIntegrity(graph.conversation, graph.sided.fan);
    if (
      integrity.canonicalUserId != null &&
      Number(integrity.canonicalUserId) === Number(userId) &&
      integrity.status === 'ok'
    ) {
      return { role: 'fan', participant: graph.sided.fan };
    }
    const access = await requireArtistAccess(userId, graph.conversation.band);
    if (access) {
      return { role: 'artist', participant: graph.sided.band, access };
    }
    return { role: null, participant: null };
  }

  function serializeArtistConversation(graph, unreadCount, extra = {}) {
    const fan = extra.originFan || graph.originFan || {};
    const flags = pure.messagingFlags({
      conversation: graph.conversation,
      originFan: fan,
      fanParticipant: graph.sided.fan,
    });
    const c = graph.conversation;
    return {
      id: c.id,
      fan: artistFanPresentation(fan, extra.identity, extra),
      lastMessage: c.lastMessageAt
        ? {
            preview: c.lastMessagePreview || '',
            createdAt: c.lastMessageAt,
            senderSide: c.lastMessageSenderSide || null,
          }
        : null,
      unreadCount,
      blocked: flags.blocked,
      messagingAvailable: flags.messagingAvailable,
    };
  }

  function serializeFanConversation(graph, unreadCount, extra = {}) {
    const band = graph.band || {};
    const flags = pure.messagingFlags({
      conversation: graph.conversation,
      originFan: graph.originFan,
      fanParticipant: graph.sided.fan,
    });
    const c = graph.conversation;
    const showCount = Number(extra.showCount) || 0;
    return {
      id: c.id,
      artist: {
        id: band.id || c.band,
        name: band.name || 'Artist',
        slug: band.slug || null,
        avatarUrl: band.avatarUrl || band.bandImg?.url || null,
      },
      lastMessage: c.lastMessageAt
        ? {
            preview: c.lastMessagePreview || '',
            createdAt: c.lastMessageAt,
            senderSide: c.lastMessageSenderSide || null,
          }
        : null,
      unreadCount,
      blocked: flags.blocked,
      messagingAvailable: flags.messagingAvailable,
      showCount,
    };
  }

  function serializeMessage(message, {
    viewerSide,
    recipientParticipant,
    galleryReferences = new Map(),
  }) {
    const attachments = pure.serializeAttachments(message, {
      conversationId: message.conversation?.id || message.conversation,
      publicOrigin: String(process.env.PUBLIC_URL || process.env.STRAPI_URL || '').replace(/\/+$/, ''),
    });
    const parsed = galleryRef.parseGalleryReference(message.bodyText);
    const gallery = parsed.artistUpdateId
      ? galleryReferences.get(Number(parsed.artistUpdateId))
        || galleryRef.unavailableGalleryReference(parsed.artistUpdateId)
      : null;
    return {
      id: message.id,
      bodyText: pure.stripHtmlToPlain(parsed.bodyText),
      senderSide: message.senderSide,
      isMine: message.senderSide === viewerSide,
      createdAt: message.createdAt,
      seenByRecipient: pure.seenByRecipient(message, recipientParticipant),
      clientMessageId: message.clientMessageId || null,
      attachment: attachments[0] || null,
      attachments,
      galleryReference: gallery,
    };
  }

  async function galleryReferencesForViewer(userId, messages) {
    const updateIds = [...new Set((messages || [])
      .map((message) => galleryRef.parseGalleryReference(message?.bodyText).artistUpdateId)
      .filter(Boolean))];
    if (!userId || !updateIds.length) return new Map();
    const rows = await resolveGalleryReferencesRaw({ userId, updateIds });
    return new Map((rows || []).map((row) => [Number(row.id), row]));
  }

  async function authorizeGalleryReferenceForSend({
    userId,
    senderSide,
    graph,
    artistUpdateId,
  }) {
    const updateId = galleryRef.positiveId(artistUpdateId);
    if (!updateId) return { gallery: null, updateId: null };
    if (senderSide !== 'band') {
      return { error: errResult('gallery_not_available', 'Gallery is not available', 400) };
    }
    const senderRows = await resolveGalleryReferencesRaw({ userId, updateIds: [updateId] });
    const senderGallery = senderRows?.find((row) => Number(row.id) === updateId) || null;
    const bandId = Number(graph.conversation.band?.id || graph.conversation.band);
    if (
      !senderGallery ||
      Number(senderGallery.band?.id || senderGallery.band) !== bandId ||
      senderGallery.locked ||
      senderGallery.status !== 'published' ||
      Number(senderGallery.photoCount || senderGallery.media?.length || 0) < 1
    ) {
      return { error: errResult('gallery_not_available', 'Gallery is not available', 400) };
    }

    const fanUserId = Number(graph.sided.fan?.accountUser || graph.originFan?.accountUser);
    if (!fanUserId) {
      return { error: errResult('gallery_not_available', 'Gallery is not available', 400) };
    }
    const recipientRows = await resolveGalleryReferencesRaw({
      userId: fanUserId,
      updateIds: [updateId],
    });
    const recipientGallery = recipientRows?.find((row) => Number(row.id) === updateId) || null;
    if (!recipientGallery || recipientGallery.locked || !recipientGallery.media?.length) {
      return { error: errResult('gallery_not_available', 'Gallery is not available', 400) };
    }
    return { gallery: recipientGallery, updateId };
  }

  function serializeConversationDetail(graph, access, messages, unreadCount, extra = {}) {
    const viewerSide = access.role === 'fan' ? 'fan' : 'band';
    const recipient = viewerSide === 'fan' ? graph.sided.band : graph.sided.fan;
    const flags = pure.messagingFlags({
      conversation: graph.conversation,
      originFan: graph.originFan,
      fanParticipant: graph.sided.fan,
    });
    const summary = extra.summary || emptyShowSummary();
    const showCount = Number(summary.showCount) || 0;

    const base = {
      id: graph.conversation.id,
      status: graph.conversation.status,
      originType: graph.conversation.originType,
      blocked: flags.blocked,
      messagingAvailable: flags.messagingAvailable,
      unreadCount,
      lastMessage: graph.conversation.lastMessageAt
        ? {
            preview: graph.conversation.lastMessagePreview || '',
            createdAt: graph.conversation.lastMessageAt,
            senderSide: graph.conversation.lastMessageSenderSide || null,
          }
        : null,
    };

    if (access.role === 'artist') {
      return {
        ...base,
        viewer: 'artist',
        fan: artistFanPresentation(graph.originFan, extra.identity, {
          summary,
          showCount,
        }),
        messages: (messages || []).map((m) =>
          serializeMessage(m, {
            viewerSide,
            recipientParticipant: recipient,
            galleryReferences: extra.galleryReferences,
          })
        ),
      };
    }

    return {
      ...base,
      viewer: 'fan',
      showCount,
      artist: {
        id: graph.band?.id || graph.conversation.band,
        name: graph.band?.name || 'Artist',
        slug: graph.band?.slug || null,
        avatarUrl: graph.band?.avatarUrl || null,
      },
      messages: (messages || []).map((m) =>
        serializeMessage(m, {
            viewerSide,
            recipientParticipant: recipient,
            galleryReferences: extra.galleryReferences,
          })
      ),
    };
  }

  async function ensureParticipants(conversation) {
    const existing = await store.listParticipants(conversation.id);
    const sided = partsBySide(existing);
    const joinedAt = new Date().toISOString();
    let createdBand = false;
    let createdFan = false;
    if (!sided.band) {
      sided.band = await store.createParticipant({
        conversation: conversation.id,
        side: 'band',
        accountUser: null,
        conversationSideKey: pure.conversationSideKey(conversation.id, 'band'),
        joinedAt,
      });
      createdBand = true;
    }
    if (!sided.fan) {
      sided.fan = await store.createParticipant({
        conversation: conversation.id,
        side: 'fan',
        accountUser: conversation.fanAccountUser,
        conversationSideKey: pure.conversationSideKey(conversation.id, 'fan'),
        joinedAt,
      });
      createdFan = true;
    } else if (
      (sided.fan.accountUser == null || sided.fan.accountUser === '') &&
      conversation.fanAccountUser
    ) {
      sided.fan = await store.updateParticipant(sided.fan.id, {
        accountUser: conversation.fanAccountUser,
      });
      inboxLog(logger, 'participants:heal-fan-account', {
        conversationId: conversation.id,
        participantId: sided.fan.id,
      });
    } else if (
      sided.fan.accountUser != null &&
      sided.fan.accountUser !== '' &&
      conversation.fanAccountUser &&
      Number(sided.fan.accountUser) !== Number(conversation.fanAccountUser)
    ) {
      inboxLog(logger, 'participants:integrity-conflict', {
        conversationId: conversation.id,
        canonicalUserId: conversation.fanAccountUser,
        participantId: sided.fan.id,
        reason: 'fan_participant_account_user_mismatch',
      });
    }
    if (createdBand || createdFan) {
      inboxLog(logger, 'participants:ensure', {
        conversationId: conversation.id,
        createdBand,
        createdFan,
      });
    }
    return sided;
  }

  async function getOrCreateConversationForFan({ userId, bandId, fanId }, internalCapability = null) {
    const requestId = newInboxRequestId();
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const bid = Number(bandId);
    const fid = Number(fanId);
    if (!bid || !fid) return errResult('invalid_request', 'bandId and fanId are required', 400);

    inboxLog(logger, 'conversation:start', {
      requestId,
      bandId: bid,
      fanId: fid,
      actorUserId: userId,
    });

    const workerAuthorized = internalCapability === campaignWorkerCapability;
    const access = workerAuthorized
      ? { hasAccess: true, role: 'campaign_worker', permissions: { sendFanMessages: true } }
      : await requireArtistAccess(userId, bid, { logSuccess: true });
    if (!access) {
      inboxLog(logger, 'conversation:start:failed', {
        requestId,
        bandId: bid,
        fanId: fid,
        stage: 'permission',
        reason: 'forbidden',
      });
      return errResult('forbidden', 'Not authorized for this conversation', 403);
    }

    const fan = await store.findFan(fid);
    if (!fan || Number(fan.band) !== bid) {
      inboxLog(logger, 'conversation:start:failed', {
        requestId,
        bandId: bid,
        fanId: fid,
        stage: 'fan_lookup',
        reason: 'fan_not_available',
      });
      return errResult('fan_not_available', 'Fan is not available for messaging', 409);
    }
    if (!fan.accountUser) {
      inboxLog(logger, 'conversation:start:failed', {
        requestId,
        bandId: bid,
        fanId: fid,
        stage: 'accountUser',
        reason: 'fan_not_available',
      });
      return errResult('fan_not_available', 'Fan is not available for messaging', 409);
    }
    if (Number(fan.accountUser) === Number(userId)) {
      inboxLog(logger, 'conversation:start:failed', {
        requestId,
        bandId: bid,
        fanId: fid,
        stage: 'self_dm',
        reason: 'fan_not_available',
      });
      return errResult('fan_not_available', 'Fan is not available for messaging', 409);
    }
    if (fan.status === 'removed') {
      inboxLog(logger, 'conversation:start:failed', {
        requestId,
        bandId: bid,
        fanId: fid,
        stage: 'removed',
        reason: 'fan_not_available',
      });
      return errResult('fan_not_available', 'Fan is not available for messaging', 409);
    }

    const key = pure.pairKey(bid, fan.accountUser);
    const identity = await identityForFan(fan);
    const existing = await store.findConversationByPairKey(key);
    if (existing) {
      await ensureParticipants(existing);
      const graph = await loadGraph(existing.id);
      const unread = await unreadForParticipant(graph, graph.sided.band);
      const summaries = await loadShowSummaries([fan.id]);
      inboxLog(logger, 'conversation:resolved', {
        requestId,
        conversationId: existing.id,
        created: false,
      });
      return ok({
        conversation: serializeArtistConversation(graph, unread, {
          originFan: fan,
          identity,
          summary: summaryFor(summaries, fan.id),
        }),
        conversationId: existing.id,
        created: false,
      });
    }

    try {
      const created = await store.transaction(async () => {
        const conversation = await store.createConversation({
          band: bid,
          fanAccountUser: fan.accountUser,
          originFan: fan.id,
          pairKey: key,
          status: 'active',
          originType: 'artist_direct',
        });
        await ensureParticipants(conversation);
        return conversation;
      });
      const graph = await loadGraph(created.id);
      const summaries = await loadShowSummaries([fan.id]);
      inboxLog(logger, 'conversation:resolved', {
        requestId,
        conversationId: created.id,
        created: true,
      });
      return ok({
        conversation: serializeArtistConversation(graph, 0, {
          originFan: fan,
          identity,
          summary: summaryFor(summaries, fan.id),
        }),
        conversationId: created.id,
        created: true,
      });
    } catch (err) {
      if (!pure.isUniqueViolation(err)) throw err;
      const raced = await store.findConversationByPairKey(key);
      if (!raced) throw err;
      await ensureParticipants(raced);
      const graph = await loadGraph(raced.id);
      const unread = await unreadForParticipant(graph, graph.sided.band);
      const summaries = await loadShowSummaries([fan.id]);
      inboxLog(logger, 'conversation:resolved', {
        requestId,
        conversationId: raced.id,
        created: false,
      });
      return ok({
        conversation: serializeArtistConversation(graph, unread, {
          originFan: fan,
          identity,
          summary: summaryFor(summaries, fan.id),
        }),
        conversationId: raced.id,
        created: false,
      });
    }
  }

  async function unreadForParticipant(graph, participant) {
    if (!participant) return 0;
    const msgs = await store.listMessages(graph.conversation.id);
    return pure.countUnreadForParticipant(msgs, participant);
  }

  async function assertConversationAccess(userId, conversationId, internalCapability = null) {
    if (!userId) return { error: errResult('unauthorized', 'Authentication required', 401) };
    let graph = await loadGraph(conversationId);
    if (!graph) {
      logSafe(logger, 'warn', '[Inbox] missing conversation', { userId, conversationId });
      return { error: errResult('forbidden', 'Not authorized for this conversation', 403) };
    }
    if (internalCapability === campaignWorkerCapability) {
      return {
        graph,
        access: { role: 'artist', participant: graph.sided.band, campaignWorker: true },
      };
    }
    await ensureParticipants(graph.conversation);
    graph = (await loadGraph(conversationId)) || graph;
    const access = await resolveAccess(userId, graph);
    if (!access.role) {
      logSafe(logger, 'warn', '[Inbox] unauthorized conversation access', {
        userId,
        conversationId,
        bandId: graph.conversation.band,
      });
      return { error: errResult('forbidden', 'Not authorized for this conversation', 403) };
    }
    return { graph, access };
  }

  async function listArtistConversations({ userId, bandId, page, pageSize }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);
    const access = await requireArtistAccess(userId, bid);
    if (!access) {
      logSafe(logger, 'warn', '[Inbox] unauthorized list', { userId, bandId: bid });
      return errResult('forbidden', 'Not authorized for this conversation', 403);
    }

    const rows = await store.listConversationsByBand(bid);
    const sorted = [...rows].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (bt !== at) return bt - at;
      return Number(b.id) - Number(a.id);
    });
    const paged = pure.paginateNewestFirst(sorted, { page, pageSize });
    const fanIds = paged.items.map((c) => c.originFanRow?.id || c.originFan).filter(Boolean);
    const tiers = store.batchEngagementTiers ? await store.batchEngagementTiers(fanIds) : {};
    const summaries = await loadShowSummaries(fanIds);

    const prepared = [];
    for (const row of paged.items) {
      const graph = await loadGraph(row.id);
      const originFan = fanForIdentity(row.originFanRow || graph.originFan, graph.conversation);
      const unread = await unreadForParticipant(graph, graph.sided.band);
      prepared.push({ graph, originFan, unread, fanId: originFan?.id });
    }
    const identities = await identitiesForFans(prepared.map((row) => row.originFan));
    const items = prepared.map(({ graph, originFan, unread, fanId }) => {
      const identity = identities.get(fanId)
        || fanProfilePure.resolveFanDisplayIdentity({ fan: originFan, profile: null });
      const summary = summaryFor(summaries, fanId);
      const tier = fanId != null ? tiers[fanId] || tiers[String(fanId)] : null;
      return serializeArtistConversation(graph, unread, {
        originFan,
        identity,
        tier,
        summary,
        context: pure.buildFanContextLine({
          city: originFan?.city,
          showCount: summary.showCount,
          tier,
          displayName: identity.displayName,
        }),
      });
    });

    return ok({
      conversations: items,
      page: paged.page,
      pageSize: paged.pageSize,
      total: paged.total,
      pageCount: paged.pageCount,
    });
  }

  async function listFanConversations({ userId, page, pageSize }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rows = await store.listConversationsForFanUser(userId);
    const sorted = [...rows].sort((a, b) => {
      const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (bt !== at) return bt - at;
      return Number(b.id) - Number(a.id);
    });
    const paged = pure.paginateNewestFirst(sorted, { page, pageSize });
    const summaries = await loadShowSummaries(paged.items.map((row) => (
      row.originFanRow?.id || row.originFan
    )));
    const items = [];
    for (const row of paged.items) {
      try {
        let graph = await loadGraph(row.id);
        if (!graph?.conversation) {
          inboxLog(logger, 'fan:list:omit', {
            conversationId: row.id,
            reason: 'missing_graph',
          });
          continue;
        }
        if (Number(graph.conversation.fanAccountUser) !== Number(userId)) continue;

        let integrity = fanParticipantIntegrity(graph.conversation, graph.sided.fan);
        if (integrity.status === 'missing' || integrity.status === 'null') {
          await ensureParticipants(graph.conversation);
          graph = (await loadGraph(row.id)) || graph;
          if (Number(graph.conversation.fanAccountUser) !== Number(userId)) continue;
          integrity = fanParticipantIntegrity(graph.conversation, graph.sided.fan);
        }
        if (integrity.status === 'conflict') {
          inboxLog(logger, 'participants:integrity-conflict', {
            conversationId: graph.conversation.id,
            canonicalUserId: integrity.canonicalUserId,
            participantId: integrity.participantId,
            reason: integrity.reason,
          });
          continue;
        }

        if (row.bandRow) {
          graph.band = {
            ...graph.band,
            ...row.bandRow,
            avatarUrl: row.bandRow.bandImg?.url || row.bandRow.avatarUrl || graph.band?.avatarUrl,
          };
        }
        const unread = await unreadForParticipant(graph, graph.sided.fan);
        items.push(serializeFanConversation(graph, unread, {
          showCount: summaryFor(
            summaries,
            graph.originFan?.id || row.originFanRow?.id || row.originFan
          ).showCount,
        }));
      } catch (err) {
        inboxLog(logger, 'fan:list:omit', {
          conversationId: row?.id || null,
          reason: 'unexpected_row_error',
          errorName: err?.name || null,
        });
      }
    }
    inboxLog(logger, 'fan:list', { actorUserId: userId, count: items.length, total: paged.total });
    return ok({
      conversations: items,
      page: paged.page,
      pageSize: paged.pageSize,
      total: paged.total,
      pageCount: paged.pageCount,
    });
  }

  async function getConversation({ userId, conversationId }) {
    const resolved = await assertConversationAccess(userId, conversationId);
    if (resolved.error) return resolved.error;
    const { graph, access } = resolved;
    const viewerSide = access.role === 'fan' ? 'fan' : 'band';
    const unread = await unreadForParticipant(graph, access.participant);
    const msgs = pure.filterMessagesWindow(await store.listMessages(graph.conversation.id), {
      limit: pure.MESSAGE_LIMIT_DEFAULT,
    });
    const originFanId = graph.originFan?.id;
    const summaries = originFanId
      ? await loadShowSummaries([originFanId])
      : {};
    const galleryReferences = await galleryReferencesForViewer(userId, msgs);
    const identity = access.role === 'artist'
      ? await identityForFan(graph.originFan, graph.conversation)
      : null;
    return ok({
      conversation: serializeConversationDetail(graph, access, msgs, unread, {
        summary: summaryFor(summaries, originFanId),
        galleryReferences,
        identity,
      }),
    });
  }

  async function listMessages({ userId, conversationId, beforeId, afterId, limit }) {
    const resolved = await assertConversationAccess(userId, conversationId);
    if (resolved.error) return resolved.error;
    const { graph, access } = resolved;
    const viewerSide = access.role === 'fan' ? 'fan' : 'band';
    const recipient = viewerSide === 'fan' ? graph.sided.band : graph.sided.fan;
    const capped = pure.clampMessageLimit(limit);
    const window = pure.filterMessagesWindow(await store.listMessages(graph.conversation.id), {
      beforeId: beforeId ? Number(beforeId) : null,
      afterId: afterId ? Number(afterId) : null,
      limit: capped,
    });
    const galleryReferences = await galleryReferencesForViewer(userId, window);
    return ok({
      messages: window.map((m) =>
        serializeMessage(m, {
          viewerSide,
          recipientParticipant: recipient,
          galleryReferences,
        })
      ),
      limit: capped,
    });
  }

  async function resolveAuthorizedAttachments(userId, mediaIds) {
    const policy = mediaPure.dmAttachmentDeliveryPolicy(env);
    const allowPublicAttachment = !policy.ready && policy.publicFallbackAllowed;
    const files = [];
    for (const mediaId of mediaIds) {
      const file = await store.findUploadFile(mediaId);
      const auth = pure.authorizeUploadFile(file, userId, { allowPublicAttachment });
      if (auth.error) return { error: errResult(auth.error, auth.message, 400) };
      const used = await store.findMessageUsingMedia(mediaId);
      if (used) {
        return { error: errResult('invalid_attachment', 'Image is not available', 400) };
      }
      files.push({ mediaId, file });
    }
    return { files };
  }

  async function sendMessage({
    userId,
    conversationId,
    bodyText,
    clientMessageId,
    attachmentMediaId,
    attachmentMediaIds,
    artistUpdateId,
  }, internalCapability = null) {
    const requestId = newInboxRequestId();
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const parsedAttachments = pure.parseAttachmentMediaIds(attachmentMediaIds, attachmentMediaId);
    if (parsedAttachments && parsedAttachments.error) {
      return errResult(parsedAttachments.error, parsedAttachments.error === 'too_many_attachments'
        ? 'You can attach up to 4 images'
        : 'Image is not available', 400);
    }
    const mediaIds = Array.isArray(parsedAttachments) ? parsedAttachments : [];
    const requestedGalleryId = galleryRef.positiveId(artistUpdateId);
    if (artistUpdateId != null && artistUpdateId !== '' && !requestedGalleryId) {
      return errResult('gallery_not_available', 'Gallery is not available', 400);
    }
    if (requestedGalleryId && mediaIds.length) {
      return errResult('invalid_message', 'Send photos or a show gallery, not both', 400);
    }
    if (galleryRef.containsReservedMarker(bodyText)) {
      return errResult('invalid_message', 'Message is not available', 400);
    }
    const validated = pure.validateMessageContent(bodyText, {
      hasAttachment: mediaIds.length > 0 || Boolean(requestedGalleryId),
    });
    if (validated.error) return errResult(validated.error, validated.message, 400);

    const clientId = pure.normalizeClientMessageId(clientMessageId);
    if (clientId && clientId.error) {
      return errResult('invalid_client_message_id', 'Invalid clientMessageId', 400);
    }

    if (internalCapability !== campaignWorkerCapability) {
      const rate = checkInboxSendRate({ userId, conversationId });
      if (rate.limited) {
        return errResult('rate_limited', 'Too many messages. Try again shortly.', 429, {
          retryAfter: rate.retryAfter,
        });
      }
    }

    const resolved = await assertConversationAccess(userId, conversationId, internalCapability);
    if (resolved.error) return resolved.error;
    const { graph, access } = resolved;
    const senderSide = access.role === 'fan' ? 'fan' : 'band';

    inboxLog(logger, 'message:send:start', {
      requestId,
      conversationId: graph.conversation.id,
      actorUserId: userId,
      senderSide,
    });

    const block = pure.sendBlockReason({
      conversation: graph.conversation,
      originFan: graph.originFan,
      fanParticipant: graph.sided.fan,
    });
    inboxLog(logger, 'message:eligibility', {
      conversationId: graph.conversation.id,
      conversationStatus: graph.conversation.status,
      fanStatus: graph.originFan?.status || 'unknown',
      fanBlocked: Boolean(graph.sided.fan?.blockedAt),
      allowed: !block,
    });
    if (block) {
      const reason = block === 'relationship_removed' ? 'fan_removed' : block;
      inboxLog(logger, 'send:blocked', {
        requestId,
        conversationId: graph.conversation.id,
        reason,
      });
      return errResult('conversation_not_available', 'This conversation is not available for messaging', 409);
    }
    const senderParticipant = access.participant;
    if (!senderParticipant) {
      logSafe(logger, 'warn', '[Inbox] participant mismatch', { userId, conversationId });
      return errResult('forbidden', 'Not authorized for this conversation', 403);
    }

    const idemKey = pure.idempotencyKey(graph.conversation.id, userId, clientId);
    if (idemKey) {
      const existing = await store.findMessageByIdempotencyKey(idemKey);
      if (existing) {
        const recipient = senderSide === 'fan' ? graph.sided.band : graph.sided.fan;
        inboxLog(logger, 'message:idempotent-retry', {
          requestId,
          conversationId: graph.conversation.id,
          messageId: existing.id,
        });
        const galleryReferences = await galleryReferencesForViewer(userId, [existing]);
        return ok({
          message: serializeMessage(existing, {
            viewerSide: senderSide,
            recipientParticipant: recipient,
            galleryReferences,
          }),
          duplicate: true,
          conversation: {
            id: graph.conversation.id,
            lastMessageAt: graph.conversation.lastMessageAt,
            lastMessagePreview: graph.conversation.lastMessagePreview,
            lastMessageSenderSide: graph.conversation.lastMessageSenderSide,
          },
        });
      }
    }

    const galleryAuthorization = await authorizeGalleryReferenceForSend({
      userId,
      senderSide,
      graph,
      artistUpdateId: requestedGalleryId,
    });
    if (galleryAuthorization.error) return galleryAuthorization.error;

    const attachment = mediaIds.length
      ? await resolveAuthorizedAttachments(userId, mediaIds)
      : { files: [] };
    if (attachment.error) return attachment.error;
    const authorizedIds = (attachment.files || []).map((row) => row.mediaId);
    const persistedBodyText = galleryAuthorization.updateId
      ? galleryRef.encodeGalleryReference(galleryAuthorization.updateId, validated.bodyText)
      : validated.bodyText;

    try {
      const saved = await store.transaction(async () => {
        const message = await store.createMessage({
          conversation: graph.conversation.id,
          senderParticipant: senderParticipant.id,
          senderUser: userId,
          senderSide,
          bodyText: persistedBodyText,
          clientMessageId: clientId || null,
          idempotencyKey: idemKey,
          ...(authorizedIds[0] ? { attachmentMedia: authorizedIds[0] } : {}),
          ...(authorizedIds.length ? { attachmentGallery: authorizedIds } : {}),
        });
        const preview = galleryAuthorization.updateId
          ? galleryAuthorization.gallery?.show
            ? 'Shared a show gallery'
            : 'Shared an artist gallery'
          : pure.lastMessagePreviewText(
              validated.bodyText,
              authorizedIds.length > 0,
              authorizedIds.length
            );
        const conversation = await store.updateConversation(graph.conversation.id, {
          lastMessageAt: message.createdAt,
          lastMessagePreview: preview,
          lastMessageSenderSide: senderSide,
          lastMessageId: message.id,
        });
        return { message, conversation };
      });

      const recipient = senderSide === 'fan' ? graph.sided.band : graph.sided.fan;
      inboxLog(logger, 'message:persisted', {
        requestId,
        messageId: saved.message.id,
        conversationId: graph.conversation.id,
        idempotent: false,
        hasAttachments: authorizedIds.length > 0,
        attachmentCount: authorizedIds.length,
      });
      try {
        if (strapi) {
          const { produceMessageEvent } = require('../relationshipEvents/relationshipEventProducers');
          await produceMessageEvent(strapi, {
            senderSide,
            messageId: saved.message.id,
            conversationId: graph.conversation.id,
            bandId: graph.conversation.band?.id || graph.conversation.band,
            fanId: graph.originFan?.id || graph.originFan,
            occurredAt: saved.message.createdAt,
          });
        }
      } catch (err) {
        logger?.warn?.(`[RelationshipEvent] message event skipped: ${err.message}`);
      }
      return ok({
        message: serializeMessage(saved.message, {
          viewerSide: senderSide,
          recipientParticipant: recipient,
          galleryReferences: galleryAuthorization.gallery
            ? new Map([[Number(galleryAuthorization.updateId), galleryAuthorization.gallery]])
            : new Map(),
        }),
        duplicate: false,
        conversation: {
          id: saved.conversation.id,
          lastMessageAt: saved.conversation.lastMessageAt,
          lastMessagePreview: saved.conversation.lastMessagePreview,
          lastMessageSenderSide: saved.conversation.lastMessageSenderSide,
        },
      });
    } catch (err) {
      if (idemKey && pure.isUniqueViolation(err)) {
        const existing = await store.findMessageByIdempotencyKey(idemKey);
        if (existing) {
          const recipient = senderSide === 'fan' ? graph.sided.band : graph.sided.fan;
          inboxLog(logger, 'message:idempotent-retry', {
            requestId,
            conversationId: graph.conversation.id,
            messageId: existing.id,
          });
          try {
            if (strapi) {
              const { produceMessageEvent } = require('../relationshipEvents/relationshipEventProducers');
              await produceMessageEvent(strapi, {
                senderSide,
                messageId: existing.id,
                conversationId: graph.conversation.id,
                bandId: graph.conversation.band?.id || graph.conversation.band,
                fanId: graph.originFan?.id || graph.originFan,
                occurredAt: existing.createdAt,
              });
            }
          } catch (err) {
            logger?.warn?.(`[RelationshipEvent] message event skipped: ${err.message}`);
          }
          return ok({
            message: serializeMessage(existing, { viewerSide: senderSide, recipientParticipant: recipient }),
            duplicate: true,
          });
        }
      }
      inboxLog(logger, 'message:send:failed', {
        requestId,
        conversationId: graph.conversation.id,
        stage: 'persist',
        reason: pure.isUniqueViolation(err) ? 'unique_violation' : 'persist_error',
      });
      throw err;
    }
  }

  /**
   * Internal durable-campaign delivery. The worker authorizes the artist once
   * before processing recipients, then this path preserves all relationship,
   * block, transaction, and idempotency checks without interactive throttling.
   */
  async function sendCampaignMessage({
    authorizedArtistUserId,
    bandId,
    fanId,
    campaignId,
    bodyText,
    artistUpdateId = null,
  }) {
    const cid = Number(campaignId);
    if (!authorizedArtistUserId || !Number(bandId) || !Number(fanId) || !cid) {
      return errResult('invalid_request', 'Campaign delivery context is required', 400);
    }

    const started = await getOrCreateConversationForFan(
      {
        userId: authorizedArtistUserId,
        bandId,
        fanId,
      },
      campaignWorkerCapability
    );
    if (!started.ok) return started;

    return sendMessage(
      {
        userId: authorizedArtistUserId,
        conversationId: started.conversationId,
        bodyText,
        artistUpdateId,
        clientMessageId: `campaign:${cid}:fan:${Number(fanId)}`,
      },
      campaignWorkerCapability
    );
  }

  async function markRead({ userId, conversationId, throughMessageId }) {
    const resolved = await assertConversationAccess(userId, conversationId);
    if (resolved.error) return resolved.error;
    const { graph, access } = resolved;
    const throughId = Number(throughMessageId);
    if (!throughId) return errResult('invalid_request', 'throughMessageId is required', 400);

    const message = await store.findMessageById(throughId);
    if (!message || Number(message.conversation) !== Number(graph.conversation.id)) {
      return errResult('invalid_request', 'Message not found in this conversation', 400);
    }

    const next = pure.nextReadPosition(access.participant, message);
    if (next.moved) {
      await store.updateParticipant(access.participant.id, {
        lastReadMessageId: next.lastReadMessageId,
        lastReadAt: next.lastReadAt,
      });
    }
    const updatedGraph = await loadGraph(graph.conversation.id);
    const unread = await unreadForParticipant(updatedGraph, updatedGraph.sided[access.role === 'fan' ? 'fan' : 'band']);
    inboxLog(logger, 'read:update', {
      requestId: newInboxRequestId(),
      conversationId: graph.conversation.id,
      throughMessageId: next.lastReadMessageId,
      moved: next.moved,
    });
    return ok({ unreadCount: unread, lastReadMessageId: next.lastReadMessageId });
  }

  async function setBlocked({ userId, conversationId, blocked }) {
    const resolved = await assertConversationAccess(userId, conversationId);
    if (resolved.error) return resolved.error;
    const { graph, access } = resolved;
    if (access.role !== 'fan') {
      logSafe(logger, 'warn', '[Inbox] non-fan block attempt', { userId, conversationId });
      return errResult('forbidden', 'Not authorized for this conversation', 403);
    }
    const fanPart = graph.sided.fan;
    const blockedAt = blocked ? new Date().toISOString() : null;
    await store.updateParticipant(fanPart.id, { blockedAt });
    const updated = await loadGraph(graph.conversation.id);
    const flags = pure.messagingFlags({
      conversation: updated.conversation,
      originFan: updated.originFan,
      fanParticipant: updated.sided.fan,
    });
    return ok({ blocked: flags.blocked, messagingAvailable: flags.messagingAvailable });
  }

  async function unreadCountArtist({ userId, bandId }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);
    const access = await requireArtistAccess(userId, bid);
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);
    const rows = await store.listConversationsByBand(bid);
    let total = 0;
    for (const row of rows) {
      const graph = await loadGraph(row.id);
      total += await unreadForParticipant(graph, graph.sided.band);
    }
    return ok({ unreadCount: total });
  }

  async function unreadCountFan({ userId }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rows = await store.listConversationsForFanUser(userId);
    let total = 0;
    for (const row of rows) {
      const graph = await loadGraph(row.id);
      total += await unreadForParticipant(graph, graph.sided.fan);
    }
    return ok({ unreadCount: total });
  }

  async function listDmCandidates({ userId, bandId, search, limit }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);
    const access = await requireArtistAccess(userId, bid, { logSuccess: true });
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);
    if (!store.listFansForBand) {
      return errResult('invalid_request', 'Fan search is unavailable', 500);
    }

    const fans = await store.listFansForBand(bid, { search, limit: limit || 40 });
    const fanIds = fans.map((f) => f.id);
    const tiers = store.batchEngagementTiers ? await store.batchEngagementTiers(fanIds) : {};
    const summaries = await loadShowSummaries(fanIds);
    const identities = await identitiesForFans(fans);

    const items = fans.map((fan) => {
      const flags = pure.fanMessagingEligibility(fan);
      const isSelf = fan.accountUser != null && Number(fan.accountUser) === Number(userId);
      const tier = tiers[fan.id] || tiers[String(fan.id)] || null;
      const summary = summaryFor(summaries, fan.id);
      const identity = identities.get(fan.id)
        || fanProfilePure.resolveFanDisplayIdentity({ fan, profile: null });
      const presented = fanProfilePure.presentResolvedIdentity(identity);
      return {
        id: fan.id,
        displayName: presented.displayName,
        initials: presented.initials,
        avatarUrl: presented.avatarUrl,
        city: fan.city || null,
        showCount: summary.showCount,
        tier: pure.tierLabel(tier),
        context: pure.buildFanContextLine({
          city: fan.city,
          showCount: summary.showCount,
          tier,
          displayName: presented.displayName,
        }),
        isFaneqoMember: flags.isFaneqoMember,
        canDirectMessage: flags.canDirectMessage && !isSelf,
      };
    });

    inboxLog(logger, 'dm-candidates', {
      bandId: bid,
      candidateCount: items.length,
      memberCount: items.filter((row) => row.isFaneqoMember).length,
      eligibleCount: items.filter((row) => row.canDirectMessage).length,
    });

    return ok({ fans: items });
  }

  function protectedMediaSvc() {
    if (!strapi) return null;
    return createProtectedMediaService(strapi, env);
  }

  function mediaDeliveryStatus() {
    const policy = mediaPure.dmAttachmentDeliveryPolicy(env);
    return ok({
      ready: !!policy.ready,
      reason: policy.reason || null,
      attachmentsEnabled: !!policy.attachmentsEnabled,
      publicFallbackAllowed: !!policy.publicFallbackAllowed,
    });
  }

  async function uploadConversationMedia({ userId, conversationId, file }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const svc = protectedMediaSvc();
    if (!svc) return errResult('gated_delivery_unavailable', 'Protected delivery is not configured.', 503);
    const ready = svc.configured();
    if (!ready.ready) {
      return errResult('gated_delivery_unavailable', 'Protected delivery is not configured.', 503);
    }
    const resolved = await assertConversationAccess(userId, conversationId);
    if (resolved.error) return resolved.error;
    const { graph } = resolved;
    const block = pure.sendBlockReason({
      conversation: graph.conversation,
      originFan: graph.originFan,
      fanParticipant: graph.sided.fan,
    });
    if (block) {
      return errResult('conversation_not_available', 'This conversation is not available for messaging', 409);
    }
    const uploaded = await svc.uploadProtectedImage({
      userId,
      bandId: graph.conversation.band || null,
      file,
      domain: mediaPure.PROTECTED_DOMAIN_CONVERSATION,
    });
    if (uploaded?.error) {
      return errResult(uploaded.error, uploaded.message, uploaded.status || 500);
    }
    return ok(uploaded.data);
  }

  async function authorizeConversationMediaAccess({
    userId = null,
    conversationId,
    messageId,
    mediaId,
    size,
    exp,
    sig,
  } = {}) {
    const cid = Number(conversationId);
    const mid = Number(messageId);
    const fid = Number(mediaId);
    if (!cid || !mid || !fid) {
      return { error: errResult('not_found', 'Image is not available', 404) };
    }
    const message = await store.findMessageById(mid);
    if (!message) {
      return { error: errResult('not_found', 'Image is not available', 404) };
    }
    const messageConversationId = Number(message.conversation?.id || message.conversation);
    if (messageConversationId !== cid) {
      return { error: errResult('not_found', 'Image is not available', 404) };
    }
    if (!pure.mediaBelongsToMessage(message, fid)) {
      return { error: errResult('not_found', 'Image is not available', 404) };
    }
    const file = pure.collectMessageMedia(message).find((item) => Number(item?.id || item) === fid);
    if (!file || typeof file !== 'object' || !mediaPure.isConversationProtectedFile(file)) {
      return { error: errResult('not_found', 'Image is not available', 404) };
    }
    const token = mediaPure.verifyConversationMediaToken({
      conversationId: cid,
      messageId: mid,
      mediaId: fid,
      size,
      exp,
      sig,
    });
    let participantOk = false;
    if (userId) {
      const resolved = await assertConversationAccess(userId, cid);
      participantOk = !resolved.error;
    }
    const decision = pure.decideConversationMediaStreamAccess({
      participantOk,
      tokenOk: token.ok,
      userId,
    });
    if (!decision.allowed) {
      const status = decision.reason === 'token_required' ? 401 : 403;
      return { error: errResult('forbidden', 'Image is not available', status) };
    }
    const safeSize = token.ok ? token.size : mediaPure.normalizeSize(size);
    return { file, size: safeSize, conversationId: cid, messageId: mid, mediaId: fid };
  }

  async function streamConversationMedia({
    userId,
    conversationId,
    messageId,
    mediaId,
    size,
    exp,
    sig,
  } = {}) {
    const requestId = newInboxRequestId();
    const authorized = await authorizeConversationMediaAccess({
      userId,
      conversationId,
      messageId,
      mediaId,
      size,
      exp,
      sig,
    });
    if (authorized.error) return authorized.error;
    const svc = protectedMediaSvc();
    if (!svc) return errResult('gated_delivery_unavailable', 'Protected delivery is not configured.', 503);
    return svc.streamProtectedMedia({
      conversationId: authorized.conversationId,
      messageId: authorized.messageId,
      file: authorized.file,
      size: authorized.size,
      requestId,
    });
  }

  const requestApi = attachConversationRequests({
    store,
    requireArtistAccess,
    loadGraph,
    ensureParticipants,
    serializeArtistConversation,
    unreadForParticipant,
    logger,
    strapi,
    loadShowSummaries,
    overlayFanShowSummary,
    resolveFanIdentities: identitiesForFans,
    identityForFan,
  });

  return {
    getOrCreateConversationForFan,
    listArtistConversations,
    listFanConversations,
    listDmCandidates,
    getConversation,
    listMessages,
    sendMessage,
    sendCampaignMessage,
    markRead,
    setBlocked,
    unreadCountArtist,
    unreadCountFan,
    mediaDeliveryStatus,
    uploadConversationMedia,
    authorizeConversationMediaAccess,
    streamConversationMedia,
    serializeArtistConversation,
    serializeFanConversation,
    serializeMessage,
    ...requestApi,
  };
}

function createInboxServiceFromStrapi(strapi) {
  const store = createStrapiInboxStore(strapi);
  const { createFanProfileService } = require('../fanProfile/fanProfileService');
  const profileService = createFanProfileService(strapi);
  return createInboxService(store, {
    logger: strapi.log,
    requireArtistAccess: async (userId, bandId) => requireArtistInboxAccess(strapi, userId, bandId),
    strapi,
    resolveFanIdentities: (fans, options) => profileService.resolveIdentitiesForFans(fans, options),
  });
}

module.exports = {
  ARTIST_INBOX_PERMISSION,
  createMemoryInboxStore,
  createStrapiInboxStore,
  createInboxService,
  createInboxServiceFromStrapi,
  requireArtistInboxAccess,
  pure,
};
