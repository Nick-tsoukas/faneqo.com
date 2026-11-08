'use strict';

/**
 * Fan → band message requests.
 * Separate from conversations and campaigns.
 * Accept reuses the existing conversation pair + send persist path (fan side).
 *
 * requesterType is fan | band for a future band→band request, but V1 only
 * creates requesterType=fan. Do not expose band-as-sender UI in this pass.
 *
 * Decline cooldown: 7 days (REQUEST_DECLINE_COOLDOWN_MS). No rejection email.
 * Email unsubscribe / suppression is not a request ban.
 */

const { checkRequestCreateRate } = require('./inboxRateLimit');
const { inboxLog, newInboxRequestId } = require('./inboxLog');
const pure = require('./inboxPure');

function errResult(name, message, status = 400, extra = {}) {
  return { ok: false, error: name, message, status, ...extra };
}

function ok(data) {
  return { ok: true, ...data };
}

function unavailable() {
  return errResult('unavailable', 'Messaging is not available right now.', 409);
}

function attachConversationRequests({
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
  resolveFanIdentities,
  identityForFan,
}) {
  function logRequest(event, fields) {
    inboxLog(logger, event, fields);
  }

  async function isRecipientTeamMember(userId, bandId) {
    const role = await store.getBandRole(bandId, userId);
    return role === 'owner' || role === 'manager';
  }

  async function loadRequestFan(request) {
    if (request.requesterFanRow) return request.requesterFanRow;
    if (request.requesterFan) return store.findFan(request.requesterFan);
    return null;
  }

  async function loadRequestBand(request) {
    if (request.recipientBandRow) return request.recipientBandRow;
    const bandId = request.recipientBand;
    if (!bandId) return null;
    return store.findBand(bandId);
  }

  async function serializeRequest(request, {
    includeMessage = false,
    includeArtist = false,
    summaries = null,
    fan: preloadedFan = undefined,
    identity = null,
  } = {}) {
    const fan = preloadedFan !== undefined ? preloadedFan : await loadRequestFan(request);
    const band = includeArtist ? await loadRequestBand(request) : null;
    let summary = null;
    const fanId = fan?.id || request.requesterFan;
    if (summaries) {
      summary = summaries[fanId] || summaries[String(fanId)] || null;
    } else if (fanId && typeof loadShowSummaries === 'function') {
      const map = await loadShowSummaries([fanId]);
      summary = map[fanId] || map[String(fanId)] || null;
    }
    const fanWithCount = typeof overlayFanShowSummary === 'function'
      ? overlayFanShowSummary(fan, summary)
      : fan;
    const resolved = identity
      || (typeof identityForFan === 'function'
        ? await identityForFan(fan)
        : null);
    return pure.serializeSafeRequest(request, {
      includeMessage,
      fan: fanWithCount,
      band,
      identity: resolved,
    });
  }

  async function serializeRequestList(rows, opts = {}) {
    const fans = [];
    for (const row of rows) {
      fans.push(await loadRequestFan(row));
    }
    const identities = typeof resolveFanIdentities === 'function'
      ? await resolveFanIdentities(fans.filter(Boolean))
      : new Map();
    const requests = [];
    for (let i = 0; i < rows.length; i += 1) {
      requests.push(await serializeRequest(rows[i], {
        ...opts,
        fan: fans[i],
        identity: identities.get(fans[i]?.id) || null,
      }));
    }
    return requests;
  }

  async function findProfileName(userId) {
    if (!store.findFanProfileByUser) return { firstName: '', lastName: '' };
    const profile = await store.findFanProfileByUser(userId);
    return {
      firstName: pure.normalizePersonName(profile?.firstName),
      lastName: pure.normalizePersonName(profile?.lastName),
    };
  }

  async function findNameHint(userId) {
    const profile = await findProfileName(userId);
    if (profile.firstName) return profile;
    if (!store.findFansByAccountUser) return { firstName: '', lastName: '' };
    const rows = await store.findFansByAccountUser(userId);
    const named = (rows || []).find((row) => pure.hasRequiredFanFirstName(row));
    if (!named) return { firstName: '', lastName: '' };
    return {
      firstName: pure.normalizePersonName(named.firstName),
      lastName: pure.normalizePersonName(named.lastName),
    };
  }

  async function applyNames(fan, { firstName, lastName } = {}) {
    const nextFirst = firstName != null ? pure.normalizePersonName(firstName) : '';
    const nextLast = lastName != null ? pure.normalizePersonName(lastName) : undefined;
    const patch = {};
    if (nextFirst && nextFirst !== pure.normalizePersonName(fan.firstName)) {
      patch.firstName = nextFirst;
    }
    if (nextLast !== undefined && nextLast !== pure.normalizePersonName(fan.lastName)) {
      patch.lastName = nextLast || null;
    }
    if (!Object.keys(patch).length) return fan;
    return store.updateFan(fan.id, patch);
  }

  async function ensureBandScopedFan({ userId, bandId, firstName, lastName }) {
    let fan = store.findFanByAccountUserAndBand
      ? await store.findFanByAccountUserAndBand(userId, bandId)
      : null;

    if (fan && fan.status === 'removed') {
      return { error: unavailable() };
    }

    if (!fan) {
      const user = await store.findUser(userId);
      const email = String(user?.email || '').trim().toLowerCase();
      if (!email) return { error: unavailable() };

      if (store.findFanByEmailAndBand) {
        const byEmail = await store.findFanByEmailAndBand(email, bandId);
        if (byEmail) {
          if (byEmail.status === 'removed') return { error: unavailable() };
          const owner = byEmail.accountUser;
          if (owner && Number(owner) !== Number(userId)) {
            return { error: unavailable() };
          }
          fan = owner
            ? byEmail
            : await store.updateFan(byEmail.id, { accountUser: userId });
        }
      }

      if (!fan) {
        const hint = await findNameHint(userId);
        fan = await store.createFan({
          email,
          firstName: pure.normalizePersonName(firstName) || hint.firstName || null,
          lastName: lastName != null
            ? (pure.normalizePersonName(lastName) || null)
            : (hint.lastName || null),
          band: bandId,
          accountUser: userId,
          status: 'subscribed',
          source: 'band_page',
          subscribedAt: new Date().toISOString(),
          checkedInShowCount: 0,
        });
        logRequest('request:fan-claimed', {
          bandId,
          fanId: fan.id,
          created: true,
        });
      }
    }

    if (!pure.hasRequiredFanFirstName(fan) && !pure.normalizePersonName(firstName)) {
      const hint = await findNameHint(userId);
      if (hint.firstName) {
        fan = await applyNames(fan, {
          firstName: hint.firstName,
          lastName: lastName != null ? lastName : hint.lastName,
        });
      }
    }
    fan = await applyNames(fan, { firstName, lastName });
    return { fan };
  }

  async function conversationBlockState(conversation) {
    if (!conversation) return { blocked: false };
    const parts = await store.listParticipants(conversation.id);
    const fanPart = (parts || []).find((p) => p.side === 'fan');
    return { blocked: !!(fanPart && fanPart.blockedAt), fanPart };
  }

  async function resolveFanStatus({ userId, bandId }) {
    if (!userId) {
      return ok({
        state: 'unauthenticated',
        needsFirstName: false,
      });
    }

    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);

    const band = await store.findBand(bid);
    if (!band) return errResult('invalid_request', 'Artist is not available', 404);

    const artist = {
      id: band.id,
      name: band.name || 'Artist',
      slug: band.slug || null,
    };

    if (await isRecipientTeamMember(userId, bid)) {
      return ok({ state: 'unavailable', artist, needsFirstName: false });
    }

    const user = await store.findUser(userId);
    if (!user) return errResult('unauthorized', 'Authentication required', 401);

    const fan = store.findFanByAccountUserAndBand
      ? await store.findFanByAccountUserAndBand(userId, bid)
      : null;

    if (fan && fan.status === 'removed') {
      return ok({ state: 'unavailable', artist, needsFirstName: false });
    }

    const key = fan?.accountUser
      ? pure.requestPairKey(bid, fan.accountUser)
      : pure.requestPairKey(bid, userId);

    const existing = await store.findConversationByPairKey(key);
    if (existing) {
      const block = await conversationBlockState(existing);
      if (block.blocked) {
        return ok({ state: 'unavailable', artist, needsFirstName: false });
      }
      return ok({
        state: 'conversation',
        artist,
        conversationId: existing.id,
        needsFirstName: false,
      });
    }

    const pending = store.findPendingRequestByPairKey
      ? await store.findPendingRequestByPairKey(key)
      : null;
    if (pending) {
      return ok({
        state: 'pending',
        artist,
        request: await serializeRequest(pending, { includeArtist: true }),
        needsFirstName: false,
      });
    }

    const declined = store.findLatestDeclinedByPairKey
      ? await store.findLatestDeclinedByPairKey(key)
      : null;
    if (declined && pure.declineStillCooling(declined)) {
      return ok({ state: 'unavailable', artist, needsFirstName: false });
    }

    let hint = fan
      ? {
          firstName: pure.normalizePersonName(fan.firstName),
          lastName: pure.normalizePersonName(fan.lastName),
        }
      : { firstName: '', lastName: '' };
    if (!hint.firstName) {
      const known = await findNameHint(userId);
      hint = {
        firstName: known.firstName,
        lastName: hint.lastName || known.lastName,
      };
    }

    if (!hint.firstName) {
      return ok({
        state: 'needs_name',
        artist,
        needsFirstName: true,
        firstName: '',
        lastName: hint.lastName || '',
      });
    }

    return ok({
      state: 'can_request',
      artist,
      needsFirstName: false,
      firstName: hint.firstName,
      lastName: hint.lastName || '',
    });
  }

  async function updateFanMessagingProfile({ userId, bandId, firstName, lastName }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const first = pure.normalizePersonName(firstName);
    if (!first) {
      return errResult('needs_first_name', 'What should the band call you?', 400);
    }
    const last = lastName != null ? pure.normalizePersonName(lastName) : undefined;

    if (bandId) {
      const ensured = await ensureBandScopedFan({
        userId,
        bandId: Number(bandId),
        firstName: first,
        lastName: last,
      });
      if (ensured.error) return ensured.error;
    }

    if (store.findFansByAccountUser) {
      const rows = await store.findFansByAccountUser(userId);
      for (const row of rows || []) {
        await applyNames(row, { firstName: first, lastName: last });
      }
    }

    logRequest('request:profile', { actorUserId: userId, bandId: bandId || undefined });
    return ok({
      firstName: first,
      lastName: last || '',
      needsFirstName: false,
    });
  }

  async function createFanMessageRequest({ userId, bandId, bodyText, firstName, lastName }) {
    const requestId = newInboxRequestId();
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);

    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);

    const validated = pure.validateRequestMessage(bodyText);
    if (validated.error) return errResult(validated.error, validated.message, 400);

    const rate = checkRequestCreateRate({ userId });
    if (rate.limited) {
      return errResult('rate_limited', 'Too many requests. Try again shortly.', 429, {
        retryAfter: rate.retryAfter,
      });
    }

    const band = await store.findBand(bid);
    if (!band) return errResult('invalid_request', 'Artist is not available', 404);

    if (await isRecipientTeamMember(userId, bid)) {
      logRequest('request:create:failed', {
        requestId,
        bandId: bid,
        actorUserId: userId,
        reason: 'own_band',
      });
      return unavailable();
    }

    const ensured = await ensureBandScopedFan({
      userId,
      bandId: bid,
      firstName,
      lastName,
    });
    if (ensured.error) return ensured.error;
    const fan = ensured.fan;

    if (fan.status === 'removed') return unavailable();
    if (!fan.accountUser) return unavailable();
    if (!pure.hasRequiredFanFirstName(fan)) {
      return errResult('needs_first_name', 'What should the band call you?', 400, {
        needsFirstName: true,
      });
    }

    const key = pure.requestPairKey(bid, fan.accountUser);
    const existingConv = await store.findConversationByPairKey(key);
    if (existingConv) {
      const block = await conversationBlockState(existingConv);
      if (block.blocked) return unavailable();
      logRequest('request:create:existing-conversation', {
        requestId,
        bandId: bid,
        conversationId: existingConv.id,
        fanId: fan.id,
      });
      const graph = await loadGraph(existingConv.id);
      const unread = await unreadForParticipant(graph, graph.sided.fan);
      return ok({
        existingConversation: true,
        conversationId: existingConv.id,
        conversation: {
          id: existingConv.id,
          artist: {
            id: band.id,
            name: band.name || 'Artist',
            slug: band.slug || null,
            avatarUrl: band.avatarUrl || null,
          },
          unreadCount: unread,
        },
      });
    }

    const pending = await store.findPendingRequestByPairKey(key);
    if (pending) {
      return ok({
        request: await serializeRequest(pending, { includeArtist: true }),
        duplicate: true,
      });
    }

    const declined = await store.findLatestDeclinedByPairKey(key);
    if (declined && pure.declineStillCooling(declined)) {
      logRequest('request:create:failed', {
        requestId,
        bandId: bid,
        fanId: fan.id,
        reason: 'cooldown',
      });
      return unavailable();
    }

    try {
      const created = await store.transaction(async () => {
        const raced = await store.findPendingRequestByPairKey(key);
        if (raced) return raced;
        return store.createRequest({
          requesterUser: userId,
          requesterFan: fan.id,
          recipientBand: bid,
          requesterType: 'fan',
          initialMessage: validated.bodyText,
          status: 'pending',
          pairKey: key,
          pendingPairKey: key,
          conversation: null,
          respondedAt: null,
          declinedAt: null,
        });
      });

      logRequest('request:created', {
        requestId,
        conversationRequestId: created.id,
        bandId: bid,
        fanId: fan.id,
        status: created.status,
      });

      return ok({
        request: await serializeRequest(
          { ...created, requesterFanRow: fan, recipientBandRow: band },
          { includeArtist: true }
        ),
        duplicate: false,
      });
    } catch (err) {
      if (!pure.isUniqueViolation(err)) throw err;
      const raced = await store.findPendingRequestByPairKey(key);
      if (raced) {
        return ok({
          request: await serializeRequest(raced, { includeArtist: true }),
          duplicate: true,
        });
      }
      throw err;
    }
  }

  async function listFanMessageRequests({ userId }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rows = (await store.listRequestsByRequesterUser(userId))
      .filter((row) => row.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fanIds = rows.map((row) => row.requesterFanRow?.id || row.requesterFan).filter(Boolean);
    const summaries = typeof loadShowSummaries === 'function' ? await loadShowSummaries(fanIds) : {};
    const requests = await serializeRequestList(rows, { includeArtist: true, summaries });
    return ok({ requests });
  }

  async function listArtistMessageRequests({ userId, bandId }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const bid = Number(bandId);
    if (!bid) return errResult('invalid_request', 'bandId is required', 400);
    const access = await requireArtistAccess(userId, bid);
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);

    const rows = (await store.listRequestsByBand(bid, { status: 'pending' }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const fanIds = rows.map((row) => row.requesterFanRow?.id || row.requesterFan).filter(Boolean);
    const summaries = typeof loadShowSummaries === 'function' ? await loadShowSummaries(fanIds) : {};
    const requests = await serializeRequestList(rows, { includeMessage: true, summaries });
    return ok({ requests, count: requests.length });
  }

  async function getArtistMessageRequest({ userId, requestId }) {
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rid = Number(requestId);
    if (!rid) return errResult('invalid_request', 'requestId is required', 400);
    const request = await store.findRequestById(rid);
    if (!request) return errResult('forbidden', 'Not authorized for this conversation', 403);
    const access = await requireArtistAccess(userId, request.recipientBand);
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);
    return ok({
      request: await serializeRequest(request, { includeMessage: true }),
    });
  }

  async function insertOpeningFanMessage({ conversation, fanUserId, fanParticipant, bodyText, requestRowId }) {
    const clientId = pure.requestOpeningClientMessageId(requestRowId);
    const idemKey = pure.idempotencyKey(conversation.id, fanUserId, clientId);
    if (idemKey) {
      const existing = await store.findMessageByIdempotencyKey(idemKey);
      if (existing) return { message: existing, duplicate: true };
    }

    try {
      const message = await store.createMessage({
        conversation: conversation.id,
        senderParticipant: fanParticipant.id,
        senderUser: fanUserId,
        senderSide: 'fan',
        bodyText,
        clientMessageId: clientId,
        idempotencyKey: idemKey,
      });
      const preview = pure.lastMessagePreviewText(bodyText, false, 0);
      await store.updateConversation(conversation.id, {
        lastMessageAt: message.createdAt,
        lastMessagePreview: preview,
        lastMessageSenderSide: 'fan',
        lastMessageId: message.id,
      });
      return { message, duplicate: false };
    } catch (err) {
      if (idemKey && pure.isUniqueViolation(err)) {
        const existing = await store.findMessageByIdempotencyKey(idemKey);
        if (existing) return { message: existing, duplicate: true };
      }
      throw err;
    }
  }

  async function getOrCreateAcceptedConversation({ bandId, fan, originType }) {
    const key = pure.requestPairKey(bandId, fan.accountUser);
    const existing = await store.findConversationByPairKey(key);
    if (existing) {
      await ensureParticipants(existing);
      return { conversation: existing, created: false };
    }
    try {
      const conversation = await store.createConversation({
        band: bandId,
        fanAccountUser: fan.accountUser,
        originFan: fan.id,
        pairKey: key,
        status: 'active',
        originType,
      });
      await ensureParticipants(conversation);
      return { conversation, created: true };
    } catch (err) {
      if (!pure.isUniqueViolation(err)) throw err;
      const raced = await store.findConversationByPairKey(key);
      if (!raced) throw err;
      await ensureParticipants(raced);
      return { conversation: raced, created: false };
    }
  }

  async function acceptMessageRequest({ userId, requestId }) {
    const corr = newInboxRequestId();
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rid = Number(requestId);
    if (!rid) return errResult('invalid_request', 'requestId is required', 400);

    const request = await store.findRequestById(rid);
    if (!request) return errResult('forbidden', 'Not authorized for this conversation', 403);

    const access = await requireArtistAccess(userId, request.recipientBand, { logSuccess: true });
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);

    const fan = await loadRequestFan(request);
    if (!fan || !fan.accountUser) return unavailable();
    if (fan.status === 'removed') return unavailable();

    if (request.status === 'declined') {
      return errResult('unavailable', 'This request is no longer available.', 409);
    }

    const accepted = await store.transaction(async () => {
      const latest = await store.findRequestById(rid);
      if (!latest) return null;
      if (latest.status === 'declined') {
        return { declined: true };
      }

      const pair = await getOrCreateAcceptedConversation({
        bandId: latest.recipientBand,
        fan,
        originType: 'fan_request',
      });

      const parts = await store.listParticipants(pair.conversation.id);
      const fanPart = (parts || []).find((p) => p.side === 'fan');
      if (!fanPart) throw new Error('missing_fan_participant');

      const opening = await insertOpeningFanMessage({
        conversation: pair.conversation,
        fanUserId: latest.requesterUser,
        fanParticipant: fanPart,
        bodyText: latest.initialMessage,
        requestRowId: latest.id,
      });

      let updated = latest;
      if (latest.status !== 'accepted') {
        updated = await store.updateRequest(latest.id, {
          status: 'accepted',
          pendingPairKey: null,
          conversation: pair.conversation.id,
          respondedAt: new Date().toISOString(),
        });
      } else if (!latest.conversation) {
        updated = await store.updateRequest(latest.id, {
          conversation: pair.conversation.id,
        });
      }

      return { conversation: pair.conversation, request: updated, opening };
    });

    if (!accepted) return errResult('forbidden', 'Not authorized for this conversation', 403);
    if (accepted.declined) {
      return errResult('unavailable', 'This request is no longer available.', 409);
    }

    const graph = await loadGraph(accepted.conversation.id);
    const unread = await unreadForParticipant(graph, graph.sided.band);
    logRequest('request:accepted', {
      requestId: corr,
      conversationRequestId: rid,
      conversationId: accepted.conversation.id,
      bandId: request.recipientBand,
      fanId: fan.id,
      status: 'accepted',
    });

    try {
      const message = accepted.opening?.message;
      if (message?.id && strapi) {
        const { produceMessageEvent } = require('../relationshipEvents/relationshipEventProducers');
        await produceMessageEvent(strapi, {
          senderSide: 'fan',
          messageId: message.id,
          conversationId: accepted.conversation.id,
          bandId: request.recipientBand,
          fanId: fan.id,
          occurredAt: message.createdAt,
        });
      }
    } catch (err) {
      strapi?.log?.warn?.(`[RelationshipEvent] fan_replied skipped: ${err.message}`);
    }

    const identity = typeof identityForFan === 'function' ? await identityForFan(fan) : null;
    return ok({
      conversation: serializeArtistConversation(graph, unread, {
        originFan: fan,
        identity,
        summary: typeof loadShowSummaries === 'function'
          ? (await loadShowSummaries([fan.id]))[fan.id]
          : undefined,
      }),
      conversationId: accepted.conversation.id,
      request: await serializeRequest(accepted.request || request, {
        includeMessage: true,
        fan,
        identity,
      }),
    });
  }

  async function declineMessageRequest({ userId, requestId }) {
    const corr = newInboxRequestId();
    if (!userId) return errResult('unauthorized', 'Authentication required', 401);
    const rid = Number(requestId);
    if (!rid) return errResult('invalid_request', 'requestId is required', 400);

    const request = await store.findRequestById(rid);
    if (!request) return errResult('forbidden', 'Not authorized for this conversation', 403);

    const access = await requireArtistAccess(userId, request.recipientBand, { logSuccess: true });
    if (!access) return errResult('forbidden', 'Not authorized for this conversation', 403);

    if (request.status === 'accepted') {
      return errResult('unavailable', 'This request is no longer available.', 409);
    }

    const now = new Date().toISOString();
    const updated = request.status === 'declined'
      ? request
      : await store.updateRequest(rid, {
          status: 'declined',
          pendingPairKey: null,
          respondedAt: now,
          declinedAt: now,
        });

    logRequest('request:declined', {
      requestId: corr,
      conversationRequestId: rid,
      bandId: request.recipientBand,
      fanId: request.requesterFan,
      status: 'declined',
    });

    return ok({
      request: await serializeRequest(updated, { includeMessage: true }),
    });
  }

  return {
    getFanMessageStatus: resolveFanStatus,
    updateFanMessagingProfile,
    createFanMessageRequest,
    listFanMessageRequests,
    listArtistMessageRequests,
    getArtistMessageRequest,
    acceptMessageRequest,
    declineMessageRequest,
  };
}

module.exports = {
  attachConversationRequests,
};
