/**
 * Artist Show Recap Night experience.
 * Run: node scripts/test-artist-recap-night-ui.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import {
  galleriesForRecap,
  galleryAudienceLabel,
  lineupBillingTier,
  lineupRoleLabel,
  mergeArtistNight,
  recapEventArtworkUrl,
  recapHeroPlan,
  recapHeroUrl,
  recapIdentityLine,
  recapNightCoverUrl,
  recapNightHeroUrl,
  recapStatStrip,
  recapSummaryLine,
} from '../utils/nights/artistRecap.js'

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
    compileScript(descriptor, { id: rel, filename: rel })
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

test('media roles stay artist / event / night', () => {
  const artist = { band: { bandImg: { url: '/band.jpg' } } }
  const night = { coverImage: { url: '/night.jpg' } }
  const event = { eventImageUrl: '/event.jpg' }
  const hero = { heroImage: { url: '/hero.jpg' }, heroFocalX: 22, heroFocalY: 70 }
  assert.equal(recapNightCoverUrl({ ...night, showCoverUrl: '/event.jpg' }), '/night.jpg')
  assert.equal(recapEventArtworkUrl({ ...night, showCoverUrl: '/event.jpg' }), '')
  assert.equal(recapEventArtworkUrl({ showCoverUrl: '/event.jpg' }), '/event.jpg')
  assert.equal(recapHeroPlan(artist, '').mode, 'artist')
  assert.equal(recapHeroPlan(artist, '').source, 'artist')
  assert.equal(recapHeroPlan(artist, '').backdropUrl, '/band.jpg')
  assert.equal(recapHeroPlan(artist, '').hasNightHero, false)
  assert.equal(recapHeroPlan({ ...artist, ...event }, '').mode, 'artist-event')
  assert.equal(recapHeroPlan({ ...artist, ...night }, '').hasMemory, true)
  assert.equal(recapHeroPlan({ ...artist, ...night }, '').eventUrl, '')
  assert.equal(recapHeroPlan({ ...artist, ...event, ...night }, '').mode, 'artist-event')
  assert.equal(recapHeroPlan(event, '').mode, 'event')
  assert.equal(recapHeroPlan(night, '').mode, 'type')
  assert.equal(recapHeroPlan(night, '').hasMemory, true)
  assert.equal(recapHeroPlan({}, '').mode, 'type')
  assert.equal(recapHeroUrl({ ...night, ...event }, '/band.jpg'), '/night.jpg')
  const withHero = recapHeroPlan({ ...artist, ...event, ...night, ...hero }, '')
  assert.equal(withHero.source, 'night-hero')
  assert.equal(withHero.backdropUrl, '/hero.jpg')
  assert.equal(withHero.heroUrl, '/hero.jpg')
  assert.equal(withHero.nightUrl, '/night.jpg')
  assert.equal(withHero.eventUrl, '/event.jpg')
  assert.equal(withHero.heroFocalX, 22)
  assert.equal(withHero.heroFocalY, 70)
  assert.equal(withHero.hasMemory, true)
  assert.equal(withHero.artistIsAtmosphere, false)
  assert.equal(recapNightHeroUrl({ hero: { url: '/from-night.json' } }), '/from-night.json')
  assert.equal(recapHeroPlan({ ...artist, ...hero }, '').nightUrl, '')
  const page = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(page, /recapHeroPlan/)
  assert.match(page, /ar__poster/)
  assert.match(page, /ar__memory/)
  assert.match(page, /ar__memory-btn/)
  assert.match(page, /Night poster/)
  assert.match(page, /View poster/)
  assert.match(page, /Edit image/)
  assert.match(page, /hasNightHero/)
  assert.match(page, /getArtistFocalStyle/)
  assert.match(page, /heroPaintReady/)
  assert.doesNotMatch(page, /empty gray|placeholder card/)
})

test('galleries attached to the recap appear in From the night', () => {
  const recap = { id: 88, campaignId: 'cmp_1' }
  const rows = [
    { id: 1, showRecapId: 88, title: 'Live set', status: 'published' },
    { id: 2, showRecapId: 99, title: 'Other show', status: 'published' },
    { id: 3, campaignId: 'cmp_1', title: 'Legacy attach', status: 'published' },
  ]
  const found = galleriesForRecap(rows, recap)
  assert.equal(found.length, 2)
  assert.equal(galleryAudienceLabel('show_attendees'), 'People who were there')
  assert.equal(galleryAudienceLabel('public'), 'Public')
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(ui, /From the night/)
  assert.match(ui, /galleriesForRecap/)
  assert.match(ui, /Add photos/)
  assert.match(ui, /ImagePlus/)
  assert.match(ui, /buildSharePhotosPath/)
  assert.match(ui, /FaneqoGalleryStack/)
  assert.match(ui, /galleryCanStack/)
  assert.match(ui, /item\?\.url \|\| item\?\.largeUrl \|\| item\?\.thumbnailUrl/)
  assert.match(ui, /@activate="openGallery\(gallery, \$event\)"/)
  assert.match(ui, /\.ar__gallery\.is-stack/)
  assert.match(ui, /padding: 0\.85rem 1\.25rem 1\.05rem/)
  assert.match(ui, /resolveNightGalleryOpen/)
  assert.match(ui, /:start-index="activeGalleryStartIndex"/)
  assert.match(ui, /:auto-open-lightbox="activeGalleryAutoOpen"/)
  assert.match(ui, /galleryAudienceLabel/)
  assert.match(ui, /await router\.push\(\{ query \}\)/)
  assert.match(read('pages/__dev/artist-recap.vue'), /galleryLabConcertPrints\(8\)/)
})

test('Night editing uses human labels and existing enrichment endpoint', () => {
  const editor = read('components/nights/ArtistRecapNightEditor.vue')
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const api = read('composables/useShowRecaps.js')
  const template = editor.slice(0, editor.indexOf('<script'))
  assert.match(template, /Story for fans/)
  assert.match(template, /Private band note/)
  assert.match(template, /Only your team can see this/)
  assert.match(template, /Hero image/)
  assert.match(template, /How this Night opens/)
  assert.match(template, /Using artist image/)
  assert.match(template, /Upload hero/)
  assert.match(template, /Change hero/)
  assert.match(template, /Adjust position/)
  assert.match(template, /Use artist image/)
  assert.match(template, /Night photo/)
  assert.match(template, /A photo from this Night/)
  assert.match(template, /memory image, not the page hero/)
  assert.match(template, /Add a Night photo/)
  assert.match(template, /Add to lineup/)
  assert.match(template, /ne__file/)
  assert.doesNotMatch(template, /What fans will see for this night/)
  assert.doesNotMatch(template, /Choose File|No file chosen/)
  assert.doesNotMatch(template, /publicStory|privateArtistNote|coverMediaId|heroMediaId/)
  assert.match(editor, /heroMediaId: item.mediaId/)
  assert.match(editor, /heroMediaId: null/)
  assert.match(editor, /useMediaUploadQueue/)
  assert.match(editor, /mode="night-hero"/)
  assert.match(editor, /localOnly/)
  assert.match(editor, /coverPreviewSrc/)
  assert.match(ui, /:local-only="usesLocalGalleries"/)
  assert.match(api, /\/api\/show-recaps\/\$\{id\}\/night/)
  assert.match(api, /method: 'PATCH'/)
})

test('private note stays artist-only in the recap UI', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const night = read('components/nights/PublicNightExperience.vue')
  assert.match(ui, /privateNote/)
  assert.match(ui, /Only your team can see this/)
  assert.doesNotMatch(night, /privateArtistNote/)
})

test('metrics are a compact strip and insights stay collapsed', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(ui, /recapStatStrip/)
  assert.match(ui, /Show insights/)
  assert.match(ui, /Attendance, engagement and fan activity/)
  assert.match(ui, /View insights/)
  assert.match(ui, /ArtistRecapInsightsSheet/)
  assert.doesNotMatch(ui, /<details class="ar__copy ar__insights">/)
  assert.doesNotMatch(ui, /Fans Captured/)
  assert.doesNotMatch(ui, /Here's what this show produced/)
  assert.deepEqual(recapStatStrip({ checkedIn: 2, newFans: 2, interactions: 16 }), [
    { value: 2, label: 'were there' },
    { value: 2, label: 'new fans' },
    { value: 16, label: 'interactions' },
  ])
  assert.equal(recapIdentityLine({
    venue: 'The Rock',
    city: 'Chicago',
    date: 'September 4, 2026',
  }), 'The Rock · Chicago · September 4, 2026')
  assert.equal(recapSummaryLine({ checkedIn: 147, newFans: 42, returning: 19 }), '147 were there · 42 new · 19 returning')
})

test('top-fan emails are not the main Night surface', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const sheet = read('components/nights/ArtistRecapInsightsSheet.vue')
  assert.doesNotMatch(ui, /fan\.email/)
  assert.match(sheet, /People from this show/)
  assert.doesNotMatch(sheet, /fan\.email/)
})

test('Share uses the existing kit and the public Night URL', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const share = read('components/nights/NightShareSheet.vue')
  const page = read('pages/fans/recaps/[id].vue')
  assert.match(ui, /Share Night/)
  assert.match(ui, /Preview fan view/)
  assert.doesNotMatch(ui, /Open Night/)
  assert.match(ui, /nightPathFromRecap/)
  assert.match(ui, /nightPreviewHref/)
  assert.match(ui, /withSafeFrom/)
  assert.match(ui, /NightShareSheet/)
  assert.match(share, /useShareKit/)
  assert.match(share, /Share this night/)
  assert.match(page, /Share Night/)
  assert.match(page, /ar-page__chrome/)
  assert.match(page, /ArrowLeft/)
  assert.match(page, /Share2/)
  assert.doesNotMatch(page, /← Dashboard/)
})

test('mobile gallery is a snap rail and desktop stays two-up', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  assert.match(ui, /scroll-snap-type: x mandatory/)
  assert.match(ui, /80vw/)
  assert.match(ui, /scroll-padding-inline: 1\.25rem/)
  assert.match(ui, /padding-right: max\(1\.25rem/)
  assert.match(ui, /grid-template-columns: 1fr 1fr/)
  assert.match(ui, /Keep the room with you/)
  assert.match(ui, /Reach the people who were there/)
  assert.match(ui, /while the Night is still fresh/)
  assert.match(ui, /View sent messages →/)
  assert.match(ui, /ar__after-copy/)
  assert.match(ui, /grid-template-columns: minmax\(0, 1fr\) auto/)
  assert.match(ui, /Who shared the stage/)
  assert.match(ui, /Give fans the memory behind the photos/)
  assert.match(ui, /NightRecordingManager/)
  assert.match(ui, /Tell the story of this Night/)
  assert.match(ui, /Edit story/)
  assert.match(ui, /Edit lineup/)
  assert.match(ui, /Add the artists who were part of this Night/)
  assert.match(ui, /ImagePlus/)
  assert.match(ui, /MessageCircle/)
  assert.match(ui, /BarChart3/)
  assert.match(ui, /ar__action/)
  assert.doesNotMatch(ui, /Add something fans can come back to/)
})

test('Recap hero uses the existing artist image presentation helper', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const share = read('components/nights/NightShareSheet.vue')
  const helper = read('utils/media/artistImage.js')
  const sheet = read('components/nights/ArtistImagePositionSheet.vue')
  const editor = read('components/bands/FaneqoArtistImageEditor.vue')
  assert.match(ui, /resolveArtistImagePresentation/)
  assert.match(ui, /readArtistImageFraming/)
  assert.match(ui, /readBandArtistImageContract/)
  assert.match(ui, /cyberedImagePositionX/)
  assert.match(ui, /layoutConfig/)
  assert.match(ui, /Adjust artist image/)
  assert.match(ui, /Adjust Night hero/)
  assert.match(ui, /ArtistImagePositionSheet/)
  assert.match(ui, /saveNightHeroPosition/)
  assert.match(ui, /saveArtistPosition/)
  assert.match(ui, /updateNight/)
  assert.match(ui, /object-fit: contain/)
  assert.doesNotMatch(ui, /object-position: 50% 22%/)
  assert.doesNotMatch(ui, /recapFocal|nightArtistPosition|mobileRecapCrop/)
  assert.doesNotMatch(helper, /recapFocal|nightArtistPosition/)
  assert.match(sheet, /BandsFaneqoArtistImageEditor/)
  assert.match(sheet, /mode === 'night-hero'/)
  assert.match(sheet, /This changes how your artist image is positioned across Faneqo/)
  assert.match(sheet, /This frames this Night only/)
  assert.match(editor, /Drag the preview to frame your photo/)
  assert.match(editor, /variant === 'night-hero'/)
  assert.match(editor, /v-if="!isNightHero"/)
  assert.match(share, /ns__media-photo/)
  assert.match(share, /object-fit: contain/)
})

test('gallery opens in-night and keeps the canonical path for share', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const viewer = read('components/nights/NightGalleryViewer.vue')
  assert.match(ui, /NightGalleryViewer/)
  assert.match(ui, /query\.gallery/)
  assert.match(viewer, /FaneqoMediaGrid/)
  assert.match(viewer, /FaneqoMediaLightbox/)
})

test('merge keeps private note off accidental public overwrite', () => {
  const next = mergeArtistNight(
    { publicStory: 'A', privateArtistNote: 'secret', venue: 'X', heroImage: { url: '/old.jpg' }, heroFocalX: 10 },
    { publicStory: 'B', cover: { url: '/n.jpg' }, hero: { url: '/hero.jpg' }, heroFocalX: 33, heroFocalY: 80 },
  )
  assert.equal(next.publicStory, 'B')
  assert.equal(next.privateArtistNote, 'secret')
  assert.equal(next.hero.url, '/hero.jpg')
  assert.equal(next.heroImage.url, '/hero.jpg')
  assert.equal(next.heroFocalX, 33)
  assert.equal(next.heroFocalY, 80)
  const cleared = mergeArtistNight(
    { heroImage: { url: '/hero.jpg' }, heroFocalX: 22, coverImage: { url: '/night.jpg' } },
    { hero: null, heroFocalX: 50, heroFocalY: 50 },
  )
  assert.equal(cleared.hero, null)
  assert.equal(cleared.heroImage, null)
  assert.equal(cleared.coverImage.url, '/night.jpg')
})

test('Night Hero and artist fallback keep separate save targets', () => {
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const editor = read('components/nights/ArtistRecapNightEditor.vue')
  const night = read('components/nights/PublicNightExperience.vue')
  const gallery = read('components/nights/NightGalleryViewer.vue')
  assert.match(ui, /heroFocalX: next.positionX/)
  assert.match(ui, /\/api\/bands\/\$\{bandId\}/)
  assert.match(ui, /method: 'PUT'/)
  assert.match(editor, /heroMediaId: null/)
  assert.match(editor, /heroFocalX: next.positionX/)
  assert.doesNotMatch(editor, /\/api\/bands\//)
  assert.match(editor, /if \(props.localOnly\)/)
  assert.doesNotMatch(night, /heroMediaId|saveNightHeroPosition/)
  assert.doesNotMatch(gallery, /heroMediaId|Hero image/)
  const css = editor.slice(editor.indexOf('<style'))
  assert.match(css, /height: 11rem/)
  assert.match(css, /min-height: 44px/)
  assert.match(css, /\.ne__scroll/)
})

test('lineup is compact Night context, not a table', () => {
  assert.equal(lineupBillingTier('headliner'), 'top')
  assert.equal(lineupBillingTier('co_headliner'), 'top')
  assert.equal(lineupBillingTier('direct_support'), 'mid')
  assert.equal(lineupBillingTier('support'), 'support')
  assert.equal(lineupBillingTier('opener'), 'support')
  assert.equal(lineupBillingTier('guest'), 'support')
  assert.equal(lineupBillingTier('other'), 'support')
  assert.equal(lineupBillingTier(''), 'support')
  assert.equal(lineupRoleLabel('co_headliner'), 'Co-headliner')
  const ui = read('components/dashboard/fans/ShowRecapDetailContent.vue')
  const css = ui.slice(ui.indexOf('<style'))
  const compact = read('components/nights/PublicNightLineup.vue')
  assert.match(ui, /PublicNightLineup/)
  assert.match(ui, /Who shared the stage/)
  assert.match(ui, /Edit lineup/)
  assert.match(compact, /pnl__act/)
  assert.match(compact, /heading/)
  assert.match(css, /--ar-kicker-size: 0\.875rem/)
  assert.match(css, /--ar-body-size: 1\.125rem/)
  assert.match(css, /--ar-small-size: 0\.9375rem/)
  assert.match(css, /max-width: 42rem/)
  assert.match(css, /max-width: 44rem/)
  assert.doesNotMatch(ui, /lineupBillingTier|ar__billing|is-top/)
  assert.doesNotMatch(css, /display:\s*table/)
})

test('SFC sanity', () => {
  compileSfc('pages/fans/recaps/[id].vue')
  compileSfc('components/dashboard/fans/ShowRecapDetailContent.vue')
  compileSfc('components/nights/ArtistRecapNightEditor.vue')
  compileSfc('pages/__dev/artist-recap.vue')
  compileSfc('components/nights/NightGalleryViewer.vue')
  compileSfc('components/nights/NightShareSheet.vue')
  compileSfc('components/nights/ArtistRecapInsightsSheet.vue')
  compileSfc('components/nights/ArtistImagePositionSheet.vue')
  compileSfc('components/nights/NightRecordingManager.vue')
})

console.log(`test-artist-recap-night-ui: ${passed} ok`)
