'use strict';

/**
 * Proves whether this runtime can turn a real iPhone-style HEIC into the
 * derivatives the gallery pipeline needs.
 *
 * Two separate questions, because they have different answers:
 *   1. can sharp/libvips decode HEIC natively?   (no on the sharp prebuilds)
 *   2. can the heic-decode WASM fallback do it?  (this is what we ship)
 *
 * Run: node scripts/check-heic-support.js
 */

const fs = require('fs');
const path = require('path');

const FIXTURE = path.join(__dirname, 'fixtures', 'sample-iphone.heic');

async function main() {
  const sharp = require('sharp');
  console.log(`sharp ${sharp.versions.sharp} / libvips ${sharp.versions.vips}`);
  console.log(`sharp.format.heif.input.buffer: ${!!sharp.format.heif?.input?.buffer}  <- container loader only, not a codec`);

  // Native HEVC probe. An encode round trip is the honest check: the prebuilt
  // libheif carries AVIF but not libde265, so hevc fails while av1 succeeds.
  const seed = await sharp({ create: { width: 64, height: 48, channels: 3, background: { r: 200, g: 40, b: 90 } } })
    .jpeg().toBuffer();
  for (const compression of ['hevc', 'av1']) {
    try {
      await sharp(seed).heif({ compression, quality: 50 }).toBuffer();
      console.log(`native heif round trip compression=${compression}: OK`);
    } catch (err) {
      console.log(`native heif round trip compression=${compression}: FAILED (${err.message})`);
    }
  }

  if (!fs.existsSync(FIXTURE)) {
    console.log(`\nNo fixture at ${path.relative(process.cwd(), FIXTURE)} — cannot prove real decoding.`);
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(FIXTURE);
  const brand = raw.subarray(4, 12).toString('latin1');
  console.log(`\nfixture: ${raw.length} bytes, ftyp brand "${brand}"`);

  // metadata() only parses the HEIF container and succeeds even with no codec,
  // so the honest native check has to force an actual pixel decode.
  try {
    const meta = await sharp(raw).metadata();
    console.log(`native sharp metadata of real HEIC: OK (${meta.width}x${meta.height})  <- container only, proves nothing`);
  } catch (err) {
    console.log(`native sharp metadata of real HEIC: FAILED (${err.message.split('\n')[0]})`);
  }
  try {
    await sharp(raw).resize(16, 16, { fit: 'inside' }).raw().toBuffer();
    console.log('native sharp PIXEL decode of real HEIC: OK');
  } catch (err) {
    console.log(`native sharp PIXEL decode of real HEIC: FAILED (${err.message.split('\n').pop().trim()})`);
  }

  // The shipped path.
  const { decodeHeicToPng, looksLikeHeic } = require('../src/utils/artistUpdates/heicDecode');
  console.log(`looksLikeHeic(): ${looksLikeHeic(raw, 'image/heic', 'sample-iphone.heic')}`);
  const started = Date.now();
  const png = await decodeHeicToPng(raw);
  const meta = await sharp(png).metadata();
  console.log(`heic-decode fallback: OK (${meta.width}x${meta.height}, ${png.length} bytes, ${Date.now() - started}ms)`);

  const webp = await sharp(png).rotate().resize(960, null, { withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const webpMeta = await sharp(webp).metadata();
  console.log(`derivative: OK (${webpMeta.format} ${webpMeta.width}x${webpMeta.height}, ${webp.length} bytes)`);
  console.log('\nHEIC (HEVC) decode: YES (via heic-decode WASM fallback)');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
