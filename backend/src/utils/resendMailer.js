'use strict';

/**
 * Lane 2 — band-to-fan mail via Resend's REST API.
 *
 * Transactional mail (password reset, confirmations, billing) stays on the
 * Strapi email plugin and mail.faneqo.com. This helper exists so Show Mode
 * (and later fan-list campaigns) can send custom headers — notably
 * List-Unsubscribe / List-Unsubscribe-Post — which the installed Resend SDK
 * and Strapi provider cannot forward.
 *
 * Uses global fetch. No new dependencies.
 */

const RESEND_API_URL = 'https://api.resend.com/emails';

function getApiKey() {
  return process.env.RESEND_API_KEY || '';
}

/**
 * Resend accepts `to` as a string or array. Normalize to an array of trimmed
 * addresses and drop empties so a bad row never becomes `"undefined"`.
 */
function normalizeTo(to) {
  const list = Array.isArray(to) ? to : [to];
  return list.map((addr) => String(addr || '').trim()).filter(Boolean);
}

/**
 * Build the JSON body Resend expects. Unknown/empty optional fields are omitted
 * rather than sent as null — Resend rejects some of those.
 */
function buildBody({ from, to, replyTo, subject, html, text, headers, tags }) {
  const body = {
    from,
    to: normalizeTo(to),
    subject,
  };

  if (html) body.html = html;
  if (text) body.text = text;

  // REST API uses snake_case. Do not also send camelCase — keep the contract tight.
  const reply = replyTo || null;
  if (reply) body.reply_to = reply;

  if (headers && typeof headers === 'object' && Object.keys(headers).length) {
    body.headers = headers;
  }

  if (Array.isArray(tags) && tags.length) {
    body.tags = tags;
  }

  return body;
}

function safeParseJson(rawText) {
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch (err) {
    return null;
  }
}

function extractError(parsed, status, rawText) {
  if (parsed?.message) return parsed.message;
  if (parsed?.error) {
    if (typeof parsed.error === 'string') return parsed.error;
    if (parsed.error?.message) return parsed.error.message;
  }
  if (rawText && rawText.length < 300) return rawText;
  return `Resend request failed with status ${status}`;
}

/**
 * Send one email through Resend REST.
 *
 * @param {Object} options
 * @param {string} options.from
 * @param {string|string[]} options.to
 * @param {string} [options.replyTo]
 * @param {string} options.subject
 * @param {string} [options.html]
 * @param {string} [options.text]
 * @param {Object.<string, string>} [options.headers]
 * @param {Array<{name: string, value: string}>} [options.tags]
 * @param {string} [options.idempotencyKey]
 * @returns {Promise<{ok: true, id: string|null, raw: any} | {ok: false, status: number, error: string, raw: any}>}
 */
async function sendOne(options = {}) {
  const { from, to, replyTo, subject, html, text, headers, tags, idempotencyKey } = options;
  const recipients = normalizeTo(to);

  if (!from || !recipients.length || !subject) {
    return {
      ok: false,
      status: 0,
      error: 'from, to, and subject are required',
      raw: null,
    };
  }

  if (!html && !text) {
    return {
      ok: false,
      status: 0,
      error: 'html or text is required',
      raw: null,
    };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      ok: false,
      status: 0,
      error: 'RESEND_API_KEY is not configured',
      raw: null,
    };
  }

  const requestHeaders = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (idempotencyKey) {
    requestHeaders['Idempotency-Key'] = String(idempotencyKey);
  }

  const body = buildBody({ from, to: recipients, replyTo, subject, html, text, headers, tags });

  let response;
  let rawText = '';

  try {
    response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(body),
    });
    rawText = await response.text();
  } catch (err) {
    // Network / DNS / aborted — not an HTTP status.
    return {
      ok: false,
      status: 0,
      error: err?.message || 'Failed to reach Resend',
      raw: null,
    };
  }

  const parsed = safeParseJson(rawText);
  const status = response.status;

  if (status >= 200 && status < 300) {
    return {
      ok: true,
      id: parsed?.id || null,
      raw: parsed,
    };
  }

  const retryAfter =
    response.headers?.get?.('retry-after') ||
    response.headers?.get?.('Retry-After') ||
    null;

  return {
    ok: false,
    status,
    error: extractError(parsed, status, rawText),
    raw: parsed || rawText || null,
    headers: retryAfter ? { 'retry-after': retryAfter } : null,
  };
}

module.exports = {
  sendOne,
};
