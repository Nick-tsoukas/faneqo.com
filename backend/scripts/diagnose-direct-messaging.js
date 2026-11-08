/**
 * Faneqo Inbox / Direct Messaging live diagnostic.
 *
 * DEFAULT: READ-ONLY
 *
 *   node scripts/diagnose-direct-messaging.js
 *
 * Env:
 *   FANEQO_DM_DIAG_BASE_URL     (default http://localhost:1337)
 *   FANEQO_DM_DIAG_BAND_ID      (default 5)
 *   FANEQO_DM_DIAG_ARTIST_JWT
 *   FANEQO_DM_DIAG_FAN_JWT
 *   FANEQO_DM_DIAG_FAN_ID
 *   FANEQO_DM_DIAG_CONVERSATION_ID   optional existing thread
 *
 * WRITE MODE (controlled test fan only):
 *   FANEQO_DM_DIAG_WRITE=true
 *
 * Never prints JWTs, Authorization headers, message bodies, or emails.
 */

'use strict';

const http = require('http');
const https = require('https');

const BASE = String(process.env.FANEQO_DM_DIAG_BASE_URL || 'http://localhost:1337').replace(/\/+$/, '');
const BAND_ID = process.env.FANEQO_DM_DIAG_BAND_ID || '5';
const ARTIST_JWT = process.env.FANEQO_DM_DIAG_ARTIST_JWT || '';
const FAN_JWT = process.env.FANEQO_DM_DIAG_FAN_JWT || '';
const FAN_ID = process.env.FANEQO_DM_DIAG_FAN_ID || '';
const CONVERSATION_ID = process.env.FANEQO_DM_DIAG_CONVERSATION_ID || '';
const WRITE = String(process.env.FANEQO_DM_DIAG_WRITE || '').toLowerCase() === 'true';

function log(event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${key}=${value}`);
  console.log(`[Faneqo Inbox Diagnostic] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function request({ method, path, jwt, body }) {
  const started = Date.now();
  return new Promise((resolve) => {
    let url;
    try {
      url = new URL(path, `${BASE}/`);
    } catch (err) {
      resolve({
        status: 0,
        latencyMs: Date.now() - started,
        json: null,
        reason: 'invalid_url',
      });
      return;
    }
    const lib = url.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Accept: 'application/json',
    };
    if (payload) headers['Content-Type'] = 'application/json';
    if (jwt) headers.Authorization = `Bearer ${jwt}`;

    const req = lib.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method,
        timeout: 15000,
        headers,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const raw = Buffer.concat(chunks).toString('utf8');
          let json = null;
          try {
            json = raw ? JSON.parse(raw) : null;
          } catch {
            json = null;
          }
          resolve({
            status: res.statusCode,
            latencyMs: Date.now() - started,
            json,
            reason: json?.error?.name || null,
          });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, latencyMs: Date.now() - started, json: null, reason: 'timeout' });
    });
    req.on('error', (err) => {
      resolve({
        status: 0,
        latencyMs: Date.now() - started,
        json: null,
        reason: err.code || 'network_error',
      });
    });
    if (payload) req.write(payload);
    req.end();
  });
}

function shape(json) {
  if (!json) return 'empty';
  if (json.error) return `error:${json.error.name || json.error.status || 'unknown'}`;
  if (json.data) {
    const keys = Object.keys(json.data).sort().join(',');
    return `data:{${keys}}`;
  }
  return `keys:${Object.keys(json).sort().join(',')}`;
}

async function probe(operation, { method, path, jwt, body }) {
  const result = await request({ method, path, jwt, body });
  log('route', {
    operation,
    status: result.status,
    latencyMs: result.latencyMs,
    reason: result.reason,
    shape: shape(result.json),
  });
  return result;
}

async function main() {
  log('start', {
    baseHost: (() => {
      try {
        return new URL(BASE).host;
      } catch {
        return 'invalid';
      }
    })(),
    bandId: BAND_ID,
    artistJwt: ARTIST_JWT ? 'present' : 'missing',
    fanJwt: FAN_JWT ? 'present' : 'missing',
    fanId: FAN_ID ? 'present' : 'missing',
    conversationId: CONVERSATION_ID || 'none',
    write: WRITE,
  });

  const unauthRoutes = [
    { operation: 'unauth:dm-candidates', method: 'GET', path: `/api/conversations/dm-candidates?bandId=${encodeURIComponent(BAND_ID)}` },
    { operation: 'unauth:start', method: 'POST', path: '/api/conversations/start' },
    { operation: 'unauth:list', method: 'GET', path: `/api/conversations?bandId=${encodeURIComponent(BAND_ID)}` },
    { operation: 'unauth:unread', method: 'GET', path: `/api/conversations/unread-count?bandId=${encodeURIComponent(BAND_ID)}` },
    { operation: 'unauth:fan-list', method: 'GET', path: '/api/fan-account/conversations' },
    { operation: 'unauth:fan-unread', method: 'GET', path: '/api/fan-account/conversations/unread-count' },
  ];

  for (const row of unauthRoutes) {
    await probe(row.operation, row);
  }

  if (!ARTIST_JWT) {
    log('skip', { reason: 'artist_jwt_missing', next: 'set FANEQO_DM_DIAG_ARTIST_JWT for authenticated probes' });
  } else {
    const candidates = await probe('dm-candidates', {
      method: 'GET',
      path: `/api/conversations/dm-candidates?bandId=${encodeURIComponent(BAND_ID)}`,
      jwt: ARTIST_JWT,
    });
    const fans = candidates.json?.data?.fans;
    log('candidates', {
      count: Array.isArray(fans) ? fans.length : 'n/a',
      eligibleCount: Array.isArray(fans) ? fans.filter((f) => f.canDirectMessage).length : 'n/a',
      memberCount: Array.isArray(fans) ? fans.filter((f) => f.isFaneqoMember).length : 'n/a',
    });

    const list = await probe('artist:list', {
      method: 'GET',
      path: `/api/conversations?bandId=${encodeURIComponent(BAND_ID)}`,
      jwt: ARTIST_JWT,
    });
    log('artist:list', {
      count: Array.isArray(list.json?.data?.conversations) ? list.json.data.conversations.length : 'n/a',
    });

    await probe('artist:unread', {
      method: 'GET',
      path: `/api/conversations/unread-count?bandId=${encodeURIComponent(BAND_ID)}`,
      jwt: ARTIST_JWT,
    });

    if (CONVERSATION_ID) {
      await probe('artist:thread', {
        method: 'GET',
        path: `/api/conversations/${encodeURIComponent(CONVERSATION_ID)}`,
        jwt: ARTIST_JWT,
      });
      const msgs = await probe('artist:messages', {
        method: 'GET',
        path: `/api/conversations/${encodeURIComponent(CONVERSATION_ID)}/messages`,
        jwt: ARTIST_JWT,
      });
      log('artist:messages', {
        count: Array.isArray(msgs.json?.data?.messages) ? msgs.json.data.messages.length : 'n/a',
      });
    }
  }

  if (!FAN_JWT) {
    log('skip', { reason: 'fan_jwt_missing', next: 'set FANEQO_DM_DIAG_FAN_JWT for fan probes' });
  } else {
    const fanList = await probe('fan:list', {
      method: 'GET',
      path: '/api/fan-account/conversations',
      jwt: FAN_JWT,
    });
    const found = Array.isArray(fanList.json?.data?.conversations)
      ? fanList.json.data.conversations.some((row) => String(row.id) === String(CONVERSATION_ID))
      : false;
    log('fan:list', {
      count: Array.isArray(fanList.json?.data?.conversations) ? fanList.json.data.conversations.length : 'n/a',
      conversationFound: CONVERSATION_ID ? found : 'n/a',
    });
    if (CONVERSATION_ID) {
      await probe('fan:thread', {
        method: 'GET',
        path: `/api/conversations/${encodeURIComponent(CONVERSATION_ID)}`,
        jwt: FAN_JWT,
      });
      await probe('fan:messages', {
        method: 'GET',
        path: `/api/conversations/${encodeURIComponent(CONVERSATION_ID)}/messages`,
        jwt: FAN_JWT,
      });
    }
  }

  if (!WRITE) {
    log('done', { mode: 'read-only' });
    return;
  }

  console.log('');
  console.log('[Faneqo Inbox Diagnostic] WRITE MODE — controlled test fan only');
  console.log('');

  if (!ARTIST_JWT || !FAN_ID || !BAND_ID) {
    log('write:aborted', { reason: 'missing_artist_jwt_or_fan_id_or_band_id' });
    process.exitCode = 1;
    return;
  }

  const started = await probe('conversation:start', {
    method: 'POST',
    path: '/api/conversations/start',
    jwt: ARTIST_JWT,
    body: { bandId: Number(BAND_ID), fanId: Number(FAN_ID) },
  });
  const conversationId =
    started.json?.data?.conversationId || started.json?.data?.conversation?.id || CONVERSATION_ID;
  log('conversation:start', {
    status: started.status,
    conversationId: conversationId || 'none',
    created: started.json?.data?.created,
  });
  if (!conversationId) {
    log('write:aborted', { reason: 'start_did_not_return_conversation_id' });
    process.exitCode = 1;
    return;
  }

  const clientMessageId = `diag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const sent = await probe('artist:send', {
    method: 'POST',
    path: `/api/conversations/${conversationId}/messages`,
    jwt: ARTIST_JWT,
    body: { bodyText: 'Faneqo DM diagnostic test', clientMessageId },
  });
  log('artist:send', {
    status: sent.status,
    messageId: sent.json?.data?.message?.id || 'none',
    senderSide: sent.json?.data?.message?.senderSide,
    isMine: sent.json?.data?.message?.isMine,
  });

  if (FAN_JWT) {
    const fanList = await probe('fan:list:after-send', {
      method: 'GET',
      path: '/api/fan-account/conversations',
      jwt: FAN_JWT,
    });
    const found = Array.isArray(fanList.json?.data?.conversations)
      ? fanList.json.data.conversations.some((row) => String(row.id) === String(conversationId))
      : false;
    log('fan:list', { conversationFound: found });

    const fanReplyId = `diag_fan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const reply = await probe('fan:reply', {
      method: 'POST',
      path: `/api/conversations/${conversationId}/messages`,
      jwt: FAN_JWT,
      body: { bodyText: 'Faneqo DM diagnostic fan reply', clientMessageId: fanReplyId },
    });
    log('fan:reply', {
      status: reply.status,
      messageId: reply.json?.data?.message?.id || 'none',
      senderSide: reply.json?.data?.message?.senderSide,
    });

    await probe('artist:unread:after-reply', {
      method: 'GET',
      path: `/api/conversations/unread-count?bandId=${encodeURIComponent(BAND_ID)}`,
      jwt: ARTIST_JWT,
    });

    const throughId = reply.json?.data?.message?.id;
    if (throughId) {
      await probe('artist:read', {
        method: 'POST',
        path: `/api/conversations/${conversationId}/read`,
        jwt: ARTIST_JWT,
        body: { throughMessageId: throughId },
      });
    }
  } else {
    log('skip', { reason: 'fan_jwt_missing', next: 'fan reply not sent' });
  }

  log('done', { mode: 'write', conversationId });
}

main().catch((err) => {
  log('fatal', { reason: err.message || 'unknown' });
  process.exitCode = 1;
});
