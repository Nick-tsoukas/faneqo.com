'use strict';

/**
 * Fan avatar I/O — Sharp normalize + public Strapi Upload plugin.
 *
 * Public CDN/S3 on purpose. Do not use the protected DM/gallery provider.
 * File lifecycle (including provider delete) goes through the Upload plugin.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const pure = require('./fanProfileAvatarPure');

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
    .map(([key, value]) => `${key}=${value}`);
  strapi?.log?.info?.(`[FanProfile Avatar] ${event}${parts.length ? ` ${parts.join(' ')}` : ''}`);
}

async function readIncomingBuffer(incoming) {
  if (!incoming) return null;
  if (Buffer.isBuffer(incoming.buffer)) return incoming.buffer;
  const filePath = incoming.path || incoming.filepath;
  if (!filePath) return null;
  const handle = await fsp.open(filePath, 'r');
  try {
    const cap = pure.AVATAR_MAX_BYTES + 1;
    const buf = Buffer.allocUnsafe(cap);
    const { bytesRead } = await handle.read(buf, 0, cap, 0);
    return buf.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * 512×512 cover crop, EXIF orientation applied, metadata stripped.
 * Sharp's output buffer does not carry the input EXIF/GPS by default when we
 * do not call withMetadata().
 */
async function normalizeAvatarImage(buffer) {
  const sharp = getSharp();
  const out = await sharp(buffer, { failOn: 'none', sequentialRead: true })
    .rotate()
    .resize({
      width: pure.AVATAR_SIZE,
      height: pure.AVATAR_SIZE,
      fit: 'cover',
      position: 'centre',
      withoutEnlargement: false,
    })
    .webp({ quality: pure.AVATAR_OUTPUT_QUALITY })
    .toBuffer();

  const info = await sharp(out).metadata();
  return {
    buffer: out,
    mime: pure.AVATAR_OUTPUT_MIME,
    ext: pure.AVATAR_OUTPUT_EXT,
    width: info.width || pure.AVATAR_SIZE,
    height: info.height || pure.AVATAR_SIZE,
    hasExif: Boolean(info.exif),
    orientation: info.orientation || null,
  };
}

function getUploadService(strapi) {
  const service = strapi?.plugin?.('upload')?.service?.('upload');
  if (!service || typeof service.upload !== 'function') {
    const err = new Error('Upload plugin is not available');
    err.code = 'upload_unavailable';
    throw err;
  }
  return service;
}

/** Server-side public Upload. The caller never chooses a file id. */
async function uploadNormalizedAvatar(strapi, normalized) {
  const service = getUploadService(strapi);
  const tmp = path.join(os.tmpdir(), `fan-avatar-${crypto.randomBytes(8).toString('hex')}.webp`);
  await fsp.writeFile(tmp, normalized.buffer);
  try {
    const uploaded = await service.upload({
      data: {
        fileInfo: {
          name: 'fan-avatar.webp',
          alternativeText: 'Fan profile photo',
          caption: null,
        },
      },
      files: {
        path: tmp,
        name: 'fan-avatar.webp',
        type: pure.AVATAR_OUTPUT_MIME,
        size: normalized.buffer.length,
      },
    });
    const row = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!row?.id) {
      const err = new Error('Upload plugin returned no file');
      err.code = 'upload_failed';
      throw err;
    }
    return row;
  } finally {
    await fsp.unlink(tmp).catch(() => {});
  }
}

async function listFileRelations(strapi, fileId) {
  const knex = strapi?.db?.connection;
  if (!knex || typeof knex.schema?.hasTable !== 'function') return null;
  try {
    if (!(await knex.schema.hasTable('files_related_morphs'))) return [];
    return knex('files_related_morphs').select('related_id', 'related_type', 'field').where('file_id', fileId);
  } catch {
    return null;
  }
}

async function loadUploadFile(strapi, fileId) {
  if (!fileId) return null;
  try {
    return (
      (await strapi.entityService.findOne('plugin::upload.file', fileId, {
        fields: ['id', 'url', 'mime', 'width', 'height', 'provider', 'provider_metadata', 'formats'],
      })) || null
    );
  } catch {
    return null;
  }
}

/**
 * Delete only a prior avatar we just unlinked from this profile.
 * Cleanup failure is logged and swallowed — the user-facing mutation already
 * succeeded.
 */
async function removeOwnedPriorAvatar(strapi, { priorFileId, capturedFileId, newFileId, profileId }) {
  if (!pure.canSafelyDeletePriorAvatar({
    priorFileId,
    capturedFileId,
    newFileId,
    relations: [],
    file: null,
  })) {
    // Cheap reject for id mismatch / same-as-new before any I/O.
    if (Number(priorFileId) !== Number(capturedFileId) || Number(newFileId) === Number(priorFileId)) {
      return { deleted: false, reason: 'not_owned' };
    }
  }

  const file = await module.exports.loadUploadFile(strapi, priorFileId);
  if (!file) return { deleted: false, reason: 'missing' };

  const relations = await module.exports.listFileRelations(strapi, priorFileId);
  if (!pure.canSafelyDeletePriorAvatar({
    priorFileId,
    capturedFileId,
    newFileId,
    relations,
    file,
  })) {
    log(strapi, 'cleanup:skipped', {
      fileId: priorFileId,
      profileId,
      reason: relations == null ? 'relations_unknown' : 'still_referenced',
    });
    return { deleted: false, reason: relations == null ? 'relations_unknown' : 'still_referenced' };
  }

  try {
    await getUploadService(strapi).remove(file);
    log(strapi, 'cleanup:deleted', { fileId: priorFileId, profileId });
    return { deleted: true };
  } catch (err) {
    log(strapi, 'cleanup:failed', { fileId: priorFileId, profileId, reason: err.code || 'remove_failed' });
    strapi?.log?.warn?.(`[FanProfile Avatar] prior file cleanup failed fileId=${priorFileId}`);
    return { deleted: false, reason: 'remove_failed' };
  }
}

/** Best-effort: a brand-new upload that never got associated is our orphan. */
async function removeOrphanUpload(strapi, file) {
  if (!file?.id) return;
  try {
    await getUploadService(strapi).remove(file);
  } catch (err) {
    log(strapi, 'orphan:failed', { fileId: file.id, reason: err.code || 'remove_failed' });
  }
}

function incomingDescriptor(raw) {
  const file = pure.pickIncomingFile(raw) || raw;
  if (!file) return null;
  return {
    buffer: file.buffer || null,
    path: file.path || file.filepath || null,
    filename: file.originalFilename || file.name || file.filename || '',
    mime: file.mimetype || file.type || file.mime || '',
    size: file.size,
  };
}

module.exports = {
  getSharp,
  readIncomingBuffer,
  normalizeAvatarImage,
  uploadNormalizedAvatar,
  listFileRelations,
  loadUploadFile,
  removeOwnedPriorAvatar,
  removeOrphanUpload,
  incomingDescriptor,
  log,
};
