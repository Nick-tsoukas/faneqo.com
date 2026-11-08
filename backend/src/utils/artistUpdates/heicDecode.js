'use strict';

/**
 * HEIC/HEIF decoding for gallery uploads.
 *
 * sharp's prebuilt libvips advertises a HEIF loader but is built without
 * libde265, so it cannot open an ordinary iPhone photo. Rather than rebuild
 * libvips in the deploy image, we decode HEVC-in-HEIF with the pure-WASM
 * `heic-decode` and hand raw pixels to sharp, which then does everything else
 * (orientation, resizing, derivatives) exactly as it does for JPEG.
 *
 * Only reached for files that actually look like HEIC; every other format
 * takes the untouched native path.
 */

const HEIC_MIMES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/* ftyp brands that indicate HEVC-coded HEIF. `mif1` alone can also be AVIF,
   which sharp handles natively, so brand sniffing stays advisory. */
const HEIC_BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'];

function isHeicMime(mime) {
  return HEIC_MIMES.has(String(mime || '').toLowerCase());
}

function hasHeicExtension(name) {
  return /\.(heic|heif)$/i.test(String(name || ''));
}

function hasHeicSignature(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 16) return false;
  if (buffer.subarray(4, 8).toString('latin1') !== 'ftyp') return false;
  const brand = buffer.subarray(8, 12).toString('latin1').toLowerCase();
  if (!HEIC_BRANDS.includes(brand)) return false;
  // `mif1`/`msf1` are generic HEIF; require a concrete heic brand somewhere in
  // the compatible-brand list so plain AVIF is left to sharp.
  if (brand === 'mif1' || brand === 'msf1') {
    const head = buffer.subarray(0, 64).toString('latin1').toLowerCase();
    return head.includes('heic') || head.includes('heix') || head.includes('hevc');
  }
  return true;
}

/**
 * Advisory check used both by the upload guard and by the decode step.
 * Signature wins over a client-supplied mime or filename.
 */
function looksLikeHeic(buffer, mime, name) {
  if (hasHeicSignature(buffer)) return true;
  if (Buffer.isBuffer(buffer) && buffer.length >= 16) return false;
  return isHeicMime(mime) || hasHeicExtension(name);
}

/**
 * Decode to a PNG buffer sharp can read. PNG keeps the decode lossless; the
 * caller immediately re-encodes to the real derivative format.
 */
async function decodeHeicToPng(buffer) {
  let decode;
  try {
    // eslint-disable-next-line global-require
    decode = require('heic-decode');
  } catch (err) {
    const error = new Error('HEIC decoding is not available on this server.');
    error.code = 'heic_decoder_missing';
    throw error;
  }
  const sharp = require('sharp');
  let frame;
  try {
    frame = await decode({ buffer });
  } catch (err) {
    const error = new Error('That HEIC photo could not be read.');
    error.code = 'heic_decode_failed';
    throw error;
  }
  if (!frame || !frame.width || !frame.height || !frame.data) {
    const error = new Error('That HEIC photo could not be read.');
    error.code = 'heic_decode_failed';
    throw error;
  }
  return sharp(Buffer.from(frame.data), {
    raw: { width: frame.width, height: frame.height, channels: 4 },
  }).png({ compressionLevel: 3 }).toBuffer();
}

/**
 * Normalize any incoming image buffer to something sharp can decode natively.
 * Returns the original buffer untouched for non-HEIC input.
 */
async function normalizeImageBuffer(buffer, { mime, name } = {}) {
  if (!looksLikeHeic(buffer, mime, name)) {
    return { buffer, converted: false, mime: mime || null };
  }
  const png = await decodeHeicToPng(buffer);
  return { buffer: png, converted: true, mime: 'image/png' };
}

module.exports = {
  HEIC_MIMES,
  isHeicMime,
  hasHeicExtension,
  hasHeicSignature,
  looksLikeHeic,
  decodeHeicToPng,
  normalizeImageBuffer,
};
