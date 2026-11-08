/**
 * Gallery Stack primitive + archive grouping.
 * Run: node scripts/test-faneqo-gallery-stack.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  clampStackIndex,
  stackActivateLabel,
  stackActivatePayload,
  stackBrowsableMedia,
  stackDeckPlan,
  stackElasticDrag,
  stackGestureAxis,
  stackIsTap,
  stackLayerKind,
  stackLayerSource,
  stackObjectPosition,
  stackPhotoCount,
  stackShouldCommit,
  stackStepIndex,
  stackVisibleLayers,
  stackVisibleMedia,
  STACK_VISIBLE_LIMIT,
} from '../utils/media/faneqoGalleryStack.js'
import {
  archiveScrollRestorePlan,
  recalledArchiveScroll,
  recalledStackIndex,
  rememberArchiveScroll,
  rememberStackIndex,
} from '../utils/galleries/stackBrowseMemory.js'
import {
  authorizedStackIndex,
  manageGalleryLocation,
  readGalleryOpenIntent,
  resolveNightGalleryOpen,
  stackPrintTransitionName,
} from '../utils/galleries/stackOpenNavigation.js'
import { stripNavFrom } from '../utils/nights/artistWorldReturn.js'
import {
  archiveVisibilityLabel,
  galleryTitle,
  groupArchiveShelves,
  isDraftGallery,
  manageGalleryPath,
  manageSendPath,
  nightShelfKicker,
  nightShelfVenue,
} from '../utils/galleries/archiveShelves.js'
function nightRow(id, extras = {}) {
  return {
    id,
    slug: `g-${id}`,
    title: extras.title || `Gallery ${id}`,
    visibility: extras.visibility || 'public',
    status: extras.status || 'published',
    photoCount: extras.photoCount || 3,
    showRecapId: extras.recapId || null,
    media: extras.media || [],
    show: extras.general
      ? null
      : {
        showRecapId: extras.recapId || null,
        venue: extras.venue || '',
        city: extras.city || '',
        date: extras.date || null,
      },
  }
}

const root = dirname(fileURLToPath(import.meta.url))
const read = (rel) => readFileSync(resolve(root, '..', rel), 'utf8')

let passed = 0
function test(name, fn) {
  fn()
  passed += 1
  console.log(`  ok  ${name}`)
}

function compileSfc(rel) {
  const source = read(rel)
  const { descriptor, errors } = parse(source, { filename: rel })
  assert.deepEqual(errors, [], `${rel} parse errors`)
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, { id: rel, filename: rel })
    assert.ok(script.content, `${rel} script compiled`)
  }
  if (descriptor.template) {
    const template = compileTemplate({
      source: descriptor.template.content,
      filename: rel,
      id: rel,
    })
    assert.deepEqual(template.errors, [], `${rel} template compile errors`)
  }
}

function item(id, width, height, extra = {}) {
  return {
    id,
    mediaId: id,
    url: `https://cdn.example/${id}-m.jpg`,
    thumbnailUrl: `https://cdn.example/${id}-t.jpg`,
    largeUrl: `https://cdn.example/${id}-l.jpg`,
    originalUrl: `https://cdn.example/${id}.jpg`,
    width,
    height,
    aspectRatio: width / height,
    formats: {
      thumbnail: { url: `https://cdn.example/${id}-t.jpg`, width: 156, height: 104 },
      small: { url: `https://cdn.example/${id}-s.jpg`, width: 400, height: 267 },
      medium: { url: `https://cdn.example/${id}-m.jpg`, width: 750, height: 500 },
      large: { url: `https://cdn.example/${id}-l.jpg`, width: 1000, height: 667 },
    },
    ...extra,
  }
}

test('idle preview still uses first 3 media and keeps the real count', () => {
  const media = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 1600, 1000))
  const visible = stackVisibleMedia(media)
  assert.equal(STACK_VISIBLE_LIMIT, 3)
  assert.equal(visible.length, 3)
  assert.equal(visible[0].id, 'p0')
  assert.equal(visible[2].id, 'p2')
  assert.equal(stackPhotoCount(media, 8), 8)
  assert.equal(stackLayerKind(1), 'single')
  assert.equal(stackLayerKind(2), 'pair')
  assert.equal(stackLayerKind(3), 'stack')
  assert.equal(stackLayerKind(0), 'empty')
})

test('stack sources prefer thumbnail/small/medium and never original for archive previews', () => {
  const photo = item('cover', 2400, 1600)
  const front = stackLayerSource(photo, { layer: 'front', size: 'archive', dpr: 2 })
  const back = stackLayerSource(photo, { layer: 'back', size: 'archive', dpr: 2 })
  assert.ok(front?.url)
  assert.ok(back?.url)
  assert.notEqual(front.key, 'original')
  assert.notEqual(back.key, 'original')
  assert.notEqual(front.url, photo.originalUrl)
  assert.ok(['thumbnail', 'small', 'medium'].includes(back.key))
})

test('stack label and object-position stay photographic', () => {
  assert.equal(stackActivateLabel('Fun Time Last Gallery', 8), 'Open Fun Time Last Gallery, 8 photos')
  assert.equal(stackActivateLabel('Missing media', 0), 'Open Missing media')
  assert.equal(stackObjectPosition(item('wide', 1600, 1000)), 'center 40%')
  assert.equal(stackObjectPosition(item('tall', 800, 1200)), 'center 28%')
})

test('archive shelves group by Night, newest first, general last', () => {
  const shelves = groupArchiveShelves([
    nightRow(1, { title: 'Fun Time Last', city: 'Chicago', venue: 'The Rock', date: '2026-09-03', recapId: 88 }),
    nightRow(2, { title: 'After', city: 'Chicago', venue: 'The Rock', date: '2026-09-03', recapId: 88, visibility: 'show_attendees' }),
    nightRow(3, { title: 'Merch', city: 'Chicago', venue: 'The Rock', date: '2026-09-03', recapId: 88 }),
    nightRow(4, { title: 'Missing', city: 'Chicago', venue: 'The Rock', date: '2026-09-03', recapId: 88, photoCount: 0 }),
    nightRow(5, { title: 'Basement', city: 'Nashville', venue: 'The Basement East', date: '2026-08-24', recapId: 71 }),
    nightRow(6, { title: 'Old night', city: 'Denver', venue: 'Ogden', date: '2025-11-12', recapId: 40 }),
    nightRow(21, { title: 'Artist gallery', general: true }),
    nightRow(22, { title: 'Press photos', general: true, visibility: 'fan_list' }),
  ])
  assert.equal(shelves[0].kind, 'night')
  assert.match(shelves[0].kicker, /SEP 3/)
  assert.match(shelves[0].kicker, /CHICAGO/)
  assert.equal(shelves[0].venue, 'The Rock')
  assert.equal(shelves[0].galleries.length, 4)
  assert.equal(shelves[shelves.length - 1].kind, 'general')
  assert.equal(shelves[shelves.length - 1].kicker, 'GENERAL')
  assert.ok(shelves.some((shelf) => shelf.yearLabel === '2025'))
  assert.equal(nightShelfKicker({ date: '2026-08-24', city: 'Nashville' }), 'AUG 24 · NASHVILLE')
  assert.equal(nightShelfVenue({ venue: 'The Basement East' }), 'The Basement East')
})

test('visibility is human and drafts stay distinct', () => {
  assert.equal(archiveVisibilityLabel('show_attendees'), 'People who were there')
  assert.equal(archiveVisibilityLabel('fan_list'), 'Fans')
  assert.equal(archiveVisibilityLabel('public'), '')
  assert.equal(archiveVisibilityLabel('public', { quietPublic: false }), 'Public')
  assert.equal(isDraftGallery({ status: 'draft' }), true)
  assert.equal(isDraftGallery({ status: 'published' }), false)
  assert.equal(galleryTitle({ title: '', show: { city: 'Chicago' } }), 'Night gallery')
})

test('manage paths keep from=/galleries and send galleryId', () => {
  const path = manageGalleryPath({ slug: 'fun-time-last-gallery' }, 'therockers')
  assert.equal(path, '/therockers/gallery/fun-time-last-gallery?from=%2Fgalleries')
  const send = manageSendPath({
    id: 9,
    visibility: 'show_attendees',
    showRecapId: 88,
  })
  assert.equal(send.query.galleryId, '9')
  assert.equal(send.query.audienceType, 'show_attendees')
})

test('deck browses the full list with at most 3 layers and never mutates media', () => {
  const media = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 1600, 1000))
  const frozen = media.map((row) => row.id)
  const start = stackDeckPlan(media, 0)
  assert.equal(start.total, 8)
  assert.equal(start.front.id, 'p0')
  assert.equal(start.under.id, 'p1')
  assert.equal(start.depth.id, 'p2')
  assert.equal(start.canPrev, false)
  assert.equal(start.canNext, true)
  const mid = stackDeckPlan(media, 3)
  assert.equal(mid.front.id, 'p3')
  assert.equal(mid.under.id, 'p4')
  assert.equal(mid.canPrev, true)
  const last = stackDeckPlan(media, 7)
  assert.equal(last.front.id, 'p7')
  assert.equal(last.under.id, 'p6')
  assert.equal(last.canNext, false)
  assert.equal(stackVisibleLayers(media, 3).length, 3)
  assert.equal(stackBrowsableMedia(media).length, 8)
  assert.deepEqual(media.map((row) => row.id), frozen)
  assert.equal(media[0].id, 'p0')
})

test('index clamps, steps, and never wraps', () => {
  assert.equal(clampStackIndex(-2, 8), 0)
  assert.equal(clampStackIndex(99, 8), 7)
  assert.equal(clampStackIndex(2, 0), 0)
  assert.equal(stackStepIndex(0, 8, -1), 0)
  assert.equal(stackStepIndex(7, 8, 1), 7)
  assert.equal(stackStepIndex(2, 8, 1), 3)
  assert.equal(stackStepIndex(2, 2, 1), 1)
  const one = stackDeckPlan([item('only', 800, 1000)], 0)
  assert.equal(one.kind, 'single')
  assert.equal(one.under, null)
  const pair = stackDeckPlan([item('a', 800, 1000), item('b', 1200, 800)], 0)
  assert.equal(pair.kind, 'pair')
  assert.equal(pair.under.id, 'b')
  assert.equal(stackDeckPlan([], 3).kind, 'empty')
})

test('gesture axis, tap, elastic boundary, and commit stay finite', () => {
  assert.equal(stackGestureAxis(2, 2), null)
  assert.equal(stackGestureAxis(20, 4), 'x')
  assert.equal(stackGestureAxis(4, 20), 'y')
  assert.equal(stackIsTap(null, 2, 1), true)
  assert.equal(stackIsTap('x', 40, 2), false)
  assert.ok(Math.abs(stackElasticDrag(-80, { canPrev: false, canNext: false })) < 20)
  assert.equal(stackElasticDrag(-80, { canPrev: true, canNext: true }), -80)
  assert.equal(stackShouldCommit(-80, { canPrev: true, canNext: true, width: 320 }), 1)
  assert.equal(stackShouldCommit(80, { canPrev: true, canNext: true, width: 320 }), -1)
  assert.equal(stackShouldCommit(-80, { canPrev: false, canNext: false, width: 320 }), 0)
  assert.equal(stackShouldCommit(-20, { canPrev: true, canNext: true, width: 320 }), 0)
  assert.equal(stackShouldCommit(-40, { canPrev: true, canNext: true, width: 320, velocity: -0.8 }), 1)
})

test('activate payload uses the current index and mediaId without changing cover', () => {
  const media = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 1600, 1000))
  const payload = stackActivatePayload(media, 2)
  assert.equal(payload.index, 2)
  assert.equal(payload.mediaId, 'p2')
  assert.equal(payload.media.id, 'p2')
  assert.equal(media[0].id, 'p0')
  rememberStackIndex('g-1', 2)
  assert.equal(recalledStackIndex('g-1'), 2)
  assert.equal(recalledStackIndex('missing'), 0)
  rememberArchiveScroll('/galleries', 420)
  assert.equal(recalledArchiveScroll('/galleries'), 420)
})

test('selected-photo handoff uses history state and clamps authorized media', () => {
  const media = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 1600, 1000))
  const mid = manageGalleryLocation({ slug: 'lab-1', id: 1, media }, 'therockers', { index: 3 })
  assert.equal(mid.path, '/therockers/gallery/lab-1')
  assert.equal(mid.query.from, '/galleries')
  assert.equal(mid.query.photo, '4')
  assert.equal(mid.state.fqGalleryPhoto, 3)
  assert.ok(mid.state.fqGalleryPrint.startsWith('fq-gprint-'))
  assert.equal(readGalleryOpenIntent({ state: mid.state, media }).index, 3)
  assert.equal(readGalleryOpenIntent({ query: { photo: '1' }, media }).index, 0)
  assert.equal(readGalleryOpenIntent({ query: { photo: '8' }, media }).index, 7)
  assert.equal(readGalleryOpenIntent({ query: { photo: '99' }, media }).index, 7)
  assert.equal(readGalleryOpenIntent({ query: { photo: '0' }, media }).index, null)
  assert.equal(readGalleryOpenIntent({ state: { fqGalleryPhoto: 4 }, media: [] }).index, null)
  assert.equal(authorizedStackIndex(4, media), 4)
  assert.equal(stackPrintTransitionName(1, media[3]), 'fq-gprint-1-p3')
  assert.equal(stripNavFrom('/therockers/gallery/lab-1?from=/galleries&photo=4'), '/therockers/gallery/lab-1')
  assert.deepEqual(media.map((row) => row.id), Array.from({ length: 8 }, (_, i) => `p${i}`))
})

test('Public Night honors selected authorized index without mutating cover', () => {
  const media = Array.from({ length: 8 }, (_, i) => item(`p${i}`, 1600, 1000))
  const gallery = { slug: 'live-set', locked: false, media }
  assert.deepEqual(resolveNightGalleryOpen({ gallery, payload: { index: 0 } }), { index: 0, autoOpen: true })
  assert.deepEqual(resolveNightGalleryOpen({ gallery, payload: { index: 3 } }), { index: 3, autoOpen: true })
  assert.deepEqual(resolveNightGalleryOpen({ gallery, payload: { index: 7 } }), { index: 7, autoOpen: true })
  assert.deepEqual(resolveNightGalleryOpen({ gallery, payload: { index: 99 } }), { index: 7, autoOpen: true })
  assert.deepEqual(
    resolveNightGalleryOpen({ gallery, rememberedIndex: 4 }),
    { index: 4, autoOpen: false },
  )
  assert.deepEqual(
    resolveNightGalleryOpen({ gallery: { ...gallery, locked: true }, payload: { index: 3, mediaId: 'p3' } }),
    { index: null, autoOpen: false },
  )
  assert.deepEqual(
    resolveNightGalleryOpen({ gallery: { slug: 'empty', locked: false, media: [] }, payload: { index: 1 } }),
    { index: null, autoOpen: false },
  )
  assert.deepEqual(media.map((row) => row.id), Array.from({ length: 8 }, (_, i) => `p${i}`))
  const night = read('components/nights/PublicNightExperience.vue')
  const viewer = read('components/nights/NightGalleryViewer.vue')
  assert.match(night, /@activate="openGallery\(gallery, \$event\)"/)
  assert.match(night, /stackIndexes/)
  assert.match(night, /resolveNightGalleryOpen/)
  assert.doesNotMatch(night, /coverUrl\s*=/)
  assert.match(viewer, /autoOpenLightbox/)
  assert.match(viewer, /openAuthorizedLightbox\(props\.startIndex\)/)
  assert.match(viewer, /authorizedStackIndex/)
})

test('archive scroll restore prefers router savedPosition and only fills from session at top', () => {
  assert.deepEqual(
    archiveScrollRestorePlan({ currentY: 900, rememberedY: 900 }),
    { apply: false, y: 900, owner: 'router' },
  )
  assert.deepEqual(
    archiveScrollRestorePlan({ currentY: 0, rememberedY: 900 }),
    { apply: true, y: 900, owner: 'session' },
  )
  assert.deepEqual(
    archiveScrollRestorePlan({ currentY: 880, rememberedY: 900 }),
    { apply: false, y: 880, owner: 'router' },
  )
  assert.deepEqual(
    archiveScrollRestorePlan({ currentY: 0, rememberedY: 0 }),
    { apply: false, y: 0, owner: 'none' },
  )
  const router = read('app/router.options.ts')
  const scroll = read('utils/ui/appScrollBehavior.js')
  assert.match(router, /savedPosition/)
  assert.match(router, /recalledArchiveScroll/)
  assert.match(router, /isGalleryArchivePath/)
  assert.match(router, /resolveAppScrollPosition/)
  assert.match(scroll, /savedPosition\.top \|\| 0\) > 24/)
  assert.match(read('components/galleries/FaneqoGalleryArchive.vue'), /archiveScrollRestorePlan/)
})

test('shared lightbox current thumb is a near-white selection, not teal live chrome', () => {
  const lightbox = read('components/media/FaneqoMediaLightbox.vue')
  const current = lightbox.match(/\.fq-mlb__thumb\.is-current \{[\s\S]*?\}/)?.[0] || ''
  assert.match(lightbox, /:class="\{ 'is-current': thumbIndex === index \}"/)
  assert.match(current, /border-color: rgba\(255, 255, 255, 0\.88\)/)
  assert.match(current, /opacity: 1/)
  assert.doesNotMatch(current, /#39d5ff|#4ca6ff|gradient/i)
  assert.match(current, /box-shadow: none/)
})

test('stack primitive stays presentation-only', () => {
  const stack = read('components/media/FaneqoGalleryStack.vue')
  assert.doesNotMatch(stack, /messages\/compose|show-recaps|passport|delete/i)
  assert.doesNotMatch(stack, /useRouter|NuxtLink/)
  assert.doesNotMatch(stack, /nightTitle|youWereThere|showOrdinal|venue|Passport/)
  assert.match(stack, /prefers-reduced-motion/)
  assert.match(stack, /touch-action: pan-y/)
  assert.match(stack, /ArrowRight/)
  assert.match(stack, /stackActivatePayload/)
  assert.match(stack, /cursor: grab/)
  assert.match(stack, /is-dragging[\s\S]*cursor: grabbing/)
  assert.match(stack, /releasePointerCapture/)
  assert.match(stack, /is-opening/)
  assert.match(stack, /consumeStackHint/)
  assert.match(read('components/galleries/FaneqoGalleryArchive.vue'), /navigateGalleryOpen/)
  assert.match(read('utils/media/faneqoGalleryStack.js'), /Open \$\{name\}/)
})

test('archive page kills CMS filter chrome and keeps create / send', () => {
  const archive = read('components/galleries/FaneqoGalleryArchive.vue')
  const item = read('components/galleries/FaneqoGalleryArchiveItem.vue')
  const page = read('pages/galleries/index.vue')
  assert.match(archive, /Your Nights, in pictures/)
  assert.match(archive, /\+ Create gallery/)
  assert.doesNotMatch(archive, /Show galleries/)
  assert.doesNotMatch(archive, /linear-gradient\(90deg, #4ca6ff/)
  assert.doesNotMatch(page, /View<\/NuxtLink>/)
  assert.match(item, /Send to fans/)
  assert.match(item, /fq-gitem__sep/)
  assert.doesNotMatch(item, /Delete/)
  assert.doesNotMatch([archive, item, page].join('\n'), /show_attendees/)
})

test('touched archive SFCs compile', () => {
  compileSfc('components/media/FaneqoGalleryStack.vue')
  compileSfc('components/galleries/FaneqoNightShelf.vue')
  compileSfc('components/galleries/FaneqoGalleryArchiveItem.vue')
  compileSfc('components/galleries/FaneqoGalleryArchive.vue')
  compileSfc('pages/galleries/index.vue')
  compileSfc('pages/__dev/galleries-archive.vue')
  compileSfc('pages/__dev/gallery-open/[gallerySlug].vue')
  compileSfc('components/nights/PublicNightExperience.vue')
  compileSfc('components/nights/NightGalleryViewer.vue')
})

console.log(`test-faneqo-gallery-stack: ${passed} ok`)
