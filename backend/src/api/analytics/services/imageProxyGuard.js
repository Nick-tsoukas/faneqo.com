'use strict';

/**
 * SSRF-safe fetch for analytics.imageProxy.
 *
 * Callers (share-card canvas loaders) send band artwork URLs. Production
 * artwork lives on the public qrcode101 bucket. This module allows only that
 * bucket (plus the configured upload bucket / CDN_URL, so a future env change
 * does not break share cards) and refuses everything else.
 *
 * Cloudinary is intentionally not added: this handler never allowed it.
 */

const PRODUCTION_BUCKET = 'qrcode101';
const PRODUCTION_REGION = 'us-east-1';
const FETCH_TIMEOUT_MS = 10_000;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const MAX_URL_LENGTH = 4096;

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
]);

const BUCKET_NAME_RE = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const REGION_RE = /^[a-z0-9-]+$/;

function deny(code, reason) {
  return { ok: false, code, reason };
}

function normalizeRawUrl(raw) {
  if (raw == null || raw === '') return deny('missing_url', 'url parameter is required');
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value == null || value === '') return deny('missing_url', 'url parameter is required');
  const text = String(value).trim();
  if (!text) return deny('missing_url', 'url parameter is required');
  if (text.length > MAX_URL_LENGTH) return deny('invalid_url', 'URL is too long');
  return { ok: true, text };
}

function parseAbsoluteUrl(text) {
  try {
    return { ok: true, url: new URL(text) };
  } catch {
    try {
      return { ok: true, url: new URL(decodeURIComponent(text)) };
    } catch (err) {
      if (err && /URI malformed/i.test(err.message)) {
        return deny('invalid_encoding', 'Invalid URL encoding');
      }
      return deny('invalid_url', 'Invalid URL');
    }
  }
}

function configuredBuckets(env = process.env) {
  const buckets = new Map();
  const add = (bucket, region) => {
    if (!buckets.has(bucket)) buckets.set(bucket, new Set());
    buckets.get(bucket).add(region);
  };

  add(PRODUCTION_BUCKET, PRODUCTION_REGION);

  const extraBucket = String(env.AWS_BUCKET || '').trim().toLowerCase();
  const extraRegion = String(env.AWS_REGION || '').trim().toLowerCase();
  if (BUCKET_NAME_RE.test(extraBucket)) {
    add(extraBucket, REGION_RE.test(extraRegion) ? extraRegion : PRODUCTION_REGION);
  }
  return buckets;
}

function pathStyleHosts(region) {
  return new Set(['s3.amazonaws.com', `s3.${region}.amazonaws.com`]);
}

function virtualHostsFor(bucket, region) {
  return new Set([
    `${bucket}.s3.amazonaws.com`,
    `${bucket}.s3.${region}.amazonaws.com`,
  ]);
}

function decodedPathSegments(pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\\') || decoded.includes('\0')) return null;
  return decoded.split('/').filter((part) => part !== '');
}

function objectKeyFromSegments(segments) {
  if (!segments || !segments.length) return null;
  if (segments.some((part) => part === '.' || part === '..')) return null;
  return segments.join('/');
}

function configuredCdn(env = process.env) {
  const raw = String(env.CDN_URL || '').trim();
  if (!raw) return null;
  let cdn;
  try {
    cdn = new URL(raw);
  } catch {
    return null;
  }
  if (cdn.protocol !== 'https:') return null;
  if (cdn.username || cdn.password) return null;
  if (cdn.port && cdn.port !== '443') return null;

  const prefixes = [];
  const urlPrefix = cdn.pathname.replace(/\/+$/, '');
  if (urlPrefix && urlPrefix !== '/') prefixes.push(urlPrefix);
  const root = String(env.CDN_ROOT_PATH || '').trim().replace(/^\/+|\/+$/g, '');
  if (root) prefixes.push(urlPrefix && urlPrefix !== '/' ? `${urlPrefix}/${root}` : `/${root}`);
  return { hostname: cdn.hostname.toLowerCase(), prefixes };
}

function evaluateImageProxyUrl(raw, env = process.env) {
  const normalized = normalizeRawUrl(raw);
  if (!normalized.ok) return normalized;

  const parsed = parseAbsoluteUrl(normalized.text);
  if (!parsed.ok) return parsed;

  const url = parsed.url;
  if (url.protocol !== 'https:') return deny('forbidden', 'HTTPS is required');
  if (url.username || url.password) return deny('forbidden', 'URL credentials are not allowed');
  if (url.port && url.port !== '443') return deny('forbidden', 'Unexpected port');

  const hostname = url.hostname.toLowerCase();
  if (hostname.endsWith('.')) return deny('forbidden', 'Domain not allowed');

  const segments = decodedPathSegments(url.pathname);
  if (!segments) return deny('invalid_url', 'Invalid URL');

  const buckets = configuredBuckets(env);
  const cdn = configuredCdn(env);

  if (cdn && hostname === cdn.hostname) {
    const key = objectKeyFromSegments(segments);
    if (!key) return deny('forbidden', 'Object key required');
    if (cdn.prefixes.length) {
      const path = `/${key}`;
      const matched = cdn.prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
      if (!matched) return deny('forbidden', 'Domain not allowed');
    }
    return { ok: true, href: url.href };
  }

  for (const [bucket, regions] of buckets) {
    for (const region of regions) {
      if (virtualHostsFor(bucket, region).has(hostname)) {
        const key = objectKeyFromSegments(segments);
        if (!key) return deny('forbidden', 'Object key required');
        return { ok: true, href: url.href };
      }
      if (pathStyleHosts(region).has(hostname) && segments[0] === bucket) {
        const key = objectKeyFromSegments(segments.slice(1));
        if (!key) return deny('forbidden', 'Object key required');
        return { ok: true, href: url.href };
      }
    }
  }

  return deny('forbidden', 'Domain not allowed');
}

function headerValue(headers, name) {
  if (!headers) return null;
  if (typeof headers.get === 'function') return headers.get(name);
  const direct = headers[name] || headers[name.toLowerCase()];
  return direct == null ? null : String(direct);
}

function mediaTypeOf(contentType) {
  if (!contentType) return '';
  return String(contentType).split(';')[0].trim().toLowerCase();
}

function sniffedImageType(buffer) {
  if (!buffer || buffer.length < 3) return '';
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) return 'image/gif';
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif' || brand === 'avis') return 'image/avif';
  }
  return '';
}

function isAllowedImageType(contentType, buffer) {
  const mediaType = mediaTypeOf(contentType);
  if (ALLOWED_IMAGE_TYPES.has(mediaType)) {
    return { ok: true, contentType: String(contentType).trim() || mediaType };
  }
  if (!mediaType || mediaType === 'application/octet-stream') {
    const sniffed = sniffedImageType(buffer);
    if (sniffed) return { ok: true, contentType: sniffed };
  }
  return { ok: false };
}

async function cancelBody(response) {
  try {
    if (response?.body && typeof response.body.cancel === 'function') {
      await response.body.cancel();
    }
  } catch {
    /* ignore */
  }
}

async function readBoundedBody(response, maxBytes) {
  const declared = Number.parseInt(headerValue(response.headers, 'content-length') || '', 10);
  if (Number.isFinite(declared) && declared > maxBytes) {
    await cancelBody(response);
    return deny('too_large', 'Image too large');
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    await cancelBody(response);
    return deny('fetch_error', 'Unreadable image body');
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return deny('too_large', 'Image too large');
      }
      chunks.push(Buffer.from(value));
    }
  } catch (err) {
    try {
      await reader.cancel();
    } catch {
      /* ignore */
    }
    throw err;
  }

  return { ok: true, buffer: Buffer.concat(chunks, total) };
}

function isAbortError(err) {
  return Boolean(err) && (err.name === 'AbortError' || err.code === 20);
}

async function proxyRemoteImage(raw, options = {}) {
  const env = options.env || process.env;
  const fetchImpl = options.fetch || globalThis.fetch;
  const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : FETCH_TIMEOUT_MS;
  const maxBytes = Number.isFinite(options.maxBytes) ? options.maxBytes : MAX_IMAGE_BYTES;
  const maxRedirects = Number.isFinite(options.maxRedirects) ? options.maxRedirects : MAX_REDIRECTS;

  const first = evaluateImageProxyUrl(raw, env);
  if (!first.ok) return first;

  if (typeof fetchImpl !== 'function') {
    return deny('fetch_error', 'Fetch is not available');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const seen = new Set();
  let current = first.href;

  try {
    for (let hop = 0; hop <= maxRedirects; hop += 1) {
      if (seen.has(current)) return deny('forbidden', 'Redirect loop');
      seen.add(current);

      const allowed = evaluateImageProxyUrl(current, env);
      if (!allowed.ok) return allowed;

      const response = await fetchImpl(current, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MusicBizQR-ImageProxy/1.0',
        },
      });

      const status = Number(response.status);
      if (status >= 300 && status < 400) {
        const location = headerValue(response.headers, 'location');
        await cancelBody(response);
        if (!location) return deny('forbidden', 'Redirect location missing');
        let next;
        try {
          next = new URL(location, current).href;
        } catch {
          return deny('forbidden', 'Invalid redirect');
        }
        const nextAllowed = evaluateImageProxyUrl(next, env);
        if (!nextAllowed.ok) return nextAllowed;
        current = nextAllowed.href;
        continue;
      }

      if (!response.ok) {
        await cancelBody(response);
        return deny('not_found', `Failed to fetch image: ${status} ${current}`);
      }

      const declaredType = headerValue(response.headers, 'content-type');
      const declaredMedia = mediaTypeOf(declaredType);
      if (declaredMedia && !ALLOWED_IMAGE_TYPES.has(declaredMedia) && declaredMedia !== 'application/octet-stream') {
        await cancelBody(response);
        return deny('not_image', 'URL does not point to an image');
      }

      const body = await readBoundedBody(response, maxBytes);
      if (!body.ok) return body;

      const typed = isAllowedImageType(declaredType, body.buffer);
      if (!typed.ok) return deny('not_image', 'URL does not point to an image');

      return {
        ok: true,
        buffer: body.buffer,
        contentType: typed.contentType,
      };
    }

    return deny('forbidden', 'Too many redirects');
  } catch (err) {
    if (isAbortError(err)) return deny('timeout', 'Request timed out');
    return { ok: false, code: 'fetch_error', reason: err?.message || 'Failed to fetch image', cause: err };
  } finally {
    clearTimeout(timer);
  }
}

module.exports = {
  PRODUCTION_BUCKET,
  PRODUCTION_REGION,
  FETCH_TIMEOUT_MS,
  MAX_IMAGE_BYTES,
  MAX_REDIRECTS,
  evaluateImageProxyUrl,
  proxyRemoteImage,
};
