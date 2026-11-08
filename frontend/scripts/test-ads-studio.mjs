/**
 * Ads Studio V1 — access, privacy, stage ratio, and product isolation.
 * Run: node scripts/test-ads-studio.mjs
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canAccessAdsStudio } from '../utils/ads/access.js'
import { findAd } from '../features/ads/catalog.js'
import {
  AD_FORMATS,
  AD_POST_SAFE,
  AD_SAFE_ZONES,
  adFileName,
  formatSummary,
  gridCrop,
  gridSafeZone,
  resolveAdFormat,
  stageScale,
} from '../features/ads/formats.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (rel) => readFileSync(resolve(root, rel), 'utf8')

const library = read('pages/ads/index.vue')
const player = read('pages/ads/[slug].vue')
const stage = read('features/ads/AdStage.vue')
const ad = read('features/ads/YourBandDeservesMore.vue')
const staticAds = [
  read('features/ads/StopRentingYourAudience.vue'),
  read('features/ads/YourEntireMusicWorld.vue'),
  read('features/ads/StillUsingABasicLinkInBio.vue'),
]
const catalog = read('features/ads/catalog.js')
const registry = read('features/ads/registry.js')
const middleware = read('middleware/ads.ts')
const access = read('utils/ads/access.js')
const seo = read('server/middleware/seo-noindex.ts')
const nuxtConfig = read('nuxt.config.ts')
const formatsSource = read('features/ads/formats.js')
const musicWorld = read('features/ads/YourEntireMusicWorld.vue')
const deckIndex = read('corvana/decks/deckIndex.js')

assert.equal(canAccessAdsStudio('test@gmail.com', true), true)
assert.equal(canAccessAdsStudio('nick.tsoukas101@gmail.com', true), true)
assert.equal(canAccessAdsStudio('someone@example.com', true), false)
assert.equal(canAccessAdsStudio('nick.tsoukas101@gmail.com', false), true)
assert.equal(canAccessAdsStudio('test@gmail.com', false), false)
assert.equal(canAccessAdsStudio('someone@example.com', false), false)
assert.equal(canAccessAdsStudio('  Test@Gmail.com  ', true), true)
assert.equal(canAccessAdsStudio('', true), false)

assert.match(access, /test@gmail\.com/)
assert.match(access, /nick\.tsoukas101@gmail\.com/)

for (const source of [library, player]) {
  assert.match(source, /middleware:\s*\[[^\]]*'auth'[^\]]*'ads'/)
  assert.match(source, /layout:\s*false/)
}

assert.match(middleware, /statusCode:\s*404/)
assert.match(middleware, /fatal:\s*true/)
assert.match(middleware, /\/api\/users\/me/)
assert.match(middleware, /canAccessAdsStudio/)
assert.match(middleware, /import\.meta\.dev/)
assert.doesNotMatch(middleware, /if\s*\(\s*process\.server\s*\)\s*return/)
assert.doesNotMatch(middleware, /import\.meta\.server/)

assert.match(seo, /'\/ads'/)
assert.match(nuxtConfig, /'\/ads'/)
assert.match(nuxtConfig, /'\/ads\/\*\*'/)

assert.match(catalog, /your-band-deserves-more/)
assert.match(catalog, /Your Band Deserves More/)
assert.match(formatsSource, /9:16/)
assert.match(catalog, /Motion \/ Deck/)
assert.match(catalog, /sceneCount:\s*3/)
assert.equal((catalog.match(/slug:/g) || []).length, 5)
assert.equal(findAd('your-band-deserves-more')?.sceneCount, 3)
assert.equal(findAd('your-band-deserves-more')?.kind, 'Motion / Deck')
assert.deepEqual(findAd('your-band-deserves-more')?.formats, ['story'])
assert.equal(resolveAdFormat('feed', ['story']), 'story')
assert.equal(resolveAdFormat('feed', ['feed', 'story']), 'feed')
assert.equal(resolveAdFormat('story', ['feed', 'story']), 'story')
assert.equal(resolveAdFormat('', ['feed', 'story']), 'feed')
assert.equal(resolveAdFormat('square', ['feed', 'story']), 'feed')
assert.equal(resolveAdFormat('', ['post', 'feed', 'story']), 'post')
assert.equal(resolveAdFormat('post', ['feed', 'story']), 'feed')
assert.equal(resolveAdFormat('story', ['post', 'feed', 'story']), 'story')
assert.equal(formatSummary(['feed', 'story']), '4:5 · 9:16')
assert.equal(formatSummary(['post', 'feed', 'story']), '3:4 · 4:5 · 9:16')
assert.equal(AD_FORMATS.post.width, 1080)
assert.equal(AD_FORMATS.post.height, 1440)
assert.equal(AD_FORMATS.feed.width, 1080)
assert.equal(AD_FORMATS.feed.height, 1350)
assert.equal(AD_FORMATS.story.width, 1080)
assert.equal(AD_FORMATS.story.height, 1920)
assert.equal(AD_FORMATS.post.chip, 'Post · 3:4')
assert.equal(AD_FORMATS.feed.chip, 'Ad · 4:5')
assert.equal(AD_FORMATS.story.chip, 'Story · 9:16')
assert.match(AD_FORMATS.post.title, /Instagram Post — 3:4/)
assert.match(AD_FORMATS.feed.title, /Feed Ad — 4:5/)
assert.match(AD_FORMATS.story.title, /Story — 9:16/)

// Current Instagram grid: centered ~3:4 thumbnail, not a square.
assert.deepEqual(gridCrop('post'), { top: 0, bottom: 0, left: 0, right: 0 })
assert.deepEqual(gridCrop('feed'), { top: 0, bottom: 0, left: 34, right: 34 })
assert.deepEqual(gridCrop('story'), { top: 240, bottom: 240, left: 0, right: 0 })
assert.deepEqual(gridSafeZone('post'), { top: 80, bottom: 80, left: 80, right: 80 })
assert.deepEqual(gridSafeZone('feed'), { top: 80, bottom: 80, left: 114, right: 114 })
assert.doesNotMatch(formatsSource, /AD_GRID_CROP|top: 135/)

assert.equal(
  adFileName(findAd('artist-spotlight'), 'post'),
  'badflower-artist-spotlight-instagram-post.png',
)
assert.equal(adFileName(findAd('artist-spotlight'), 'feed'), 'badflower-artist-spotlight-feed-ad.png')
assert.equal(adFileName(findAd('artist-spotlight'), 'story'), 'badflower-artist-spotlight-story.png')
assert.equal(adFileName(findAd('stop-renting-your-audience'), 'feed'), 'stop-renting-your-audience-feed-ad.png')
assert.equal(adFileName(findAd('your-band-deserves-more'), 'story', 2), 'your-band-deserves-more-scene-2-story.png')
assert.equal(stageScale(1080, 1920, 1080, 1920), 1)
assert.equal(stageScale(540, 960, 1080, 1920), 0.5)
assert.equal(stageScale(1080, 1350, 1080, 1350), 1)
assert.equal(stageScale(500, 800, 1080, 1350), 500 / 1080)
assert.equal(stageScale(2000, 2000, 1080, 1920), 2000 / 1920)
assert.ok(AD_SAFE_ZONES.story.top > 0)
assert.ok(AD_SAFE_ZONES.story.bottom > 0)
assert.deepEqual(AD_POST_SAFE, { top: 80, bottom: 80, side: 80 })
assert.equal(AD_SAFE_ZONES.feed, AD_POST_SAFE)
assert.equal(AD_SAFE_ZONES.post, AD_POST_SAFE)

for (const slug of [
  'stop-renting-your-audience',
  'your-entire-music-world',
  'still-using-a-basic-link-in-bio',
]) {
  const entry = findAd(slug)
  assert.deepEqual(entry?.formats, ['feed', 'story'])
  assert.equal(entry?.kind, 'Static / Image')
  assert.equal(entry?.sceneCount, 1)
  assert.match(registry, new RegExp(slug))
}

assert.deepEqual(findAd('artist-spotlight')?.formats, ['post', 'feed', 'story'])
assert.equal(findAd('artist-spotlight')?.subject, 'badflower')
assert.equal(findAd('artist-spotlight')?.kind, 'Static / Image')
assert.match(registry, /artist-spotlight/)
const spotlight = read('features/ads/templates/ArtistSpotlight.vue')
const spotlightPost = read('features/ads/ArtistSpotlightBadflower.vue')
assert.match(spotlight, /seriesLabel|post\.seriesLabel/)
assert.match(spotlight, /headlineAccent|post\.headlineAccent/)
assert.match(spotlight, /footerWebsite|post\.footerWebsite/)
assert.doesNotMatch(spotlight, /BADFLOWER/)
assert.match(spotlightPost, /artistSpotlightBadflower/)
assert.match(spotlight, /width:\s*1080px/)
assert.match(spotlight, /height:\s*1350px/)
assert.match(spotlight, /height:\s*1440px/)
assert.match(spotlight, /height:\s*1920px/)
assert.match(spotlight, /AD_SAFE_ZONES/)
for (const key of ['post', 'feed', 'story']) assert.match(spotlight, new RegExp(`${key}: \\{`))
assert.doesNotMatch(spotlight + spotlightPost, /fetchBandBySlug/)
assert.doesNotMatch(spotlight + spotlightPost, /<audio|<a[\s>]/)

assert.match(library, /sceneLabel/)
assert.match(library, /adComponentFor/)
assert.match(library, /formatSummary/)
assert.match(library, /boardFor/)
assert.match(library, /resolveAdFormat/)
assert.match(library, /aspectRatio/)
assert.match(player, /adComponentFor/)
assert.match(player, /sceneCount > 1/)
assert.match(player, /number > sceneCount/)
assert.match(player, /AD_FORMAT_ORDER/)
assert.match(player, /No \$\{option\.ratio\} composition/)
assert.match(player, /gridCrop/)
assert.match(player, /gridSafeZone/)
assert.doesNotMatch(player, /AD_GRID_CROP/)
assert.match(stage, /frame/)
assert.match(stage, /mask\.left/)
assert.match(player, /preview === 'feed'/)
assert.match(player, /preview === 'grid'/)
assert.match(player, /query\.format/)
assert.match(player, /resolveAdFormat/)
assert.match(player, /clean\.value \|\| !guidesOn\.value/)
assert.equal(findAd('missing-ad'), null)

// Download PNG: browser render of a 1:1 off-screen copy, exact size, creative only.
const exporter = read('features/ads/exportPng.js')
assert.match(player, /Download PNG/)
assert.match(player, /renderNodeToPng/)
assert.match(player, /savePngBlob/)
assert.match(player, /pngDimensions/)
assert.match(player, /adFileName/)
assert.match(player, /class="ad-export"/)
assert.match(player, /v-if="exporting"/)
assert.match(exporter, /foreignObject/)
assert.match(exporter, /fonts\.googleapis\.com\/css2\?family=Poppins/)
assert.match(exporter, /canvas\.toBlob/)
assert.match(exporter, /XMLSerializer/)
assert.doesNotMatch(exporter, /\$fetch|useFetch|\/api\//)

assert.match(formatsSource, /width: 1080/)
assert.match(formatsSource, /height: 1440/)
assert.match(formatsSource, /height: 1350/)
assert.match(formatsSource, /height: 1920/)
assert.match(stage, /stageScale/)
assert.match(stage, /scale\(\$\{scale\.value\}\)/)
assert.match(stage, /props\.width \* scale\.value/)
assert.match(stage, /props\.height \* scale\.value/)
assert.match(stage, /v-if="guides"/)
assert.match(stage, /v-if="mask"/)

assert.match(player, /position:\s*fixed/)
assert.match(player, /inset:\s*0/)
assert.match(player, /overflow:\s*hidden/)
assert.match(player, /ArrowLeft/)
assert.match(player, /ArrowRight/)
assert.match(player, /Escape/)
assert.match(player, /requestFullscreen/)
assert.match(player, /fullscreenchange/)
assert.match(player, /query\.scene/)
assert.doesNotMatch(player, /overlayScrollLock|lockOverlayScroll/)

assert.match(ad, /FALLBACK_SNAPSHOT/)
assert.match(ad, /inert/)
assert.match(ad, /prefers-reduced-motion/)
assert.match(ad, /450ms/)
assert.doesNotMatch(ad, /BandPageCybered|ArtistPageActions/)
assert.doesNotMatch(ad, /fetchBandBySlug/)
assert.doesNotMatch(ad, /trackPageView/)
assert.doesNotMatch(ad, /embed\/artist-page/)
assert.doesNotMatch(ad, /FollowArtistSheet/)
assert.doesNotMatch(ad, /@follow|@message|@play-song|@link-click/)
assert.doesNotMatch(ad, /<audio|<a[\s>]/)

for (const source of staticAds) {
  assert.match(source, /width:\s*1080px/)
  assert.match(source, /height:\s*1920px/)
  assert.match(source, /height:\s*1350px/)
  assert.match(source, /is-feed/)
  assert.match(source, /format/)
  assert.doesNotMatch(source, /fetchBandBySlug/)
  assert.doesNotMatch(source, /trackPageView/)
  assert.doesNotMatch(source, /embed\/artist-page/)
  assert.doesNotMatch(source, /FollowArtistSheet/)
  assert.doesNotMatch(source, /<audio|<a[\s>]/)
  assert.doesNotMatch(source, /flagshipDeck_elite|FaneqoIndustryDeckSlide|deckIndex|VerticalDeckFrame|spotify-first/)
}

assert.doesNotMatch(musicWorld, /gallery__/)
assert.match(musicWorld, /Fan list/)
assert.match(musicWorld, /faneqo\.com/)
assert.match(ad, /format/)
assert.doesNotMatch(ad, /height:\s*1350px/)

const adsSources = [library, player, stage, ad, ...staticAds, catalog, registry, middleware, access].join('\n')
assert.doesNotMatch(adsSources, /flagshipDeck_elite|FaneqoIndustryDeckSlide|deckIndex|VerticalDeckFrame|spotify-first/)
assert.doesNotMatch(deckIndex, /your-band-deserves-more|features\/ads/)

const exportPage = read('pages/__dev/ads-export.vue')
assert.match(exportPage, /import\.meta\.dev/)
assert.match(exportPage, /statusCode: 404/)
assert.match(exportPage, /layout: false/)
assert.match(exportPage, /Creative/)
assert.doesNotMatch(exportPage, /<a[\s>]/)

const capture = read('scripts/capture-ads.mjs')
assert.match(capture, /1080/)
assert.match(capture, /1440/)
assert.match(capture, /1350/)
assert.match(capture, /1920/)
assert.match(capture, /artist-spotlight', formats: \['post', 'feed', 'story'\]/)
const downloadTest = read('scripts/test-ads-download.mjs')
assert.match(downloadTest, /Download PNG/)
assert.match(downloadTest, /waitForEvent\('download'/)
assert.match(downloadTest, /readUInt32BE\(16\)/)
assert.match(capture, /your-entire-music-world/)
assert.match(capture, /stop-renting-your-audience/)
assert.match(capture, /still-using-a-basic-link-in-bio/)
assert.match(capture, /scale: 'css'/)

console.log('ads studio: ok')
