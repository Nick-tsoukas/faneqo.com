'use strict';

/**
 * Protected Artist Update media — S3 prefix + Sharp normalize + public-GET probe.
 * Bytes leave this module only through the authenticated proxy.
 */

const crypto = require('crypto');
const fs = require('fs');
const { GetObjectCommand, PutObjectCommand, DeleteObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const pure = require('./protectedMediaPure');

const PUBLIC_PROBE_TIMEOUT_MS = 10 * 1000;

let sharpLib = null;
function getSharp() {
  if (sharpLib) return sharpLib;
  try {
    // eslint-disable-next-line global-require
    sharpLib = require('sharp');
    return sharpLib;
  } catch (err) {
    const error = new Error('Image processing is not available');
    error.code = 'sharp_missing';
    throw error;
  }
}

function log(strapi, event, fields = {}) {
  const parts = Object.entries(fields)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([k, v]) => `${k}=${v}`);
  strapi?.log?.info(`[Faneqo Protected Media] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

function s3Config(env = process.env) {
  return {
    region: env.AWS_REGION,
    bucket: env.AWS_BUCKET,
    cdnUrl: env.CDN_URL || '',
    cdnRootPath: env.CDN_ROOT_PATH || '',
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_ACCESS_SECRET,
  };
}

function createS3(env = process.env) {
  const cfg = s3Config(env);
  return new S3Client({
    region: cfg.region,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

function cdnHosts(env = process.env) {
  const hosts = [];
  try {
    if (env.CDN_URL) hosts.push(new URL(env.CDN_URL).hostname);
  } catch {
    /* ignore */
  }
  return hosts;
}

/**
 * HEIC always goes through the WASM decoder.
 *
 * Do not "optimize" this by probing sharp first: `sharp(heic).metadata()`
 * succeeds on the prebuilt binaries because it only parses the HEIF container,
 * then the real pixel decode fails with "Unsupported codec" once libde265 is
 * missing. A probe that lies is worse than no probe.
 */
async function toDecodableBuffer(buffer, { mime, name } = {}) {
  const heic = require('./heicDecode');
  if (!heic.looksLikeHeic(buffer, mime, name)) return buffer;
  return heic.decodeHeicToPng(buffer);
}

async function processArtistUpdateImage(buffer, { mime, name } = {}) {
  const sharp = getSharp();
  /* iPhone photos arrive as HEVC-in-HEIF. libvips decodes them on most builds;
     where it cannot, the WASM fallback does, so the rest of this function only
     ever deals with something sharp is certain to read. */
  const source = await toDecodableBuffer(buffer, { mime, name });
  const base = sharp(source, { failOn: 'none' }).rotate();
  const meta = await base.metadata();
  const variants = {};
  for (const size of pure.MEDIA_SIZES) {
    const width = pure.DERIVATIVE_WIDTHS[size];
    const out = await base
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const info = await sharp(out).metadata();
    variants[size] = {
      buffer: out,
      mime: 'image/webp',
      width: info.width || width,
      height: info.height || null,
      bytes: out.length,
    };
  }
  return {
    width: meta.width || variants.large.width,
    height: meta.height || variants.large.height,
    variants,
  };
}

async function probePublicAccess(
  key,
  env = process.env,
  { fetchImpl = fetch, timeoutMs = PUBLIC_PROBE_TIMEOUT_MS } = {}
) {
  const cfg = s3Config(env);
  const urls = pure.buildPublicCandidateUrls(key, {
    cdnUrl: cfg.cdnUrl,
    cdnRootPath: cfg.cdnRootPath,
    bucket: cfg.bucket,
    region: cfg.region,
  });
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(timeoutMs)
        : undefined;
      const res = await fetchImpl(url, { method: 'GET', redirect: 'follow', signal });
      const type = String(res.headers.get('content-type') || '');
      return { public: res.ok && type.startsWith('image/'), failed: false };
    } catch {
      return { public: false, failed: true };
    }
  }));
  if (results.some((result) => result.public)) {
    return { public: true, reason: 'public_get_ok' };
  }
  return {
    public: false,
    reason: results.length && results.every((result) => result.failed)
      ? 'probe_unavailable'
      : 'not_public',
  };
}

async function putProtectedObject(client, key, body, mime, env = process.env) {
  const cfg = s3Config(env);
  try {
    await client.send(new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: body,
      ContentType: mime,
      CacheControl: 'private, no-store',
      ACL: 'private',
    }));
  } catch (err) {
    const msg = String(err?.name || err?.message || '');
    if (/AccessControlListNotSupported|InvalidArgument|AccessDenied/i.test(msg)) {
      await client.send(new PutObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        CacheControl: 'private, no-store',
      }));
    } else {
      throw err;
    }
  }
}

async function deleteKeys(client, keys, env = process.env) {
  const cfg = s3Config(env);
  await Promise.all((keys || []).map((Key) => (
    client.send(new DeleteObjectCommand({ Bucket: cfg.bucket, Key })).catch(() => null)
  )));
}

function protectedObjectKeysFor(file) {
  const meta = file?.provider_metadata || file?.providerMetadata || {};
  const keys = Object.values(meta.keys || {}).filter(Boolean);
  if (meta.objectId) {
    for (const size of pure.MEDIA_SIZES) {
      keys.push(pure.protectedObjectKey(meta.objectId, size));
    }
  }
  return [...new Set(keys.filter((key) => String(key).startsWith(`${pure.PROTECTED_PREFIX}/`)))];
}

function createProtectedMediaService(strapi, env = process.env) {
  function configured() {
    return pure.isProtectedMediaConfigured(env);
  }

  /**
   * Delete the bytes and the Upload row for one file, whichever storage class
   * it uses. Callers must have already proved ownership and non-reference.
   */
  async function deleteMediaFile(file) {
    if (!file?.id) return false;
    if (pure.isProtectedFile(file)) {
      await deleteKeys(createS3(env), protectedObjectKeysFor(file), env);
      await strapi.entityService.delete('plugin::upload.file', file.id);
      return true;
    }
    const uploadService = strapi.plugins?.upload?.services?.upload;
    if (uploadService?.remove) {
      await uploadService.remove(file);
      return true;
    }
    await strapi.entityService.delete('plugin::upload.file', file.id);
    return true;
  }

  async function uploadProtectedImage({ userId, bandId, file, domain } = {}) {
    const requestId = `pm_${crypto.randomBytes(4).toString('hex')}`;
    const started = Date.now();
    const ready = configured();
    if (!ready.ready) {
      return { error: 'gated_delivery_unavailable', status: 503, message: 'Protected delivery is not configured.' };
    }
    if (!file?.buffer && !file?.stream && !file?.filepath && !file?.path) {
      return { error: 'media_required', status: 400, message: 'Add a photo.' };
    }
    const mime = String(file.mimetype || file.type || file.mime || '').toLowerCase();
    const filename = file.originalFilename || file.name || file.filename || '';
    if (!pure.isAllowedUploadMime(mime)) {
      return { error: 'invalid_type', status: 400, message: pure.unsupportedImageMessage(mime, filename) };
    }
    log(strapi, 'upload:start', { requestId, bandId, userId: userId || null });

    const buffer = await fileToBuffer(file);
    if (!buffer) {
      return { error: 'media_required', status: 400, message: 'Add a photo.' };
    }
    if (buffer.length > pure.MAX_IMAGE_BYTES) {
      return { error: 'too_large', status: 400, message: pure.IMAGE_TOO_LARGE_COPY };
    }
    let processed;
    try {
      processed = await processArtistUpdateImage(buffer, { mime, name: filename });
      log(strapi, 'upload:processed', {
        requestId,
        latencyMs: Date.now() - started,
      });
    } catch (err) {
      log(strapi, 'upload:error', { requestId, reason: err.code || 'process_failed' });
      return { error: 'process_failed', status: 400, message: 'Could not process that image.' };
    }

    const objectId = crypto.randomBytes(16).toString('hex');
    const keys = {};
    for (const size of pure.MEDIA_SIZES) {
      keys[size] = pure.protectedObjectKey(objectId, size);
    }
    const client = createS3(env);
    try {
      await Promise.all(pure.MEDIA_SIZES.map((size) => (
        putProtectedObject(client, keys[size], processed.variants[size].buffer, 'image/webp', env)
      )));
      log(strapi, 'upload:stored', {
        requestId,
        latencyMs: Date.now() - started,
      });
      const probe = await probePublicAccess(keys.gallery, env);
      log(strapi, 'upload:privacy_checked', {
        requestId,
        result: probe.reason,
        latencyMs: Date.now() - started,
      });
      if (probe.public) {
        await deleteKeys(client, Object.values(keys), env);
        log(strapi, 'upload:error', { requestId, reason: 'object_publicly_readable' });
        return {
          error: 'protected_object_public',
          status: 503,
          message: 'Protected photos cannot be stored until the bucket prefix is private.',
        };
      }
    } catch (err) {
      await deleteKeys(client, Object.values(keys), env);
      log(strapi, 'upload:error', { requestId, reason: 's3_put_failed' });
      return { error: 'upload_failed', status: 500, message: 'Could not store that photo.' };
    }

    const gallery = processed.variants.gallery;
    const mediaDomain = domain === pure.PROTECTED_DOMAIN_CONVERSATION
      ? pure.PROTECTED_DOMAIN_CONVERSATION
      : pure.PROTECTED_DOMAIN_ARTIST_UPDATE;
    const row = await strapi.entityService.create('plugin::upload.file', {
      data: {
        name: `${mediaDomain}-${objectId}.webp`,
        alternativeText: 'Image',
        caption: null,
        width: gallery.width,
        height: gallery.height,
        formats: null,
        hash: objectId,
        ext: '.webp',
        mime: 'image/webp',
        size: Math.max(1, Math.round((gallery.bytes || 1) / 1000)),
        url: `faneqo-protected://${objectId}`,
        provider: pure.PROVIDER_NAME,
        provider_metadata: {
          protected: true,
          objectId,
          keys,
          domain: mediaDomain,
          bandId: bandId || null,
          uploaderUserId: userId || null,
        },
        folderPath: `/${pure.PROTECTED_PREFIX}`,
      },
    });

    log(strapi, 'upload:success', {
      requestId,
      mediaId: row.id,
      latencyMs: Date.now() - started,
    });
    return {
      data: {
        id: row.id,
        width: row.width,
        height: row.height,
        mime: row.mime || 'image/webp',
        protected: true,
      },
    };
  }

  async function streamProtectedMedia({ update, conversationId, messageId, file, size, requestId } = {}) {
    const started = Date.now();
    const ready = configured();
    if (!ready.ready) {
      return { error: 'gated_delivery_unavailable', status: 503, message: 'Protected delivery is not configured.' };
    }
    const meta = file.provider_metadata || {};
    const key = meta.keys?.[size] || pure.protectedObjectKey(meta.objectId, size);
    if (!key || !String(key).startsWith(`${pure.PROTECTED_PREFIX}/`)) {
      log(strapi, 'proxy:stream_error', { requestId, reason: 'invalid_key' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
    const cfg = s3Config(env);
    const client = createS3(env);
    try {
      log(strapi, 'proxy:stream_start', {
        requestId,
        updateId: update?.id,
        conversationId: conversationId || null,
        messageId: messageId || null,
        mediaId: file.id,
        size,
        visibility: update?.visibility,
      });
      const out = await client.send(new GetObjectCommand({
        Bucket: cfg.bucket,
        Key: key,
      }));
      log(strapi, 'access:allow', {
        requestId,
        updateId: update?.id,
        conversationId: conversationId || null,
        messageId: messageId || null,
        mediaId: file.id,
        latencyMs: Date.now() - started,
      });
      return {
        stream: out.Body,
        mime: out.ContentType || 'image/webp',
        length: out.ContentLength || null,
      };
    } catch (err) {
      log(strapi, 'proxy:stream_error', { requestId, reason: 's3_get_failed' });
      return { error: 'not_found', status: 404, message: 'Image is not available' };
    }
  }

  async function cleanupOrphans({ now = Date.now(), graceMs = pure.ORPHAN_GRACE_MS, limit = pure.ORPHAN_CLEANUP_BATCH } = {}) {
    const cutoff = new Date(now - graceMs).toISOString();
    const batch = Math.min(Math.max(Number(limit) || 40, 1), 80);
    const candidates = await strapi.entityService.findMany('plugin::upload.file', {
      filters: {
        provider: pure.PROVIDER_NAME,
        createdAt: { $lt: cutoff },
      },
      fields: ['id', 'provider', 'provider_metadata', 'createdAt', 'hash'],
      sort: { createdAt: 'asc' },
      limit: batch,
    });
    const files = (candidates || []).filter((file) => pure.isProtectedOrphanCandidate(file, { now, graceMs }));
    let deleted = 0;
    let skippedReferenced = 0;
    if (files.length) {
      const ids = files.map((file) => file.id);
      const referenced = await loadReferencedProtectedMediaIds(strapi, ids);
      const orphans = pure.unreferencedProtectedFiles(files, referenced);
      skippedReferenced = files.length - orphans.length;
      const client = createS3(env);
      for (const file of orphans) {
        try {
          await deleteKeys(client, protectedObjectKeysFor(file), env);
          await strapi.entityService.delete('plugin::upload.file', file.id);
          deleted += 1;
        } catch (err) {
          log(strapi, 'cleanup:error', { mediaId: file.id, reason: 'delete_failed' });
        }
      }
      log(strapi, 'cleanup:done', {
        examined: files.length,
        deleted,
        skippedReferenced,
      });
    }

    /**
     * Public staged gallery bytes are not provider `faneqo-protected`, so the
     * scan above cannot see them. They are swept from the draft side, where
     * they are positively identified rather than guessed at.
     */
    let staged = { examined: 0, deleted: 0, skippedReferenced: 0, draftsDiscarded: 0 };
    try {
      // eslint-disable-next-line global-require
      const { createGalleryDraftService } = require('../galleries/galleryDraftService');
      staged = await createGalleryDraftService(strapi, env).cleanupStagedGalleryMedia({ now, graceMs, limit: batch });
    } catch (err) {
      log(strapi, 'cleanup:error', { reason: 'staged_sweep_failed' });
    }

    return {
      examined: files.length + (staged.examined || 0),
      deleted: deleted + (staged.deleted || 0),
      skippedReferenced: skippedReferenced + (staged.skippedReferenced || 0),
      draftsDiscarded: staged.draftsDiscarded || 0,
    };
  }

  return {
    configured,
    uploadProtectedImage,
    streamProtectedMedia,
    deleteMediaFile,
    cleanupOrphans,
    cdnHosts: () => cdnHosts(env),
  };
}

async function loadReferencedProtectedMediaIds(strapi, mediaIds) {
  const ids = [...new Set((mediaIds || []).map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0))];
  const referenced = new Set();
  if (!ids.length) return referenced;
  const [updates, byLegacy, byGallery] = await Promise.all([
    strapi.entityService.findMany('api::artist-update.artist-update', {
      filters: { media: { id: { $in: ids } } },
      fields: ['id'],
      populate: { media: { fields: ['id'] } },
      limit: Math.min(ids.length, 80),
    }),
    strapi.entityService.findMany('api::conversation-message.conversation-message', {
      filters: { attachmentMedia: { id: { $in: ids } } },
      fields: ['id'],
      populate: { attachmentMedia: { fields: ['id'] } },
      limit: Math.min(ids.length, 80),
    }),
    strapi.entityService.findMany('api::conversation-message.conversation-message', {
      filters: { attachmentGallery: { id: { $in: ids } } },
      fields: ['id'],
      populate: { attachmentGallery: { fields: ['id'] } },
      limit: Math.min(ids.length, 80),
    }),
  ]);
  for (const row of updates || []) {
    for (const file of row.media || []) {
      if (file?.id) referenced.add(Number(file.id));
    }
  }
  for (const row of byLegacy || []) {
    const file = row.attachmentMedia;
    if (file?.id) referenced.add(Number(file.id));
    else if (file) referenced.add(Number(file));
  }
  for (const row of byGallery || []) {
    for (const file of row.attachmentGallery || []) {
      if (file?.id) referenced.add(Number(file.id));
      else if (file) referenced.add(Number(file));
    }
  }
  return referenced;
}

async function fileToBuffer(file) {
  if (file?.buffer) return file.buffer;
  if (file?.stream) return streamToBuffer(file.stream);
  const diskPath = file?.filepath || file?.path;
  if (diskPath) return fs.promises.readFile(diskPath);
  return null;
}

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

module.exports = {
  createProtectedMediaService,
  processArtistUpdateImage,
  toDecodableBuffer,
  probePublicAccess,
  loadReferencedProtectedMediaIds,
  protectedObjectKeysFor,
  s3Config,
};
