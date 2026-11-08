/**
 * Shared media helper tests.
 * Run: node scripts/test-faneqo-media.mjs
 */
import assert from 'node:assert/strict'
import {
  collectMessageAttachments,
  faneqoMediaIdentity,
  faneqoMediaKey,
  isMediaPreviewLabel,
  mediaPreviewLabel,
  normalizeFaneqoMedia,
  normalizeFaneqoMediaList,
  resolveFaneqoMediaSrc,
  validateFaneqoImageFile,
  FANEQO_DM_MAX_IMAGES,
  FANEQO_IMAGE_MAX_BYTES,
  FANEQO_UPDATE_MAX_IMAGES,
} from '../utils/media/faneqoMedia.js'

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

test('accepts HEIC, rejects non-image and oversized files', () => {
  /* iPhone photos are first-class; the server converts them before storage. */
  const heic = validateFaneqoImageFile({ type: 'image/heic', size: 10, name: 'IMG_1234.HEIC' })
  assert.equal(heic.error, null)
  assert.equal(heic.mime, 'image/heic')
  const pdf = validateFaneqoImageFile({ type: 'application/pdf', size: 10 })
  assert.equal(pdf.error, 'invalid_type')
  assert.match(pdf.message, /Choose a JPEG, PNG, HEIC, or WebP/)
  const huge = validateFaneqoImageFile({ type: 'image/jpeg', size: FANEQO_IMAGE_MAX_BYTES + 1 })
  assert.equal(huge.error, 'too_large')
  assert.equal(huge.message, 'Photos can be up to 8 MB.')
  /* An oversized HEIC is still refused for size, not waved through. */
  assert.equal(validateFaneqoImageFile({ type: 'image/heic', size: FANEQO_IMAGE_MAX_BYTES + 1 }).error, 'too_large')
  assert.equal(validateFaneqoImageFile({ type: 'image/jpeg', size: FANEQO_IMAGE_MAX_BYTES }).error, null)
  assert.equal(validateFaneqoImageFile({ type: 'image/webp', size: 100 }).error, null)
  assert.equal(validateFaneqoImageFile({ type: 'image/png', size: 100 }).error, null)
  /* Safari hands over an empty type for a camera-roll file; name decides. */
  const heicByName = validateFaneqoImageFile({ type: '', size: 10, name: 'concert.heif' })
  assert.equal(heicByName.error, null)
  assert.equal(validateFaneqoImageFile({ type: '', size: 10, name: 'notes.txt' }).error, 'invalid_type')
})

test('normalize emits MediaItem with stable mediaId, not signed-URL identity', () => {
  const row = normalizeFaneqoMedia({
    id: 9,
    url: 'https://cdn.example/a.jpg',
    width: 800,
    height: 600,
    alternativeText: 'Stage',
    mime: 'image/jpeg',
    provider: 'aws-s3',
    hash: 'secret',
  })
  assert.equal(row.id, 9)
  assert.equal(row.mediaId, 9)
  assert.equal(row.url, 'https://cdn.example/a.jpg')
  assert.equal(row.thumbnailUrl, 'https://cdn.example/a.jpg')
  assert.equal(row.thumbUrl, row.thumbnailUrl)
  assert.equal(row.largeUrl, 'https://cdn.example/a.jpg')
  assert.equal(row.width, 800)
  assert.equal(row.height, 600)
  assert.equal(row.aspectRatio, 800 / 600)
  assert.equal(row.alt, 'Stage')
  assert.equal(row.mime, 'image/jpeg')
  assert.equal(row.protected, false)
  assert.equal(row.order, null)
  assert.equal(row.hash, undefined)
  assert.equal(row.provider, undefined)
})

test('public Strapi formats become thumbnail / display / large URLs', () => {
  const row = normalizeFaneqoMedia({
    id: 10,
    url: 'https://cdn.example/full.jpg',
    mime: 'image/jpeg',
    width: 2400,
    height: 1600,
    formats: {
      thumbnail: { url: 'https://cdn.example/thumb.jpg', width: 245, height: 163 },
      small: { url: 'https://cdn.example/small.jpg', width: 500, height: 333 },
      medium: { url: 'https://cdn.example/medium.jpg', width: 750, height: 500 },
      large: { url: 'https://cdn.example/large.jpg', width: 1000, height: 667 },
    },
  })
  assert.equal(row.thumbnailUrl, 'https://cdn.example/thumb.jpg')
  assert.equal(row.url, 'https://cdn.example/medium.jpg')
  assert.equal(row.largeUrl, 'https://cdn.example/large.jpg')
  assert.equal(row.originalUrl, 'https://cdn.example/full.jpg')
  assert.equal(row.formats.thumbnail.url, 'https://cdn.example/thumb.jpg')
  assert.equal(row.formats.medium.width, 750)
})

test('protected derivatives keep authorized URLs and never key on rotating signatures', () => {
  const first = normalizeFaneqoMedia({
    id: 12,
    mediaId: 12,
    url: 'https://api.example/api/artist-updates/3/media/12?size=gallery&sig=aaa',
    thumbnailUrl: 'https://api.example/api/artist-updates/3/media/12?size=thumb&sig=aaa',
    largeUrl: 'https://api.example/api/artist-updates/3/media/12?size=large&sig=aaa',
    width: 960,
    height: 640,
    protected: true,
  })
  const rotated = normalizeFaneqoMedia({
    id: 12,
    mediaId: 12,
    url: 'https://api.example/api/artist-updates/3/media/12?size=gallery&sig=bbb',
    thumbUrl: 'https://api.example/api/artist-updates/3/media/12?size=thumb&sig=bbb',
    largeUrl: 'https://api.example/api/artist-updates/3/media/12?size=large&sig=bbb',
    width: 960,
    height: 640,
    protected: true,
  })
  assert.equal(first.protected, true)
  assert.equal(faneqoMediaIdentity(first), '12')
  assert.equal(faneqoMediaIdentity(rotated), '12')
  assert.equal(faneqoMediaKey(first, 0), 'media:12')
  assert.equal(faneqoMediaKey(rotated, 9), 'media:12')
  assert.equal(first.aspectRatio, 960 / 640)
  assert.equal(first.originalUrl, null)
  assert.doesNotMatch(faneqoMediaKey(first), /sig=/)
})

test('protected media never keeps a leaked originalUrl', () => {
  const row = normalizeFaneqoMedia({
    id: 12,
    url: 'https://api.example/api/artist-updates/3/media/12?sig=aaa',
    originalUrl: 'https://cdn.example/secret.jpg',
    protected: true,
  })
  assert.equal(row.originalUrl, null)
  assert.notEqual(row.url, 'https://cdn.example/secret.jpg')
})

test('internal protected placeholders never become display URLs', () => {
  const row = normalizeFaneqoMedia({
    id: 4,
    url: 'faneqo-protected://abc',
    previewUrl: 'blob:http://local/preview',
    protected: true,
  })
  assert.equal(row.url, 'blob:http://local/preview')
  assert.equal(row.previewUrl, 'blob:http://local/preview')
  assert.equal(normalizeFaneqoMedia({ id: 5, url: 'faneqo-protected://abc' }), null)
})

test('aspectRatio is null when dimensions are missing or invalid', () => {
  const missing = normalizeFaneqoMedia({ id: 1, url: 'https://cdn.example/a.jpg' })
  assert.equal(missing.aspectRatio, null)
  const zero = normalizeFaneqoMedia({ id: 2, url: 'https://cdn.example/a.jpg', width: 0, height: 100 })
  assert.equal(zero.aspectRatio, null)
})

test('list order is parent-array order and first item is the V1 cover candidate', () => {
  const list = normalizeFaneqoMediaList([
    { id: 8, url: 'https://cdn.example/8.jpg' },
    { id: 3, url: 'https://cdn.example/3.jpg' },
    { id: 19, url: 'https://cdn.example/19.jpg' },
    { id: 6, url: 'https://cdn.example/6.jpg' },
  ])
  assert.deepEqual(list.map((item) => item.mediaId), [8, 3, 19, 6])
  assert.deepEqual(list.map((item) => item.order), [0, 1, 2, 3])
})

test('collectMessageAttachments prefers attachments[] then legacy attachment', () => {
  const multi = collectMessageAttachments({
    attachments: [
      { url: 'https://cdn.example/1.jpg', width: 1, height: 1 },
      { url: 'https://cdn.example/2.jpg', width: 2, height: 2 },
    ],
    attachment: { url: 'https://cdn.example/legacy.jpg' },
  })
  assert.equal(multi.length, 2)
  const legacy = collectMessageAttachments({ attachment: { url: 'https://cdn.example/legacy.jpg' } })
  assert.equal(legacy.length, 1)
  assert.equal(legacy[0].url, 'https://cdn.example/legacy.jpg')
})

test('limits are 4 DM images and 60 show-gallery images', () => {
  assert.equal(FANEQO_DM_MAX_IMAGES, 4)
  assert.equal(FANEQO_UPDATE_MAX_IMAGES, 60)
})

test('media preview labels stay human, never filenames', () => {
  assert.equal(mediaPreviewLabel(1), 'Photo')
  assert.equal(mediaPreviewLabel(4), '4 photos')
  assert.equal(isMediaPreviewLabel('Photo'), true)
  assert.equal(isMediaPreviewLabel('4 photos'), true)
  assert.equal(isMediaPreviewLabel('stage-shot.jpg'), false)
})

test('resolveFaneqoMediaSrc prefixes relative protected API paths only', () => {
  assert.equal(
    resolveFaneqoMediaSrc('/api/conversations/4/messages/9/media/88?sig=aaa', 'https://api.example'),
    'https://api.example/api/conversations/4/messages/9/media/88?sig=aaa'
  )
  assert.equal(
    resolveFaneqoMediaSrc('https://api.example/api/conversations/4/messages/9/media/88?sig=bbb', 'https://other.example'),
    'https://api.example/api/conversations/4/messages/9/media/88?sig=bbb'
  )
  assert.equal(resolveFaneqoMediaSrc('blob:http://local/p', 'https://api.example'), 'blob:http://local/p')
})

test('unavailable protected media stays in the list without public URLs', () => {
  const row = normalizeFaneqoMedia({
    id: 12,
    mediaId: 12,
    protected: true,
    unavailable: true,
    url: null,
    mime: 'image/webp',
  })
  assert.equal(row.mediaId, 12)
  assert.equal(row.protected, true)
  assert.equal(row.unavailable, true)
  assert.equal(row.url, null)
})

console.log(`\n=== faneqo media: ${passed} passed ===`)
