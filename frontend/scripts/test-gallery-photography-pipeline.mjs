/**
 * Public Gallery photography pipeline: srcset, originals, crop guard, locked leak.
 * Run: node scripts/test-gallery-photography-pipeline.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeFaneqoMedia } from '../utils/media/faneqoMedia.js'
import {
  coverCropLoss,
  galleryLayoutKind,
  galleryLeadAspect,
  gallerySizes,
  gallerySrcset,
  LEAD_CROP_GUARD,
  selectGalleryMediaSource,
  selectThreePhotoKind,
} from '../utils/media/faneqoGalleryLayout.js'

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ✅ ${name}`)
}

const raccoon = {
  id: 'raccoon',
  url: 'https://cdn.example/raccoon-m.jpg',
  largeUrl: 'https://cdn.example/raccoon-l.jpg',
  originalUrl: 'https://cdn.example/raccoon.jpg',
  width: 5472,
  height: 3648,
  aspectRatio: 1.5,
  formats: {
    medium: { url: 'https://cdn.example/raccoon-m.jpg', width: 750, height: 500 },
    large: { url: 'https://cdn.example/raccoon-l.jpg', width: 1000, height: 667 },
  },
}
const leopard = {
  id: 'leopard',
  url: 'https://cdn.example/leopard-m.jpg',
  largeUrl: 'https://cdn.example/leopard-l.jpg',
  originalUrl: 'https://cdn.example/leopard.jpg',
  width: 5472,
  height: 3648,
  aspectRatio: 1.5,
  formats: {
    medium: { url: 'https://cdn.example/leopard-m.jpg', width: 750, height: 500 },
    large: { url: 'https://cdn.example/leopard-l.jpg', width: 1000, height: 667 },
  },
}
const tiger = {
  id: 'tiger',
  url: 'https://cdn.example/tiger-m.jpg',
  largeUrl: 'https://cdn.example/tiger-l.jpg',
  originalUrl: 'https://cdn.example/tiger.jpg',
  width: 2155,
  height: 3232,
  aspectRatio: 0.667,
  formats: {
    medium: { url: 'https://cdn.example/tiger-m.jpg', width: 500, height: 750 },
    large: { url: 'https://cdn.example/tiger-l.jpg', width: 666, height: 1000 },
  },
}

test('Fun Time Last chooses mosaic-top so the lead keeps ~1.5', () => {
  const list = [raccoon, leopard, tiger]
  assert.equal(selectThreePhotoKind(list), 'mosaic-top')
  assert.equal(galleryLayoutKind(list), 'mosaic-top')
  assert.equal(galleryLeadAspect(raccoon, 'mosaic-top'), 1.5)
  assert.equal(coverCropLoss(1.5, 1.5), 0)
  assert.ok(coverCropLoss(1.5, 2.63) > LEAD_CROP_GUARD)
})

test('portrait leads stay hero-support and are never reordered', () => {
  const list = [tiger, raccoon, leopard]
  assert.equal(selectThreePhotoKind(list), 'hero-support')
  assert.equal(galleryLayoutKind(list), 'hero-support')
  assert.equal(list[0].id, 'tiger')
})

test('srcset is medium/large/original; mobile slots can stay on medium', () => {
  const srcset = gallerySrcset(tiger, { role: 'support' })
  assert.match(srcset, /tiger-m\.jpg 500w/)
  assert.match(srcset, /tiger-l\.jpg 666w/)
  assert.match(srcset, /tiger\.jpg 2155w/)
  assert.equal(selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 180, dpr: 1 }).key, 'medium')
  assert.equal(selectGalleryMediaSource(tiger, { role: 'support', targetCssPx: 650, dpr: 2 }).key, 'original')
  assert.match(gallerySizes('support', 'viewer'), /48vw/)
  assert.match(gallerySizes('hero', 'viewer'), /92vw/)
})

test('lightbox / high-DPR lead can use original; protected srcset is empty', () => {
  assert.equal(selectGalleryMediaSource(raccoon, { role: 'lightbox', targetCssPx: 2000, dpr: 2 }).key, 'original')
  assert.equal(gallerySrcset({ ...tiger, protected: true }, { role: 'hero' }), '')
  const leaked = normalizeFaneqoMedia({
    id: 9,
    url: '/api/artist-updates/3/media/9?sig=aaa',
    originalUrl: 'https://cdn.example/secret.jpg',
    protected: true,
  })
  assert.equal(leaked.originalUrl, null)
  assert.equal(gallerySrcset(leaked, { role: 'hero' }), '')
})

test('locked public gallery path never renders media helpers', () => {
  const night = read('composables/usePublicNight.js')
  const experience = read('components/nights/PublicGalleryExperience.vue')
  const adapter = read('features/gallery-experience/core/publicGalleryToExperience.js')
  assert.match(night, /row\.locked \? \[\] : normalizeFaneqoMediaList\(row\.media\)/)
  assert.match(experience, /locked\.value \? \[\] : \(gallery\.value\.media \|\| \[\]\)/)
  assert.match(experience, /v-if="!locked && memories.length"/)
  assert.match(adapter, /locked \|\| !Array\.isArray\(gallery\.media\) \? \[\]/)
})

console.log(`test-gallery-photography-pipeline: ${passed} ok`)
